# ARGOS Design Contract — Client Portal + Internal NOC

```
STATUS                    = SPEC_COMPLETE
IMPLEMENTATION_BINDING    = YES (when a visual implementation phase is authorized)
CURSOR_MAY_IMPLEMENT_UI   = NO
PHASE_3_AUTHORIZED        = NO
PUBLIC_WEBSITE            = UNCHANGED / FROZEN (21.6B)
PIXEL_PERFECT             = NO
FRAMER_SOURCE_OF_TRUTH    = NO
RELUME_SOURCE_OF_TRUTH    = IA / UX only
PRODUCT_SOURCE_OF_TRUTH   = docs/blueprint/ARGOS_MASTER_PRODUCT_BLUEPRINT.md
VERIFIED_CODE_WINS        = YES (capabilities, APIs, data)
HUMAN_VISUAL_REVIEW       = PASS_WITH_REFINEMENTS
```

This contract converts the approved product blueprint, Relume information architecture, and Framer **master screens** into a deterministic visual specification.

Framer is a **visual reference**. Relume is an **IA/UX reference**. Repository + canonical Blueprint remain authoritative for capabilities, security, and implementation status.

**Do not implement this UI in this documentation phase.**

---

## 0. Authority and conflict resolution

| Rank | Source | Wins on |
|------|--------|---------|
| 1 | Verified repository (auth, tenancy, APIs, schema) | What exists / what is safe |
| 2 | Canonical Blueprint (product, health, A/B/C, automation) | Semantics and capabilities |
| 3 | Relume approved IA (frozen sitemap) | Routes, nav labels, page purpose |
| 4 | This Design Contract + component/responsive/state docs | Visual system for Client + NOC |
| 5 | Framer masters `/dashboard` and `/noc` | Composition reference (not pixels, not code) |

If a prototype shows a capability that the repository and Blueprint mark as `NOT_IMPLEMENTED` / `PHASE_n` / `FUTURE`, the UI may show an honest empty/unknown/planned state. It must **never** present MOCK data as production truth.

Related documents:

| Document | Role |
|----------|------|
| [ARGOS_COMPONENT_SYSTEM.md](./ARGOS_COMPONENT_SYSTEM.md) | Reusable components (conceptual) |
| [ARGOS_RESPONSIVE_BEHAVIOR.md](./ARGOS_RESPONSIVE_BEHAVIOR.md) | Desktop / tablet / mobile |
| [ARGOS_UI_STATE_MATRIX.md](./ARGOS_UI_STATE_MATRIX.md) | Screen and data states |
| [ARGOS_CLIENT_NOC_VISUAL_RULES.md](./ARGOS_CLIENT_NOC_VISUAL_RULES.md) | Two languages, one DNA |
| [ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md](./ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md) | CHICO Security Guardian TARGET (Client security; runtime NO) |
| [tokens.md](./tokens.md) | Existing token architecture (21.3) |
| [ARGOS_VISUAL_FREEZE_21_6B.md](./ARGOS_VISUAL_FREEZE_21_6B.md) | Public Corporate freeze |
| [../blueprint/ARGOS_DESIGN_CONTRACT.md](../blueprint/ARGOS_DESIGN_CONTRACT.md) | Blueprint pointer |

---

## 1. Frozen product decisions (not visual)

ONE PLATFORM / THREE EXPERIENCES:

```
PUBLIC WEBSITE     CLIENT PORTAL      INTERNAL NOC
        \                |                 /
                     ARGOS CORE
```

| Experience | Route root | Visual register | Density |
|------------|------------|-----------------|--------|
| PUBLIC | `/` | Quiet Authority / Light Premium Institutional | low–medium editorial |
| CLIENT | `/dashboard` | calm, reassuring, business | low–medium |
| NOC | `/noc` | dense, technical, operational | high (readable, not tiny) |

CLIENT and NOC share ARGOS DNA and **must not** look like the same application with different menu items.

PUBLIC is out of scope for this contract. Do not restyle Corporate chrome, logo, mascots, or public navigation.

Non-negotiable product clauses:

- Tenant isolation: ORG A never sees ORG B.
- `UNKNOWN != HEALTHY`.
- `NO_INCIDENTS_DETECTED != FULLY_HEALTHY`.
- Coverage `N/M` != complete protection.
- MOCK / DEMO / PLACEHOLDER labels on prototype numbers only; production uses real evidence or honest unknown/empty.
- Automation L3 = human approval. L4 = never automatic. No silent auto-fix.
- Logo, Chico, Dumbo: PROTECTED. Exactly two canonical robots: **CHICO** + **DUMBO**.
- **CHICO** = ARGOS SECURITY GUARDIAN (customer-facing). **DUMBO** = UX/guide role preserved.
- Mascot placement **CURRENT (21.6B):** `ASSISTANT_ONLY` (historical freeze; public/assistant docks).
- Mascot placement **TARGET (amendment 2026-08-25):** CHICO is **permitted** as contextual Security Guardian presence on Client security surfaces (`/dashboard`, `/dashboard/seguridad`, `/dashboard/monitorizacion`, `/dashboard/alertas`, `/dashboard/incidentes`, `/dashboard/prevencion` + shared security components). See [ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md](./ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md).
- Still **forbidden:** CHICO/DUMBO in NOC chrome; DUMBO as security state; mascot-driven portal; regenerating assets. **Runtime CHICO Client UI = NOT AUTHORIZED** until a separate UI phase.

---

## 2. Current code vs target UI (honesty)

| Surface | CURRENT (repo) | TARGET (this contract) |
|---------|----------------|------------------------|
| `/dashboard` | Single page, no app sidebar, `ArgosPageShell`, portal + assets + TLS | ClientShell + frozen Resumen hierarchy |
| Health engine | NOT EXISTS (Phase 3) | Visual states specified; data remains Phase 3 |
| Alerts / incidents | NOT EXISTS | Cards/queue specified; empty/unknown until Phase 3 |
| `/noc` | IMPLEMENTED (Phase 5 read-only) | NocShell specified; no runtime |
| Painted colors | Semantic tokens → **legacy** `#2563EB` / `#18D4F7` | Client/NOC **target** uses canonical brand tokens below |
| Fonts | Roles frozen; Inter/Cormorant **not loaded** | Load Inter for Client/NOC when UI phase is authorized |
| PUBLIC | 21.6B freeze | Unchanged |

Framer MOCK content (ORG-DEMO, example.com, Demo Server, A. Demo, A. Operator) is **not** production data.

---

## 3. Approved master screens (information hierarchy FROZEN)

### 3.1 CLIENT `/dashboard` — Resumen

Visual reference: Framer project **ARGOS — Product UI Master**, page `/dashboard`.

Hierarchy (do not reorder):

1. Protection Summary (attention / status)
2. Coverage
3. Control state
4. Asset health
5. Alerts
6. Incidents
7. Preventive actions
8. Recent activity
9. Quick access (Informes / Soporte)

Client questions in ~10 seconds (product, not marketing):

1. Is ARGOS observing my systems?
2. What is monitored / covered?
3. What requires attention?
4. Is there an incident?
5. Are there preventive findings?
6. What happened recently?
7. Do I need to do something?

### 3.2 NOC `/noc` — Command Center

Visual reference: Framer page `/noc`.

Hierarchy (do not reorder):

1. Global Platform Health (ARGOS itself, not a customer)
2. Operational KPIs
3. Operational queue
4. Selected signal / evidence
5. Hypothesis
6. Action A
7. Verification
8. Failure evidence
9. Action B
10. Action C
11. Safe stop / rollback / human escalation
12. Remediation safety gates (L0–L4)
13. Preventive / predicted risks
14. Agents / platform health

Primary action: **Inspect**. Secondary if L3: **Request approval**. Never **Auto Fix Everything**.

### 3.3 Navigation (Relume IA wins over Framer omissions)

**Client sidebar (frozen labels):** Resumen · Mis activos · Monitorización · Seguridad · Alertas · Incidentes · Prevención · Auditorías · Informes · Soporte · Cuenta.

Mis activos children (Relume): Dominios, Websites, Servidores, APIs, Bases de datos, Servicios, Certificados TLS.

**NOC sidebar (Relume frozen sitemap — restore items Framer dropped):** Command Center · Customers · Organizations · Assets · Global Health · Monitoring · Alerts · Incidents · Predicted Risks · Preventive Actions · TLS · DNS · Servers · Databases · Backups · Agents · Runbooks · Remediations · Reports · Support · Audit · Platform Health.

Framer used shorter labels (`Risks`, `Prevention`) and omitted Support / Platform Health. **IA wins:** keep Relume destinations. Visual grouping (Infrastructure cluster) is allowed without dropping routes.

---

## 4. Color system (Client + NOC target)

Canonical brand (CAB-DS-01). No near-equivalent substitutions. `#072648` REJECTED as primary. Legacy cyan `#18D4F7` and chrome blue `#2563EB` are **not** Client/NOC identity.

### 4.1 Brand primitives

| Token | Hex | Role |
|-------|-----|------|
| `--argos-brand-primary` | `#1F3A5F` | Authority, Client sidebar, primary buttons, selected |
| `--argos-brand-secondary` | `#2F7D6D` | System accent, HEALTHY accent, Client nav active |
| `--argos-brand-surface` | `#F7F7F5` | App canvas |
| `--argos-brand-dark` | `#0B1320` | Top bar, NOC structural chrome, text on light |

### 4.2 Surfaces

| Token | Client | NOC |
|-------|--------|-----|
| Canvas | `#F7F7F5` | `#F7F7F5` |
| Card / elevated | `#FFFFFF` | `#FFFFFF` |
| Sidebar | `#1F3A5F` | `#0B1320` |
| Top bar | `#0B1320` | `#0B1320` |
| Inverse text | `#F4FAFF` / white | white |
| Body text | `#0B1320` | `#0B1320` |
| Secondary text | `#4B5563` | `#374151` |
| Border default | `#E5E7EB` | `#D1D5DB` |
| Border strong | `#1F3A5F` | `#0B1320` |

NOC uses the **same ivory canvas** as Client (Quiet Authority), not a cyberpunk dark workspace. Density comes from type, spacing, and tables — not from neon.

### 4.3 Semantic status (never color-only)

Each status requires **label + icon + text + non-color shape** (solid vs dashed border, or distinct mark).

| Status | Fill / accent | Border | Icon (conceptual) | Text |
|--------|---------------|--------|-------------------|------|
| HEALTHY | teal `#2F7D6D` on text/icon; optional 1px teal edge | solid | check / pulse | `HEALTHY` (NOC) / client: estado correcto **with evidence** |
| WARNING | `#B45309` | solid amber | triangle | `WARNING` |
| CRITICAL | `#B91C1C` | solid 2px dark/red | diamond / alert | `CRITICAL` |
| UNKNOWN | `#6B7280` | **dashed** 1.5px `#9CA3AF` | minus-in-circle | `UNKNOWN` / `DESCONOCIDO` |
| DETECTED | navy `#1F3A5F` | solid | flag | `DETECTED` |
| INFERRED | `#4B5563` | solid | dotted-node | `INFERRED` |
| PREDICTED | `#4B5563` | dashed | trend | `PREDICTED` · empty/honest until Phase 9 |
| MOCK / DEMO | `#6B7280` | none | none | suffix `· MOCK` / `· DEMO` |
| APPROVAL_REQUIRED | white on navy or navy outline | 2px `#1F3A5F` | lock / stamp | `L3 · APPROVAL REQUIRED` |

**UNKNOWN must never use teal fill, solid green edge, or check icon.**

WCAG AA on the actual surface. Teal-on-ivory is AA for large/bold; for small text pair `#2F7D6D` with weight ≥ 600 or use navy text + teal mark.

### 4.4 Forbidden palette uses

- Cyan legacy as brand identity
- Glassmorphism as default
- Gradient-as-identity
- Red-only or green-only status
- Painting UNKNOWN as HEALTHY “for calm”

---

## 5. Typography

| Role | Public (frozen) | Client / NOC |
|------|-----------------|--------------|
| Display | Cormorant Garamond | **Do not use** in app chrome, tables, buttons, labels |
| Body / UI | Inter | **Inter** |
| Manrope | REJECTED | REJECTED |

Until fonts are loaded in an authorized UI phase, stacks may fall back to system sans **with Inter as the specified target**.

### 5.1 Type scale (Client)

| Token | Size / line | Weight | Use |
|-------|-------------|--------|-----|
| `display` | 28 / 36 | 600 | Page `h1` only |
| `title` | 20 / 28 | 600 | Section headings |
| `body` | 16 / 24 | 400 | Explanations |
| `label` | 12 / 16 | 600 | Eyebrows, MOCK, freshness (uppercase tracking 0.06em) |
| `ui` | 14 / 20 | 500 | Nav, buttons, badges |

### 5.2 Type scale (NOC) — readable density

Minimum body/table size: **13px**. No 10–11px dashboards.

| Token | Size / line | Weight | Use |
|-------|-------------|--------|-----|
| `display` | 22 / 28 | 650 | `h1` Command Center |
| `title` | 16 / 22 | 650 | Queue / panel titles |
| `body` | 14 / 20 | 400 | Evidence copy |
| `table` | 13 / 20 | 500 | Queue cells |
| `label` | 11 / 16 | 650 | Column headers (11px **only** for caps headers; cells stay 13px) |
| `ui` | 13 / 18 | 550 | Nav, badges |

One `h1` per page.

---

## 6. Spacing, grid, containers

Base unit: **4px**.

Scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.

| Token | Value | Typical use |
|-------|-------|-------------|
| `space-1` | 4 | Icon gap |
| `space-2` | 8 | Badge padding |
| `space-3` | 12 | Compact NOC cell padding |
| `space-4` | 16 | Card inner (NOC) |
| `space-5` | 24 | Card inner (Client), section gap |
| `space-6` | 32 | Between Client sections |
| `space-8` | 48 | Page header → first block (Client) |

**Grid Client:** 12 columns inside main; max content width **1120px**; horizontal page padding 24 (desktop), 16 (tablet), 16 (mobile).

**Grid NOC:** fluid 12 columns; no max-width cap; padding 16 desktop. Queue is full bleed of main. Evidence + Safety Gates = 7 / 5 split ≥1280px.

---

## 7. Shell dimensions

| Element | Client | NOC |
|---------|--------|-----|
| Top bar height | 56px | 48px |
| Sidebar width | 248px | 224px |
| Sidebar collapsed | 72px icons + labels via tooltip | 64px |
| Sidebar label | `CLIENT PORTAL` | `ARGOS INTERNAL NOC` |
| Nav item height | 40px | 32px |
| Nav active | teal `#2F7D6D` fill, white text | teal `#2F7D6D` fill, white text |
| Nav default | white/70 on navy | white/70 on dark |
| Content min height | `100vh - 56px` | `100vh - 48px` |

Top bar content (Client): ARGOS wordmark/logo · organization name · freshness · notifications (when they exist) · user.

Top bar content (NOC): ARGOS NOC · GLOBAL PLATFORM HEALTH (ARGOS core, not tenant) · freshness MOCK/real · operator identity.

Logo: existing assets only (`logo-argos-it.png` / header / dark). Do not regenerate.

---

## 8. Radius, borders, elevation

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | 4px | Badges, inputs, table chips |
| `radius-md` | 8px | Cards, buttons, nav item |
| `radius-lg` | 12px | Client feature cards only |
| `radius-full` | 999px | **Forbidden** as default (no huge pills) |

| Border | Value |
|--------|-------|
| Default | 1px `#E5E7EB` |
| Emphasis | 1px `#1F3A5F` |
| UNKNOWN | 1.5px dashed `#9CA3AF` |
| Selected row | 2px left bar `#1F3A5F` + 1px navy outline |

Shadows: **minimal**. Client cards: `0 1px 2px rgba(11,19,32,0.06)`. NOC: none on table; 1px border only. No glow, no ambient neon.

---

## 9. Iconography

- Stroke icons, 20px Client nav / 18px NOC nav, 16px inline.
- Status icons required (see §4.3).
- No shields, locks-as-brand, HUD reticles, AI brains, circuit boards.
- Perimeter / observation motifs: optional, quiet, never decorative animation implying live telemetry.

---

## 10. Buttons, inputs, navigation

### Buttons

| Variant | Use | Style |
|---------|-----|-------|
| Primary | one per context | fill `#1F3A5F`, text white, radius 8, height 40 Client / 32 NOC |
| Secondary | Inspect vs Approval | outline 1px `#1F3A5F`, transparent fill |
| Destructive | rare | outline `#B91C1C`, never as default |
| Ghost | tertiary | text navy, no fill |
| Disabled | `opacity 0.45`, `cursor: not-allowed`, **no** click |

L3 primary is **Request approval**, not Execute.

### Inputs

Height 40 Client / 32 NOC. Border 1px `#D1D5DB`. Focus: 2px `#1F3A5F` outline, offset 2px. Labels always visible (no placeholder-only).

### Tabs

Underline 2px teal for Client; underline 2px navy for NOC. Selected is not color-only (aria-selected + weight 650).

### Navigation

Keyboard: Tab order top bar → sidebar → main. Skip link to `#main`. Current item: `aria-current="page"`.

---

## 11. Cards, tables, badges, overlays

**Cards:** white surface, 1px border, radius 8 (NOC) / 8–12 (Client). Padding 24 Client / 16 NOC. Title + optional MOCK eyebrow.

**Tables (OperationalQueue):** sticky header, row height ≥ 44px (touch later), zebra optional at 3% navy. Selected row: left 2px navy bar. Numeric/severity columns tabular.

**Badges:** label + icon; height 24; padding 8×12; radius 4. Not pills.

**Tooltip:** 12/16 text, navy 90% bg, white text; not the only status channel.

**Modal:** for L3 confirmation only; focus trap; Esc closes; evidence visible inside.

**Drawer:** mobile Client nav; tablet NOC detail. Width 320 Client / 400 NOC.

---

## 12. Interaction states

| State | Spec |
|-------|------|
| Hover | background `rgba(31,58,95,0.06)` on light; white/10 on dark chrome. 120ms opacity. |
| Focus-visible | 2px solid `#1F3A5F` (or white on dark), offset 2px. Never `outline: none` without replacement. |
| Active / selected | navy left bar + `aria-selected` / `aria-current`. |
| Disabled | see buttons; no tooltip as sole explanation — visible helper text. |
| Loading | skeleton using `#E5E7EB` bars; **no** fake radar scan. |
| Reduced motion | `prefers-reduced-motion: reduce` → no positional motion; state changes instant. |

Motion allowed: 120–200ms fade, drawer slide, toast enter. Forbidden: cyberpunk glow, looping “live telemetry” when data is stale or MOCK.

---

## 13. Protection language (Client)

Allowed precise phrases (when true):

- ARGOS está observando.
- MONITORED
- COVERED `N/M`
- HEALTHY (asset/control **with evidence**)
- NO INCIDENTS DETECTED
- ATENCIÓN REQUERIDA
- DESCONOCIDO / UNKNOWN

Forbidden unless evidence supports them:

- Fully Protected / 100% protected / Everything is secure
- Invented scores (96, 99.99) except labelled MOCK in prototypes — **never in production**

Coverage card must show both monitored count and covered count. HEALTHY copy must state that HEALTHY ≠ total coverage.

---

## 14. Evidence and safety language (NOC)

Visible chain:

`SIGNAL → EVIDENCE → HYPOTHESIS → ACTION A → VERIFY`

Fail path:

`FAILURE EVIDENCE → UPDATED HYPOTHESIS → ACTION B → ACTION C → SAFE STOP / ROLLBACK / HUMAN ESCALATION`

| Level | Name | UI |
|-------|------|----|
| L0 | READ ONLY | badge; may auto |
| L1 | SAFE AUTOMATION | badge; may auto |
| L2 | REVERSIBLE CHANGE | rollback visible |
| L3 | HUMAN APPROVAL | **ApprovalGate** before execute |
| L4 | PROHIBITED AUTOMATICALLY | no execute control |

Copy: “No silent auto-fix. Execution requires explicit evidence and the appropriate safety gate.”

Predicted risks: Phase 9. Until methodology exists: empty or `DETECTED · PLANNED` from rules — never fake AI prophecy.

---

## 15. Accessibility

- Contrast AA on real surfaces.
- Status: text + icon + shape; not color alone.
- Landmarks: `banner`, `navigation`, `main`.
- Touch targets ≥ 44px on Client mobile; NOC desktop may use 32px row chrome but focus still visible.
- Spanish UI labels for Client; NOC may mix ES/EN operational tokens (`CRITICAL`, `INSPECT`) with Spanish evidence prose.

---

## 16. Assets

**Allowed:** existing ARGOS logos in `frontend/public/`.
**Forbidden:** regenerate logo/mascots; client-work aesthetics (UDIC, TusetCN, Flores Galí, landscaping); Relume marketing heroes/FAQ/testimonials/pricing footers inside Client or NOC.

---

## 17. Implementation gate (explicit)

```
DESIGN_CONTRACT_STATUS              = SPEC_COMPLETE
CHICO_SECURITY_GUARDIAN_AMENDMENT   = APPROVED (TARGET docs)
CURSOR_MAY_IMPLEMENT_UI             = NO
CURSOR_MAY_IMPLEMENT_CHICO_CLIENT_UI = NO
PHASE_3_EXECUTED                    = NO
PUBLIC_CHANGED                      = NO
FRAMER_EXPORT                       = NO
FRAMER_PUBLISH                      = NO
```

A future authorized UI phase must implement **this** contract (and the CHICO Guardian contract where Client security presence is in scope), not copy Framer-generated code.
