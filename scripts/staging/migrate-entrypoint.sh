#!/bin/sh
# Staging migrate entrypoint — forward only; never applies *_down.sql
set -eu

apk add --no-cache bash >/dev/null

echo "[migrate] waiting for postgres..."
i=0
until psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "[migrate] ERROR: postgres not ready" >&2
    exit 1
  fi
  sleep 1
done

echo "[migrate] applying database/migrate.sh (forward only)..."
export DATABASE_URL
bash /database/migrate.sh

echo "[migrate] verifying required relations..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
SELECT
  to_regclass('public.organizations') AS organizations,
  to_regclass('public.evidence_objects') AS evidence_objects,
  to_regclass('public.reports') AS reports,
  to_regclass('public.platform_jobs') AS platform_jobs;
SQL

echo "[migrate] OK"
