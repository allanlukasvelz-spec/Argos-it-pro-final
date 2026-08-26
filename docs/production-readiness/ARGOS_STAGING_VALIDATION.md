# ARGOS — Staging Validation

```
VALIDATED_AT = 2026-08-26
CUSTOMER_DATA = NO
SYNTHETIC_ONLY = YES
```

## Stack boot

| Check | Result |
|-------|--------|
| Compose up --build | PASS |
| migrate forward-only | PASS |
| API `/api/live` | PASS |
| API `/api/ready` | PASS (db+schema+evidence store) |
| Worker supervised + healthy heartbeat | PASS |
| Frontend published 127.0.0.1:3010 | PASS |
| Scheduler instances | 1 (API only) |

## Synthetic seed

Seeded org A/B, asset, incident, agent metadata, evidence object, report_run READY, notification, platform job.

## Regression (host)

| Suite | Result |
|-------|--------|
| `npm run verify:backend` | PASS (216+ unit tests) |
| `npm --prefix frontend run lint` | PASS |
| E2E Playwright full | NOT re-run in this gate (G13 SKIP — run separately) |
| Phase 6–8 product suites | Covered by verify:backend + prior phase docs; staging ops gate focus |

## Staging-specific

| Check | Result |
|-------|--------|
| Backup verified (size+sha256+pg_restore -l) | PASS |
| Restore isolated project `:4011` | PASS |
| Evidence SHA-256 after restore | PASS |
| Report run READY after restore | PASS |
| Notifications present after restore | PASS |
| Security red-team | PASS |
| Meta-health probe | PASS |
| Failure injection | PASS |
| Rollback rehearsal (no down SQL) | PASS |

## Commands used

```bash
bash scripts/staging/up.sh
docker exec argos-staging-api node scripts/staging-seed-synthetic.js
bash scripts/staging/backup.sh
bash scripts/staging/restore-drill.sh var/staging-backups/<stamp>
bash scripts/staging/security-redteam.sh
bash scripts/staging/meta-health-probe.sh
bash scripts/staging/failure-injection.sh
bash scripts/staging/rollback-rehearsal.sh
npm run verify:backend
```
