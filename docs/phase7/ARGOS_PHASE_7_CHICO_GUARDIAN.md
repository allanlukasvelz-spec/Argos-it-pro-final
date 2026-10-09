# ARGOS Phase 7 — CHICO Security Guardian + DUMBO Role Preservation

```
STATUS = PLANNING_ADDENDUM + RUNTIME_IMPLEMENTED
PHASE_7_CHICO_RUNTIME_UI_IMPLEMENTATION = AUTHORIZED_AND_IMPLEMENTED
DATE = 2026-08-25
BASELINE_HEAD = 9a5e8cd
```

This addendum **supersedes** earlier Phase 7 planning text that incorrectly framed a “raccoon vs robot dog” identity conflict. That framing was a planning error and is **withdrawn**.

---

## MASCOT_ROLE_CONFLICT report

### CURRENT (from repository)

| Persona | Canonical source | CURRENT role |
|---------|------------------|--------------|
| **CHICO** | `backend/routes/ai-public.js` → `CHICO_SYSTEM`: «perro guardián de ARGOS-IT»; `backend/routes/ai.js` section «CHICO - Seguridad»; sprites `frontend/public/mascots/chico/*`; states include `guarding` / `alert` | Security / guardian robot dog on public web + assistant chat; diagnostic tips; **not** yet Client Portal security chrome |
| **DUMBO** | `ai-public.js` → `DUMBO_SYSTEM`: «perro guía»; `ai.js` «DUMBO - Guía UX» | Guide / UX orientation robot dog; default chat persona on public |

Design Contract (`ARGOS_DESIGN_CONTRACT.md`): Logo, Chico, Dumbo **PROTECTED**.

**CURRENT (shipped / 21.6B):** mascots = `ASSISTANT_ONLY`; not in Client/NOC chrome.  
**TARGET (amendment 2026-08-25):** CHICO Security Guardian permitted on Client security surfaces — see [`docs/design/ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md`](../design/ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md). Runtime still **NO**.

### PROPOSED (human decision — this message)

| Persona | Role |
|---------|------|
| **CHICO** | **ARGOS SECURITY GUARDIAN** — primary visual face of customer security |
| **DUMBO** | **EXISTING ROLE PRESERVED** — guide / UX; **NOT** security guardian |

### PROPOSED_RESOLUTION

1. **Identity:** Keep the existing two robot personas only. No third mascot. Do not reclassify CHICO as another animal.
2. **Product:** CHICO = Security Guardian (aligns with existing «perro guardián» / «Seguridad» code).
3. **DUMBO:** Unchanged guide role; no security repurposing.
4. **Design Contract:** TARGET amended 2026-08-25 (`ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md`). Historical `ASSISTANT_ONLY` freezes remain CURRENT history (not rewritten).
5. Withdraw planning contradiction **C2** (raccoon). **C1** TARGET docs = resolved; runtime UI still requires separate authorization.
6. Runtime: `PHASE_7_CHICO_RUNTIME_UI_IMPLEMENTATION = NO`.

```
ASSISTANT_ONLY_CONFLICT_RESOLVED (TARGET docs) = YES
CHICO_SECURITY_CHROME_ALLOWED                  = TARGET_YES
CHICO_RUNTIME_UI_AUTHORIZED                    = NO
```

---

## CHICO = SECURITY GUARDIAN (frozen product intent)

Customer perception target: *“CHICO is watching over my systems.”*  
Always backed by verified ARGOS Core state. CHICO does **not** invent truth.

### Not interchangeable with

| Component | Role |
|-----------|------|
| ARGOS TECHNICAL AGENT | On-host observability software (Phase 7) |
| ARGOS CORE | Authoritative evidence / health / alerts / incidents |
| ARGOS NOC | Internal technical operations |
| REMEDIATION ENGINE | Phase 6 controlled actions |

### Architecture (persona vs truth)

```
CUSTOMER
   │
   ▼
CHICO
Security Guardian Persona
   │
   │ explains / warns / guides
   ▼
ARGOS CORE
   ▲
   │
SECURE OBSERVATIONS
   ▲
   │
ARGOS TECHNICAL AGENT
   ▲
   │
CUSTOMER INFRASTRUCTURE
```

Per-organization conceptual model:

```
CUSTOMER ORGANIZATION
        ↓
      CHICO
        ↓
SECURITY CONTEXT
        ↓
ASSETS + MONITORS + AGENTS
        ↓
ARGOS CORE
        ↓
HEALTH / ALERTS / INCIDENTS / ACTIONS
```

### Cardinality

```
1 customer organization
  → 1 CHICO security guardian persona
    → many assets / monitors
    → 0..N technical agents
```

Do **not** assume one CHICO per technical agent.

---

## Client Portal presence (TARGET — not implemented)

Priority routes:

- `/dashboard`
- `/dashboard/seguridad`
- `/dashboard/alertas`
- `/dashboard/incidentes`
- `/dashboard/prevencion`
- `/dashboard/monitorizacion`

### Presentation states → backend mapping (must be explicit at implement time)

| CHICO presentation | Must derive from (examples) | Forbidden implication |
|--------------------|-----------------------------|------------------------|
| NORMAL / MONITORING | Coverage + no open CRITICAL; evidence fresh enough | “Fully protected” without evidence |
| ATTENTION | Open WARNING / pending customer action | |
| WARNING | WARNING alerts / degraded health | |
| CRITICAL | CRITICAL alerts / open severe incidents | |
| UNKNOWN | Insufficient evidence / stale / no coverage | Must **not** look HEALTHY |
| ACTION_PENDING | Remediation PLANNED / DRY_RUN | |
| APPROVAL_REQUIRED | L3 awaiting approval | |
| VERIFYING | Remediation VERIFYING | |
| RESOLVED | Verified success **and** incident/alert policy says resolved | Never say “fixed” without verify |
| CONNECTION_LOST | Agent OFFLINE/STALE **or** platform degraded affecting visibility | Not equal to asset HEALTHY/CRITICAL alone |

### Communication rules

Translate codes to clear Spanish; never claim *fixed / protected / secure / resolved* unless ARGOS verified that exact state.

Examples (planning copy):

| Backend | CHICO may say |
|---------|----------------|
| `TLS_HOSTNAME_MISMATCH` | «He detectado una incompatibilidad en la protección HTTPS de este dominio.» |
| Agent/monitor stale / no fresh evidence | «No he podido confirmar recientemente el estado de este sistema.» |
| Critical incident | «He detectado una incidencia que requiere atención.» |
| Verified remediation | «La acción se ha completado y he verificado el resultado.» |

### Actions lifecycle (visual only)

DETECTED → EVIDENCE → RECOMMENDATION → PROPOSED → SAFETY LEVEL → APPROVAL? → EXECUTION → VERIFICATION → RESULT  

On failure: FAILURE EVIDENCE → B → C → SAFE STOP / ROLLBACK / HUMAN — CHICO explains; does not bypass safety engine.

### Relation to Phase 6 remediation

| Layer | Owns |
|-------|------|
| Remediation Engine | Safety levels, dry-run, approval, execute, verify, rollback, SAFE_STOP |
| NOC | Operator control plane |
| CHICO | Customer-facing explanation of the lifecycle and verified outcomes only |

CHICO must not imply host mutation succeeded unless Core records a verified success. Simulator / control-plane-only executions stay honest in copy.

### UNKNOWN behavior

- First-class presentation state.
- Must never render as healthy (no green “all clear” when evidence is insufficient/stale/missing).
- Prefer language like «No he podido confirmar…» over false reassurance.

---

## DUMBO (preserved)

- Remains guide / UX orientation persona.
- Must not become security guardian.
- Must not be removed or overwritten by Phase 7 agent work.
- Public + assistant surfaces continue as today unless a future separate decision says otherwise.

---

## Phase 7 planning implications

| Item | Status |
|------|--------|
| Define CHICO guardian architecture | YES (this addendum + updated maps) |
| Technical agents | Separate; observation channel only |
| CHICO runtime Client UI | **NOT AUTHORIZED** until Design Contract + explicit UI auth |
| Third mascot / animal rebrand | **FORBIDDEN** |

---

## Planning gate

```
PHASE_7_PLANNING = CONTINUES (docs only)
PHASE_7_IMPLEMENTATION_AUTHORIZED = NO
PHASE_7_CHICO_RUNTIME_UI_IMPLEMENTATION = NO
MASCOT_ROLE_FREEZE =
  CHICO = SECURITY GUARDIAN
  DUMBO = EXISTING ROLE PRESERVED
DESIGN_CONTRACT_TARGET_AMENDED = YES
  canonical = docs/design/ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md
HUMAN_DECISION_REQUIRED =
  Separate authorization before CHICO Client security runtime UI
```
