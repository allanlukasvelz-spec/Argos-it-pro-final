# AGENTS.md

## Cursor Cloud specific instructions

### Overview

ARGOS-IT is a premium IT consultancy web platform with two main services:
- **Backend** (Express/Node.js on port 4000) — REST API + optional Socket.IO
- **Frontend** (Next.js 16 App Router on port 3000) — SSR + client-side React app
- **PostgreSQL 16** — required database

See `README.md` for full documentation of scripts, environment variables, and verification checklists.

### Starting services

1. **PostgreSQL** must be running before the backend starts. Start with:
   ```
   sudo pg_ctlcluster 16 main start
   ```
2. **Backend**: `npm --prefix backend run dev` (nodemon, port 4000). Requires `backend/.env` with `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.
3. **Frontend**: `npm run dev` from root (or `npm --prefix frontend run dev`), port 3000. Requires `frontend/.env.local` with `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4000`.

### Environment files (not committed)

- `backend/.env` — copy from `backend/.env.example`. Minimum needed for local dev:
  - `DATABASE_URL=postgresql://postgres:devpassword@127.0.0.1:5432/argos_it`
  - `JWT_SECRET` and `JWT_REFRESH_SECRET` (each ≥32 chars)
  - `ENABLE_SOCKET_IO=false` (unless testing WebSockets)
  - `OPENAI_API_KEY` is optional; without it, AI chat returns 503 gracefully
- `frontend/.env.local` — copy from `frontend/.env.example`. Minimum: `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4000`

### Lint / verify / test

- `npm run verify` — lint (tsc) + build frontend + syntax-check backend JS files
- `npm run verify:frontend` — `tsc --noEmit` + `next build`
- `npm run verify:backend` — `node --check` on key backend files
- `npm run test:e2e` — builds frontend, then runs Playwright (chromium) smoke tests; install browser first with `npx playwright install chromium --with-deps`
- E2E tests do **not** require the backend; they test the Next.js frontend via `next start` (production mode)

### Gotchas

- The backend auto-creates the `refresh_sessions` table on startup via `ensureRefreshSessions.js`, so you only need to run `database/schema.sql` once for initial setup.
- `next build` can fail with "Another next build process is already running" if a previous build/Playwright process is still alive. Kill the stale process or `rm -rf frontend/.next` and retry.
- Node 22 works fine despite CI targeting Node 20.
- `pg_hba.conf` defaults to `peer` auth. For password-based `DATABASE_URL` connections, switch to `md5` for `local all all` and `local all postgres` entries, then `sudo pg_ctlcluster 16 main reload`.
