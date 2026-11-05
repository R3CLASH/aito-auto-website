terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Remote state. Bootstrap the bucket + lock table once (see README), then
  # uncomment and run `terraform init -migrate-state`.
  #
  # backend "s3" {
  #   bucket       = "aito-auto-tfstate"
  #   key          = "aito-auto/terraform.tfstate"
  #   region       = "eu-north-1"
  #   profile      = "thavisha"
  #   encrypt      = true
  #   use_lockfile = true
  # }
}
