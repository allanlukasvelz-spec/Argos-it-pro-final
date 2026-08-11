#!/usr/bin/env bash
# Smoke del API ARGOS-IT. Requiere backend en marcha.
# Auth REST: cookies HttpOnly (argos_access / argos_refresh). Bearer REST = 401.
# Uso:
#   ./scripts/verify-api.sh
#   BASE_URL=http://localhost:4000 VERIFY_ORIGIN=http://localhost:3000 ./scripts/verify-api.sh
#
# Auth opcional (cookie jar vía login):
#   CLIENT_EMAIL=... CLIENT_PASSWORD=...
#   ADMIN_EMAIL=... ADMIN_PASSWORD=...
#
# Opcional: VERIFY_MASCOT_REQUIRES_200=1 — exige HTTP 200 en mascot-chat/dumbo-chat con mensaje válido
# (staging con OPENAI_API_KEY en el servidor del API).
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4000}"
BASE="${BASE_URL%/}"
VERIFY_ORIGIN="${VERIFY_ORIGIN:-http://localhost:3000}"
COOKIE_JAR="$(mktemp -t argos-verify-cookies.XXXXXX)"
trap 'rm -f "${COOKIE_JAR}"' EXIT

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

login_cookies() {
  local email="$1"
  local password="$2"
  local label="$3"
  : > "${COOKIE_JAR}"
  local code
  code="$(curl -sS -o /tmp/argos-login.json -w "%{http_code}" -X POST "${BASE}/api/auth/login" \
    -H "Content-Type: application/json" \
    -H "Origin: ${VERIFY_ORIGIN}" \
    -c "${COOKIE_JAR}" \
    -d "$(printf '%s' "{\"email\":\"${email}\",\"password\":\"${password}\"}")")"
  [[ "${code}" == "200" ]] || fail "${label} login: esperado HTTP 200, obtenido ${code}"
  grep -q 'argos_access' "${COOKIE_JAR}" || fail "${label} login: falta cookie argos_access"
  grep -q 'argos_refresh' "${COOKIE_JAR}" || fail "${label} login: falta cookie argos_refresh"
}

echo "== GET /api/health =="
code="$(curl -sS -o /tmp/argos-health.json -w "%{http_code}" "${BASE}/api/health")"
[[ "${code}" == "200" ]] || fail "health: esperado HTTP 200, obtenido ${code}"
grep -q "OK" /tmp/argos-health.json 2>/dev/null || fail "health: cuerpo sin status esperado"

echo "== POST /api/auth/register email inválido -> 400 =="
code="$(curl -sS -o /dev/null -w "%{http_code}" -X POST "${BASE}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"no-es-un-email","password":"ValidPass123a"}')"
[[ "${code}" == "400" ]] || fail "register: esperado HTTP 400, obtenido ${code}"

echo "== POST /api/ai/public/dumbo-chat message vacío -> 400 =="
code="$(curl -sS -o /dev/null -w "%{http_code}" -X POST "${BASE}/api/ai/public/dumbo-chat" \
  -H "Content-Type: application/json" \
  -d '{"message":""}')"
[[ "${code}" == "400" ]] || fail "dumbo-chat: esperado HTTP 400, obtenido ${code}"

echo "== POST /api/ai/public/mascot-chat message vacío -> 400 =="
code="$(curl -sS -o /dev/null -w "%{http_code}" -X POST "${BASE}/api/ai/public/mascot-chat" \
  -H "Content-Type: application/json" \
  -d '{"persona":"dumbo","message":""}')"
[[ "${code}" == "400" ]] || fail "mascot-chat vacío: esperado HTTP 400, obtenido ${code}"

echo "== POST /api/ai/public/mascot-chat persona inválida -> 400 =="
code="$(curl -sS -o /dev/null -w "%{http_code}" -X POST "${BASE}/api/ai/public/mascot-chat" \
  -H "Content-Type: application/json" \
  -d '{"persona":"otro","message":"hola"}')"
[[ "${code}" == "400" ]] || fail "mascot-chat persona: esperado HTTP 400, obtenido ${code}"

echo "== POST /api/ai/public/mascot-chat mensaje válido (dumbo) -> 200 o 503 =="
code="$(curl -sS -o /tmp/argos-mascot-valid.json -w "%{http_code}" -X POST "${BASE}/api/ai/public/mascot-chat" \
  -H "Content-Type: application/json" \
  -d '{"persona":"dumbo","message":"hola"}')"
if [[ "${VERIFY_MASCOT_REQUIRES_200:-}" == "1" ]]; then
  [[ "${code}" == "200" ]] || fail "mascot-chat dumbo válido: VERIFY_MASCOT_REQUIRES_200=1 pero HTTP ${code}"
  grep -q '"reply"' /tmp/argos-mascot-valid.json || fail "mascot-chat dumbo: 200 sin reply"
else
  if [[ "${code}" == "200" ]]; then
    grep -q '"reply"' /tmp/argos-mascot-valid.json || fail "mascot-chat dumbo: 200 sin reply"
  elif [[ "${code}" == "503" ]]; then
    grep -q "assistant_unavailable" /tmp/argos-mascot-valid.json 2>/dev/null \
      || fail "mascot-chat dumbo: 503 sin assistant_unavailable"
  else
    fail "mascot-chat dumbo válido: esperado HTTP 200 o 503, obtenido ${code}"
  fi
fi

echo "== POST /api/ai/public/mascot-chat mensaje válido (chico) -> 200 o 503 =="
code="$(curl -sS -o /tmp/argos-mascot-chico.json -w "%{http_code}" -X POST "${BASE}/api/ai/public/mascot-chat" \
  -H "Content-Type: application/json" \
  -d '{"persona":"chico","message":"hola"}')"
if [[ "${VERIFY_MASCOT_REQUIRES_200:-}" == "1" ]]; then
  [[ "${code}" == "200" ]] || fail "mascot-chat chico válido: VERIFY_MASCOT_REQUIRES_200=1 pero HTTP ${code}"
  grep -q '"reply"' /tmp/argos-mascot-chico.json || fail "mascot-chat chico: 200 sin reply"
else
  if [[ "${code}" == "200" ]]; then
    grep -q '"reply"' /tmp/argos-mascot-chico.json || fail "mascot-chat chico: 200 sin reply"
  elif [[ "${code}" == "503" ]]; then
    grep -q "assistant_unavailable" /tmp/argos-mascot-chico.json 2>/dev/null \
      || fail "mascot-chat chico: 503 sin assistant_unavailable"
  else
    fail "mascot-chat chico válido: esperado HTTP 200 o 503, obtenido ${code}"
  fi
fi

echo "== POST /api/ai/public/dumbo-chat mensaje válido (compat) -> 200 o 503 =="
code="$(curl -sS -o /tmp/argos-dumbo-valid.json -w "%{http_code}" -X POST "${BASE}/api/ai/public/dumbo-chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"hola"}')"
if [[ "${VERIFY_MASCOT_REQUIRES_200:-}" == "1" ]]; then
  [[ "${code}" == "200" ]] || fail "dumbo-chat válido: VERIFY_MASCOT_REQUIRES_200=1 pero HTTP ${code}"
  grep -q '"reply"' /tmp/argos-dumbo-valid.json || fail "dumbo-chat: 200 sin reply"
else
  if [[ "${code}" == "200" ]]; then
    grep -q '"reply"' /tmp/argos-dumbo-valid.json || fail "dumbo-chat: 200 sin reply"
  elif [[ "${code}" == "503" ]]; then
    grep -q "assistant_unavailable" /tmp/argos-dumbo-valid.json 2>/dev/null \
      || fail "dumbo-chat: 503 sin assistant_unavailable"
  else
    fail "dumbo-chat válido: esperado HTTP 200 o 503, obtenido ${code}"
  fi
fi

echo "== GET /api/client/portal Bearer-only -> 401 =="
code="$(curl -sS -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.fake.payload" \
  "${BASE}/api/client/portal")"
[[ "${code}" == "401" ]] || fail "Bearer-only portal: esperado HTTP 401, obtenido ${code}"

echo "== GET /api/security/stats Bearer-only -> 401 =="
code="$(curl -sS -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.fake.payload" \
  "${BASE}/api/security/stats")"
[[ "${code}" == "401" ]] || fail "Bearer-only stats: esperado HTTP 401, obtenido ${code}"

if [[ -n "${CLIENT_EMAIL:-}" && -n "${CLIENT_PASSWORD:-}" ]]; then
  echo "== Login cookie cliente (${CLIENT_EMAIL}) =="
  login_cookies "${CLIENT_EMAIL}" "${CLIENT_PASSWORD}" "cliente"

  echo "== GET /api/security/stats cookie cliente -> 403 =="
  code="$(curl -sS -o /dev/null -w "%{http_code}" \
    -b "${COOKIE_JAR}" \
    "${BASE}/api/security/stats")"
  [[ "${code}" == "403" ]] || fail "stats cliente: esperado HTTP 403, obtenido ${code}"

  echo "== GET /api/client/portal cookie cliente -> 200 =="
  code="$(curl -sS -o /tmp/argos-portal.json -w "%{http_code}" \
    -b "${COOKIE_JAR}" \
    "${BASE}/api/client/portal")"
  [[ "${code}" == "200" ]] || fail "portal cliente: esperado HTTP 200, obtenido ${code}"
  grep -q '"user"' /tmp/argos-portal.json 2>/dev/null || fail "portal: cuerpo sin objeto user esperado"

  echo "== POST /api/auth/refresh cookie + Origin -> 200 =="
  code="$(curl -sS -o /tmp/argos-refresh.json -w "%{http_code}" -X POST "${BASE}/api/auth/refresh" \
    -H "Content-Type: application/json" \
    -H "Origin: ${VERIFY_ORIGIN}" \
    -b "${COOKIE_JAR}" -c "${COOKIE_JAR}" \
    -d '{}')"
  [[ "${code}" == "200" ]] || fail "refresh cookie: esperado HTTP 200, obtenido ${code}"

  echo "== POST /api/auth/refresh cookie sin Origin -> 403 =="
  code="$(curl -sS -o /tmp/argos-refresh-csrf.json -w "%{http_code}" -X POST "${BASE}/api/auth/refresh" \
    -H "Content-Type: application/json" \
    -b "${COOKIE_JAR}" \
    -d '{}')"
  [[ "${code}" == "403" ]] || fail "refresh CSRF: esperado HTTP 403, obtenido ${code}"
else
  echo "SKIP: CLIENT_EMAIL/CLIENT_PASSWORD no definidos (login cookie de usuario no admin)"
fi

if [[ -n "${ADMIN_EMAIL:-}" && -n "${ADMIN_PASSWORD:-}" ]]; then
  echo "== Login cookie admin (${ADMIN_EMAIL}) =="
  login_cookies "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}" "admin"

  echo "== GET /api/security/stats cookie admin -> 200 =="
  code="$(curl -sS -o /dev/null -w "%{http_code}" \
    -b "${COOKIE_JAR}" \
    "${BASE}/api/security/stats")"
  [[ "${code}" == "200" ]] || fail "stats admin: esperado HTTP 200, obtenido ${code}"
else
  echo "SKIP: ADMIN_EMAIL/ADMIN_PASSWORD no definidos (usuario admin o super_admin)"
fi

echo "OK: verify-api terminado sin errores críticos."
