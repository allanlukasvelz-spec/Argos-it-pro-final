# AGENTS.md

## Cursor Cloud specific instructions

### Services overview

| Service | Port | Start command |
|---------|------|---------------|
| **PostgreSQL 16** | 5432 | `sudo pg_ctlcluster 16 main start` |
| **Backend (Express)** | 4000 | `npm --prefix backend run dev` |
| **Frontend (Next.js)** | 3000 | `npm run dev` (from root) |

### Quick reference

- **Lint/verify**: `npm run verify` (runs frontend lint + build + backend syntax checks).
- **E2E tests**: `npx playwright test` (requires Chromium installed via `npx playwright install chromium --with-deps`). The Playwright config reuses an already-running dev server on port 3000 when `CI` is not set.
- **Backend syntax check only**: `npm run verify:backend`.
- See `README.md` for curl-based API smoke tests.

### Environment setup notes

- PostgreSQL must be running before the backend starts; the backend crashes without `DATABASE_URL`.
- Backend env: `backend/.env` (copy from `backend/.env.example`). Required: `DATABASE_URL`, `JWT_SECRET` (>=32 chars), `JWT_REFRESH_SECRET`.
- Frontend env: `frontend/.env.local` (copy from `frontend/.env.example`). Required: `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4000`.
- The database schema is in `database/schema.sql`; apply with `psql "$DATABASE_URL" -f database/schema.sql`.
- `OPENAI_API_KEY` is optional; without it AI endpoints return 503 and the UI shows a contact fallback.
- `ENABLE_SOCKET_IO=false` in backend `.env` disables WebSockets (no frontend client exists yet).

### Gotchas

- The frontend `lint` script is actually `tsc --noEmit` (TypeScript check), not ESLint.
- `npm run test:e2e` rebuilds before running Playwright; if you already have a build, run `npx playwright test` directly to save time.
- Password validation requires >= 10 characters.
- The `npm run build` at the root proxies to `npm --prefix frontend run build`.
