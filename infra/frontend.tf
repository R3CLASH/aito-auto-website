# ---------------------------------------------------------------------------
# Next.js runs in standalone (SSR) mode, so it needs real compute -- a plain
# S3 website would break the dynamic car routes and /api/revalidate.
#
#   CloudFront ──▶ S3            for /_next/static/* and /public assets
#              └─▶ API Gateway ──▶ Lambda   for every other path (SSR)
# ---------------------------------------------------------------------------

resource "aws_s3_bucket" "assets" {
  bucket = "${local.name}-assets-${data.aws_caller_identity.current.account_id}"

  tags = { Name = "${local.name}-assets" }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Static assets are content-hashed, so old versions only need to survive long
# enough for in-flight page loads to finish.
resource "aws_s3_bucket_lifecycle_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    id     = "expire-noncurrent"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_s3_bucket_policy" "assets" {
  bucket = aws_s3_bucket.assets.id
  policy = data.aws_iam_policy_document.assets.json

  depends_on = [aws_s3_bucket_public_access_block.assets]
}

data "aws_iam_policy_document" "assets" {
  statement {
    sid       = "AllowCloudFrontRead"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.assets.arn}/*"]

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
# SSR Lambda
# ---------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/aws/lambda/${local.name}-ssr"
  retention_in_days = 30
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "frontend" {
  name               = "${local.name}-ssr"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "frontend_basic" {
  role       = aws_iam_role.frontend.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "frontend" {
  function_name = "${local.name}-ssr"
  role          = aws_iam_role.frontend.arn

  filename         = var.frontend_bundle_path
  source_code_hash = filebase64sha256(var.frontend_bundle_path)

  runtime = "nodejs22.x"
  handler = "run.sh"
  # The Lambda Web Adapter runs the standalone Next.js server as-is, so the app
  # needs no AWS-specific code.
  layers = ["arn:aws:lambda:${var.aws_region}:753240598075:layer:LambdaAdapterLayerX86:24"]

  memory_size = var.frontend_lambda_memory
  timeout     = var.frontend_lambda_timeout

  environment {
    variables = {
      AWS_LAMBDA_EXEC_WRAPPER    = "/opt/bootstrap"
      AWS_LWA_ENABLE_COMPRESSION = "true"
      PORT                       = "3000"
      HOSTNAME                   = "0.0.0.0"
      NODE_ENV                   = "production"

      STRAPI_URL           = "https://${local.cms_domain}"
      NEXT_PUBLIC_SITE_URL = "https://${local.site_domain}"

      # Strapi serves media through the site's own CloudFront domain
      # (CDN_URL in cms.tf), so /uploads/* is same-origin and is already
      # covered by localPatterns in next.config.ts. No remote host needed.
      IMAGE_HOSTS = ""

      # Must match the values Strapi runs with, or /api/revalidate rejects
      # the CMS webhook and the lead form rejects submissions.
      REVALIDATE_SECRET = random_password.strapi_secret["revalidate_secret"].result
      LEAD_FORM_SECRET  = random_password.strapi_secret["lead_form_secret"].result
    }
  }

  depends_on = [aws_cloudwatch_log_group.frontend]
}

resource "aws_lambda_function_event_invoke_config" "frontend" {
  function_name          = aws_lambda_function.frontend.function_name
  maximum_retry_attempts = 0
}

# ---------------------------------------------------------------------------
# API Gateway (HTTP API) in front of the SSR Lambda
# ---------------------------------------------------------------------------

resource "aws_apigatewayv2_api" "frontend" {
  name          = "${local.name}-ssr"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "frontend" {
  api_id = aws_apigatewayv2_api.frontend.id

  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.frontend.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
  timeout_milliseconds   = var.frontend_lambda_timeout * 1000
}

resource "aws_apigatewayv2_route" "frontend" {
  api_id    = aws_apigatewayv2_api.frontend.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.frontend.id}"
}

resource "aws_apigatewayv2_stage" "frontend" {
  api_id      = aws_apigatewayv2_api.frontend.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.frontend_api.arn
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

  default_route_settings {
    throttling_burst_limit = 500
    throttling_rate_limit  = 1000
  }
}

resource "aws_cloudwatch_log_group" "frontend_api" {
  name              = "/aws/apigateway/${local.name}-ssr"
  retention_in_days = 30
}

resource "aws_lambda_permission" "frontend_api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.frontend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.frontend.execution_arn}/*/*"
}
