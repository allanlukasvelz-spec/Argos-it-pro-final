#!/usr/bin/env bash
# Safe failure injection against staging stack — expect honest NOT_READY / recovery.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API=http://127.0.0.1:4010
FAILS=0
CURL=(curl --max-time 3 -s -o /dev/null -w "%{http_code}")

expect_not_ready() {
  local label="$1"
  code=$("${CURL[@]}" "$API/api/ready" || echo 000)
  if [[ "$code" != "200" ]]; then
    echo "PASS $label not_ready http=$code"
  else
    echo "FAIL $label still READY (false ready)" >&2
    FAILS=$((FAILS + 1))
  fi
}

expect_ready() {
  local label="$1"
  for i in $(seq 1 40); do
    code=$("${CURL[@]}" "$API/api/ready" || echo 000)
    if [[ "$code" == "200" ]]; then
      echo "PASS $label ready"
      return 0
    fi
    sleep 2
  done
  echo "FAIL $label never recovered" >&2
  FAILS=$((FAILS + 1))
}

cleanup() {
  docker unpause argos-staging-postgres >/dev/null 2>&1 || true
  docker unpause argos-staging-minio >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[inject] API restart"
docker restart argos-staging-api >/dev/null
expect_ready api_restart

echo "[inject] worker restart"
docker restart argos-staging-worker >/dev/null
sleep 3
STATUS=$(docker inspect argos-staging-worker --format '{{.State.Status}}')
[[ "$STATUS" == "running" ]] && echo "PASS worker_restart" || { echo "FAIL worker_restart"; FAILS=$((FAILS+1)); }

echo "[inject] postgres pause (temporary outage)"
docker pause argos-staging-postgres >/dev/null
sleep 2
expect_not_ready postgres_outage
docker unpause argos-staging-postgres >/dev/null
expect_ready postgres_recovery

echo "[inject] minio pause"
docker pause argos-staging-minio >/dev/null
sleep 2
expect_not_ready storage_outage
docker unpause argos-staging-minio >/dev/null
expect_ready storage_recovery

echo "[inject] failed migration (isolated bad SQL against staging DB)"
TMP=$(mktemp -d)
echo "THIS IS NOT SQL;" > "$TMP/999_bad.sql"
# shellcheck disable=SC1091
source "$ROOT/docker/.env.staging"
if docker run --rm --network argos-staging_argos_staging_net \
  -e PGPASSWORD="$STAGING_POSTGRES_PASSWORD" \
  -v "$TMP:/bad:ro" \
  postgres:16.6-alpine@sha256:1d04b9ba1d4996401f2552b51beda8187f175c0645c091e4781134fc9c9a3eef \
  psql -h postgres -U "$STAGING_POSTGRES_USER" -d "$STAGING_POSTGRES_DB" -v ON_ERROR_STOP=1 -f /bad/999_bad.sql; then
  echo "FAIL migration_failure (bad SQL succeeded)" >&2
  FAILS=$((FAILS + 1))
else
  echo "PASS migration_failure (non-zero)"
fi
rm -rf "$TMP"

echo "FAILURE_INJECTION_FAILS=$FAILS"
exit "$FAILS"
