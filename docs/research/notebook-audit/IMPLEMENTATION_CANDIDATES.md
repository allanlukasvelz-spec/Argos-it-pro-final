# IMPLEMENTATION CANDIDATES — Notebook Forensic Audit

**Audit date:** 2026-08-31  
**Authorization:** Documentation only — **NO implementation authorized**

Priority key:
- **P0** — High value + high confidence + clear placement
- **P1** — High value, small validation needed
- **P2** — Future interest
- **BLOCKED** — Requires evidence or human decision

---

## P0 — IC-001: Resolver contradicción método (4 vs 5 fases)

WHAT:
Decision record + content map linking notebook 4-phase philosophy to public 5-phase A.R.G.O.S. pages (or explicit deprecation of one model).

WHY:
Notebook and repo disagree (C-001). Publishing both without framing causes IA and copy drift.

EVIDENCE:
VK-001; `methodArgosSteps.ts`; WordPress export third variant.

CONFIDENCE:
HIGH (contradiction real)

WHERE_IT_FITS:
Método / Documentación / Content baseline

EXPECTED_VALUE:
9 — eliminates structural ambiguity

RISK:
Medium — wrong merge confuses clients

DEPENDENCIES:
Human owner decision (C-001)

CONTENT_CHANGE_REQUIRED:
YES (after decision)

CODE_CHANGE_REQUIRED:
Maybe (routes/slugs if model changes)

HUMAN_APPROVAL_REQUIRED:
YES

---

## P0 — IC-002: Unificar hero + OG slogan

WHAT:
Pick single public hero line; align `es.json`, `layout.tsx`, and any notebook-era slogan.

WHY:
Three concurrent messages (C-002): "Sistemas que no fallen…", "Tecnología serena…", "protege, acompaña y simplifica".

EVIDENCE:
VK-003; ARGOS_CONTENT_BASELINE drift flags.

CONFIDENCE:
HIGH

WHERE_IT_FITS:
Home / SEO

EXPECTED_VALUE:
8

RISK:
Low–medium brand inconsistency

DEPENDENCIES:
Content freeze policy exception

CONTENT_CHANGE_REQUIRED:
YES

CODE_CHANGE_REQUIRED:
YES (i18n + layout meta)

HUMAN_APPROVAL_REQUIRED:
YES

---

## P0 — IC-003: Continuidad copy — "copias ciegas" framing (sin Acronis)

WHAT:
Service/diagnostic copy using verified **copias ciegas** problem frame + diagnostic backup question — **without** naming Acronis until C-004 resolved.

WHY:
VK-006 STRONG; aligns with existing diagnostic Q3; high differentiation vs generic MSP copy.

EVIDENCE:
VK-006; `diagnosticQuestions.ts` id `backups`.

CONFIDENCE:
HIGH

WHERE_IT_FITS:
Servicio continuidad / HomeDiagnosisCard / `seguridad-informatica` or dedicated continuity section

EXPECTED_VALUE:
9

RISK:
Low if avoids guarantee language

DEPENDENCIES:
Legal review of claims

CONTENT_CHANGE_REQUIRED:
YES

CODE_CHANGE_REQUIRED:
NO

HUMAN_APPROVAL_REQUIRED:
YES (wording)

---

## P1 — IC-004: Mapa 4 pilares → 6 servicios

WHAT:
Internal mapping table: Infraestructura/Seguridad/Sistemas/Continuidad → six public slugs + method phases.

WHY:
Notebook strategic model (VK-002) vs commercial IA (C-003).

EVIDENCE:
VK-002; `services.ts`

CONFIDENCE:
MEDIUM-HIGH

WHERE_IT_FITS:
Servicios page architecture / sales enablement

EXPECTED_VALUE:
8

RISK:
Mis-mapping services

DEPENDENCIES:
IC-001 decision

CONTENT_CHANGE_REQUIRED:
Maybe

CODE_CHANGE_REQUIRED:
NO

HUMAN_APPROVAL_REQUIRED:
YES

---

## P1 — IC-005: Infraestructura three-pillar copy (estabilidad, cobertura, rendimiento)

WHAT:
Structured copy block for infrastructure/consulting pages using VK-007 framing.

WHY:
Concrete, non-absolute service vocabulary from primary notebook docs.

EVIDENCE:
VK-007

CONFIDENCE:
MEDIUM-HIGH

WHERE_IT_FITS:
`servicios/consultoria-it` or method `ordenamos` equivalent

EXPECTED_VALUE:
7

RISK:
Low

DEPENDENCIES:
Tone guide / content freeze

CONTENT_CHANGE_REQUIRED:
YES

CODE_CHANGE_REQUIRED:
NO

HUMAN_APPROVAL_REQUIRED:
YES

---

## P1 — IC-006: Mascot canonical brief (roles only)

WHAT:
Short internal doc: Dumbo=guía, Chico=protección; asset list; explicit **no** Disney origin.

WHY:
Notebook lacks origin (C-006); prevents future contamination from web search in NotebookLM.

EVIDENCE:
VK-012; rejected Disney sources

CONFIDENCE:
HIGH for roles; NONE for origin

WHERE_IT_FITS:
Mascotas / explainer / AI chat system prompts

EXPECTED_VALUE:
7

RISK:
Low

DEPENDENCIES:
Owner input for origin if desired

CONTENT_CHANGE_REQUIRED:
YES (internal)

CODE_CHANGE_REQUIRED:
NO

HUMAN_APPROVAL_REQUIRED:
YES

---

## P2 — IC-007: Open primary markdown sources offline

WHAT:
Owner exports S-01, S-03, S-05 from NotebookLM; store as TIER_A snapshots in `docs/research/` (if license permits).

WHY:
Current audit relied on chat citations; verbatim primary text not captured.

EVIDENCE:
SOURCE_INVENTORY access limitations

CONFIDENCE:
N/A (process improvement)

WHERE_IT_FITS:
Research vault

EXPECTED_VALUE:
8 (future audits)

RISK:
None

DEPENDENCIES:
Manual export by owner

CONTENT_CHANGE_REQUIRED:
NO

CODE_CHANGE_REQUIRED:
NO

HUMAN_APPROVAL_REQUIRED:
YES

---

## P2 — IC-008: Compare notebook cuestionario vs diagnosticQuestions.ts

WHAT:
Diff Studio "Argos-IT Cuestionario" against 12 repo questions for gap analysis.

WHY:
Potential diagnostic insight; not verified this session.

EVIDENCE:
Studio title only; repo has 12 Q

CONFIDENCE:
LOW until artifact opened

WHERE_IT_FITS:
Diagnóstico

EXPECTED_VALUE:
7

RISK:
Low

DEPENDENCIES:
IC-007 or Studio open

CONTENT_CHANGE_REQUIRED:
Maybe

CODE_CHANGE_REQUIRED:
Maybe

HUMAN_APPROVAL_REQUIRED:
YES

---

## BLOCKED — IC-009: Public Acronis claims

WHAT:
Any web copy stating ARGOS uses Acronis, verified backups, immediate recovery, or operational guarantees.

WHY:
C-004 BLOCKED — TIER_D only; HIGH_RISK; 0 repo evidence.

EVIDENCE:
REJECTED_SOURCES Acronis section

CONFIDENCE:
N/A (blocked)

WHERE_IT_FITS:
Continuidad service

EXPECTED_VALUE:
Would be 9 **if** verified

RISK:
Legal/reputational if false

DEPENDENCIES:
Ops confirmation: product, contract, restore runbooks, test evidence

CONTENT_CHANGE_REQUIRED:
YES (if unblocked)

CODE_CHANGE_REQUIRED:
NO

HUMAN_APPROVAL_REQUIRED:
YES

---

## BLOCKED — IC-010: Publish 4-phase method as primary public IA

WHAT:
Replace 5-phase A.R.G.O.S. routes with 4-phase Analizamos/Ordenamos/Protegemos/Acompañamos.

WHY:
Conflicts with canonical repo and content freeze baseline.

EVIDENCE:
C-001

CONFIDENCE:
HIGH that change would be disruptive

WHERE_IT_FITS:
/metodo/*

EXPECTED_VALUE:
Uncertain

RISK:
High SEO/URL breakage

DEPENDENCIES:
IC-001 strategic decision

CONTENT_CHANGE_REQUIRED:
YES

CODE_CHANGE_REQUIRED:
YES

HUMAN_APPROVAL_REQUIRED:
YES

---

## Shortlist summary

| Priority | Count | IDs |
|----------|------:|-----|
| P0 | 3 | IC-001, IC-002, IC-003 |
| P1 | 3 | IC-004, IC-005, IC-006 |
| P2 | 2 | IC-007, IC-008 |
| BLOCKED | 2 | IC-009, IC-010 |

**Do not implement** until human review of this audit.
