# ARGOS-IT Legacy Color Map

**Version:** 21.3
**Scope:** `frontend/` (css, tsx, ts, js)
**Total unique normalized hex values:** 137 (inventory from 21.1; unchanged)
**Total color–file pairs:** 300

This document inventories production colors. **No TSX migration in 21.3.**
Semantic tokens remain mapped to this legacy palette so **VISIBLE_COLORS_CHANGED = NO**.

---

## Legacy production palette (preserved)

| Legacy token | Hex | Current role |
|--------------|-----|--------------|
| `legacy-cyan` | `#18D4F7` | Shell CTAs, eyebrows, borders, `--argos-cyan` |
| `legacy-cyan-bright` | `#39F4FF` | Hover states, accents, `--argos-cyan-2` |
| `legacy-blue` | `#2563EB` | Header, auth, contact, dashboard chrome |
| `legacy-blue-hover` | `#1D4ED8` | Button hover |
| `legacy-light-blue` | `#38BDF8` | Favicon, selection, Tailwind `argos.cyan` config |
| `legacy-navy` | `#07111F` | Body text, theme-color |
| `legacy-shell-navy` | `#071421` | Shell background, `--argos-navy` |
| `legacy-deep-blue` | `#0D3B66` | Shell `--argos-blue` |
| `legacy-deep-blue-2` | `#0B1E33` | Header text, `--argos-deep-blue` |
| `legacy-ink` | `#030812` | CTA text on cyan buttons |

---

## Top 30 raw values (by file count)

| RAW VALUE | COUNT | CURRENT ROLE | SEMANTIC TARGET | STATUS |
|-----------|-------|--------------|-----------------|--------|
| `#39F4FF` | 14 | Shell accent hover | `--action-accent` (bright) | LEGACY |
| `#07111F` | 12 | Text primary, theme | `--text-primary` | LEGACY |
| `#D7E8F6` | 12 | Shell body copy tint | `--text-inverse` (variant) | LEGACY |
| `#18D4F7` | 11 | Shell CTA/accent | `--action-accent` | LEGACY |
| `#E5E7EB` | 11 | Borders, inputs | `--border-default` | GENERIC |
| `#2563EB` | 10 | Chrome primary action | `--action-primary` | LEGACY |
| `#67E8F9` | 10 | Galaxy/diagnostic glow | — | LEGACY |
| `#030812` | 9 | CTA text on cyan | `--text-primary` (inverse ctx) | LEGACY |
| `#0B1E33` | 9 | Header/footer text | `--text-primary` (chrome) | LEGACY |
| `#22D3EE` | 8 | Header/footer accent | — | LEGACY |
| `#4B5563` | 8 | Muted text | `--text-secondary` | GENERIC |
| `#C9DDEC` | 8 | Shell card borders | `--border-subtle` | LEGACY |
| `#1D4ED8` | 7 | Blue hover | `--action-primary` (hover) | LEGACY |
| `#EAF7FF` | 6 | Light tint backgrounds | `--surface-elevated` | LEGACY |
| `#BFD7E8` | 5 | Method galaxy tint | — | LEGACY |
| `#FFFFFF` | 5 | Surfaces | `--surface-primary` | GENERIC |
| `#111827` | 4 | Dashboard headings | `--text-primary` | GENERIC |
| `#ECFEFF` | 4 | Diagnostic/header tint | — | LEGACY |
| `#082F49` | 3 | Footer gradient | — | LEGACY |
| `#0F172A` | 3 | Diagnostic banner bg | — | GENERIC |
| `#38BDF8` | 3 | Favicon, globals (pre-fix ref) | `--argos-legacy-light-blue` | LEGACY |
| `#7DD3FC` | 3 | Selection highlight | — | LEGACY |
| `#93C5FD` | 3 | Focus/disabled blue | — | LEGACY |
| `#EFF6FF` | 3 | Blue tint hover bg | — | LEGACY |
| `#F8FAFC` | 3 | Modal/paper bg | `--surface-elevated` | GENERIC |
| `#0284C7` | 2 | Diagnostic info | `--status-info` | STATUS_COLOR |
| `#061A30` | 2 | Method card bg | — | LEGACY |
| `#0C4A6E` | 2 | Banner gradient | — | LEGACY |
| `#0EA5E9` | 2 | Diagnostic accent | `--status-info` | STATUS_COLOR |
| `#1F2937` | 2 | Cookie banner text | `--text-primary` | GENERIC |

---

## Canonical brand (zero production usage in painted UI — 21.3)

| RAW VALUE | STATUS | TOKEN |
|-----------|--------|-------|
| `#1F3A5F` | **CANONICAL** brand primary | `--argos-brand-primary` |
| `#2F7D6D` | **CANONICAL** brand secondary | `--argos-brand-secondary` |
| `#F7F7F5` | **CANONICAL** brand surface | `--argos-brand-surface` |
| `#0B1320` | **CANONICAL** brand dark | `--argos-brand-dark` |
| `#072648` | **REJECTED** as primary | `--argos-brand-primary-rejected-072648` |

---

## Hardcoded hex in TSX (21.3 policy)

- **~50+** arbitrary Tailwind hex classes remain unchanged.
- Future **visual migration** phase: replace with semantic/brand tokens surface-by-surface.
- Visual regression baseline (`e2e/visual-regression.spec.ts`) guards against accidental drift (`maxDiffPixels = 0`).

---

## Mapping summary

```
Production UI today  →  Legacy tokens (semantic map in 21.3)
#2563EB chrome       →  legacy-blue / --action-primary
#18D4F7 shell        →  legacy-cyan / --action-accent

Canonical brand (docs + CSS vars; NOT painted yet)
#1F3A5F              →  --argos-brand-primary
#2F7D6D              →  --argos-brand-secondary
```

**PRIMARY_CANONICAL = `#1F3A5F`**
**PRIMARY_CANDIDATE_REMOVED = YES** (promoted; aliases kept temporarily)
**VISIBLE_COLORS_CHANGED = NO**
