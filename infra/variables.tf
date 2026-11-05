variable "project" {
  description = "Short project slug used to name every resource."
  type        = string
  default     = "aito-auto"
}

variable "environment" {
  description = "Environment name (prod, staging...)."
  type        = string
  default     = "prod"
}

variable "aws_profile" {
  description = "Named profile in ~/.aws/credentials used for every API call."
  type        = string
  default     = "thavisha"
}

variable "aws_region" {
  description = "Main region. eu-north-1 (Stockholm) is the closest to the Finnish audience."
  type        = string
  default     = "eu-north-1"
}

# ---------------------------------------------------------------------------
# DNS / certificates
# ---------------------------------------------------------------------------

variable "site_domain" {
  description = "Public hostname for the Next.js website, e.g. aitoauto.fi."
  type        = string
}

variable "cms_domain" {
  description = "Public hostname for the Strapi admin, e.g. cms.aitoauto.fi."
  type        = string
}

variable "route53_zone_id" {
  description = <<-EOT
    Hosted zone that owns site_domain and cms_domain. When set, Terraform creates
    the ACM validation records and the alias records automatically. Leave empty to
    manage DNS elsewhere -- Terraform then prints the records you must create by hand.
  EOT
  type        = string
  default     = ""
}

# ---------------------------------------------------------------------------
# Network
# ---------------------------------------------------------------------------

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "az_count" {
  description = "How many availability zones to spread subnets across. RDS needs at least 2."
  type        = number
  default     = 2

  validation {
    condition     = var.az_count >= 2
    error_message = "az_count must be at least 2 so RDS can create a subnet group."
  }
}

variable "enable_nat_gateway" {
  description = <<-EOT
    Create NAT gateways for the private subnets. Off by default: the Strapi
    Lambda reaches RDS inside the VPC and S3 through a gateway endpoint, so
    nothing needs the public internet. Each NAT costs roughly 35 USD a month.
  EOT
  type        = bool
  default     = false
}

variable "single_nat_gateway" {
  description = <<-EOT
    Run one NAT gateway instead of one per AZ. Saves roughly 35 USD a month but
    makes the second AZ depend on the first one's NAT. Fine for this workload.
  EOT
  type        = bool
  default     = true
}

# ---------------------------------------------------------------------------
# Frontend (Next.js on Lambda)
# ---------------------------------------------------------------------------

variable "frontend_lambda_memory" {
  description = "Memory (MB) for the SSR Lambda. CPU scales with memory."
  type        = number
  default     = 1536
}

variable "frontend_lambda_timeout" {
  description = "Timeout (seconds) for the SSR Lambda."
  type        = number
  default     = 30
}

variable "frontend_bundle_path" {
  description = <<-EOT
    Zip produced by scripts/build-frontend-lambda.sh. Terraform uploads this as the
    SSR Lambda's code. Built from the Next.js standalone output.
  EOT
  type        = string
  default     = "../dist/frontend-lambda.zip"
}

variable "cloudfront_price_class" {
  description = "PriceClass_100 covers EU + North America, which is enough here."
  type        = string
  default     = "PriceClass_100"
}

# ---------------------------------------------------------------------------
# CMS (Strapi on Fargate)
# ---------------------------------------------------------------------------

variable "cms_image_tag" {
  description = "Tag of the Strapi image in ECR to run. Push with scripts/push-cms-image.sh."
  type        = string
  default     = "latest"
}

variable "cms_memory" {
  description = <<-EOT
    Memory (MB) for the Strapi Lambda. CPU scales with it, so this is also the
    main lever on cold-start time -- below ~1769 MB the function gets less than
    a full vCPU and Strapi's boot slows noticeably.
  EOT
  type        = number
  default     = 2048
}

variable "cms_timeout" {
  description = <<-EOT
    Timeout (seconds) for the Strapi Lambda. Must leave room for a cold start
    plus the request. API Gateway caps the response at 30s regardless.
  EOT
  type        = number
  default     = 30
}

variable "cms_reserved_concurrency" {
  description = <<-EOT
    Ceiling on concurrent Strapi environments. Each one opens its own database
    pool, so this bounds RDS connections. -1 leaves it unreserved.
  EOT
  type        = number
  default     = 5
}

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

variable "db_instance_class" {
  description = "RDS instance class. db.t4g.micro is covered by the free tier for 12 months."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Initial storage (GiB) for RDS."
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Upper bound for RDS storage autoscaling (GiB)."
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Database name created inside the RDS instance."
  type        = string
  default     = "aito_auto"
}

variable "db_username" {
  description = "Master username for RDS."
  type        = string
  default     = "aito"
}

variable "db_multi_az" {
  description = "Run a standby in a second AZ. Doubles the database cost."
  type        = bool
  default     = false
}

variable "db_deletion_protection" {
  description = "Block `terraform destroy` from dropping the database."
  type        = bool
  default     = true
}

variable "db_backup_retention_days" {
  description = "How many days of automated backups to keep."
  type        = number
  default     = 7
}
