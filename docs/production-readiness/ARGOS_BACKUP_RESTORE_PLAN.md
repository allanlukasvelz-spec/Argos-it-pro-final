# ARGOS — Backup & Restore Plan

```
STATUS = TARGET DESIGN
VALIDITY = backup not valid until restore demonstrated
```

## 1. What to back up

| Asset | Method | Notes |
|-------|--------|-------|
| PostgreSQL | `pg_dump` custom format + WAL/PITR when available | Orgs, incidents, jobs, evidence **metadata** |
| Object store bytes | Volume snapshot / `mc mirror` / S3 versioning | Evidence PDFs etc. |
| Config inventory | Secret references list (not values) | Env names + versions |
| Image digests | Compose lock / digest pin | Reproducible rollback |

## 2. Local/staging drill (required before claiming readiness)

1. Take Postgres dump  
2. Snapshot object store root or MinIO bucket  
3. Restore into **isolated** database name  
4. Point a throwaway API+worker at restore (local compose profile)  
5. Verify:
   - `/api/health` OK  
   - Tenant A cannot see Tenant B  
   - Incident rows present  
   - `evidence_objects` metadata + byte GET + SHA-256  
   - Report READY download  
   - `platform_jobs` statuses coherent (no false READY)  
6. Record wall-clock restore time  

## 3. Targets (aspirational — not current capability claims)

| Metric | Staging TARGET | Production FUTURE |
|--------|----------------|-------------------|
| RPO | ≤ 24h (S0) → ≤ 1h (S1) | ≤ 15m with PITR |
| RTO | ≤ 4h manual drill | ≤ 1h practiced |

## 4. CURRENT gaps

- No automated backup job in repo Compose  
- Local evidence dir may be unbacked  
- MinIO POC has no replication policy  
- No documented last successful restore date  

## 5. Failure if skipped

A dump that never restores is theater. Gate **G5 Restore verified** blocks production forever until green.
