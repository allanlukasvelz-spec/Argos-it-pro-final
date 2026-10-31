#!/usr/bin/env bash
# Create docker/.env.staging from example with random secrets (never commit).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
EXAMPLE="$ROOT/docker/.env.staging.example"
TARGET="$ROOT/docker/.env.staging"

if [[ -f "$TARGET" ]]; then
  echo "EXISTS: $TARGET (not overwriting)"
  exit 0
fi

rand() { openssl rand -base64 48 | tr -d '\n' | tr '+/' 'Aa' | head -c 48; }

sed \
  -e "s/CHANGE_ME_staging_pg_password_32chars/$(rand)/" \
  -e "s/CHANGE_ME_staging_jwt_access_secret_min_32/$(rand)/" \
  -e "s/CHANGE_ME_staging_jwt_refresh_secret_min_32/$(rand)/" \
  -e "s/CHANGE_ME_staging_minio_password_32/$(rand)/" \
  "$EXAMPLE" > "$TARGET"

chmod 600 "$TARGET"
echo "CREATED: $TARGET"
