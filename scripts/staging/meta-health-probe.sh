#!/usr/bin/env bash
# External-style meta health probe — ARGOS must not be the only watcher of itself.
# Acceptable staging rehearsal (no SaaS purchase).
set -euo pipefail
API_URL="${STAGING_API_URL:-http://127.0.0.1:4010}"
FAIL=0

probe() {
  local name="$1" url="$2" expect="${3:-200}"
  code=$(curl -s -o /tmp/argos-meta-probe.json -w "%{http_code}" "$url" || echo "000")
  if [[ "$code" == "$expect" ]]; then
    echo "PASS $name http=$code"
  else
    echo "FAIL $name http=$code url=$url" >&2
    FAIL=1
  fi
}

probe live "$API_URL/api/live" 200
probe ready "$API_URL/api/ready" 200
probe health "$API_URL/api/health" 200

if [[ "$FAIL" -ne 0 ]]; then
  echo "META_HEALTH=FAIL"
  exit 1
fi
echo "META_HEALTH=PASS"
