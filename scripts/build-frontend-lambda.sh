#!/usr/bin/env bash
#
# Package the Next.js standalone build as a Lambda zip.
#
# The Lambda Web Adapter layer (attached in infra/frontend.tf) runs the normal
# Node server and translates API Gateway events into HTTP, so no AWS-specific
# code is needed in the app itself.
#
# Output: dist/frontend-lambda.zip  (referenced by var.frontend_bundle_path)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND="$ROOT/frontend"
DIST="$ROOT/dist"
STAGE="$DIST/frontend-lambda"

: "${SITE_DOMAIN:?Set SITE_DOMAIN, e.g. SITE_DOMAIN=aitoauto.fi}"
: "${CMS_DOMAIN:?Set CMS_DOMAIN, e.g. CMS_DOMAIN=cms.aitoauto.fi}"

echo "==> Building Next.js (standalone)"
cd "$FRONTEND"

# These are read at build time by next.config.ts and by any component that
# inlines NEXT_PUBLIC_* values.
export STRAPI_URL="https://$CMS_DOMAIN"
export NEXT_PUBLIC_SITE_URL="https://$SITE_DOMAIN"
export NODE_ENV=production

npm ci
npm run build

echo "==> Staging bundle"
rm -rf "$STAGE" "$DIST/frontend-lambda.zip"
mkdir -p "$STAGE"

# standalone/ holds a minimal server plus only the node_modules it traced.
cp -R .next/standalone/. "$STAGE/"

# Traced output omits static assets; the server still needs them on disk for
# routes it renders itself. CloudFront serves the same files from S3.
mkdir -p "$STAGE/.next"
cp -R .next/static "$STAGE/.next/static"
[ -d public ] && cp -R public "$STAGE/public"

# Entrypoint the Web Adapter execs.
cat > "$STAGE/run.sh" <<'SH'
#!/bin/bash
exec node server.js
SH
chmod +x "$STAGE/run.sh"

echo "==> Zipping"
cd "$STAGE"
zip -qr "$DIST/frontend-lambda.zip" .

echo "==> Done: $DIST/frontend-lambda.zip ($(du -h "$DIST/frontend-lambda.zip" | cut -f1))"
