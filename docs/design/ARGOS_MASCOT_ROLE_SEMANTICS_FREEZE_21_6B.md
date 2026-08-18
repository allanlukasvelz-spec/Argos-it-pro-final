# ARGOS Mascot Role Semantics Freeze — 21.6B

**Status:** HUMAN-FROZEN ROLE SEMANTICS  
**Phase:** 21.6B.8D  
**Model:** `R2_SOFT_SPECIALIZATION`  
**Implementation authorization:** NO (documentation freeze only)

This document freezes **public** Chico/Dumbo role semantics after:

- FASE 21.6B.8C product decision analysis (`PASS`)
- Human decision: **ROLE_MODEL = R2_SOFT_SPECIALIZATION**

It does **not** authorize prompt rewrites, i18n edits, UI changes, motion changes, placement changes, diagnostic ownership resolution, or Control Center implementation.

---

## Authority chain (reference only)

- [ARGOS_DESIGN_DIRECTOR_BRIEF.md](./ARGOS_DESIGN_DIRECTOR_BRIEF.md)
- [ARGOS_VISUAL_FREEZE_21_6B.md](./ARGOS_VISUAL_FREEZE_21_6B.md)
- [ARGOS_MASCOT_PLACEMENT_FREEZE_21_6B.md](./ARGOS_MASCOT_PLACEMENT_FREEZE_21_6B.md)
- [ARGOS_MASCOT_LOW_MOTION_FREEZE_21_6B.md](./ARGOS_MASCOT_LOW_MOTION_FREEZE_21_6B.md)
- FASE 21.6B.8C role semantics decision (`RECOMMENDED_ROLE_MODEL = R2`)
- FASE 21.6B.8D human freeze (this document)

Quiet Authority and ARGOS Perimeter remain the corporate visual system. Mascots remain **assistants**, not brand substitution.

---

## 1. Frozen model

```
FROZEN_ROLE_MODEL = R2_SOFT_SPECIALIZATION
PUBLIC_ROLE_MODEL = R2_SOFT
ROLE_SEMANTICS_FROZEN = YES
```

```
STRICT_DOMAIN_OWNERSHIP = NO
WRONG_MASCOT_REJECTION = NO
AUTOMATIC_REDIRECTION_BY_TOPIC = NO
CAPABILITY_GATING_BY_MASCOT = NO
```

---

## 2. Affinities (not exclusive capabilities)

### Chico — primary affinity

```
CHICO_PRIMARY_AFFINITY =
SECURITY_PROTECTION_CONTINUITY_SAFE_DIGITAL_HABITS
```

Emphasis may lean toward: security posture, protection habits, continuity awareness, calm risk framing.

### Dumbo — primary affinity

```
DUMBO_PRIMARY_AFFINITY =
GUIDANCE_SERVICES_FORMS_CONTACT_FOLLOWUP
```

Emphasis may lean toward: orientation, services explanation, contact/form next steps, follow-up clarity.

### Both remain general assistants

```
GENERAL_ASSISTANCE_BOTH = YES
CROSS_CAPABILITY_ALLOWED = YES
```

Either public assistant may answer general visitor questions within product policy.  
Choosing “the other” mascot is **not** a failure.

---

## 3. Critical distinction (frozen)

```
AFFINITY != EXCLUSIVE_CAPABILITY
AFFINITY != ROUTE_OWNERSHIP
AFFINITY != CTA_OWNERSHIP
AFFINITY != BACKEND_AUTHORIZATION
```

Persona **may** influence:

- tone
- emphasis
- suggested next step
- contextual wording

Persona **must not** determine:

- whether the user is allowed to ask a question
- whether a workflow is available
- whether a form can be completed
- whether diagnostic functionality exists
- access or security permissions

Legacy sprite keys such as `guarding` / `guiding` are **not** role authorization.

---

## 4. Wrong-mascot policy

```
WRONG_MASCOT_FAILURE = NONE
WRONG_MASCOT_REJECTION = NO
AUTOMATIC_REDIRECTION_BY_TOPIC = NO
```

No mandatory redirect. No hard topic refusal solely because the other mascot “owns” the domain. Soft re-emphasis or a suggested next step is allowed; blocking is not.

---

## 5. Diagnostic ownership — not frozen

```
DIAGNOSTIC_MASCOT_OWNERSHIP = NOT_FROZEN
```

**Reason:** existing evidence is inconsistent.

| Surface | Evidence |
|---------|----------|
| Home story copy | Chico → diagnose / protect |
| Static legacy banner (21.6B.8B) | Dumbo → diagnostic CTA |

Therefore do **not** encode:

- `diagnostic === chico`
- `diagnostic === dumbo`

Diagnostic CTA ownership requires a **separate** product decision if ever needed.  
Affinity freeze does **not** rewrite Home copy or banner ownership.

---

## 6. Public / auth boundary

```
PUBLIC_ROLE_MODEL = R2_SOFT
AUTH_ROLE_ARCHITECTURE = EXISTING / OUT_OF_SCOPE
```

Public assistant persona semantics must **not** be inferred from authenticated backend/API architecture.

Auth Chico JSON risk surfaces and auth Dumbo UX surfaces may remain as existing technical evidence. They do **not** convert public R2 into strict specialization.

---

## 7. Role semantics ≠ motion semantics

```
ROLE_SEMANTICS_CONTROL_MOTION = NO
ROLE_SEMANTICS != MOTION_SEMANTICS
```

Do **not** map affinity to V1 animation/state selection.

- Form events must **not** imply Dumbo ownership via state (e.g. force SIT).
- Security-adjacent events must **not** imply Chico ownership via state (e.g. force STAND/LOOK as “guard”).

Authoritative visual policy remains:

- ClientAssistants V1 state freeze + one-active policy
- Neutral form visual responses where already approved
- WALK remains rejected for production dock

---

## 8. Placement boundary (unchanged)

Placement freeze remains authoritative:

```
PRIMARY_MASCOT_CONTEXT = CLIENT_ASSISTANT_OVERLAY
CORPORATE_HEADER_MASCOT = NO
HOME_HERO_MASCOT = NO
HOME_BODY_ANIMATED_MASCOT = NO
```

```
ROLE_SEMANTICS_CONTROL_PLACEMENT = NO
```

Static legacy banner decisions remain a **separate** ownership track (21.6B.8A/8B).

---

## 9. Control Center constraint

Future Control Center must **not** reinterpret affinity as:

- authorization
- exclusive domain ownership
- capability gating
- permission model

Affinity is product personality / emphasis for assistants, not an ACL.

```
CONTROL_CENTER_MUST_NOT_ASSUME_STRICT_DOMAIN = YES
```

---

## 10. What this freeze does / does not authorize

### Authorizes (policy)

- Treating public Chico/Dumbo as soft-specialized general assistants
- Future copy/prompt alignment **when separately authorized** to match R2 without hard gates

### Does not authorize

- Code, prompt, i18n, asset, or test changes in this phase
- Strict topic routers or wrong-mascot rejection UX
- Encoding diagnostic ownership
- Changing placement, Corporate chrome, or motion freezes
- Reintroducing WALK or autonomous banner motion
- Using auth architecture as public role law

---

## 11. Red-team exclusions (must remain false)

| ID | Forbidden accidental claim |
|----|----------------------------|
| F1 | Chico owns all diagnostics |
| F2 | Dumbo owns all forms |
| F3 | Wrong mascot must redirect |
| F4 | Persona controls permissions |
| F5 | Form events select Dumbo (motion/ownership) |
| F6 | Security events select Chico (motion/ownership) |
| F7 | Auth architecture defines public behavior |
| F8 | Banner Dumbo rewrites Home semantics |
| F9 | Role semantics alter placement freeze |
| F10 | Role semantics reauthorize WALK |
| F11 | Control Center receives strict-domain assumption |
| F12 | Copy evidence = exclusive capability |

---

## 12. Freeze stamp

```
ROLE_MODEL = R2_SOFT_SPECIALIZATION
ROLE_SEMANTICS_FROZEN = YES
IMPLEMENTATION_AUTHORIZED = NO
DIAGNOSTIC_MASCOT_OWNERSHIP = NOT_FROZEN
PUBLIC_ROLE_MODEL = R2_SOFT
AUTH_ROLE_ARCHITECTURE = OUT_OF_SCOPE
ROLE_SEMANTICS_CONTROL_MOTION = NO
ROLE_SEMANTICS_CONTROL_PLACEMENT = NO
```

**FINAL_GATE (this doc):** `MASCOT_ROLE_SEMANTICS_FROZEN`
