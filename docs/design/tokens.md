# ARGOS-IT Design Tokens

**Version:** 21.3 — Canonical Token Freeze
**CSS source of truth:** `frontend/app/globals.css` (`:root`)
**Shell extensions:** `frontend/assets/css/argos-backgrounds.css`
**CAB register:** [cab-decisions.md](./cab-decisions.md)

**VISUAL_CHANGE = NO** — semantic tokens still resolve to legacy production values.

---

## Architecture (three layers + typography roles)

### A. Canonical brand tokens (CANONICAL — not applied to UI in 21.3)

| Token | Value | Status |
|-------|-------|--------|
| `--argos-brand-primary` | `#1F3A5F` | **CANONICAL** (CAB-DS-01) |
| `--argos-brand-secondary` | `#2F7D6D` | **CANONICAL** |
| `--argos-brand-surface` | `#F7F7F5` | **CANONICAL** |
| `--argos-brand-dark` | `#0B1320` | **CANONICAL** |
| `--argos-brand-primary-rejected-072648` | `#072648` | **REJECTED** as primary (DOCX OOXML artifact) |

Temporary aliases (prefer non-`-candidate` names):

| Alias | Resolves to |
|-------|-------------|
| `--argos-brand-primary-candidate` | `var(--argos-brand-primary)` |
| `--argos-brand-secondary-candidate` | `var(--argos-brand-secondary)` |
| `--argos-brand-surface-candidate` | `var(--argos-brand-surface)` |
| `--argos-brand-dark-candidate` | `var(--argos-brand-dark)` |
| `--argos-brand-primary-alt-candidate` | `var(--argos-brand-primary-rejected-072648)` |

**No component uses brand tokens for painted UI in 21.3.**

---

### B. Semantic tokens (still → legacy appearance)

| Token | 21.3 value / reference | Role |
|-------|------------------------|------|
| `--surface-primary` | `#ffffff` | Marketing chrome, forms, cards |
| `--surface-elevated` | `#ffffff` | Elevated cards |
| `--surface-inverse` | `var(--argos-legacy-shell-navy)` | Nocturnal shell background |
| `--text-primary` | `var(--argos-legacy-navy)` | Body text on light surfaces |
| `--text-secondary` | `#4b5563` | Secondary copy |
| `--text-muted` | `#9cb7c9` | Muted text on dark shell |
| `--text-inverse` | `#f4faff` | Text on dark shell |
| `--border-default` | `#e5e7eb` | Light UI borders |
| `--border-subtle` | `rgba(255,255,255,0.16)` | Shell glass borders |
| `--action-primary` | `var(--argos-legacy-blue)` | Primary buttons (chrome) |
| `--action-secondary` | `var(--argos-legacy-blue)` | Outline / link actions |
| `--action-accent` | `var(--argos-legacy-cyan)` | Shell CTAs, eyebrows |
| `--status-success` | `#16a34a` | Success (reserved) |
| `--status-warning` | `#d97706` | Warning |
| `--status-danger` | `#dc2626` | Danger |
| `--status-info` | `var(--argos-legacy-blue)` | Info / links in chrome |

Retargeting semantic → brand requires a **separate authorized visual migration phase**.

---

### C. Legacy production tokens

| Token | Value | Notes |
|-------|-------|-------|
| `--argos-legacy-cyan` | `#18D4F7` | Shell accent — **not brand** |
| `--argos-legacy-blue` | `#2563EB` | Chrome — **not brand** |
| `--argos-legacy-light-blue` | `#38BDF8` | Favicon / selection |
| `--argos-legacy-navy` | `#07111F` | Body text / theme-color |
| `--argos-legacy-shell-navy` | `#071421` | Shell gradient base |
| `--argos-legacy-deep-blue` | `#0D3B66` | Shell `--argos-blue` |

Authoritative shared aliases (unchanged visually):

| Token | Value |
|-------|-------|
| `--argos-navy` | `#071421` |
| `--argos-blue` | `#0D3B66` |
| `--argos-cyan` | `#18D4F7` |

---

### D. Typography role tokens (`FONT_LOADING = NO`)

| Token | Role (frozen) | 21.3 stack | Future load |
|-------|---------------|------------|-------------|
| `--font-display` | Corporate Display → Cormorant Garamond | system sans | Deferred |
| `--font-body` | Corporate Body → Inter | system sans | Deferred |
| `--font-ui` | Corporate UI → Inter | system sans | Deferred |
| `--font-system-sans` | CURRENT_PRODUCTION | `-apple-system, …` | — |

**Manrope:** REJECTED — no token.

`body { font-family: var(--font-body); }` resolves to the **same** system stack as pre-21.3.

---

## Raw color policy

Unchanged from 21.1: no new raw hex / arbitrary Tailwind brand colors without exception; existing hardcoded hex not mass-migrated in 21.3.

---

## Control Center

`CONTROL_CENTER_DIRECTION = DEFERRED`
`CONTROL_CENTER_FROZEN = NO`

No Control Center–specific tokens.
