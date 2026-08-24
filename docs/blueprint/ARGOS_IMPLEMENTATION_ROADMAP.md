# ARGOS — Implementation roadmap

```
PHASE_0 = COMPLETE 3444916
PHASE_1 = COMPLETE c19a8ce
PHASE_2 = COMPLETE ec27eb9
PHASE_3 = NOT AUTHORIZED
STASH = do not apply
```

---

## 1. Sequence (kept; overlap 3/4 for honest client health display)

| Phase | Name | Status | Why this order |
|-------|------|--------|----------------|
| 0 | Organization foundation | DONE | tenant exists |
| 1 | Tenant scoping | DONE | client APIs scoped |
| 2 | Assets + TLS | DONE | something to monitor |
| 3 | Monitoring + alerts + incidents | NEXT (authz required) | critical path core |
| 4 | Client private experience | after/with 3 APIs | clients must see truth |
| 5 | Internal NOC | after 3 | operators need queue |
| 6 | Runbooks + remediation | after incidents | A/B/C needs a case |
| 7 | Agents | after monitors | extra observation source |
| 8 | Notifications + reporting | after alerts | who to tell |
| 9 | Preventive intelligence | after history | else fake prediction |
| 10 | Hardening + ARGOS self-monitoring | before scale | don't lie when ARGOS is blind |
| 11 | Pilot customers | after 3–5 min | real orgs |
| 12 | Production readiness | last | drills, backups, freeze |

Relume/Framer: **between** this blueprint and Phase 4/5 UI implementation (can start Relume now; cannot implement P3).

---

## 2. Dependency graph

```
Organizations → Memberships → Assets → Monitors → Observations
→ Health → Risks → Alerts → Incidents → Runbooks → Remediations
```

Branches: Agents→Observations; Notifications←Alerts/Incidents; Reports←history; Portal←tenant APIs; NOC←staff APIs.

---

## 3. Critical path / MVP

```
organization → asset → monitor → check → observation
→ health → alert → incident → client visibility → NOC visibility
```

| Slice | Class |
|-------|--------|
| Org + asset + TLS on discover | DONE |
| Pipeline + honest health + alert + incident + one client view + one staff view | **MVP** |
| Full portal IA + full NOC | V1 |
| A/B/C execution + agents | V1.5 |
| Prediction ML, billing | FUTURE |

---

## 4. Phase template (use before coding any future phase)

```
GOAL
WHY NOW
DEPENDENCIES
DATABASE (migrations named *_up.sql; never mix _down in apply-all)
BACKEND
FRONTEND
SECURITY
TESTS (incl. isolation + UNKNOWN≠HEALTHY)
DOCUMENTATION
FAILURE MODES
ACTION A / B / C
ROLLBACK
EXIT CRITERIA (DoD)
```

### Phase 3 template (design only — do not execute)

| Field | Content |
|-------|---------|
| GOAL | Observe assets periodically; derive health; open alerts/incidents |
| WHY NOW | Assets exist; without this ARGOS cannot protect |
| DEPENDENCIES | P0–P2; hostnameSecurity; tlsStatus |
| DATABASE | monitors, observations, alerts, incidents, incident_events |
| BACKEND | scheduler, check runners, health/alert/incident engines, tenant APIs |
| FRONTEND | minimal honest widgets (even on current /dashboard) — not full Relume UI |
| SECURITY | SSRF on all probes; isolation tests; no fake HEALTHY |
| TESTS | isolation, SSRF, false healthy, dedup |
| FAILURE | scheduler down → UNKNOWN + self-alert |
| ACTION A | restart runner |
| B | second instance |
| C | freeze HEALTHY + manual |
| ROLLBACK | disable scheduler flag; keep tables |
| EXIT | see DoD |

---

## 5. Definition of Done (every phase)

Architecture coherent · migration safe (no accidental `_down`) · tenant isolation · API verified · UI for that phase · states: loading empty unknown warning critical error · security tests · regression · build · docs · diagrams · rollback · no secrets · acceptance PASS.

**Compile ≠ DONE.**

---

## 6. Immediate next (after this doc commit)

1. Relume using `handoff/ARGOS_RELUME_HANDOFF.md`
2. Human approve Relume
3. Framer + fill Design Contract
4. Human authorize Phase 3 implementation
5. Never `git stash pop`
