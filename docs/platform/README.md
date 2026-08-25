# ARGOS Platform Program

```
STATUS = PLANNING + FOUNDATION_GATE
DATE = 2026-08-25
BASELINE_HEAD = 756b801
BRANCH = feature/argos-multitenant-platform
PHASE_8_EXECUTED = NO
PRODUCTION = NO
```

## Purpose

This directory is the **source of truth for ARGOS platform expansion**: how ARGOS grows from a cybersecurity-oriented multi-tenant product (Phases 0–7) into a consultancy-grade IT operations, security, observability and automation platform — **without becoming an unsafe pile of tools**.

## Reading order

1. [`ARGOS_PLATFORM_MASTER_PLAN.md`](./ARGOS_PLATFORM_MASTER_PLAN.md) — mission, principles, critical path
2. [`ARGOS_PLATFORM_ARCHITECTURE.md`](./ARGOS_PLATFORM_ARCHITECTURE.md) — CURRENT vs TARGET
3. [`ARGOS_PLATFORM_MENTAL_MAP.md`](./ARGOS_PLATFORM_MENTAL_MAP.md) + [`ARGOS_PLATFORM_MENTAL_MAP.html`](./ARGOS_PLATFORM_MENTAL_MAP.html)
4. [`ARGOS_CAPABILITY_MATRIX.md`](./ARGOS_CAPABILITY_MATRIX.md)
5. [`ARGOS_TOOLING_DECISION_MATRIX.md`](./ARGOS_TOOLING_DECISION_MATRIX.md) + [`ARGOS_BUILD_BUY_INTEGRATE.md`](./ARGOS_BUILD_BUY_INTEGRATE.md)
6. Domain architectures (observability, storage, security toolchain, workflow, network/OS, containers, compliance, evidence)
7. [`ARGOS_PLATFORM_SECURITY_MODEL.md`](./ARGOS_PLATFORM_SECURITY_MODEL.md) + [`ARGOS_PLATFORM_THREAT_MODEL.md`](./ARGOS_PLATFORM_THREAT_MODEL.md)
8. [`ARGOS_PLATFORM_IMPLEMENTATION_GATES.md`](./ARGOS_PLATFORM_IMPLEMENTATION_GATES.md) — **read before any runtime change**
9. [`adr/`](./adr/) — Architecture Decision Records

## Non-negotiables

- ARGOS owns **tenancy, health semantics, incidents, CHICO, approvals, audit, customer UX**.
- External tools are **engines**, never product truth.
- `UNKNOWN ≠ HEALTHY`, `ONLINE ≠ HEALTHY`, remote exec/remediation remain **NO**.
- Prefer BUILD / BUY / INTEGRATE / ADOPT_OSS / DEFER / REJECT — never install by fashion.

## Documentation hierarchy

| Layer | Role |
|-------|------|
| **CODE** | CURRENT implementation truth |
| `docs/architecture/ARGOS_PHASE_*_STATUS.md` | Phase completion CURRENT |
| `docs/platform/*` | Platform expansion TARGET + gates |
| `docs/blueprint/*` | Historical product intent — **often STALE vs Phases 3–7** |
| `docs/phase7/*` | Mix of planning + post-implementation; prefer Phase 7 STATUS for CURRENT |

When docs conflict with code: **code wins for CURRENT**; contradiction is recorded, not erased.
