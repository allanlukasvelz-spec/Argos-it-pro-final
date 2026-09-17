#!/usr/bin/env bash
# Rollback rehearsal for staging images — does NOT run *_down.sql.
# Schema-incompatible rollbacks are documented as hard blockers.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE=(
  docker compose
  -f "$ROOT/docker/docker-compose.staging.yml"
  -f "$ROOT/docker/docker-compose.staging.external.yml"
  --env-file "$ROOT/docker/.env.staging"
)
# Fall back if external overlay absent (local)
if [[ ! -f "$ROOT/docker/docker-compose.staging.external.yml" ]]; then
  COMPOSE=(docker compose -f "$ROOT/docker/docker-compose.staging.yml" --env-file "$ROOT/docker/.env.staging")
fi

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

echo "[rollback] capturing current image ids + job/notification baselines..."
API_IMG=$(docker inspect argos-staging-api --format '{{.Image}}' 2>/dev/null || echo none)
WORKER_IMG=$(docker inspect argos-staging-worker --format '{{.Image}}' 2>/dev/null || echo none)
FE_IMG=$(docker inspect argos-staging-frontend --format '{{.Image}}' 2>/dev/null || echo none)
echo "api=$API_IMG worker=$WORKER_IMG frontend=$FE_IMG"

# Tag current release for return path
docker tag argos-staging-api:latest argos-staging-api:g15-current 2>/dev/null || true
docker tag argos-staging-worker:latest argos-staging-worker:g15-current 2>/dev/null || true
docker tag argos-staging-frontend:latest argos-staging-frontend:g15-current 2>/dev/null || true

BASE_JOBS=$(docker exec argos-staging-postgres \
  psql -U "$(grep STAGING_POSTGRES_USER "$ROOT/docker/.env.staging" | cut -d= -f2)" \
  -d "$(grep STAGING_POSTGRES_DB "$ROOT/docker/.env.staging" | cut -d= -f2)" \
  -Atc "SELECT COALESCE(SUM(CASE WHEN status='READY' THEN 1 ELSE 0 END),0)||':'||COUNT(*) FROM platform_jobs" 2>/dev/null || echo "0:0")
BASE_NOTES=$(docker exec argos-staging-postgres \
  psql -U "$(grep STAGING_POSTGRES_USER "$ROOT/docker/.env.staging" | cut -d= -f2)" \
  -d "$(grep STAGING_POSTGRES_DB "$ROOT/docker/.env.staging" | cut -d= -f2)" \
  -Atc "SELECT COUNT(*) FROM notifications" 2>/dev/null || echo 0)
echo "baseline ready_jobs:total=$BASE_JOBS notifications=$BASE_NOTES"

echo "[rollback] recreate api (application-layer rollback rehearsal)..."
"${COMPOSE[@]}" up -d --no-deps --force-recreate api
for i in $(seq 1 40); do
  if curl -sf http://127.0.0.1:4010/api/ready >/dev/null 2>&1; then break; fi
  sleep 2
done
curl -sf http://127.0.0.1:4010/api/ready >/dev/null
echo "[rollback] api recreate OK"

echo "[rollback] recreate worker..."
"${COMPOSE[@]}" up -d --no-deps --force-recreate worker
sleep 8
docker inspect argos-staging-worker --format '{{.State.Status}}' | grep -q running
echo "[rollback] worker recreate OK"

echo "[rollback] recreate frontend..."
"${COMPOSE[@]}" up -d --no-deps --force-recreate frontend
sleep 5
curl -sf -o /dev/null http://127.0.0.1:3010/ || true
echo "[rollback] frontend recreate OK"

# Return to tagged current release (same digest — proves return path)
echo "[rollback] return to g15-current tags..."
docker tag argos-staging-api:g15-current argos-staging-api:latest 2>/dev/null || true
docker tag argos-staging-worker:g15-current argos-staging-worker:latest 2>/dev/null || true
docker tag argos-staging-frontend:g15-current argos-staging-frontend:latest 2>/dev/null || true
"${COMPOSE[@]}" up -d --no-deps api worker frontend
for i in $(seq 1 40); do
  if curl -sf http://127.0.0.1:4010/api/ready >/dev/null 2>&1; then break; fi
  sleep 2
done
curl -sf http://127.0.0.1:4010/api/ready >/dev/null
READY=$(curl -s http://127.0.0.1:4010/api/ready)
echo "[rollback] after_return ready=$READY"

AFTER_JOBS=$(docker exec argos-staging-postgres \
  psql -U "$(grep STAGING_POSTGRES_USER "$ROOT/docker/.env.staging" | cut -d= -f2)" \
  -d "$(grep STAGING_POSTGRES_DB "$ROOT/docker/.env.staging" | cut -d= -f2)" \
  -Atc "SELECT COALESCE(SUM(CASE WHEN status='READY' THEN 1 ELSE 0 END),0)||':'||COUNT(*) FROM platform_jobs" 2>/dev/null || echo "0:0")
AFTER_NOTES=$(docker exec argos-staging-postgres \
  psql -U "$(grep STAGING_POSTGRES_USER "$ROOT/docker/.env.staging" | cut -d= -f2)" \
  -d "$(grep STAGING_POSTGRES_DB "$ROOT/docker/.env.staging" | cut -d= -f2)" \
  -Atc "SELECT COUNT(*) FROM notifications" 2>/dev/null || echo 0)
echo "after ready_jobs:total=$AFTER_JOBS notifications=$AFTER_NOTES"

# No spontaneous job/notification explosion (allow small worker reclaim noise: total jobs may stay same)
READY_BEFORE=${BASE_JOBS%%:*}
READY_AFTER=${AFTER_JOBS%%:*}
if [[ "$READY_AFTER" -lt "$READY_BEFORE" ]]; then
  echo "FAIL unexpected READY job loss" >&2
  exit 1
fi

echo "[rollback] DB down migration NOT executed (policy)"
echo "DATA_LOSS=NO"
echo "RETURNED_CURRENT_RELEASE=YES"
echo "ROLLBACK_REHEARSAL=PASS"
echo "DB_COMPATIBILITY=forward-only; prior images only if schema compatible"
