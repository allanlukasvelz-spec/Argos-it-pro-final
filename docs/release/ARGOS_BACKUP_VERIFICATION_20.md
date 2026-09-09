# ARGOS_BACKUP_VERIFICATION_20

```
ARGOS_BACKUP_VERIFICATION_20 = PASS_FULL
TIMESTAMP                    = 2026-09-03T18:29:04Z
MODE                         = SURGICAL / DISASTER-RECOVERY EVIDENCE / READ-ONLY PRODUCTION
PRODUCTION_MUTATED           = NO
MISSION20_REPORT_STAGED      = NO
```

## Canonical production (unchanged)

| Field | Value |
|-------|-------|
| PRODUCTION_SHA | `12678f37997479b6f58f11b16947a14e40309910` |
| PRODUCTION_TREE | `e0d7bfa767576e2b6846d44600da23df3511db19` |
| SOURCE_BRANCH | `deploy/production-v1` |
| PRE/POST WEB_HTTP | 200 |
| PRE/POST API_HEALTH | PASS (`OK` / `connected`) |
| PRE/POST runtime images | web+API on `12678f3…` |

## Previous canonical backup

| Field | Value |
|-------|-------|
| Reference | `pg-dump-postgres-1788332702.dmp` |
| Size | 38241 |
| SHA256 | `cad6b1d77e721bb1ade53da64622de56556efbd094f19f8a3a1e019f68a4c003` |
| mtime (UTC) | 2026-09-02 07:05:05 |
| Prior verification level | Mission 18: object + size + SHA256 (STRUCTURAL / LEVEL≈2–3; no Mission-18 isolated restore of this file recorded) |

## Candidate object

| Field | Value |
|-------|-------|
| Reference | `pg-dump-postgres-1788393629.dmp` |
| Path | `/data/coolify/backups/databases/root-team-0/argos-it-production-db-iw42qpqc1w1umsddrl9fwpi9/pg-dump-postgres-1788393629.dmp` |
| Found / unique | YES / count=1 |
| Accessible | YES |
| Size | 38241 |
| SHA256 | `7b7ae2cebaa40e8fac89bc246051df8a3a6b006ab88671cc7af31b789fa7b68c` |
| mtime (UTC) | 2026-09-03 00:00:34 |
| Newer than previous | YES |
| Remote store checksum | NOT_AVAILABLE (Coolify host filesystem; ETag not treated as SHA-256) |

## Format & structural validation

| Field | Value |
|-------|-------|
| Format | PostgreSQL custom database dump v1.15-0 (`PGDMP`) |
| Format valid | YES |
| `pg_restore --list` exit | 0 |
| Catalog lines | 127 |
| Tables | 12 |
| Table DATA TOC | 12 |
| Indexes TOC | 13 |
| Obvious truncation | NO |
| Table names | activity_logs, ai_memory, client_diagnostics, client_improvements, client_messages, client_services, form_submissions, refresh_sessions, security_logs, services, users, website_audits |

## Shape vs production

| Field | Value |
|-------|-------|
| PRODUCTION_PUBLIC_TABLE_COUNT | 12 (Mission 18 authoritative observation; release SHA unchanged) |
| BACKUP_TABLE_COUNT | 12 |
| CRITICAL_TABLE_SET_MATCH | YES |
| SCHEMA_SHAPE_PLAUSIBLE | YES |

## Isolated restore

| Field | Value |
|-------|-------|
| Isolation proof | Disposable local Docker `argos-m20-pg-validate`, `--network none`, no published ports; not Coolify prod volume `postgres-data-iw42qpqc1w1umsddrl9fwpi9` |
| RESTORE_TARGET | `argos_m20_1788393629` |
| RESTORE_TARGET_IS_PRODUCTION | NO |
| Restore window | 2026-09-03T18:28:31Z → 2026-09-03T18:28:31Z |
| Restore exit | 0 |
| Restore errors | none |
| Connect / schema / tables | PASS / PASS / PASS (12) |
| Critical tables selectable | PASS |
| Row-count metadata (no contents) | security_logs=7; other listed critical tables=0 |
| Data plausibility | PASS_WITH_NOTE (restorable; sparse counts observed — not a production live row audit) |

App-level restore stack check: NOT required for this mission objective.

## Classification & promotion

| Field | Value |
|-------|-------|
| Classification | VERIFIED_RESTORABLE |
| Candidate verification level | LEVEL 6 (object + checksum + format + catalog + shape + isolated restore + integrity) |
| Meets/exceeds prior Mission-18 standard for previous dump | YES |
| LATEST_VERIFIED_BACKUP | `pg-dump-postgres-1788393629.dmp` |

## Recovery readiness

| Field | Value |
|-------|-------|
| BACKUP_AVAILABLE | YES |
| BACKUP_READABLE | YES |
| BACKUP_CHECKSUM_KNOWN | YES |
| RESTORE_PROCEDURE_EXISTS | YES (DR docs + proven Mission 20 path) |
| RESTORE_TARGET_REQUIREMENTS_KNOWN | YES (isolated disposable Postgres; never production volume) |
| RECOVERY_CREDENTIAL_DEPENDENCY_KNOWN | YES (not disclosed) |
| RECOVERY_READINESS | PASS_WITH_LIMITATIONS (mechanics proven; live prod row-count parity not re-audited in Mission 20; observed sparse restored counts) |
| OBSERVED_BACKUP_AGE | ≈18.5h at verification time (factual age only; not an RPO SLA) |

## Mutation attestation

```
PRODUCTION_DB_MUTATED = NO
COOLIFY_MUTATED       = NO
ENV_MUTATED           = NO
GIT_MUTATED           = NO
SOURCE_CODE_MUTATED   = NO (report file created unstaged only)
AI_CONFIG_MUTATED     = NO
SECRET_EXPOSURE_EVENT = NO
CUSTOMER_DATA_EXPOSED_IN_REPORT = NO
```

## Temp resources

| Resource | Created | Removed |
|----------|---------|---------|
| Local `/tmp/argos-backup-validation-20` | YES | YES |
| Local Docker `argos-m20-pg-validate` | YES | YES |
| Remote `/tmp/argos-backup-validation-20` | YES | YES (cleanup attempted) |
| Backup objects in Coolify path | N/A (pre-existing) | NOT removed |

## Red-team residual notes

1. Truncation/corrupt: mitigated by SHA-256 + `pg_restore --list` + restore exit 0.
2. Wrong object: exact filename, unique path count=1, chronology vs prior dump.
3. Accidental prod restore: prevented; restore used local disposable container only.
4. Catalog ≠ restorability: actual restore executed.
5. Newer-worse: verification level exceeds prior Mission-18 structural standard.
6. Data leak: counts only; no row contents in report.
7. Production mutation: post-gate health PASS; SHA unchanged.
