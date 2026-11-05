#!/usr/bin/env bash
#
# Build the Strapi image, push it to ECR and point the Lambda at the new tag.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA="$ROOT/infra"

AWS_PROFILE="${AWS_PROFILE:-thavisha}"
AWS_REGION="${AWS_REGION:-eu-north-1}"
export AWS_PROFILE AWS_REGION

tf() { terraform -chdir="$INFRA" output -raw "$1"; }

REPO="$(tf ecr_repository_url)"
FUNCTION="$(tf cms_function_name)"

TAG="${1:-$(git -C "$ROOT" rev-parse --short HEAD)}"

echo "==> Logging in to ECR"
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "${REPO%%/*}"

echo "==> Building $REPO:$TAG"
# Lambda runs the function on x86_64 (see architectures in cms.tf), so build for
# it explicitly -- an Apple Silicon machine would otherwise produce arm64.
docker build \
  --platform linux/amd64 \
  -f "$ROOT/backend/Dockerfile" \
  -t "$REPO:$TAG" \
  "$ROOT/backend"

echo "==> Pushing"
docker push "$REPO:$TAG"

echo "==> Pointing $FUNCTION at $TAG"
# Immutable tag per deploy: Lambda resolves the digest once, so reusing
# 'latest' would not reliably pick up a new image.
aws lambda update-function-code \
  --function-name "$FUNCTION" \
  --image-uri "$REPO:$TAG" \
  --output text --query 'LastModified'

aws lambda wait function-updated --function-name "$FUNCTION"

echo "==> Smoke test"
CMS_URL="$(tf cms_url)"
# The first call after a deploy pays a cold start; allow for it.
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 60 "${CMS_URL%/admin}/_health" || true)"
if [ "$code" = "204" ] || [ "$code" = "200" ]; then
  echo "==> Deployed $TAG — health check $code"
else
  echo "!! Health check returned $code. Check: aws logs tail /aws/lambda/$FUNCTION --follow" >&2
  exit 1
fi
