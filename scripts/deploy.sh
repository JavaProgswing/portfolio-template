#!/usr/bin/env bash
# Deploy the frontend build to an nginx-served directory on a remote host.
#
# Usage:
#   DOMAIN=yourdomain.com SERVER=user@your-server ./scripts/deploy.sh
#
# Optional:
#   HTML_DIR=/var/www/$DOMAIN/html    (default)
#   SKIP_BUILD=1                      (skip `npm run build`)
#   SKIP_FETCH=1                      (skip `npm run fetch-repos`)

set -euo pipefail

DOMAIN=${DOMAIN:?ERROR: set DOMAIN env var, e.g. DOMAIN=yourdomain.com}
SERVER=${SERVER:?ERROR: set SERVER env var, e.g. SERVER=user@your-server.com}
HTML_DIR=${HTML_DIR:-/var/www/$DOMAIN/html}

if [ -z "${SKIP_FETCH:-}" ]; then
  echo "→ fetching latest GitHub repos…"
  npm run fetch-repos || echo "   (fetch failed, continuing with existing repos.json)"
fi

if [ -z "${SKIP_BUILD:-}" ]; then
  echo "→ building…"
  npm run build
fi

echo "→ syncing to $SERVER:$HTML_DIR…"
rsync -avz --delete --chmod=D755,F644 dist/ "$SERVER:$HTML_DIR/"

echo "→ ✓ deployed to https://$DOMAIN"
