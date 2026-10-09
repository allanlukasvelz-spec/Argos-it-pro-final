# ARGOS Workflow Architecture

```
DATE = 2026-08-25
```

## CURRENT

- Monitor scheduler in API process
- Remediation executions as rows + state machine in PG
- Agent spool on disk (reference agent)

## Target job lifecycle

```
QUEUED → CLAIMED → RUNNING → VERIFYING → COMPLETED
                 ↘ FAILURE EVIDENCE → RETRY → ACTION B → ACTION C
                                              → SAFE STOP → ROLLBACK → HUMAN
```

## Engine choice

| Option | When |
|--------|------|
| PostgreSQL-backed queue + worker process | **Default next** — fits stack, observable, tenant-keyed |
| Redis/BullMQ | If PG queue latency/locking saturates |
| Temporal | If multi-day durable multi-service workflows dominate |

**DEFER Temporal** until proven need. Phase 6 remediation already models A/B/C + approval.

## Idempotency

Every job key unique per org. Retries must not duplicate alerts/incidents/remediations (existing Phase 7 observation idempotency is the pattern).
