# ARGOS — Internal NOC blueprint

```
ROOT = /noc
CURRENT = IMPLEMENTED (Phase 5 read-only; placeholders P6–P9)
PHASE = 5 (UI + APIs) on Phase 0–4 data
USER = ARGOS staff (admin / super_admin)
TONE = dense, fast, evidence-driven
```

Control Center (marca) = **SUPERSEDED** por NOC.

---

## AuthZ

- Client JWT **sin** `admin|super_admin` → 404/403 en `/noc` y `/api/noc`.
- Staff **sigue** obligado a elegir `organization_id` en queries de recursos.
- Nunca dump unfiltered de todas las orgs en un endpoint “get all incidents” sin paginación y sin org filter por defecto (default = empty until org selected, **or** global queue with org column but each card is org-scoped fetch).

Recommended MVP UX: **global priority queue** (staff) where each row includes org; opening a row sets tenant context for the session panel. SQL still `WHERE organization_id = row.org`.

---

## Shell

Header: ARGOS NOC · GLOBAL PLATFORM HEALTH (ARGOS self, not a customer).  
Sidebar: IA tree (Relume may group infra).  
Main: dense tables + detail pane.

---

## `/noc` Command Center

| | |
|--|--|
| PURPOSE | Qué requiere operador ahora |
| HIERARCHY | KPIs MOCK → Active priorities → Predicted → A/B/C panel |
| DATA | incidents OPEN, alerts CRITICAL, predicted_risks, platform_health |
| API | `GET /api/noc/overview` (NOT EXISTS) |
| PRIMARY | Inspect row |
| SECONDARY | Action A if L≤2 / Request approval if L3 |
| STATES | empty queue, loading, platform DEGRADED banner |

Wireframe estructural: ver Master / HTML / PPTX. Números MOCK.

---

## Other pages (purpose / primary action)

| Route | Purpose | Primary |
|-------|---------|---------|
| `/noc/customers` | lista orgs + worst severity | open customer |
| `/noc/organizations` | admin org status memberships | suspend/activate (L3) |
| `/noc/assets` | cross-tenant search **scoped after query org/customer** | inspect asset |
| `/noc/health` | health matrix | filter UNKNOWN vs CRITICAL |
| `/noc/monitoring` | scheduler + monitors | force check L1 |
| `/noc/alerts` | queue | ack / open incident |
| `/noc/incidents` | cases | investigate |
| `/noc/predicted-risks` | P9; until then empty honest | inspect |
| `/noc/preventive-actions` | prevention queue | approve/execute |
| `/noc/tls` `/dns` `/servers` `/databases` `/backups` | infra slices | inspect |
| `/noc/agents` | P7 | isolate agent |
| `/noc/runbooks` | library | open runbook |
| `/noc/remediations` | action history | rollback |
| `/noc/reports` | P8 | generate |
| `/noc/support` | client_messages across orgs | reply |
| `/noc/audit` | who did what | filter |
| `/noc/platform-health` | ARGOS itself | run Action A on ARGOS |

---

## A/B/C panel (required component)

Always visible on incident detail:

Why this action · Evidence stack · Hypothesis · Confidence qualitative · A with expected result and failure_signal · B · C · Rollback · Safe stop · ApprovalGate if L3.

---

## Journey

Alert → Investigate → Evidence → Hypothesis → A → fail → evidence → B → fail → C → Verify → Resolve **or** Safe Stop / Rollback / Escalate.

---

## Responsive

Desktop complete. Tablet: queue + detail. Mobile: severity queue only — not full command center.
