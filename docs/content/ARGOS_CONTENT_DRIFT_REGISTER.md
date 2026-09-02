# ARGOS Content Drift Register

**Version:** 1.0
**Date:** 2026-08-31
**Purpose:** Record known drift between **runtime** and **Content Freeze v1.0** — **no fixes in this mission**
**Authority:** `docs/content/ARGOS_CONTENT_FREEZE_V1.md`

---

## Summary

| Metric | Count |
|--------|------:|
| Drift items registered | 8 |
| FROZEN_EXACT drift (Hero) | 4 |
| FROZEN_CONCEPT not yet in runtime | 2 |
| Asset / structural drift | 2 |
| UNRESOLVED follow-ups | 2 |

---

## DRIFT-001 — Hero H1 + supporting copy vs freeze

| Field | Value |
|-------|-------|
| **DRIFT_ID** | DRIFT-001 |
| **CURRENT_A** (freeze v1.0) | **H1:** `Sistemas que no fallen cuando no deben.` **Supporting:** `Primero entendemos cómo trabaja tu empresa y de qué depende su operativa. Después ponemos orden, reducimos riesgos y mantenemos bajo control la tecnología que necesita para funcionar.` |
| **CURRENT_B** (runtime) | **H1:** `Tecnología serena para empresas que avanzan` (`es.json` → `home.title`). **Supporting:** `ARGOS elimina la complejidad y la incertidumbre de tu operación tecnológica. Protegemos lo que funciona y simplificamos lo que frena.` (`home.subtitle`) |
| **APPROVED_TARGET** | Freeze v1.0 FROZEN_EXACT (C-002) |
| **IMPLEMENTATION_REQUIRED** | YES — content implementation mission: update `es.json` `home.title`, `home.subtitle`; verify `HomeView.tsx` bindings |
| **RISK** | Medium — brand shift from Quiet Authority to operational hybrid; social previews remain wrong until DRIFT-002 resolved |

---

## DRIFT-002 — Hero vs layout.tsx OG / meta

| Field | Value |
|-------|-------|
| **DRIFT_ID** | DRIFT-002 |
| **CURRENT_A** | Freeze hero H1 (DRIFT-001) |
| **CURRENT_B** | `layout.tsx` OpenGraph title: `ARGOS-IT | Tecnología que protege, acompaña y simplifica`; description: `Tecnología que protege, acompaña y simplifica: soporte IT…`; Twitter title/description same theme |
| **APPROVED_TARGET** | **UNRESOLVED** — owner approved Hero exact strings only; OG/meta not specified in C-002 |
| **IMPLEMENTATION_REQUIRED** | YES — but requires separate owner decision on OG line before or with Hero ship |
| **RISK** | High for SEO/social — crawlers and shares show different promise than on-page Hero |

**Related:** `es.json` → `meta.homeTitle` = `ARGOS-IT | Tecnología serena para empresas que avanzan` (third variant)

---

## DRIFT-003 — Hero primary CTA label + wiring

| Field | Value |
|-------|-------|
| **DRIFT_ID** | DRIFT-003 |
| **CURRENT_A** | `Iniciar diagnóstico ARGOS` (FROZEN_EXACT primary CTA) |
| **CURRENT_B** | **Label exists** at `nav.startDiagnostic` / `home.ctaDiagnostic` (`Solicitar diagnóstico ARGOS` variant). **Hero UI** (`HomeView.tsx` L44–45): primary button = `nav.contact` → **Contacto**, links to `/contacto` |
| **APPROVED_TARGET** | Primary CTA exact string + diagnostic entry (opens survey modal / launcher — not contact page) |
| **IMPLEMENTATION_REQUIRED** | YES — i18n key selection + HomeView CTA wiring + diagnostic launcher hookup |
| **RISK** | High — contradicts UNDERSTAND_BEFORE_SELLING approval; users sent to contact instead of diagnostic |

---

## DRIFT-004 — Hero secondary CTA

| Field | Value |
|-------|-------|
| **DRIFT_ID** | DRIFT-004 |
| **CURRENT_A** | `Conocer cómo trabajamos` (FROZEN_EXACT) |
| **CURRENT_B** | Hero secondary: `nav.method` → **Método** (`HomeView.tsx` L47–48). Elsewhere: `home.ctaMethod` → `Ver método completo` |
| **APPROVED_TARGET** | Exact string `Conocer cómo trabajamos`; href presumed `/metodo` (UNRESOLVED in freeze) |
| **IMPLEMENTATION_REQUIRED** | YES — new i18n key or update; HomeView secondary link |
| **RISK** | Low — wording only; method link target likely unchanged |

---

## DRIFT-005 — Method phase verbs: Guiar/Supervisar vs Gestionar/Sostener

| Field | Value |
|-------|-------|
| **DRIFT_ID** | DRIFT-005 |
| **CURRENT_A** | Runtime method: **Guiar**, **Supervisar** (`es.json` `method.steps`; `methodArgosSteps.ts` slugs `guiar`, `supervisar`) |
| **CURRENT_B** | Service process arrays: **Gestionar**, **Sostener** (`es.json` → `services.{slug}.process` per baseline). WordPress export: **Gestionar**, **Sostener** phase pages |
| **APPROVED_TARGET** | **FROZEN_CONCEPT:** operational 5-phase A.R.G.O.S. unchanged; service process drift **not resolved in v1** |
| **IMPLEMENTATION_REQUIRED** | NO in v1 — document only; reconcile in future content mission if owner chooses |
| **RISK** | Medium — same letter G/S means different verbs on method vs service pages |

---

## DRIFT-006 — Legacy DiagnosticPromoBanner hardcoded strings

| Field | Value |
|-------|-------|
| **DRIFT_ID** | DRIFT-006 |
| **CURRENT_A** | Not governed by Hero freeze v1.0 |
| **CURRENT_B** | `DiagnosticPromoBanner.tsx`: `Descubre en pocos minutos el estado real de tu web`; highlight `Seguridad · Sistemas · Procesos`; CTA `Iniciar diagnóstico ARGOS` (matches primary label) |
| **APPROVED_TARGET** | UNRESOLVED — banner not in C-002 scope |
| **IMPLEMENTATION_REQUIRED** | OPTIONAL — migrate to i18n / align with Hero in later mission |
| **RISK** | Low — used on legacy `SiteHeader` path; corporate chrome may use `CorporateHeaderBanner` instead |

---

## DRIFT-007 — Missing logo and mascot runtime assets

| Field | Value |
|-------|-------|
| **DRIFT_ID** | DRIFT-007 |
| **CURRENT_A** | Code references expected assets |
| **CURRENT_B** | **Missing from repo:** `public/logo-argos-it.png`, `public/logo-argos-it-header.png` (referenced in `CorporateHeader.tsx`, `CorporateFooter.tsx`, `SiteHeader.tsx`, `SiteFooter.tsx`, `ArgosExplainerAnimation.tsx`). **Mascot PNGs:** paths in `spriteManifest.ts` under `/mascots/chico/*`, `/mascots/dumbo/*` — binaries not in audited repo |
| **APPROVED_TARGET** | Asset delivery mission (not content freeze) |
| **IMPLEMENTATION_REQUIRED** | YES — for visual completeness; not authorized in governance 03 |
| **RISK** | Medium — broken images in chrome/explainer; FUNCTIONAL paths protected |

---

## DRIFT-008 — Locale parity (non-ES)

| Field | Value |
|-------|-------|
| **DRIFT_ID** | DRIFT-008 |
| **CURRENT_A** | FROZEN_EXACT applies to ES only |
| **CURRENT_B** | `en`, `ca`, `fr`, `de`, `it`, `pt` locales — parity **UNVERIFIED** per baseline; still carry Quiet Authority / legacy hero strings |
| **APPROVED_TARGET** | UNRESOLVED — translation mission after ES implementation |
| **IMPLEMENTATION_REQUIRED** | YES — later mission |
| **RISK** | Medium — multilingual users see non-frozen copy |

---

## DRIFT-009 — Dual-layer method not in public UI

| Field | Value |
|-------|-------|
| **DRIFT_ID** | DRIFT-009 |
| **CURRENT_A** | FROZEN_CONCEPT: 4 public phases + bridge copy |
| **CURRENT_B** | Home shows **5-phase** A.R.G.O.S. rail only (`HomeView.tsx` methodSteps from `method.steps`); no 4-phase layer |
| **APPROVED_TARGET** | Bridge + 4-phase surfacing — placement UNRESOLVED |
| **IMPLEMENTATION_REQUIRED** | YES — content mission after Hero; not blocking Hero-only implementation |
| **RISK** | Low until dual-layer published without bridge (then HIGH) |

---

## DRIFT-010 — Four pillars not in public UI

| Field | Value |
|-------|-------|
| **DRIFT_ID** | DRIFT-010 |
| **CURRENT_A** | FROZEN_CONCEPT + ARCHITECTURAL_METADATA (C-003) |
| **CURRENT_B** | `/servicios` shows six service cards only; no Level-1 pillar intro |
| **APPROVED_TARGET** | Internal metadata now; public pillar layer when UX mission authorizes |
| **IMPLEMENTATION_REQUIRED** | NO in v1 — architectural contract only |
| **RISK** | Low — metadata internal; risk if devs expose PRIMARY_PILLAR in UI without UX approval |

---

## Implementation priority (recommended — not authorized)

| Priority | DRIFT_ID | Blocker for Hero ship? |
|----------|----------|------------------------|
| P0 | DRIFT-001, DRIFT-003, DRIFT-004 | YES |
| P1 | DRIFT-002 | YES for SEO coherence (needs owner OG decision) |
| P2 | DRIFT-009, DRIFT-010 | NO |
| P3 | DRIFT-005, DRIFT-006, DRIFT-008 | NO |
| Assets | DRIFT-007 | Visual only |

---

## Cross-reference

| Document | Link |
|----------|------|
| Freeze contract | `ARGOS_CONTENT_FREEZE_V1.md` |
| Ownership map | `ARGOS_CONTENT_OWNERSHIP_MAP.json` |
| Baseline snapshot | `docs/audits/ARGOS_CONTENT_BASELINE.md` |

**Fixes:** None applied in Governance 03 mission.
