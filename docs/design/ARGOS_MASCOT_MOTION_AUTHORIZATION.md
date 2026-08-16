# ARGOS Mascot Motion Authorization

**Status:** LIMITED HUMAN AUTHORIZATION
**Scope:** Chico + Dumbo motion asset laboratory
**Production integration:** NO

This document creates a narrow exception to the general PROTECTED mascot restriction in the Design Director Brief.

It **DOES NOT** authorize redesign.

It does not rewrite [ARGOS_DESIGN_DIRECTOR_BRIEF.md](./ARGOS_DESIGN_DIRECTOR_BRIEF.md).

---

## IDENTITY

```
Logo = PROTECTED
Chico = PROTECTED
Dumbo = PROTECTED

CHICO_IDENTITY = LOCKED
DUMBO_IDENTITY = LOCKED
```

Original approved assets remain the identity Source of Truth.

---

## AUTHORIZED OPERATIONS

AUTHORIZED:

- inspect existing Chico/Dumbo assets
- inventory source images
- calculate hashes
- identify duplicates
- classify existing poses
- isolate approved figures
- remove noncanonical backgrounds
- preserve/produce real alpha transparency
- normalize canvas dimensions
- normalize ground line
- normalize visual scale
- normalize positioning
- create chronological motion state maps
- identify missing transitional frames
- create derivative transitional motion frames when an explicitly authorized image-generation/editing tool is available
- perform anatomical QA
- perform identity QA
- prepare individual assets for unpublished Framer testing
- create machine-readable motion manifests
- evaluate motion continuity
- evaluate prefers-reduced-motion fallback

---

## ABSOLUTE FRAME CONTRACT

NON-NEGOTIABLE:

**1 IMAGE = 1 DOG = 1 POSE = 1 FRAME**

```
FINAL_FRAME_SUBJECT_COUNT = 1
```

Forbidden final assets:

- sprite sheets
- contact sheets
- collages
- multi-pose images
- mockups
- Framer UI screenshots
- animation boards containing several poses
- multiple dogs in one frame

Each final frame is an independent asset.

Example:

```
chico_walk_001.png
chico_walk_002.png
chico_walk_003.png
```

NOT:

```
chico_walk_sprite.png
```

---

## IDENTITY PRESERVATION

Derivative motion frames must preserve:

- exact mascot identity
- coat pattern
- coat color
- facial structure
- muzzle
- eyes
- ears
- body proportions
- legs
- paws
- tail
- characteristic silhouette

Forbidden:

- substitute dog
- generic dog
- approximate breed replacement
- recoloring
- redesign
- accessories
- clothing
- logo additions
- cartoon conversion
- arbitrary 3D conversion
- anatomical reinterpretation

Explicitly:

- **NO GOLDEN RETRIEVER SUBSTITUTE.**
- **NO "SIMILAR DOG".**

If identity cannot be preserved:

```
FRAME_STATUS = REJECTED
```

Do not compensate by inventing another dog.

---

## MOTION CHARACTER

Motion must support Quiet Authority.

Desired:

- calm
- observant
- natural
- subtle
- intelligent
- unhurried
- human-compatible
- peripheral

Rejected:

- hyperactive
- cartoon
- bouncy
- gaming mascot
- constant attention seeking
- continuous unnecessary walking
- notification mascot
- marketing theatre

Idle should dominate.

---

## MOTION STATES

Initial Chico state vocabulary:

```
IDLE
LOOK
ALERT
WALK
STOP
TURN
SIT
STAND
LIE_DOWN
LAY
RISE
SLEEP
WAKE
JUMP
```

Initial Dumbo state vocabulary:

```
IDLE
LOOK
GUIDE
WALK
STOP
TURN
SIT
STAND
LIE_DOWN
LAY
RISE
SLEEP
WAKE
JUMP
```

These are motion states, not Corporate IA.

---

## CORPORATE BOUNDARY

Mascots remain:

**PRODUCT_OVERLAY / ASSISTANT**

They are **NOT**:

- Corporate logo
- Corporate navigation
- Corporate visual identity
- Corporate header
- primary hero identity

```
MASCOT_IN_CORPORATE_HEADER = NO
```

Mascot motion must remain subordinate to Quiet Authority and the ARGOS Perimeter System.

---

## LAB / PRODUCTION BOUNDARY

```
MASCOT_MOTION_LAB = AUTHORIZED

FRAMER_COMPATIBILITY_TEST = AUTHORIZED

MASCOT_PRODUCTION_INTEGRATION = NO

HOME_MODIFICATION = NO
```

No production route may be modified during asset preparation.

---

## TOOL RESTRICTION

Do not pretend Cursor can generate imagery if no real image generation/editing capability is available.

`IMAGE_GENERATION_TOOL_AVAILABLE` must be explicitly determined.

If NO:

create `MISSING_FRAME_SPEC` only.

Do NOT:

- fake poses with CSS
- warp images
- stretch limbs
- construct SVG substitutes
- invent raster frames
- use another dog

---

## QUALITY GATE

Every eventual frame must pass:

```
IDENTITY_MATCH = PASS
ANATOMY_QA = PASS
ALPHA = PASS
EDGE_MATTE = PASS
CANVAS_ALIGNMENT = PASS
GROUND_LINE = PASS
SINGLE_SUBJECT = PASS
```

Failure of any critical identity/anatomy condition:

**REJECT FRAME.**

---

## RESTRICTIONS

NO production implementation.
NO Home changes.
NO `/servicios` changes.
NO `/metodo` changes.
NO `/contacto` changes.
NO auth changes.
NO dashboard changes.
NO Control Center changes.

NO npm.
NO npx.
NO Relume MCP.
NO Framer MCP.
NO automatic plugin installation.

NO push.
NO PR.
NO merge.
NO deploy.
