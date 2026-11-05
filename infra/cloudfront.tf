# ---------------------------------------------------------------------------
# Site distribution. Three origins behind one hostname:
#   /_next/static/*  -> S3 assets   (immutable, cached forever)
#   /uploads/*       -> S3 media    (Strapi uploads, long cache)
#   everything else  -> API Gateway -> SSR Lambda
# ---------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "assets" {
  name                              = "${local.name}-assets"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_origin_access_control" "media" {
  name                              = "${local.name}-media"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# AWS managed policies -- stable ids, no need to define our own.
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

data "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "Managed-SecurityHeadersPolicy"
}

locals {
  api_origin_domain = replace(aws_apigatewayv2_api.frontend.api_endpoint, "https://", "")
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${local.name} website"
  default_root_object = ""
  price_class         = var.cloudfront_price_class
  aliases             = [local.site_domain]
  http_version        = "http2and3"

  origin {
    origin_id                = "ssr"
    domain_name              = local.api_origin_domain
    origin_access_control_id = null

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    origin_id                = "assets"
    domain_name              = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.assets.id
  }

  origin {
    origin_id                = "media"
    domain_name              = aws_s3_bucket.media.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.media.id
  }

  # SSR: never cached at the edge. Next.js does its own caching and
  # /api/revalidate must always reach the origin.
  default_cache_behavior {
    target_origin_id       = "ssr"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Content-hashed build output: safe to cache indefinitely.
  ordered_cache_behavior {
    path_pattern           = "/_next/static/*"
    target_origin_id       = "assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Strapi media. Replaces the local dev rewrite that proxied /uploads to Strapi.
  ordered_cache_behavior {
    path_pattern           = "/uploads/*"
    target_origin_id       = "media"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.security_headers.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = local.manage_dns ? aws_acm_certificate_validation.cloudfront[0].certificate_arn : aws_acm_certificate.cloudfront.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = { Name = "${local.name}-site" }
}

# ---------------------------------------------------------------------------
# CMS distribution. Fronting the ALB with CloudFront gives the admin a TLS
# endpoint on the apex certificate and lets the ALB security group accept only
# CloudFront's prefix list.
# ---------------------------------------------------------------------------

resource "aws_cloudfront_distribution" "cms" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${local.name} Strapi admin"
  price_class     = var.cloudfront_price_class
  aliases         = [local.cms_domain]
  http_version    = "http2and3"

  origin {
    origin_id   = "cms-api"
    domain_name = replace(aws_apigatewayv2_api.cms.api_endpoint, "https://", "")

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    # Strapi builds absolute URLs from the forwarded protocol; API Gateway
    # strips the viewer's.
    custom_header {
      name  = "X-Forwarded-Proto"
      value = "https"
    }
  }

  # The admin is dynamic and authenticated: nothing here is cached.
  default_cache_behavior {
    target_origin_id       = "cms-api"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
  }

  # The admin bundle is content-hashed, so caching it at the edge keeps most
  # admin page loads from waking the function at all.
  ordered_cache_behavior {
    path_pattern           = "/admin/*.js"
    target_origin_id       = "cms-api"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  ordered_cache_behavior {
    path_pattern           = "/admin/*.css"
    target_origin_id       = "cms-api"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = local.manage_dns ? aws_acm_certificate_validation.cloudfront[0].certificate_arn : aws_acm_certificate.cloudfront.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = { Name = "${local.name}-cms" }
}
