# ARGOS — Production Readiness Master Plan

```
STATUS                        = PRE_IMPLEMENTATION_GATE
DATE                          = 2026-08-26
BRANCH                        = feature/argos-multitenant-platform
HEAD                          = 93b838faf4b03270ecb4421237db925ae1299f6d
STAGING_DEPLOYMENT            = NOT AUTHORIZED
PRODUCTION_DEPLOYMENT         = NOT AUTHORIZED
PHASE_9                       = NOT AUTHORIZED
RUNTIME_CHANGED               = NO
```

## 0. Purpose

This package defines what is required to operate ARGOS **safely and reproducibly in staging resembling production**.

It is **architecture + audit + runbooks only**. No staging deploy, no cloud purchase, no DNS, no production migration.

## 1. Product foundations already proven (local)

| Area | Status (local) |
|------|----------------|
| Multitenant Client Portal | Implemented |
| Internal NOC | Implemented + chrome isolation fixed |
| Monitoring / alerts / incidents | Implemented |
| Phase 6 remediation (safe) | Implemented |
| Phase 7 Agents + CHICO | Implemented |
| Evidence object storage | Local + S3 adapter + MinIO POC |
| Phase 8 reports + in-app notifications | Implemented |
| Phase 8.1 adversarial validation | PASS |
| Visual Client/NOC isolation | PASS |

## 2. Document index

| Document | Role |
|----------|------|
| [ARGOS_CURRENT_RUNTIME_TOPOLOGY.md](./ARGOS_CURRENT_RUNTIME_TOPOLOGY.md) | What runs today |
| [ARGOS_SERVICE_INVENTORY.md](./ARGOS_SERVICE_INVENTORY.md) | Every process / dependency |
| [ARGOS_STAGING_ARCHITECTURE.md](./ARGOS_STAGING_ARCHITECTURE.md) | TARGET staging topology |
| [ARGOS_STAGING_MENTAL_MAP.md](./ARGOS_STAGING_MENTAL_MAP.md) | Narrative + Mermaid maps |
| [ARGOS_CONFIGURATION_SECRET_MATRIX.md](./ARGOS_CONFIGURATION_SECRET_MATRIX.md) | Env classification |
| [ARGOS_PORT_NETWORK_MATRIX.md](./ARGOS_PORT_NETWORK_MATRIX.md) | Ports & exposure |
| [ARGOS_DATABASE_MIGRATION_PLAN.md](./ARGOS_DATABASE_MIGRATION_PLAN.md) | Migrations 001–007 |
| [ARGOS_BACKUP_RESTORE_PLAN.md](./ARGOS_BACKUP_RESTORE_PLAN.md) | Backup + restore drill |
| [ARGOS_OBJECT_STORAGE_PRODUCTION_PLAN.md](./ARGOS_OBJECT_STORAGE_PRODUCTION_PLAN.md) | Evidence store staging |
| [ARGOS_WORKER_OPERATIONS.md](./ARGOS_WORKER_OPERATIONS.md) | Phase 8 worker lifecycle |
| [ARGOS_SCHEDULER_OPERATIONS.md](./ARGOS_SCHEDULER_OPERATIONS.md) | Monitor scheduler |
| [ARGOS_AGENT_DEPLOYMENT_PLAN.md](./ARGOS_AGENT_DEPLOYMENT_PLAN.md) | Agent install/enroll (no remote exec) |
| [ARGOS_OBSERVABILITY_PLAN.md](./ARGOS_OBSERVABILITY_PLAN.md) | Logs/metrics/meta-monitoring |
| [ARGOS_CAPACITY_MODEL.md](./ARGOS_CAPACITY_MODEL.md) | S0/S1/S2 estimates |
| [ARGOS_RETENTION_MATRIX.md](./ARGOS_RETENTION_MATRIX.md) | Data retention |
| [ARGOS_FAILURE_DISASTER_MATRIX.md](./ARGOS_FAILURE_DISASTER_MATRIX.md) | Failure modes |
| [ARGOS_RELEASE_GATES.md](./ARGOS_RELEASE_GATES.md) | G0–G15 |
| [ARGOS_ROLLBACK_PLAN.md](./ARGOS_ROLLBACK_PLAN.md) | Rollback by layer |
| [ARGOS_STAGING_RUNBOOK.md](./ARGOS_STAGING_RUNBOOK.md) | Day-2 ops |
| [ARGOS_SECURITY_PREPRODUCTION_CHECKLIST.md](./ARGOS_SECURITY_PREPRODUCTION_CHECKLIST.md) | Security gate |
| [ARGOS_PRODUCTION_READINESS_BLOCKERS.md](./ARGOS_PRODUCTION_READINESS_BLOCKERS.md) | Hard blockers |
| [ARGOS_PRODUCTION_READINESS_IMPLEMENTATION_MAP.html](./ARGOS_PRODUCTION_READINESS_IMPLEMENTATION_MAP.html) | Visual CURRENT / STAGING / PROD |
| [ARGOS_STAGING_FINAL_VALIDATION.md](./ARGOS_STAGING_FINAL_VALIDATION.md) | Local staging G13=PASS closure |
| [ARGOS_EXTERNAL_STAGING_MASTER_PLAN.md](./ARGOS_EXTERNAL_STAGING_MASTER_PLAN.md) | External staging pre-implementation (architecture only) |

## 3. Non-negotiable product invariants (carry into staging)

```
UNKNOWN != HEALTHY
PLATFORM HEALTH != CUSTOMER HEALTH
NOT_SCANNED != CLEAN
NO_ALERTS != FULLY PROTECTED
org_admin != NOC access
REMOTE_EXECUTION = NO
REMOTE_REMEDIATION = NO
PUBLIC bucket = FORBIDDEN
Test surfaces = fail-closed in production NODE_ENV
```

## 4. Recommended staging approach (one)

**Single VM (or local-equivalent host) + Docker Compose** supervising:

1. PostgreSQL 16 (private)
2. API (1 replica; owns monitor scheduler)
3. Worker (1+ with SKIP LOCKED)
4. Frontend (Next production)
5. Object store: pinned MinIO **or** managed S3-compatible (config only; not purchased in this gate)

**KUBERNETES_ADOPT_NOW = NO** — unjustified at current scale; scheduler lacks multi-replica locking.

## 5. Gate verdict (summary)

```
FINAL_STATUS = READY_WITH_BLOCKERS
```

Staging **architecture** is defined. Staging **implementation** must not start until blockers in `ARGOS_PRODUCTION_READINESS_BLOCKERS.md` are accepted or remediated under a separate authorized implementation gate.

Production remains **FORBIDDEN**.

## 6. Next human decision

Authorize a **staging implementation gate** (Compose hardening + worker service + scheduler single-owner policy + secrets + backup drill) — still no public DNS and no production.
