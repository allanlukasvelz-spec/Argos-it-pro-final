# ARGOS-IT Design System

**Version:** 21.1 — Canonical Design Tokens Foundation  
**Status:** Level 1 IN PROGRESS  
**Repository:** `allanlukasvelz-spec/Argos-it-pro-final`  
**Visual change in this phase:** NO

---

## 1. Purpose

Establish the first versioned, documented design token layer for ARGOS-IT:

- Document source of truth hierarchy
- Define brand candidates (provisional), semantic tokens, and legacy production tokens
- Resolve CSS variable collisions without changing rendered appearance
- Provide a Playwright visual regression baseline
- Enable future migration phases without redesigning in 21.1

---

## 2. Source hierarchy

See [source-hierarchy.md](./source-hierarchy.md).

| Level | Status |
|-------|--------|
| 1 — Approved Design System | IN PROGRESS |
| 2 — Official brand specs | ACTIVE |
| 3 — Production | LEGACY REFERENCE |
| 4 — Corporate docs | COPY ONLY |
| 5 — Control Center Concept Book | MISSING / DEFERRED |
| 6 — Approved mockups | MISSING / DEFERRED |
| 7 — Experimental | REGISTERED |
| EXCLUDED — Client work | UDIC, TusetCN, Flores Galí, landscaping |

---

## 3. Brand principles

From official ARGOS brand documentation:

- **Premium · sober · direct · institutional · technological**
- Much negative space; smooth transitions; premium minimalism
- Avoid visual saturation
- Green/teal as **system accent**, not ornamental decoration
- Logo: preserve dog symbol; no generic tech icon substitution; no distortion

---

## 4. Corporate visual direction

**Target (Level 2):** Light institutional corporate surfaces (`#F7F7F5`), navy/teal brand accents, restrained motion.

**Current production (Level 3):** Dual skin — white marketing chrome with Tailwind blue (`#2563EB`) plus nocturnal shell with cyan (`#18D4F7`), glass, and gradients.

21.1 **preserves** production exactly. Corporate light direction is documented as the migration target, not implemented.

---

## 5. Brand candidates

| Name | Value | Confidence | Frozen |
|------|-------|------------|--------|
| Primary candidate | `#1F3A5F` | HIGH | **NO** (CAB-DS-01 vs `#072648`) |
| Primary alt (Brand Book XML) | `#072648` | MEDIUM | **NO** |
| Secondary candidate | `#2F7D6D` | HIGH | **NO** |
| Surface candidate | `#F7F7F5` | HIGH | **NO** |
| Dark candidate | `#0B1320` | HIGH | **NO** |

CSS variables: `--argos-brand-*-candidate` in `globals.css`. **Not wired to UI.**

---

## 6. Legacy production palette

| Token | Hex | Preserved in 21.1 |
|-------|-----|-------------------|
| legacy-cyan | `#18D4F7` | YES |
| legacy-blue | `#2563EB` | YES |
| legacy-light-blue | `#38BDF8` | YES |
| legacy-navy | `#07111F` | YES |
| legacy-shell-navy | `#071421` | YES |
| legacy-deep-blue | `#0D3B66` | YES |

See [legacy-map.md](./legacy-map.md) for full inventory.

---

## 7. Semantic architecture

Three layers: **brand candidates → semantic tokens → legacy aliases**.

Semantic tokens in 21.1 point to **legacy production values** so adoption later does not require immediate visual change.

Details: [tokens.md](./tokens.md).

---

## 8. Typography status

| Font | Status | Loaded in 21.1 |
|------|--------|----------------|
| Cormorant Garamond | PROVISIONAL (display) | NO |
| Inter | PROVISIONAL (body/UI) | NO |
| Manrope | UNRESOLVED | NO |
| System sans | CURRENT_PRODUCTION | YES (unchanged) |

**DISPLAY_FONT_FROZEN = NO**

---

## 9. Logo / Dumbo rules

- **LOGO = PROTECTED** — official PNG variants in `frontend/public/`; no SVG master in repo
- **DUMBO = PROTECTED** — sprite system; Brand Book requires preserving dog symbol
- Forbidden in 21.1: regenerate, recolor, distort, replace, AI redesign

Assets: `logo-argos-it-header.png`, `logo-argos-it.png`, `favicon.svg`, `mascots/dumbo/*`, `mascots/chico/*`.

---

## 10. Corporate visual rules (from Brand Book)

**Do:**

- Use official logo without proportion changes
- Maintain safe zone around symbol
- Use palette colors only (when migrated)
- Consultive, secure, pedagogical tone

**Don't:**

- Add unapproved shadows, gradients, decorative effects
- Use low-contrast backgrounds
- Mix off-palette colors
- Replace dog with generic tech icons

**Production note:** Current shell violates “no gradients/shadows” — classified as **legacy experimental**, not canonical corporate.

---

## 11. Control Center status

- `CONTROL_CENTER_DIRECTION = DEFERRED`
- `/dashboard` = **client portal** (audit, improvements, messages) — not operational Control Center
- Home `.argos-command-center` = decorative mock only
- No macOS / SaaS / Hybrid tokens in 21.1

**CONTROL_CENTER_FROZEN = NO**

---

## 12. Motion status

- Brand docs: smooth transitions, avoid saturation
- Production: galaxy animations, mascot autonomy, banner walks
- 21.1: **no motion changes**; visual tests disable animations for stable screenshots

---

## 13. Accessibility

Documentary WCAG 2.1 contrast matrix (21.1 — no color changes):

| Foreground | Background | Ratio (est.) | AA normal | Notes |
|------------|------------|--------------|-----------|-------|
| `#1F3A5F` | `#F7F7F5` | ~12.5:1 | PASS AA | Brand candidate body/heading |
| `#0B1320` | `#F7F7F5` | ~15:1 | PASS AA | Brand dark on surface |
| `#2F7D6D` | `#F7F7F5` | ~4.8:1 | PASS AA | Borderline; OK for body |
| `#FFFFFF` | `#2F7D6D` | ~3.5:1 | FAIL | **Not valid for white button text** |
| `#FFFFFF` | `#18D4F7` | ~2.0:1 | FAIL | Use `#030812` on cyan (prod pattern) |
| `#030812` | `#18D4F7` | ~12:1 | PASS AA | Current CTA pattern |
| `#18D4F7` | `#071421` | ~8:1 | PASS AA | Large/bold eyebrows |
| `#2563EB` | `#FFFFFF` | ~4.6:1 | PASS AA | Current chrome |

**ACCESSIBILITY_PRECHECK = CONDITIONAL** — document only.

---

## 14. Responsive principles

- Existing breakpoints and layout unchanged in 21.1
- Header topbar tokens: `--argos-topbar-lang-h`, `--argos-topbar-nav-h`
- Visual baseline viewport: 1280×720 (Playwright)

---

## 15. Client-work exclusion

**Rule:** `CLIENT_WORK_IS_NOT_ARGOS_BRAND_SOURCE`

Excluded: UDIC, TusetCN, Flores Galí, landscaping, other client projects.

Co-brand books on local disk must not feed token definitions.

**CLIENT_WORK_EXCLUDED = YES** (verified in repo code)

---

## 16. Raw-color policy

See [tokens.md § Raw color policy](./tokens.md#raw-color-policy).

- New literal hex / arbitrary Tailwind colors: **prohibited** (except documented exceptions)
- Existing hardcoded values: **not migrated** in 21.1

---

## 17. Migration strategy

| Phase | Scope |
|-------|-------|
| **21.1 (current)** | Docs + token CSS + collision fix + visual baseline |
| **21.2+ (future)** | CAB closes open decisions |
| **21.x** | Surface-by-surface semantic token adoption |
| **Future** | Corporate light migration; shell legacy deprecation |
| **Future** | Control Center tokens after Concept Book / CAB-DS-05 |

Each migration step requires `AUTHORIZED_VISUAL_DIFF = 0` unless explicitly approved.

---

## Open CAB decisions

All **OPEN** — do not resolve silently in implementation.

| ID | Topic | Status |
|----|-------|--------|
| CAB-DS-01 | `#1F3A5F` vs `#072648` as final primary | OPEN |
| CAB-DS-02 | Cormorant Garamond yes/no (corporate display) | OPEN |
| CAB-DS-03 | Inter canonical body/UI yes/no | OPEN |
| CAB-DS-04 | Manrope retain/remove | OPEN |
| CAB-DS-05 | Control Center macOS / SaaS / Hybrid | OPEN |
| CAB-DS-06 | Legacy dark/cyan shell migration strategy | OPEN |
| CAB-DS-07 | Vector master logo location | OPEN |

---

## Related files

- [README.md](./README.md)
- [tokens.md](./tokens.md)
- [legacy-map.md](./legacy-map.md)
- [source-hierarchy.md](./source-hierarchy.md)
- `frontend/app/globals.css`
- `e2e/visual-regression.spec.ts`
