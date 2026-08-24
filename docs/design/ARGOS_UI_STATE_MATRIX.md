# ARGOS UI State Matrix — Client + NOC

```
STATUS = SPEC_COMPLETE
RUNTIME = NO
```

Maps **product semantics** (Blueprint) to **visual language** (this contract). Prototype MOCK rows are examples, not default production values.

---

## 1. Health vs coverage vs incidents (do not collapse)

| Concept | Means | Must not be shown as |
|---------|-------|----------------------|
| MONITORED | A check/source exists | COVERED or HEALTHY |
| COVERED | Check is in the coverage set | Complete protection |
| HEALTHY | Recent evidence within policy is OK | UNKNOWN, or “fully protected” |
| NO_INCIDENTS_DETECTED | Incident list is empty | HEALTHY coverage / full protection |
| UNKNOWN | Missing checks, telemetry, coverage, or freshness | HEALTHY, teal check, solid green card |
| DETECTED | Observed by a control | PREDICTED / AI prophecy |
| INFERRED | Derived by rule without new observation | DETECTED |
| PREDICTED | Phase 9 methodology | Fake % or invented ETA |
| MOCK / DEMO | Prototype only | Production telemetry |

Coverage example: `5/7 COVERED` while `7 MONITORED` ⇒ two pending review. UI must say so.

---

## 2. Health states (visual, non-negotiable)

Used on assets, controls, platform core, coverage summaries.

| State | Icon | Shape | Label | Color role |
|-------|------|-------|-------|------------|
| HEALTHY | check | solid edge teal | HEALTHY / estado correcto | `#2F7D6D` |
| WARNING | triangle | solid amber | WARNING | `#B45309` |
| CRITICAL | diamond | solid 2px red/navy | CRITICAL | `#B91C1C` |
| UNKNOWN | minus-circle | **dashed** gray | UNKNOWN / DESCONOCIDO | `#6B7280` |

All four: visible text. Color is never the only channel.

**UNKNOWN ≠ HEALTHY** in copy, icon, border, and badge fill.

---

## 3. Product observation / incident states (Blueprint)

These exist in the master product model. Framer masters did not freeze every one; the matrix still applies when those surfaces ship.

| Product state | Visual mapping | Notes |
|---------------|----------------|-------|
| PROTECTED / HEALTHY | HealthBadge HEALTHY | Only with minimum coverage + fresh evidence |
| OBSERVE | StatusBadge WARNING or dedicated “en observación” | Anomalous, not confirmed |
| WARNING | WARNING | Degradation / nearby risk |
| HIGH | CRITICAL or WARNING+label HIGH | Elevated, not yet incident |
| CRITICAL | CRITICAL | Failure or imminent risk |
| INCIDENT | IncidentCard open | Lifecycle ≠ health |
| MITIGATED | IncidentCard + text “impacto contenido” | Cause may still be open |
| RESOLVED | IncidentCard closed | Requires evidence |
| UNKNOWN | UNKNOWN | Insufficient data |

Do not invent a fifth health color for HIGH. Use label `HIGH` on WARNING/CRITICAL per severity rules in Incident model when implemented.

---

## 4. Screen-level states (every data page)

| State | When | Visual | Client copy (ES) | NOC copy |
|-------|------|--------|------------------|----------|
| loading | in-flight | skeleton | — | — |
| empty | success, zero rows | EmptyState | “Aún no hay elementos.” + CTA if permitted | “Queue empty.” |
| unknown | success, insufficient evidence | UnknownState dashed | “Aún no hay datos suficientes para confirmar el estado.” | `UNKNOWN — insufficient evidence` |
| warning | evidence of degradation | AttentionBanner / KPI | “Atención requerida.” | WARNING count |
| critical | failure / open severe | AttentionBanner / KPI inverse | “Requiere atención urgente.” | CRITICAL count |
| error | request failed | ErrorState | “No se ha podido cargar. Reintentar.” | error + retry |
| healthy | **only with evidence** | HealthBadge | never implied by empty incidents | HEALTHY on that object only |

A page can be `NO_INCIDENTS_DETECTED` **and** `WARNING` (e.g. TLS) **and** `UNKNOWN` (backups) simultaneously. Do not roll up to a single green.

---

## 5. Automation / approval states

| Level | Name | Control visible | Default CTA |
|-------|------|-----------------|-------------|
| L0 | READ ONLY | yes | Inspect / refresh |
| L1 | SAFE AUTOMATION | yes | Inspect; execute only when product phase allows |
| L2 | REVERSIBLE | rollback text visible | Inspect; execute with rollback |
| L3 | HUMAN APPROVAL | ApprovalGate | **Request approval** |
| L4 | PROHIBITED | no execute | none |

| Action UI state | Visual |
|-----------------|--------|
| idle | secondary Inspect |
| approval_required | L3 badge + Request approval |
| pending_approval | disabled execute + “awaiting human” |
| executing | loading on action, evidence still visible |
| verified | success text, not a firework |
| failed | FAILURE EVIDENCE path shown |
| safe_stop | Safe stop / rollback / escalate — no Auto Fix |

Silent auto-fix is **never** a state.

---

## 6. Provenance states

| Provenance | Badge | Allowed on production |
|------------|-------|------------------------|
| DETECTED | `DETECTED` | yes (when engine exists) |
| INFERRED | `INFERRED` | yes, labelled |
| PREDICTED | `PREDICTED` | Phase 9; until then empty/honest |
| MOCK | `MOCK` / `DEMO` | prototypes and tests only |

Framer Command Center preventive block: `DETECTED · PLANNED / MOCK` is the correct prototype pattern. Implementation must not promote it to live prediction.

---

## 7. Freshness

| Condition | Indicator | Health impact |
|-----------|-----------|----------------|
| Observed within policy window | relative time | may support HEALTHY |
| Stale | `STALE` + time | cannot claim HEALTHY |
| Never observed | UNKNOWN | UNKNOWN |
| MOCK clock | `· MOCK` | not live |

Framer “refresh 12s · MOCK” is a freshness **label**, not permission to animate fake live polls in production.

---

## 8. Tenant / permission states

| State | Client | NOC |
|-------|--------|-----|
| org_viewer | read-only; hide mutating CTAs | N/A |
| org_member / admin / owner | per Blueprint | N/A |
| client JWT on `/noc` | 404/403 — no “pretty empty NOC” | — |
| staff without org context | — | queue may list org column; detail queries still `WHERE organization_id = ?` |
| mixed-tenant view | forbidden | forbidden |

---

## 9. Client Resumen — approved combination (prototype)

Reference only (MOCK):

| Region | State |
|--------|-------|
| Protection summary | WARNING — atención TLS |
| Coverage | 5/7 COVERED, 7 MONITORED, 2 pending |
| Controls | vigilance + review needed; HEALTHY ≠ cobertura total |
| Web / DNS / Server | HEALTHY |
| TLS | WARNING |
| Backups | UNKNOWN dashed |
| Alerts | 1 MOCK |
| Incidents | 0 NO_INCIDENTS_DETECTED |
| Preventive | 2 DETECTED MOCK |
| Activity | MOCK events |

This combination is the **allowed teaching example**. Production must bind each region to real APIs or unknown/empty.

---

## 10. NOC Command Center — approved combination (prototype)

| Region | State |
|--------|-------|
| Platform health | ARGOS CORE HEALTHY MOCK (ARGOS itself) |
| KPIs | 3 tenants DEMO; 1 CRITICAL; 2 WARNING; 1 UNKNOWN dashed; 1 OPEN INCIDENT |
| Queue | ORG-DEMO-A/B/C only |
| Selected | TLS CRITICAL · Inspect + Request approval (L3) |
| Safety | L0–L4 visible; L3 emphasized |
| Predicted | DETECTED/PLANNED MOCK, not AI |

UNKNOWN KPI card uses dashed treatment, not teal.

---

## 11. Consistency with current code

| Claim | Repo truth |
|-------|------------|
| Dashboard health strip | Does not exist; do not fake from website audit score |
| Audit score | May show as **one-time website audit**, never 24/7 health |
| Empty audit score `—` | Keep honesty; do not fill 96 |
| `/api/noc/*` | NOT EXISTS |
| Alerts/incidents tables | Phase 3 — not created in this documentation phase |
