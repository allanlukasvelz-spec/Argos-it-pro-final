# ARGOS Design Director Brief

**Status:** CANONICAL CONTRACT (documentation only)
**Phase:** 21.6A.1
**Base:** `11b286e` (`origin/main`)
**Does not authorize:** visual production migration, Relume MCP, Framer agent, npm, Figma, push, PR

This brief is the contract between ARGOS Brand/CAB, Relume (IA), Framer (visual lab), human approval, Cursor (engineering), and production.

It does **not** reopen [cab-decisions.md](./cab-decisions.md).

---

## 1. PURPOSE

ARGOS-IT protege, previene, acompaña y simplifica la tecnología de sus clientes.

La web Corporate no vende “software mágico”. Explica un acompañamiento técnico serio: soporte IT, seguridad, presencia web, automatización con criterio y mejora continua.

## 2. BRAND PROMISE

La tecnología del cliente debe sentirse:

- **CONTROLADA**
- **COMPRENSIBLE**
- **VIGILADA**
- **ESTABLE**

Nunca amenazante, ruidosa ni heroica al estilo ciberseguridad de espectáculo.

La marca comunica:

- serenidad
- prevención
- claridad
- confianza
- continuidad
- acompañamiento humano
- competencia tecnológica
- tecnología silenciosa

## 3. TARGET AUDIENCE

Empresas, autónomos y profesionales que necesitan un socio tecnológico externo: telemático, telefónico o presencial según proyecto.

No es el público de un SaaS genérico, ni de un marketplace de IT, ni de un dashboard de producto.

Auth (`/auth/*`), Portal (`/dashboard`) y Control Center **no** son audiencia de este brief visual.

## 4. DESIRED EMOTIONAL RESPONSE

La persona que llega debe sentir:

calm · warm · trustworthy · competent · human · technologically precise · sustainable · premium without luxury excess

Debe marcharse con la sensación de que ARGOS entiende el problema, no de que ARGOS “impresiona”.

## 5. CORPORATE VISUAL PRINCIPLES

**CORPORATE_DIRECTION = LIGHT_PREMIUM_INSTITUTIONAL** (CAB-DS-06, CANONICAL)

- Superficie clara institucional (`#F7F7F5`)
- Acento navy como autoridad (`#1F3A5F`)
- Teal/verde como acento de sistema, no ornamentación (`#2F7D6D`)
- Mucho espacio negativo
- Jerarquía tipográfica clara (display vs body vs UI)
- Bordes discretos, radios contenidos, sombras mínimas o nulas
- Un CTA primary por contexto; el resto es enlace o acción secundaria
- Tecnología presente y callada

No renegociar la dirección por defaults de Relume, Framer, Tailwind, shadcn o plantillas SaaS.

## 6. CANONICAL COLORS

| Role | Value | Status |
|------|-------|--------|
| Primary | `#1F3A5F` | CANONICAL (CAB-DS-01) |
| Secondary | `#2F7D6D` | CANONICAL |
| Surface | `#F7F7F5` | CANONICAL |
| Dark | `#0B1320` | CANONICAL |
| `#072648` as primary | — | REJECTED (CAB-DS-01b) |

Legacy (not brand; do not use as new Corporate identity):

- `#18D4F7` cyan
- `#2563EB` blue
- `#38BDF8` light blue
- `#39F4FF` / equivalent neon

CSS tokens: `--argos-brand-primary`, `--argos-brand-secondary`, `--argos-brand-surface`, `--argos-brand-dark`.

Prefer tokens over raw hex in implementation. Relume/Framer may cite the hex values above as locked inputs; they must not invent near-equivalents.

## 7. TYPOGRAPHY

| Role | Face | Use |
|------|------|-----|
| Display | Cormorant Garamond | Headings / display only |
| Body | Inter | Running text |
| UI | Inter | Nav, buttons, labels, inputs, controls |
| Manrope | — | REJECTED (CAB-DS-04) |

Cormorant **must not** appear on buttons, nav, inputs, small functional labels, or controls.

Implementation note (do not reopen CAB roles): on production Corporate scope, Inter and Cormorant load via `next/font` under `.argos-corporate` (21.4). Global body remains isolated outside that scope.

## 8. WHAT ARGOS MUST NOT LOOK LIKE

The following are **REJECTED** for Corporate exploration and implementation. Relume/Framer cannot introduce them without explicit human approval:

- generic SaaS
- cyberpunk
- hacker aesthetic
- crypto
- gaming
- neon
- glass everywhere
- gradient overload
- huge pill UI
- fake dashboards
- fake metrics
- fake testimonials
- fake logos
- generic AI illustrations
- random feature grids
- visual noise
- Manrope
- cyan/neon legacy as Corporate identity
- client-work aesthetics (UDIC, TusetCN, Flores Galí, landscaping)

A page that only swaps ARGOS colors onto a SaaS template is also REJECTED.

## 9. CONTENT PROVENANCE RULES

Canonical copy may come **only** from:

- `frontend/i18n/locales/*`
- ARGOS corporate documentation already approved (Level 4 copy/tone)

Any AI-invented sentence, heading, or CTA:

`AI_DRAFT_DO_NOT_SHIP`

It never becomes product automatically.

**Do not invent:**

- services
- prices
- SLAs
- statistics
- named clients
- logos
- certifications
- testimonials
- partners
- guarantees

Existing Home placeholder social proof (“Prueba social editable…”) is **debt**, not a license to fabricate reviews.

Official service slugs (closed list):

`consultoria-it`, `mantenimiento-informatico`, `seguridad-informatica`, `web-wordpress`, `automatizacion-ia`, `auditoria-digital`

## 10. INFORMATION ARCHITECTURE PRINCIPLES

Use the real site. Do not invent routes.

Primary Corporate IA (existing nav):

- `/` Home
- `/servicios` Services listing
- `/metodo` Method
- `/sobre-argos-it` About
- `/contacto` Contact

Nested, not equivalent to parents without an explicit phase:

- `/servicios/[slug]`
- `/metodo/[slug]`

Out of Corporate visual lab unless a later CAB says otherwise:

- `/auth/*`
- `/dashboard`
- Control Center (not built; DEFERRED)
- `/explainer` (no chrome)

Legal (`/aviso-legal`, `/privacidad`, `/cookies`) exists; it is not a Relume playground.

Narrative order for Corporate storytelling ( Relume may propose section order; it may not add destinations):

problem → understanding → prevention → ARGOS method → services → continuous protection → trust → contact

One `h1` per page. Headings are semantic, not a type-scale hack. Landmarks: one banner, one main, one contentinfo on Corporate chrome routes.

## 11. HOME NARRATIVE

Goal: understand ARGOS and take a next step (consulta / servicios / método).

Current production (Level 3, legacy skin) includes hero, services overview, tech stack, infrastructure, continuity, placeholder testimonials, plans anchor, closing CTA.

Relume should recover the **useful** story (problem, method, services, accompaniment, contact) and discard decorative noise (galaxy, fake command-center chrome, invented proof).

Framer explores how that story feels as LIGHT_PREMIUM_INSTITUTIONAL. It does not publish Home.

Cursor implements Home only after a frozen visual decision and an authorized migration phase.

## 12. SERVICES NARRATIVE

Goal: choose a real service and open its existing ficha (`/servicios/{slug}`) or request a consultation (`/contacto`).

Listing and slug pages are **not** the same route. Do not collapse them in Relume.

Do not add prices, packs, or services that are not in the closed slug list.

Copy for titles/descriptions/includes comes from i18n `services.*` and `servicesPage.*`.

## 13. METHOD NARRATIVE

Goal: understand ARGOS as Analizar → Reforzar → Guiar → Optimizar → Supervisar.

Method galaxy / meteors are Level 7 experimental, **not** brand.

Relume may structure the five steps and their relation to services. Framer may visualize the method without cyber/galaxy metaphor unless a human explicitly keeps a restrained fragment.

Do not invent a sixth step.

## 14. CONTACT NARRATIVE

Goal: send a real request. Existing production Corporate (`/contacto`) is the **positive control**: chrome + canvas already canonical on `main`.

Relume/Framer must not “improve” Contact by adding channels, maps, SLAs, or chat widgets that do not exist.

CTA destination remains `/contacto` (and existing form fields). No new invented endpoints.

Any visual exploration of Contact is a lab, not a license to regress production `/contacto`.

## 15. CORPORATE VS CONTROL CENTER

| Context | This brief |
|---------|------------|
| Corporate website | YES — target of Relume/Framer lab |
| Client Portal `/dashboard` | NO — preserve; not Control Center |
| Auth | NO — preserve |
| Control Center | DEFERRED (`CAB-DS-07`); Concept Book missing; `CONTROL_CENTER_FROZEN = NO` |
| Home “command center” decoration | NOT Control Center; not brand |

Corporate ≠ Control Center ≠ client work ≠ generic SaaS.

## 16. MASCOT POLICY

- **Logo = PROTECTED**
- **Dumbo = PROTECTED**
- **Chico = PROTECTED** (companion; not a substitute logo)

Forbidden without approval: regenerate, recolor, distort, replace the dog with a generic tech icon, AI-redraw.

Corporate chrome (21.5) has **no** Dumbo diagnostic slot. Relume/Framer must not put mascots in the header by default.

Assistants (Chico/Dumbo chat) are product overlays, not Corporate chrome. They are not a visual identity system.

## 17. IMAGERY POLICY

Prefer: calm photography or no photography; official logo; existing emblems already in repo.

Reject: generic AI people-in-office, neon networks, HUD overlays, fake dashboards, stock “AI brain”, client project shots as ARGOS brand.

If an image is decorative, it must be hidden from assistive technology. If informative, it needs real `alt` in the site language.

## 18. MOTION POLICY

Motion is restrained and optional.

Allowed intent: short opacity/transform on interactive states; respect `prefers-reduced-motion`.

Rejected: spectacular loops, galaxy, meteors, glass parallax, auto-playing marketing theatre.

No new JS listeners for purely visual effects. Prefer CSS. Cursor must not add client components “for animation convenience”.

## 19. RESPONSIVE PRINCIPLES

Required check widths: **390 / 768 / 1024 / 1440**.

No accidental horizontal scroll. Tap targets ≥ 44px on primary actions. Headings wrap; do not shrink-to-fit with overflow.

Framer breakpoints are a sketch. Cursor reimplements against ARGOS CSS/layout, then reports gaps.

## 20. ACCESSIBILITY PRINCIPLES

- One `h1`; sequential `h2`/`h3`
- Correct `main`, `banner`, `contentinfo`
- Visible focus (do not remove outline without replacement)
- Contrast: brand pairs already documented as AA/AAA in [ARGOS_DESIGN_SYSTEM.md](./ARGOS_DESIGN_SYSTEM.md) §13; validate each new use
- Links distinguishable; buttons semantic
- Do not communicate state by color alone
- Keyboard and mobile menu: focus restore, no scroll trap

Relume wireframes that skip semantics are incomplete. Framer prototypes that fail keyboard/contrast do not freeze.

## 21. PERFORMANCE PRINCIPLES

- No new npm dependencies for visual fashion
- No runtime Google Fonts requests (use existing `next/font` self-hosting)
- No huge images without need
- Do not convert trees to `"use client"` for convenience
- Do not load Relume/shadcn/Tailwind-preset as a second design system

## 22. RELUME RESPONSIBILITIES

Relume = **IA + sitemap + UX + wireframes**.

May: map real routes, section order, block intent, flows, unstyled structure.

Must not: become visual SoT; dump React/Tailwind/shadcn into the repo; invent services or copy as canonical; design Auth/Dashboard/Control Center; require Relume MCP.

Relume Style Guide colors/type must be **forced to ARGOS tokens**, not Relume defaults. If Relume cannot lock them, treat style guide as disposable and keep tokens in this brief.

Output expected: IA specification (routes, sections, flows) for human review.

## 23. FRAMER RESPONSIBILITIES

Framer = **visual exploration + unpublished prototype**.

May: compose A/B/C with ARGOS tokens; rhythm; type application; surfaces; restrained motion; responsive *concepts*.

Must not: host argos-it.com; export a Framer site as ARGOS production; change identity; ship AI copy; silently replace Corporate chrome.

Framer canvas is a lab. Screenshots are evidence, not Source of Truth.

There is **no** official Relume → Framer export. Do not treat unofficial Figma plugin chains as architecture.

## 24. CURSOR RESPONSIBILITIES

Cursor = **engineering implementation + QA** after human freeze.

May: map approved spec onto `getChromeOwner`, `CorporatePageShell`, `CorporateHeader`/`Footer`, `argos-corporate.css`, i18n, a11y, Playwright (`maxDiffPixels = 0`).

Must not: silently reinterpret the approved design; install Relume MCP or `npx @framer/agent` against this repo; redesign Auth/backend; update unauthorized goldens; invent copy.

If Framer cannot be implemented cleanly on the existing stack: **GAP report**, then stop or ask. Do not substitute.

## 25. HUMAN APPROVAL GATE

Nothing moves from lab to Cursor implementation without an explicit freeze:

```
FROZEN_IA = YES|NO
FROZEN_VISUAL_DIRECTION = A|B|C|NONE
AUTHORIZED_ROUTES = (list)
COPY_SOURCE = i18n|approved-docs
```

Human authority outranks Relume, Framer, and Cursor.

This brief does **not** freeze A/B/C. It only defines them.

## 26. A/B/C DESIGN DIRECTIONS

Same locked palette and type. They **must** differ in composition, rhythm, density, metaphor, block architecture, imagery, and interaction — not hue.

### A — WARM INSTITUTIONAL

Human/editorial. High whitespace. Trust first. Technology understated.

- Composition: text-led columns, quiet photography or none
- Density: low
- Metaphor: studio / professional practice
- Blocks: essay → proof of method (existing copy) → services → single CTA
- Interaction: minimal hover; one primary button
- Imagery: warm, never stock SaaS

### B — QUIET TECHNOLOGY

Precise, structured, technical. Subtle signals/status. No cyber.

- Composition: inventory-like grids, alignment, system labels (UI Inter)
- Density: medium-high
- Metaphor: calm monitoring, not a HUD
- Blocks: method as system map → services as register → contact as request
- Interaction: clearer focus/state; still no neon
- Imagery: little or none; geometry only if quiet

### C — TRUSTED TECHNOLOGY PARTNER

Human + technical balance. Prevention and continuity central.

- Composition: relational hero + secondary technical module
- Density: medium
- Metaphor: accompanying partner, not a product dashboard
- Blocks: problem → prevention → method → services → continuity → contact
- Interaction: dual existing CTAs only (`requestConsultation`, `viewMethod` / `viewServices`)
- Imagery: people-scale if used; mascots not in chrome

**Rejection:** if A/B/C only recolor the same Relume SaaS template, regenerate.

## 27. ANTI-DRIFT POLICY

| If this drifts… | Winner |
|-----------------|--------|
| Relume style vs CAB tokens | CAB + this brief |
| Framer visual vs frozen direction | Frozen human decision |
| AI copy vs i18n | i18n |
| Playwright PNG vs spec | Spec; PNGs are evidence |
| Cursor “improvement” vs approved design | Approved design or GAP report |

Relume Library is not ARGOS SoT. Framer is not ARGOS SoT.

## 28. DESIGN HANDOFF CONTRACT

1. **Relume output** → canonical IA spec: real routes, sections, component *intent*, flows, copy keys or `AI_DRAFT_DO_NOT_SHIP`.
2. **Framer output** → canonical visual spec: chosen direction, tokens, type roles, spacing logic, breakpoints, states, motion, assets, a11y notes.
3. **Human approval** → freeze record (section 25).
4. **Cursor input** → that freeze + existing Corporate primitives + ownership rules (exact vs prefix paths).
5. **Cursor output** → production implementation + authorized visual baselines only.

Handoff must include: routes, sections, component intent, spacing, typography, colors, states, breakpoints, motion, assets, interaction, accessibility, copy provenance, responsive behavior.

## 29. SOURCE-OF-TRUTH CHAIN

```
CAB / Brand
  → ARGOS Design Director Brief (this file)
    → Approved IA
      → Approved Visual Direction
        → Design System (docs + tokens)
          → React / CSS implementation
            → Playwright evidence
```

- Relume canvas ≠ SoT
- Framer canvas ≠ SoT
- Screenshots ≠ SoT
- Production Level 3 legacy skin ≠ brand target

## 30. REJECTION CRITERIA

Reject a Relume/Framer/Cursor proposal if it:

- invents services, prices, SLAs, stats, clients, logos, certifications, testimonials, partners, or guarantees
- uses REJECTED aesthetics (section 8)
- puts Cormorant on UI controls
- uses Manrope or `#072648` as primary
- treats cyan/blue legacy as Corporate identity
- migrates `/auth`, `/dashboard`, or Control Center
- copies Corporate header/footer per page or scatters `pathname ===` chrome checks
- dumps Relume React/shadcn/Tailwind preset into the repo
- publishes or hosts ARGOS on Framer
- updates unauthorized Playwright goldens
- ships `AI_DRAFT_DO_NOT_SHIP` copy
- presents A/B/C that differ only in color
- proceeds without human freeze

---

**Next authorized step (not this commit):** human creates Relume/Framer accounts if desired. No MCP. No npm. No production design migration.
