# ARGOS Content Freeze v1.0

**Effective:** 2026-08-31
**Governance mission:** CONTENT GOVERNANCE 03
**Authority:** Owner decisions (authoritative) + Decision Resolution 02 + notebook audit verified knowledge
**Supersedes:** Ad-hoc copy experiments for governed surfaces listed below
**Does not replace:** `docs/design/ARGOS_CONTENT_FREEZE_POLICY.md` (visual missions) — this document governs **what** may change in **content** missions

```
CONTENT_FREEZE_VERSION = 1.0
RUNTIME_IMPLEMENTATION = NOT AUTHORIZED BY THIS DOCUMENT
```

---

## Freeze level definitions

| Level | Meaning | Change rule |
|-------|---------|-------------|
| **FROZEN_EXACT** | Exact string equality required (ES default locale for listed fields) | Zero character drift without owner re-approval |
| **FROZEN_CONCEPT** | Meaning and architecture locked; copy may be drafted later | Meaning cannot be silently altered; new copy requires explicit approval |
| **FUNCTIONAL_PROTECTED** | Behavior, logic, and engine outputs | Design/visual work has **zero** authority to alter |
| **ARCHITECTURAL_METADATA** | Internal classification; not public copy | Does not authorize UX nesting, URL changes, or service renames |
| **BLOCKED** | Must not appear in public surfaces | Permanent until separate verification/decision |
| **UNRESOLVED** | Known gap; not frozen; requires owner decision before implementation | Do not guess |

---

## Owner decisions (authoritative)

| ID | Decision | Freeze level |
|----|----------|--------------|
| C-001 | Dual-layer method approved | FROZEN_CONCEPT |
| C-002 | Hero hybrid A+B approved | FROZEN_EXACT (listed fields) |
| C-003 | Four pillars over six services approved | FROZEN_CONCEPT + ARCHITECTURAL_METADATA |
| C-004 | Acronis blocked | BLOCKED |
| C-006 | Mascots roles only | FROZEN_CONCEPT |
| Diagnostic | Primary Hero entry; understand-before-selling | FROZEN_CONCEPT + FUNCTIONAL_PROTECTED |

---

## FROZEN_EXACT

**Locale:** Spanish (`es`) — default public locale. Other locales: **UNRESOLVED** until separate translation mission.

### Hero (C-002 — APPROVED_HYBRID_A_B)

| Field | Exact string |
|-------|--------------|
| **H1** | `Sistemas que no fallen cuando no deben.` |
| **Supporting copy** | `Primero entendemos cómo trabaja tu empresa y de qué depende su operativa. Después ponemos orden, reducimos riesgos y mantenemos bajo control la tecnología que necesita para funcionar.` |
| **Primary CTA** | `Iniciar diagnóstico ARGOS` |
| **Secondary CTA** | `Conocer cómo trabajamos` |

**Rules:**

- Do not paraphrase, optimize, shorten, or split across components in ways that alter visible text.
- `FROZEN_EXACT_DIFF_ALLOWED = 0` for these four fields.
- Primary CTA opens diagnostic flow (understand-before-selling) — behavior is FUNCTIONAL_PROTECTED; label is FROZEN_EXACT.

**Not frozen in C-002 (UNRESOLVED unless later approved):**

- Hero eyebrow / brand mark
- Proof tags / context lines
- OG title, meta description, JSON-LD (`layout.tsx`, `meta.*`)
- Non-ES translations

---

## FROZEN_CONCEPT

### Method — dual layer (C-001)

**Public philosophy (Level 1):**

1. **Analizamos** — map real dependencies before technical change
2. **Ordenamos** — clarity against inherited/disconnected decisions
3. **Protegemos** — structural hardening; verified backups (vendor-neutral only)
4. **Acompañamos** — ongoing supervision; not 24/7 absolute claims

**Operational model (Level 2):**

Five-phase **A.R.G.O.S.:** Analizar → Reforzar → Guiar → Optimizar → Supervisar

**Relationship rules (non-negotiable):**

- Two levels of the **same** method — **not** a forced 1:1 sequence
- `METHOD_FORCED_RELATIONSHIPS = 0`
- Authoritative mapping preserved in `docs/content/ARGOS_METHOD_MAPPING_4_TO_5.md`
- **Required bridge** before public dual-layer copy ships (concept locked; exact placement UNRESOLVED):

> Cuatro movimientos, cinco fases. Resumimos nuestro trabajo en Analizamos, Ordenamos, Protegemos y Acompañamos. El detalle operativo vive en el método ARGOS: Analizar, Reforzar, Guiar, Optimizar y Supervisar. No son dos métodos distintos: es la misma lógica, con distinto nivel de detalle.

**Operational routes unchanged:** `/metodo/analizar` … `/metodo/supervisar` remain canonical until explicit URL mission.

### Service architecture (C-003)

**Level 1 — four strategic/operational pillars:**

- Infraestructura
- Sistemas
- Seguridad
- Continuidad

**Level 2 — six commercial services (all preserved):**

- `consultoria-it`
- `mantenimiento-informatico`
- `seguridad-informatica`
- `web-wordpress`
- `automatizacion-ia`
- `auditoria-digital`

**Concept rule:** Pillars answer *what part of the operation we steward*; services answer *what concrete help the client receives*. See `docs/content/ARGOS_SERVICE_ARCHITECTURE_MAPPING.md`.

**Not authorized by C-003:** visual nesting, nav nesting, URL changes, service renaming, hiding services, changing existing service copy without separate content mission.

### Mascots (C-006)

| Role | Meaning |
|------|---------|
| **Dumbo** | guía |
| **Chico** | protege |

- No invented backstory
- No Disney-derived material
- No external mascot lore
- No automatic Hero placement

### Diagnostic principle

- **UNDERSTAND_BEFORE_SELLING = YES**
- Diagnostic is approved as **primary Hero entry** (concept)
- Diagnostic is **not** a lead-generation gimmick in positioning copy

### Continuity framing (vendor-neutral)

Allowed where already verified (VK-006):

- Risk of unverified backups (“copias ciegas”)
- Importance of tested restoration
- Continuity as operational preparedness — **without** vendor names or guarantee language

---

## ARCHITECTURAL_METADATA

Internal only unless a later UX mission explicitly exposes classification.

| Service slug | PRIMARY_PILLAR | CROSS_CUTTING | SECONDARY_PILLARS |
|--------------|----------------|---------------|-------------------|
| `consultoria-it` | Infraestructura | YES | Seguridad, Sistemas, Continuidad |
| `mantenimiento-informatico` | Sistemas | NO | Continuidad, Infraestructura |
| `seguridad-informatica` | Seguridad | NO | Continuidad |
| `web-wordpress` | Sistemas | YES | Infraestructura, Seguridad, Continuidad |
| `automatizacion-ia` | Sistemas | YES | Seguridad, Continuidad |
| `auditoria-digital` | Continuidad | NO | Seguridad, Sistemas, Infraestructura |

**Owner confirmation:** `web-wordpress` PRIMARY = Sistemas, CROSS_CUTTING = YES.

---

## FUNCTIONAL_PROTECTED

Design work has **zero authority** to alter these. Visual styling around them may change; semantics and logic may not.

### Diagnostic engine

| Component | Location |
|-----------|----------|
| Questions (12) | `frontend/components/diagnostic/diagnosticQuestions.ts` |
| Option labels (3) | `DIAGNOSTIC_OPTION_LABELS` |
| Scoring / tiers / recommendations | `diagnosticScoring.ts` |
| Persist payload / source | `diagnosticPersistPayload.ts` |
| Modal / launcher UI flow | `DiagnosticSurvey.tsx`, `DiagnosticSurveyLauncher.tsx`, `DiagnosticSurveyModal.tsx` |
| API persistence | `POST /api/client/diagnostics` |

**Explicitly protected (no change without dedicated functional mission):**

- questions
- options
- scoring
- recommendations
- analytics
- state
- validation
- `diagnostic_completed` behavior (if introduced)

### Mascot runtime

| Component | Location |
|-----------|----------|
| Sprite manifest paths | `frontend/sprites/spriteManifest.ts` |
| Dock / chat system | `ChicoDumboSpriteSystem.tsx`, `ClientAssistants.tsx`, `MascotChatPanel.tsx` |
| Chico tips (12) | `chicoTips.ts` |
| Guardian (portal) | `ChicoGuardian.tsx` |
| Safe movement / behavior tests | `frontend/ai/mascotBehaviorSafety.test.js` |
| Banner triggers | `CorporateHeaderBanner.tsx`, `HomeDiagnosisCard.tsx`, `DiagnosticPromoBanner.tsx` (behavior) |

### Method operational pages (until content mission)

| Component | Location |
|-----------|----------|
| Five phase definitions | `frontend/lib/methodArgosSteps.ts` |
| Method overview steps | `es.json` → `method.steps` |
| Service slug registry | `frontend/lib/services.ts` |

---

## BLOCKED

Must **not** appear in public copy, metadata, or sales collateral governed by this freeze:

| Category | Examples |
|----------|----------|
| **Acronis** | Any public claim that ARGOS uses, resells, or guarantees Acronis capabilities |
| **Absolutes** | 24/7, guaranteed uptime, zero failures, never fails, total protection |
| **Recovery guarantees** | Guaranteed recovery, immediate recovery, RPO/RTO/SLA unless independently verified and approved |
| **Mascot lore** | Invented origin, Disney Dumbo, external comics/history |
| **B12 business claims** | Any copy traceable to B12 recovery project (`B12_COPY_AUTHORITY = NONE`) |
| **Unverified vendor capabilities** | Representing vendor features as ARGOS-implemented capabilities |

`ACRONIS_PUBLICATION_STATUS = BLOCKED`

---

## UNRESOLVED

Do not implement assumptions for these in a content mission without owner sign-off:

| Item | Notes |
|------|-------|
| Hero OG / meta / JSON-LD | Must align after Hero implementation; exact strings not approved in C-002 |
| Hero eyebrow / brand mark | Not in FROZEN_EXACT |
| Secondary CTA href | Presumed `/metodo` — not explicitly frozen |
| Non-ES locales | Frozen exact strings exist for ES only |
| Method bridge placement | Home vs `/metodo` intro vs about — placement UNRESOLVED |
| Four public phases on Home | Whether to surface 4-phase rail alongside 5-phase rail — UX UNRESOLVED |
| Pillar exposure in UI | ARCHITECTURAL_METADATA internal until UX mission |

---

## Design vs content policy (v1.0)

For all missions until this freeze is lifted or amended:

```
DESIGN_CHANGE_AUTHORIZED = YES
CONTENT_CHANGE_AUTHORIZED = NO
FROZEN_EXACT_DIFF_ALLOWED = 0
FUNCTIONAL_BEHAVIOR_DIFF_ALLOWED = 0
```

### Visual redesign MAY change

- layout, spacing, typography roles, color, responsive composition
- motion, cards, grids, visual hierarchy

### Visual redesign MAY NOT silently change

- FROZEN_EXACT strings
- FROZEN_CONCEPT meaning
- service names/descriptions (Level 2 copy)
- method operational meaning
- diagnostic logic
- mascot roles
- business claims

See also: `docs/design/ARGOS_CONTENT_FREEZE_POLICY.md`

---

## Implementation consumption

The next **controlled content implementation** mission must:

1. Apply FROZEN_EXACT Hero strings to `es.json` (and wire CTAs in `HomeView.tsx`)
2. Resolve items in `docs/content/ARGOS_CONTENT_DRIFT_REGISTER.md`
3. Not alter FUNCTIONAL_PROTECTED surfaces
4. Not publish BLOCKED claims
5. Use ARCHITECTURAL_METADATA only as internal reference unless UX authorized

---

## Related documents

| Document | Role |
|----------|------|
| `ARGOS_METHOD_MAPPING_4_TO_5.md` | Method relationship evidence |
| `ARGOS_SERVICE_ARCHITECTURE_MAPPING.md` | Pillar ↔ service evidence |
| `ARGOS_CONTENT_OWNERSHIP_MAP.json` | Machine-readable ownership |
| `ARGOS_CONTENT_DRIFT_REGISTER.md` | Known runtime vs freeze gaps |
| `ARGOS_HUMAN_DECISION_PACK_01.md` | Decision history |
| `ARGOS_DECISION_RESOLUTION_02.md` | Analysis that preceded approval |

---

## Stop gate

```
METHOD_OWNER_DECISION = APPROVED
METHOD_DUAL_LAYER = FROZEN_CONCEPT

HERO_OWNER_DECISION = APPROVED_HYBRID_A_B
HERO_EXACT_STRINGS_FROZEN = YES

SERVICE_ARCHITECTURE = APPROVED
FOUR_PILLARS = FROZEN_CONCEPT
SIX_SERVICES_PRESERVED = YES

DIAGNOSTIC_PRIMARY_ENTRY = APPROVED
DIAGNOSTIC_FUNCTIONALITY = PROTECTED

DUMBO_ROLE = GUIA
CHICO_ROLE = PROTEGE
MASCOT_BACKSTORY = NOT_AUTHORIZED

ACRONIS_PUBLICATION_STATUS = BLOCKED

CONTENT_FREEZE_VERSION = 1.0
READY_FOR_CONTROLLED_CONTENT_IMPLEMENTATION = YES
READY_FOR_VISUAL_REFACTOR = NO
```

**Note:** `READY_FOR_CONTROLLED_CONTENT_IMPLEMENTATION = YES` means the **contract exists** for the next mission. Runtime is **not** yet updated.
