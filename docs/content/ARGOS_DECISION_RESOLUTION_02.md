# ARGOS Decision Resolution 02

**Date:** 2026-08-31
**Mode:** ANALYSIS_ONLY — no implementation
**Owner inputs applied:**

| ID | Direction |
|----|-----------|
| C-001 | APPROVE_WITH_CONDITION → dual layer + mapping doc |
| C-002 | DEFER → hero comparison for final human choice |
| C-003 | APPROVE_WITH_CONDITION → four pillars over six services + mapping doc |
| C-004 | BLOCKED — no public Acronis |
| C-006 | APPROVED_ROLES_ONLY — Dumbo guía, Chico protege |

**Deliverables this mission:**

- `docs/content/ARGOS_METHOD_MAPPING_4_TO_5.md`
- `docs/content/ARGOS_SERVICE_ARCHITECTURE_MAPPING.md`
- `docs/content/ARGOS_DECISION_RESOLUTION_02.md` (this file)

---

# DECISION 1 — METHOD

## Options evaluated

| Option | Summary |
|--------|---------|
| **A** | 5-phase A.R.G.O.S. only (status quo) |
| **B** | 4-phase only (replace routes) |
| **C** | Dual layer: 4 public philosophy + 5 operational (owner-approved with condition) |

## OPTION — C (Dual layer, conditional)

### EVIDENCE

| Source | Finding |
|--------|---------|
| VK-001 | 4 phases STRONG in notebook S-03 |
| TIER_A | 5 phases in `methodArgosSteps.ts`, `es.json`, `/metodo/*` |
| Mapping doc | ANALIZAMOS→Analizar **NATURAL**; 0 FORCED pairs; 3 NATURAL anchors |
| WP export | Third compression exists (Gestionar/Sostener); repo already evolved labels |
| IC-010 | Replacing 5 with 4 = high breakage — rejected |

### BENEFIT

- Preserves URLs, tests, phase depth, diagnostic CTAs on Analizar
- Uses notebook strategic language without deleting A.R.G.O.S.
- Bridge copy resolves C-001 without rewriting operational history

### COST

- Team must maintain mapping + bridge copy
- Sales must not imply 1:1 equivalence
- Ordenamos↔Guiar label gap needs one sentence explanation

### RISK

| Risk | Mitigation |
|------|------------|
| Two methods perceived | Mandatory bridge paragraph (in mapping doc) |
| Ordenamos ≠ Guiar | Say "orden del entorno + orden del trabajo" |
| Protegemos without letter P | Explain Protegemos deploys as Reforzar (+ ongoing Supervisar) |

### RECOMMENDATION

**Proceed with Option C** — owner condition **met** by `ARGOS_METHOD_MAPPING_4_TO_5.md`.
Do **not** publish dual layer without bridge copy.
Do **not** replace 5-phase IA (Option B).

---

# DECISION 2 — SERVICES

## Options evaluated

| Option | Summary |
|--------|---------|
| **A** | Six services only |
| **B** | Four pillars replace six services |
| **C** | Four pillars (L1) over six services (L2) — owner-approved with condition |

## OPTION — C (Four over six, conditional)

### EVIDENCE

| Source | Finding |
|--------|---------|
| VK-002 | Four pillars STRONG (S-01) |
| TIER_A | Six slugs in `services.ts` + full copy in `es.json` |
| Mapping doc | All six mapped; 3 CROSS_CUTTING; 0 orphan pillars |
| Architectural test | Pillar vs SKU question **holds** with cross-cutting honesty |

### BENEFIT

- Strategic narrative (ecosystem interconectado — VK-002) without retiring SKUs
- WP-aligned service names preserved
- consultoria-it correctly framed as entry, not "networks only"

### COST

- `/servicios` needs intro block (content only — not authorized here)
- Cross-cutting services need footnote or icon, not forced single pillar badge

### RISK

| Risk | Mitigation |
|------|------------|
| web-wordpress under Sistemas surprises marketers | LEVEL 2 card still says "Web y presencia digital" |
| consultoria-it looks infra-only | Copy: "ordenar infraestructura, riesgos, soporte, web…" (existing) |
| Fifth pillar temptation for IA/Web | **Reject** — use CROSS_CUTTING flag |

### RECOMMENDATION

**Proceed with Option C** — owner condition **met** by `ARGOS_SERVICE_ARCHITECTURE_MAPPING.md`.
Owner should confirm PRIMARY for `web-wordpress` = Sistemas (recommended) vs alternative Infraestructura-primary framing.

---

# DECISION 3 — HERO

**Owner status:** C-002 **DEFER** — this section provides three complete finalists for final language comparison. **No automatic selection.**

---

## Claim safety key

| Tag | Meaning |
|-----|---------|
| VERIFIED | Direct from TIER_A/B audit corpus |
| SUPPORTED | Paraphrase of verified material |
| INFERENCE | Logical but not verbatim — excluded from recommended copy |
| UNVERIFIED | Not used in any hero below |

**HERO_UNVERIFIED_CLAIMS = 0** in all three systems.

Rejected patterns: guaranteed uptime, never fails, 24/7, guaranteed recovery, total protection, Acronis, zero incidents.

---

## HERO A — OPERATIONAL

**Intent:** Test notebook slogan seriously without uptime guarantee.

| Field | Copy | Claim tag |
|-------|------|-----------|
| **EYEBROW** | Consultoría informática para empresas que dependen de su tecnología | SUPPORTED (`es.json` home.eyebrow variant) |
| **H1** | Sistemas que no fallen cuando no deben | SUPPORTED (VK-003 historical — **headline risk**) |
| **SUPPORTING_COPY** | No hablamos de cero incidencias. Revisamos contigo qué es crítico, qué depende de qué, y si tus copias se pueden restaurar de verdad — antes de que una urgencia pare el negocio. | SUPPORTED (VK-005 reactive→proactive; VK-006 copias ciegas; `methodArgosSteps` Analizar; diagnostic Q backups) |
| **PRIMARY_CTA** | Iniciar diagnóstico ARGOS | VERIFIED (`nav.startDiagnostic`, Analizar primaryCta) |
| **SECONDARY_CTA** | Solicitar consulta | VERIFIED (`actions.requestConsultation`) |
| **PROOF_LINE** | Telemático · telefónico · presencial | VERIFIED (`home.proofTags[0]`) |

**Human test:** Professional would say supporting copy; H1 alone is the line they'd hedge in conversation.

**Diagnostic CTA rationale:** Primary = understand before selling (Analizar + diagnostic engine). **Strongest fit for this hero.**

### HERO A — Scores (1–10)

| Criterion | Score | Note |
|-----------|------:|------|
| TRUTH | 6 | H1 implies control ARGOS cannot fully guarantee |
| CLARITY | 8 | Supporting copy clarifies H1 |
| HUMANITY | 7 | Direct, slightly slogan-led |
| SPECIFICITY | 9 | Copias, urgencia, dependencias |
| MEMORABILITY | 10 | VK-003 line is sticky |
| ARGOS_FIT | 9 | Matches notebook + method |
| DIFFERENTIATION | 9 | Rare among generic IT |
| OVERPROMISE_SAFETY | 5 | H1 remains risky even with disclaimer |
| **TOTAL** | **63/80** | |

---

## HERO B — HUMAN

**Intent:** Strongest human-centered system from verified evidence — uncertainty, urgency, clarity before change.

| Field | Copy | Claim tag |
|-------|------|-----------|
| **EYEBROW** | *(none — optional silence reduces marketing noise)* | — |
| **H1** | Primero entendemos cómo está tu operación. Después decidimos qué tocar. | SUPPORTED (`methodArgosSteps` Analizar h1 "Analizar antes de decidir"; VK-005) |
| **SUPPORTING_COPY** | Si solo actúas cuando algo se rompe, decides a ciegas. ARGOS revisa contigo sistemas, accesos, copias y dependencias para que sepas qué es frágil, qué puede esperar y qué conviene reforzar primero. | SUPPORTED (VK-006; diagnostic questions; Analizar meaning; `es.json` home.subtitle themes) |
| **PRIMARY_CTA** | Iniciar diagnóstico ARGOS | VERIFIED |
| **SECONDARY_CTA** | Ver servicios | VERIFIED (`actions.viewServices`) |
| **PROOF_LINE** | 12 preguntas · sin obligarte a contratar | SUPPORTED (12 questions `diagnosticQuestions.ts`; diagnostic as assessment not trap) |

**Human test:** Pass — mirrors how a senior consultant sets engagement rules.

**Diagnostic CTA rationale:** Primary — embodiment of "understand before selling." Diagnostic positioned as **claridad**, not lead gimmick.

### HERO B — Scores (1–10)

| Criterion | Score | Note |
|-----------|------:|------|
| TRUTH | 9 | No absolute promises |
| CLARITY | 9 | Two-sentence logic is explicit |
| HUMANITY | 10 | Speaks to owner experience |
| SPECIFICITY | 8 | Named domains; could name fewer for brevity |
| MEMORABILITY | 7 | Less punchy than slogan |
| ARGOS_FIT | 10 | Analizar + diagnostic native |
| DIFFERENTIATION | 8 | "Understand first" less unique than slogan |
| OVERPROMISE_SAFETY | 9 | Safe |
| **TOTAL** | **70/80** | |

---

## HERO C — QUIET AUTHORITY

**Intent:** Evaluate and complete current "Tecnología serena" direction without lifestyle abstraction.

| Field | Copy | Claim tag |
|-------|------|-----------|
| **EYEBROW** | Consultoría informática premium para empresas y profesionales | VERIFIED (`home.eyebrow`) |
| **H1** | Tecnología serena para empresas que avanzan | VERIFIED (`home.title`) |
| **SUPPORTING_COPY** | Menos complejidad e incertidumbre en soporte, seguridad, web e IA. Ordenamos prioridades, reforzamos lo frágil y acompañamos después — con criterio externo, sin añadir ruido a tu día a día. | SUPPORTED (`home.subtitle`; `meta.homeDescription`; dual-layer verbs as SUPPORTED paraphrase of VK-001 + method — **not claiming dual layer is live in UI**) |
| **PRIMARY_CTA** | Solicitar consulta | VERIFIED |
| **SECONDARY_CTA** | Iniciar diagnóstico ARGOS | VERIFIED |
| **PROOF_LINE** | Soporte IT con criterio de negocio | VERIFIED (`home.proofTags[1]`) |

**Human test:** Pass for supporting copy; H1 is calmer than daily speech — acceptable for Quiet Authority if completed by concrete supporting line.

**Diagnostic CTA rationale:** Secondary — tone leads with relationship ("consulta"); diagnostic remains available for self-qualification. **Weaker on "understand before selling" as primary motion.**

### HERO C — Scores (1–10)

| Criterion | Score | Note |
|-----------|------:|------|
| TRUTH | 8 | Serene is subjective but not false |
| CLARITY | 8 | Supporting copy adds concreteness |
| HUMANITY | 8 | Warm but more brand-shaped |
| SPECIFICITY | 7 | Improved vs current subtitle-only |
| MEMORABILITY | 7 | "Serena" less distinct competitively |
| ARGOS_FIT | 8 | Matches Visual Adoption worktree |
| DIFFERENTIATION | 6 | Calm-tech tone used elsewhere in market |
| OVERPROMISE_SAFETY | 9 | Safe |
| **TOTAL** | **61/80** | |

---

## Hero comparison (tradeoffs — no mechanical winner)

| Dimension | A Operational | B Human | C Quiet Authority |
|-----------|--------------|---------|-------------------|
| Memorability | Highest | Medium | Medium |
| Overpromise safety | Lowest | Highest | High |
| Diagnostic-as-primary | Yes | Yes | No (consulta first) |
| OG alignment | Conflicts with serena | Neutral | Aligns with current `es.json` |
| Notebook continuity | Strongest | Medium | Weak |
| Quiet Authority visual fit | Medium | Medium | Strongest |

**Not highest total → automatic win:** Hero A leads memorability but loses on OVERPROMISE_SAFETY and TRUTH.

---

## HERO recommendation (analysis — owner DEFERRED)

| Path | When to choose |
|------|----------------|
| **A** | Owner accepts legal/brand review on H1 + keeps disclaimer prominent |
| **B** | Owner prioritizes diagnostic-led acquisition and safest claims |
| **C** | Owner commits to Quiet Authority visual + consulta-led tone |
| **HYBRID** | **Suggested for deferral resolution:** C eyebrow + B H1 + B supporting (or A proof line as tag, not H1) |

**HERO_RECOMMENDATION = HUMAN_DECISION_REQUIRED** (owner deferred C-002)

If forced to narrow before owner session: **HYBRID leaning B** (best balance TRUTH + diagnostic primary + ARGOS_FIT).

---

## Diagnostic primary CTA (cross-hero)

| Question | Answer |
|----------|--------|
| Is "Iniciar diagnóstico ARGOS" the strongest primary CTA? | **YES** for Heroes A and B — aligns with Analizar, 12 questions, "understand before selling" |
| When is "Solicitar consulta" primary? | Relationship-first positioning (Hero C) — valid but **secondary diagnostic priority** |
| **DIAGNOSTIC_PRIMARY_CTA** | **HUMAN_DECISION_REQUIRED** (depends on hero choice) |

---

## Mascots and Hero

| Question | Answer |
|----------|--------|
| Mascots in Hero? | **No** — C-006 roles only; no origin story |
| Post-hero intervention? | Optional: existing explainer below fold (`home.explainer` — Dumbo guía, Chico protege) already implements roles |
| **MASCOT_HERO_INTERVENTION** | **NONE** |

---

# Acronis (C-004)

**ACRONIS_PUBLIC_CLAIMS = 0** in all hero copy and mappings.
Continuity language uses **copias verificadas / copias ciegas** (VK-006) only.

---

# Final stop gate

```
METHOD_4_TO_5_MAPPING = PARTIAL
DUAL_LAYER_VALID = YES
METHOD_FORCED_RELATIONSHIPS = 0

SERVICE_4_TO_6_MAPPING = VALID
FOUR_OVER_SIX_VALID = YES
CROSS_CUTTING_SERVICES = consultoria-it, web-wordpress, automatizacion-ia

HERO_A_SCORE = 63/80
HERO_B_SCORE = 70/80
HERO_C_SCORE = 61/80

HERO_RECOMMENDATION = HUMAN_DECISION_REQUIRED
  (analysis narrow: HYBRID leaning B if owner wants recommendation input)

HERO_UNVERIFIED_CLAIMS = 0

DIAGNOSTIC_PRIMARY_CTA = HUMAN_DECISION_REQUIRED
  (YES for A/B; NO as primary for C)

MASCOT_HERO_INTERVENTION = NONE

ACRONIS_PUBLIC_CLAIMS = 0

FILES_CREATED_THIS_MISSION = 3
WEBSITE_FILES_MODIFIED = 0
PREEXISTING_CHANGES_TOUCHED = 0

READY_FOR_OWNER_FINAL_DECISION = YES
READY_FOR_CONTENT_FREEZE = NO
READY_FOR_VISUAL_REFACTOR = NO
```

---

# Owner next actions (checklist)

1. **Sign** method mapping (`ARGOS_METHOD_MAPPING_4_TO_5.md`) or edit Ordenamos↔Guiar bridge.
2. **Sign** service mapping — confirm `web-wordpress` PRIMARY = Sistemas.
3. **Choose** Hero A, B, C, or HYBRID — resolve OG (`layout.tsx`) when H1 frozen (C-002).
4. **Keep** Acronis BLOCKED until ops evidence (unchanged).
5. **Keep** mascots roles-only; no backstory doc unless owner authors (optional).

**CONTENT_CHANGE_AUTHORIZED = ANALYSIS_ONLY**
**READY_FOR_IMPLEMENTATION = NO**
