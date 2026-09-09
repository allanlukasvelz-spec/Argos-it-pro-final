# CONTRADICTIONS — Notebook Forensic Audit

**Audit date:** 2026-08-31  
**Rule:** No silent resolution. Human decision required where noted.

---

## C-001 — Método: 4 fases vs 5 fases A.R.G.O.S.

CONTRADICTION_ID:
C-001

CLAIM_A:
Método de **4 fases**: Analizamos → Ordenamos → Protegemos → Acompañamos

SOURCE_A:
Notebook S-03 El Método Argos-IT; chat Servicios Principales [19–27]

CLAIM_B:
Método de **5 fases**: Analizar → Reforzar → Guiar → Optimizar → Supervisar (A.R.G.O.S.)

SOURCE_B:
`frontend/lib/methodArgosSteps.ts` (`METHOD_ARGOS_SLUGS`); `frontend/i18n/locales/es.json` methodTitle

CLAIM_C (historical):
WordPress export: **Gestionar / Sostener** variant; copy "Analizamos, reforzamos y acompañamos"

SOURCE_C:
`wordpress-export/metodo/index.html`, `wordpress-export/index.html`

AUTHORITY_A:
TIER_B_INTERNAL (notebook markdown, Apr 2026)

AUTHORITY_B:
TIER_A_PRIMARY (canonical Next.js implementation + i18n)

AUTHORITY_C:
TIER_A_PRIMARY (historical published site)

RECOMMENDED_RESOLUTION:
Document both models. **Do not auto-merge.** Notebook 4-phase maps to service *philosophy*; repo 5-phase is current public IA. Possible mapping hypothesis (REVIEW_REQUIRED, not verified): Analizamos≈Analizar+parte Reforzar; Ordenamos≈Guiar; Protegemos≈Reforzar+Seguridad; Acompañamos≈Optimizar+Supervisar.

HUMAN_DECISION_REQUIRED:
YES — Which model is authoritative for future copy: 4-phase portfolio, 5-phase A.R.G.O.S., or explicit dual-layer (philosophy vs method pages)?

---

## C-002 — Eslogan / hero message

CONTRADICTION_ID:
C-002

CLAIM_A:
**"Sistemas que no fallen cuando no deben"** (promesa central)

SOURCE_A:
Notebook S-05 Texto pegado; Studio infografías (TIER_D titles)

CLAIM_B:
**"Tecnología serena para empresas que avanzan"** (hero title)

SOURCE_B:
`frontend/i18n/locales/es.json` → `home.title`

CLAIM_C:
**"Tecnología que protege, acompaña y simplifica"** (OG/meta)

SOURCE_C:
`frontend/app/layout.tsx` (per ARGOS_CONTENT_BASELINE audit)

AUTHORITY_A:
TIER_B_INTERNAL (site code snapshot in notebook)

AUTHORITY_B:
TIER_A_PRIMARY (current i18n hero)

AUTHORITY_C:
TIER_A_PRIMARY (SEO hardcoded)

RECOMMENDED_RESOLUTION:
Treat A as **historical/alternate positioning** from site extract. B and C are active internal drift (documented in content baseline). Pick one hero + one OG line.

HUMAN_DECISION_REQUIRED:
YES

---

## C-003 — Taxonomía de servicios: 4 pilares vs 6 servicios

CONTRADICTION_ID:
C-003

CLAIM_A:
Cuatro pilares: Infraestructura, Seguridad, Sistemas, Continuidad

SOURCE_A:
Notebook S-01; chat Servicios Principales

CLAIM_B:
Seis servicios públicos: consultoría IT, mantenimiento, seguridad, web/WordPress, automatización IA, auditoría digital

SOURCE_B:
`frontend/lib/services.ts`; rutas `/servicios/[slug]`

AUTHORITY_A:
TIER_B_INTERNAL (strategic framing)

AUTHORITY_B:
TIER_A_PRIMARY (live IA)

RECOMMENDED_RESOLUTION:
Not necessarily mutually exclusive: pilares = **operating model**; slugs = **commercial offerings**. Mapping table needed before rewriting services page.

HUMAN_DECISION_REQUIRED:
YES — Publish 4-pillar narrative, keep 6 cards, or restructure?

---

## C-004 — Acronis: mencionado vs implementado

CONTRADICTION_ID:
C-004

CLAIM_A:
ARGOS utiliza Acronis para backups verificados y continuidad

SOURCE_A:
Notebook chat Continuidad; Studio notes "Estrategia … con Acronis" (TIER_D)

CLAIM_B:
No referencia a Acronis en código, i18n, backend, ni docs operativos del repo

SOURCE_B:
Grep repositorio `Argos-it-pro-final` (2026-08-31)

AUTHORITY_A:
TIER_D_DERIVED (high risk)

AUTHORITY_B:
TIER_A_PRIMARY (negative evidence)

RECOMMENDED_RESOLUTION:
**Do not publish Acronis as fact** until ops confirms product, licensing, and configured workflows. Separate ACRONIS_OFFICIAL_CAPABILITY from ARGOS_IMPLEMENTED.

HUMAN_DECISION_REQUIRED:
YES — Confirm vendor relationship off-repo.

---

## C-005 — Paleta visual: notebook extract vs design tokens actuales

CONTRADICTION_ID:
C-005

CLAIM_A:
#f6f4ef / #0b1830 / #13233e

SOURCE_A:
S-05 Texto pegado

CLAIM_B:
#f7f7f5 / #1f3a5f / #0b1320 (+ teal accent)

SOURCE_B:
`frontend/assets/css/argos-corporate.css`

AUTHORITY_A:
TIER_B_INTERNAL (historical code paste)

AUTHORITY_B:
TIER_A_PRIMARY (Visual Adoption 01 worktree)

RECOMMENDED_RESOLUTION:
Visual drift, not brand conflict. Notebook documents **earlier** React snapshot.

HUMAN_DECISION_REQUIRED:
NO (informational)

---

## C-006 — Mascotas: notebook ausente vs repo implementado

CONTRADICTION_ID:
C-006

CLAIM_A:
Documentos notebook **no contienen** historia de Chico/Dumbo

SOURCE_A:
Notebook chat 2026-04-23 (AI cites Sources 7, 8, 13, 14)

CLAIM_B:
Mascotas activas con roles, sprites, chat, explainer scenes

SOURCE_B:
Repo: `es.json`, `ClientAssistants.tsx`, `spriteManifest.ts`, `chicoTips.ts`

AUTHORITY_A:
TIER_B_INTERNAL (negative finding in notebook corpus)

AUTHORITY_B:
TIER_A_PRIMARY (implementation)

RECOMMENDED_RESOLUTION:
Origin story lives outside notebook (oral, design brief, or unpublished). Use repo for **roles**; do not import Disney/inferred lore.

HUMAN_DECISION_REQUIRED:
YES — Author canonical mascot backstory document?

---

## Summary

| CONTRADICTION_ID | Topic | HUMAN_DECISION_REQUIRED |
|------------------|-------|-------------------------|
| C-001 | 4 vs 5 method phases | YES |
| C-002 | Slogan / hero | YES |
| C-003 | 4 pillars vs 6 services | YES |
| C-004 | Acronis implementation | YES |
| C-005 | Color tokens | NO |
| C-006 | Mascot origin | YES |

**CONTRADICTIONS total:** 6
