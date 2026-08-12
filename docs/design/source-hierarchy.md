# ARGOS-IT Source Hierarchy

**Version:** 21.1  
**Last updated:** 2026-08-12

This hierarchy governs which sources may define canonical design decisions. Higher levels override lower levels when explicit and approved.

---

## LEVEL 1 — Approved ARGOS Design System

**Status:** IN PROGRESS

- This repository phase (`docs/design/*` + CSS token foundation in `globals.css`).
- Not yet a fully approved, CAB-signed design system.

---

## LEVEL 2 — Official ARGOS brand specifications

**Status:** ACTIVE (documentation reference)

| Document | Location (local) | Authority |
|----------|------------------|-----------|
| UI/UX Guide | `~/Downloads/Argos-IT/ARGOS_Master_Operational_Pack/ARGOS_UI_UX_Guide.docx` | APPROVED |
| Brand Guide | `~/Downloads/Argos-IT/ARGOS_Complete_Visual_Branding_Pack/ARGOS_Brand_Guide.docx` | APPROVED |
| Brand Book | `~/Downloads/Argos-IT/Proyectos en curso/Brand_Book_Argos-IT.docx` | STRONG_EVIDENCE |

**Explicit palette (UI/UX + Brand Guide):**

- `#1F3A5F` — Azul corporativo (primary candidate)
- `#2F7D6D` — Verde técnico (secondary candidate)
- `#0B1320` — Negro / azul profundo (dark candidate)
- `#F7F7F5` — Crema (surface candidate)

**Tension (CAB-DS-01):** Brand Book DOCX XML swatches use `#072648`, not `#1F3A5F` in prose.

Level 2 **overrides** Level 3 (production) for brand intent, but 21.1 does **not** apply brand colors to UI yet.

---

## LEVEL 3 — Approved production implementation

**Status:** LEGACY IMPLEMENTATION REFERENCE

- Current `main` frontend: dual skin (marketing chrome `#2563EB` + nocturnal shell `#18D4F7`).
- **Not automatically canonical** for brand identity.
- Preserved exactly in 21.1 via legacy tokens and semantic→legacy mapping.

---

## LEVEL 4 — Corporate / product documentation

**Status:** COPY AND TONE ONLY

- `Argos-IT_Textos_Web_Completos_2026.pdf` — premium, sober, institutional tone.
- No authoritative color or typography specification.

---

## LEVEL 5 — Control Center Concept Book

**Status:** MISSING / DEFERRED

- `CONTROL_CENTER_DIRECTION = DEFERRED`
- No macOS / SaaS / Hybrid decision in 21.1.

---

## LEVEL 6 — Approved visual mockups

**Status:** MISSING / DEFERRED

- Comparativa Dashboards macOS vs SaaS: not found on disk (21.0B audit).

---

## LEVEL 7 — Experimental concepts

**Status:** REGISTERED, NOT CANONICAL

- Method galaxy backgrounds, glassmorphism, animated mascots.
- May remain in production as legacy until a migration phase.

---

## EXCLUDED — Client work

**Rule:** `CLIENT_WORK_IS_NOT_ARGOS_BRAND_SOURCE`

Excluded sources (examples on disk, not in repo):

- UDIC (`Brand_Book_UDIC`, `UDIC_Propuesta_Paleta_Visual_ARGOS.pdf`)
- TusetCN (`Brand_Book_TusetCN`, co-brand books)
- Flores Galí, landscaping, demos, templates from other clients

**Repo verification (21.1):** `git grep` for UDIC/Tuset/Flores/Cormorant in frontend → 0 matches.

---

## Conflict resolution

| Situation | Resolution |
|-----------|------------|
| Brand doc vs production color | Brand doc = target; production = legacy until migration phase |
| Brand Book `#072648` vs UI Guide `#1F3A5F` | CAB-DS-01 OPEN — neither frozen as final primary |
| Concept Book vs production dashboard | Concept Book missing — production portal is legacy reference only |
