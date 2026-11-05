# ---------------------------------------------------------------------------
# Strapi on Lambda.
#
# Chosen over Fargate purely on cost: a 24/7 Fargate task plus the ALB and the
# NAT gateway it needs runs ~75 USD/month, against well under 1 USD here for a
# CMS that a few staff edit occasionally. The trade-off is cold starts -- see
# the note in README.md.
#
# Packaged as a container image rather than a zip: the Strapi runtime plus the
# prebuilt admin bundle is far past Lambda's 250 MB unzipped limit, while the
# image limit is 10 GB.
#
#   CloudFront ──▶ API Gateway ──▶ Lambda (Strapi) ──▶ RDS (private subnets)
#                                                   └▶ S3 media (gateway endpoint)
# ---------------------------------------------------------------------------

resource "aws_ecr_repository" "cms" {
  name                 = "${local.name}-cms"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  force_delete = false
}

resource "aws_ecr_lifecycle_policy" "cms" {
  repository = aws_ecr_repository.cms.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the 10 most recent images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

# ---------------------------------------------------------------------------
# Media bucket. Strapi's default provider writes uploads to local disk, which a
# Lambda execution environment discards -- so media must go to S3.
# See README: the backend needs @strapi/provider-upload-aws-s3.
# ---------------------------------------------------------------------------

resource "aws_s3_bucket" "media" {
  bucket = "${local.name}-media-${data.aws_caller_identity.current.account_id}"

  tags = { Name = "${local.name}-media" }
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["https://${local.site_domain}", "https://${local.cms_domain}"]
    allowed_headers = ["*"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_policy" "media" {
  bucket = aws_s3_bucket.media.id
  policy = data.aws_iam_policy_document.media.json

  depends_on = [aws_s3_bucket_public_access_block.media]
}

data "aws_iam_policy_document" "media" {
  statement {
    sid       = "AllowCloudFrontRead"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.media.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

# ---------------------------------------------------------------------------
# Lambda
# ---------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "cms" {
  name              = "/aws/lambda/${local.name}-cms"
  retention_in_days = 30
}

resource "aws_iam_role" "cms" {
  name               = "${local.name}-cms"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "cms_basic" {
  role       = aws_iam_role.cms.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Required to create the ENIs that give the function access to RDS.
resource "aws_iam_role_policy_attachment" "cms_vpc" {
  role       = aws_iam_role.cms.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "cms_media" {
  name = "media-bucket"
  role = aws_iam_role.cms.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
        ]
        Resource = ["${aws_s3_bucket.media.arn}/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = [aws_s3_bucket.media.arn]
      },
    ]
  })
}

resource "aws_security_group" "cms" {
  name        = "${local.name}-cms"
  description = "Strapi Lambda ENIs"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${local.name}-cms" }
}

resource "aws_vpc_security_group_egress_rule" "cms_all" {
  security_group_id = aws_security_group.cms.id
  description       = "Outbound to RDS and to S3 via the gateway endpoint"

  ip_protocol = "-1"
  cidr_ipv4   = "0.0.0.0/0"
}

resource "aws_lambda_function" "cms" {
  function_name = "${local.name}-cms"
  role          = aws_iam_role.cms.arn

  package_type = "Image"
  image_uri    = "${aws_ecr_repository.cms.repository_url}:${var.cms_image_tag}"

  architectures = ["x86_64"]
  memory_size   = var.cms_memory
  timeout       = var.cms_timeout

  # Strapi boots in a few seconds and holds a knex pool, so concurrency is
  # capped: every extra concurrent environment is another set of database
  # connections and another cold start.
  reserved_concurrent_executions = var.cms_reserved_concurrency

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.cms.id]
  }

  environment {
    variables = {
      # The Lambda Web Adapter is baked into the image (see backend/Dockerfile),
      # so Strapi runs as the normal HTTP server with no AWS-specific code.
      AWS_LAMBDA_EXEC_WRAPPER    = "/opt/bootstrap"
      AWS_LWA_ENABLE_COMPRESSION = "true"
      # Strapi needs a moment before it answers; stop the adapter polling early.
      AWS_LWA_READINESS_CHECK_PATH = "/_health"
      PORT                         = "1337"

      NODE_ENV     = "production"
      HOST         = "0.0.0.0"
      PUBLIC_URL   = "https://${local.cms_domain}"
      FRONTEND_URL = "https://${local.site_domain}"

      DATABASE_CLIENT                  = "postgres"
      DATABASE_HOST                    = aws_db_instance.main.address
      DATABASE_PORT                    = "5432"
      DATABASE_NAME                    = var.db_name
      DATABASE_USERNAME                = var.db_username
      DATABASE_PASSWORD                = random_password.db.result
      DATABASE_SSL                     = "true"
      DATABASE_SSL_REJECT_UNAUTHORIZED = "false"

      # One connection per execution environment: Lambda scales by process, so
      # a pool larger than this just multiplies idle RDS connections.
      DATABASE_POOL_MIN = "0"
      DATABASE_POOL_MAX = "2"

      APP_KEYS            = join(",", random_password.app_keys[*].result)
      API_TOKEN_SALT      = random_password.strapi_secret["api_token_salt"].result
      ADMIN_JWT_SECRET    = random_password.strapi_secret["admin_jwt_secret"].result
      TRANSFER_TOKEN_SALT = random_password.strapi_secret["transfer_token_salt"].result
      JWT_SECRET          = random_password.strapi_secret["jwt_secret"].result
      ENCRYPTION_KEY      = random_password.strapi_secret["encryption_key"].result
      REVALIDATE_SECRET   = random_password.strapi_secret["revalidate_secret"].result
      LEAD_FORM_SECRET    = random_password.strapi_secret["lead_form_secret"].result

      # Media goes to S3 and is served through the site's CloudFront domain.
      AWS_BUCKET = aws_s3_bucket.media.bucket
      CDN_URL    = "https://${local.site_domain}"

      # Demo content must never be seeded into a real database.
      SEED_DEMO_DATA = "false"
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.cms,
    aws_iam_role_policy_attachment.cms_vpc,
  ]

  lifecycle {
    # The image tag is advanced by scripts/deploy-cms.sh, not by plan drift.
    ignore_changes = [image_uri]
  }
}

# ---------------------------------------------------------------------------
# API Gateway in front of Strapi
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_api" "cms" {
  name          = "${local.name}-cms"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "cms" {
  api_id = aws_apigatewayv2_api.cms.id

  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.cms.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
  # Must exceed the function timeout or API Gateway gives up first.
  timeout_milliseconds = min(var.cms_timeout * 1000, 30000)
}

resource "aws_apigatewayv2_route" "cms" {
  api_id    = aws_apigatewayv2_api.cms.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.cms.id}"
}

resource "aws_apigatewayv2_stage" "cms" {
  api_id      = aws_apigatewayv2_api.cms.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.cms_api.arn
    format = jsonencode({
      requestId = "$context.requestId"
      ip        = "$context.identity.sourceIp"
      method    = "$context.httpMethod"
      path      = "$context.path"
      status    = "$context.status"
      latency   = "$context.responseLatency"
      integErr  = "$context.integrationErrorMessage"
    })
  }
}

resource "aws_cloudwatch_log_group" "cms_api" {
  name              = "/aws/apigateway/${local.name}-cms"
  retention_in_days = 30
}

resource "aws_lambda_permission" "cms_api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cms.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.cms.execution_arn}/*/*"
}
