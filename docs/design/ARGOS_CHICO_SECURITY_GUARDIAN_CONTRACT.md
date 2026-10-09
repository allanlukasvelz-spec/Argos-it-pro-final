# ARGOS — CHICO Security Guardian Contract

```
STATUS                              = DESIGN_CONTRACT_AMENDMENT_APPROVED
DOCUMENT_TYPE                       = CANONICAL_TARGET_SPEC
RUNTIME_UI_AUTHORIZED               = NO
PHASE_7_RUNTIME_AUTHORIZED          = NO
ASSET_CHANGES_AUTHORIZED            = NO
DATE                                = 2026-08-25
AUTHORITY                           = HUMAN_DECISION (Design Contract amendment)
SUPERSEDES_FOR_CLIENT_SECURITY      = ASSISTANT_ONLY (scoped; see CURRENT / TARGET)
```

This document is the **canonical TARGET** design contract for CHICO as the customer-facing **ARGOS Security Guardian**.

It authorizes **documentation and future UI specification only**. It does **not** authorize React, CSS, sprites, animation, APIs, agents, migrations, or production changes.

Related:

| Document | Role |
|----------|------|
| [ARGOS_DESIGN_CONTRACT.md](./ARGOS_DESIGN_CONTRACT.md) | Parent Client/NOC visual contract (amended) |
| [ARGOS_UI_STATE_MATRIX.md](./ARGOS_UI_STATE_MATRIX.md) | Product health / unknown semantics |
| [ARGOS_CLIENT_NOC_VISUAL_RULES.md](./ARGOS_CLIENT_NOC_VISUAL_RULES.md) | Two languages |
| [ARGOS_COMPONENT_SYSTEM.md](./ARGOS_COMPONENT_SYSTEM.md) | Conceptual components |
| [ARGOS_MASCOT_PLACEMENT_FREEZE_21_6B.md](./ARGOS_MASCOT_PLACEMENT_FREEZE_21_6B.md) | Historical CURRENT placement (ASSISTANT_ONLY) — not rewritten |
| [../phase7/ARGOS_PHASE_7_CHICO_GUARDIAN.md](../phase7/ARGOS_PHASE_7_CHICO_GUARDIAN.md) | Phase 7 planning addendum |

---

## 0. CURRENT vs TARGET

| Topic | CURRENT (repo / prior freezes) | TARGET (this amendment) |
|-------|--------------------------------|-------------------------|
| Canonical robots | CHICO + DUMBO only | Unchanged — **two personas only** |
| CHICO product role | Public/assistant «perro guardián» / seguridad (`ai-public.js`, `ai.js`) | **ARGOS SECURITY GUARDIAN** — primary visual face of customer security |
| DUMBO product role | Guide / UX («perro guía») | **PRESERVED** — not security guardian |
| Placement policy (21.6B) | `ASSISTANT_ONLY`; not in Client/NOC chrome | **Amended for Client security surfaces only** (below) |
| Client Portal CHICO chrome | Not implemented as security presence | **Permitted TARGET** on listed routes — runtime still **NO** |
| NOC chrome | Mascots not in headers | Unchanged — **no** CHICO as NOC operator chrome |
| Public Corporate | Placement freezes prohibit hero/header mascots | Unchanged |
| Technical Agent | N/A / Phase 7 planning | Agent ≠ CHICO |

Historical freezes (21.6B placement, low-motion, role semantics R2) remain valid as **CURRENT** history. They are **not** silently rewritten. This amendment defines **TARGET** Client security placement for CHICO.

---

## 1. Canonical personas

```
CHICO = ARGOS SECURITY GUARDIAN
DUMBO = ARGOS UX / GUIDE ROLE PRESERVED
```

- Exactly **two** canonical ARGOS robot personas: CHICO and DUMBO.
- Do not invent, rename, or substitute additional mascots.
- Do not reclassify CHICO as another animal.
- Do not delete or modify existing DUMBO assets under this amendment.

---

## 2. Placement amendment (replaces ASSISTANT_ONLY for Client security)

### PREVIOUS (CURRENT history)

```
MASCOT_PRODUCTION_PLACEMENT = ASSISTANT_ONLY
Not in Client/NOC chrome
```

### TARGET (authorized design)

```
CHICO_CLIENT_SECURITY_PLACEMENT = AUTHORIZED_TARGET
CHICO_RUNTIME_UI                = NOT_AUTHORIZED
DUMBO_CLIENT_SECURITY_PLACEMENT = FORBIDDEN
NOC_MASCOT_CHROME               = FORBIDDEN
PUBLIC_CORPORATE_PLACEMENT      = UNCHANGED (21.6B freezes)
```

**CHICO is explicitly permitted** in the Client Portal where the UI communicates **customer security state**.

### Authorized TARGET areas

| Route | Presence intensity (TARGET) |
|-------|-----------------------------|
| `/dashboard` | Small Guardian Status / security presence |
| `/dashboard/seguridad` | Stronger CHICO presence |
| `/dashboard/monitorizacion` | Observation / freshness communication |
| `/dashboard/alertas` | Explains why attention is required |
| `/dashboard/incidentes` | Incident lifecycle (no NOC internals) |
| `/dashboard/prevencion` | Recommendations only when backed by real capability |

CHICO may also appear in **contextual security components** shared by these routes (e.g. a Guardian Status strip bound to org security state).

### Still forbidden

- CHICO in Client **header/sidebar brand chrome** as decorative logo substitute
- CHICO dominating the portal (mascot-driven UI)
- Giant hero sections, marketing CTAs, gamification that obscures severity
- Covering tables, controls, alerts, evidence, or navigation
- Fake animation implying work that is not occurring
- DUMBO representing security / monitoring / incidents / remediation
- CHICO in NOC operator chrome (NOC remains technical; operators use evidence, not guardian persona)
- Regenerating or replacing existing mascot raster identity

Preferred model: **contextual guardian presence** — meaningful, not dominant. Frozen information hierarchy (Design Contract §3) remains authoritative.

---

## 3. Cardinality and architecture

```
1 ORGANIZATION
        │
        ▼
     1 CHICO
 SECURITY GUARDIAN
        │
        ▼
 ARGOS SECURITY STATE
        │
 ┌──────┼────────┐
 ▼      ▼        ▼
ASSETS MONITORS AGENTS
                0..N
```

### Source of truth

```
CUSTOMER
   │
   ▼
CHICO
Security Guardian / presentation layer
   │
   ▼
ARGOS CORE
authoritative security state
   ▲
   │ verified observations
   │
ARGOS TECHNICAL AGENTS
   ▲
   │
CUSTOMER INFRASTRUCTURE
```

| Layer | Owns |
|-------|------|
| **CHICO** | Customer-facing presentation / explanation |
| **ARGOS CORE** | Authoritative security state |
| **Technical Agent** | On-host observability software (≠ CHICO) |
| **NOC** | Internal technical operations |
| **Phase 6 Remediation Engine** | Controlled approved actions |

CHICO **MUST NEVER** become a source of technical truth.

---

## 4. Truthfulness invariants

```
UNKNOWN              ≠ HEALTHY
NO ALERTS            ≠ HEALTHY
NO INCIDENTS         ≠ PROTECTED
AGENT OFFLINE        ≠ CUSTOMER UNSAFE   (unless evidence establishes that)
PLATFORM HEALTHY     ≠ CUSTOMER HEALTHY
ACTION EXECUTED      ≠ ACTION VERIFIED
```

CHICO must **never** convert uncertainty into reassurance.

Success copy only when authoritative backend state supports it:

```
EXECUTED → VERIFYING → (only after successful verification) VERIFIED / RESOLVED
```

On verification failure:

```
FAILURE EVIDENCE → ACTION B/C (when authorized) → ROLLBACK / SAFE_STOP / HUMAN_ESCALATION
```

Forbidden claims unless verified: “fixed”, “protected”, “secure”, “resolved”, “fully healthy”, “100% protected”.

---

## 5. What CHICO may communicate (presentation)

Monitoring status · attention required · warnings · critical conditions · unknown state · incident detected · action proposed · approval required · verification in progress · verified resolution · rollback · safe stop · human escalation · agent disconnected.

All are **presentation** states mapped to Core / Phase 3–6 evidence.

---

## 6. Canonical CHICO state machine

```
IDLE / MONITORING
        │
        ├── HEALTHY
        │
        ├── ATTENTION
        │      └── WARNING
        │
        ├── CRITICAL
        │      └── INCIDENT
        │
        ├── UNKNOWN
        │
        ├── AGENT_OFFLINE
        │
        └── ACTION
               ├── PROPOSED
               ├── APPROVAL_REQUIRED
               ├── EXECUTING
               ├── VERIFYING
               ├── VERIFIED
               ├── FAILED
               ├── ROLLBACK
               ├── SAFE_STOP
               └── HUMAN_ESCALATION
```

Priority when multiple backends apply (highest wins for primary visual):  
`HUMAN_ESCALATION` > `SAFE_STOP` / `ROLLBACK` > `FAILED` > `CRITICAL`/`INCIDENT` > `APPROVAL_REQUIRED` > `EXECUTING`/`VERIFYING` > `WARNING`/`ATTENTION` > `AGENT_OFFLINE` > `UNKNOWN` > `PROPOSED` > `HEALTHY` / `IDLE_MONITORING`.

`AGENT_OFFLINE` may coexist with asset HEALTHY/WARNING from platform probes — do not collapse to a single false “safe” or “unsafe” without evidence.

---

## 7. State catalog (BACKEND → UX)

For each state: **BACKEND_SOURCE**, **ENTRY**, **EXIT**, **VISUAL**, **CUSTOMER_COPY** (examples), **ALLOWED_ACTION**, **FORBIDDEN_CLAIMS**.

### 7.1 IDLE / MONITORING

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Org has coverage context; no open CRITICAL; evidence freshness within policy **or** honest “observing” with partial coverage |
| ENTRY | Session/org security context loaded; no higher-priority state |
| EXIT | Any ATTENTION+ / UNKNOWN / ACTION / AGENT_OFFLINE |
| VISUAL_STATE | Calm guardian; low motion; no alarm chrome |
| CUSTOMER_COPY | «Estoy vigilando tus sistemas.» / «ARGOS está observando.» (only if Core says observing) |
| ALLOWED_ACTION | Link to Seguridad / Monitorización |
| FORBIDDEN_CLAIMS | “Fully protected”, “todo seguro” |

### 7.2 HEALTHY

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Asset/control/org rollup HEALTHY **with** fresh evidence per UI State Matrix |
| ENTRY | Evidence OK within policy window |
| EXIT | Stale evidence → UNKNOWN; alert/incident → ATTENTION+ |
| VISUAL_STATE | Teal mark + label; solid treatment (never for UNKNOWN) |
| CUSTOMER_COPY | «El estado verificado es correcto.» (scope the object) |
| ALLOWED_ACTION | View evidence / coverage |
| FORBIDDEN_CLAIMS | HEALTHY for whole org when any child is UNKNOWN/CRITICAL |

### 7.3 ATTENTION

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Open WARNING, pending customer action, preventive finding requiring review |
| ENTRY | Policy marks attention without CRITICAL |
| EXIT | Cleared findings or escalate to WARNING/CRITICAL |
| VISUAL_STATE | Amber attention mark; non-alarming but clear |
| CUSTOMER_COPY | «Hay algo que requiere tu atención.» |
| ALLOWED_ACTION | Open alert / preventive item |
| FORBIDDEN_CLAIMS | “Minor / ignore” |

### 7.4 WARNING

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Alert or health = WARNING |
| ENTRY | WARNING severity from Core |
| EXIT | Resolved per policy or escalate CRITICAL |
| VISUAL_STATE | Triangle + WARNING label + amber |
| CUSTOMER_COPY | «He detectado una condición que conviene revisar.» |
| ALLOWED_ACTION | Open alert detail |
| FORBIDDEN_CLAIMS | “Still secure”, “no risk” |

### 7.5 CRITICAL

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Alert/health CRITICAL |
| ENTRY | CRITICAL from Core |
| EXIT | Verified recovery or incident lifecycle update |
| VISUAL_STATE | Diamond / strong red-navy; never playful |
| CUSTOMER_COPY | «He detectado una condición crítica.» |
| ALLOWED_ACTION | Open alert/incident |
| FORBIDDEN_CLAIMS | Softening severity; “under control” without evidence |

### 7.6 INCIDENT

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Open incident record |
| ENTRY | Incident created/open |
| EXIT | Incident closed **and** verification policy satisfied |
| VISUAL_STATE | CRITICAL family + “incidencia” label |
| CUSTOMER_COPY | «He detectado una incidencia que requiere atención.» |
| ALLOWED_ACTION | View incident (client-safe fields only) |
| FORBIDDEN_CLAIMS | Exposing NOC internals, hypotheses, operator PII |

### 7.7 UNKNOWN

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Insufficient evidence, never observed, stale beyond policy, missing coverage |
| ENTRY | Core/UI matrix UNKNOWN |
| EXIT | Fresh verified evidence arrives |
| VISUAL_STATE | Dashed gray; minus-circle; **must not look HEALTHY** |
| CUSTOMER_COPY | «No he podido confirmar recientemente el estado de este sistema.» |
| ALLOWED_ACTION | Explain coverage gap; link to monitorización |
| FORBIDDEN_CLAIMS | Any healthy/protected/secure reassurance |

### 7.8 AGENT_OFFLINE

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Technical agent OFFLINE / STALE / CONNECTION_LOST (Phase 7 when implemented); or platform path that withholds agent evidence |
| ENTRY | Agent liveness fails policy |
| EXIT | Heartbeat resumes → recompute from Core (may still be UNKNOWN/HEALTHY independently) |
| VISUAL_STATE | Distinct from CRITICAL unless evidence says customer impact |
| CUSTOMER_COPY | «No tengo confirmación reciente del agente técnico en este entorno.» |
| ALLOWED_ACTION | Show last-seen; do not invent impact |
| FORBIDDEN_CLAIMS | “Estás desprotegido” **or** “todo bien” solely from agent offline |

### 7.9 ACTION / PROPOSED

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Remediation PLANNED / dry-run recommendation exists (Phase 6) |
| ENTRY | Proposed action visible to client policy |
| EXIT | Approval path, reject, or supersede |
| VISUAL_STATE | Neutral navy “propuesta” |
| CUSTOMER_COPY | «Puedo proponerte una acción basada en la evidencia.» |
| ALLOWED_ACTION | View recommendation (no bypass of safety) |
| FORBIDDEN_CLAIMS | “Ya está arreglado” |

### 7.10 APPROVAL_REQUIRED

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | L3 awaiting human approval |
| ENTRY | Approval gate open |
| EXIT | Approved / rejected / expired |
| VISUAL_STATE | Lock / stamp; APPROVAL_REQUIRED |
| CUSTOMER_COPY | «Esta acción requiere autorización antes de ejecutarse.» |
| ALLOWED_ACTION | Client-allowed approval UX only if product grants it; else “pendiente de autorización” |
| FORBIDDEN_CLAIMS | Implying auto-execute |

### 7.11 EXECUTING

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Remediation execution in progress |
| ENTRY | Execution started |
| EXIT | VERIFYING or FAILED / SAFE_STOP |
| VISUAL_STATE | Progress, not celebration |
| CUSTOMER_COPY | «La acción autorizada se está ejecutando.» |
| ALLOWED_ACTION | Wait / view status |
| FORBIDDEN_CLAIMS | “Completado”, “verificado” |

### 7.12 VERIFYING

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Post-exec verification running |
| ENTRY | Execute finished pending verify |
| EXIT | VERIFIED / FAILED |
| VISUAL_STATE | Distinct “verificando” |
| CUSTOMER_COPY | «Estoy verificando el resultado de la acción.» |
| ALLOWED_ACTION | None beyond status |
| FORBIDDEN_CLAIMS | Success before verify |

### 7.13 VERIFIED

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Remediation verify = success **and** policy allows resolution messaging |
| ENTRY | Verified success recorded |
| EXIT | New signal / regression |
| VISUAL_STATE | Check + verified (not generic “secure”) |
| CUSTOMER_COPY | «La acción se ha completado y he verificado el resultado.» |
| ALLOWED_ACTION | View evidence |
| FORBIDDEN_CLAIMS | “Forever fixed”, “fully protected” |

### 7.14 FAILED

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Execution or verification failure evidence |
| ENTRY | Failure recorded |
| EXIT | Next authorized action / SAFE_STOP / escalation |
| VISUAL_STATE | Failure mark; honest |
| CUSTOMER_COPY | «La acción no ha logrado el resultado esperado.» |
| ALLOWED_ACTION | Show next step if authorized |
| FORBIDDEN_CLAIMS | Pretend success |

### 7.15 ROLLBACK

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Rollback initiated or completed per engine |
| ENTRY | Rollback state |
| EXIT | Verified rollback or escalation |
| VISUAL_STATE | Rollback badge |
| CUSTOMER_COPY | «Se está revirtiendo / se ha revertido según el procedimiento.» (match backend tense) |
| ALLOWED_ACTION | View rollback evidence |
| FORBIDDEN_CLAIMS | “As if nothing happened” without verify |

### 7.16 SAFE_STOP

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Engine SAFE_STOP |
| ENTRY | Safe stop recorded |
| EXIT | Human / new plan |
| VISUAL_STATE | Stop mark; calm severity |
| CUSTOMER_COPY | «He detenido el proceso de forma segura.» |
| ALLOWED_ACTION | Escalation / support |
| FORBIDDEN_CLAIMS | “Problem solved” |

### 7.17 HUMAN_ESCALATION

| Field | Spec |
|-------|------|
| BACKEND_SOURCE | Escalation to human / NOC / support ticket linkage |
| ENTRY | Escalation flag |
| EXIT | Human resolution recorded in Core |
| VISUAL_STATE | Escalation badge |
| CUSTOMER_COPY | «Un especialista de ARGOS debe intervenir.» |
| ALLOWED_ACTION | Contact / support path |
| FORBIDDEN_CLAIMS | CHICO “fixing it alone” |

---

## 8. Phase 6 safety boundary

CHICO explains remediation lifecycle; CHICO does **not**:

- bypass L0–L4 gates
- execute host mutation
- spoof approval
- claim verify without engine result
- use the technical agent as a remote execute channel (Phase 7 remote remediation remains NOT AUTHORIZED)

---

## 9. DUMBO boundary

DUMBO remains the UX/guide persona from the repository.

DUMBO must **NOT** represent:

- monitoring state
- cybersecurity health
- incidents
- remediation
- technical agents
- security verification
- NOC actions

Do not delete or modify existing DUMBO assets under this amendment.

---

## 10. Component / placement specification (TARGET conceptual)

| Component (conceptual) | Role |
|------------------------|------|
| `ChicoGuardianStatus` | Compact org-level guardian presence (dashboard) |
| `ChicoSecurityPresence` | Stronger presence on `/dashboard/seguridad` |
| `ChicoStateExplainer` | Short copy bound to one backend object (alert/incident/asset) |
| `ChicoActionLifecycle` | Visual of PROPOSED → … → VERIFIED / FAILED / SAFE_STOP |

Props (conceptual): `organizationId`, `presentationState`, `backendRefs[]`, `freshness`, `provenance`, `density: 'client'`.

Must accept `UNKNOWN` and render dashed/unknown treatment. Must refuse props that claim HEALTHY without evidence flags from Core.

---

## 11. Implementation gate

```
CHICO_CONTRACT_AMENDED                    = YES (this document)
CHICO_SECURITY_CHROME_ALLOWED              = TARGET_YES / RUNTIME_NO
CHICO_RUNTIME_UI_AUTHORIZED               = NO
PHASE_7_CHICO_RUNTIME_UI_IMPLEMENTATION   = NO
CURSOR_MAY_IMPLEMENT_CHICO_CLIENT_UI      = NO
ASSET_EDITS                               = NO
PUBLIC_CHANGED                            = NO
NOC_RUNTIME_CHANGED                       = NO
```

A future authorized UI phase must implement **this** contract and the parent Design Contract — not invent a third persona or decorative mascot UI.
