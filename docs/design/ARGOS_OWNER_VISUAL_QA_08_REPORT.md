# ARGOS Owner Visual QA 08 — Forensic Rendered-Site Review

**Mission:** OWNER VISUAL QA 08
**Date:** 2026-08-31
**Mode:** VISUAL_QA_ONLY (inspection only — zero implementation)
**Runtime:** `http://127.0.0.1:3000/` via `npm run dev` (already running)
**Commit:** None

---

## Executive Verdict

The rendered ARGOS-IT corporate site is largely coherent with Visual Polish 07 intent: Method bar, Hero, services Detail Mode, diagnostic launcher, and reduced-motion behavior work. **It is not production-ready** until footer/mascot occlusion issues and a small set of medium visual defects are surgically fixed.

**Highest-priority rendered defects:** dock mascot speech bubble overlapping footer brand copy; seated footer mascots intersecting the copyright bar at desktop/tablet; diagnostic modal chrome still reads as cyan/SaaS relative to Quiet Authority; mobile Method phase row requires undiscoverable horizontal scroll to reveal O/S.

---

## Environment

| Item | Value |
|------|--------|
| App URL | `http://127.0.0.1:3000/` |
| Start command | `npm run dev` (preexisting process) |
| Browser | Playwright MCP |
| Locale observed | ES |
| Backend | Not required for public visual QA |
| Evidence root | `artifacts/visual-qa-08/` |

### Git baseline (pre-QA)

- **PREEXISTING_CHANGES:** large uncommitted surface (VI-05/06, VP-07, content freeze, chrome, locales, e2e, artifacts, …)
- **VISUAL_POLISH_07_CHANGES:** `argos-corporate.css`, `HomeView.tsx`, `ArgosDetailDialog.tsx`, `mascot-sprites.css`, `ARGOS_VISUAL_POLISH_07_REPORT.md`
- **THIS_MISSION_RUNTIME_FILES_MODIFIED = 0** (only QA artifacts + this report)

---

## Viewports Tested

| Viewport | Height used | Reviewed |
|----------|-------------|----------|
| 1440 | 900 | YES |
| 1024 | 900 | YES |
| 768 | 900 | YES |
| 390 | 844 | YES |

---

## Pages Tested

| Page | URL | States |
|------|-----|--------|
| HOME | `/` | fold, method, philosophy, reality/mint, services, footer, drawer, detail, diagnostic, reduced-motion |
| SERVICIOS | `/servicios` | fold, cards, detail (keyboard), footer; also 390 |
| MÉTODO | `/metodo` | fold, mid, footer; also 390 |
| CONTACTO | `/contacto` | form, footer; also 390 |
| SERVICE DETAIL | `/servicios/consultoria-it` | fold, mid, footer |

---

## Owner Requirement Verification

| Assertion | Result | Notes |
|-----------|--------|-------|
| METHOD_ARGOS_REPETITION = 1_PRIMARY_PRESENTATION | **PASS** | Home method section: single `.argos-method-bar__title` H2 |
| CIRCULAR_LOGO_NEXT_TO_METHOD | **PASS** | Mark left of title |
| CIRCULAR_LOGO_WHITE_SURFACE | **PASS** | `background: rgb(255,255,255)` on mark wrap |
| ARGOS_5_PHASES_DESKTOP_ONE_LINE | **PASS** | A–S same baseline @1440/1024/768 |
| ARGOS_INITIALS_VISUALLY_DOMINANT | **PASS** | Letter ~29–33px vs title ~11.5px |
| PHILOSOPHY_CARD_PREMIUM | **PASS*** | Strong blue presence; *layout width imbalance → P2 |
| CLIENT_REALITY_CARD_PREMIUM | **PASS** | Beige container + mint trio |
| MINT_PROBLEM_CARDS = 3 | **PASS** | All three interactive (“Preguntar a Dumbo”) — affordance intentional |
| DIAGNOSTIC_VISUAL_PRIORITY | **PASS*** | Strong hero CTA; *cyan modal chrome → P2 |
| FOOTER_LOGO_RECTANGULAR_PRESENTATION | **PASS** | `logo-argos-it-footer.png` ~184×81, opacity 1 |
| FOOTER_LOGO_VISIBLE | **PASS** | |
| FOOTER_LOGO_CONTRAST | **PASS** | Light mark on `#505962` / navy panel |
| FOOTER_CHICO / FOOTER_DUMBO | **PASS*** | Present @≥768; hidden @390 (correct); *legal overlap → P1 |
| MASCOT_HERO_INTERVENTION | **NONE** | Dock in side margins; hero copy clear |

---

## P0 Defects

_None observed._

Diagnostic opens, Detail Mode opens/closes (ESC + focus restore), navigation drawer opens, no unusable primary path found.

---

## P1 Defects

### QA08-P1-01 — Dock bubble occludes footer brand copy

| Field | Value |
|-------|--------|
| SEVERITY | P1 |
| PAGE | HOME (footer in viewport) |
| VIEWPORT | 1440 (also likely ≥1024) |
| COMPONENT | `.mascot__bubble--left` vs `.argos-corporate-footer` brand tagline |
| STATE | Footer scrolled into view; dock active |
| OBSERVED | Chico bubble overlaps “Consultoría tecnológica premium…” |
| EXPECTED | `MASCOT_CONTENT_INTERSECTION = 0` |
| EVIDENCE | `artifacts/visual-qa-08/home-1440-footer-close.png`; geometry overlap measured |
| LIKELY_FILE | `mascot-sprites.css` / `ChicoDumboSpriteSystem.tsx` / footer clear-zone CSS |
| LIKELY_ROOT_CAUSE | Fixed dock + bubble not suppressed or re-anchored when footer occupies bottom band |
| FIX_RECOMMENDATION | Hide dock (or bubbles) when footer intersects bottom safe zone; or raise footer padding / lower dock |

### QA08-P1-02 — Seated footer mascots intersect copyright bar

| Field | Value |
|-------|--------|
| SEVERITY | P1 |
| PAGE | HOME footer |
| VIEWPORT | 1440, 1024, 768 |
| COMPONENT | `.argos-corporate-footer__mascot` vs `.argos-corporate-footer__legal` |
| STATE | Default footer |
| OBSERVED | Measured intersection area ≈5086 CSS px² per mascot with “ARGOS-IT. Todos los derechos reservados.” |
| EXPECTED | Mascots do not cover legal/interactive text |
| EVIDENCE | `home-1440-footer-close.png`, `home-768-footer-close.png`; geometry |
| LIKELY_FILE | `argos-corporate.css`, `CorporateFooter.tsx` |
| LIKELY_ROOT_CAUSE | Absolute bottom seating without reserved legal clear space |
| FIX_RECOMMENDATION | Raise mascots / add legal bottom padding / clip mascots above legal strip |

### QA08-P1-03 — Dock sprites also hit legal strip when footer visible

| Field | Value |
|-------|--------|
| SEVERITY | P1 |
| PAGE | HOME footer |
| VIEWPORT | 1440 |
| COMPONENT | `.mascot__img` / dock vs `.argos-corporate-footer__legal` |
| STATE | Footer in view |
| OBSERVED | Dock hit list includes `legal` (in addition to seated assets) |
| EXPECTED | No dock occlusion of footer legal |
| EVIDENCE | Runtime geometry + footer screenshots |
| LIKELY_FILE | Same as P1-01 |
| LIKELY_ROOT_CAUSE | Dual mascot systems (dock + seated) stacked in same bottom corners |
| FIX_RECOMMENDATION | When footer visible, hide dock entirely (seated assets remain) |

---

## P2 Defects

### QA08-P2-01 — Mobile Method phases: incomplete initial disclosure

| Field | Value |
|-------|--------|
| SEVERITY | P2 |
| PAGE | HOME Method bar |
| VIEWPORT | 390 |
| COMPONENT | `.argos-corp-phase-letters-row` |
| STATE | Default (scrollLeft=0) |
| OBSERVED | `overflow-x: auto`; A/R/(partial G) visible; **S not in view**; O partial. Scroll programmatically reveals G/O/S. No strong scroll cue. |
| EXPECTED | Intentional responsive adaptation; if scroll, accessible/discoverable |
| EVIDENCE | `home-390-method.png`, `home-390-method-scrolled.png` |
| LIKELY_FILE | `argos-corporate.css`, `ArgosPhaseLettersRow.tsx` |
| LIKELY_ROOT_CAUSE | Fixed letter sizing + narrow phase flex region |
| FIX_RECOMMENDATION | Wrap to 2 rows, shrink letters slightly, or add fade/scroll hint; keep initials dominant |

### QA08-P2-02 — Diagnostic modal chrome conflicts with Quiet Authority

| Field | Value |
|-------|--------|
| SEVERITY | P2 |
| PAGE | HOME → diagnostic open |
| VIEWPORT | 1440 |
| COMPONENT | Diagnostic survey dialog |
| STATE | Open (pregunta 1/12) |
| OBSERVED | `border-[#22d3ee]/90` + heavy cyan glow/shadow; reads SaaS/neon vs corporate cards |
| EXPECTED | Premium, non-casino, coherent with Quiet Authority |
| EVIDENCE | `home-1440-diagnostic-open.png`, `home-1440-diagnostic-ui.png` |
| LIKELY_FILE | `DiagnosticSurveyModal.tsx` / diagnostic CSS (Tailwind classes) |
| LIKELY_ROOT_CAUSE | Legacy diagnostic visual language not reconciled with corporate tokens |
| FIX_RECOMMENDATION | Retoken border/shadow to navy/mint Quiet Authority; keep function intact |

### QA08-P2-03 — Philosophy card horizontal underfill

| Field | Value |
|-------|--------|
| SEVERITY | P2 |
| PAGE | HOME |
| VIEWPORT | 1440 |
| COMPONENT | `.argos-surface-card--02` |
| STATE | Default |
| OBSERVED | Card width ≈47% of container; large empty mineral field to the right |
| EXPECTED | Premium presence without looking orphaned |
| EVIDENCE | `home-1440-philosophy-close.png` |
| LIKELY_FILE | `argos-corporate.css`, `HomeView.tsx` |
| LIKELY_ROOT_CAUSE | Card max-width / grid not spanning editorial measure |
| FIX_RECOMMENDATION | Widen to content measure or pair with intentional secondary composition |

### QA08-P2-04 — Justified text rivers (method bridge)

| Field | Value |
|-------|--------|
| SEVERITY | P2 |
| PAGE | HOME Method |
| VIEWPORT | 1440 |
| COMPONENT | `.argos-corp-text-justify` in dual-bridge card |
| STATE | Default |
| OBSERVED | Visible word-spacing rivers in justified paragraph (especially mid-block) |
| EXPECTED | Justification without damaging readability |
| EVIDENCE | `home-1440-method-bar.png` / `home-1440-public-movements.png` |
| LIKELY_FILE | `argos-corporate.css` |
| LIKELY_ROOT_CAUSE | `text-align: justify` on medium measure without hyphenation balance |
| FIX_RECOMMENDATION | Prefer `start` on narrow measures; or `text-wrap: pretty` / hyphens; keep freeze copy |

---

## P3 Defects

### QA08-P3-01 — Mint card height variance @390

Heights measured `[151, 173, 173]`. Unequal visual weight when stacked.
Evidence: runtime metrics @390.

### QA08-P3-02 — Service card height variance

Home services heights differ by content length (expected to a degree; still uneven grid).
Evidence: metrics @1024/390.

### QA08-P3-03 — Duplicate “FILOSOFÍA” labeling

Card shows `02 / FILOSOFÍA` plus eyebrow `FILOSOFÍA`. Mild redundancy.
Evidence: `home-1440-philosophy-close.png`.
Note: copy/structure is freeze-adjacent — treat as visual hierarchy polish, not content rewrite unless owner approves.

### QA08-P3-04 — Dev-only Next.js “N” badge

Overlays near Chico paw in screenshots. **Not a production defect** (dev indicator). Exclude from FIX 09 product scope.

---

## Optional Enhancements

_Not FIX 09 defaults:_

- Stronger scroll affordance for Method phases on mobile (if P2-01 kept as scroll strategy)
- Slightly quieter header banner competition with Hero (subjective)
- Formal WCAG contrast audit on cream/mint/beige/diagnostic disabled states

---

## Method QA

| Check | Result |
|-------|--------|
| Primary “Método ARGOS” in section | **1** |
| Circular logo + white disc | PASS |
| Blue institutional bar | PASS |
| A.R.G.O.S. desktop one line | PASS |
| Initials > phase names | PASS |
| Logo clip/distort | PASS (mark wrap intact) |
| Public 4 movements present | PASS (Analizamos / Ordenamos / Protegemos / Acompañamos) |
| False 1:1 visual equivalence to 5 phases | **LOW risk** — bridge copy + “04A / CUATRO MOVIMIENTOS” differentiate; optional watch item only |

---

## Service QA

| Check | Result |
|-------|--------|
| Six public services on Home | PASS |
| Ver detalle beige treatment | PASS |
| Detail Mode open/close | PASS |
| Keyboard open + ESC + focus restore | PASS (`focus` → close; restore to detail button) |
| Servicios page cards | PASS |
| Service detail `/servicios/consultoria-it` | PASS; no overflow |

---

## Diagnostic QA

| Check | Result |
|-------|--------|
| Real diagnostic opens | PASS (12 questions UI) |
| Progress / options / nav | PASS |
| Close (ESC / ×) | PASS |
| Visual tone vs corporate | **FAIL soft → P2-02** |
| Logic/scoring | Not evaluated (protected) |

---

## Footer QA

| Check | Result |
|-------|--------|
| Rectangular logo visible @100% opacity | PASS |
| Nav + legal readable | PASS (except occlusion zones) |
| Chico left / Dumbo right seated | PASS @≥768; **hidden @390** (acceptable) |
| Occlusions | **FAIL → P1-01/02/03** |

---

## Mascot QA

| Metric | Count |
|--------|-------|
| MASCOT_TELEPORTS (4s observe) | **0** |
| POSE_FLASHES | **0** |
| BASELINE_JUMPS | **0** |
| CONTENT_OCCLUSIONS | **≥2** (bubble↔tagline; seated/dock↔legal) |
| UNNATURAL_DIRECTION_CHANGES | **0** (idle dock only during sample) |
| Hero intervention | **NONE** |
| Reduced motion transitions | `transition: none` on `.mascot` |

Dock remains inactive/sitting during passive observation — no wander teleports seen.

---

## Motion QA

| Area | Observation |
|------|-------------|
| Page enter | Present; disabled under reduced motion |
| Section reveal | Home sections use `ArgosReveal`; one-shot; RM → `is-revealed` |
| Drawer | Opens; content pad 360px @desktop |
| Detail Mode | Calm fade/rise; scrollbar pad `15px` observed |
| Diagnostic | Functional; chrome style inconsistent (P2) |
| System coherence | Corporate chrome largely one system; diagnostic still outsider |

---

## Accessibility Observations

- Detail Mode: focus to close, ESC, restore — **PASS**
- Drawer: open/close — **PASS** (full a11y audit not exhaustive)
- Reduced motion: reveals/page-enter/footer idle/mascot transition cancelled — **PASS**
- Diagnostic disabled “Siguiente” low contrast expected when disabled
- Method phase row scroll @390: keyboard/AT discoverability not proven — linked to P2-01
- Philosophy quote verified exact: `…prevenir antes de reaccionar.` (vision false-positive typo discarded)

---

## Responsive Matrix

| | 1440 | 1024 | 768 | 390 |
|--|------|------|-----|-----|
| HORIZONTAL_OVERFLOW (document) | 0 | 0 | 0 | 0 |
| CLIPPED_TEXT | 0 | 0 | 0 | 0* |
| CARD_COLLISIONS | 0 | 0 | 0 | 0 |
| BUTTON_COLLISIONS | 0 | 0 | 0 | 0 |
| LOGO_CLIPPING | 0 | 0 | 0 | 0 |
| MASCOT_OCCLUSIONS | ≥2 | ≥1 | ≥1 | 0 (dock/footer mascots hidden) |
| MODAL_OVERFLOW | 0 | 0 | 0 | 0 |
| Method 5-in-one-line | YES | YES | YES | scroll row |
| Detail Mode usable | YES | YES | YES | YES |

\*Phase letters require horizontal scroll @390 (not document overflow).

---

## Evidence Index

All under `artifacts/visual-qa-08/`:

- Home folds: `home-{1440,1024,768,390}-fold.png` (+ `home-1440-above-fold.png`)
- Method: `home-*-method*.png`, `home-390-method-scrolled.png`
- Philosophy / reality / services / movements: `home-1440-philosophy*.png`, `home-1440-reality-mint.png`, `home-1440-services.png`, `home-1440-public-movements.png`
- States: `home-1440-detail-mode.png`, `home-1440-diagnostic-*.png`, `home-1440-drawer-open.png`, `home-1440-reduced-motion-drawer.png`
- Footer: `home-*-footer*.png`
- Other pages: `servicios-*`, `metodo-*`, `contacto-*`, `service-consultoria-*`, `service-detail-1440.png`

---

## Recommended FIX 09 Scope

Surgical only. No redesign. No content rewrite unless owner explicitly unlocks freeze for P3-03.

| FIX_ID | DEFECT_IDS | FILES_EXPECTED | CHANGE_TYPE | RISK | VERIFICATION_REQUIRED |
|--------|------------|----------------|-------------|------|------------------------|
| F09-01 | P1-01, P1-03 | `mascot-sprites.css`, `ChicoDumboSpriteSystem.tsx`, possibly `argos-corporate.css` | Hide/reposition dock when footer (or bottom content) intersects | Med | Footer @1440/1024; MASCOT_CONTENT_INTERSECTION=0 |
| F09-02 | P1-02 | `argos-corporate.css`, `CorporateFooter.tsx` | Clear seated mascots from legal strip | Low | Footer @1440/768; legal fully readable |
| F09-03 | P2-01 | `argos-corporate.css`, `ArgosPhaseLettersRow.tsx` | Mobile phase layout/scroll affordance | Med | 390: all 5 letters reachable + discoverable |
| F09-04 | P2-02 | Diagnostic modal component / styles | Quiet Authority border/shadow retoken | Med | Open diagnostic; no cyan neon; logic unchanged |
| F09-05 | P2-03 | `argos-corporate.css` / Home philosophy layout | Widen or compose philosophy card | Low | 1440 philosophy not orphaned |
| F09-06 | P2-04 | `argos-corporate.css` | Soften justification rivers | Low | Method bridge readability @1440/768 |

**Order:** F09-01 → F09-02 → F09-03 → F09-04 → F09-05 → F09-06.
P3 only if owner authorizes after P1/P2.

---

## Git Verification

```
RUNTIME_FILES_MODIFIED_BY_QA_08 = 0
PREEXISTING_CHANGES_TOUCHED = 0
```

New artifacts only:

- `artifacts/visual-qa-08/*` (screenshots)
- `docs/design/ARGOS_OWNER_VISUAL_QA_08_REPORT.md` (this file)

Preexisting dirty runtime files remain as found (VP-07 / prior missions). **No restore/stash/commit performed.**

---

## Final Stop Gate

```
OWNER_VISUAL_QA_08 = PASS

VIEWPORT_1440_REVIEWED = YES
VIEWPORT_1024_REVIEWED = YES
VIEWPORT_768_REVIEWED = YES
VIEWPORT_390_REVIEWED = YES

HOME_REVIEWED = YES
SERVICES_REVIEWED = YES
METHOD_REVIEWED = YES
CONTACT_REVIEWED = YES
SERVICE_DETAIL_REVIEWED = YES

METHOD_PRIMARY_PRESENTATIONS = 1
CIRCULAR_LOGO_METHOD = PASS
ARGOS_5_PHASE_DESKTOP_LINE = PASS
ARGOS_INITIAL_HIERARCHY = PASS

MINT_PROBLEM_CARDS = PASS
PHILOSOPHY_CARD = PASS
CLIENT_REALITY_CARD = PASS

DETAIL_MODE_VISUAL = PASS
DETAIL_MODE_KEYBOARD = PASS

DIAGNOSTIC_VISUAL = PASS
REAL_DIAGNOSTIC_OPEN = PASS

FOOTER_LOGO = PASS
FOOTER_LOGO_CONTRAST = PASS
FOOTER_CHICO = PASS
FOOTER_DUMBO = PASS

MASCOT_TELEPORTS = 0
MASCOT_POSE_FLASHES = 0
MASCOT_BASELINE_JUMPS = 0
MASCOT_CONTENT_OCCLUSIONS = 2

HORIZONTAL_OVERFLOW = 0
CLIPPED_TEXT = 0
CARD_COLLISIONS = 0
INTERACTIVE_COLLISIONS = 0

P0_DEFECTS = 0
P1_DEFECTS = 3
P2_DEFECTS = 4
P3_DEFECTS = 3

RUNTIME_FILES_MODIFIED_BY_QA_08 = 0
PREEXISTING_CHANGES_TOUCHED = 0

REPORT_CREATED = YES
EVIDENCE_CAPTURED = YES
FIX_09_PLAN_CREATED = YES

READY_FOR_SURGICAL_FIX_09 = YES
READY_FOR_PRODUCTION = NO
```

**DO NOT COMMIT.**
**DO NOT IMPLEMENT FIXES.**

**STOP.**
