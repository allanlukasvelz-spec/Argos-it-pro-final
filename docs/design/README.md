# ARGOS-IT Design System — Documentation Index

**Phase:** 21.1 — Canonical Design Tokens Foundation  
**Status:** IN PROGRESS (Level 1)  
**Visual change in 21.1:** NO

## Documents

| File | Purpose |
|------|---------|
| [ARGOS_DESIGN_SYSTEM.md](./ARGOS_DESIGN_SYSTEM.md) | Master design system specification |
| [tokens.md](./tokens.md) | Token architecture (brand, semantic, legacy) |
| [legacy-map.md](./legacy-map.md) | Production hex inventory and migration mapping |
| [source-hierarchy.md](./source-hierarchy.md) | Source-of-truth hierarchy |

## Implementation (21.1)

- **Authoritative CSS tokens:** `frontend/app/globals.css` (`:root`)
- **Shell-specific tokens:** `frontend/assets/css/argos-backgrounds.css`
- **Visual regression:** `e2e/visual-regression.spec.ts`

## Rules

1. Production visuals must not change without an approved phase.
2. Brand candidates are **PROVISIONAL** until CAB decisions close.
3. Client work (UDIC, TusetCN, Flores Galí, landscaping, etc.) is **not** a brand source.
4. Control Center visual direction is **DEFERRED** (`CONTROL_CENTER_DIRECTION = DEFERRED`).

## Open CAB decisions

See [ARGOS_DESIGN_SYSTEM.md § Open CAB decisions](./ARGOS_DESIGN_SYSTEM.md#open-cab-decisions).
