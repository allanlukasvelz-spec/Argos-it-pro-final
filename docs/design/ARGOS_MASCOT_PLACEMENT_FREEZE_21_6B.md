# ARGOS Mascot Placement Freeze — 21.6B

**Status:** HUMAN-FROZEN PLACEMENT POLICY  
**Phase:** 21.6B.5A  
**Production implementation authorization:** NO  

This document records the human placement freeze after analysis **FASE 21.6B.5** (`PASS`).

It does **not** authorize production implementation, assistant refactor, Home changes, asset edits, new animation, or WALK.

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
MASCOT_PRODUCTION_INTEGRATION = NOT_YET_AUTHORIZED
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

## 8. Role semantics — not frozen

Existing product/copy evidence associates:

- Chico → diagnose / protect assistant (proposed)  
- Dumbo → requests / forms / follow-up assistant (proposed)  

```
ROLE_SEMANTICS_FROZEN = NO
ROLE_SEMANTICS_STATUS = PROPOSED_FROM_EXISTING_PRODUCT_EVIDENCE
```

Do not invent additional capabilities. Final product semantics require a **separate human decision**.

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

## 12. Explicit non-authorization

This freeze does **not** authorize:

- production assistant refactor  
- Quiet Authority Home modification  
- Corporate page animated mascot insertion  
- WALK reintroduction  
- Control Center mascot behavior  
- freezing Chico/Dumbo role semantics  
- push / PR / merge / deploy  

```
FINAL_GATE = MASCOT_PLACEMENT_FROZEN
PRODUCTION_IMPLEMENTATION_AUTHORIZATION = NO
```
