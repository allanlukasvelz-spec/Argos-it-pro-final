#!/usr/bin/env bash
# Fast Linux visual determinism probe (node:24-bookworm + PostgreSQL). Does not update baselines.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export CI=1
export VISUAL_DETERMINISM=1
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@postgres:5432/argos_it}"
export JWT_SECRET="${JWT_SECRET:-test_secret_123456789012345678901234567890}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-refresh_secret_123456789012345678901234}"
export PORT=4000
export NODE_ENV=test
export FRONTEND_URL=http://127.0.0.1:3000
export CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
export NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4000
export E2E_ORIGIN=http://127.0.0.1:3000
export E2E_BACKEND_URL=http://127.0.0.1:4000
export E2E_DEDICATED=1
export ARGOS_COOKIE_SECURE=0
export ENABLE_SOCKET_IO=false
export AUTH_RATE_LIMIT_MAX=40

echo "[visual-determinism] platform=$(uname -s) node=$(node -v)"

if ! command -v psql >/dev/null 2>&1 || ! command -v npx >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq postgresql-client >/dev/null
  npx playwright install --with-deps chromium
fi

for i in $(seq 1 60); do
  if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then break; fi
  sleep 1
done
psql "$DATABASE_URL" -c "SELECT 1" >/dev/null

echo "[visual-determinism] fresh database..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/schema.sql

if [ ! -d node_modules ]; then npm ci; fi
if [ ! -d backend/node_modules ]; then npm ci --prefix backend; fi
if [ ! -d frontend/node_modules ]; then npm ci --prefix frontend; fi

rm -rf frontend/.next artifacts/visual-determinism
npm run build

echo "[visual-determinism] dashboard 10x..."
npx playwright test --config=playwright.determinism.config.ts e2e-diagnostics/visual-dashboard-determinism.spec.ts

echo "[visual-determinism] home + metodo 10x..."
npx playwright test --config=playwright.determinism.config.ts e2e-diagnostics/visual-public-determinism.spec.ts

echo "[visual-determinism] done."
