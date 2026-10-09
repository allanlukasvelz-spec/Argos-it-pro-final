# ARGOS — Backup / Restore Drill Result

```
DRILL_DATE = 2026-08-26
PRIMARY_DESTROYED = NO
ISOLATED_TARGET = YES (project argos-staging-restore, ports 4011/3011)
CUSTOMER_DATA = NO
```

## Backup artifact

| Field | Value |
|-------|-------|
| Stamp | `20260826T003914Z` |
| Path | `var/staging-backups/20260826T003914Z/` (gitignored) |
| Postgres | custom format dump; bytes≈183027; sha256 recorded |
| Objects | 1 evidence object mirrored via `mc mirror` |
| Verification | `pg_restore -l` + manifest + sha256 files |

## Restore sequence

1. Tear down prior restore volumes  
2. Start restore postgres + minio  
3. `DROP SCHEMA public CASCADE` on **restore** DB only  
4. `pg_restore` from dump  
5. `mc mirror` objects into restore MinIO  
6. Start API/worker/frontend on **4011/3011**  
7. `/api/ready` = READY  

## Post-restore checks

| Check | Result |
|-------|--------|
| ≥2 organizations | PASS |
| evidence_objects row + GET bytes | PASS |
| SHA-256 match metadata | PASS |
| report_runs status READY | PASS |
| notifications row present | PASS |
| platform_jobs coherent (RETRY_WAIT/QUEUED ok) | PASS |
| reconcile dry-run unexpected divergence | none observed (findings empty / OK path) |
| Tenant primary staging intact | PASS (primary still on :4010) |

## RPO/RTO claim

Staging drill only — **not** a production RTO commitment. Restore wall-clock was on the order of minutes for synthetic dataset.
