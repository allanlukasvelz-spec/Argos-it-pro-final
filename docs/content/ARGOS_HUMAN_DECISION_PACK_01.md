# ARGOS Human Decision Pack 01

**Date:** 2026-08-31
**Mode:** Decision support only — **NO implementation**
**Inputs (exclusive):**

- `docs/research/notebook-audit/VERIFIED_KNOWLEDGE.md`
- `docs/research/notebook-audit/CONTRADICTIONS.md`
- `docs/research/notebook-audit/IMPLEMENTATION_CANDIDATES.md`
- `docs/research/notebook-audit/SOURCE_TRACEABILITY.json`
- `docs/audits/ARGOS_CONTENT_BASELINE.md`
- `docs/audits/ARGOS_CONTENT_BASELINE.json`

**Rule:** Options only. No automatic resolution where evidence is insufficient. No runtime or repo changes in this pack.

---

## How to use this document

For each conflict, choose **one option** (or mark **DEFER**). Record the owner decision in the margin or a follow-up `ARGOS_OWNER_DECISIONS_01.md` when ready. Implementation remains blocked until decisions are signed and content freeze exceptions are granted.

---

# C-001 — METHOD (4 fases vs 5 fases A.R.G.O.S.)

## 1. CURRENT STATE

| Layer | Model | Authority | Where it lives |
|-------|--------|-----------|----------------|
| Notebook (Apr 2026) | **4 fases:** Analizamos → Ordenamos → Protegemos → Acompañamos | TIER_B (S-03, VK-001) | Notebook internal docs |
| Repository (runtime) | **5 fases:** Analizar → Reforzar → Guiar → Optimizar → Supervisar (A.R.G.O.S.) | TIER_A | `methodArgosSteps.ts`, `es.json` methodTitle, `/metodo/[slug]` routes |
| WordPress export (historical) | Copy: "Analizamos, reforzamos y acompañamos"; older phase names Gestionar/Sostener | TIER_A reference | `wordpress-export/` |

Baseline status: 5-phase method is **CONSISTENT** internally (`ARGOS_CONTENT_BASELINE.md` §5). Services `process` arrays use **Gestionar/Sostener** — separate **INTERNAL_DRIFT** from method steps (Guiar/Supervisar).

---

## Options

### Option A — 5 fases A.R.G.O.S. as sole public method (status quo)

**What:** Keep `/metodo` and five detail pages as the only method narrative. Treat notebook 4-phase model as archival / non-public.

### Option B — 4 fases as sole public method (replace A.R.G.O.S.)

**What:** Replace routes, slugs, and copy with Analizamos / Ordenamos / Protegemos / Acompañamos. Deprecate five letter acronym IA.

### Option C — Dual layer: 4 fases (filosofía pública) + 5 fases (detalle operativo)

**What:** Publish 4 phases as **how ARGOS thinks** (home, sobre-argos-it, sales narrative). Keep 5 phases as **how ARGOS works in detail** (`/metodo/*` unchanged). Require explicit bridge copy: e.g. "Nuestro método se resume en cuatro movimientos; en la práctica se despliega en cinco fases A.R.G.O.S."

**Coexistence assessment (requested):**

| Question | Answer |
|----------|--------|
| Can they coexist without contradiction? | **Yes, if layered explicitly** — 4 = strategic cycle; 5 = operational granularity. |
| Is 1:1 mapping verified? | **No.** Audit hypothesis only (CONTRADICTIONS C-001): Analizamos≈Analizar+(parte Reforzar); Ordenamos≈Guiar; Protegemos≈Reforzar+Seguridad; Acompañamos≈Optimizar+Supervisar. **REVIEW_REQUIRED.** |
| Risk if published without bridge? | **High** — visitors see two "methods" and assume error or rebrand. |

---

## 2. EVIDENCE FOR OPTION A (5 fases only)

- TIER_A canonical implementation: `METHOD_ARGOS_SLUGS` in baseline; 5 detail pages with FAQ, CTAs, SEO (`methodArgosSteps.ts`).
- Content baseline: method overview **CONSISTENT** across i18n + TS.
- URLs, tests, and design freeze (21.7C wireframes) assume A.R.G.O.S. rail.
- WordPress lineage already moved toward Analizar/Reforzar vocabulary (export), not 4-phase notebook labels.
- IC-010 flags replacing 5 with 4 as **high SEO/URL breakage risk**.

## 3. EVIDENCE FOR OPTION B (4 fases only)

- VK-001 STRONG: notebook S-03 documents 4-phase sequence (STRONG, not verbatim opened).
- VK-005: proactive "control permanente" narrative aligns naturally with 4-phase portfolio docs.
- Notebook Studio artifacts (TIER_D index) consistently title around 4 movements.
- Simpler story for prospects allergic to acronyms.

## 4. EVIDENCE FOR OPTION C (dual layer)

- CONTRADICTIONS recommended resolution: "pilares = operating model" pattern (same logic applies to method).
- IC-001 P0: content map linking philosophy to detail — highest value without route destruction.
- VK-001 + VK-005 together: 4-phase = **positioning**; repo 5-phase = **delivery**.
- WordPress third variant (Analizamos/reforzamos/acompañamos) suggests historical **compression** already occurred — dual layer mirrors that compression vs expansion.
- **Insufficient evidence for exact mapping table** — coexistence is structurally plausible, not proven.

---

## 5. RISKS

| Option | Risk |
|--------|------|
| A | Notebook/strategic material unused publicly; owner may feel 4-phase work is "lost." |
| B | Broken URLs, redirect debt, E2E/visual tests, acronym brand equity loss; contradicts content freeze baseline. |
| C | Cognitive load; team must maintain mapping doc; sales must not improvise mapping. |

---

## 6. WHAT BREAKS IF CHANGED

| Option | Breakage |
|--------|----------|
| A | Nothing immediate (baseline preserved). |
| B | `/metodo/analizar`…`/supervisar` slugs, `methodArgosSteps.ts`, i18n `method.steps`, method rail UI, baseline JSON, possible SEO history. |
| C | Nothing structural if routes unchanged; **breaks** if bridge copy is vague (perceived contradiction). |

---

## 7. WHAT REMAINS COMPATIBLE

| Option | Compatible |
|--------|------------|
| A | All current repo content, diagnostic, services, mascots. |
| B | Philosophy (VK-005), diagnostic, services — after rewrite. |
| C | **All routes and phase pages**; 4-phase on home/about only; VK-005, VK-006, services architecture (see C-003). |

---

## 8. RECOMMENDED OPTION

**Option C — Dual layer**, with mandatory internal mapping document (IC-001) before any public copy references both models.

**Rationale:** Preserves TIER_A implementation while honoring STRONG notebook strategy (VK-001). Option B evidence is strong for *existence* of 4-phase model but weak for *replacing* live IA. Option A wastes verified notebook value. Coexistence is **conditionally safe**, not automatic.

---

## 9. CONFIDENCE

**MEDIUM-HIGH** for recommending dual layer as *structure*
**LOW** for any specific 4→5 phase mapping until S-03 exported verbatim (IC-007)

---

## 10. HUMAN_DECISION_REQUIRED

**YES** — Owner must confirm: A, B, C, or DEFER. If C: approve or edit mapping hypothesis before copy work.

---

## 11. IMPLEMENTATION IMPACT

| Option | Content | Code | Approval |
|--------|---------|------|----------|
| A | None | None | Content freeze unchanged |
| B | Full method rewrite | Routes, slugs, tests, i18n, methodArgosSteps | Freeze exception + IC-010 |
| C | Home/about/method intro copy + mapping doc | Minimal (optional intro section on `/metodo`) | Freeze exception for narrative layer only |

---

# C-002 — HERO / OG SLOGAN

## 1. CURRENT STATE

Three concurrent messages (CONTRADICTIONS C-002):

| ID | Text | Source | Baseline status |
|----|------|--------|-----------------|
| **A** | *Sistemas que no fallen cuando no deben* | Notebook S-05 (VK-003) | Not in current `es.json` |
| **B** | *Tecnología serena para empresas que avanzan* | `es.json` → `home.title` | INTERNAL_DRIFT (Quiet Authority, uncommitted) |
| **C** | *Tecnología que protege, acompaña y simplifica* | `layout.tsx` OG/meta | INTERNAL_DRIFT vs B |

Baseline JSON: `heroSloganDrift: true` (`ARGOS_CONTENT_BASELINE.json`).

---

## Options

### Option A — Notebook slogan as primary hero

Hero H1 = *Sistemas que no fallen cuando no deben*; subtitle/OG derived or aligned.

### Option B — Keep "Tecnología serena…" as hero (current i18n)

Align OG/Twitter/JSON-LD to B or a single derivative; retire A and C from public surfaces.

### Option C — Restore historical OG line as hero

Hero H1 = *Tecnología que protege, acompaña y simplifica* (matches WP export + `layout.tsx`); update `es.json` to match.

### Option D — Split roles (recommended pattern)

- **H1 (hero):** B or C (owner picks tone: serena vs protege/acompaña)
- **Proof line / eyebrow / diag card:** A as supporting tag (not H1) — *if* owner wants operational promise without replacing brand tone
- **OG/meta:** Must equal chosen public H1 or approved subtitle — **one canonical SEO line**

---

## 2. EVIDENCE FOR OPTION A

- VK-003 STRONG from S-05 site code snapshot; differentiated vs generic MSP ("no fallen cuando no deben").
- Notebook infographics (TIER_D) center this line.
- Aligns with VK-005 operational seriousness.

## 3. EVIDENCE FOR OPTION B

- TIER_A current `es.json` hero (worktree baseline).
- Quiet Authority visual direction adopted in Visual Adoption 01 — tone match.
- Less absolute than A (avoids implicit uptime guarantee).

## 4. EVIDENCE FOR OPTION C

- TIER_A `layout.tsx` OG — still live for social previews.
- WordPress export lineage (`ARGOS_CONTENT_BASELINE`: Git `61f1df5` / WP).
- Three verbs map to method/service themes (protege → Seguridad; acompaña → Acompañamos/Supervisar; simplifica → Ordenamos/Guiar).

*(Option D evidence: baseline drift flags require **unification**, not a third slogan — IC-002 P0.)*

---

## 5. RISKS

| Option | Risk |
|--------|------|
| A | HIGH_RISK if read as SLA/uptime guarantee; conflicts with serena brand work. |
| B | OG/social still wrong until fixed; A unused. |
| C | Rejects Quiet Authority hero; may feel less distinct. |
| D | Mis-tiering A as H1 anyway → same as Option A risk. |

---

## 6. WHAT BREAKS IF CHANGED

| Option | Breakage |
|--------|----------|
| A | Visual Adoption hero copy, baseline snapshot, possible legal review for "no fallen." |
| B | Requires `layout.tsx` + all locales meta sync. |
| C | Reverses uncommitted `es.json` hero; marketing materials with "serena." |
| D | Minimal if roles respected; breaks if A promoted to H1 without review. |

---

## 7. WHAT REMAINS COMPATIBLE

- All options: `home.subtitle`, proof tags, diagnostic CTAs, method pages.
- VK-005 philosophy compatible with B, C, or D (not dependent on A).
- Option D + B: strongest compatibility with current visual direction.

---

## 8. RECOMMENDED OPTION

**Option D with B as H1 and unified OG**

- **H1:** *Tecnología serena para empresas que avanzan* (current baseline intent)
- **OG/meta:** Align to B **or** to C — **owner must pick one**; audit recommends **C for OG** only if owner wants WP continuity, **B for OG** if single-line brand consistency matters more.

**Do not auto-select A as H1** — confidence MEDIUM on historical snapshot; HIGH_RISK as headline guarantee.

If owner prefers operational punch: A as **proof tag** or **method section kicker**, not hero/OG.

---

## 9. CONFIDENCE

**MEDIUM** — Three TIER_A/B sources conflict; no single owner-signed brand brief in audit corpus.

---

## 10. HUMAN_DECISION_REQUIRED

**YES** — Pick A, B, C, D (with H1 + OG specified). Cannot implement IC-002 without this.

---

## 11. IMPLEMENTATION IMPACT

| Field | Impact |
|-------|--------|
| Content | `es.json` `home.title` (+ 6 locales), possibly subtitle/proofTags |
| Code | `layout.tsx` metadata, JSON-LD |
| Policy | Content freeze exception (IC-002) |
| E2E | Visual snapshots if hero text asserted |

---

# C-003 — SERVICE ARCHITECTURE (4 pilares vs 6 servicios)

## 1. CURRENT STATE

| Model | Structure | Authority |
|-------|-----------|-----------|
| **Notebook** | 4 pilares: Infraestructura, Seguridad, Sistemas, Continuidad (VK-002) | TIER_B S-01 |
| **Repository** | 6 slugs: consultoría IT, mantenimiento, seguridad, web/WordPress, automatización IA, auditoría digital | TIER_A `services.ts` + i18n |

Baseline: six services **CONSISTENT** with WordPress export (`ARGOS_CONTENT_BASELINE.md` §4). No 4-pillar layer in runtime.

---

## Options

### Option A — 6 servicios only (status quo)

Public IA stays six cards; notebook pillars remain internal reference.

### Option B — 4 pilares replace 6 servicios

Restructure `/servicios` to four entries; fold or retire two slugs.

### Option C — 4 pilares as arquitectura superior + 6 servicios as capa comercial (requested evaluation)

**What:** Home/services intro presents **ecosistema de cuatro pilares** (VK-002 interconectado). Below: **six offerings** mapped to pillars. No slug removal.

**Indicative mapping (hypothesis — NOT verified, for owner edit):**

| Pilar | Primary slugs | Notes |
|-------|---------------|-------|
| Infraestructura | consultoría-it, (parte mantenimiento) | VK-007 estabilidad/cobertura/rendimiento |
| Seguridad | seguridad-informatica, auditoría-digital | VK-008 |
| Sistemas | mantenimiento-informatico, automatización-ia | VK-009 |
| Continuidad | cross-cutting + consultoría/mantenimiento | VK-006 copias ciegas; no Acronis |

**Coexistence assessment:**

| Question | Answer |
|----------|--------|
| Can 4 pillars sit above 6 services? | **Yes** — different abstraction levels (operating model vs SKUs). |
| Is mapping verified? | **No** — IC-004 requires owner-validated table. |
| Contradiction if framed correctly? | **No** — contradiction only if pillars **replace** slugs without explanation. |

---

## 2. EVIDENCE FOR OPTION A

- TIER_A six slugs live, WP-aligned, baseline CONSISTENT.
- Sales/legal familiarity with current service names.
- Zero migration cost.

## 3. EVIDENCE FOR OPTION B

- VK-002 STRONG strategic clarity.
- Notebook "ecosystem not silos" narrative (VK-002 notes).
- Simpler diagram for infographics.

## 4. EVIDENCE FOR OPTION C

- CONTRADICTIONS C-003: "not necessarily mutually exclusive."
- IC-004 P1 explicit ask for mapping table.
- Six services cover offerings **outside** pure infra/security (web, IA) — second layer explains **how** pillars are sold.
- Compatible with C-001 Option C (philosophy vs detail).

---

## 5. RISKS

| Option | Risk |
|--------|------|
| A | Notebook strategic work invisible; missed differentiation. |
| B | URL retirement, WP parity loss, client confusion, freeze violation. |
| C | Wrong mapping misleads; page length; duplicate feel if copy repeats. |

---

## 6. WHAT BREAKS IF CHANGED

| Option | Breakage |
|--------|----------|
| A | None |
| B | Six `/servicios/[slug]` URLs, i18n keys, WP cross-links, baseline |
| C | Nothing structural; `/servicios` page layout + intro copy only |

---

## 7. WHAT REMAINS COMPATIBLE

| Option | Compatible |
|--------|------------|
| A | Everything |
| B | Method, diagnostic — after service rewrite |
| C | **All six slugs**, method phases, diagnostic areas, VK-006–VK-009 pillar copy |

---

## 8. RECOMMENDED OPTION

**Option C — 4 pilares superior + 6 servicios segunda capa**

Requires signed mapping table (IC-004) before publish. Do **not** collapse to Option B without migration plan.

---

## 9. CONFIDENCE

**MEDIUM-HIGH** for layered architecture
**LOW** for default mapping row until owner validates commercial fit

---

## 10. HUMAN_DECISION_REQUIRED

**YES** — A, B, C, or DEFER. If C: approve mapping table.

---

## 11. IMPLEMENTATION IMPACT

| Option | Content | Code |
|--------|---------|------|
| A | None | None |
| B | Full services rewrite | Routes, slugs, nav, sitemap |
| C | `/servicios` intro + optional home pillar block | Optional UI grouping only; no slug change |

---

# C-004 — ACRONIS STATUS

## 1. CURRENT STATE

| Claim | Source | Status |
|-------|--------|--------|
| ARGOS uses Acronis for verified backups / continuity | Notebook chat + Studio notes (TIER_D) | REJECTED as fact (REJ-ACRONIS-001) |
| No Acronis in repo | Grep 2026-08-31 | TIER_A negative evidence |
| `ACRONIS_OFFICIAL_CAPABILITIES` | Audit | **0** documented in pack inputs |
| `ARGOS_ACRONIS_IMPLEMENTED_CAPABILITIES` | Audit | **0** |

IC-009: **BLOCKED** for all public Acronis claims. IC-003: **copias ciegas** framing allowed **without** vendor name.

---

## Options

### Option A — BLOCKED (maintain)

No public mention of Acronis. Continuity copy uses vendor-neutral verification language (VK-006).

### Option B — UNBLOCK after evidence gate

Publish Acronis only when **both**:

1. **Official evidence:** product name, edition, licensed features (vendor docs or contract redacted summary in ops vault — not in this pack).
2. **ARGOS implementation evidence:** configured workloads, restore test log, alert routing, responsible process — documented off-repo and mirrored in internal runbook.

---

## 2. EVIDENCE FOR OPTION A

- SOURCE_TRACEABILITY: REJ-ACRONIS-001 INFERRED, HIGH_RISK.
- Zero repo refs; contradicts TIER_D notebook claims.
- Notebook phrases rejected: "garantizamos," "recuperación inmediata," "nunca se detendrá."
- IC-003 achieves differentiation via **copias ciegas** without vendor lock-in copy.

## 3. EVIDENCE FOR OPTION B

- Notebook Studio note titles reference Acronis strategy (TIER_D — pointer only).
- **No verified official Acronis capability doc in audit corpus.**
- **No verified ARGOS deployment evidence in audit corpus.**

Option B is **not selectable today** — evidence gate unmet.

---

## 4. RISKS

| Option | Risk |
|--------|------|
| A | Under-markets tool if Acronis is actually in use off-repo. |
| B (premature) | Legal/reputational if claim is false; HIGH_RISK_CLAIM exposure. |

---

## 5. WHAT BREAKS IF CHANGED

| Option | Breakage |
|--------|----------|
| A | None (status quo) |
| B | Trust if published without restore proof; IC-009 unblocks copy that baseline currently forbids |

---

## 6. WHAT REMAINS COMPATIBLE

- Option A: VK-006, diagnostic Q `backups`, continuity **framing** — fully compatible.
- Option B: Only after evidence; would require legal + ops review separate from this pack.

---

## 7. RECOMMENDED OPTION

**Option A — BLOCKED**

Insufficient evidence to recommend UNBLOCK. Owner may **initiate evidence collection** off-repo; that is not a content decision.

---

## 8. CONFIDENCE

**HIGH** for BLOCKED recommendation
**N/A** for UNBLOCK until evidence supplied

---

## 9. HUMAN_DECISION_REQUIRED

**YES for evidence collection** (ops/legal)
**NO for public copy today** — only one safe choice: BLOCKED

---

## 10. IMPLEMENTATION IMPACT

| Option | Impact |
|--------|--------|
| A | None; continue IC-003 vendor-neutral copy when approved |
| B | Future: continuity service pages, possibly sales collateral — blocked pending proof |

---

# C-006 — MASCOT BACKSTORY

## 1. CURRENT STATE

| Aspect | Notebook | Repository |
|--------|----------|------------|
| Origin / creation story | **Absent** — AI confirmed sources do not contain it (C-006 CLAIM_A) | Not documented |
| Functional roles | N/A | **Dumbo = guía**; **Chico = protege** (VK-012, `es.json` explainer) |
| Assets | PNG filenames in chat | `spriteManifest.ts` paths (PNGs missing in repo per baseline) |
| Contamination | Disney Dumbo, comics "Chicos" | **Rejected** |

Baseline: `CHICO_SOURCE_FOUND = YES`, `DUMBO_SOURCE_FOUND = YES` (code); **MISSING_ASSET** for PNG binaries.

---

## Options

### Option A — Roles only (no backstory document)

Use verified roles in all copy, chat prompts, and explainer. Do not publish origin narrative.

### Option B — Optional owner-authored backstory (future)

Owner writes canonical brief **outside** notebook/AI inference. Must not use Disney, mythology Argos dog, or unverified comics links.

### Option C — Publish inferred backstory from notebook chat

**Disqualified** — audit rejects Disney/inferred lore. Not listed as viable.

---

## 2. EVIDENCE FOR OPTION A

- VK-012 STRONG for roles; DIRECT negative for origin in notebook.
- IC-006 P1: internal roles brief prevents future contamination.
- Baseline: explainer scenes already implement roles without origin (`home.explainer.*`).

## 3. EVIDENCE FOR OPTION B

- C-006: "Origin story lives outside notebook (oral, design brief, or unpublished)."
- Owner may have non-notebook knowledge — **not in audit corpus**; cannot verify.

## 4. EVIDENCE FOR OPTION C

None acceptable under quality gate.

---

## 5. RISKS

| Option | Risk |
|--------|------|
| A | Brand feels thin if competitors humanize mascots. |
| B | Inconsistent story if multiple authors; must be single owner doc. |
| C | Reputational contamination (Disney); contradicts verified audit. |

---

## 6. WHAT BREAKS IF CHANGED

| Option | Breakage |
|--------|----------|
| A | None |
| B | Nothing if kept internal until approved |
| C | Explainer integrity, content freeze, audit trust |

---

## 7. WHAT REMAINS COMPATIBLE

- Option A: All mascot UI, chicoTips, ClientAssistants, guardian, header banner.
- Option B: Adds optional `docs/design/ARGOS_MASCOT_CANON.md` later — no code requirement.

---

## 8. RECOMMENDED OPTION

**Option A now** — roles only: **Dumbo = guía**, **Chico = protege**.

**Option B** remains available if owner chooses to author verified backstory later. **Do not invent.**

---

## 9. CONFIDENCE

**HIGH** for roles-only
**NONE** for any origin narrative without owner primary source

---

## 10. HUMAN_DECISION_REQUIRED

**YES** — Confirm A, or commit to B with author + timeline. Reject C explicitly.

---

## 11. IMPLEMENTATION IMPACT

| Option | Content | Code |
|--------|---------|------|
| A | Optional internal IC-006 brief (roles + rejected sources list) | None |
| B | New canonical doc when ready | None unless new explainer scenes |
| C | **Forbidden** | — |

---

# Owner decision checklist

| ID | Options | Your choice (write here) |
|----|---------|--------------------------|
| C-001 | A / B / C / DEFER | |
| C-002 | A / B / C / D / DEFER | |
| C-003 | A / B / C / DEFER | |
| C-004 | A (BLOCKED) only until evidence | |
| C-006 | A / B / DEFER | |

---

# Pack recommendations (non-binding)

These summarize §8 above. **Owner signature still required.**

```
METHOD_RECOMMENDATION = DUAL_LAYER_4_PUBLIC_5_OPERATIONAL (Option C for C-001)
  — Requires mapping doc before dual references in copy.

SERVICE_ARCHITECTURE_RECOMMENDATION = FOUR_PILLARS_OVER_SIX_SERVICES (Option C for C-003)
  — Requires owner-validated pillar→slug mapping (IC-004).

SLOGAN_RECOMMENDATION = SPLIT_ROLES_OPTION_D
  — H1: "Tecnología serena para empresas que avanzan" (baseline B)
  — OG: Owner must unify to B or C; do not use notebook A as H1 without legal review.
  — Optional: A as proof tag/kicker only.

ACRONIS_PUBLICATION_STATUS = BLOCKED

MASCOT_BACKSTORY_STATUS = OPTIONAL_NOT_VERIFIED
  — Publish roles only: Dumbo = guía; Chico = protege.

READY_FOR_OWNER_DECISION = YES
READY_FOR_IMPLEMENTATION = NO
```

---

**End of Human Decision Pack 01**
