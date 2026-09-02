# ARGOS Content Baseline

**Snapshot date:** 2026-08-31
**Scope:** `frontend/` working tree (includes uncommitted i18n changes)
**Purpose:** Frozen inventory of current ARGOS content before visual refactor or content reconciliation.
**Policy:** Read-only reference — not approved final copy.

---

## CONTENT_SOURCE_MAP

| SOURCE | PATH | PURPOSE | AUTHORITY_LEVEL |
|--------|------|---------|-----------------|
| i18n JSON | `frontend/i18n/locales/es.json` (+ en, ca, fr, de, it, pt) | Primary public marketing copy (ES default) | **HIGH** — default locale |
| TypeScript data | `frontend/lib/methodArgosSteps.ts` | Method phase pages: H1, meaning, FAQ, CTAs, SEO titles | **HIGH** — method detail authority |
| TypeScript data | `frontend/lib/services.ts` | Service slug registry only (no copy) | **STRUCTURAL** |
| TypeScript data | `frontend/components/diagnostic/diagnosticQuestions.ts` | 12 diagnostic questions + option labels | **HIGH** — diagnostic engine |
| TypeScript data | `frontend/components/diagnostic/diagnosticScoring.ts` | Risk tiers, summaries, recommendations | **HIGH** |
| TypeScript data | `frontend/components/diagnostic/chicoTips.ts` | 12 rotating Chico header tips | **HIGH** |
| TypeScript data | `frontend/sprites/spriteManifest.ts` | Chico/Dumbo sprite path registry | **STRUCTURAL** |
| TSX hardcoded | `frontend/components/diagnostic/DiagnosticPromoBanner.tsx` | Legacy promo banner strings | **MEDIUM** — not in i18n |
| TSX hardcoded | `frontend/app/layout.tsx` | Root metadata, OG, Twitter, JSON-LD | **HIGH** for SEO (currently drifts from i18n) |
| TSX hardcoded | `frontend/components/pages/ContactView.tsx` | Email `info@argos-it.com`, form endpoint | **HIGH** |
| Config | `frontend/lib/corporateNav.ts` | Nav href + i18n key mapping | **STRUCTURAL** |
| Config | `frontend/lib/chromeOwnership.ts` | Which routes show which chrome | **TECHNICAL** |
| API / backend | `POST /api/client/diagnostics` (via `diagnosticPersistPayload.ts`) | Diagnostic persistence | **RUNTIME** |
| WordPress export | `wordpress-export/` | Historical content lineage (not runtime) | **REFERENCE** |
| Database | PostgreSQL (backend) | Auth, portal, diagnostics storage | **RUNTIME** — not marketing copy |

**Architectural answer:** Public marketing content lives primarily in **i18n JSON** (`es.json` default) with **method detail** and **diagnostic engine** in **TypeScript modules**. Root **SEO metadata** is **hardcoded in `layout.tsx`** (drift risk). Legacy **DiagnosticPromoBanner** has **hardcoded Spanish**. Mascot messages are in **i18n** (`mascots.*`). No WordPress runtime; export is reference only.

---

## Inventory summary

| Area | Primary source | Status |
|------|----------------|--------|
| Navigation | `corporateNav.ts` + `nav.*` i18n | CONSISTENT |
| Hero | `home.title`, `home.subtitle` | INTERNAL_DRIFT vs `layout.tsx` OG |
| CTAs | `actions.*`, `nav.*`, page CTAs | CONSISTENT |
| 6 services | `services.{slug}.*` i18n | CONSISTENT (process verbs drift) |
| Method overview | `method.*` i18n | CONSISTENT |
| 5 method phases | `methodArgosSteps.ts` | CONSISTENT |
| Diagnostic | `diagnosticQuestions.ts` + scoring | CONSISTENT |
| Diagnostic banners | 3 surfaces (see below) | CONSISTENT |
| Chico | `chicoTips.ts`, `mascots.messages`, sprites | MISSING_ASSET (PNG files) |
| Dumbo | `mascots.messages`, sprites, header banner | MISSING_ASSET (PNG files) |
| About | `about.*` i18n | CONSISTENT |
| Contact | `contact.*` i18n + ContactView | CONSISTENT |
| Portal | `portalPage.*` i18n | CONSISTENT |
| Footer | `footer.*` i18n | CONSISTENT |
| SEO/metadata | `meta.*` + `layout.tsx` | INTERNAL_DRIFT |
| Legal | `legal.*` i18n | CONSISTENT |
| Translations | 7 locales | UNVERIFIED parity (baseline = ES) |

---

## 1. Navigation

| KEY | CURRENT_VALUE (ES) | SOURCE_FILE | HISTORICAL_SOURCE | STATUS |
|-----|-------------------|-------------|-------------------|--------|
| `nav.services` | Servicios | `es.json` | Git / WP | CONSISTENT |
| `nav.method` | Método | `es.json` | Git | CONSISTENT |
| `nav.about` | Sobre ARGOS-IT | `es.json` | Git | CONSISTENT |
| `nav.contact` | Contacto | `es.json` | Git | CONSISTENT |
| `nav.portal` | Portal de cliente | `es.json` | Git | CONSISTENT |
| `nav.startDiagnostic` | Iniciar diagnóstico ARGOS | `es.json` | Git | CONSISTENT |
| Primary nav hrefs | `/servicios`, `/metodo`, `/sobre-argos-it` | `corporateNav.ts` | Design spec 21.7C | CONSISTENT |

---

## 2. Hero

| KEY | CURRENT_VALUE | SOURCE_FILE | HISTORICAL_SOURCE | STATUS |
|-----|---------------|-------------|-------------------|--------|
| `home.brandMark` | ARGOS IT | `es.json` | Uncommitted QA | CONSISTENT |
| `home.title` | Tecnología serena para empresas que avanzan | `es.json` | Quiet Authority (uncommitted) | INTERNAL_DRIFT |
| `home.subtitle` | ARGOS elimina la complejidad y la incertidumbre… | `es.json` | Same | INTERNAL_DRIFT |
| `layout.tsx` OG title | Tecnología que protege, acompaña y simplifica | `layout.tsx` | Git `61f1df5` / WP | INTERNAL_DRIFT |

---

## 3. CTAs

| KEY | CURRENT_VALUE | SOURCE_FILE | STATUS |
|-----|---------------|-------------|--------|
| `actions.requestConsultation` | Solicitar consulta | `es.json` | CONSISTENT |
| `home.ctaDiagnostic` | Solicitar diagnóstico ARGOS | `es.json` | CONSISTENT |
| `home.finalCtaTitle` | Hablemos con criterio | `es.json` | CONSISTENT |
| Hero primary CTA (UI) | Contacto (`nav.contact`) | `HomeView.tsx` | TECHNICAL_UI_COPY |

---

## 4. Services (6)

Slugs: `consultoria-it`, `mantenimiento-informatico`, `seguridad-informatica`, `web-wordpress`, `automatizacion-ia`, `auditoria-digital`

| Slug | title (ES) | description (first line) | SOURCE | HISTORICAL | STATUS |
|------|------------|--------------------------|--------|------------|--------|
| consultoria-it | Consultoría IT premium | Criterio tecnológico externo para ordenar infraestructura… | `es.json` | `wordpress-export/servicios/consultoria-it.html` | CONSISTENT |
| mantenimiento-informatico | Mantenimiento informático para empresas | Soporte preventivo y correctivo… | `es.json` | WP | CONSISTENT |
| seguridad-informatica | Seguridad informática y protección digital | Revisión y refuerzo de accesos… | `es.json` | WP | CONSISTENT |
| web-wordpress | Web y presencia digital | Diseño web profesional, mantenimiento… | `es.json` | WP | CONSISTENT |
| automatizacion-ia | Automatización con IA | Automatización de tareas repetitivas… | `es.json` | WP partial | CONSISTENT |
| auditoria-digital | Auditoría digital continua | Revisión periódica de web… | `es.json` | WP partial | CONSISTENT |

**Process verb drift:** each `services.{slug}.process` array uses **Gestionar** / **Sostener** while `method.steps` uses **Guiar** / **Supervisar** → `INTERNAL_DRIFT`

---

## 5. Method

| KEY / field | CURRENT_VALUE | SOURCE | STATUS |
|-------------|---------------|--------|--------|
| `method.title` | Método Argos | `es.json` | CONSISTENT |
| `method.subtitle` | Una metodología propia para pasar del problema técnico… | `es.json` | CONSISTENT |
| Phase A | Analizar | `method.steps[0]` | CONSISTENT |
| Phase R | Reforzar | `method.steps[1]` | CONSISTENT |
| Phase G | Guiar | `method.steps[2]` | CONSISTENT (vs services.process) |
| Phase O | Optimizar | `method.steps[3]` | CONSISTENT |
| Phase S | Supervisar | `method.steps[4]` | CONSISTENT (vs services.process) |

Detail pages: `frontend/lib/methodArgosSteps.ts` — slugs `analizar`, `reforzar`, `guiar`, `optimizar`, `supervisar`

---

## 6. Diagnostic ARGOS

| Component | SOURCE_FILE | STATUS |
|-----------|-------------|--------|
| Questions (12) | `diagnosticQuestions.ts` | CONSISTENT |
| Options (3) | `DIAGNOSTIC_OPTION_LABELS` | CONSISTENT |
| Scoring / tiers | `diagnosticScoring.ts` | CONSISTENT |
| Persist payload | `diagnosticPersistPayload.ts` → API | CONSISTENT |
| Modal UI | `DiagnosticSurvey.tsx` | CONSISTENT |
| Launcher context | `DiagnosticSurveyLauncher.tsx` | CONSISTENT |

**Questions count:** 12
**Risk tiers:** bajo, medio, alto, critico
**Source constant:** `diagnostico-argos`
**No `diagnostic_completed` localStorage key found** — completion flows via modal state + API submit.

---

## 7. Diagnostic banners (3)

| # | Surface | SOURCE_FILE | Copy source | STATUS |
|---|---------|-------------|-------------|--------|
| 1 | Hero diagnosis card | `HomeDiagnosisCard.tsx` | `home.diag*` i18n | CONSISTENT |
| 2 | Corporate header banner | `CorporateHeaderBanner.tsx` | `headerBanner.*` + `chicoTips` | CONSISTENT |
| 3 | Legacy promo banner | `DiagnosticPromoBanner.tsx` | Hardcoded ES strings | CONSISTENT |

**`DIAGNOSTIC_BANNERS_FOUND = 3`**

---

## 8. Chico

| Element | SOURCE | STATUS |
|---------|--------|--------|
| Sprite manifest | `sprites/spriteManifest.ts` → `/mascots/chico/*.png` | MISSING_ASSET in repo |
| Dock UI | `ChicoDumboSpriteSystem.tsx` | CONSISTENT |
| Chat panel | `MascotChatPanel.tsx` + `mascots.chat.*` i18n | CONSISTENT |
| Bubble messages | `mascots.messages.*.chico` i18n | CONSISTENT |
| Header tips (12) | `chicoTips.ts` | CONSISTENT |
| Guardian (portal) | `ChicoGuardian.tsx` + backend API | CONSISTENT |

**`CHICO_SOURCE_FOUND = YES`** (code); binary PNGs not in audited repo.

---

## 9. Dumbo

| Element | SOURCE | STATUS |
|---------|--------|--------|
| Sprite manifest | `sprites/spriteManifest.ts` → `/mascots/dumbo/*.png` | MISSING_ASSET in repo |
| Dock UI | `ChicoDumboSpriteSystem.tsx` | CONSISTENT |
| Header banner rotation | `CorporateHeaderBanner.tsx` | CONSISTENT |
| Bubble messages | `mascots.messages.*.dumbo` i18n | CONSISTENT |
| Explainer scenes | `home.explainer.*` i18n + `ArgosExplainerAnimation.tsx` | CONSISTENT |

**`DUMBO_SOURCE_FOUND = YES`** (code); binary PNGs not in audited repo.

---

## 10. ClientAssistants

| Field | Value |
|-------|-------|
| SOURCE_FILE | `frontend/components/ClientAssistants.tsx` |
| Composition | `MascotChatProvider` → `ChicoDumboSpriteSystem` + `MascotChatPanel` |
| STATUS | CONSISTENT |

---

## 11. About

| KEY | CURRENT_VALUE | STATUS |
|-----|---------------|--------|
| `about.title` | Sobre ARGOS-IT | CONSISTENT |
| `about.paragraphs[0]` | ARGOS-IT es una consultoría tecnológica premium… | CONSISTENT |
| `about.values` | 4 value bullets | CONSISTENT |

---

## 12. Contact

| KEY / field | CURRENT_VALUE | STATUS |
|-------------|---------------|--------|
| `contact.title` | Solicitar consulta técnica | CONSISTENT |
| Email (UI) | info@argos-it.com | `ContactView.tsx` | CONSISTENT |
| Form endpoint | formspree.io/f/xpqooedl | `ContactView.tsx` / `.env.example` | CONSISTENT |

---

## 13. Portal

| KEY | CURRENT_VALUE | STATUS |
|-----|---------------|--------|
| `portalPage.title` | Portal de cliente | CONSISTENT |
| `portalPage.lead` | Espacio para acceder a tus servicios ARGOS… | CONSISTENT |

---

## 14. Footer

| KEY | CURRENT_VALUE | STATUS |
|-----|---------------|--------|
| `footer.tagline` | Consultoría tecnológica premium para empresas… | CONSISTENT |
| `footer.rights` | ARGOS-IT. Todos los derechos reservados. | CONSISTENT |
| Logo image | `/logo-argos-it.png` | MISSING_ASSET |

---

## 15. SEO / metadata

| Field | CURRENT_VALUE | SOURCE | STATUS |
|-------|---------------|--------|--------|
| `meta.homeTitle` | ARGOS-IT \| Tecnología serena… | `es.json` | INTERNAL_DRIFT |
| `layout.tsx` description | Tecnología que protege, acompaña y simplifica… | `layout.tsx` | INTERNAL_DRIFT |
| canonical | https://argos-it.com | `layout.tsx` | CONSISTENT |
| JSON-LD email | info@argos-it.com | `layout.tsx` | CONSISTENT |

---

## 16. Legal

| Page | KEY prefix | STATUS |
|------|------------|--------|
| Aviso legal | `legal.aviso.*` | CONSISTENT |
| Privacidad | `legal.privacy.*` | CONSISTENT |
| Cookies | `legal.cookies.*` | CONSISTENT |
| Cookie banner | `cookiesBanner.*` | CONSISTENT |

---

## 17. Translations

Locales: `es`, `en`, `ca`, `fr`, `de`, `it`, `pt` — config in `frontend/i18n/config.ts`

**Baseline authority:** Spanish (`es.json`). Other locales: **UNVERIFIED** for parity in this snapshot.

---

## Internal drift register

| ID | Issue | STATUS |
|----|-------|--------|
| A | Hero/meta vs `layout.tsx` OG slogan | INTERNAL_DRIFT |
| B | `es.json` hero vs committed metadata | INTERNAL_DRIFT |
| C | Guiar/Supervisar vs Gestionar/Sostener in services.process | INTERNAL_DRIFT |
| D | Logo PNG referenced, not in repo | MISSING_ASSET |

**`INTERNAL_DRIFT_ITEMS = 4`**

---

## Stop gate

```
CONTENT_BASELINE_CREATED = YES
B12_CONTENT_CONTAMINATION = CLEAN
WEBSITE_CODE_MODIFIED = 0
READY_FOR_CONTENT_RECONCILIATION = YES
READY_FOR_VISUAL_REFACTOR = NO
```

See also: `ARGOS_CONTENT_BASELINE.json` for machine-readable inventory.
