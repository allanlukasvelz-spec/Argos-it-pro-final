# ARGOS B12 Contamination Audit

**Audit date:** 2026-08-31
**Mode:** Read-only forensic comparison
**Verdict:** `B12_CONTENT_CONTAMINATION = CLEAN`
**Website code modified during audit:** 0

---

## 1. Scope

Forensic comparison to determine whether the ARGOS Next.js project (`Argos-it-pro-final/frontend`) incorporated **content** (copy, claims, metadata, contact data, business logic text) from the B12 recovered Astro reference project (`ARGOS-IT-B12-RECOVERED/RECOVERED_PROJECT`).

B12 is authorized **only** as a **design reference** (layout, composition, spacing, responsive patterns, visual hierarchy). B12 must not supply marketing copy, SEO, forms, or business claims to ARGOS.

| Metric | Value |
|--------|-------|
| Files scanned (approx.) | ~312 |
| ARGOS frontend inspected | ~215 |
| B12 src/config inspected | ~97 |
| Distinctive B12 phrases tested | 15 |
| Automated distinctive-copy hits | **0** |
| Confirmed B12 content contamination | **0** |

---

## 2. Sources compared

| Source | Path | Role |
|--------|------|------|
| ARGOS (active) | `frontend/` | Target under audit |
| B12 (recovered) | `~/Documents/ARGOS-IT-B12-RECOVERED/RECOVERED_PROJECT/` | Design reference only |
| ARGOS historical | `wordpress-export/` | Business/content lineage (not B12) |
| Git history | `Argos-it-pro-final` | Pre-B12 ARGOS content recovery |

---

## 3. Methodology

1. **Literal phrase scan** — 15 distinctive B12 strings searched across all ARGOS `frontend` TS/TSX/JSON/CSS/MD files.
2. **Automated substring extraction** — B12 user-facing strings (≥25 chars) compared against ARGOS frontend (excluding `package-lock.json` hashes).
3. **Service description lineage** — ARGOS `i18n/es.json` vs B12 `[slug].astro` vs `wordpress-export/servicios/*.html`.
4. **SEO / invisible data** — `layout.tsx`, `ContactView`, forms, emails, canonical URLs.
5. **Asset hash comparison** — `favicon.svg` B12 vs ARGOS.
6. **Git archaeology** — method phase naming, hero slogans.

---

## 4. Fifteen distinctive B12 phrases tested

| # | Phrase (B12) | Hits in ARGOS frontend |
|---|--------------|------------------------|
| 1 | `Tecnología con orden, claridad y acompañamiento` | 0 |
| 2 | `Le ayudamos a organizar, proteger y optimizar` | 0 |
| 3 | `Sin improvisación, sin sobresaltos` | 0 |
| 4 | `No somos un proveedor más` | 0 |
| 5 | `departamento técnico de confianza` | 0 |
| 6 | `gigante de cien ojos` | 0 |
| 7 | `No vendemos humo` | 0 |
| 8 | `nada se nos escapa` | 0 |
| 9 | `Cuéntenos su situación` | 0 |
| 10 | `Servicios profesionales de tecnología` | 0 |
| 11 | `Seis áreas de especialización` | 0 |
| 12 | `Un sistema estructurado de cinco fases` | 0 |
| 13 | `Le acompañamos en la toma de decisiones` | 0 |
| 14 | `continuidad operativa garantizada` | 0 |
| 15 | `Usted toma decisiones tecnológicas con confianza` | 0 |

**Automated result:** `DISTINCTIVE_B12_COPY_HITS = 0`

---

## 5. False positives / coincidences discarded

### 5.1 Shared service slugs (not contamination)

| Shared value | B12 | ARGOS | Classification |
|--------------|-----|-------|----------------|
| `consultoria-it` | `src/pages/servicios/[slug].astro` | `frontend/lib/services.ts`, i18n | `ARGOS_ORIGINAL` — business catalog |
| `mantenimiento-informatico` | same | same | `ARGOS_ORIGINAL` |
| `seguridad-informatica` | same | same | `ARGOS_ORIGINAL` |
| `web-wordpress` | same | same | `ARGOS_ORIGINAL` |
| `automatizacion-ia` | same | same | `ARGOS_ORIGINAL` |
| `auditoria-digital` | same | same | `ARGOS_ORIGINAL` |

### 5.2 npm lockfile hashes

~130 substring matches between B12 and ARGOS `package-lock.json` — shared dependency integrity hashes. **Irrelevant to content audit.**

### 5.3 Generic Spanish IT phrases (WordPress lineage)

| Phrase | B12 | ARGOS | True lineage |
|--------|-----|-------|--------------|
| `Recomendaciones priorizadas` | seguridad features | `es.json` → `services.seguridad-informatica.includes` | `wordpress-export/servicios/seguridad-informatica.html` |
| `Automatización de tareas repetitivas` | automatizacion-ia description | `es.json` → `services.automatizacion-ia.description` | Partial match with `wordpress-export`; not B12 wording |

### 5.4 Service descriptions

ARGOS service copy aligns with **wordpress-export** (e.g. consultoría: «Criterio tecnológico externo…»). B12 uses different generic copy (e.g. «Análisis estratégico…», «Protección integral…»). **No B12 service description was adopted.**

### 5.5 Method phase names `Guiar` / `Supervisar`

Both B12 and ARGOS use these names, but ARGOS introduced them in Git commit `500ada7` (2026-05-19), **before** B12 recovery. Historical ARGOS WordPress used `Gestionar` / `Sostener`. Parallel naming, not demonstrated B12→ARGOS import. See **Internal Drift** below.

---

## 6. CONTENT vs VISUAL PATTERNS

### NOT contamination (design patterns allowed)

| Pattern | Notes |
|---------|-------|
| Hero divided (copy + side panel) | ARGOS: `HomeView` + `HomeDiagnosisCard`. B12: hero + SVG. Different copy. |
| Grid of 6 services | Same business catalog; descriptions from WordPress/Git |
| Rail of 5 A.R.G.O.S. phases | Structural; phase copy from ARGOS `methodArgosSteps.ts` / i18n |
| Mineral / teal palette | B12 `petroleum: #2F7D6D` ≈ ARGOS `--argos-teal: #2f7d6d` — brand tokens |
| Multi-column footer nav | Composition only |
| B12 CSS classes (`card-editorial`, `heading-xl`, `gradient-mineral`) | **Not present** in ARGOS frontend |

### Contact / SEO separation

| Field | B12 | ARGOS |
|-------|-----|-------|
| Email | `info@argos-it.es` (contact page) | `info@argos-it.com` |
| Phone | `Consultar disponibilidad` (placeholder) | Not equivalent placeholder |
| Form endpoint | B12 API-oriented `ContactForm` | `formspree.io/f/xpqooedl` (WordPress lineage) |

---

## 7. Assets

| Asset | B12 | ARGOS | Verdict |
|-------|-----|-------|---------|
| `favicon.svg` | SHA256 `ddba28cb…` (283 B) | SHA256 `c6444e91…` (243 B) | Different — no B12 asset |
| `logo-argos-it.png` | Not in B12 public | Referenced in ARGOS components | Not B12-sourced; see internal drift |
| Chico/Dumbo PNGs | Not in B12 recovery | Referenced via `/mascots/…` paths | ARGOS-native experience |

**`B12_ASSET_CONTAMINATION = 0`**

---

## 8. Conclusion

```
B12_CONTENT_CONTAMINATION = CLEAN
B12_DISTINCTIVE_COPY_HITS = 0
CONFIRMED_B12_CONTENT_CONTAMINATION = 0
```

ARGOS did **not** adopt B12 marketing copy, claims, legal placeholders, or SEO text. Shared elements are **business facts** (6 services, 5 phases) and **permitted visual patterns**.

---

## 9. INTERNAL ARGOS DRIFT — REQUIRES SEPARATE RESOLUTION

These issues are **independent of B12**. Do not resolve automatically in a visual refactor.

### A) Hero slogan vs OpenGraph (`layout.tsx`)

| Surface | Current value | Historical source |
|---------|---------------|-------------------|
| `es.json` → `home.title` | `Tecnología serena para empresas que avanzan` | Uncommitted Quiet Authority direction |
| `es.json` → `meta.homeTitle` | `ARGOS-IT \| Tecnología serena para empresas que avanzan` | Same |
| `layout.tsx` → `openGraph.title` | `ARGOS-IT \| Tecnología que protege, acompaña y simplifica` | Git `61f1df5` / `wordpress-export` |
| `layout.tsx` → `description` | `Tecnología que protege, acompaña y simplifica: …` | Same historical slogan |

**`HERO_SLOGAN_DRIFT = YES`**

### B) `es.json` internal consistency

Hero and meta home fields were updated together in working tree, but **`layout.tsx` metadata was not updated** to match. Additional drift: `method.steps` uses **Guiar/Supervisar** while `services.*.process` arrays still use verb forms **Gestionar/Sostener**.

### C) Method phase naming drift

| Layer | G phase | S phase | Source |
|-------|---------|---------|--------|
| `method.steps` (i18n) | Guiar | Supervisar | Git `500ada7` |
| `methodArgosSteps.ts` | Guiar | Supervisar | Same |
| `services.*.process` (i18n) | Gestionar … | Sostener … | WordPress-era verb forms |
| `wordpress-export/metodo/` | Gestionar | Sostener | Historical ARGOS |

**`ARGOS_PHASE_NAMING_DRIFT = YES`** — No automatic decision on which term to eliminate.

### D) Logo asset missing in repository

Referenced paths:

- `/logo-argos-it.png` — `CorporateFooter.tsx`, `SiteFooter.tsx`
- `/logo-argos-it-header.png` — `CorporateHeader.tsx`, `ArgosExplainerAnimation.tsx`

**Not found** under `frontend/public/` or elsewhere in the audited workspace.

**`LOGO_ASSET_MISSING = YES`** — Do not generate substitute or placeholder.

---

## 10. Related artifacts

| Document | Purpose |
|----------|---------|
| `docs/audits/ARGOS_CONTENT_BASELINE.md` | Snapshot of current ARGOS content |
| `docs/audits/ARGOS_CONTENT_BASELINE.json` | Machine-readable baseline |
| `docs/design/ARGOS_CONTENT_FREEZE_POLICY.md` | Visual vs content change policy |

---

## 11. Stop gate

```
AUDIT_PERSISTED = YES
WEBSITE_CODE_MODIFIED = 0
READY_FOR_CONTENT_RECONCILIATION = YES
READY_FOR_VISUAL_REFACTOR = NO  (pending content reconciliation policy)
```
