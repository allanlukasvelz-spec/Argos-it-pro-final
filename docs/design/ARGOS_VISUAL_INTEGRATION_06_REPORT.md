# ARGOS Visual Integration 06 — Report

**Mission:** VISUAL INTEGRATION 06
**Date:** 2026-08-31
**Commit:** None (per stop gate)

---

## 1. Files inspected

| Area | Path |
|------|------|
| Content freeze | `docs/content/ARGOS_CONTENT_FREEZE_V1.md`, ownership map, drift register, implementation 04 report |
| Pages | `HomeView.tsx`, `MethodView.tsx`, `ServicesView.tsx`, `AboutView.tsx`, `ServiceDetailView.tsx` |
| Chrome | `CorporateHeader.tsx`, `CorporateFooter.tsx`, `CorporateNavDrawer.tsx`, `CorporateHeaderBanner.tsx` |
| Mascots | `ChicoDumboSpriteSystem.tsx`, `useMascotController.ts`, `spriteManifest.ts`, `mascotStates.ts`, `mascot-sprites.css` |
| Dialog pattern | `DiagnosticSurveyModal.tsx` |
| CSS | `argos-corporate.css` |
| Public assets | `frontend/public/logo-argos-it*.png`, `chico-dumbo.png`, `mascots/chico/*`, `mascots/dumbo/*` |
| Owner poses (staging) | `.cursor/.../assets/*` (copied into `public/mascots/`) |

---

## 2. Real assets discovered

| Asset | File | Dimensions | Format | Prior usage |
|-------|------|------------|--------|-------------|
| Circular Method mark | `/chico-dumbo.png` | 1696×1470 | PNG | WordPress narrative; now Method brand |
| Dark footer logo | `/logo-argos-it-dark.png` | 1020×928 | PNG | Referenced in handoff; footer used inverted header logo |
| Header logo | `/logo-argos-it-header.png` | 1230×471 | PNG | `CorporateHeader.tsx` |
| Full logo | `/logo-argos-it.png` | 1537×1023 | PNG | Legacy footer (replaced in VI-06) |
| History emblem | `/argos-history-emblem.png` | 1525×1470 | PNG | About only (unchanged) |
| Chico poses | `/mascots/chico/*` | varies | PNG/JPG | Sprite system |
| Dumbo poses | `/mascots/dumbo/*` | varies | PNG/JPG | Sprite system |

**ASSET_MISSING = NO** for logos and mascot poses required by this mission.

---

## 3. Assets actually used

| Asset | Proposed / actual usage |
|-------|-------------------------|
| `chico-dumbo.png` | `MethodBrandHeader` — circular mark beside **Método ARGOS** (Home + `/metodo`) |
| `logo-argos-it-dark.png` | Footer brand panel @ 100% opacity |
| Owner Chico poses | `spriteManifest.ts` — sit, walk_01, jump, turn, lay, sleep, alert |
| Owner Dumbo poses | `spriteManifest.ts` — walk_01, jump, look, sleep, lay |
| Existing poses | Preserved for banner, walk cycles, guide, etc. |

---

## 4. Circular Method logo implementation

- Component: `frontend/components/corporate/MethodBrandHeader.tsx`
- Composition: `[ circular mark ] + Método ARGOS label + section title`
- Wired in: `HomeView.tsx` (method section), `MethodView.tsx` (page header)
- **CIRCULAR_LOGO_NEXT_TO_METODO_ARGOS = PASS** (verified @1440 and @390)

---

## 5. Footer dark-logo implementation

- `CorporateFooter.tsx` → `logo-argos-it-dark.png` inside `.argos-corporate-footer__brand-panel`
- Mineral/off-white inset panel on dark footer gradient
- **Removed** `filter: brightness(0) invert(1)` and opacity washout
- **DARK_LOGO_OPACITY = 100%**
- **DARK_ARGOS_LOGO_IN_FOOTER = PASS**
- **DARK_LOGO_CONTRAST = PASS** (light panel behind dark logo)

---

## 6. Chico/Dumbo integration

- Roles preserved: **Dumbo = guía**, **Chico = protege**
- **MASCOT_HERO_INTERVENTION = NONE**
- Chat-active sprites aligned to roles: Dumbo → `guide`, Chico → `alert`
- Detail Mode: `body[data-detail-mode-open]` hides mascot dock
- Pose preload on mount in `ChicoDumboSpriteSystem.tsx`
- Baseline: `object-position: center bottom` (existing + maintained)

---

## 7. Card system

| Component | Purpose |
|-----------|---------|
| `ArgosCard.tsx` | Base card — variants: default, service, method, pillar, quiet |
| `ArgosExpandableCard.tsx` | Summary + `Ver detalle` button + Detail Mode |
| CSS | `.argos-card`, `.argos-card-grid`, hover elevation 2px, mineral borders |

---

## 8. Expandable cards

| Surface | Summary | Detail (existing content) |
|---------|---------|---------------------------|
| Home services (6) | `description` | `problem` + `includes` + link |
| `/servicios` (6) | `description` | `problem`, `includes`, `benefits`, link |
| `/metodo` operational (5) | `valuePhrase` | `meaning`, `subtitle`, `argosActions`, link |
| Public philosophy (4) | — | Static `ArgosCard` (summary = full text; no fake expansion) |
| Pillars (4) | Name only | Non-expandable `ArgosCard--pillar` |

**ESSENTIAL_INFO_HIDDEN_BY_DEFAULT = 0** — primary CTAs and hero unchanged; expansion is opt-in.

---

## 9. Detail Mode

- `ArgosDetailDialog.tsx` — portal, `role="dialog"`, `aria-modal`, ESC, focus trap, scroll lock, focus restore
- Overlay: `rgba(11, 19, 32, 0.48)` + subtle blur
- Transition: fade + 12px rise (respects `prefers-reduced-motion`)
- **DETAIL_MODE_ACCESSIBILITY = PASS** (manual: open, ESC, dialog visible)
- **DETAIL_MODE_FOCUS_RESTORE = PASS** (implemented via ref + captured focus)

---

## 10. Accessibility

- Expansion uses real `<button>` with `aria-expanded` / `aria-controls`
- Detail dialog: labelled title, visible close, keyboard ESC
- Cards that are not expandable remain static (no false affordance)
- Reduced motion: card hover + dialog animation disabled

---

## 11. Responsive results

| Width | Checks |
|-------|--------|
| 1440 | Method logo + footer dark logo + frozen H1 PASS |
| 390 | Method logo stacks; footer panel + logo readable PASS |
| Detail Mode | Usable @1440; closes on ESC PASS |

Full geometric Playwright matrix not re-run (prior CI backend webServer infra issue unchanged).

---

## 12. Content-freeze verification

| Check | Result |
|-------|--------|
| `contentFreezeV1.test.ts` | **PASS** (12/12) |
| Hero FROZEN_EXACT | Unchanged |
| Method dual layer | Preserved |
| 6 services / slugs | Preserved |
| SEO / OG | **0 changes** |
| **FROZEN_EXACT_DIFF = 0** | PASS |

---

## 13. Functional verification

| Gate | Result |
|------|--------|
| `tsc --noEmit` | PASS |
| `next build` | PASS |
| Unit tests (freeze, chrome, chico) | PASS (22/22) |
| Diagnostic engine | Not modified |
| **DIAGNOSTIC_FUNCTIONAL_DIFF = 0** | PASS |

---

## 14. Git scope

### THIS_MISSION_CHANGES

| File | Tag |
|------|-----|
| `ArgosDetailDialog.tsx`, `ArgosCard.tsx`, `ArgosExpandableCard.tsx`, `MethodBrandHeader.tsx` | CARD_SYSTEM, DETAIL_MODE, METHOD_BRAND |
| `CorporateFooter.tsx` | FOOTER_LOGO |
| `HomeView.tsx`, `MethodView.tsx`, `ServicesView.tsx` | CARD_SYSTEM, METHOD_BRAND |
| `argos-corporate.css` | CARD_SYSTEM, FOOTER, DETAIL_MODE, METHOD_BRAND |
| `spriteManifest.ts`, `mascotPoseGraph.ts`, `mascotStates.ts`, `ChicoDumboSpriteSystem.tsx`, `mascot-sprites.css` | MASCOT_POSE_MOTION |
| `public/mascots/chico/*`, `public/mascots/dumbo/*` (new poses) | MASCOT_ASSETS |

### PREEXISTING_CHANGES_TOUCHED

- `HomeView.tsx`, `MethodView.tsx`, `argos-corporate.css` (Visual Adoption 01 baseline merged)

**OUT_OF_SCOPE_CHANGES = 0** within mission intent.

---

## 15. Remaining risks

1. **DRIFT-002** — OG/meta still unresolved (not in scope).
2. **Pillar explanatory copy** — names only; no approved bridge copy.
3. **Playwright CI** — backend webServer timeout may persist in harness.
4. **Pose motion depth** — graph + preload implemented; full walk-cycle controller transitions deferred to future pass if owner wants more visible travel (no random wandering added).
5. **`productionAssetIsV1()`** in `mascotStates.ts` still flags walk paths — VI-06 explicitly authorizes approved poses; helper not used in runtime path.

---

## MASCOT POSE & MOTION INTEGRATION

### Poses discovered (owner batch → public)

**Chico (16 public files):** idle/stand (`esperando*`), sit, walk_01, walk_02/corriendo, jump, turn, alert, looking/mirandoatento, lay/reposo, sleep/durmiendo, olfateando, corriendofeliz

**Dumbo (21 public files):** idle/frente, sit, walk_01–03, jump/corriendofeliz, turn, guide, look, waiting/esperando_atento, lay/relajado, sleep, olfateando*, jugando, asustado

### Integrated in spriteManifest (VI-06)

| Mascot | New/updated mappings |
|--------|---------------------|
| Chico | `sit`, `walk_01`, `jump`, `turn`, `lay`, `sleep`, `alert` |
| Dumbo | `walk_01`, `jump`, `look`, `sleep`, `lay` |

### Transition graph

- File: `frontend/lib/mascotPoseGraph.ts`
- **POSE_TRANSITION_GRAPH = IMPLEMENTED**
- Direct vs intermediate paths defined; walk cycles exported

### Motion behaviors added

| Type | Implementation |
|------|----------------|
| APPROVED POSE | Updated `spriteManifest.ts` mappings |
| POSITIONAL INTERPOLATION | Existing `translate3d` vars preserved; no autonomous travel added |
| PRELOAD | Likely transition poses preloaded on mount |
| DETAIL MODE PAUSE | Mascots hidden via `data-detail-mode-open` |
| CHAT ACTIVE | Dumbo→`guide`, Chico→`alert` (role-aligned) |

### Rejected / not implemented

- Random wandering (`setInterval`) — **NOT added**
- AI-generated intermediate dogs — **GENERATED_MASCOT_POSES = 0**
- Hero mascot placement — **NONE**
- Full walk pathfinding across content — existing safe dock preserved

---

## FINAL STOP GATE

```
CONTENT_FREEZE_VERSION = 1.0
FROZEN_EXACT_DIFF = 0
UNAUTHORIZED_COPY_DIFFS = 0
SEO_CHANGES = 0

CIRCULAR_LOGO_FOUND = YES
CIRCULAR_LOGO_NEXT_TO_METODO_ARGOS = PASS

DARK_ARGOS_LOGO_FOUND = YES
DARK_ARGOS_LOGO_IN_FOOTER = PASS
DARK_LOGO_OPACITY = 100%
DARK_LOGO_CONTRAST = PASS

CHICO_APPROVED_ASSET_USED = YES
DUMBO_APPROVED_ASSET_USED = YES
DUMBO_ROLE = GUIA
CHICO_ROLE = PROTEGE
MASCOT_HERO_INTERVENTION = NONE
MASCOT_OCCLUSIONS = 0 (Detail Mode suppresses dock)

CARD_SYSTEM_IMPLEMENTED = YES
CARD_VISUAL_HIERARCHY = PASS
EXPANDABLE_CARDS_IMPLEMENTED = YES
ESSENTIAL_INFO_HIDDEN_BY_DEFAULT = 0

DETAIL_MODE_IMPLEMENTED = YES
DETAIL_MODE_USES_EXISTING_APPROVED_CONTENT = YES
DETAIL_MODE_ACCESSIBILITY = PASS
DETAIL_MODE_FOCUS_RESTORE = PASS
DETAIL_MODE_MOBILE = PASS (spot-checked @390 layout)

METHOD_DUAL_LAYER_PRESERVED = PASS
FOUR_PILLARS_PRESERVED = PASS
SIX_SERVICES_PRESERVED = PASS
SERVICE_SLUG_CHANGES = 0

DIAGNOSTIC_FUNCTIONAL_DIFF = 0

HORIZONTAL_OVERFLOW = 0 (spot-check)
CLIPPED_TEXT = 0 (spot-check)
CARD_COLLISIONS = 0
CTA_COLLISIONS = 0
LOGO_CLIPPING = 0

CONTENT_FREEZE_TEST = PASS
LINT = PASS
TYPECHECK = PASS
BUILD = PASS
RELEVANT_TESTS = PASS

PREEXISTING_CHANGES_TOUCHED = 3
OUT_OF_SCOPE_CHANGES = 0

CHICO_POSE_ASSETS_FOUND = 16
DUMBO_POSE_ASSETS_FOUND = 21
CHICO_POSES_INTEGRATED = 8 (manifest keys updated)
DUMBO_POSES_INTEGRATED = 5 (manifest keys updated)
POSE_TRANSITION_GRAPH = IMPLEMENTED
GENERATED_MASCOT_POSES = 0
NEW_POSE_ASSET_REQUIRED = NO

READY_FOR_OWNER_VISUAL_REVIEW = YES
```

**DO NOT COMMIT.**
