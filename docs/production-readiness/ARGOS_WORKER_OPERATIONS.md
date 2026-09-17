# ARGOS — Worker Operations

```
COMMAND CURRENT = node backend/worker.js
COMPOSE CURRENT = not included
```

## Lifecycle

| Phase | Behavior |
|-------|----------|
| Start | `configureEvidenceStore`, ensure evidence + Phase 8 tables, poll loop |
| Poll | `ARGOS_WORKER_POLL_MS` default 2000 |
| Claim | `FOR UPDATE SKIP LOCKED` on QUEUED/RETRY_WAIT |
| Run | `markRunning` → `dispatchJob` → `markCompleted` / `markFailed` |
| Stale | Claim >15m → RETRY_WAIT |
| Dead letter | attempts ≥ max_attempts (default 5) |

## Concurrency

Multiple workers safe for **distinct** jobs via SKIP LOCKED.  
Same logical report protected by evidence/job idempotency keys.

## Chromium

- Real PDF requires Playwright Chromium  
- Stub `ARGOS_REPORT_PDF_STUB=1` **forbidden** in staging principal path  
- Network aborted in renderer (SSRF control)  
- Document exception: container may need `--no-sandbox` / shared mem  

## Failure protections (TARGET)

| Risk | Control |
|------|---------|
| PDF bomb / huge HTML | Size limits on model fields + renderer timeout |
| Chromium hang | Job timeout → kill browser → RETRY_WAIT |
| OOM | cgroup memory limit; restart policy |
| Storage timeout | Fail run STORAGE_FAILED; retry bounded |
| DB disconnect | markFailed / process exit + supervisor restart |
| Temp files | Clean browser contexts every job |

## Resource recommendation (estimate)

- RAM **≥ 2GB** per worker with Chromium  
- CPU 1–2  
- Disk for temp + evidence if local  

## Staging ops

1. Add `worker` service to staging Compose  
2. Health: process up + `platform_jobs` progressing OR heartbeat file TARGET  
3. Alert if queue age > threshold with workers “up”  

## Known code gap

`NOTIFICATION_DELIVER` listed in allowed job types but **no handler** — do not enqueue until implemented or remove from allowlist in a future fix gate.
