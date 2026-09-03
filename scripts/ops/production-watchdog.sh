#!/usr/bin/env bash
# Local/CI-equivalent watchdog probe (no secrets).
set -euo pipefail
set +x
PORTAL_URL="${PORTAL_URL:-https://portal.argos-it.com/}"
API_URL="${API_URL:-https://api.portal.argos-it.com/api/health}"

probe() {
  local name="$1" url="$2" extra="${3:-}"
  local attempt=1 code=000 body=""
  while [ "$attempt" -le 2 ]; do
    body="$(mktemp)"
    code="$(curl -sS -L --max-time 20 -o "$body" -w '%{http_code}' "$url" || true)"
    if [ "$code" = "200" ]; then
      if [ "$extra" = "api" ]; then
        python3 - "$body" <<'PY'
import json, sys
with open(sys.argv[1]) as f:
    d = json.load(f)
status = str(d.get("status", "")).upper()
db = str(d.get("db", "")).lower()
if status != "OK" or db != "connected":
    raise SystemExit(f"API_CONTRACT_FAIL status={status} db={db}")
print("API_BODY_VALIDATION=PASS")
PY
      fi
      echo "OK ${name} code=${code}"
      rm -f "$body"
      return 0
    fi
    echo "RETRY ${name} attempt=${attempt} code=${code}"
    rm -f "$body"
    attempt=$((attempt + 1))
    sleep 1
  done
  echo "INCIDENT=CORE_DEGRADED SOURCE=EXTERNAL_WATCHDOG TARGET=${name} STATUS=http_${code} ACTION=CHECK_ARGOS_VPS_AND_PUBLIC_ROUTING"
  return 1
}

rc=0
probe portal "$PORTAL_URL" web || rc=1
probe api "$API_URL" api || rc=1
if [ "$rc" -eq 0 ]; then
  echo "WATCHDOG_OK=YES"
fi
exit "$rc"
