# ARGOS — Service Inventory

```
SOURCE = code @ 93b838f
```

## Runtime processes

| Service | Purpose | Command | Port | Protocol | Dependencies | Stateful? | Health | Scale constraint |
|---------|---------|---------|------|----------|--------------|-----------|--------|------------------|
| **frontend** | Public + Client + NOC UI | `next start --hostname 0.0.0.0 --port 3000` | 3000 | HTTP | API | Stateless (build artifact) | HTTP 200 `/` | Horizontal OK behind edge |
| **api** | Express REST + optional WS | `node backend/server.js` | 4000 | HTTP | PostgreSQL, evidence store | Semi (in-memory rate limits; embeds scheduler) | `GET /api/health` | **Scheduler: 1 owner only** |
| **worker** | Phase 8 jobs (`REPORT_GENERATE`) | `node backend/worker.js` | none | — | PostgreSQL, evidence store, Playwright Chromium | Stateless claim via PG | Process up + jobs moving | Horizontal OK (`SKIP LOCKED`) |
| **postgres** | Transactional store | PostgreSQL 16 | 5432 | PG | disk | **Stateful** | `pg_isready` / API health | Primary; replicas later |
| **object store** | Evidence bytes | Local FS or S3 API | 9000/9010 if MinIO | S3 HTTP | disk | **Stateful** | `head` bucket / store head | Backend-specific |
| **agent** | Customer-side observation | `node agents/argos-agent-ref` | none inbound | HTTPS out | API enroll/heartbeat | Local spool file | Heartbeat freshness | N agents |

## Background / in-process

| Unit | Lives in | Enable flag | Notes |
|------|----------|-------------|-------|
| Monitor scheduler | **API process** | `ENABLE_MONITOR_SCHEDULER≠false` | Tick 15s, concurrency 3, batch 10; **no SKIP LOCKED** |
| Socket.IO | API | `ENABLE_SOCKET_IO≠false` | Prefer `false` in staging until WS productized |
| Express rate-limit stores | API memory | always | Not shared across API replicas |

## Startup order (staging TARGET)

```
1. postgres healthy
2. migrate job (DDL role) complete
3. object store reachable
4. api (ENABLE_MONITOR_SCHEDULER=true on ONE instance only)
5. worker (≥1)
6. frontend
7. synthetic agents (optional)
```

## Shutdown

| Process | Expectation CURRENT | Staging TARGET |
|---------|---------------------|----------------|
| API | Node default SIGTERM | Drain HTTP; stop scheduler timer; close PG pool |
| Worker | Loop `setTimeout`; no explicit drain | Finish current job or mark RETRY_WAIT; exit |
| Frontend | Next SIGTERM | Standard |
| Postgres | Controlled stop | Controlled stop after app drain |

## Resource estimates (S0 staging — estimate)

| Service | CPU | RAM |
|---------|-----|-----|
| frontend | 0.5 | 512MB–1GB |
| api | 1 | 512MB–1GB |
| worker | 1–2 | **1.5–3GB** (Chromium) |
| postgres | 1–2 | 1–2GB |
| minio | 0.5 | 512MB |

## Security boundary

| Service | Trust |
|---------|-------|
| frontend | Untrusted clients; auth in API |
| api | AuthZ + tenant scope |
| worker | Trusted internal; no public ingress |
| postgres / minio | Private network only |
| agent | Least privilege observation credentials |
