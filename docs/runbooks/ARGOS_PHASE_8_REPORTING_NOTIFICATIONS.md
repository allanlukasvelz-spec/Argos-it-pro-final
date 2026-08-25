# ARGOS Phase 8 — Reporting & In-App Notifications Runbook

```
LOCAL/TEST ONLY unless explicitly approved for production
EMAIL = NOT CONFIGURED
```

## Services

| Process | Command | Port |
|---------|---------|------|
| API | `npm --prefix backend run dev` | 4000 |
| Worker | `node backend/worker.js` | — |
| Frontend | `npm run dev` | 3000 |

## Environment

| Variable | Purpose |
|----------|---------|
| `ARGOS_REPORT_PDF_STUB=1` | Test/minimal PDF without Chromium |
| `ARGOS_WORKER_POLL_MS` | Worker poll interval (default 2000) |
| `ARGOS_EVIDENCE_STORE` | `local` (default) or `s3` |

## Request incident report (Client)

```
POST /api/client/reports
{ "incidentId": 123 }
```

Returns 202 with `reportId`, `runId`, `status: QUEUED`.

Worker must be running to reach READY.

## Dead letter

```sql
SELECT * FROM platform_jobs WHERE status = 'DEAD_LETTER' ORDER BY id DESC;
```

NOC retry:

```
POST /api/noc/reports/runs/:runId/retry
```

## Rollback migration 007

```bash
psql "$DATABASE_URL" -f database/migrations/007_phase8_reports_notifications_down.sql
```

Does not delete evidence artifacts in object store.

## Invariants

- FAILED ≠ READY
- UNKNOWN ≠ HEALTHY in report copy
- Tenant isolation on all report/notification queries
- No email in MVP
