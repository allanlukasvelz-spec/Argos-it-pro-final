# ARGOS Content Freeze Policy

**Effective:** 2026-08-31
**Context:** B12 contamination audit = `CLEAN`. Content baseline captured in `docs/audits/ARGOS_CONTENT_BASELINE.{md,json}`.

This policy governs **visual refactor missions** vs **content change missions**. It does not approve or reject specific copy — it defines what may change in each mission type.

---

## 1. Mission types

### Visual-only mission

```
DESIGN_CHANGE_AUTHORIZED = YES
CONTENT_CHANGE_AUTHORIZED = NO
CONTENT_DIFF_ALLOWED = 0
```

Applies when the goal is layout, styling, responsive behavior, motion, or component composition **without** altering business meaning.

### Content mission

```
CONTENT_CHANGE_AUTHORIZED = YES
```

Requires explicit authorization, human review, and update to `ARGOS_CONTENT_BASELINE` after approval.

---

## 2. Permitted in visual-only missions

Changes to:

- layout structure and composition
- CSS / Tailwind classes and tokens
- responsive breakpoints and grid behavior
- spacing, rhythm, and visual hierarchy
- typography **roles** (size, weight, line-height) — not wording
- motion, transitions, and interaction affordances
- card shells, borders, shadows, surfaces
- iconography and decorative motifs
- component arrangement (e.g. hero split 60/40)

**B12 reference:** layout, composition, grids, spacing, responsive patterns, animations, and aesthetic direction are **allowed** as design input. See `ARGOS_B12_CONTAMINATION_AUDIT.md`.

---

## 3. Forbidden in visual-only missions

Any change to:

- headlines, subheadlines, body copy, CTAs
- service names, descriptions, benefits, process text
- method phase names and explanatory copy
- diagnostic questions, options, scoring labels, recommendations
- Chico/Dumbo messages, tips, chat strings, aria-labels with semantic content
- footer taglines, legal text, cookie banner copy
- SEO: `<title>`, meta description, OpenGraph, Twitter cards, JSON-LD text fields
- form labels, placeholders, success/error messages
- email addresses, phone numbers, URLs with business meaning
- alt text describing brand or service claims
- i18n JSON values in any locale
- hardcoded strings in TSX (e.g. `DiagnosticPromoBanner.tsx`)

**Rule:** If a diff changes a string a user can read or a crawler can index, it is a **content change**, not a visual change.

```
CONTENT_DIFF_ALLOWED = 0
```

---

## 4. Protected experience elements

These must be **preserved functionally and semantically** during visual refactors (styling around them may change):

| Element | Primary source |
|---------|----------------|
| Diagnostic engine (12 questions) | `diagnosticQuestions.ts`, `diagnosticScoring.ts` |
| Diagnostic modal flow | `DiagnosticSurvey.tsx`, `DiagnosticSurveyLauncher.tsx` |
| Diagnostic banners (3 surfaces) | `HomeDiagnosisCard`, `CorporateHeaderBanner`, `DiagnosticPromoBanner` |
| Chico tips (12) | `chicoTips.ts` |
| Mascot dock + chat | `ClientAssistants.tsx`, `ChicoDumboSpriteSystem.tsx`, `MascotChatPanel.tsx` |
| Method 5 phases | `methodArgosSteps.ts`, `method.steps` i18n |
| 6 service slugs | `services.ts` |
| Sprite manifest paths | `spriteManifest.ts` |

Do not remove, rename, or rewrite these without a **content mission**.

---

## 5. Known internal drift (do not auto-fix in visual mission)

Documented in `ARGOS_B12_CONTAMINATION_AUDIT.md` §9:

1. Hero slogan (`es.json`) vs `layout.tsx` OpenGraph
2. `method.steps` Guiar/Supervisar vs `services.*.process` Gestionar/Sostener
3. Missing logo assets (`logo-argos-it.png`, `logo-argos-it-header.png`)

Visual missions must **not** silently resolve these by inventing copy or assets.

---

## 6. Verification checklist (visual mission PR)

Before merging a visual-only change:

- [ ] `git diff` contains no edits to `frontend/i18n/locales/*.json`
- [ ] No edits to `methodArgosSteps.ts`, `diagnosticQuestions.ts`, `diagnosticScoring.ts`, `chicoTips.ts`
- [ ] No edits to user-visible strings in TSX except `className` / `aria-hidden` decorative labels
- [ ] No edits to `layout.tsx` metadata fields
- [ ] Baseline diff review: `CONTENT_DIFF_ALLOWED = 0`

---

## 7. Baseline maintenance

After an **approved content mission**:

1. Update `docs/audits/ARGOS_CONTENT_BASELINE.md` and `.json`
2. Record `STATUS` changes and `HISTORICAL_SOURCE` where applicable
3. Do not mark copy as approved — baseline remains `PROPOSED_NOT_APPROVED` until business sign-off

---

## 8. Stop gate reference

```
B12_CONTENT_CONTAMINATION = CLEAN
DESIGN_CHANGE_AUTHORIZED = YES (visual missions)
CONTENT_CHANGE_AUTHORIZED = NO (visual missions)
CONTENT_CHANGE_AUTHORIZED = YES (content missions only)
READY_FOR_VISUAL_REFACTOR = NO (until content reconciliation completes)
```

See: `docs/audits/ARGOS_B12_CONTAMINATION_AUDIT.md`, `docs/audits/ARGOS_CONTENT_BASELINE.md`
