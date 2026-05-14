#!/usr/bin/env bash
# Run locally to see HTTP status + headers for the tag list JSON (same URL the display uses).
# Usage: bash scripts/test-list-url.sh
# Or:    CLOUD=dz6ajwh6k TAG=selfies-demo bash scripts/test-list-url.sh

set -euo pipefail
CLOUD="${CLOUD:-dz6ajwh6k}"
TAG="${TAG:-selfies-demo}"
URL="https://res.cloudinary.com/${CLOUD}/image/list/${TAG}.json"

echo "GET $URL"
echo "---"
curl -sS -D - -o /tmp/cld-list-body.json "$URL" | head -30
echo "--- body (first 800 bytes) ---"
head -c 800 /tmp/cld-list-body.json || true
echo ""
echo ""
echo "Expect: HTTP/2 200 and JSON with \"resources\" array."
echo "401/403: enable list in Cloudinary → Settings → Security → Restricted media types → Resource list (uncheck restriction)."
