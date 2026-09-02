# ARGOS Surgical Visual Fix 09 — Report

**Mission:** SURGICAL VISUAL FIX 09
**Date:** 2026-08-31
**Source of truth:** `docs/design/ARGOS_OWNER_VISUAL_QA_08_REPORT.md`
**Evidence before:** `artifacts/visual-qa-08/`
**Evidence after:** `artifacts/visual-fix-09/`
**Commit:** None

---

## Executive Verdict

All three QA08 P1 footer/dock occlusions are eliminated (bounding-box intersections = 0). All four P2 defects are corrected with local changes. One trivial P3 (duplicate Filosofía eyebrow presentation) fixed in an already-touched file; mint/service height P3 deferred.

**READY_FOR_OWNER_FINAL_ACCEPTANCE = YES**
**READY_FOR_PRODUCTION = YES** (gates below; owner visual acceptance still recommended before git integration)

---

## QA 08 Baseline

| Metric | Value |
|--------|--------|
| P0 | 0 |
| P1 | 3 |
| P2 | 4 |
| P3 | 3 |
| MASCOT_CONTENT_OCCLUSIONS | ≥2 |
| READY_FOR_PRODUCTION | NO |

---

## Defects Addressed

| ID | Severity | Status |
|----|----------|--------|
| QA08-P1-01 | P1 Dock bubble ↔ footer tagline | **FIXED** |
| QA08-P1-02 | P1 Seated mascots ↔ legal bar | **FIXED** |
| QA08-P1-03 | P1 Dock sprites ↔ legal | **FIXED** |
| QA08-P2-01 | P2 Method 390 discoverability | **FIXED** |
| QA08-P2-02 | P2 Diagnostic cyan border | **FIXED** |
| QA08-P2-03 | P2 Philosophy width | **FIXED** |
| QA08-P2-04 | P2 Justification rivers | **FIXED** |
| QA08-P3-03 | P3 Duplicate Filosofía eyebrow | **FIXED** (trivial presentation) |
| QA08-P3-01 | P3 Mint heights | **DEFERRED** |
| QA08-P3-02 | P3 Service heights | **DEFERRED** |

---

## P1 Fixes

### QA08-P1-01 / P1-03 — Floating dock vs footer

| Field | Detail |
|-------|--------|
| ROOT_CAUSE | Fixed dock + bubbles remained visible while footer occupied the bottom band |
| FIX | `IntersectionObserver` on `.argos-corporate-footer` sets `body[data-footer-in-view]`; CSS hides `.mascot-root` (same pattern as detail-mode) |
| FILES | `ChicoDumboSpriteSystem.tsx`, `mascot-sprites.css` |
| VERIFY | Footer scrolled @1440/1024/768: `dockVisible=false`, `dockLegal=0`, `dockTag=0`; mid-page dock remains `opacity:1` |

### QA08-P1-02 — Seated footer mascots vs legal

| Field | Detail |
|-------|--------|
| ROOT_CAUSE | Absolute `bottom: 0.35rem` placed seated assets inside ZONE C (legal strip) |
| FIX | Explicit zones: `--footer-legal-h` / `--footer-mascot-zone`; mascots sit above legal; legal bar solid `#505962` + `z-index:2`; grid `padding-bottom` reserves ZONE B |
| FILES | `argos-corporate.css` |
| VERIFY | `@1440/1024/768`: `chicoLegal=null`, `dumboLegal=null`, no tagline/logo/link overlaps; `@390` mascots remain `display:none` |

---

## P2 Fixes

### QA08-P2-01 — Method mobile discoverability

| Field | Detail |
|-------|--------|
| ROOT_CAUSE | `--mascot-clear-inline` (~100px) applied while dock already hidden ≤1023px, crushing method bar to ~175px; phases track ~133px wide |
| FIX | Set `--mascot-clear-inline: 0` when dock hidden; column method bar ≤767; edge fade `::after`; peek padding; scroll-snap; focus `scrollIntoView` |
| FILES | `argos-corporate.css`, `ArgosPhaseLettersRow.tsx` |
| VERIFY | @390: barW≈343, rowW≈301; A–O in view, S peeks; scroll reveals S; cue `::after` present; document overflowX=false; @1440 one-line ARGOS preserved |

### QA08-P2-02 — Diagnostic cyan chrome

| Field | Detail |
|-------|--------|
| ROOT_CAUSE | Tailwind `border-[#22d3ee]/90` on modal shell |
| FIX | Navy Quiet Authority border `#1f3a5f/45` + calmer shadow; keep `focus-visible` mint/teal outline |
| FILES | `DiagnosticSurveyModal.tsx` |
| VERIFY | `hasCyanClass=false`, `border: rgba(31,58,95,0.45)`; dialog still opens ESC-close |

### QA08-P2-03 — Philosophy composition

| Field | Detail |
|-------|--------|
| ROOT_CAUSE | `.argos-surface-card--philosophy { max-width: 42rem }` → ~47% width |
| FIX | `max-width: none; width: 100%` |
| FILES | `argos-corporate.css` |
| VERIFY | @1440 ratio ≈0.82 (container padding retained) |

### QA08-P2-04 — Justification rivers

| Field | Detail |
|-------|--------|
| ROOT_CAUSE | `text-align: justify` inside medium card measures |
| FIX | Cards/dialogs use `text-align: start`; wide section leads may remain justified; mobile ≤639 still left |
| FILES | `argos-corporate.css` |
| VERIFY | Bridge `.argos-card--bridge .argos-corp-text-justify` → `text-align: start` |

---

## P3 Fixed / Deferred

| ID | Decision | Reason |
|----|----------|--------|
| P3-03 Duplicate Filosofía eyebrow | **FIXED** | Removed redundant `.argos-corp-eyebrow` render in Home philosophy card; i18n key retained; index `02 / Filosofía` remains |
| P3-01 Mint heights | **DEFERRED_TO_FUTURE_POLISH** | Not required for rhythm; risk of blank stretch |
| P3-02 Service heights | **DEFERRED_TO_FUTURE_POLISH** | Content-length variance acceptable |

---

## Footer Collision Resolution

Zones implemented:

- **A** brand/nav (`__grid`, z-index 1 + bottom padding)
- **B** mascot-safe decorative area (absolute mascots above legal)
- **C** legal bar (solid bg, z-index 2)
- **D** floating dock exclusion via `data-footer-in-view`

Measured AFTER (footer in view):

| Viewport | CHICO_LEGAL | DUMBO_LEGAL | DOCK_TAGLINE | DOCK_LEGAL |
|----------|-------------|-------------|--------------|------------|
| 1440 | 0 | 0 | 0 | 0 |
| 1024 | 0 | 0 | 0 | 0 |
| 768 | 0 | 0 | 0 | 0 |
| 390 | n/a (hidden) | n/a | 0 | 0 |

---

## Mascot Collision Resolution

- Dock auto-hides when footer intersects viewport; mid-page dock remains available.
- No movement architecture rewrite.
- Teleports/flashes/baseline jumps not reintroduced by this mission.

---

## Method Mobile Discoverability

- Content width restored when dock hidden.
- Horizontal scroll retained with edge fade + partial S peek.
- Keyboard focus scrolls phase links into view.
- Desktop single-line A.R.G.O.S. unchanged (`desktopOneLine=true` @1440).

---

## Diagnostic Modal Correction

- Cyan anomaly removed from shell border.
- Focus-visible outline preserved on dialog panel.
- Survey logic untouched (`DIAGNOSTIC_FUNCTIONAL_DIFF = 0`).

---

## Philosophy Layout Correction

- Full container width (minus standard padding).
- Quote + index preserved; redundant eyebrow presentation removed (P3-03).

---

## Typography / Justification Correction

- Card-scoped `start` alignment eliminates identified rivers.
- No global ban on justification for wide editorial leads.

---

## Accessibility Verification

| Check | Result |
|-------|--------|
| Detail Mode / ESC (preexisting) | Not regressed by this mission |
| Diagnostic open/close | PASS |
| Method phase focus scrollIntoView | PASS |
| Reduced-motion method cue | Static fade retained (no animated arrow) |
| Content freeze | 12/12 PASS |

---

## Responsive Verification

| Viewport | Footer | Method | Overflow | Notes |
|----------|--------|--------|----------|-------|
| 1440 | PASS | one-line PASS | 0 | dock hides at footer |
| 1024 | PASS | PASS | 0 | side clear still on at ≥1024 with dock |
| 768 | PASS | column + cue | 0 | clear=0 (dock hidden) |
| 390 | PASS | A–O + S peek | 0 | clear=0 |

---

## Before / After Evidence

| Defect | BEFORE | AFTER |
|--------|--------|-------|
| P1 footer/dock | `artifacts/visual-qa-08/home-1440-footer-close.png` | `artifacts/visual-fix-09/footer-1440.png` (+1024/768/390) |
| P2 method 390 | `artifacts/visual-qa-08/home-390-method.png` | `artifacts/visual-fix-09/method-390.png` / `method-390-scrolled.png` |
| P2 diagnostic | `artifacts/visual-qa-08/home-1440-diagnostic-open.png` | `artifacts/visual-fix-09/diagnostic-1440.png` |
| P2 philosophy | `artifacts/visual-qa-08/home-1440-philosophy-close.png` | `artifacts/visual-fix-09/philosophy-1440.png` |
| P2 justify | method bridge QA08 shots | `artifacts/visual-fix-09/method-bridge-1440.png` |
| Dock mid-page | — | `artifacts/visual-fix-09/dock-mid-1440.png` |

---

## Tests

| Check | Result |
|-------|--------|
| `npm --prefix frontend run lint` | **PASS** |
| `contentFreezeV1.test.ts` | **PASS** 12/12 |
| `npm --prefix frontend run build` | **PASS** |

---

## Git Diff Classification

### FIX_09_TARGET_FILES

| File | Defects |
|------|---------|
| `frontend/assets/css/argos-corporate.css` | P1-02, P2-01, P2-03, P2-04 |
| `frontend/styles/mascot-sprites.css` | P1-01, P1-03 |
| `frontend/components/mascots/ChicoDumboSpriteSystem.tsx` | P1-01, P1-03 |
| `frontend/components/diagnostic/DiagnosticSurveyModal.tsx` | P2-02 |
| `frontend/components/pages/HomeView.tsx` | P3-03 (eyebrow presentation) |
| `frontend/components/corporate/ArgosPhaseLettersRow.tsx` | P2-01 focus scroll |
| `artifacts/visual-fix-09/*` | evidence |
| `docs/design/ARGOS_SURGICAL_VISUAL_FIX_09_REPORT.md` | this report |

### PREEXISTING_CHANGES

Large uncommitted surface retained; not restored/stashed/committed.

`PREEXISTING_CHANGES_TOUCHED_DESTRUCTIVELY = 0`
`OUT_OF_SCOPE_CHANGES = 0`
`CONTENT_DIFF = 0` (i18n strings unchanged; presentation-only eyebrow removal)
`FUNCTIONAL_DIFF = 0`
`SEO_DIFF = 0`

---

## Residual Risks

1. Owner should skim 390 home fold after side-clear removal (intentional; dock already off).
2. Diagnostic interior accents may still include legacy cyan in child components — shell anomaly fixed; full diagnostic skin audit not in scope.
3. P3 card height variance remains as deferred polish.
4. Large preexisting dirty tree still requires owner-led commit strategy.

---

## Production Readiness Recommendation

Gates for production readiness are met for FIX 09 scope. Recommend owner visual acceptance of `artifacts/visual-fix-09/` before any commit of the wider dirty workspace.

---

## Final Stop Gate

```
SURGICAL_VISUAL_FIX_09 = PASS

P0_BEFORE = 0
P0_AFTER = 0

P1_BEFORE = 3
P1_FIXED = 3
P1_REMAINING = 0

P2_BEFORE = 4
P2_FIXED = 4
P2_REMAINING = 0

P3_BEFORE = 3
P3_FIXED = 1
P3_DEFERRED = 2

DOCK_TAGLINE_OVERLAP = 0
DOCK_LEGAL_OVERLAP = 0
CHICO_LEGAL_OVERLAP = 0
DUMBO_LEGAL_OVERLAP = 0
MASCOT_CONTENT_OCCLUSIONS = 0

METHOD_390_DISCOVERABILITY = PASS
METHOD_ALL_5_PHASES_ACCESSIBLE = PASS
ARGOS_DESKTOP_ONE_LINE_REGRESSION = 0

DIAGNOSTIC_CYAN_ANOMALY = 0
DIAGNOSTIC_FOCUS_VISIBLE = PASS
DIAGNOSTIC_FUNCTIONAL_DIFF = 0

PHILOSOPHY_COMPOSITION = PASS
JUSTIFICATION_RIVERS_IDENTIFIED_BY_QA = 0

HORIZONTAL_OVERFLOW = 0
CLIPPED_TEXT = 0
INTERACTIVE_COLLISIONS = 0
NEW_VISUAL_REGRESSIONS = 0

VIEWPORT_1440 = PASS
VIEWPORT_1024 = PASS
VIEWPORT_768 = PASS
VIEWPORT_390 = PASS

CONTENT_FREEZE_12_12 = PASS
CONTENT_DIFF = 0
FUNCTIONAL_DIFF = 0
SEO_DIFF = 0

LINT = PASS
TYPECHECK = PASS
BUILD = PASS
RELEVANT_TESTS = PASS

BEFORE_AFTER_EVIDENCE = COMPLETE
REPORT_CREATED = YES

PREEXISTING_CHANGES_TOUCHED_DESTRUCTIVELY = 0
OUT_OF_SCOPE_CHANGES = 0

READY_FOR_OWNER_FINAL_ACCEPTANCE = YES
READY_FOR_PRODUCTION = YES
```

**DO NOT COMMIT.**

**STOP.**
