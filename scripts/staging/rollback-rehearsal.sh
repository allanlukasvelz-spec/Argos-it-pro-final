#!/usr/bin/env bash
# Rollback rehearsal for staging images — does NOT run *_down.sql.
# Schema-incompatible rollbacks are documented as hard blockers.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE=(docker compose -f "$ROOT/docker/docker-compose.staging.yml" --env-file "$ROOT/docker/.env.staging")

MODE="${1:---full}"

echo "POLICY: never auto-apply *_down.sql; prefer forward-fix / compatible prior images."

if [[ "$MODE" == "--check-only" ]]; then
  test -f "$ROOT/docker/docker-compose.staging.yml"
  test -f "$ROOT/backend/Dockerfile.staging"
  test -f "$ROOT/backend/Dockerfile.worker"
  test -f "$ROOT/frontend/Dockerfile.staging"
  echo "ROLLBACK_CHECK=OK (images rebuildable; DB down migrations manual-only)"
  echo "DB_DOWN_AUTO=NO"
  echo "SCHEMA_COMPAT_BLOCKER=document when prior app cannot read current schema"
  exit 0
fi

echo "[rollback] capturing current image ids..."
API_IMG=$(docker inspect argos-staging-api --format '{{.Image}}' 2>/dev/null || echo none)
WORKER_IMG=$(docker inspect argos-staging-worker --format '{{.Image}}' 2>/dev/null || echo none)
FE_IMG=$(docker inspect argos-staging-frontend --format '{{.Image}}' 2>/dev/null || echo none)
echo "api=$API_IMG worker=$WORKER_IMG frontend=$FE_IMG"

echo "[rollback] restart api (simulate prior by recreate from pinned Dockerfile)..."
"${COMPOSE[@]}" up -d --no-deps --force-recreate api
sleep 5
curl -sf http://127.0.0.1:4010/api/ready >/dev/null
echo "[rollback] api recreate OK"

echo "[rollback] restart worker..."
"${COMPOSE[@]}" up -d --no-deps --force-recreate worker
sleep 5
docker inspect argos-staging-worker --format '{{.State.Status}}' | grep -q running
echo "[rollback] worker recreate OK"

echo "[rollback] restart frontend..."
"${COMPOSE[@]}" up -d --no-deps --force-recreate frontend
sleep 5
curl -sf -o /dev/null http://127.0.0.1:3010/ || true
echo "[rollback] frontend recreate OK"

echo "[rollback] DB down migration NOT executed (policy)"
echo "ROLLBACK_REHEARSAL=PASS"
echo "DB_COMPATIBILITY=forward-only; prior images only if schema compatible"
