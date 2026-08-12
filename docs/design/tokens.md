# ARGOS-IT Design Tokens

**Version:** 21.1  
**CSS source of truth:** `frontend/app/globals.css` (`:root`)  
**Shell extensions:** `frontend/assets/css/argos-backgrounds.css`

---

## Architecture (three layers)

### A. Brand candidates (PROVISIONAL — not applied to UI)

| Token | Value | Status |
|-------|-------|--------|
| `--argos-brand-primary-candidate` | `#1F3A5F` | PROVISIONAL / HIGH CONFIDENCE |
| `--argos-brand-primary-alt-candidate` | `#072648` | PROVISIONAL (Brand Book XML — CAB-DS-01) |
| `--argos-brand-secondary-candidate` | `#2F7D6D` | PROVISIONAL / HIGH CONFIDENCE |
| `--argos-brand-surface-candidate` | `#F7F7F5` | PROVISIONAL / HIGH CONFIDENCE |
| `--argos-brand-dark-candidate` | `#0B1320` | PROVISIONAL / HIGH CONFIDENCE |

These tokens exist for documentation and future migration. **No component uses them in 21.1.**

---

### B. Semantic tokens (map to legacy in 21.1)

| Token | 21.1 value / reference | Role |
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
| `--status-warning` | `#d97706` | Warning (dashboard amber family) |
| `--status-danger` | `#dc2626` | Danger (reserved) |
| `--status-info` | `var(--argos-legacy-blue)` | Info / links in chrome |

**Note:** Components still use hardcoded hex in 21.1. Semantic tokens are defined but not adopted in TSX/CSS selectors yet.

---

### C. Legacy production tokens

| Token | Value | Alias / notes |
|-------|-------|---------------|
| `--argos-legacy-cyan` | `#18D4F7` | Shell accent, CTAs on dark pages |
| `--argos-legacy-blue` | `#2563EB` | Marketing chrome, auth, dashboard cards |
| `--argos-legacy-light-blue` | `#38BDF8` | Favicon, selection on shell, Tailwind `argos.cyan` |
| `--argos-legacy-navy` | `#07111F` | Body text, theme-color meta |
| `--argos-legacy-shell-navy` | `#071421` | Shell gradient base |
| `--argos-legacy-deep-blue` | `#0D3B66` | Shell `--argos-blue` effective value |

---

## Authoritative `--argos-*` (collision resolution 21.1)

### Before 21.1

| Token | `globals.css` | `argos-backgrounds.css` | **Effective (cascade winner)** |
|-------|---------------|-------------------------|--------------------------------|
| `--argos-navy` | `#07111f` | `#071421` | `#071421` |
| `--argos-blue` | `#2563eb` | `#0D3B66` | `#0D3B66` |
| `--argos-cyan` | `#38bdf8` | `#18D4F7` | `#18D4F7` |

### After 21.1

Single definition in `globals.css`; duplicates removed from `argos-backgrounds.css`:

| Token | Value | Unchanged visual |
|-------|-------|------------------|
| `--argos-navy` | `#071421` | YES |
| `--argos-blue` | `#0D3B66` | YES |
| `--argos-cyan` | `#18D4F7` | YES |

---

## Shell-only tokens (`argos-backgrounds.css`)

Remain in shell stylesheet: `--argos-ink`, `--argos-navy-2`, `--argos-cyan-2`, `--argos-aqua`, `--argos-white`, `--argos-muted`, glass/shadow/mascot safe-area tokens.

---

## Raw color policy (21.1)

### New code

**Prohibited** without documented exception:

- Literal `#xxxxxx` in new TSX/CSS
- `rgb(...)`, `hsl(...)` for brand/surface/action colors
- Tailwind arbitrary colors `bg-[#xxxxxx]`, `text-[#xxxxxx]`, etc.

**Allowed:**

- Semantic CSS variables from this token set
- Tailwind `argos.*` keys where already mapped (legacy phase)
- Standard Tailwind status neutrals (`amber-*`, `red-*`) with documentation

### Existing code

- **Do not** mass-migrate 50+ hardcoded hex values in 21.1.
- Inventory and mapping: [legacy-map.md](./legacy-map.md).
- Migration: future phases after CAB closes open decisions.

---

## Typography (21.1 — document only)

| Font | Status |
|------|--------|
| Cormorant Garamond | PROVISIONAL (display candidate) |
| Inter | PROVISIONAL (body/UI candidate) |
| Manrope | UNRESOLVED (Brand Guide only) |
| System sans stack | CURRENT_PRODUCTION |

**No `next/font`, no Google Fonts load, no `font-family` changes in 21.1.**

---

## Control Center

`CONTROL_CENTER_DIRECTION = DEFERRED`

No Control Center–specific tokens beyond those required to preserve current `/dashboard` (client portal) appearance.

---

## Logo / Dumbo

- `LOGO = PROTECTED`
- `DUMBO = PROTECTED`

No regenerate, recolor, distort, replace, or AI redesign until master approved.
