# Documentation consistency errors (platform audit)

```
DATE = 2026-08-25
HEAD = 756b801
```

| ID | Contradiction | CURRENT truth | Stale source |
|----|---------------|---------------|--------------|
| C1 | Blueprint says Phase 3 not authorized / no monitors | Phases 3–7 implemented | `docs/blueprint/ARGOS_MASTER_PRODUCT_BLUEPRINT.md` |
| C2 | System arch says CURRENT = Phases 0–2 only / no NOC | NOC + monitoring live | `docs/blueprint/ARGOS_FINAL_SYSTEM_ARCHITECTURE.md` |
| C3 | Roadmap “Phase 7 NEXT” | Phase 7 DONE + validated | `docs/blueprint/ARGOS_IMPLEMENTATION_ROADMAP.md` |
| C4 | Phase 5 status: agents/runbooks NOT_AVAILABLE | `/noc/agents`, runbooks, remediations real | `docs/architecture/ARGOS_PHASE_5_STATUS.md` |
| C5 | Phase 7 architecture PLANNING_ONLY | Code + migration 005 | `docs/phase7/ARGOS_PHASE_7_ARCHITECTURE.md` |
| C6 | DB model names `remediation_actions` / `preventive_actions` | `remediation_executions`; no preventive_actions | `docs/blueprint/ARGOS_FINAL_DATABASE_MODEL.md` |
| C7 | `schema.sql` missing 004/005 tables | ensure* / migrate apply them | `database/schema.sql` vs migrations |
| C8 | Phase 7 STATUS said no agents E2E | `e2e/phase7-agents.spec.ts` exists (7.1) | Partial stale line in STATUS |

**Policy:** do not rewrite historical CURRENT freezes silently; amend with TARGET notes or point to Phase STATUS docs.
