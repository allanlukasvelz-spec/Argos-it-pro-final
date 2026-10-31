# ARGOS Local Visual Wireframes — 21.7C.1

**Status:** LOCAL_VISUAL_FREEZE_CANDIDATE
**Phase:** 21.7C.1
**Date:** 2026-08-19
**Branch:** `design/21-7c-relume-framer-freeze`
**Base:** `d523f04` · `origin/main` = `aa8ce1a`
**Production implementation:** BLOCKED
**Human visual freeze:** REQUIRED

---

## 1. Executive visual contract

### 1.1 Purpose

Convertir la especificación estructural de `ARGOS_LOCAL_CANONICAL_WIREFRAMES_21_7C.md` en contrato visual local inequívoco: layout, tipografía, spacing, responsive, accesibilidad y factibilidad de implementación.

Este documento **no** autoriza cambios en producción.

### 1.2 Direction (frozen)

```
VISUAL_DIRECTION = QUIET_AUTHORITY
CORPORATE_DIRECTION = LIGHT_PREMIUM_INSTITUTIONAL
```

Prioridades visuales (orden):

1. Claridad
2. Jerarquía
3. Confianza
4. Legibilidad
5. Espacio
6. Consistencia
7. Personalidad
8. Conversión

### 1.3 Palette (locked)

| Role | Hex | Usage |
|------|-----|-------|
| Primary | `#1F3A5F` | Headings accent, primary CTA, active nav |
| Secondary | `#2F7D6D` | Links, secondary emphasis, perimeter accent |
| Surface | `#F7F7F5` | Page background |
| Dark | `#0B1320` | Body text on light surfaces |
| Elevated | `#FFFFFF` | Cards, form fields, lang bar |
| Border | `#D9E0E6` | Card/input borders (matches Corporate CSS) |
| Muted text | `#64748B` | Eyebrows, meta, captions |
| Focus ring | `#93C5FD` | `:focus-visible` (Corporate existing) |

**Rejected as corporate identity:** `#18D4F7`, `#2563EB`, `#38BDF8`, `#072648`, galaxy, neon, glass-everywhere.

### 1.4 Typography (locked roles)

| Role | Family | Usage |
|------|--------|-------|
| Display | Cormorant Garamond | `h1`, section display titles, hero headline |
| Body | Inter | Paragraphs, lists, card body |
| UI | Inter | Nav, buttons, labels, form controls |

**Rule:** Cormorant never on buttons, form labels, or nav links.

### 1.5 Scope pages

| Route | Template |
|-------|----------|
| `/` | Home (unique composition) |
| `/servicios` | Services listing |
| `/servicios/[slug]` | Service detail (reusable) |
| `/metodo` | Method overview |
| `/metodo/[slug]` | Method phase (reusable) |
| `/sobre-argos-it` | About |
| `/contacto` | Contact (align with existing Corporate) |

### 1.6 Immutable contracts

- IA, nav, six services, five method phases — see `ARGOS_LOCAL_CANONICAL_WIREFRAMES_21_7C.md`.
- Mascots: ASSISTANT_ONLY overlay; no header/hero/body animated mascot.
- Legal: header/nav keep; no diagnostic promo on legal routes.
- Copy source: `frontend/i18n/locales/es.json` (+ approved docs). New explanatory text = `AI_DRAFT_DO_NOT_SHIP`.

---

## 2. Shared shell

Applies to all Corporate-scoped public pages when migrated. Matches existing `CorporateHeader` / `CorporateFooter` (`argos-corporate.css`).

### 2.1 Header

```
Structure:
[lang bar 40px]
[nav row 64px: logo | primary nav | utility + CTA | mobile toggle]

Sticky: yes (top: 0, z-index: 50)
Background: Surface #F7F7F5
Border-bottom: 1px #D9E0E6
Total header height (--header-h): 104px
Max inner width: 80rem (1280px)
Horizontal padding (--header-px): 16px → 24px @768 → 32px @1024
```

**Primary nav** (from `corporateNav.ts`): Inicio · Servicios · Método · Sobre ARGOS-IT · Contacto
**Utility:** Portal → `/auth/login` (text link, not designed)
**CTA:** `Solicitar consulta` → `/contacto` (primary button, Inter)

**Responsive nav:**

| Viewport | Behavior |
|----------|----------|
| 1440 / 1024 | Inline nav + utility + CTA visible |
| 768 | Inline nav hidden; hamburger opens full-screen overlay panel |
| 390 | Same as 768; logo max-width 140px; CTA full-width in overlay |

Mobile overlay: vertical stack, 44px min tap targets, body scroll lock, Escape closes, focus returns to toggle.

### 2.2 Footer

```
Background: #0B1320
Text: #F7F7F5 / muted #94A3B8
Padding: 48px vertical @desktop, 32px @mobile
Max width: 80rem
Grid: 3 columns @1024+ | 1 column stack @768/390
```

**Columns:**

1. Logo + `footer.tagline` (no social icons, no newsletter)
2. Site links: Servicios, Método, Sobre ARGOS-IT, Contacto
3. Legal: Aviso legal, Privacidad, Cookies

**Bottom bar:** `footer.rights` only. No invented copyright year as marketing claim.

**Open question (documented):** footer column 2 today lists section nav, not six service slugs. Visual spec keeps section nav to match shipped CorporateFooter; service slugs appear in page body registers, not footer marketing lists.

### 2.3 Page canvas

```
Wrapper: .argos-corporate-shell
Main: .argos-corporate-shell__main
Background: Surface #F7F7F5
Min-height: calc(100vh - var(--header-h))
```

Mascot dock (`ClientAssistants`) remains product overlay outside this canvas spec.

---

## 3. Design primitives

Spec tokens for implementation phase — **not** production CSS.

### 3.1 Containers

| Token | Value | Use |
|-------|-------|-----|
| `--corp-max-wide` | `80rem` (1280px) | Header, footer, wide grids |
| `--corp-max-read` | `72rem` (1152px) | Default section content |
| `--corp-max-narrow` | `42rem` (672px) | Philosophy, editorial prose |
| `--corp-gutter` | `16px` / `24px` / `32px` | @390 / @768 / @1024+ |

Sections use `margin-inline: auto` + `padding-inline: var(--corp-gutter)`.

### 3.2 Section spacing

| Breakpoint | Section padding block |
|------------|----------------------|
| 390 | `40px` (`2.5rem`) |
| 768 | `48px` (`3rem`) |
| 1024+ | `64px` (`4rem`) |
| 1440 | `80px` (`5rem`) hero/major bands only |

Between sub-blocks within a section: `24px` mobile, `32px` desktop.

### 3.3 Type scale

| Element | 390 | 768 | 1024+ | Font |
|---------|-----|-----|-------|------|
| `h1` | 2rem / 1.15 | 2.25rem | 2.75–3rem | Cormorant 600 |
| `h2` section | 1.5rem | 1.75rem | 2rem | Cormorant 600 |
| `h3` card | 1.125rem | 1.125rem | 1.25rem | Inter 600 |
| Body | 1rem / 1.6 | 1rem / 1.65 | 1.0625rem / 1.7 | Inter 400 |
| Eyebrow | 0.75rem uppercase tracking 0.08em | same | same | Inter 600 |
| Button | 1rem | 1rem | 1.125rem | Inter 700 |

Max line length for prose: `65ch`. Headlines may span grid width but avoid >2 lines on desktop without manual break.

### 3.4 Grid

**Default content grid:** 12 columns, gap `24px` @desktop, `16px` @mobile.

Common spans:

- Hero copy: 7 cols + 5 cols visual (desktop) → stack @768
- 3-up cards: 4+4+4 → 2+2+2 @768 → 1 col @390
- 2-up split: 6+6 → stack @768
- Method timeline: horizontal @1024+, vertical stack @768/390

### 3.5 Cards (`.argos-corporate-card` pattern)

```
Background: #FFFFFF
Border: 1px #D9E0E6
Radius: 0.5rem (8px)
Shadow: none
Padding: 24px mobile / 32px desktop
```

No card-in-card stacks. Max one card layer per content block.

### 3.6 Buttons

**Primary:** bg `#1F3A5F`, text white, radius 0.5rem, min-height 44px, padding `16px 32px`, full-width only in mobile CTAs or forms.

**Secondary:** outline 1px `#1F3A5F`, transparent bg, same min-height.

**Quiet link:** `#2F7D6D` underline, underline-offset 2px.

One primary CTA per viewport context; secondary actions as text/outline.

### 3.7 Form fields

Match existing `.argos-corporate-input`: full width, radius 0.5rem, border `#D9E0E6`, focus border `#1F3A5F`, invalid `#DC2626`, labels Inter 600 0.875rem.

### 3.8 CTA bands

Full-width section, bg `#1F3A5F` or Surface with top/bottom border `#D9E0E6`.

```
Padding: 48px block @mobile, 64px @desktop
Inner max-width: 72rem
Layout: headline + supporting line + primary button
Alignment: center on mobile; left-aligned copy + right-aligned button @1024 when space allows
```

### 3.9 Timeline / Method

**Method overview (`/metodo`):** horizontal step rail @1024+ with A→R→G→O→S labels; vertical numbered list @768/390.

**Method phase template:** letter badge (circle 48px, bg `#1F3A5F`, white letter) + phase name; prev/next as text links with arrows, not pills.

No duplicate method block on Home: sections 06 and 07 are distinct — 06 = narrative intro (`method.title` context), 07 = five phase cards linking to `/metodo/{slug}`.

### 3.10 Service register

Six cards fixed order (matches `serviceSlugs`):

1. consultoria-it
2. mantenimiento-informatico
3. seguridad-informatica
4. web-wordpress
5. automatizacion-ia
6. auditoria-digital

Each card: `services.{slug}.title`, `description`, up to 4 bullets from `includes`, link `Ver detalle`.

### 3.11 Borders, radius, shadow

- Border default: `#D9E0E6`
- Radius: `0.5rem` cards/buttons/inputs; `9999px` only for method letter badges
- Shadow policy: **none** on cards; optional `0 1px 2px rgba(11,19,32,0.04)` on sticky header only if needed — prefer border

### 3.12 Image policy

- Prefer no photography on corporate pages except optional static emblem on About (`/argos-history-emblem.png`).
- No stock team photos, no avatar grids, no logo clouds.
- Hero may use abstract perimeter line art (subtle, ≤15% opacity) — not HUD/dashboard.
- Alt text required when images exist; decorative images `alt=""`.

### 3.13 Focus & motion

- Focus: 3px `#93C5FD`, offset 2px (Corporate existing).
- Motion: optional 150–200ms opacity/transform on section reveal; **disabled** under `prefers-reduced-motion`.
- No autoplay, no parallax, no scroll-jacking.

---

## 4. Home `/`

Single `h1` in Hero. Section order locked (no duplication of method narrative).

### 4.1 Section map

| # | Section | Surface | Layout |
|---|---------|---------|--------|
| 01 | Header | shell | shared §2 |
| 02 | Hero | Surface | 12-col: 7 col copy / 5 col perimeter visual |
| 03 | Reality / Problem | `#FFFFFF` band | narrow prose + 2-col problem list |
| 04 | Philosophy | Surface | centered narrow max 42rem |
| 05 | Principles / Benefits | `#FFFFFF` | 2×2 grid of `home.trustItems` |
| 06 | ARGOS Method intro | Surface | 6 col text + 6 col schematic (not timeline) |
| 07 | Five phases | `#FFFFFF` | 5 cards horizontal scroll @390 optional, grid @768+ |
| 08 | Six Services | Surface | 3×2 card grid |
| 09 | Stability / operational benefits | `#FFFFFF` | 3-col feature list, no metrics |
| 10 | Human trust | Surface | values band — **no quotes/avatars** |
| 11 | Final CTA | Primary band | CTA to `/contacto` |
| 12 | Footer | dark | shared §2 |

### 4.2 Hero (02)

- **Eyebrow:** `home.eyebrow` — Inter 0.75rem, `#2F7D6D`
- **H1:** `home.title` — Cormorant, Dark `#0B1320`
- **Subtitle:** `home.subtitle` — Inter, `#4B5563`, max 60ch
- **Proof tags:** `home.proofTags[]` — horizontal wrap pills, border only, no fill neon
- **CTAs:** Primary `Solicitar consulta` → `/contacto`; Secondary `Ver servicios` → `/servicios`
- **Visual column:** subtle perimeter geometry on Surface; no Command Center HUD, no fake metrics

**Rejected from production debt:** `commandCenterTitle`, placeholder testimonials, logo clouds.

### 4.3 Reality / Problem (03)

- **H2:** `AI_DRAFT_DO_NOT_SHIP` — "Cuando la tecnología se improvisa" (or derive from brief philosophy; mark draft until i18n key exists)
- **Body:** problem framing without invented stats — use `home.explainer.problems[]` as bullet source OR brief-approved narrative
- **Layout:** prose left, bullet grid right @1024; stack @768

### 4.4 Philosophy (04)

Centered quote block (Cormorant 1.5rem):

> Entender antes de actuar. Prevenir antes de reaccionar. Acompañar sin abrumar.

(Source: design brief — if not in i18n, `AI_DRAFT_DO_NOT_SHIP` until key added.)

### 4.5 Principles / Benefits (05)

- **H2:** `home.trustTitle`
- **Grid:** 4 items from `home.trustItems` — icon optional (line icon, teal stroke), title + one line each

### 4.6 ARGOS Method intro (06)

- **H2:** `method.title`
- **Body:** `method.subtitle`
- **Visual:** simplified A→R→G→O→S diagram (labels only, links to `/metodo`)
- **CTA quiet:** `Ver método completo` → `/metodo`

**Not** the five expandable phase cards — that is section 07.

### 4.7 Five phases (07)

- **H2:** `nav.methodArgos` or `AI_DRAFT_DO_NOT_SHIP` "Las cinco fases"
- **Cards:** one per `method.steps[]` — letter badge, title, description, link to `/metodo/{slug}`
- **Order:** Analizar → Reforzar → Guiar → Optimizar → Supervisar

### 4.8 Six Services (08)

- **Eyebrow:** `home.servicesEyebrow`
- **H2:** `home.servicesTitle`
- **Subtitle:** `home.servicesSubtitle`
- **Grid:** 3×2 service register (§3.10)

### 4.9 Stability (09)

- **H2:** `AI_DRAFT_DO_NOT_SHIP` "Continuidad y prevención operativa"
- **Content:** prevention/continuity themes from trust/method narrative — no uptime %, no SLA
- **Layout:** 3 columns → stack @768

### 4.10 Human trust (10)

- **H2:** reuse `home.trustTitle` or `about.valuesTitle` context
- **Content:** `about.values[]` as principle list — **not** testimonials
- **Prohibited:** stars, avatars, "Equipo ARGOS IT", client logos

### 4.11 Final CTA (11)

- Headline: `contact.title` or `actions.requestConsultation`
- Button: primary → `/contacto`
- Optional secondary: `Ver servicios`

---

## 5. Services `/servicios`

### 5.1 Composition

1. **Page hero (editorial):** H1 `servicesPage.title`, subtitle `servicesPage.subtitle`, max-read container, left-aligned
2. **Service grid:** 6 cards, 2 columns @1024, 1 column @390
3. **Final CTA band:** `serviceDetail.ctaTitle` + button → `/contacto`

### 5.2 Card hierarchy

Each card equal visual weight (no "featured" service). Title → description (2–3 lines clamp @mobile) → up to 4 includes → `Ver detalle` link.

### 5.3 Responsive

| Viewport | Grid | Card padding |
|----------|------|--------------|
| 1440 | 2 col, gap 32px | 32px |
| 1024 | 2 col, gap 24px | 32px |
| 768 | 1 col | 24px |
| 390 | 1 col, full bleed cards | 20px |

---

## 6. Service detail template `/servicios/[slug]`

Reusable for all six slugs. Content from `services.{slug}.*`.

### 6.1 Block order

1. **Hero:** H1 `title`, lede `description`
2. **Problem:** H2 `serviceDetail.problemTitle` + `problem` (preserve paragraph breaks)
3. **Includes:** H2 `serviceDetail.includesTitle` + list `includes[]`
4. **Benefits:** H2 `serviceDetail.benefitsTitle` + list `benefits[]`
5. **Process:** H2 `serviceDetail.processTitle` + ordered list `process[]` (maps to A/R/G/O/S verbs — not new phases)
6. **Audience:** H2 `serviceDetail.audienceTitle` + list `audience[]`
7. **CTA band:** H2 `serviceDetail.ctaTitle`, subtitle `serviceDetail.ctaSubtitle`, button → `/contacto?service={slug}`

### 6.2 Layout

- Hero + problem: single column max 42rem for prose
- Includes/benefits: 2-col @1024 (includes | benefits), stack @768
- Process: vertical timeline with step numbers 1–5
- Audience: simple bullet list in card
- CTA: full-width band

---

## 7. Method `/metodo`

Must read clearly as **methodology**, not service catalog.

### 7.1 Composition

1. **Hero:** H1 `method.title`, subtitle `method.subtitle`
2. **Phase map:** horizontal rail A→R→G→O→S @1024+; vertical @768/390
3. **Phase cards:** each links to `/metodo/{slug}` with `method.steps[].title` + `description`
4. **Relation band:** `AI_DRAFT_DO_NOT_SHIP` explainer — "El Método ARGOS ordena decisiones; los Servicios son capacidades concretas" (two-column: method vs services, no merge)
5. **CTA:** → `/contacto`

### 7.2 Visual distinction Method ≠ Services

| Aspect | Método | Servicios |
|--------|--------|-----------|
| Metaphor | Sequence / journey | Register / catalog |
| Primary visual | Timeline / steps | Card grid |
| CTA copy | Ver fase / Explorar método | Ver detalle / Ver servicio |
| Color accent | Letter badges A–S | Service title headings |

---

## 8. Method phase template `/metodo/[slug]`

Reusable for five slugs. Content from `methodArgosSteps.ts` + i18n where overlapped.

### 8.1 Block order

1. **Hero:** letter badge + H1 `h1`, subtitle `subtitle`
2. **Meaning:** H2 + `meaning` prose
3. **What ARGOS does:** H2 + `argosActions[]`
4. **What client gets:** H2 + `results[]`
5. **Warning signs:** H2 + `warningSigns[]` (risks/señales — not fear marketing)
6. **Related services:** chips linking to `relatedServiceSlugs` only
7. **Prev/Next:** `prevSlug` / `nextSlug` navigation
8. **CTA:** from `primaryCta` if type `contact`, else quiet link to contact

**Note:** `primaryCta.type = diagnostic` on Analizar exists in production data — visual spec shows diagnostic as secondary quiet action, primary remains contact/consultation for corporate pages (no diagnostic promo slot in header).

### 8.2 Layout

- Hero: badge left, text right @1024; stack @390
- Lists: single column max 65ch
- Related services: horizontal chip row, wrap
- Prev/Next: footer nav bar, border-top

---

## 9. About `/sobre-argos-it`

### 9.1 Composition

1. **Hero editorial:** H1 `about.title`
2. **Body:** `about.paragraphs[]` — single column max 42rem
3. **Optional emblem:** static `/argos-history-emblem.png` right @1024, above text @768 — no animation
4. **Values:** H2 `about.valuesTitle`, list `about.values[]` in 2-col grid
5. **CTA:** → `/contacto`

### 9.2 Prohibited

Team grid, headcount, years in business, office photos, awards, certifications.

---

## 10. Contact `/contacto`

Align with shipped `ContactView` + Corporate chrome (positive control).

### 10.1 Composition

1. **Hero:** H1 `contact.title`, subtitle `contact.subtitle`, intro `contact.intro`
2. **Info cards row:**
   - Email: `info@argos-it.com` (mailto link)
   - Phone label: `contact.cards.phoneTitle` — value **"Canal a confirmar tras la solicitud"** (production truth; do not invent number)
   - Coverage: `contact.cards.coverageLines[]`
3. **Form:** title `contact.form.title`, fields name/email/phone/company/service/message/privacy, submit `contact.form.submit`
4. **Layout @1024+:** 5 col info + 7 col form; stack @768 (info first)

### 10.2 Prohibited

Map embed, chat widget, WhatsApp, invented hours, SLA promises, extra channels.

---

## 11. Responsive matrix (1440 / 1024 / 768 / 390)

| Family | 1440 | 1024 | 768 | 390 |
|--------|------|------|-----|-----|
| **Container** | max 1280, gutter 32 | max 1280, gutter 32 | max 100%, gutter 24 | gutter 16 |
| **Home hero** | 7/5 split | 7/5 split | stack, visual below | stack, H1 2rem |
| **Card grids** | 3 col services | 3 col → 2 col services listing | 2 col → 1 col | 1 col |
| **Method timeline** | horizontal rail | horizontal compact | vertical | vertical |
| **Nav** | inline | inline | hamburger overlay | hamburger |
| **CTA bands** | split headline/button | split | stacked center | stacked full-width btn |
| **Footer** | 3 col | 3 col | 1 col stack | 1 col stack |
| **Form** | 7/12 width | 7/12 | full width | full width |
| **Typography h1** | 3rem | 2.75rem | 2.25rem | 2rem |

**Reading order:** DOM order = visual order at all breakpoints. No CSS `order` that shuffles meaning.

**Overflow checks:** no horizontal scroll; phase rail may scroll-x @390 with snap optional; min tap 44px.

---

## 12. Accessibility matrix

| Criterion | Spec | Result |
|-----------|------|--------|
| One H1 per page | Each view §4–10 | PASS |
| Landmarks | header, main, footer, nav aria-labels | PASS |
| DOM order | No reorder traps | PASS |
| Focus visible | Corporate 3px ring | PASS |
| Keyboard nav | Skip to main recommended; mobile menu Escape | PASS |
| Contrast | Dark `#0B1320` on Surface ≥ 12:1; white on Primary ≥ 7:1 | PASS |
| Tap targets | Buttons/links ≥ 44px where primary | PASS |
| Form labels | Visible labels, `aria-invalid`, error text | PASS |
| No hover-only | All actions available on tap/keyboard | PASS |
| No color-only | Phase letters include text labels | PASS |
| Reduced motion | `prefers-reduced-motion` disables reveals | PASS |
| Zoom/reflow | No fixed px widths on prose; reflow @320 | PASS |
| Alt policy | §3.12 | PASS |

```
ACCESSIBILITY_SPEC = PASS
ACCESSIBILITY_IMPLEMENTATION_PASS = NOT_EXECUTED (spec only)
```

---

## 13. Truthfulness matrix

| Check | Requirement | Result |
|-------|-------------|--------|
| Testimonials | None | PASS |
| Client/partner logos | None | PASS |
| Team photos | None | PASS |
| Social networks | None in footer | PASS |
| Newsletter | None | PASS |
| Metrics/SLA/uptime | None decorative | PASS |
| Phone | "Canal a confirmar…" or omit | PASS |
| Email | info@argos-it.com only | PASS |
| Services | Six locked slugs | PASS |
| Method | Five phases, correct order | PASS |
| Routes | Closed IA | PASS |
| Copyright | footer.rights only | PASS |

```
TRUTHFULNESS_SPEC = PASS (5/5)
```

---

## 14. Implementation mapping

See dedicated artifact: `ARGOS_VISUAL_IMPLEMENTATION_MAP_21_7C_1.md`.

Summary: map primitives → `CorporatePageShell` sections → existing/new section components → `argos-corporate.css` tokens → i18n keys → future Playwright routes.

---

## 15. Rejected patterns

| Pattern | Reason |
|---------|--------|
| Newsletter footer | Truth + brief rejection |
| Social icon row | Unverified channels |
| Testimonial carousel | Unverified proof |
| Command Center HUD | Production debt, not identity |
| Logo cloud (Relume/Webflow/AWS/etc.) | Fake social proof |
| Glassmorphism panels | SaaS drift |
| Neon cyan accents | Legacy, not corporate |
| Sixth method phase | IA violation |
| Extra services | IA violation |
| Mascot in header/hero | 21.6B placement freeze |
| Duplicate method blocks on Home | Narrative contract |
| Aggressive countdown/scarcity CTAs | Brand violation |
| Stock office/team photography | Truth violation |

---

## 16. Open questions (for human freeze)

| ID | Question | Default in spec |
|----|----------|-----------------|
| OQ-01 | i18n keys for Philosophy quote and some section H2s | `AI_DRAFT_DO_NOT_SHIP` until keys added |
| OQ-02 | Footer lists section nav vs six service links | Keep shipped CorporateFooter pattern |
| OQ-03 | Font loading Inter/Cormorant in production | Corporate CSS assumes next/font; migration phase decides |
| OQ-04 | Diagnostic CTA prominence on method phase Analizar | Secondary quiet; no header diagnostic slot |
| OQ-05 | Perimeter illustration asset | Optional SVG; not blocking freeze |
| OQ-06 | Home tablet visual (21.6B unfrozen) | This spec defines 768; human may refine |

---

## 17. Human freeze checklist

Human must confirm before `DESIGN_FREEZE_AUTHORIZED = YES`:

- [ ] IA matches closed sitemap
- [ ] Home section order accepted (12 blocks, no method duplication)
- [ ] Quiet Authority palette/type accepted
- [ ] Six services + five phases correct
- [ ] Truthfulness 5/5 — no invented proof
- [ ] Responsive 390/768/1024/1440 acceptable
- [ ] Accessibility spec acceptable
- [ ] Contact truth (email + phone policy) acceptable
- [ ] Mascot/legal policies unchanged
- [ ] Open questions OQ-01–OQ-06 resolved or accepted
- [ ] Implementation map reviewed
- [ ] Production migration explicitly authorized in a **later** phase

```
HUMAN_DESIGN_REVIEW = REQUIRED
DESIGN_FREEZE_AUTHORIZED = NO
PRODUCTION_IMPLEMENTATION_AUTHORIZED = NO
FINAL_GATE = WAIT_FOR_21_7C_1_HUMAN_VISUAL_FREEZE
```

---

## 18. Red team (21.7C.1)

| ID | Test | Result |
|----|------|--------|
| F1 | fake social proof | PASS — omitted |
| F2 | invented claims | PASS — no metrics/SLA |
| F3 | service drift | PASS — six slugs |
| F4 | method drift | PASS — five phases ordered |
| F5 | IA drift | PASS |
| F6 | generic SaaS drift | PASS — anti-patterns listed |
| F7 | aggressive conversion | PASS |
| F8 | newsletter regression | PASS — absent |
| F9 | legal contamination | PASS — unchanged policy |
| F10 | mascot semantic drift | PASS — overlay only |
| F11 | mascot placement drift | PASS — no header/hero |
| F12 | fake partners | PASS |
| F13 | 390 responsive | PASS — matrix §11 |
| F14 | 768 responsive | PASS |
| F15 | 1024 intermediate | PASS |
| F16 | accessibility spec | PASS |
| F17 | excessive cardification | PASS — restrained grids |
| F18 | duplicate Method narrative | PASS — §4.6 vs §4.7 split |
| F19 | impossible implementation | PASS — maps to Corporate |
| F20 | Corporate primitive divergence | PASS — uses existing chrome |
| F21 | copy invention | PASS with OQ-01 drafts marked |
| F22 | navigation mismatch | PASS — corporateNav |
| F23 | footer inconsistency | PASS with OQ-02 documented |
| F24 | unverified contact | PASS — email verified, phone policy |
| F25 | production contamination | PASS — docs only |

```
RED_TEAM_RESULT = PASS
RESIDUAL_RISKS = OQ-01 draft copy keys; OQ-03 font loading; Framer access optional
```
