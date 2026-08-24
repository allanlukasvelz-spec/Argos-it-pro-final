# ARGOS Component System — Client + NOC

```
STATUS = SPEC_COMPLETE
RUNTIME_COMPONENTS = NO
FRAMER_EXPORT = NO
```

Target reusable components **before** implementation. Props below are conceptual contracts, not TypeScript to ship.

Shared DNA: tokens, status semantics, MockLabel, focus language.
Divergent shells: `ClientShell` vs `NocShell` must not share a single “admin template” layout.

Do not author one-off screens from scratch when a component below applies.

---

## 0. Cross-cutting rules

Every data-bearing component must accept:

| Prop | Responsibility |
|------|----------------|
| `freshness` | last observation time or `UNKNOWN` |
| `provenance` | `DETECTED` \| `INFERRED` \| `PREDICTED` \| `MOCK` |
| `density` | `client` \| `noc` |

If `provenance === MOCK`, render `MockLabel`. Production code paths must not pass MOCK as if it were observed telemetry.

Empty ≠ Unknown ≠ Error ≠ Healthy.

---

## 1. Shells

### AppShell

Abstract layout: top bar slot + sidebar slot + main. Not used raw in product; use ClientShell or NocShell.

**Responsibilities:** landmark structure, skip link, sidebar collapse, current route.

### ClientShell

Calm business chrome. Sidebar 248px navy `#1F3A5F`. Top bar 56px `#0B1320`. Canvas `#F7F7F5`.

**Slots:** brand, `organizationName`, `freshness`, `user`, `nav`, `main`.

**Not allowed:** marketing hero, FAQ, testimonials, pricing footer, NOC queue.

### NocShell

Dense operational chrome. Sidebar 224px `#0B1320`. Top bar 48px with **Global Platform Health** (ARGOS core). Full-width main.

**Slots:** `platformHealth`, `operator`, `freshness`, `nav`, `main`.

**Not allowed:** client reassurance copy as default tone; merging two tenants in one view.

### TopBar

**Client props:** `orgName`, `freshnessLabel`, `userName`, `notificationCount?`
**NOC props:** `platformHealth` (`HEALTHY` \| `WARNING` \| `CRITICAL` \| `UNKNOWN` \| `DEGRADED`), `operatorName`, `freshnessLabel`

Platform health is ARGOS itself, never “all customers are fine”.

### Sidebar

**Props:** `items[]` `{ id, label, href, icon, current, children? }`, `collapsed`, `experience: 'client' | 'noc'`

Relume destinations are mandatory (see Design Contract §3.3). Framer shorter labels may map as aliases (`Prevention` → Preventive Actions) but hrefs stay canonical.

### PageHeader

**Props:** `title` (h1), `eyebrow` (route crumb), `meta` (freshness / MOCK), `actions?`

Client titles in Spanish. NOC may use operational English tokens in eyebrows (`/noc · COMMAND CENTER`).

---

## 2. Status and coverage

### StatusBadge

**Props:** `status: HEALTHY | WARNING | CRITICAL | UNKNOWN`, `label?`, `size: sm | md`

Renders icon + text. UNKNOWN uses dashed container. Never maps missing data to HEALTHY.

### HealthBadge

Alias of StatusBadge for asset/control health. Same semantics.

### SeverityBadge

NOC-only. **Props:** `severity: CRITICAL | WARNING | UNKNOWN | INFO`

Distinct from HealthBadge: severity is queue priority, health is observation outcome.

### CoverageMeter

**Props:** `covered: number`, `monitored: number`, `pendingReview?: number`, `provenance`

Must show `covered/monitored` and the words MONITORED vs COVERED. A 5/7 bar must not caption “fully protected”.

### FreshnessIndicator

**Props:** `observedAt: string | null`, `maxAge?`

If `observedAt` is null → UNKNOWN freshness, not “live”. Do not animate as live telemetry when stale or MOCK.

### SafetyLevelBadge

**Props:** `level: 0 | 1 | 2 | 3 | 4`

Labels: `L0 READ ONLY` · `L1 SAFE AUTOMATION` · `L2 REVERSIBLE` · `L3 APPROVAL REQUIRED` · `L4 PROHIBITED`.

L3 visually dominant (outline 2px navy or inverted chip).

### ApprovalGate

**Props:** `required: boolean`, `level`, `evidenceSummary`, `onRequestApproval`, `onCancel`

Visible **before** execute when level ≥ 3. No hidden auto-confirm. Modal or inline panel with evidence.

### MockLabel

**Props:** `kind: MOCK | DEMO | PLACEHOLDER`

Required on prototype numbers. Forbidden as a decoration on real production values.

---

## 3. Client content

### MetricCard

Low-density KPI. **Props:** `eyebrow`, `value`, `caption`, `status?`, `provenance`

Client uses for coverage and control-state summaries. Not a marketing stat tile.

### AssetHealthCard

**Props:** `kind: web | tls | dns | backups | server | ...`, `subject` (hostname), `status`, `provenance`

UNKNOWN: dashed border + `DESCONOCIDO`. Subject uses `example.com` / `Demo Server` only in mocks.

### AlertCard

Client language. **Props:** `title`, `impact`, `status`, `href?`

No A/B/C panel. Primary: understand + support.

### IncidentCard

**Props:** `state: none | open | mitigated | resolved`, `summary`, `clientCopy`

`NO_INCIDENTS_DETECTED` is a valid empty-open state and **must not** restyle the page as fully healthy.

### PreventiveActionCard

**Props:** `title`, `whyShort`, `provenance: DETECTED | INFERRED | PREDICTED | MOCK`

Client: DETECTED by control, not “AI predicted”. Why-this-action simplified (no operator commands).

### ActivityFeed

**Props:** `items[] { at, text, status }`

Chronological. Empty: honest empty, not fake activity.

### AttentionBanner (Protection Summary)

**Props:** `level: WARNING | CRITICAL | UNKNOWN | OK_WITH_EVIDENCE`, `headline`, `detail`, `monitoredLabel`

OK_WITH_EVIDENCE still shows monitored/covered caveats. Default Framer master: attention-required, not green hero.

---

## 4. NOC content

### OperationalQueue

Table. Columns (frozen):

`CUSTOMER | ASSET | SIGNAL | SEVERITY | EVIDENCE | STATUS | ACTION | OWNER | TIME`

**Props:** `rows[]`, `selectedId`, `onSelect`, `sort?`, `filters?`

Each row **must** include `organizationId` (not shown as optional). Opening a row sets tenant context for the evidence panel. Never render two orgs’ raw dumps without org column.

Responsive: table desktop; stacked priority cards tablet; severity list mobile (see responsive doc).

### EvidencePanel

**Props:** `signal`, `evidence[] { text, at, source }`, `hypothesis`, `confidence: HIGH | MEDIUM | LOW | UNKNOWN`

No invented percentages. Confidence qualitative only.

### HypothesisPanel

May be combined with EvidencePanel. Shows current hypothesis + what was eliminated after failure evidence.

### ActionPlan

**Props:** `actionA`, `expectedResult`, `failureSignal`, `actionB`, `actionC`, `rollback`, `safeStop`, `level`

Renders the chain and fail path. Primary buttons: Inspect; Request approval if L3; Execute only if L≤2 and authorized later by product phase.

### WhyThisAction

Required on every recommended action (Relume/Blueprint). Fields: evidence, hypothesis, confidence, alternatives, expected result, risk, failure signal, B, C, rollback, automation level.

### TenantContextChip

Shows active `organizationId` / org display name. NOC: switching org replaces the panel; does not overlay two tenants.

---

## 5. Screen states

### EmptyState

No records **and** the query succeeded. CTA only if the user can act (e.g. add asset as owner).

### UnknownState

Insufficient checks, telemetry, coverage, or freshness. Copy: data not sufficient to confirm status. Visual: dashed, gray, no check icon.

### LoadingState

Skeletons matching layout. No fake numbers flashing into HEALTHY.

### ErrorState

Request failed. Retry. Do not substitute last-known HEALTHY without labelling staleness.

---

## 6. Overlays and feedback

### Modal

L3 approval, destructive confirm. Focus trap. Evidence inside.

### Drawer

Mobile nav (Client); optional NOC detail on tablet.

### Toast

Transient confirmation only. **Never** the only record of an incident or approval.

### Tooltip

Supplementary. Status must remain visible without hover.

---

## 7. Mapping Framer artboards → components

| Framer region (Client Resumen) | Component |
|--------------------------------|-----------|
| App chrome | ClientShell, TopBar, Sidebar |
| Atención requerida | AttentionBanner |
| Cobertura 5/7 | CoverageMeter + MetricCard |
| Estado de controles | MetricCard |
| Salud de activos | AssetHealthCard × n |
| Alertas / incidentes / preventivas | AlertCard, IncidentCard, PreventiveActionCard |
| Actividad / atajos | ActivityFeed + quiet links |

| Framer region (NOC Command Center) | Component |
|------------------------------------|-----------|
| Chrome | NocShell, TopBar, Sidebar |
| KPI strip | MetricCard (noc density) |
| OPERATIONAL QUEUE | OperationalQueue |
| SELECTED SIGNAL | EvidencePanel + HypothesisPanel + ActionPlan |
| SAFETY GATES | SafetyLevelBadge + ApprovalGate |
| Preventive / Agents | PreventiveActionCard / MetricCard |

---

## 8. Out of scope until later pages

Do not invent runtime components for Relume pages not yet mastered (full Incident Detail, TLS slice, etc.). Reuse the system above when those pages are specified.

Public website components remain under Visual Freeze 21.6B — not this file.
