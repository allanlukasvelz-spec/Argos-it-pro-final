# ARGOS — External Staging Master Plan

```
GATE                          = EXTERNAL_STAGING_PRE_IMPLEMENTATION
DATE                          = 2026-08-26
BRANCH                        = feature/argos-multitenant-platform
HEAD_AT_GATE                  = 5e1bf631f8c3fdb98a8d5fe5a17a20d588f7e031
LOCAL_STAGING_VALIDATED       = YES
EXTERNAL_STAGING_VALIDATED    = NO
PRODUCTION_READY              = NO
HUMAN_DECISIONS               = RECORDED (D1–D10) — see ARGOS_EXTERNAL_STAGING_HUMAN_DECISIONS.md
EXTERNAL_DEPLOYMENT_EXECUTED  = NO
BILLABLE_INFRASTRUCTURE       = AUTHORIZED_FOR_STAGING_ONLY (not yet created)
DNS_CHANGED                   = NO
PHASE_9                       = NO
RUNTIME_CHANGED               = NO
```

## Purpose

Define **how** ARGOS should be deployed to a **real external staging** environment that faithfully reproduces the validated local Compose topology — without executing that deployment yet.

This gate is **architecture + human decisions only**.

## What is already true (local)

See:

- [ARGOS_STAGING_FINAL_VALIDATION.md](./ARGOS_STAGING_FINAL_VALIDATION.md) — G13=PASS, harness, NOC visual, Phase 7 staging E2E
- [ARGOS_STAGING_E2E_CLOSURE.md](./ARGOS_STAGING_E2E_CLOSURE.md) — G12=PASS, Phase 8 pipeline
- [ARGOS_STAGING_ARCHITECTURE.md](./ARGOS_STAGING_ARCHITECTURE.md) — Compose topology (TARGET local/private)
- [ARGOS_RELEASE_GATES.md](./ARGOS_RELEASE_GATES.md) — G0–G15

**LOCAL_STAGING_VALIDATED ≠ EXTERNAL_STAGING_VALIDATED ≠ PRODUCTION_READY.**

## Document index (this package)

| Document | Role |
|----------|------|
| [ARGOS_EXTERNAL_STAGING_ARCHITECTURE.md](./ARGOS_EXTERNAL_STAGING_ARCHITECTURE.md) | Deployment class decision |
| [ARGOS_EXTERNAL_STAGING_NETWORK_SECURITY.md](./ARGOS_EXTERNAL_STAGING_NETWORK_SECURITY.md) | Trust boundaries / firewall |
| [ARGOS_EXTERNAL_STAGING_SECRETS.md](./ARGOS_EXTERNAL_STAGING_SECRETS.md) | Secrets inventory (no values) |
| [ARGOS_EXTERNAL_STAGING_BACKUP_RESTORE.md](./ARGOS_EXTERNAL_STAGING_BACKUP_RESTORE.md) | Off-host backup + isolated restore |
| [ARGOS_EXTERNAL_STAGING_OBSERVABILITY.md](./ARGOS_EXTERNAL_STAGING_OBSERVABILITY.md) | External + host monitoring |
| [ARGOS_EXTERNAL_STAGING_DEPLOYMENT_RUNBOOK.md](./ARGOS_EXTERNAL_STAGING_DEPLOYMENT_RUNBOOK.md) | Reproducible deploy procedure |
| [ARGOS_EXTERNAL_STAGING_ROLLBACK.md](./ARGOS_EXTERNAL_STAGING_ROLLBACK.md) | Layered rollback |
| [ARGOS_EXTERNAL_STAGING_RELEASE_GATES.md](./ARGOS_EXTERNAL_STAGING_RELEASE_GATES.md) | Gates for external staging |
| [ARGOS_EXTERNAL_STAGING_BLOCKERS.md](./ARGOS_EXTERNAL_STAGING_BLOCKERS.md) | B1–B10 reassessment |
| [ARGOS_EXTERNAL_STAGING_HUMAN_DECISIONS.md](./ARGOS_EXTERNAL_STAGING_HUMAN_DECISIONS.md) | D1–D10 — **STOP until decided** |

## Canonical local docs (do not reinvent)

| Topic | Canonical |
|-------|-----------|
| Compose topology | `ARGOS_STAGING_ARCHITECTURE.md`, `docker/docker-compose.staging.yml` |
| Image pins | `ARGOS_STAGING_IMAGE_PINS.md` |
| Ports | `ARGOS_PORT_NETWORK_MATRIX.md` |
| Secrets classes | `ARGOS_CONFIGURATION_SECRET_MATRIX.md` |
| Backup plan | `ARGOS_BACKUP_RESTORE_PLAN.md` + `scripts/staging/backup.sh` |
| Rollback layers | `ARGOS_ROLLBACK_PLAN.md` |
| Observability | `ARGOS_OBSERVABILITY_PLAN.md` |
| Capacity S0 | `ARGOS_CAPACITY_MODEL.md` |
| Production blockers | `ARGOS_PRODUCTION_READINESS_BLOCKERS.md` |

## Hard stop

Until D1–D10 are answered and a **separate** implementation gate is authorized:

- No VPS / cloud account spend
- No DNS changes
- No external deploy
- No production
- No Phase 9
- No remote execution / remediation

## Recommended next step

1. ~~Human completes [ARGOS_EXTERNAL_STAGING_HUMAN_DECISIONS.md](./ARGOS_EXTERNAL_STAGING_HUMAN_DECISIONS.md)~~ **DONE** (2026-08-26)
2. Human authorizes **EXTERNAL_STAGING_IMPLEMENTATION** gate (create Hostinger VPS, DNS for `staging.argos-it.es` only, spend within €80)
3. Execute runbook with recorded Git SHA and release gates
