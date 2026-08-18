# ARGOS Mascot Low-Motion Freeze — 21.6B

**Status:** HUMAN-FROZEN LAB SPEC  
**Phase:** 21.6B.4C  
**Production authorization (at time of this freeze):** NO
**Raster generation authorization:** NO  

This document freezes the approved **low-motion laboratory** for Chico and Dumbo after human visual gate **21.6B.4B** (`FINAL_GATE = GO_FREEZE_LOW_MOTION_LAB`).

At the moment of 21.6B.4C it did **not** authorize production integration, Corporate IA entry, navigation links, sitemap inclusion, or any change to live site mascot behavior.

### Current status / superseded by later phases

This lab freeze is **not rewritten**. Later phases implemented production separately:

| Item | Current (after 21.6B.7A–8D) |
|------|------------------------------|
| MASCOT_PRODUCTION_PLACEMENT | ASSISTANT_ONLY |
| CLIENT_ASSISTANTS_V1_IMPLEMENTED | YES |
| ONE_ACTIVE_POLICY_IMPLEMENTED | YES |
| STATIC_LEGACY_BANNER_IMPLEMENTED | YES |
| ROLE_MODEL | R2_SOFT_SPECIALIZATION |
| ROLE_SEMANTICS_FROZEN | YES — see [ARGOS_MASCOT_ROLE_SEMANTICS_FREEZE_21_6B.md](./ARGOS_MASCOT_ROLE_SEMANTICS_FREEZE_21_6B.md) |
| WALK | REJECTED |
| HOME_HERO_MASCOT | NO |
| CORPORATE_HEADER_MASCOT | NO |
| CONTROL_CENTER_MASCOT | NOT_DECIDED |
| DIAGNOSTIC_MASCOT_OWNERSHIP | NOT_FROZEN |

```
HISTORICAL_AUTHORIZATION_AT_4C = NO
CURRENT_IMPLEMENTATION_STATUS_AFTER_7A_8D = ASSISTANT_ONLY_V1
```

---

## 1. Frozen V1 states

### Chico (`CHICO_V1_STATES`)

| Lab control | Internal state | Canonical PNG (under `frontend/public/mascots/`) |
|-------------|----------------|--------------------------------------------------|
| Rest | `idle` | `chico/chico_esperando2.png` |
| Look | `look` | `chico/chico_mirandoatento.png` |
| Stand | `stand` | `chico/chico_esperando.png` |
| Lay | `lay` | `chico/chico_reposo.png` |
| Sleep | `sleep` | `chico/chico_durmiendo.png` |

### Dumbo (`DUMBO_V1_STATES`)

| Lab control | Internal state | Canonical PNG (under `frontend/public/mascots/`) |
|-------------|----------------|--------------------------------------------------|
| Rest | `idle` | `dumbo/dumbo_frente.png` |
| Look | `look` | `dumbo/dumbo_esperando_atento.png` |
| Sit | `sit` | `dumbo/dumbo_sentado_atento.png` |
| Lay | `lay` | `dumbo/dumbo_relajado.png` |
| Sleep | `sleep` | `dumbo/dumbo_durmiendo.png` |

---

## 2. Rejected: WALK

```
WALK = REJECTED
```

**Reason (human visual gate 21.6B.4B):** a single canonical walk pose plus container `translate` reads as **sliding / treadmill**, not credible locomotion.

- Do **not** reintroduce Walk into active lab controls without a **new human decision**.
- Do **not** invent gait cycles, intermediate stride frames, or morphing between walk poses.
- Canonical walk PNGs may remain on disk (`chico_caminando.png`, `dumbo_caminando.png`, etc.) but are **out of V1 lab surface**.

---

## 3. Motion contract

Approved presence flow:

```
REST → NOTICE → LOOK → REST
```

Discrete state transitions only (no anatomical interpolation):

**Chico:** `REST ↔ LOOK` · `REST ↔ STAND` · `REST ↔ LAY` · `REST ↔ SLEEP`  
**Dumbo:** `REST ↔ LOOK` · `REST ↔ SIT` · `REST ↔ LAY` · `REST ↔ SLEEP`

Forbidden:

- gait simulation  
- dog morphing / mesh / warp  
- generative in-between frames  
- overlapping dual-image “crossfade” that produces double-dog ghosting  

Approved transition behavior:

```
fade out → swap canonical PNG → fade in
```

One visible frame at a time. Sequential opacity only.

---

## 4. Source pixel contract

```
SOURCE_PIXEL_PRESERVED = YES
NEW_MASCOT_RASTER_CREATED = NO (for this freeze)
```

Allowed assets: **only** existing canonical PNGs under:

```
frontend/public/mascots/
```

Forbidden:

- generated replacement rasters  
- edited / recolored / filtered mascot pixels  
- non-uniform scaling, skew, stretch, crop of anatomy  
- mesh deformation  

**Allowed (presentation only):** uniform CSS `scale`, `translateY`, `transform-origin`, `object-fit: contain`, per-state presentation map, and equal viewport `--mml-fit` on narrow widths — for normalization and ground alignment **without** altering source files.

**No raster generation is authorized** by this freeze document.

---

## 5. Scale normalization approach

Calibrated for lab slot aspect **360×420** (`object-fit: contain`):

- **Reference upright:** `idle` per subject (`CHICO_REFERENCE_STATE` / `DUMBO_REFERENCE_STATE`).
- **Upright states:** uniform scale so apparent content height matches idle (target drift ≤ 6%).
- **Lay / Sleep:** normalize by horizontal body mass / content width (not total height).
- **Ground:** shared ground line via per-state `translateY` (CSS only).
- **Narrow viewports (≤480px):** `--mml-fit` multiplies all states equally so wide canvases (e.g. Stand) do not clip the stage while preserving relative scale.

Presentation maps live in `frontend/components/mascot-motion-lab/MascotMotionLab.tsx`.

---

## 6. Reduced motion

When `prefers-reduced-motion: reduce`:

- CSS `--mml-duration` ≈ instant  
- PNG swap without fade choreography  
- no relocate / slide of the mascot slot  
- Look still returns to Rest after a short hold  

---

## 7. Visual gate record (21.6B.4B)

| Gate | Result |
|------|--------|
| CHICO_IDLE_LOOK_VISUAL | PASS |
| CHICO_LOOK_STAND_VISUAL | PASS |
| CHICO_WALK_VISUAL | REJECT |
| DUMBO_IDLE_LOOK_VISUAL | PASS |
| DUMBO_LOOK_SIT_VISUAL | PASS |
| DUMBO_WALK_VISUAL | REJECT |
| GROUND_VISUAL | PASS |
| CROSSFADE_GHOSTING | PASS |
| EDGE_MATTE_LIGHT | PASS (Surface `#F7F7F5`) |
| EDGE_MATTE_DARK | PASS (Dark `#0B1320`) |
| RESPONSIVE_OVERFLOW | PASS (widths checked: 390, 768, 1024, 1440) |
| REDUCED_MOTION_VISUAL | PASS |

---

## 8. Lab route and production boundary

| Item | Value |
|------|--------|
| Route | `/mascot-motion-lab` |
| Scope | LAB ONLY — isolated study surface |
| Public navigation | NO |
| Corporate IA / sitemap | NO |
| robots / metadata | `noindex`, `nofollow`; `robots.ts` disallow |
| Chrome | `none` (no site header/footer; no CookieBanner / ClientAssistants) |

### Production guard

- **Development:** lab available (`NODE_ENV === "development"`).
- **Production:** **404** unless explicit test override `ALLOW_MASCOT_MOTION_LAB=1`.
- Proxy (`frontend/proxy.ts`) mirrors the same gate and sets `X-Robots-Tag: noindex, nofollow`.
- Page uses `dynamic = "force-dynamic"` so the env guard is not baked as a static 404 in all environments.

### Production pages unchanged **by this freeze** (historical, 21.6B.4C)

Home, `/contacto`, `/servicios`, `/metodo`, `/auth/*`, `/dashboard` — **no visual change** was required or authorized by 21.6B.4C itself.
**Mascot production behavior at 4C:** unchanged.

Later dock/banner work (7A–8B) is **not** authorized by this lab freeze; it is recorded in the placement freeze current-status note.

---

## 9. Implementation references (lab-only)

| Path | Role |
|------|------|
| `frontend/app/mascot-motion-lab/page.tsx` | Route + production guard |
| `frontend/components/mascot-motion-lab/MascotMotionLab.tsx` | Frozen V1 controls + presentation map |
| `frontend/styles/mascot-motion-lab.css` | Lab-only CSS |
| `frontend/lib/chromeOwnership.ts` | Chrome owner `none` for lab |
| `frontend/components/layout/SiteShell.tsx` | Lab isolation (no banner chrome) |
| `frontend/app/robots.ts` | Disallow lab |
| `frontend/proxy.ts` | Prod 404 + noindex header |

Related authority (not replaced by this freeze):

- [ARGOS_MASCOT_MOTION_AUTHORIZATION.md](./ARGOS_MASCOT_MOTION_AUTHORIZATION.md)  
- [ARGOS_VISUAL_FREEZE_21_6B.md](./ARGOS_VISUAL_FREEZE_21_6B.md)  
- [ARGOS_DESIGN_DIRECTOR_BRIEF.md](./ARGOS_DESIGN_DIRECTOR_BRIEF.md)  

---

## 10. Explicit non-authorization

This freeze does **not** authorize:

- production mascot system integration  
- generative mascot frames or batch V1 raster pipelines  
- editing PNGs under `frontend/public/mascots/`  
- committing `mascots-motion-lab/` (REJECTED_PIPELINE_EVIDENCE)  
- committing `wordpress-export/assets/mascots copia.zip`  
- reintroducing WALK without a new human gate  

```
FINAL_GATE = LOW_MOTION_LAB_FROZEN
PRODUCTION_CHANGED = NO
```
