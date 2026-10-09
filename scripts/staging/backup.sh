#!/usr/bin/env bash
# Staging backup: PostgreSQL dump + MinIO bucket mirror. Verifies artifacts.
# Does NOT claim success on exit 0 alone — checks size + checksums.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE=(docker compose -f "$ROOT/docker/docker-compose.staging.yml" --env-file "$ROOT/docker/.env.staging")
STAMP="${STAGING_BACKUP_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
OUT_DIR="${STAGING_BACKUP_DIR:-$ROOT/var/staging-backups/$STAMP}"
mkdir -p "$OUT_DIR"

# shellcheck disable=SC1091
set -a
source "$ROOT/docker/.env.staging"
set +a

echo "[backup] stamp=$STAMP dir=$OUT_DIR"

echo "[backup] postgres dump..."
"${COMPOSE[@]}" exec -T postgres \
  pg_dump -U "${STAGING_POSTGRES_USER}" -d "${STAGING_POSTGRES_DB}" -Fc \
  > "$OUT_DIR/postgres.dump"

PG_SIZE=$(wc -c < "$OUT_DIR/postgres.dump" | tr -d ' ')
if [[ "$PG_SIZE" -lt 1024 ]]; then
  echo "[backup] FAIL: postgres.dump too small ($PG_SIZE bytes)" >&2
  exit 1
fi
shasum -a 256 "$OUT_DIR/postgres.dump" | awk '{print $1}' > "$OUT_DIR/postgres.dump.sha256"

echo "[backup] minio mirror..."
BUCKET="${STAGING_MINIO_BUCKET:-argos-evidence-staging}"
mkdir -p "$OUT_DIR/minio"
"${COMPOSE[@]}" run --rm --no-deps \
  -v "$OUT_DIR/minio:/backup" \
  --entrypoint /bin/sh \
  minio-init -c "
    mc alias set local http://minio:9000 \"\$MINIO_ROOT_USER\" \"\$MINIO_ROOT_PASSWORD\" &&
    mc mirror --overwrite local/\$MINIO_BUCKET /backup/\$MINIO_BUCKET &&
    echo mirrored
  "

OBJ_COUNT=$(find "$OUT_DIR/minio" -type f ! -name '.*' | wc -l | tr -d ' ')
find "$OUT_DIR/minio" -type f -print0 | sort -z | xargs -0 shasum -a 256 > "$OUT_DIR/minio.sha256" || true

cat > "$OUT_DIR/MANIFEST.json" <<EOF
{
  "stamp": "$STAMP",
  "postgresBytes": $PG_SIZE,
  "postgresSha256": "$(cat "$OUT_DIR/postgres.dump.sha256")",
  "objectFileCount": $OBJ_COUNT,
  "bucket": "$BUCKET",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "secretsIncluded": false
}
EOF

# Verify readable (use pinned postgres image — host may lack pg_restore)
docker run --rm -v "$OUT_DIR:/dumps:ro" \
  postgres:16.6-alpine@sha256:1d04b9ba1d4996401f2552b51beda8187f175c0645c091e4781134fc9c9a3eef \
  pg_restore -l /dumps/postgres.dump >/dev/null
test -f "$OUT_DIR/MANIFEST.json"
test -s "$OUT_DIR/postgres.dump.sha256"

echo "[backup] OK postgresBytes=$PG_SIZE objects=$OBJ_COUNT"
echo "$OUT_DIR"
