# ARGOS-IT CAB Decision Register

**Phase:** 21.3 — Canonical Token Freeze
**Source decisions:** FASE 21.2 CAB Design Decisions
**Base commit (pre-21.3):** `f43b3ac`
**Visual change in 21.3:** NO

This register is the versioned Source of Truth for closed CAB identity decisions.
Implementation of visual migration is **not** authorized by this freeze.

---

## Decision table

| ID | Decision | Value | Status | Confidence | Notes |
|----|----------|-------|--------|------------|-------|
| CAB-DS-01 | Brand primary | `#1F3A5F` | **CANONICAL** | HIGH | Guides + SVG pack; not wired to UI in 21.3 |
| CAB-DS-01b | `#072648` as primary | — | **REJECTED** | HIGH | Brand Book DOCX OOXML only; token `--argos-brand-primary-rejected-072648` |
| CAB-DS-02 | Corporate display font | Cormorant Garamond | **CANONICAL** (role) | HIGH | **Not loaded** (`FONT_LOADING = NO`) |
| CAB-DS-03 | Corporate body / UI font | Inter | **CANONICAL** (role) | HIGH | **Not loaded**; CSS `--font-*` → system stack |
| CAB-DS-04 | Manrope | — | **REJECTED** | HIGH | Not tokenized; not loaded |
| CAB-DS-05 | Legacy shell policy | Context matrix | **POLICY CANONICAL** | HIGH | Cyan/blue/glass/galaxy = legacy; Corporate target = light |
| CAB-DS-06 | Corporate direction | `LIGHT_PREMIUM_INSTITUTIONAL` | **CANONICAL** | HIGH | Target only; no redesign in 21.3 |
| CAB-DS-07 | Control Center visual | — | **DEFERRED** | — | Concept Book missing; `CONTROL_CENTER_FROZEN = NO` |

Also frozen (same evidence set as DS-01):

| Token | Value | Status |
|-------|-------|--------|
| Brand secondary | `#2F7D6D` | CANONICAL |
| Brand surface | `#F7F7F5` | CANONICAL |
| Brand dark | `#0B1320` | CANONICAL |

---

## Context policy (Corporate vs Portal vs Control Center)

| Context | Brand tokens apply as target? | Current production skin | 21.3 action |
|---------|-------------------------------|-------------------------|-------------|
| **Corporate website** | YES (future migration) | Dual chrome + dark/cyan shell | Docs + brand tokens only |
| **Client Portal** (`/dashboard`) | Shared brand eventually; skin TBD | Hybrid dark shell + white cards | Preserve legacy; not CC |
| **Control Center** | DEFERRED | Not built | No tokens / no UI |
| **Auth** | Align with Corporate eventually | Light `#2563EB` chrome | Preserve legacy |
| **Marketing experiments** (galaxy, meteors) | Not brand | Experimental / legacy | Preserve |

---

## Legacy production (must preserve in 21.3)

| Item | Hex / rule | Status |
|------|------------|--------|
| Cyan | `#18D4F7` | LEGACY (not brand) |
| Blue | `#2563EB` | LEGACY (not brand) |
| Light blue | `#38BDF8` | LEGACY |
| Shell navy | `#071421` | LEGACY |
| Glass / gradients / galaxy | production effects | LEGACY; Corporate target rejects as brand |
| System sans | body stack | CURRENT_PRODUCTION until font-load phase |

Semantic UI tokens (`--action-primary`, `--action-accent`, `--surface-*`, etc.) **remain mapped to legacy** so pixels stay identical.

---

## Logo / Dumbo

| Asset | Status |
|-------|--------|
| Logo | PROTECTED |
| Dumbo | PROTECTED |
| Vector master | FOUND off-repo (`ARGOS_PDF_SVG_MASTER`); MISSING in repo |

---

## Explicitly not authorized after 21.3 (without new phase)

- Corporate visual migration (Home / Método / Servicios / …)
- Font loading (Inter / Cormorant)
- Cyan / galaxy / glass removal
- Control Center UI
- Component redesign
- Backend / auth / infra / deploy
