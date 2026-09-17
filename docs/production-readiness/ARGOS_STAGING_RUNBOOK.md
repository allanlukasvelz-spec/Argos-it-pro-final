# ARGOS — Staging Runbook

```
DEPLOYMENT AUTHORIZED = NO (this is the procedure to follow WHEN authorized)
```

## Day-0 bring-up (when authorized)

1. Provision private host  
2. Install Docker Engine + Compose  
3. Create secret files (DB, JWT pair, S3/MinIO keys) — mode 0600  
4. Pin image digests in Compose  
5. Start postgres → wait healthy  
6. Run `database/migrate.sh` with DDL role  
7. Start object store → create private bucket  
8. Start api (`ENABLE_MONITOR_SCHEDULER=true`)  
9. Start worker (≥1)  
10. Start frontend  
11. Smoke: health, login client, login NOC, request report, worker READY, download PDF  
12. Record versions in ops log  

## Day-2

| Task | Cadence |
|------|---------|
| Check `/api/health` | continuous probe |
| Queue depth / DEAD_LETTER | daily |
| Disk use PG + objects | daily |
| Review failed report runs | daily |
| Backup | daily |
| Restore drill | monthly |
| Rotate staging secrets | quarterly or on incident |
| `npm audit` / image scan | on release |

## Incident quick actions

| Symptom | Action |
|---------|--------|
| API DEGRADED | Check PG; restart order PG→API→worker→FE |
| Reports stuck | Check worker logs; Chromium; reclaim stale |
| Duplicate alerts | Confirm single scheduler owner |
| Evidence 503 | Store connectivity; checksum; reconciliation dry-run |
| Auth failures | CORS/Origin; cookie Secure; clock skew |

## Synthetic data seed (manual)

Create disposable orgs/users via register or SQL fixtures — never prod dump.
