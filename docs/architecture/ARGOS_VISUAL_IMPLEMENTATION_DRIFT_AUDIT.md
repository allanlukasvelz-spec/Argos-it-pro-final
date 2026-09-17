# ARGOS — Visual Implementation Drift Audit

```
STATUS                      = READ_ONLY AUDIT COMPLETE
DATE                        = 2026-08-26
BRANCH                      = feature/argos-multitenant-platform
HEAD                        = 460c985ac6484670d54582b0c1e548c97e853610
RUNTIME_CHANGED             = NO
COMMIT                      = NO
PHASE_9                     = NO
PRODUCTION_READINESS        = NO
```

## 0. Mission answer (one paragraph)

The Phase 8.1 screenshots do not match approved Framer Client/NOC masters primarily because **Framer was never a pixel-equivalent implementation target** (`PIXEL_PERFECT=NO`, `FRAMER_SOURCE_OF_TRUTH=NO` in the Design Contract), and Phase 4/5 shipped a **functional structural shell** (tokens + IA + real data), not a Framer port. Secondary, visible defects in the NOC screenshot are **pre-Phase-8 chrome leakage** (`/noc` not excluded from legacy `SiteShell`) plus **Phase 8 reuse of Client (`cp-*`) components inside NOC**. Phase 8.1 itself changed **zero** frontend visual files.

---

## 1. Authority (source of truth hierarchy)

| Rank | Source | Wins on |
|------|--------|---------|
| 1 | Verified repository | What actually renders |
| 2 | Product Blueprint | Capabilities / honesty |
| 3 | Relume IA | Routes / nav purpose |
| 4 | Design Contract + companion docs | Visual *target* system |
| 5 | Framer `/dashboard` + `/noc` | Composition hierarchy reference only |

Explicit contract flags:

- `PIXEL_PERFECT = NO`
- `FRAMER_SOURCE_OF_TRUTH = NO`
- `RELUME_SOURCE_OF_TRUTH = IA / UX only`
- `CURSOR_MAY_IMPLEMENT_UI = NO` at contract-authoring time; later phases authorized **product** UI, not Framer export

**Implication:** Expecting Phase 8.1 screenshots to look like Framer masters is a **category error** unless a separate visual-alignment phase was authorized. That phase does not appear in Phase 4–8.1 status docs.

---

## 2. Evidence inspected

### Design docs

- `docs/design/ARGOS_DESIGN_CONTRACT.md`
- `docs/design/ARGOS_COMPONENT_SYSTEM.md`
- `docs/design/ARGOS_RESPONSIVE_BEHAVIOR.md`
- `docs/design/ARGOS_UI_STATE_MATRIX.md`
- `docs/design/ARGOS_CLIENT_NOC_VISUAL_RULES.md`
- `docs/design/ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md`
- Phase 4 / 5 / 7 / 8 status docs

### Runtime

- `frontend/app/dashboard/**`, `frontend/components/client/**`, `frontend/styles/client-portal.css`
- `frontend/app/noc/**`, `frontend/components/noc/**`, `frontend/styles/noc-portal.css`
- `frontend/app/layout.tsx`, `frontend/components/layout/SiteShell.tsx`, `frontend/lib/chromeOwnership.ts`
- `frontend/app/globals.css` + marketing CSS imports

### Screenshots under audit

| Artifact | Route captured | Correct route? |
|----------|----------------|----------------|
| `ui-client-reports-desktop.png` | `/dashboard/informes` | YES (Phase 8 Client reports) |
| `ui-client-reports-mobile.png` | `/dashboard/informes` | YES |
| `ui-client-report-ready.png` | `/dashboard/informes` | YES |
| `ui-noc-reports.png` | `/noc/reports` | YES (Phase 8 NOC reports) |

These are **not** captures of Framer master pages `/dashboard` (Resumen) or `/noc` (Command Center). Comparing them to Framer masters mixes **different screens**.

---

## 3. CURRENT vs TARGET — Client

### 3.1 Shell & chrome

| Area | Target | Current | Class |
|------|--------|---------|-------|
| ClientShell | TopBar 56px `#0B1320` + Sidebar 248px `#1F3A5F` + canvas `#F7F7F5` | Implemented via `ClientPortalShell` + `.argos-client-portal` | **MATCH** (structure + tokens) |
| Marketing SiteHeader/Footer | Forbidden | Hidden: `getChromeOwner('/dashboard*') = none` | **MATCH** |
| Cookie / assistants | Forbidden in portal | Hidden for `/dashboard` | **MATCH** |
| Typography Inter | Required for Client/NOC | `system-ui, -apple-system, Segoe UI, Roboto` in `client-portal.css` | **PARTIAL** |
| Nav Relume destinations | Frozen IA | Present (Resumen → Cuenta + activos children) | **MATCH** |
| Nav active | Teal `#2F7D6D` fill | Teal active class | **MATCH** |
| Spacing density | Generous client | Functional card/table spacing; not Framer spacing rhythm | **PARTIAL** |
| Framer Resumen composition | Protection → coverage → … → quick access | Resumen uses real monitoring hierarchy; not Framer mock layout / DEMO org | **INTENTIONALLY_DIFFERENT** + **PARTIAL** |
| Cards / StatusBadge / UNKNOWN | Contract semantics | `Status.tsx` + CSS; UNKNOWN dashed | **MATCH** (semantics) / **PARTIAL** (craft vs Framer) |
| Tables | Rare; cards first | Many pages use tables on desktop + cards mobile | **PARTIAL** |
| CHICO Security Guardian | TARGET permitted; runtime NOT authorized by CHICO contract alone | Phase 7 added `ChicoGuardian` / banner on security surfaces | **PARTIAL** (product presence ≠ Framer polish) |
| Reports (`/dashboard/informes`) | Honest empty until Phase 8; then report list | Functional list + PDF download; `cp-*` styling | **PARTIAL** (product OK, not Framer art) |
| Notifications | TopBar count | Bell → informes; not full notification center UI | **PARTIAL** |

### 3.2 Client screenshot diagnosis (Phase 8.1)

What **does** match brand DNA:

- Navy sidebar `#1F3A5F`, dark topbar `#0B1320`, canvas `#F7F7F5`, teal active `#2F7D6D`
- No public marketing header on Client
- Status pills for READY / GENERATING

What diverges from Framer Client master:

- Screen is **Informes**, not Resumen master
- Table-first layout (ops-adjacent) rather than Framer card narrative
- System font stack (not Inter)
- Links (“Ver PDF”, footer) can fall through to global/default blue (legacy chrome bleed in unscoped anchors)
- Density/spacing is “working portal,” not Framer composition polish

---

## 4. CURRENT vs TARGET — NOC

### 4.1 Shell & chrome

| Area | Target | Current | Class |
|------|--------|---------|-------|
| NocShell | Sidebar 224px `#0B1320`, topbar 48px, dense ops | `NocShell` + `noc-portal.css` | **MATCH** (structure + tokens) |
| Platform health in topbar | Required | Chip PLATFORM OK / degraded | **MATCH** |
| Marketing SiteHeader/Footer | Forbidden | **`/noc` NOT in chromeOwnership `none`** → legacy SiteHeader + SiteFooter | **REGRESSION** (vs target) / **LEGACY** (since Phase 5) |
| CookieBanner | Forbidden | Shown on `/noc` (`shouldHideCookieBanner` only covers `/dashboard`) | **LEGACY** / **REGRESSION** |
| ClientAssistants / CHICO bubble | Forbidden in NOC | Shown on `/noc` (`shouldHideAssistants` only covers `/dashboard`) | **REGRESSION** vs visual rules |
| Inter | Required | `inter.variable` on NOC layout | **PARTIAL** (variable present; density/type still incomplete) |
| OperationalQueue / KPIs / Evidence | Command Center | Present on `/noc` | **PARTIAL** |
| Safety levels / A-B-C | Visible NOC language | Conceptual panels exist | **PARTIAL** |
| Agents / remediations / runbooks | Post Phase 5–7 | Implemented as product pages | **PARTIAL** |
| Reports (`/noc/reports`) | Dense NOC table language | **Imports Client `Status` + `cp-table` / `cp-muted`** | **LEGACY** + **PARTIAL** |

### 4.2 NOC screenshot diagnosis (Phase 8.1)

Primary visual failure modes in `ui-noc-reports.png`:

1. **Global legacy chrome wraps the app** (Argos-IT public header, language strip, diagnostic CTA, footer).
2. **Cookie banner** with legacy `#2563EB` Accept.
3. **CHICO assistant bubble** over NOC content (forbidden by Client/NOC visual rules).
4. Reports table looks **raw / unstyled** because Client `cp-*` classes are scoped under `.argos-client-portal` and do not apply inside `.argos-noc`.
5. Dog imagery overlapping sidebar is assistant/mascot leakage, not NOC shell design.

These are **not** Framer pixel gaps; they are **chrome isolation bugs** + **wrong component reuse**.

---

## 5. Token audit (runtime)

### Canonical (active in Client/NOC scoped CSS)

| Token | Hex | Client | NOC |
|-------|-----|--------|-----|
| Brand primary | `#1F3A5F` | `--cp-navy` YES | `--noc-navy` YES |
| Brand secondary | `#2F7D6D` | `--cp-teal` YES | `--noc-teal` YES |
| Brand surface | `#F7F7F5` | `--cp-canvas` YES | canvas near-equivalent `#e8eaed` (NOC denser) |
| Brand dark | `#0B1320` | `--cp-topbar` YES | `--noc-sidebar` YES |

### Legacy (still alive globally; not Client/NOC identity)

| Token | Hex | Where |
|-------|-----|-------|
| Legacy blue | `#2563EB` | `globals.css` `--action-primary`, auth, SiteHeader, CookieBanner Accept |
| Legacy cyan | `#18D4F7` | marketing / method / home shells, `--argos-cyan` |

**Do not replace in this audit.** Note: Client/NOC portals correctly *define* canonical tokens locally, but **global CSS still loads** on every route (`argos-marketing-chrome.css`, `argos-backgrounds.css`, etc.), so unscoped elements inherit legacy.

---

## 6. Component system inventory

| Approved conceptual component | Exists in runtime? | Visual completeness |
|-------------------------------|--------------------|---------------------|
| ClientShell / TopBar / Sidebar | YES (`ClientPortalShell`) | Structural MATCH |
| NocShell / TopBar / Sidebar | YES | Structural MATCH; chrome isolation FAIL |
| PageHeader | YES (Client + NOC variants) | PARTIAL |
| StatusBadge / HealthBadge | YES Client; NOC has badges | PARTIAL |
| CoverageMeter | CoverageIndicator approx. | PARTIAL |
| FreshnessIndicator | Soft meta text | PARTIAL / MISSING formal |
| OperationalQueue | YES NOC | PARTIAL |
| EvidencePanel | YES NOC | PARTIAL |
| SafetyLevelBadge / ApprovalGate | Partial badges; gates productized in remediations | PARTIAL |
| MockLabel | Semantics via honesty copy | PARTIAL |
| Framer-exported design system kit | NO | MISSING (intentional) |

---

## 7. Git forensics

| Commit | Role | Visual impact |
|--------|------|---------------|
| `393b562` Phase 4 | Client portal shell + `client-portal.css` | **First Client structural implementation** of contract tokens — not Framer port |
| `4f3dbc9` Phase 5 | NOC shell + `noc-portal.css` | **First NOC structural implementation**; `/noc` left on legacy chrome owner |
| `7693135` Phase 7 | CHICO guardian UI + NOC agents/remediation pages + CSS additions | Adds guardian presence; still not Framer |
| `f4e79a8` Phase 8 | `informes` + `noc/reports` + notifications bell | **Functional pages**; NOC reports reuses Client `Status`/`cp-*` |
| `460c985` Phase 8.1 | Validation docs/tests/harness only | **`git diff f4e79a8..460c985 -- frontend/…` empty** for styles/components |

### Verdict flags

```
DID_PHASE8_BREAK_VISUALS              = PARTIAL
  (NOC /reports page incorrectly uses Client components → unstyled table;
   Client informes is new product UI under existing shell — not a shell break)

DID_PHASE81_BREAK_VISUALS             = NO
  (no frontend visual file changes)

VISUAL_MASTER_WAS_NEVER_FULLY_IMPLEMENTED = YES
  (by Design Contract: Framer = reference; Phase 4/5 delivered functional shells)
```

### Did Phase 4/5 “regress” later?

- Client shell tokens and IA: **no regression** through 8.1.
- NOC chrome isolation: **never correct** relative to Design Contract (gap introduced at Phase 5, still present).
- Phase 7 CHICO on Client: **authorized product direction** vs CHICO TARGET; still not Framer polish; **forbidden** when leaked into NOC via SiteShell.

---

## 8. Root cause ranking

1. **Expectation mismatch** — Framer masters treated as pixel targets despite contract `PIXEL_PERFECT=NO` / `FRAMER_SOURCE_OF_TRUTH=NO`.
2. **Incomplete visual phase** — Phase 4/5 implemented *product shells* (tokens + Relume IA + real data), not Framer composition/typography craft.
3. **NOC chrome ownership gap** — `getChromeOwner` excludes `/dashboard` but not `/noc` → legacy SiteHeader/Footer/Cookie/Assistants on all NOC routes since Phase 5.
4. **Phase 8 component reuse** — `/noc/reports` imports Client `PageHeader`/`StatusBadge` and `cp-*` classes that do not style under `.argos-noc`.
5. **Screenshot scope** — Phase 8.1 captured reports routes, not Framer Resumen / Command Center masters.
6. **Global CSS always loaded** — marketing token cascade remains available to bleed into unscoped elements.
7. **Typography** — Client font stack is system-ui; Inter only partially wired on NOC.

---

## 9. Files requiring future correction (when authorized)

**Chrome isolation (highest severity visual defect vs contract):**

- `frontend/lib/chromeOwnership.ts` — add `/noc` → `none`
- `frontend/components/layout/SiteShell.tsx` — hide assistants + cookie banner for `/noc`

**Phase 8 NOC reports (wrong DNA):**

- `frontend/app/noc/reports/page.tsx` — replace Client `Status`/`cp-*` with `NocUi` + `noc-*`

**Typography / tokens (Client/NOC craft):**

- `frontend/styles/client-portal.css` — Inter via `--font-inter`
- `frontend/app/dashboard/layout.tsx` — ensure Inter variable scope
- Unscoped link colors inside portals

**Optional later visual-alignment phase (only if human-authorized):**

- Resumen / Command Center composition polish vs Framer hierarchy
- Spacing rhythm, card craft, queue density
- Notification center UI beyond bell
- CHICO guardian placement polish per CHICO contract (Client only)

**Do not touch:** public website / Corporate freeze / Framer Agent export.

---

## 10. Recommended correction plan (future only)

```
STEP 0  Human authorize a "Visual Isolation + DNA Fix" mini-phase (not Phase 9).
STEP 1  Fix chromeOwnership + SiteShell hides for /noc (STOP marketing chrome on NOC).
STEP 2  Rewrite /noc/reports to use NocUi/noc-* only; re-screenshot.
STEP 3  Wire Inter on Client portal; kill unscoped legacy link blues inside portals.
STEP 4  Re-capture: Client /dashboard (Resumen) + /dashboard/informes + NOC /noc + /noc/reports.
STEP 5  Only then decide if a Framer hierarchy polish phase is warranted
        (explicit PIXEL_ALIGNMENT authorization — currently NO).
```

---

## 11. Final gate block

===== ARGOS VISUAL DRIFT AUDIT =====

HEAD=460c985ac6484670d54582b0c1e548c97e853610
CLIENT_MASTER_STATUS=PARTIAL (shell+tokens MATCH; Framer composition NEVER implemented)
NOC_MASTER_STATUS=PARTIAL (shell+tokens MATCH; chrome isolation FAIL; Framer NEVER implemented)

CLIENT_SHELL=MATCH
NOC_SHELL=PARTIAL (structure MATCH; wrapped by legacy SiteShell)
DESIGN_TOKENS=MATCH inside portals / LEGACY globally
TYPOGRAPHY=PARTIAL (system-ui Client; Inter partial NOC)
SPACING=PARTIAL
COMPONENT_SYSTEM=PARTIAL
RESPONSIVE=PARTIAL (Client mobile cards exist; not Framer-parity)
CHICO=PARTIAL Client / REGRESSION when shown on NOC
REPORTS=PARTIAL (Client OK under shell; NOC wrong component DNA)
NOTIFICATIONS=PARTIAL

LEGACY_COMPONENTS=YES (Client Status reused in NOC reports; CookieBanner/SiteHeader on NOC)
LEGACY_STYLES=YES (#2563EB/#18D4F7 in global/marketing/auth)
GLOBAL_STYLE_INTERFERENCE=YES (SiteShell legacy chrome on /noc; global CSS cascade)

PHASE4_VISUAL_IMPLEMENTATION=STRUCTURAL_SHELL (canonical tokens; not Framer)
PHASE5_VISUAL_IMPLEMENTATION=STRUCTURAL_SHELL + CHROME_GAP (/noc not chrome-none)
PHASE7_VISUAL_CHANGES=CHICO guardian + denser NOC ops pages
PHASE8_VISUAL_CHANGES=reports pages + notifications bell; NOC reports uses cp-*
PHASE81_VISUAL_CHANGES=NONE (artifacts only)

ROOT_CAUSE=Framer never pixel-bound + Phase4/5 functional shells + /noc chrome leak since Phase5 + Phase8 Client-component reuse on NOC reports; 8.1 screenshots expose this

DID_PHASE8_BREAK_VISUALS=PARTIAL
DID_PHASE81_BREAK_VISUALS=NO
VISUAL_MASTER_WAS_NEVER_FULLY_IMPLEMENTED=YES

FILES_REQUIRING_FUTURE_CORRECTION=
- frontend/lib/chromeOwnership.ts
- frontend/components/layout/SiteShell.tsx
- frontend/app/noc/reports/page.tsx
- frontend/styles/client-portal.css
- frontend/app/dashboard/layout.tsx
- (optional later) Resumen/Command Center craft under authorized visual phase

RUNTIME_CHANGED=NO
COMMIT=NO
PUSH=NO
DEPLOY=NO
PHASE9=NO

RECOMMENDED_CORRECTION_PLAN=Authorize isolation fix (/noc chrome-none + hide assistants/cookies) then rewrite NOC reports to noc-* DNA; only after that consider Framer hierarchy polish as a separate authorized visual phase

STOP_FOR_HUMAN_REVIEW=YES
