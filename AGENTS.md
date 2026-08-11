# AGENTS.md

## Cursor Cloud specific instructions

### Services overview

| Service | Port | Start command |
|---------|------|---------------|
| **PostgreSQL 16** | 5432 | `sudo pg_ctlcluster 16 main start` |
| **Backend (Express)** | 4000 | `npm --prefix backend run dev` |
| **Frontend (Next.js)** | 3000 | `npm run dev` (from root) |

PostgreSQL must be running before the backend starts; the backend crashes without `DATABASE_URL`.

### Quick reference

- **Lint/verify**: `npm run verify` (frontend TypeScript + build + backend syntax checks). See `README.md` for details.
- **E2E tests**: `npx playwright test` (requires `npx playwright install chromium --with-deps` first). The Playwright config reuses an already-running dev server on port 3000 when `CI` is not set.
- **API smoke tests**: `./scripts/verify-api.sh` (requires backend running on port 4000).

### Environment setup notes

- Backend env: `backend/.env` (copy from `backend/.env.example`). Required: `DATABASE_URL`, `JWT_SECRET` (>=32 chars), `JWT_REFRESH_SECRET` (>=32 chars, must differ from `JWT_SECRET`).
- Frontend env: `frontend/.env.local` (copy from `frontend/.env.example`). Required: `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4000`.
- Database schema: `database/schema.sql`. Apply with `psql "$DATABASE_URL" -f database/schema.sql`.
- `OPENAI_API_KEY` is optional; without it AI endpoints return 503 and the UI shows a contact fallback.
- `ENABLE_SOCKET_IO=false` disables WebSockets (no frontend client exists yet).

### Gotchas

- The frontend `lint` script is `tsc --noEmit` (TypeScript check), not ESLint.
- `npm run test:e2e` rebuilds before running Playwright; if you already have a build, run `npx playwright test` directly.
- Password validation requires >= 10 characters with uppercase, lowercase, and digits.
- `POST /api/auth/logout` revokes the refresh session server-side; the frontend calls it with a 5-second timeout before clearing local state in a `finally` block.
- `/api/health` pings the database; returns 503 with `{ status: "DEGRADED", db: "disconnected" }` if PostgreSQL is unreachable.
- `express.json` body limit is 512KB (not 10MB); payloads over 512KB get HTTP 413.
