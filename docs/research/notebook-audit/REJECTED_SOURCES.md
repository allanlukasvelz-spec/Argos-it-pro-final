# REJECTED SOURCES — Notebook Forensic Audit

**Audit date:** 2026-08-31

Each entry records why material was excluded from `VERIFIED_KNOWLEDGE.md`.

---

## Rejected notebook sources (18-source corpus)

### OTHER_ARGOS (4 active + 3 Fast Research pending)

| Source | ENTITY_MATCH | TIER | Reason |
|--------|--------------|------|--------|
| argOS Project (Inicio, Sobre argOS) | OTHER_ARGOS | TIER_F_REJECTED | LATAM ciberinteligencia OS; zero link to argos-it.com consultancy |
| CrowCypher Talks EP#1 ArgOS | OTHER_ARGOS | TIER_F_REJECTED | Same entity |
| Osint.com argOS article | OTHER_ARGOS | TIER_F_REJECTED | Same entity |
| Argos cement #ConoceTuIndustria | OTHER_ARGOS | TIER_F_REJECTED | Industrial cement brand |
| Hace 78 años nace el logo de Argos | OTHER_ARGOS | TIER_F_REJECTED | Unrelated brand history |

### UNRELATED (7)

| Source | ENTITY_MATCH | TIER | Reason |
|--------|--------------|------|--------|
| Calíope UFRJ revista | UNRELATED | TIER_F_REJECTED | Classical literature |
| Argostech GMAO | UNRELATED | TIER_F_REJECTED | Third-party maintenance SaaS |
| CÓMICS por personajes y series | UNRELATED | TIER_F_REJECTED | Generic comics index |
| Dumbo Wikipedia | UNRELATED | TIER_F_REJECTED | Disney character |
| Dumbo La Zona Veggie | UNRELATED | TIER_F_REJECTED | Fiction/media |
| Historia telecomunicaciones Wikipedia | UNRELATED | TIER_F_REJECTED | Generic reference |
| Tonadilla Performance book | UNRELATED | TIER_F_REJECTED | Academic unrelated |

---

## Rejected claims (from chat / Studio, not primary sources)

### Chico / Dumbo origin story

| Claim | Source | Reason |
|-------|--------|--------|
| Dumbo = Disney Jumbo Jr. 1941 | Wikipedia via web search | UNRELATED entity |
| Chico linked to revista "Chicos" or Ibáñez comics | AI inference | No ARGOS-IT link |
| Chico = mythological Argos dog / SVG eye mascot | AI inference from unrelated archaeology + site SVG | INFERRED; primary docs explicitly lack mascot history |
| PNG filenames prove official mascot lore | User chat attachment list | Asset names only; no narrative provenance |

**Notebook AI admission (chat, 2026-04-23):** Original notebook documents do **not** contain creation history of Argos-IT or meaning of Chico/Dumbo.

### Acronis as implemented ARGOS capability

| Claim | Source | Reason |
|-------|--------|--------|
| "Utilizamos tecnología de Acronis" | AI chat + Studio notes | TIER_D; no repo/backend evidence |
| "Garantizamos que puedas volver a operar" | AI-generated Continuidad copy | HIGH_RISK_CLAIM |
| "Recuperación inmediata" | Same | HIGH_RISK_CLAIM |
| "Certeza técnica de que tu negocio nunca se detendrá" | Same | HIGH_RISK_CLAIM |

Repo grep (`Acronis`): **0 matches** in application code, i18n, or docs (excluding this audit).

### Absolute / marketing absolutes (HIGH_RISK, rejected as facts)

- "Garantizar estabilidad" (infraestructura chat)
- "Supervisión ininterrumpida" (method chat)
- "Nunca se detendrá" (continuidad copy)
- "Recuperación garantizada" (Studio note title)

Retained only as **content drafts requiring human legal/ops review**, not verified capabilities.

### AI implementation plan (chat)

Full 4-week web rollout plan (React, argos-it.com launch, Acronis backups) = **TIER_D operational suggestion**, not evidence of completed work.

### Cross-contaminated Studio artifacts

| Artifact | Reason |
|----------|--------|
| Visiones de la literatura clásica | Built from 18 sources including Calíope |
| Literatura Mapa | Same contamination |

---

## Duplicate sources (not rejected, collapsed)

- S-01/S-02 Gestión Estratégica (duplicate markdown)
- S-03/S-04 Método Argos-IT (duplicate markdown)
- S-06 ×3 Notas 7/4/2026

Duplicates counted once in verified traceability.

---

## Statistics

| Category | Count |
|----------|------:|
| OTHER_ARGOS_REJECTED | 5 |
| UNRELATED_REJECTED | 7 |
| REJECTED_CLAIMS (inferred/high-risk) | 12+ |
| SECRETS_COPIED | 0 |
