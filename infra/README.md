# Aito Auto — AWS infrastructure

Terraform for the production deployment: the Next.js website and the Strapi CMS.
Everything runs on CloudFront + S3 + API Gateway + Lambda + ACM, with RDS behind
the CMS.

## Architecture

```
                    ┌──────────────────────── aitoauto.fi
                    │
              CloudFront
                    ├── /_next/static/*  → S3 (assets)   cached forever
                    ├── /uploads/*       → S3 (media)    cached forever
                    └── everything else  → API Gateway → Lambda  (Next.js SSR)

                    ┌──────────────────────── cms.aitoauto.fi
                    │
              CloudFront
                    ├── /admin/*.js|.css → cached at the edge
                    └── everything else  → API Gateway → Lambda  (Strapi)
                                                            ├── RDS PostgreSQL
                                                            └── S3 media
```

Both functions run their normal Node server unmodified, via the **AWS Lambda Web
Adapter** — no AWS-specific application code. ACM issues one certificate in
`us-east-1` covering both hostnames.

### Why both apps are on Lambda, and what it costs you

Fargate was the first design for Strapi. It was dropped on cost:

| | Fargate | Lambda |
|---|---|---|
| Compute | $20.73 (0.5 vCPU / 1 GB, 24/7) | ~$0.40 (20k req, 600 ms, 2 GB) |
| Load balancer | $19.40 (ALB) | $0 (API Gateway, ~$0.02) |
| NAT gateway | $35.00 (needed to pull from ECR) | $0 (S3 gateway endpoint is free) |
| **Total** | **~$75/mo** | **~$0.45/mo** |

**The trade-off is cold starts.** Strapi boots in ~5 s on a warm laptop; on an
idle Lambda expect **10–20 s** on the first admin request, then fast responses
while the environment stays warm (roughly 5–15 min). For a dealership CMS edited
a few times a day this is a fair trade for $75/month. It would not be if editors
were in it all day.

Mitigations already in place:
- `cms_memory` is 2048 MB — above the ~1769 MB line where a function gets a full
  vCPU, which is the single biggest lever on boot time.
- The admin's JS/CSS is cached at the edge, so most admin page loads never reach
  the function.
- `AWS_LWA_READINESS_CHECK_PATH=/_health` stops the adapter forwarding traffic
  before Strapi is listening.

If cold starts become unacceptable, the honest fixes are provisioned concurrency
(~$50/mo at 2 GB, which removes the cost advantage) or moving back to Fargate.

### Why the website is not a static S3 site

`next.config.ts` sets `output: 'standalone'`, and the app uses on-demand
revalidation (`/api/revalidate`, which Strapi pings after every content change)
plus dynamic car routes. A static export would break both.

## Prerequisites

Neither is installed on this machine yet.

**Terraform.** Homebrew currently fails here because the Xcode Command Line
Tools are out of date. Either fix those:

```bash
sudo rm -rf /Library/Developer/CommandLineTools && sudo xcode-select --install
```

then `brew install hashicorp/tap/terraform` — or download the binary directly
from <https://developer.hashicorp.com/terraform/install>.

**AWS CLI.** Installed but broken: its Homebrew Python has a bad `pyexpat`
link, so every command fails with a `dlopen` error. Repair with:

```bash
brew reinstall awscli
aws sts get-caller-identity --profile thavisha
```

Docker is also needed, to build the Strapi image.

## Before the first apply

**1. Add the S3 upload provider to the backend.** Strapi still uses the local
provider, which writes to a disk a Lambda execution environment discards. The
infrastructure creates the bucket and grants the role; the backend must be told
to use it:

```bash
npm --prefix backend install @strapi/provider-upload-aws-s3
```

and in `backend/config/plugins.ts`:

```ts
upload: {
  config: {
    provider: 'aws-s3',
    providerOptions: {
      baseUrl: env('CDN_URL'),
      s3Options: {
        region: env('AWS_REGION'),
        params: { Bucket: env('AWS_BUCKET') },
      },
    },
  },
},
```

Credentials come from the execution role — do not add access keys. `AWS_REGION`
is set by the Lambda runtime automatically.

**2. Set a region on the profile** (it has none):

```bash
aws configure set region eu-north-1 --profile thavisha
```

**3. Decide on DNS.** With the hostnames in Route 53, set `route53_zone_id` and
Terraform handles validation and alias records. Otherwise leave it empty and
create the records from the `acm_validation_records` and `dns_records_to_create`
outputs — **the apply blocks until the certificate validates**, so expect to
apply, create records, then apply again.

## First deploy

The CMS Lambda cannot be created from an empty ECR repository, so the repo and
the image come first.

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # then edit
terraform init

# 1. Create just the registry.
terraform apply -target=aws_ecr_repository.cms

# 2. Push an image into it.
cd .. && ./scripts/deploy-cms.sh   # fails at the last step; the push is what matters

# 3. Build the website bundle the SSR Lambda is created from.
SITE_DOMAIN=aitoauto.fi CMS_DOMAIN=cms.aitoauto.fi ./scripts/build-frontend-lambda.sh

# 4. Everything else.
cd infra && terraform apply
```

Roughly 20–30 minutes, almost all of it RDS and the two CloudFront
distributions. Then publish the website content and create the first admin user
at `https://cms.aitoauto.fi/admin`:

```bash
./scripts/deploy-frontend.sh
```

## Day-to-day

| Task | Command |
|---|---|
| Ship website changes | `scripts/build-frontend-lambda.sh && scripts/deploy-frontend.sh` |
| Ship CMS changes | `scripts/deploy-cms.sh` |
| Tail CMS logs | `aws logs tail /aws/lambda/aito-auto-prod-cms --follow` |
| Tail SSR logs | `aws logs tail /aws/lambda/aito-auto-prod-ssr --follow` |
| Read generated secrets | `aws secretsmanager get-secret-value --secret-id aito-auto-prod/cms` |

The database sits in private subnets with no public route. To reach it, open a
port-forward through SSM from a bastion, or temporarily set
`publicly_accessible` — do not leave it public.

## Notes on state

State is local by default. Before anyone else touches this, move it to S3:
create a bucket, uncomment the `backend "s3"` block in `versions.tf`, then run
`terraform init -migrate-state`.

Secrets are generated by `random_password` and therefore **stored in the state
file** — which is the normal Terraform trade-off, and another reason to move
state into an encrypted bucket rather than leaving it on a laptop.

## Cost

Rough monthly estimate in `eu-north-1` at low traffic:

| | |
|---|---|
| RDS db.t4g.micro + 20 GB gp3 | ~$15 (free tier for year one) |
| CloudFront + S3 + API Gateway + both Lambdas | ~$3 |
| Secrets Manager, ECR, logs | ~$2 |
| **Total** | **~$20/month**, or ~$5 during the RDS free-tier year |

`enable_nat_gateway` is **off**. Turning it on adds ~$35/month and is only
needed if something in a private subnet must reach the public internet.

## Teardown

`db_deletion_protection = true` by default, so `terraform destroy` refuses to
drop the database until you flip it. A final snapshot is always taken.
