#!/usr/bin/env bash
# Boot staging stack (build + up) after bootstrap-env.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
bash "$ROOT/scripts/staging/bootstrap-env.sh"
COMPOSE=(docker compose -f "$ROOT/docker/docker-compose.staging.yml" --env-file "$ROOT/docker/.env.staging")

echo "[up] building and starting staging stack..."
"${COMPOSE[@]}" up -d --build

echo "[up] waiting for API /api/ready ..."
for i in $(seq 1 120); do
  if curl -sf http://127.0.0.1:4010/api/ready >/dev/null; then
    echo "[up] READY"
    "${COMPOSE[@]}" ps
    exit 0
  fi
  sleep 3
done
echo "[up] FAIL: API not ready" >&2
"${COMPOSE[@]}" ps
"${COMPOSE[@]}" logs --tail=80 api migrate
exit 1
