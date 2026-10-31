# ARGOS — External Staging Backup & Restore

```
SAME_VM_ONLY_BACKUP = INSUFFICIENT
RESTORE_AGAINST_PRIMARY = FORBIDDEN
CUSTOMER_DATA = NO
```

Local scripts remain canonical for mechanics:

- `scripts/staging/backup.sh`
- `scripts/staging/restore-drill.sh`
- [ARGOS_BACKUP_RESTORE_PLAN.md](./ARGOS_BACKUP_RESTORE_PLAN.md)
- [ARGOS_BACKUP_RESTORE_DRILL_RESULT.md](./ARGOS_BACKUP_RESTORE_DRILL_RESULT.md) (local evidence)

## What must be backed up (external)

| Asset | Method | Off-host |
|-------|--------|----------|
| PostgreSQL | `pg_dump` custom + checksum | YES — copy to second location |
| Object bytes | `mc mirror` / S3 sync / volume snapshot | YES |
| Image digests + Git SHA | Manifest file beside backup | YES |
| Config inventory | Secret **names** + versions (not values) | YES |
| Encryption | Age/GPG or SSE on destination | YES |

## Off-host destinations (choose via D5)

| Destination | Notes |
|-------------|-------|
| Second region object bucket | Preferred for S0 cost/simplicity |
| Separate backup VPS / NAS | Acceptable if geographically distinct |
| Provider snapshot only | Insufficient alone without object store + dump |

## Targets (external staging)

| Metric | Target |
|--------|--------|
| RPO | ≤ 24h (S0) |
| RTO | ≤ 4h for isolated restore drill |
| Retention | ≥ 7 daily + 4 weekly (tune via D5/D6) |
| Visibility | Backup age + last success exposed to external monitor |

## Restore model

1. Never restore onto the live primary staging DB  
2. Use isolated Compose project (`docker-compose.staging.restore.yml` pattern) or separate VM  
3. Verify: health, G12 sample, evidence SHA-256, one READY report  
4. Record wall-clock + Git SHA of code used for verify  

## Failure visibility

| Failure | Signal |
|---------|--------|
| Backup job non-zero exit | Host cron + external alert |
| Dump missing / zero bytes | Size + SHA check |
| Off-host sync fail | Destination probe |
| Silent stop | “backup age > 36h” external check |

## Residual risk

Local-validated backup **does not** prove off-host replication until the first external drill after infrastructure exists.
