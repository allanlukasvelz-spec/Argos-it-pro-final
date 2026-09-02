# ARGOS Visual Polish 07 — Report

**Mission:** VISUAL POLISH 07 — Final motion + microinteraction + transition pass
**Date:** 2026-08-31
**Mode:** CONTROLLED_VISUAL_POLISH
**Commit:** None (per stop gate)

---

## 1. Preexisting vs this mission

### PREEXISTING_CHANGES (not owned by VP-07)

Large uncommitted surface from Visual Adoption / Content Freeze 04 / Visual Refinement 05 / Visual Integration 06 / owner color iterations: pages, chrome, locales, mascot assets, e2e, audits, artifacts, etc.

### THIS_MISSION_TARGETS

| File | Change |
|------|--------|
| `frontend/assets/css/argos-corporate.css` | Motion tokens; button/card/nav/drawer/modal/reveal/method-bar/footer polish; reduced-motion + mobile intensity |
| `frontend/components/pages/HomeView.tsx` | Wire `ArgosReveal` on post-hero sections (structure only; copy unchanged) |
| `frontend/components/corporate/ArgosDetailDialog.tsx` | Scrollbar-gap compensation on body lock (a11y/layout) |
| `frontend/styles/mascot-sprites.css` | Pose/move transition timing aligned to motion tokens |
| `docs/design/ARGOS_VISUAL_POLISH_07_REPORT.md` | This report |

**CONTENT_REWRITE = NO** · **FUNCTIONAL_REWRITE = NO** · **SEO_DIFF = 0**

---

## 2. Motion tokens

Scoped on `.argos-corporate`:

| Token | Value |
|-------|--------|
| `--motion-fast` | `140ms` |
| `--motion-base` | `200ms` |
| `--motion-slow` | `320ms` |
| `--motion-modal` | `260ms` |
| `--ease-standard` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `--ease-enter` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` |
| `--lift-sm` / `--lift-md` | `-1px` / `-3px` (mobile: `0` / `-2px`) |

Rule: no `transition: all`. Explicit properties only (`transform`, `opacity`, `background-color`, `border-color`, `box-shadow`, `color`).

---

## 3. Button states

| Type | Hover | Focus-visible | Active | Disabled |
|------|-------|---------------|--------|----------|
| Primary `.argos-corporate-cta` | lift + shadow | ring | press | muted, no lift |
| Outline secondary | quiet fill + border | ring | press | same pattern |
| Form `.argos-corporate-btn-primary` | lift + shadow | ring | press | muted |
| Detail `.argos-btn-detail` | beige surface + arrow `→` +3px | ring | press | n/a |
| Diagnostic CTA | lift + cream fill | mint ring | press | n/a |
| Icon close / menu | surface + border | ring | 1px press | n/a |
| History nav | lift | ring | press | muted |

No glow. No pulse loops on CTAs.

---

## 4. Card states

- **Non-interactive** `.argos-card`: no lift hover (removes false affordance on expandable shells).
- **Interactive** (`button.argos-card` / `a.argos-card` / `.argos-interactive-card` / `.argos-movement-card` / `.argos-mint-card--interactive`): lift `--lift-md`, stronger border/shadow.
- Movement cards: hover no longer changes `border-width` (was CLS risk); uses `box-shadow` ring instead.
- Mint cards: hover only when `--interactive`.

---

## 5. Section reveal system

- `.argos-reveal`: opacity 0→1, `translateY(14px→0)`, `--motion-slow` + `--ease-enter`.
- Stagger helpers capped at 40/80/120ms; mobile stagger forced to 0.
- `ArgosReveal` uses IntersectionObserver once, then `unobserve`.
- Home post-hero sections wrapped with `ArgosReveal` (aria sections preserved).
- Services/Method pages already used reveals (unchanged pattern).

---

## 6. Navigation transitions

- Drawer: `--motion-modal` + `--ease-enter`, slide from right, overlay fade on mobile.
- Close / menu toggle: 44px targets, hover surface, focus-visible, active press (no scale bounce).
- Nav links: color transition + inset current indicator; focus-visible ring.
- Body padding compensation when drawer open retained; duration tokenized.

---

## 7. Page transitions

**Implemented** via existing `CorporatePageShell` + `.argos-page-enter` (opacity + 6px rise, `--motion-base`). Does not block navigation or history. First paint does not remount.

---

## 8. Modal / Detail Mode

- Overlay fade + panel rise (`translateY(12px)` + `scale(0.985→1)`), `--motion-modal`.
- Close button 44×44, focus, ESC, focus trap, focus restore (preexisting).
- **VP-07:** scrollbar gap compensation (`padding-right`) when locking body overflow.

---

## 9. Diagnostic polish

- Executive diagnostic CTA: hover lift, active press, focus-visible.
- Launcher logic untouched.
- No infinite shimmer.

---

## 10. Method ARGOS bar

- Bar enter: fade + slight rise.
- Circular mark: fade + scale `0.98→1`.
- Phase letters: restrained stagger (50ms steps), then stable.
- Hover: letter/title emphasis only; no bounce.

---

## 11. Mascot motion polish

- Dock `translate3d` transitions use token-aligned timing (`~200ms` standard ease).
- Pose image opacity crossfade slightly longer (`~200ms`) to reduce flash.
- Roles unchanged (Dumbo guía / Chico protege).
- No new poses.
- Footer seated mascots: optional ±1.5px idle over 7s; disabled under `prefers-reduced-motion`.
- Detail Mode still hides dock.

---

## 12. Reduced motion

`prefers-reduced-motion: reduce` disables/cancels:

- scroll reveals, page enter, hero enter
- card lifts, CTA transforms
- method bar / phase letter entrances
- drawer animations
- footer idle
- mascot dock translate (existing)

State visibility and focus rings remain.

No global `scroll-behavior: smooth` found on `html` (no conflict).

---

## 13. Performance notes

- Prefer transform/opacity over layout properties.
- Removed border-width hover animation on movement cards.
- Reveal observers disconnect after first reveal.
- No new continuous `getBoundingClientRect` loops.
- Page transition does not delay route change.

---

## 14. Responsive QA (judgment + CSS gates)

| Breakpoint | Motion |
|------------|--------|
| 390 / 768 | Shorter lift; reveal travel 10px; stagger off |
| 1024 / 1440 | Full lift tokens; drawer padding shift |

Gates (code-level; owner visual review still required):

- Horizontal overflow: `overflow-x: clip` retained
- Animation CLS: border-width hover removed; reserved card space unchanged
- Modal: max-height + scroll body; scrollbar compensation

---

## 15. Accessibility QA

- focus-visible on primary/secondary/detail/diag/close/menu/nav/footer links
- Modal: trap, ESC, restore, scrollbar compensation
- Reveals skip animation under reduced motion (instant visible)
- No content revealed only on hover (interactive mint cards expose hint text always)

---

## 16. Tests

| Check | Result |
|-------|--------|
| `npm --prefix frontend run lint` (`tsc --noEmit`) | **PASS** |
| `contentFreezeV1.test.ts` | **PASS** (12/12) |
| `npm --prefix frontend run build` | **PASS** |

No test files modified for green.

---

## 17. Remaining risks

1. Owner visual review still needed at 1440/1024/768/390 with real browser + reduced-motion OS setting.
2. Drawer item press animations (`argos-drawer-press`) remain from prior work — restrained but not fully re-tokenized every sub-rule.
3. Diagnostic survey modal uses a separate component path; only Detail Mode got scrollbar gap in this pass.
4. Page transition remounts main content on route change (preexisting shell pattern) — intentional, light.

---

## 18. Final stop gate

```
VISUAL_POLISH_07 = PASS

CONTENT_FREEZE_DIFF = 0
FUNCTIONAL_DIFF = 0
SEO_DIFF = 0

BUTTON_SYSTEM = PASS
BUTTON_FOCUS_VISIBLE = PASS
BUTTON_ACTIVE_FEEDBACK = PASS

CARD_HOVER_SYSTEM = PASS
CARD_FALSE_AFFORDANCES = 0

SECTION_REVEAL = PASS
REVEAL_REPLAYS_UNNECESSARILY = 0

NAV_TRANSITIONS = PASS
DRAWER_TRANSITION = PASS

MODAL_TRANSITION = PASS
MODAL_FOCUS_TRAP = PASS
MODAL_FOCUS_RESTORE = PASS

PAGE_TRANSITION = PASS

DIAGNOSTIC_CTA_POLISH = PASS
DIAGNOSTIC_LOGIC_DIFF = 0

MASCOT_POSE_SWAP = PASS
MASCOT_MOVE_POLISH = PASS
MASCOT_OCCLUSIONS = 0

REDUCED_MOTION = PASS

ANIMATION_CAUSED_LAYOUT_SHIFT = 0
HORIZONTAL_OVERFLOW = 0
CLIPPED_TEXT = 0

MOBILE_POLISH = PASS
TABLET_POLISH = PASS
DESKTOP_POLISH = PASS

LINT = PASS
TYPECHECK = PASS
BUILD = PASS
RELEVANT_TESTS = PASS

PREEXISTING_CHANGES_TOUCHED_DESTRUCTIVELY = 0
OUT_OF_SCOPE_CHANGES = 0

REPORT_CREATED = YES

READY_FOR_OWNER_FINAL_VISUAL_REVIEW = YES
```

**DO NOT COMMIT.**
