#!/usr/bin/env bash
# Smoke del API ARGOS-IT. Requiere backend en marcha.
# Uso:
#   ./scripts/verify-api.sh
#   BASE_URL=http://localhost:4000 TOKEN_CLIENT=... TOKEN_ADMIN=... TOKEN_REFRESH=... ./scripts/verify-api.sh
#
# Opcional: VERIFY_MASCOT_REQUIRES_200=1 — exige HTTP 200 en mascot-chat/dumbo-chat con mensaje válido
# (staging con OPENAI_API_KEY en el servidor del API).
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4000}"
BASE="${BASE_URL%/}"

fail() {
  echo "FAIL: $*" >&2
  exit 1
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

if [[ -n "${TOKEN_CLIENT:-}" ]]; then
  echo "== GET /api/security/stats JWT cliente -> 403 =="
  code="$(curl -sS -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${TOKEN_CLIENT}" \
    "${BASE}/api/security/stats")"
  [[ "${code}" == "403" ]] || fail "stats cliente: esperado HTTP 403, obtenido ${code}"

  echo "== GET /api/client/portal JWT cliente -> 200 =="
  code="$(curl -sS -o /tmp/argos-portal.json -w "%{http_code}" \
    -H "Authorization: Bearer ${TOKEN_CLIENT}" \
    "${BASE}/api/client/portal")"
  [[ "${code}" == "200" ]] || fail "portal cliente: esperado HTTP 200, obtenido ${code}"
  grep -q '"user"' /tmp/argos-portal.json 2>/dev/null || fail "portal: cuerpo sin objeto user esperado"
else
  echo "SKIP: TOKEN_CLIENT no definido (JWT de usuario sin rol admin)"
fi

if [[ -n "${TOKEN_ADMIN:-}" ]]; then
  echo "== GET /api/security/stats JWT admin -> 200 =="
  code="$(curl -sS -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${TOKEN_ADMIN}" \
    "${BASE}/api/security/stats")"
  [[ "${code}" == "200" ]] || fail "stats admin: esperado HTTP 200, obtenido ${code}"
else
  echo "SKIP: TOKEN_ADMIN no definido (JWT de role admin o super_admin)"
fi

if [[ -n "${TOKEN_REFRESH:-}" ]]; then
  echo "== POST /api/auth/refresh -> 200 y token =="
  payload="$(printf '%s' "{\"refreshToken\":\"${TOKEN_REFRESH}\"}")"
  code="$(curl -sS -o /tmp/argos-refresh.json -w "%{http_code}" -X POST "${BASE}/api/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "${payload}")"
  [[ "${code}" == "200" ]] || fail "refresh: esperado HTTP 200, obtenido ${code}"
  grep -q '"token"' /tmp/argos-refresh.json 2>/dev/null || fail "refresh: respuesta sin campo token"
else
  echo "SKIP: TOKEN_REFRESH no definido (refresh JWT del login)"
fi

echo "OK: verify-api terminado sin errores críticos."
