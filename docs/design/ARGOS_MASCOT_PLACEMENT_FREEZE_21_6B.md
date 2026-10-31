# ARGOS Mascot Placement Freeze — 21.6B

**Status:** HUMAN-FROZEN PLACEMENT POLICY  
**Phase:** 21.6B.5A  
**Production implementation authorization (at time of this freeze):** NO

This document records the human placement freeze after analysis **FASE 21.6B.5** (`PASS`).

At the moment of 21.6B.5A it did **not** authorize production implementation, assistant refactor, Home changes, asset edits, new animation, or WALK.

### Current status / superseded by later phases

Placement **direction** from this freeze remains authoritative. Implementation arrived later (7A–8D), without expanding placement beyond ASSISTANT_ONLY:

```
MASCOT_PRODUCTION_PLACEMENT = ASSISTANT_ONLY
CLIENT_ASSISTANTS_V1_IMPLEMENTED = YES
ONE_ACTIVE_POLICY_IMPLEMENTED = YES
STATIC_LEGACY_BANNER_IMPLEMENTED = YES
ROLE_MODEL = R2_SOFT_SPECIALIZATION
ROLE_SEMANTICS_FROZEN = YES
WALK = REJECTED
HOME_HERO_MASCOT = NO
CORPORATE_HEADER_MASCOT = NO
CONTROL_CENTER_MASCOT = NOT_DECIDED
DIAGNOSTIC_MASCOT_OWNERSHIP = NOT_FROZEN
```

Role contract (do not duplicate here): [ARGOS_MASCOT_ROLE_SEMANTICS_FREEZE_21_6B.md](./ARGOS_MASCOT_ROLE_SEMANTICS_FREEZE_21_6B.md)

### Amendment note (2026-08-25) — CURRENT vs TARGET

This freeze document remains the **historical CURRENT** record of `ASSISTANT_ONLY` production placement (what was authorized and what shipped under 7A–8D).

A later **Design Contract amendment** defines **TARGET** Client security placement for CHICO as Security Guardian. That TARGET does **not** rewrite this freeze’s history and does **not** authorize runtime UI by itself.

Canonical TARGET: [ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md](./ARGOS_CHICO_SECURITY_GUARDIAN_CONTRACT.md).

```
PLACEMENT_FREEZE_21_6B_STATUS     = HISTORICAL_CURRENT (ASSISTANT_ONLY shipped)
CHICO_SECURITY_GUARDIAN_TARGET    = DOCUMENTED (Client security surfaces)
CHICO_RUNTIME_UI_AUTHORIZED       = NO
```

---

## Authority chain (reference only — do not rewrite)

- [ARGOS_DESIGN_DIRECTOR_BRIEF.md](./ARGOS_DESIGN_DIRECTOR_BRIEF.md) (21.6A.1)
- [ARGOS_VISUAL_FREEZE_21_6B.md](./ARGOS_VISUAL_FREEZE_21_6B.md)
- [ARGOS_MASCOT_MOTION_AUTHORIZATION.md](./ARGOS_MASCOT_MOTION_AUTHORIZATION.md)
- [ARGOS_MASCOT_LOW_MOTION_FREEZE_21_6B.md](./ARGOS_MASCOT_LOW_MOTION_FREEZE_21_6B.md)
- FASE 21.6B.5 placement analysis (human decision)

Corporate visual dominance remains:

```
Quiet Authority
+
ARGOS Perimeter System
```

Mascots may operate as a **product overlay / assistant** inside that system. They must never replace it.

---

## 1. Frozen placement direction

```
MASCOT_PLACEMENT_DIRECTION = ASSISTANT_ONLY
PRIMARY_MASCOT_CONTEXT = CLIENT_ASSISTANT_OVERLAY
SECONDARY_MASCOT_CONTEXT = ABOUT_OR_HOME_STATIC_EMBLEM_ONLY
```

The secondary context authorizes **approved static story/emblem** only.  
It does **not** authorize new **animated** mascot placement on Corporate pages.

```
MASCOT_PRODUCTION_INTEGRATION_AT_5A = NOT_YET_AUTHORIZED
CLIENT_ASSISTANTS_V1_IMPLEMENTED = YES   # after 7A–8D; still ASSISTANT_ONLY
```

---

## 2. Corporate exclusions (frozen)

| Placement | Decision |
|-----------|----------|
| CORPORATE_HEADER_MASCOT | **NO** |
| HOME_HERO_MASCOT | **NO** |
| HOME_BODY_ANIMATED_MASCOT | **NO** |
| FINAL_CTA_MASCOT | **NO** |
| CONTACT_PAGE_MASCOT | **NO** |
| SERVICES_PAGE_MASCOT | **NO** |
| METHOD_PAGE_MASCOT | **NO** |
| AUTH_PAGE_MASCOT | **NO** |
| ABOUT_MASCOT | **CONDITIONAL_STATIC_EMBLEM_ONLY** |
| DASHBOARD_MASCOT | **NOT_FROZEN_BY_THIS_DECISION** |
| CONTROL_CENTER_MASCOT | **NOT_DECIDED** |

---

## 3. Assistant overlay (frozen placement, not implementation)

```
ASSISTANT_OVERLAY_MASCOT = YES
```

Placement authorization / specification only. **Not** a production implement order.

Mascot presence must be:

- subordinate  
- contextual  
- user-purpose driven  
- quiet  
- non-continuous  
- non-attention-seeking  

The assistant must **not** become Corporate chrome.

Purpose classes (any appearance needs one):

ASSISTANCE · GUIDANCE · OBSERVATION · REASSURANCE · STATUS ACKNOWLEDGEMENT · CONTEXTUAL HELP  

If there is no user-purpose reason: `MASCOT_PRESENT = NO`.

---

## 4. Production state set (frozen V1 only)

### Chico

REST · LOOK · STAND · LAY · SLEEP

### Dumbo

REST · LOOK · SIT · LAY · SLEEP

### Explicitly rejected / not authorized

| State / behavior | Status |
|------------------|--------|
| WALK | **REJECTED** |
| JUMP | NOT_AUTHORIZED |
| TURN | NOT_AUTHORIZED |
| GUIDE | NOT_AUTHORIZED |
| ALERT | NOT_AUTHORIZED |
| PLAY | NOT_AUTHORIZED |

Legacy code containing walking / guiding / playing does **not** constitute authorization.

---

## 5. Motion contract

```
IDLE_DOMINATES = YES
```

Allowed general pattern:

```
REST → NOTICE → LOOK → REST
```

Discrete transitions to STAND / SIT · LAY · SLEEP.

Forbidden:

- gait simulation  
- morphing / anatomical interpolation  
- continuous mascot performance  
- bouncing  
- auto-walking  
- page-load performance  

```
prefers-reduced-motion = STATIC_OR_FADE_ONLY
```

---

## 6. Trigger contract

```
USER_INTENT_FIRST = YES
```

| Trigger | Classification |
|---------|----------------|
| USER_CLICK | ALLOWED |
| ASSISTANT_OPEN | ALLOWED |
| FOCUS_ON_ASSISTANT_CONTROL | ALLOWED |
| LONG_IDLE | ALLOWED |
| RETURN_FROM_IDLE | ALLOWED |
| USER_HOVER | CONDITIONAL |
| SUCCESS | CONDITIONAL |
| ERROR | CONDITIONAL |
| DIAGNOSTIC_EVENT | CONDITIONAL |
| SCROLL_CONTEXT | REJECTED |
| PAGE_LOAD_ANIMATION | REJECTED |
| AUTO_WALK | REJECTED |
| AMBIENT_MASCOT_PERFORMANCE | REJECTED |

---

## 7. Dual-mascot policy

```
DUAL_MASCOT_ALLOWED = CONDITIONAL
TWO_ANIMATED_MASCOTS_SIMULTANEOUSLY = NO   # normal Corporate flow
ONE_ACTIVE_MASCOT_AT_A_TIME = YES          # assistant overlay
```

Conditional dual presence allowed only for:

- approved static story / emblem context  
- future **explicitly** approved onboarding context  

---

## 8. Role semantics — frozen (R2 soft)

Public Chico/Dumbo role semantics are human-frozen as **R2 soft specialization**.

Authoritative freeze:

- [ARGOS_MASCOT_ROLE_SEMANTICS_FREEZE_21_6B.md](./ARGOS_MASCOT_ROLE_SEMANTICS_FREEZE_21_6B.md)

```
ROLE_SEMANTICS_FROZEN = YES
FROZEN_ROLE_MODEL = R2_SOFT_SPECIALIZATION
DIAGNOSTIC_MASCOT_OWNERSHIP = NOT_FROZEN
```

Affinity ≠ exclusive capability. Role semantics do **not** control motion states or placement.
---

## 9. Accessibility freeze

| Rule | Value |
|------|--------|
| MASCOT_IMAGE_DECORATIVE | ARIA_HIDDEN |
| FUNCTIONAL_ACCESSIBLE_NAME | ON_SURROUNDING_CONTROL |
| MIN_INTERACTIVE_TARGET | 44px |
| KEYBOARD_REQUIRED | YES |
| FUNCTION_DEPENDS_ON_ANIMATION | NO |
| REDUCED_MOTION | STATIC_OR_FADE_ONLY |

---

## 10. Responsive policy

Validate at: **390 · 768 · 1024 · 1440**

Mascot must never:

- overlap navigation  
- obscure copy  
- cover CTA  
- cover form controls  
- introduce horizontal overflow  

```
MOBILE_MASCOT_PRESENCE <= DESKTOP_MASCOT_PRESENCE
```

Mobile may reduce or remove the large visual representation while preserving assistant functionality.

---

## 11. Source pixel policy

```
SOURCE_PIXEL_PRESERVATION = REQUIRED
```

Canonical source: `frontend/public/mascots/`

Forbidden: generated replacements, similar dogs, recolor, warp, mesh deformation, generated intermediate frames.

Existing frozen lab normalization remains **presentation-only** (CSS scale / translate for alignment).

---

## 12. Explicit non-authorization (historical at 5A) vs later phases

**At 21.6B.5A this freeze did not authorize:**

- production assistant refactor  
- Quiet Authority Home modification  
- Corporate page animated mascot insertion  
- WALK reintroduction  
- Control Center mascot behavior  
- freezing Chico/Dumbo role semantics *(that freeze happened later, 8D)*
- push / PR / merge / deploy

**Later (authoritative, do not treat 5A as current global fact):**

- 7A–7D implemented the ClientAssistants V1 dock under this placement direction
- 8B implemented the static legacy diagnostic banner
- 8D froze role semantics as **R2 soft** — see [ARGOS_MASCOT_ROLE_SEMANTICS_FREEZE_21_6B.md](./ARGOS_MASCOT_ROLE_SEMANTICS_FREEZE_21_6B.md)

```
ROLE_SEMANTICS_FROZEN = YES
ROLE_MODEL = R2_SOFT_SPECIALIZATION
FINAL_GATE = MASCOT_PLACEMENT_FROZEN
HISTORICAL_PRODUCTION_IMPLEMENTATION_AUTHORIZATION_AT_5A = NO
```

Still **not** authorized by this placement freeze: Home hero mascot, Corporate header mascot, Control Center mascot, WALK, diagnostic exclusive ownership.

**Not authorized by the later CHICO Guardian TARGET alone:** React/CSS/sprites/animation for Client security chrome — requires a separate UI implementation authorization.
