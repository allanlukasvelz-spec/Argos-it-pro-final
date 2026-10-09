#!/usr/bin/env bash
# Staging security red-team checks (config/exposure). Critical finding → exit 2.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE=(docker compose -f "$ROOT/docker/docker-compose.staging.yml" --env-file "$ROOT/docker/.env.staging")
API_URL="${STAGING_API_URL:-http://127.0.0.1:4010}"
CRITICAL=0
WARN=0

pass() { echo "PASS $1"; }
fail() { echo "FAIL_CRITICAL $1 — $2" >&2; CRITICAL=1; }
warn() { echo "WARN $1 — $2" >&2; WARN=$((WARN + 1)); }

# Host publishes: postgres must not be on 0.0.0.0
if docker port argos-staging-postgres 5432 >/dev/null 2>&1; then
  fail postgres_public "postgres has host port mapping"
else
  pass postgres_not_published
fi

if docker port argos-staging-minio 9000 >/dev/null 2>&1; then
  fail minio_api_public "minio API published to host"
else
  pass minio_api_not_published
fi

if docker port argos-staging-minio 9001 >/dev/null 2>&1; then
  fail minio_console_public "minio console published to host"
else
  pass minio_console_not_published
fi

# Worker must not expose ports
WORKER_PORTS=$(docker inspect argos-staging-worker --format '{{json .NetworkSettings.Ports}}' 2>/dev/null || echo null)
if echo "$WORKER_PORTS" | grep -qE '[0-9]+/tcp'; then
  # empty map {} is ok
  if echo "$WORKER_PORTS" | grep -q '"HostPort"'; then
    fail worker_port "worker has host port"
  else
    pass worker_no_host_port
  fi
else
  pass worker_no_host_port
fi

# Test endpoint must 404
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/test/reset-rate-limits" || echo 000)
if [[ "$CODE" == "404" || "$CODE" == "403" || "$CODE" == "405" ]]; then
  pass test_endpoint_disabled "http=$CODE"
else
  fail test_endpoint "expected 404/403, got $CODE"
fi

# Privileged / docker.sock
for c in argos-staging-api argos-staging-worker argos-staging-postgres argos-staging-minio; do
  PRIV=$(docker inspect "$c" --format '{{.HostConfig.Privileged}}' 2>/dev/null || echo unknown)
  if [[ "$PRIV" == "true" ]]; then
    fail "privileged_$c" "privileged=true"
  else
    pass "not_privileged_$c"
  fi
  SOCK=$(docker inspect "$c" --format '{{range .Mounts}}{{.Source}} {{end}}' 2>/dev/null || true)
  if echo "$SOCK" | grep -q docker.sock; then
    fail "docker_socket_$c" "docker.sock mounted"
  else
    pass "no_docker_socket_$c"
  fi
done

# Env fail-closed inside API
API_ENV=$("${COMPOSE[@]}" exec -T api printenv 2>/dev/null || true)
for flag in ARGOS_ALLOW_RATE_LIMIT_RESET ARGOS_REPORT_PDF_STUB ALLOW_NOC_SELF_APPROVAL; do
  val=$(echo "$API_ENV" | grep "^${flag}=" | cut -d= -f2- || true)
  if [[ -z "$val" || "$val" == "0" || "$val" == "false" ]]; then
    pass "flag_empty_$flag"
  else
    fail "flag_$flag" "set to '$val'"
  fi
done

# Anonymous bucket must be private/none
ANON=$("${COMPOSE[@]}" run --rm --no-deps --entrypoint /bin/sh minio-init -c \
  'mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null && mc anonymous get local/$MINIO_BUCKET' 2>/dev/null || echo fail)
if echo "$ANON" | grep -Eiq 'none|private'; then
  pass anonymous_none_or_private
else
  fail anonymous_bucket "got: $ANON"
fi

# Default secrets in committed example only — runtime must not equal CHANGE_ME
# shellcheck disable=SC1091
source "$ROOT/docker/.env.staging"
if [[ "$STAGING_JWT_SECRET" == *CHANGE_ME* ]]; then
  fail default_jwt "CHANGE_ME still in .env.staging"
else
  pass secrets_not_placeholder
fi

if [[ "$CRITICAL" -ne 0 ]]; then
  echo "STOP_SECURITY_GATE"
  exit 2
fi
echo "SECURITY_GATE=PASS warnings=$WARN"
exit 0
