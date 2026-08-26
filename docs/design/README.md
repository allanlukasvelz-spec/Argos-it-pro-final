# ARGOS-IT Design System — Documentation Index

**Phase:** 21.6B — Visual Freeze + Mascot Motion Lab + assistant-only production dock

**Status:** Level 1 ACTIVE — canonical brand tokens and Corporate foundation active; Quiet Authority desktop Home visual direction HUMAN-FROZEN for lab/spec purposes; mascot motion laboratory AUTHORIZED; production Home migration NOT AUTHORIZED.

**Mascot CURRENT (after 21.6B.7A–8D):** ClientAssistants production dock migrated to frozen V1; placement remains ASSISTANT_ONLY for what shipped; static legacy diagnostic banner migrated; R2 soft role semantics frozen. Home/Corporate mascot placement still prohibited. Control Center mascot placement unresolved. Diagnostic mascot ownership unresolved. WALK remains REJECTED.

**Mascot TARGET (Design Contract amendment 2026-08-25):** CHICO = ARGOS SECURITY GUARDIAN permitted on Client security surfaces (docs only). DUMBO = UX/guide preserved. Runtime CHICO Client UI **not authorized**. See [ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md](./ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md).

**Visual change in 21.5:** YES — `/contacto` header/footer only

## Documents

| File | Purpose |
|------|---------|
| [ARGOS_DESIGN_SYSTEM.md](./ARGOS_DESIGN_SYSTEM.md) | Master design system specification (21.3 freeze) |
| [ARGOS_DESIGN_CONTRACT.md](./ARGOS_DESIGN_CONTRACT.md) | Client + NOC visual contract (spec only; UI not authorized) |
| [ARGOS_COMPONENT_SYSTEM.md](./ARGOS_COMPONENT_SYSTEM.md) | Target reusable components (conceptual) |
| [ARGOS_RESPONSIVE_BEHAVIOR.md](./ARGOS_RESPONSIVE_BEHAVIOR.md) | Client mobile-first / NOC desktop-first |
| [ARGOS_UI_STATE_MATRIX.md](./ARGOS_UI_STATE_MATRIX.md) | Health, unknown, provenance, A/B/C states |
| [ARGOS_CLIENT_NOC_VISUAL_RULES.md](./ARGOS_CLIENT_NOC_VISUAL_RULES.md) | Two experiences, one brand DNA |
| [ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md](./ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md) | CHICO Security Guardian TARGET contract (Client security; runtime NO) |
| [cab-decisions.md](./cab-decisions.md) | Closed CAB Decision Register (21.2 → 21.3) |
| [corporate-foundation-21-4.md](./corporate-foundation-21-4.md) | Corporate foundation + /contacto pilot (21.4) |
| [corporate-chrome-21-5.md](./corporate-chrome-21-5.md) | Corporate chrome ownership + /contacto header/footer (21.5) |
| [ARGOS_DESIGN_DIRECTOR_BRIEF.md](./ARGOS_DESIGN_DIRECTOR_BRIEF.md) | Contract Brand/CAB → Relume → Framer → human → Cursor (21.6A.1) |
| [ARGOS_VISUAL_FREEZE_21_6B.md](./ARGOS_VISUAL_FREEZE_21_6B.md) | Human visual freeze: Quiet Authority + desktop Home (21.6B) |
| [ARGOS_MASCOT_MOTION_AUTHORIZATION.md](./ARGOS_MASCOT_MOTION_AUTHORIZATION.md) | Limited Chico/Dumbo motion lab authorization (no production) |
| [ARGOS_MASCOT_LOW_MOTION_FREEZE_21_6B.md](./ARGOS_MASCOT_LOW_MOTION_FREEZE_21_6B.md) | Human-frozen Chico/Dumbo low-motion lab specification |
| [ARGOS_MASCOT_PLACEMENT_FREEZE_21_6B.md](./ARGOS_MASCOT_PLACEMENT_FREEZE_21_6B.md) | Human-frozen mascot production placement policy (assistant-only) |
| [ARGOS_MASCOT_ROLE_SEMANTICS_FREEZE_21_6B.md](./ARGOS_MASCOT_ROLE_SEMANTICS_FREEZE_21_6B.md) | Human-frozen soft role semantics (R2 affinities; no exclusive ownership) |
| [tokens.md](./tokens.md) | Token architecture (brand, semantic, legacy, fonts) |
| [legacy-map.md](./legacy-map.md) | Production hex inventory and migration mapping |
| [source-hierarchy.md](./source-hierarchy.md) | Source-of-truth hierarchy |
| [ARGOS_FRONTEND_SOURCE_OF_TRUTH_RECONCILIATION.md](./ARGOS_FRONTEND_SOURCE_OF_TRUTH_RECONCILIATION.md) | Staging Home vs Relume/Framer SoT forensics (2026-08-26; docs-only) |

## Implementation

- **Authoritative CSS tokens:** `frontend/app/globals.css` (`:root`) — v21.3
- **Shell-specific tokens:** `frontend/assets/css/argos-backgrounds.css`
- **Visual regression:** `e2e/visual-regression.spec.ts` + Linux/Darwin goldens

## Rules

1. Production visuals must not change without an approved **visual migration** phase (not 21.3).
2. Brand tokens (`--argos-brand-*`) are **CANONICAL** but **not wired** to components in 21.3.
3. Semantic tokens remain mapped to **legacy** production appearance.
4. Client work (UDIC, TusetCN, Flores Galí, landscaping, etc.) is **not** a brand source.
5. Control Center visual direction remains **DEFERRED** (`CONTROL_CENTER_FROZEN = NO`). Internal product target is **NOC** (`/noc`); see Client/NOC design contract (spec only).
6. `#072648` is **REJECTED** as brand primary.
7. Font **roles** are frozen; Inter/Cormorant are **not loaded**.

## CAB decisions

Closed register: [cab-decisions.md](./cab-decisions.md).
