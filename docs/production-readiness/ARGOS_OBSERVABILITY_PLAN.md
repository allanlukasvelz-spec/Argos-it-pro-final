# ARGOS — Observability Plan

```
CURRENT = morgan + console + /api/health + activity/security logs in PG
OTEL/SENTRY = not wired
```

## 1. CURRENT hooks

| Signal | Where |
|--------|-------|
| HTTP access | `morgan("combined")` |
| App errors | `console.error` |
| Telemetry helper | no-op unless `ARGOS_PLATFORM_TELEMETRY_LOG=1` |
| Platform health UI | NOC chip from DB ping + meaning text |
| Audit | `activity_logs`, `security_logs` |

## 2. Distinguish health types

| Endpoint concept | Meaning |
|------------------|---------|
| Liveness | Process up |
| Readiness | Dependencies OK (DB, optionally store) |
| Platform health | ARGOS core — **not** customer estate |
| Customer health | Per-tenant monitors/incidents |

CURRENT `/api/health` ≈ readiness for DB only.

## 3. Minimum staging observability (before full LGTM)

1. Centralize container logs (journald / Docker logging driver)  
2. Retain API+worker logs ≥ 14 days staging  
3. Alert on:
   - API `/api/health` ≠ 200  
   - Frontend probe fail  
   - Worker process down  
   - Job queue age / DEAD_LETTER growth  
   - Disk > 85%  
   - Postgres connections near max  
4. Optional: JSON log lines with `requestId` TARGET  

## 4. Staged adoption (do not install all now)

| Stage | Add |
|-------|-----|
| S0 | Logs + health probes + disk |
| S1 | Queue/worker metrics counters (app-emitted) |
| S2 | OTel traces + Prometheus + Grafana (port registry TARGET) |
| Later | Sentry for exception POC if authorized |

## 5. Meta-monitoring (who watches ARGOS)

**Avoid circular dependency:** do not use only ARGOS customer monitors to watch ARGOS itself.

| Check | External mechanism |
|-------|--------------------|
| API/frontend down | Uptime robot / edge synthetic / host cron curl |
| DB down | Same via health or `pg_isready` from supervisor |
| Backup fail | Backup job exit status → pager |
| Disk full | Node exporter / host alert |

## 6. Privacy

No secrets in logs. Sanitize evidence payloads already used in producers — keep that discipline.
