# ARGOS Phase 7 — Status

```
STATUS = IMPLEMENTED (MVP) + FUNCTIONALLY_VALIDATED (PASS — Phase 7.1 closure)
HEAD_BASELINE_BEFORE = 9a5e8cd
IMPLEMENTATION_COMMIT = 7693135
CLOSURE_BASELINE = 339bf05
DATE = 2026-08-25
BRANCH = feature/argos-multitenant-platform
REMOTE_REMEDIATION = NOT_AUTHORIZED
PRODUCTION_DEPLOY = NO
```

Functional validation report: [`ARGOS_PHASE_7_FUNCTIONAL_VALIDATION.md`](./ARGOS_PHASE_7_FUNCTIONAL_VALIDATION.md)  
Artifacts: `docs/architecture/phase7-validation-artifacts/` (+ `phase71/` CHICO/NOC captures)

## What shipped

| Area | Status |
|------|--------|
| Agent enrollment (one-time hashed token) | IMPLEMENTED |
| Agent credential auth (hashed, rotatable, revocable) | IMPLEMENTED |
| Heartbeat + ONLINE/STALE/OFFLINE/REVOKED | IMPLEMENTED |
| Typed observations + capability allowlist | IMPLEMENTED |
| Safe metrics / local probe schemas | IMPLEMENTED |
| Project to `observations.source='AGENT'` | IMPLEMENTED |
| Offline spool (reference agent) | IMPLEMENTED |
| NOC `/noc/agents` UI + API | IMPLEMENTED |
| Client `/api/client/guardian` + CHICO UI | IMPLEMENTED |
| Remote shell / SQL / exec / remediation via agent | **PROHIBITED** |

## Canonical roles

- **CHICO** = Security Guardian (Client Portal security surfaces)
- **DUMBO** = UX/guide (preserved; unchanged)
- **Technical Agent** = observation software (≠ CHICO)

## Key paths

- Migration: `database/migrations/005_agents_observation.sql`
- Boot: `backend/lib/ensureAgents.js`
- Agent API: `/api/agent/v1/*`
- NOC API: `/api/noc/agents*`
- Client: `/api/client/guardian`
- Reference agent: `agents/argos-agent-ref/`
- Design: `docs/design/ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md`
- Runbook: `docs/runbooks/ARGOS_PHASE_7_AGENTS.md`

## Invariants preserved

- Agent ONLINE ≠ asset HEALTHY
- UNKNOWN ≠ HEALTHY
- Phase 6 remediation is not transported through agents
- Tenant scope from credential binding only
- org_admin ≠ NOC

## Known limitations

- No multi-asset binding per agent (1 primary asset)
- No mTLS (Bearer credential MVP)
- Alert auto-open from agent CRITICAL metrics is deferred (health merge worsens overall; alertEngine still platform-primary)
- E2E browser coverage for agents not added in this commit
- Spool is local to reference agent process (not a fleet manager)
