# ARGOS Method Mapping — 4 Public → 5 Operational

**Resolution:** Decision Resolution 02 (analysis only)
**Date:** 2026-08-31
**Owner direction:** C-001 = APPROVE_WITH_CONDITION (dual layer; no implementation until this mapping exists)
**Authority:** TIER_A = `methodArgosSteps.ts`, `es.json`; TIER_B = VK-001 (S-03 notebook)

---

## Verified labels (do not paraphrase)

### Public philosophy (notebook — VK-001)

| # | Label | Purpose (verified) |
|---|--------|-------------------|
| 01 | **Analizamos** | Estudiar entorno y mapear dependencias reales del negocio **antes** de cambios técnicos |
| 02 | **Ordenamos** | Limpiar acumulación de decisiones inconexas; aportar claridad al entorno heredado |
| 03 | **Protegemos** | Blindaje estructural de la base operativa; copias verificadas (vendor-neutral in public copy) |
| 04 | **Acompañamos** | Vigilancia continua de servidores/puestos; control operativo (sin absolutos 24/7) |

### Operational A.R.G.O.S. (repository — TIER_A)

| Letter | Label | Slug | Purpose (from `methodArgosSteps.ts` + `es.json` method.steps) |
|--------|--------|------|------------------------------------------------------------------|
| A | **Analizar** | `analizar` | Entender estado real antes de presupuesto, proveedores o cambios; diagnóstico como puerta natural |
| R | **Reforzar** | `reforzar` | Cerrar brechas de seguridad, estabilidad, gobierno de accesos, copias verificables |
| G | **Guiar** | `guiar` | Convertir complejidad operativa en claridad: solicitudes, prioridades, trazabilidad |
| O | **Optimizar** | `optimizar` | Mejorar rendimiento, captación, automatización con criterio de negocio |
| S | **Supervisar** | `supervisar` | Acompañamiento tras la mejora: revisiones, señales tempranas, prevención organizada |

### Historical third model (reference only — not runtime)

WordPress export: **Analizar, Reforzar, Gestionar, Optimizar, Sostener** (`wordpress-export/metodo/`).
Copy compression: *"Analizamos, reforzamos y acompañamos"* (`wordpress-export/index.html`).
Repo renamed **Gestionar → Guiar**, **Sostener → Supervisar** (baseline INTERNAL_DRIFT note).

**Implication:** Notebook **Ordenamos** is semantically closer to historical **Gestionar** than to the current label **Guiar**, though repo **Guiar** content covers much of that territory.

---

## Architecture model (non-equivalence)

```
PUBLIC PHILOSOPHY (4)          OPERATIONAL CAPABILITIES (5)
─────────────────────          ────────────────────────────
01 Analizamos          ───────► Analizar (primary)
                       ─ ─ ─ ─ ► Reforzar (scoping only) [PARTIAL]

02 Ordenamos           ───────► Guiar (primary)
                       ─ ─ ─ ─ ► Reforzar (config cleanup) [PARTIAL]
                       ─ ─ ─ ─ ► Analizar (documentation) [PARTIAL]

03 Protegemos          ───────► Reforzar (primary)
                       ─ ─ ─ ─ ► (Seguridad pillar language) [PARTIAL]

04 Acompañamos         ───────► Supervisar (primary)
                       ─ ─ ─ ─ ► Guiar (ongoing governance) [PARTIAL]
                       ─ ─ ─ ─ ► Optimizar (incremental) [PARTIAL]
```

One public phase **contains** multiple operational phases.
One operational phase **may contribute** to multiple public phases.
**No 1:1 claim is valid.**

---

## Critical test: ANALIZAMOS → Analizar

| Criterion | Assessment |
|-----------|------------|
| Lexical | Same root (*analiz-*); notebook 1st-person plural present vs repo infinitive — **grammatical variant, not semantic fork** |
| Purpose overlap | Both: facts before decisions; dependencies; avoid improvisation (VK-001 + `methodArgosSteps` meaning Analizar) |
| Diagnostic link | Repo: "El diagnóstico ARGOS es la puerta natural a esta fase" — **SOURCE_AND_REPO** |
| Exclusivity | Analizar does not include full Ordenamos/Protegemos scope |

**Verdict: NATURAL — direct relationship.**
Strongest link in the entire map. Safe to say publicly: *"Analizamos en la práctica comienza con la fase Analizar del método ARGOS."*

---

## Where R, G, O, S belong (no forcing)

| Operational | Primary public home | Secondary public | Relationship | Notes |
|-------------|--------------------|--------------------|--------------|-------|
| **Reforzar** | **03 Protegemos** | 01 Analizamos (identify gaps) | **NATURAL** / PARTIAL | Repo Reforzar = permisos, copias, configuraciones — matches notebook Protegemos except Acronis vendor claims (BLOCKED) |
| **Guiar** | **02 Ordenamos** | 04 Acompañamos | **PARTIAL** / PARTIAL | Guiar = operational order (requests, priorities). Ordenamos also implies **technical** cleanup of legacy — partly Reforzar, partly Analizar deliverables |
| **Optimizar** | **04 Acompañamos** | 02 Ordenamos | **PARTIAL** | Optimizar = deliberate improvement waves; Acompañamos = ongoing rhythm. Optimizar is not " accompaniment" alone — it is **evolution inside** accompaniment |
| **Supervisar** | **04 Acompañamos** | — | **NATURAL** | Repo Supervisar explicitly: revisiones, prevención, vigilancia prudente — maps to notebook Acompañamos (VK-001, VK-009) |

---

## Required mapping table

| PUBLIC_PHASE | PUBLIC_PURPOSE | OPERATIONAL_PHASE | OPERATIONAL_PURPOSE | RELATIONSHIP | EVIDENCE | SEMANTIC_GAP | RISK | CONFIDENCE |
|--------------|----------------|-------------------|---------------------|--------------|----------|--------------|------|------------|
| 01 Analizamos | Mapear dependencias reales antes de actuar | **Analizar** | Fotografía de riesgos, dependencias, prioridades | **NATURAL** | VK-001; S-03; `methodArgosSteps` Analizar meaning; WP `analizar.html` | None material | Low | **HIGH** |
| 01 Analizamos | (same) | Reforzar | Identificar brechas a cerrar en fase siguiente | **PARTIAL** | Analizar `results` → "Contexto listo para encajar Reforzar" | Reforzar **executes** protection; Analizamos only **surfaces** need | Low | MEDIUM |
| 02 Ordenamos | Claridad frente al caos heredado | **Guiar** | Gobierno liviano: solicitudes, prioridades, trazabilidad | **PARTIAL** | VK-001 Ordenamos; VK-007 "orden como cimiento"; `methodArgosSteps` Guiar; WP **Gestionar** ≈ order | Ordenamos includes **technical sanitization**; Guiar emphasizes **operating model** | Medium — label "Guiar" ≠ "Ordenamos" without bridge copy | MEDIUM |
| 02 Ordenamos | (same) | Reforzar | Limpiar configuraciones heredadas | **PARTIAL** | VK-007; Reforzar "configuraciones heredadas" | Reforzar also **protects**, not only orders | Medium | MEDIUM |
| 02 Ordenamos | (same) | Analizar | Inventario y documentación como base del orden | **PARTIAL** | Analizar `argosActions` inventario | Analysis alone does not **produce** order | Low | MEDIUM |
| 03 Protegemos | Blindaje estructural; copias verificadas | **Reforzar** | Endurecer accesos, copias comprobadas, configuración | **NATURAL** | VK-001; S-03 chat [25–26]; `methodArgosSteps` Reforzar; `es.json` R step | Notebook bundles **continuity narrative**; repo splits backup hardening (R) vs ongoing supervision (S) | Low–medium | **HIGH** |
| 03 Protegemos | (same) | — | (No separate operational "Proteger" letter) | **UNSUPPORTED** | — | Public verb **Protegemos** ≠ letter P in A.R.G.O.S. — must explain, not rename | Medium if audience expects 4 letters | MEDIUM |
| 04 Acompañamos | Vigilancia continua; fin del modelo reactivo | **Supervisar** | Revisiones, señales tempranas, hábito de prevención | **NATURAL** | VK-001; VK-009; `methodArgosSteps` Supervisar; WP **Sostener** lineage | WP "Sostener" ≈ Supervisar; notebook "Acompañamos" is broader label | Low | **HIGH** |
| 04 Acompañamos | (same) | Guiar | Sostener canal y prioridades en el día a día | **PARTIAL** | Guiar FAQ links to Supervisar; Acompañamos in WP copy | Guiar is not only post-project | Low | MEDIUM |
| 04 Acompañamos | (same) | Optimizar | Mejoras incrementales sin volver al caos | **PARTIAL** | Optimizar handoff → Supervisar; notebook "vigilancia proactiva" | Optimizar is **project-shaped**; Acompañamos is **rhythm-shaped** | Medium | MEDIUM |

---

## Relationship summary counts

| Type | Count (phase-pairs) |
|------|---------------------:|
| NATURAL | 3 |
| PARTIAL | 6 |
| FORCED | 0 |
| CONTRADICTORY | 0 |
| UNSUPPORTED | 1 (expecting letter "P" for Protegemos) |

**METHOD_FORCED_RELATIONSHIPS = 0**
(Ordenamos→Guiar is **PARTIAL**, not FORCED, if bridge copy explains "orden técnico + orden operativo.")

---

## Failure condition evaluation

| Test | Result |
|------|--------|
| Does dual layer rewrite A.R.G.O.S. meaning? | **No** — five phases remain canonical in routes and `methodArgosSteps.ts` |
| Does mapping require renaming A.R.G.O.S. letters? | **No** |
| Does mapping require semantic manipulation? | **Partial** — only if marketed as 1:1 equivalence |
| Does 4-phase model contradict 5-phase sequence order? | **No** — public model is compressive summary, not alternate sequence |

---

## Recommended public bridge copy (analysis only — not implemented)

> **Cuatro movimientos, cinco fases.** Resumimos nuestro trabajo en Analizamos, Ordenamos, Protegemos y Acompañamos. El detalle operativo vive en el método ARGOS: Analizar, Reforzar, Guiar, Optimizar y Supervisar. No son dos métodos distintos: es la misma lógica, con distinto nivel de detalle.

---

## Stop-gate (method)

| Field | Value |
|-------|-------|
| **METHOD_4_TO_5_MAPPING** | **PARTIAL** (valid layered model; 3 NATURAL anchors; no 1:1) |
| **DUAL_LAYER_VALID** | **YES** — conditional on bridge copy above; not on equivalence |
| **METHOD_FORCED_RELATIONSHIPS** | **0** |
| **Authoritative operational model** | **5-phase A.R.G.O.S.** (TIER_A unchanged) |
| **Authoritative public summary** | **4-phase notebook** (TIER_B — requires bridge) |

**Implementation blocked** until owner signs this mapping or edits gaps (especially Ordenamos ↔ Guiar label).
