# ARGOS-IT Design System

**Version:** 21.3 — Canonical Token Freeze
**Status:** Level 1 ACTIVE (brand frozen; painted UI still legacy)
**Repository:** `allanlukasvelz-spec/Argos-it-pro-final`
**Visual change in this phase:** NO
**CAB register:** [cab-decisions.md](./cab-decisions.md)

---

## 1. Purpose

Version the ARGOS-IT visual identity Source of Truth after FASE 21.2 CAB decisions:

- Promote approved brand candidates → canonical tokens
- Reject `#072648` as primary
- Freeze typography **roles** without loading fonts
- Formalize Corporate vs Portal vs Control Center policy
- Keep semantic tokens mapped to legacy production (identical pixels)
- Document shell cyan/blue as legacy

---

## 2. Source hierarchy

See [source-hierarchy.md](./source-hierarchy.md).

| Level | Status |
|-------|--------|
| 1 — Approved Design System | **ACTIVE** (freeze) |
| 2 — Official brand specs | ACTIVE |
| 3 — Production | LEGACY REFERENCE (preserved) |
| 4 — Corporate docs | COPY / TONE |
| 5 — Control Center Concept Book | MISSING / DEFERRED |
| 6 — Approved mockups | MISSING / DEFERRED |
| 7 — Experimental | REGISTERED |
| EXCLUDED — Client work | UDIC, TusetCN, Flores Galí, landscaping |

---

## 3. Brand principles

- **Premium · sober · direct · institutional · technological**
- Much negative space; smooth transitions; premium minimalism
- Avoid visual saturation
- Green/teal as **system accent**, not ornamental decoration
- Logo: preserve dog symbol; no generic tech icon substitution; no distortion

---

## 4. Corporate visual direction

**CORPORATE_DIRECTION = LIGHT_PREMIUM_INSTITUTIONAL** (**CANONICAL**)

**Target (Level 2):** Light institutional surfaces (`#F7F7F5`), navy/teal brand accents, restrained motion.

**Current production (Level 3):** Dual skin — white marketing chrome (`#2563EB`) + nocturnal shell (`#18D4F7`), glass, gradients.

21.3 **preserves** production exactly. Corporate light is the documented target; **visual migration is a later phase**.

---

## 5. Canonical brand palette

| Name | Value | Status | Wired to UI |
|------|-------|--------|-------------|
| Primary | `#1F3A5F` | **CANONICAL** | NO (21.3) |
| Secondary | `#2F7D6D` | **CANONICAL** | NO |
| Surface | `#F7F7F5` | **CANONICAL** | NO |
| Dark | `#0B1320` | **CANONICAL** | NO |
| `#072648` | — | **REJECTED** as primary | N/A |

CSS: `--argos-brand-primary`, `--argos-brand-secondary`, `--argos-brand-surface`, `--argos-brand-dark`, `--argos-brand-primary-rejected-072648`.

---

## 6. Legacy production palette

| Token | Hex | Status |
|-------|-----|--------|
| legacy-cyan | `#18D4F7` | LEGACY — preserve |
| legacy-blue | `#2563EB` | LEGACY — preserve |
| legacy-light-blue | `#38BDF8` | LEGACY |
| legacy-navy | `#07111F` | LEGACY |
| legacy-shell-navy | `#071421` | LEGACY |
| legacy-deep-blue | `#0D3B66` | LEGACY |

See [legacy-map.md](./legacy-map.md).

---

## 7. Semantic architecture

Layers: **canonical brand → semantic UI → legacy aliases**.

In 21.3, semantic tokens still point to **legacy** so adoption of brand colors requires an explicit migration phase.

---

## 8. Typography status

| Font | Role status | Loaded |
|------|-------------|--------|
| Cormorant Garamond | **CANONICAL** Corporate Display | **NO** |
| Inter | **CANONICAL** Body + UI | **NO** |
| Manrope | **REJECTED** | NO |
| System sans | CURRENT_PRODUCTION (via `--font-*`) | YES |

`FONTS_ACTUALLY_LOADED = NO`
`TYPOGRAPHY_ROLES_FROZEN = YES`

---

## 9. Logo / Dumbo rules

- **LOGO = PROTECTED**
- **DUMBO = PROTECTED**
- Vector master: off-repo SVG pack; missing in repo
- Forbidden: regenerate, recolor, distort, replace, AI redesign without approval

---

## 10. Corporate visual rules (from Brand Book)

**Do:** official logo; safe zone; palette (when migrated); consultive CTAs.

**Don't:** unapproved shadows/gradients; low contrast; off-palette mixes; generic tech icons replacing the dog.

**Production note:** Current shell glass/gradients = **legacy experimental**, not canonical Corporate.

---

## 11. Control Center status

- `CONTROL_CENTER_DIRECTION = DEFERRED`
- `CONTROL_CENTER_FROZEN = NO`
- `/dashboard` = client portal — not Control Center
- Home `.argos-command-center` = decorative mock only

---

## 12. Motion status

- Brand: smooth transitions, avoid saturation
- Production: galaxy, mascots, banner walks — **legacy preserved** in 21.3

---

## 13. Accessibility

| Foreground | Background | Ratio | Class |
|------------|------------|-------|-------|
| `#1F3A5F` | `#F7F7F5` | 10.71:1 | PASS_AAA |
| `#0B1320` | `#F7F7F5` | 17.35:1 | PASS_AAA |
| `#2F7D6D` | `#F7F7F5` | 4.58:1 | PASS_AA |
| white | `#2F7D6D` | 4.91:1 | PASS_AA |
| white | `#1F3A5F` | 11.48:1 | PASS_AAA |
| `#030812` | `#18D4F7` | 11.27:1 | PASS_AAA (legacy CTA) |

Brand color ≠ automatic semantic role. Validate each use.

---

## 14. Responsive principles

Unchanged. Visual baseline: 1280×720 Playwright; Darwin + Linux goldens.

---

## 15. Client-work exclusion

`CLIENT_WORK_IS_NOT_ARGOS_BRAND_SOURCE` — UDIC, TusetCN, Flores Galí, landscaping excluded.

---

## 16. Raw-color policy

See [tokens.md](./tokens.md). No mass hex migration in 21.3.

---

## 17. Migration strategy

| Phase | Scope |
|-------|-------|
| **21.1** | Token foundation + collision fix + baselines |
| **21.1B** | Linux CI goldens |
| **21.2** | CAB decisions (read-only) |
| **21.3 (this)** | Canonical freeze — docs + brand token names; **no visual change** |
| **Later (not authorized)** | Corporate visual migration (Home/Método/Servicios/…) |
| **Later** | Font loading; Control Center after Concept Book |

---

## CAB Decision Register

Closed decisions: [cab-decisions.md](./cab-decisions.md).

| ID | Outcome |
|----|---------|
| CAB-DS-01 | Primary `#1F3A5F` CANONICAL; `#072648` REJECTED |
| CAB-DS-02 | Cormorant = Corporate Display (role frozen; not loaded) |
| CAB-DS-03 | Inter = Body/UI (role frozen; not loaded) |
| CAB-DS-04 | Manrope REJECTED |
| CAB-DS-05 | Legacy shell policy by context |
| CAB-DS-06 | LIGHT_PREMIUM_INSTITUTIONAL CANONICAL |
| CAB-DS-07 | Control Center DEFERRED |

---

## Related files

- [README.md](./README.md)
- [cab-decisions.md](./cab-decisions.md)
- [tokens.md](./tokens.md)
- [legacy-map.md](./legacy-map.md)
- [source-hierarchy.md](./source-hierarchy.md)
- `frontend/app/globals.css`
- `e2e/visual-regression.spec.ts`
