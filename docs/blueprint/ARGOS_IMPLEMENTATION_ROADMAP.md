# ARGOS — Implementation roadmap

```
PHASE_0 = COMPLETE 3444916
PHASE_1 = COMPLETE c19a8ce
PHASE_2 = COMPLETE ec27eb9
PHASE_3 = COMPLETE 61148f4
PHASE_4 = COMPLETE (client portal UI; no NOC)
STASH = do not apply
```

---

## 1. Sequence (kept; overlap 3/4 for honest client health display)

| Phase | Name | Status | Why this order |
|-------|------|--------|----------------|
| 0 | Organization foundation | DONE | tenant exists |
| 1 | Tenant scoping | DONE | client APIs scoped |
| 2 | Assets + TLS | DONE | something to monitor |
| 3 | Monitoring + alerts + incidents | DONE (backend/APIs) | critical path core |
| 4 | Client private experience | DONE (UI `/dashboard/*`) | clients must see truth |
| 5 | Internal NOC | NEXT | operators need queue |
| 6 | Runbooks + remediation | after incidents | A/B/C needs a case |
| 7 | Agents | after monitors | extra observation source |
| 8 | Notifications + reporting | after alerts | who to tell |
| 9 | Preventive intelligence | after history | else fake prediction |
| 10 | Hardening + ARGOS self-monitoring | before scale | don't lie when ARGOS is blind |
| 11 | Pilot customers | after 3–5 min | real orgs |
| 12 | Production readiness | last | drills, backups, freeze |

Relume/Framer: Design Contract congelado; UI Client/NOC = Phase 4/5 (no mezclar con este backend Phase 3).

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
| Pipeline + honest health + alert + incident (APIs) | DONE (Phase 3) |
| One client view + one staff view | **MVP** restante (Phase 4/5) |
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

### Phase 3 template (IMPLEMENTED — backend; see runbook)

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

## 6. Immediate next

1. Phase 5 — Internal NOC (solo con autorización humana)
2. Never `git stash pop`
3. No push/PR/deploy sin autorización humana explícita
4. Status: `docs/architecture/ARGOS_PHASE_4_STATUS.md` · Runbook: `docs/runbooks/ARGOS_PHASE_4_CLIENT_PORTAL.md`
