output "site_url" {
  description = "Public website URL."
  value       = "https://${local.site_domain}"
}

output "cms_url" {
  description = "Strapi admin URL."
  value       = "https://${local.cms_domain}/admin"
}

output "site_cloudfront_domain" {
  description = "CloudFront domain for the website. Point site_domain here if DNS is managed elsewhere."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "cms_cloudfront_domain" {
  description = "CloudFront domain for the CMS. Point cms_domain here if DNS is managed elsewhere."
  value       = aws_cloudfront_distribution.cms.domain_name
}

output "site_distribution_id" {
  description = "Needed by the deploy script to invalidate the cache."
  value       = aws_cloudfront_distribution.site.id
}

output "assets_bucket" {
  description = "Bucket the Next.js static output is synced to."
  value       = aws_s3_bucket.assets.bucket
}

output "media_bucket" {
  description = "Bucket Strapi uploads land in."
  value       = aws_s3_bucket.media.bucket
}

output "ecr_repository_url" {
  description = "Push the Strapi image here."
  value       = aws_ecr_repository.cms.repository_url
}

output "cms_function_name" {
  description = "Strapi Lambda. Updated in place by scripts/deploy-cms.sh."
  value       = aws_lambda_function.cms.function_name
}

output "ssr_function_name" {
  value = aws_lambda_function.frontend.function_name
}

output "db_endpoint" {
  description = "RDS endpoint. Reachable only from inside the VPC."
  value       = aws_db_instance.main.address
}

output "cms_secret_name" {
  description = "Secrets Manager entry holding the generated Strapi secrets."
  value       = aws_secretsmanager_secret.cms.name
}

# When no hosted zone was given, these are the records to create by hand.
output "acm_validation_records" {
  description = "DNS records that must exist before the certificates validate."
  value       = local.manage_dns ? {} : local.cloudfront_validation
}

output "dns_records_to_create" {
  description = "Alias/CNAME targets to configure when DNS lives outside Route 53."
  value = local.manage_dns ? {} : {
    (local.site_domain) = aws_cloudfront_distribution.site.domain_name
    (local.cms_domain)  = aws_cloudfront_distribution.cms.domain_name
  }
}
