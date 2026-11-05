#!/usr/bin/env bash
#
# Publish the website: upload static assets to S3, ship the new Lambda bundle,
# then invalidate the HTML at the edge.
#
# Assets are uploaded BEFORE the Lambda is updated so a request served by the
# new code never asks for a chunk that is not in S3 yet.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA="$ROOT/infra"
DIST="$ROOT/dist"

AWS_PROFILE="${AWS_PROFILE:-thavisha}"
export AWS_PROFILE

tf() { terraform -chdir="$INFRA" output -raw "$1"; }

BUCKET="$(tf assets_bucket)"
DIST_ID="$(tf site_distribution_id)"

# The SSR function name is derived the same way Terraform names it.
PROJECT="${PROJECT:-aito-auto}"
ENVIRONMENT="${ENVIRONMENT:-prod}"
LAMBDA_NAME="${PROJECT}-${ENVIRONMENT}-ssr"

if [ ! -f "$DIST/frontend-lambda.zip" ]; then
  echo "No bundle found. Run scripts/build-frontend-lambda.sh first." >&2
  exit 1
fi

echo "==> Uploading immutable assets to s3://$BUCKET"
# Content-hashed: cache forever.
aws s3 sync "$ROOT/frontend/.next/static" "s3://$BUCKET/_next/static" \
  --cache-control "public,max-age=31536000,immutable" \
  --delete

if [ -d "$ROOT/frontend/public" ]; then
  echo "==> Uploading public/ assets"
  # Not hashed: short cache, revalidated at the edge.
  aws s3 sync "$ROOT/frontend/public" "s3://$BUCKET" \
    --cache-control "public,max-age=300,must-revalidate"
fi

echo "==> Updating Lambda $LAMBDA_NAME"
aws lambda update-function-code \
  --function-name "$LAMBDA_NAME" \
  --zip-file "fileb://$DIST/frontend-lambda.zip" \
  --output text --query 'LastModified'

aws lambda wait function-updated --function-name "$LAMBDA_NAME"

echo "==> Invalidating HTML at the edge"
# Hashed assets are never invalidated -- their URL changes instead.
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths '/' '/index.html' '/autot*' '/palvelut' '/meista' '/yhteystiedot' '/tietosuojaseloste' \
  --output text --query 'Invalidation.Id'

echo "==> Deployed."
