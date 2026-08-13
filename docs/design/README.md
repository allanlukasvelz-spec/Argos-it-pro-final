# ARGOS-IT Design System — Documentation Index

**Phase:** 21.3 — Canonical Token Freeze
**Status:** Level 1 ACTIVE (brand tokens frozen; UI still legacy)
**Visual change in 21.3:** NO

## Documents

| File | Purpose |
|------|---------|
| [ARGOS_DESIGN_SYSTEM.md](./ARGOS_DESIGN_SYSTEM.md) | Master design system specification |
| [cab-decisions.md](./cab-decisions.md) | Closed CAB Decision Register (21.2 → 21.3) |
| [corporate-foundation-21-4.md](./corporate-foundation-21-4.md) | Corporate foundation + /contacto pilot (21.4) |
| [tokens.md](./tokens.md) | Token architecture (brand, semantic, legacy, fonts) |
| [legacy-map.md](./legacy-map.md) | Production hex inventory and migration mapping |
| [source-hierarchy.md](./source-hierarchy.md) | Source-of-truth hierarchy |

## Implementation

- **Authoritative CSS tokens:** `frontend/app/globals.css` (`:root`) — v21.3
- **Shell-specific tokens:** `frontend/assets/css/argos-backgrounds.css`
- **Visual regression:** `e2e/visual-regression.spec.ts` + Linux/Darwin goldens

## Rules

1. Production visuals must not change without an approved **visual migration** phase (not 21.3).
2. Brand tokens (`--argos-brand-*`) are **CANONICAL** but **not wired** to components in 21.3.
3. Semantic tokens remain mapped to **legacy** production appearance.
4. Client work (UDIC, TusetCN, Flores Galí, landscaping, etc.) is **not** a brand source.
5. Control Center visual direction remains **DEFERRED** (`CONTROL_CENTER_FROZEN = NO`).
6. `#072648` is **REJECTED** as brand primary.
7. Font **roles** are frozen; Inter/Cormorant are **not loaded**.

## CAB decisions

Closed register: [cab-decisions.md](./cab-decisions.md).
