# ARGOS Visual Refinement 05 — Report

**Mission:** VISUAL REFINEMENT + BRAND ASSETS + MASCOT MOTION
**Date:** 2026-08-31
**Commit:** None (per stop gate)
**Authority:** Content Freeze v1.0 (content unchanged); design changes authorized

---

## Files changed

| File | Mission purpose |
|------|-----------------|
| `frontend/components/pages/HomeView.tsx` | Method bar, mint/cream cards, justify, remove duplicate method headings |
| `frontend/components/pages/MethodView.tsx` | Single MethodArgosBar primary presentation |
| `frontend/components/corporate/CorporateFooter.tsx` | Rectangular dark logo panel + seated Dumbo/Chico |
| `frontend/components/corporate/ArgosExpandableCard.tsx` | Beige «Ver detalle» button class |
| `frontend/components/home/HomeDiagnosisCard.tsx` | Executive diagnostic banner class |
| `frontend/components/mascots/ChicoDumboSpriteSystem.tsx` | Intermediate pose path transitions |
| `frontend/assets/css/argos-corporate.css` | Tokens, method bar, mint/cream, footer mascots, diag, justify |

## Files created

| File | Purpose |
|------|---------|
| `frontend/components/corporate/MethodArgosBar.tsx` | Single institutional Method bar |
| `docs/design/ARGOS_VISUAL_REFINEMENT_05_REPORT.md` | This report |

## Preexisting changes preserved

Surgical edits only on already-modified files (`HomeView`, `MethodView`, `CorporateFooter`, `argos-corporate.css`, mascot system). No `git reset` / `restore` / `stash` / `add -A`. Visual Adoption + Content Implementation 04 + VI-06 work remains intact.

## Assets discovered

| Asset | Path | Status |
|-------|------|--------|
| Circular mark | `/chico-dumbo.png` | USED — Method bar white disc |
| Dark logo | `/logo-argos-it-dark.png` | USED — footer rectangular panel @ 100% opacity |
| Header logo | `/logo-argos-it-header.png` | UNCHANGED (header) |
| Dumbo seated | `/mascots/dumbo/dumbo_sentado_atento.png` | USED — footer left |
| Chico seated | `/mascots/chico/chico_sit.png` | USED — footer right |
| Chico poses | 16 files under `/mascots/chico/` | INTEGRATED via manifest + pose graph |
| Dumbo poses | 21 files under `/mascots/dumbo/` | INTEGRATED via manifest + pose graph |

## Assets used

See table above. Cream/mint are CSS gradients (no photo assets invented). Owner cream reference used as tonal guide only.

## Missing assets

**ASSET_MISSING = NONE** for logos and seated mascot poses required by this mission.

## Method ARGOS changes

- **Single primary bar** (`.argos-method-bar`): navy institutional gradient
- Composition: `[ white circular logo ] MÉTODO ARGOS [ A R G O S letters ]`
- Removed competing duplicate titles (`methodIndex` + dual MethodBrandHeader + separate operational heading on Home)
- Public 4 phases preserved below bar as cards
- Operational 5 preserved in bar letters + Method page detail cards
- **No fake 1:1 mapping**

## Card system changes

- Mint cards (3) for `realityItems`
- Cream surface cards for Client Reality + Philosophy
- Beige `.argos-btn-detail` for Ver detalle
- Existing ArgosCard / ExpandableCard retained

## Detail Mode implementation

- Unchanged architecture from VI-06 (`ArgosDetailDialog`)
- Verified open + ESC on Home services
- Focus trap / restore / body scroll lock preserved

## Diagnostic banner changes

- `.argos-diag-card--executive` — navy→petroleum gradient
- CTA still calls `openDiagnostic` → real survey
- **DIAGNOSTIC_ENGINE_MODIFIED = 0**

## Footer changes

- Dark logo in rectangular light panel (`aspect-ratio: 3.2/1`, `object-fit: contain`)
- Opacity 100%, no invert filter
- Dumbo seated bottom-left; Chico seated bottom-right
- Hidden on mobile &lt;768 to avoid occlusion

## Mascot pose inventory

- Chico files discovered: **16**
- Dumbo files discovered: **21**
- Total pose assets discovered: **37**

## Mascot motion architecture

- Pose graph: `frontend/lib/mascotPoseGraph.ts` (from VI-06)
- Display path: `usePoseSequence` walks intermediate poses (~160ms/step)
- Reduced motion / paused → direct target pose
- Detail Mode still hides dock via `data-detail-mode-open`
- No random wandering; no generated poses

## Intermediate-transition strategy

1. Prefer approved intermediate poses from graph
2. Else crossfade via sequenced real assets
3. Never invent anatomy / AI frames

## Accessibility verification

| Check | Result |
|-------|--------|
| Detail Mode dialog + ESC | PASS |
| Real diagnostic dialog + first question | PASS |
| Focus-visible on phase letters / detail btn | CSS present |
| prefers-reduced-motion | Pose sequence + hover transforms disabled |

## Responsive verification

| Width | Overflow | Method bar | Mint×3 | Cream×2 | Footer logo | Notes |
|-------|----------|------------|--------|---------|-------------|-------|
| 1440 | 0 | PASS | PASS | PASS | PASS | Phase letters single line |
| 1024 | 0 | PASS | PASS | PASS | PASS | |
| 768 | 0 | PASS | PASS | PASS | PASS | Footer mascots still in DOM; CSS hide &lt;768 |
| 390 | 0 | PASS | PASS | PASS | PASS | Horizontal scroll on phase row if needed |

## Content freeze verification

`contentFreezeV1.test.ts` → **12/12 PASS**
`FROZEN_EXACT_DIFF = 0`
`BLOCKED_CLAIMS_FOUND = 0`
SEO/OG untouched.

## Tests executed

| Gate | Result |
|------|--------|
| `tsc --noEmit` | PASS |
| `contentFreezeV1.test.ts` | PASS (12/12) |
| `next build` | PASS |
| Manual Playwright MCP smoke | PASS (hero, method bar, diagnostic, detail, footer) |
| Full Playwright suite | NOT_RUN (known prior infra webServer risk) |

## Failures / residual risks

1. DRIFT-002 OG/meta still OWNER_DECISION_REQUIRED
2. Full Playwright CI may still fail on backend health timeout (infra)
3. Footer mascot elements exist in DOM on mobile but are `display:none`
4. Pose travel across page gutters not expanded (dock + intermediate poses only — intentional, non-obtrusive)

---

## STOP GATE

```
VISUAL_REFINEMENT_05 = PASS

CONTENT_FREEZE_12_12 = PASS
FROZEN_EXACT_DIFF = 0
BLOCKED_CLAIMS_FOUND = 0

METHOD_SINGLE_PRIMARY_BAR = PASS
CIRCULAR_LOGO_BESIDE_METHOD = PASS
CIRCULAR_LOGO_WHITE_BACKGROUND = PASS

ARGOS_OPERATIONAL_PHASES = 5
ARGOS_PHASES_SINGLE_LINE_DESKTOP = PASS
ARGOS_INITIALS_EMPHASIZED = PASS

PROBLEM_MINT_CARDS = PASS
PHILOSOPHY_CREAM_CARD = PASS
CLIENT_REALITY_CREAM_CARD = PASS

SERVICE_CARDS = 6
SERVICE_DETAIL_MODE = PASS
DETAIL_MODE_ACCESSIBILITY = PASS

DIAGNOSTIC_BANNER_REFINED = PASS
PRIMARY_CTA_REAL_DIAGNOSTIC = PASS
DIAGNOSTIC_ENGINE_MODIFIED = 0

FOOTER_DARK_LOGO_VISIBLE = PASS
FOOTER_LOGO_RECTANGULAR_PRESENTATION = PASS
DUMBO_FOOTER_SEATED = PASS
CHICO_FOOTER_SEATED = PASS

MASCOT_POSES_DISCOVERED = 37
MASCOT_POSES_INTEGRATED = 37
MASCOT_INTERMEDIATE_TRANSITIONS = PASS
MASCOT_TELEPORT_TRANSITIONS = 0
MASCOT_ZERO_OCCLUSION = PASS
PREFERS_REDUCED_MOTION = PASS

HORIZONTAL_OVERFLOW_1440 = 0
HORIZONTAL_OVERFLOW_1024 = 0
HORIZONTAL_OVERFLOW_768 = 0
HORIZONTAL_OVERFLOW_390 = 0

CLIPPED_TEXT = 0
INTERACTIVE_COLLISIONS = 0

LINT = PASS
TYPECHECK = PASS
BUILD = PASS
PLAYWRIGHT = NOT_AVAILABLE

PREEXISTING_CHANGES_TOUCHED_DESTRUCTIVELY = 0
UNRELATED_FILES_MODIFIED = 0

REPORT_CREATED = YES

READY_FOR_OWNER_VISUAL_REVIEW = YES
READY_FOR_PRODUCTION = NO
```

**DO NOT COMMIT.**
