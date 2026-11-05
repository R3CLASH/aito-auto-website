# ---------------------------------------------------------------------------
# Two certificates are needed:
#   * us-east-1 -- CloudFront only reads certificates from that region.
#   * regional  -- terminates TLS on the ALB in front of Strapi.
# Both cover the site and the CMS hostname so either distribution can use them.
# ---------------------------------------------------------------------------

resource "aws_acm_certificate" "cloudfront" {
  provider = aws.us_east_1

  domain_name               = local.site_domain
  subject_alternative_names = [local.cms_domain]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "${local.name}-cloudfront" }
}

# --- DNS validation ----------------------------------------------------------
# Only runs when a hosted zone was supplied. Otherwise the records are exported
# as outputs so they can be created wherever DNS actually lives.

locals {
  cloudfront_validation = {
    for dvo in aws_acm_certificate.cloudfront.domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

}

resource "aws_route53_record" "cloudfront_validation" {
  for_each = local.manage_dns ? local.cloudfront_validation : {}

  zone_id         = var.route53_zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "cloudfront" {
  count    = local.manage_dns ? 1 : 0
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.cloudfront.arn
  validation_record_fqdns = [for r in aws_route53_record.cloudfront_validation : r.fqdn]
}

# --- Alias records -----------------------------------------------------------

resource "aws_route53_record" "site" {
  count = local.manage_dns ? 1 : 0

  zone_id = var.route53_zone_id
  name    = local.site_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "cms" {
  count = local.manage_dns ? 1 : 0

  zone_id = var.route53_zone_id
  name    = local.cms_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cms.domain_name
    zone_id                = aws_cloudfront_distribution.cms.hosted_zone_id
    evaluate_target_health = false
  }
}
