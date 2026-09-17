#!/usr/bin/env bash
# Generate Playwright visual regression golden snapshots on Linux (CI platform parity).
# Run via: docker compose -f docker-compose.visual-baseline.yml run --rm visual-baseline
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export CI=1
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
export ARGOS_COOKIE_SECURE=0
export ENABLE_SOCKET_IO=false
export AUTH_RATE_LIMIT_MAX=40

echo "[visual-baseline] platform=$(uname -s) node=$(node -v) playwright=$(npx playwright --version)"

if ! command -v psql >/dev/null 2>&1; then
  echo "[visual-baseline] installing postgresql-client (Playwright image omits psql)..."
  apt-get update -qq && apt-get install -y -qq postgresql-client >/dev/null
fi

echo "[visual-baseline] waiting for PostgreSQL..."
for i in $(seq 1 60); do
  if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
psql "$DATABASE_URL" -c "SELECT 1" >/dev/null

echo "[visual-baseline] resetting database (CI-fresh parity)..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

echo "[visual-baseline] applying schema..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/schema.sql

echo "[visual-baseline] installing dependencies..."
npm ci
npm ci --prefix backend
npm ci --prefix frontend

echo "[visual-baseline] clearing host .next cache (avoids cross-platform type conflicts)..."
rm -rf frontend/.next

echo "[visual-baseline] building (CI E2E parity: production build after verify step)..."
npm run build

if [ -n "${VISUAL_UPDATE_GREP:-}" ]; then
  echo "[visual-baseline] updating Linux chromium snapshots for: ${VISUAL_UPDATE_GREP}"
  npx playwright test e2e/00-visual-regression.spec.ts --grep "$VISUAL_UPDATE_GREP" --update-snapshots
else
  echo "[visual-baseline] updating all Linux chromium visual snapshots..."
  npx playwright test e2e/00-visual-regression.spec.ts --update-snapshots
fi

echo "[visual-baseline] verifying full visual-regression suite (maxDiffPixels=0)..."
npx playwright test e2e/00-visual-regression.spec.ts

ls -la e2e/visual-regression.spec.ts-snapshots/*-chromium-linux.png
echo "[visual-baseline] done."
