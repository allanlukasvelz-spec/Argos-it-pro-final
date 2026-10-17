# ARGOS-IT Source Hierarchy

**Version:** 21.3
**Last updated:** 2026-08-12
**CAB register:** [cab-decisions.md](./cab-decisions.md)

This hierarchy governs which sources may define canonical design decisions. Higher levels override lower levels when explicit and approved.

---

## LEVEL 1 — Approved ARGOS Design System

**Status:** ACTIVE (brand + policy freeze; UI still legacy-mapped)

- `docs/design/*` including CAB Decision Register
- Canonical brand CSS tokens in `frontend/app/globals.css` (not wired to painted UI)
- Semantic tokens still map to Level 3 appearance until a visual migration phase

---

## LEVEL 2 — Official ARGOS brand specifications

**Status:** ACTIVE

| Document | Location (local) | Authority |
|----------|------------------|-----------|
| UI/UX Guide | `~/Downloads/Argos-IT/ARGOS_Master_Operational_Pack/ARGOS_UI_UX_Guide.docx` | APPROVED |
| Brand Guide | `~/Downloads/Argos-IT/ARGOS_Complete_Visual_Branding_Pack/ARGOS_Brand_Guide.docx` | APPROVED |
| Brand Book | `~/Downloads/Argos-IT/Proyectos en curso/Brand_Book_Argos-IT.docx` | STRONG_EVIDENCE (logo/rules) |
| SVG masters | `~/Downloads/Argos-IT/ARGOS_PDF_SVG_MASTER/*.svg` | STRONG_EVIDENCE (fills `#1F3A5F` / `#0B1320`) |

**Canonical palette (CAB-DS-01 closed):**

- `#1F3A5F` — Brand primary (**CANONICAL**)
- `#2F7D6D` — Brand secondary (**CANONICAL**)
- `#0B1320` — Brand dark (**CANONICAL**)
- `#F7F7F5` — Brand surface (**CANONICAL**)
- `#072648` — **REJECTED** as primary (Brand Book DOCX OOXML only)

---

## LEVEL 3 — Production implementation

**Status:** LEGACY IMPLEMENTATION REFERENCE (preserved)

- Dual skin: marketing chrome `#2563EB` + nocturnal shell `#18D4F7`
- **Not** brand Source of Truth
- Semantic tokens map here in 21.3 so pixels stay identical

---

## LEVEL 4 — Corporate / product documentation

**Status:** COPY AND TONE ONLY

- `Argos-IT_Textos_Web_Completos_2026.pdf` — supports `LIGHT_PREMIUM_INSTITUTIONAL` tone

---

## LEVEL 5 — Control Center Concept Book

**Status:** MISSING / DEFERRED

- `CONTROL_CENTER_DIRECTION = DEFERRED`
- `CONTROL_CENTER_FROZEN = NO`

---

## LEVEL 6 — Approved visual mockups

**Status:** REFERENCE (Client `/dashboard` + NOC `/noc` Framer masters)

- Framer project: **ARGOS — Product UI Master**
- Role: visual composition reference (`FRAMER_SOURCE_OF_TRUTH = NO`, `PIXEL_PERFECT = NO`)
- Binding spec: `docs/design/ARGOS_DESIGN_CONTRACT.md` and sibling Client/NOC docs
- Does **not** authorize production paint or Phase 3 data

---

## LEVEL 7 — Experimental concepts

**Status:** REGISTERED, NOT CANONICAL

- Method galaxy, glassmorphism, animated mascots — legacy until migration phase

---

## EXCLUDED — Client work

**Rule:** `CLIENT_WORK_IS_NOT_ARGOS_BRAND_SOURCE`

Excluded: UDIC, TusetCN, Flores Galí, landscaping, other client projects.

---

## Conflict resolution

| Situation | Resolution |
|-----------|------------|
| Brand doc vs production color | Brand = target; production = legacy until migration phase |
| Brand Book `#072648` vs UI Guide `#1F3A5F` | **CLOSED** — primary = `#1F3A5F`; `#072648` rejected |
| Concept Book vs production dashboard | Concept Book missing — portal ≠ Control Center |
