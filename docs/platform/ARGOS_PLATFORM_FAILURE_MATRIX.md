# ARGOS Platform Failure Matrix

```
DATE = 2026-08-25
MODEL = A → verify → B → C → SAFE STOP / ROLLBACK / HUMAN
```

## Per adoption class

| Failure | Action A | B | C |
|---------|----------|---|---|
| INSTALL FAIL | Retry pinned image | Alternate registry | Abort; keep old stack |
| BOOT FAIL | Restart + healthcheck | Roll previous image | Disable new service; ARGOS core alone |
| AUTH FAIL | Rotate creds | Break-glass env | Disable connector; UNKNOWN |
| NETWORK FAIL | Retry/backoff | Failover endpoint | Mark DEGRADED/UNKNOWN |
| STORAGE FAIL | Retry write | Quarantine path | Reject uploads; alert NOC |
| TENANT FAIL | Deny request | Audit | Incident |
| DATA CORRUPT | Integrity check | Restore backup | Human |
| RESOURCE EXHAUST | Shed load / 429 | Disable non-critical engines | SAFE STOP ingest |
| UPGRADE FAIL | Rollback image | Restore config | Restore DB backup if schema |

## Observability unavailable

Customer monitors: freshness expires → UNKNOWN (not HEALTHY).  
Platform: `platform-health` DEGRADED.

## Remediation failure

Existing Phase 6 matrix applies; remote remediation remains unavailable.
