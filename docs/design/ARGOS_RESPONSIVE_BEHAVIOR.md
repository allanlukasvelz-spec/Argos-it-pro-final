# ARGOS Responsive Behavior — Client + NOC

```
STATUS = SPEC_COMPLETE
PUBLIC_RESPONSIVE = OUT_OF_SCOPE (21.6B tablet/mobile freeze still NO for Corporate)
```

Breakpoints (implementation target, not Framer pixels):

| Name | Width | Columns |
|------|-------|---------|
| Mobile | 0–767 | 4 |
| Tablet | 768–1279 | 8 |
| Desktop | ≥1280 | 12 |

Master screens were approved at **desktop**. This document specifies degradation. Do not compress NOC into an unreadable mobile table.

---

## 1. Client Portal — mobile is first-class

The client must be able to check status and incidents on a phone.

### 1.1 Desktop ≥1280

- ClientShell: sidebar 248px persistent + top bar 56px.
- Resumen hierarchy in one scroll: Protection → coverage → controls → assets → alerts/incidents/preventive → activity → shortcuts.
- Asset health as a 5-up row wrapping to 3+2 if needed.
- Alerts / incidents / preventive as 3 columns.

### 1.2 Tablet 768–1279

- Sidebar collapsed to 72px icons; labels in tooltips; optional overlay drawer.
- Asset health 2-column grid.
- Alerts / incidents / preventive stack 1 column or 2+1.
- Coverage + control state stack vertically.
- Touch targets ≥ 44px.

### 1.3 Mobile <768

**Priority order (must remain in this order):**

1. Protection / attention banner (full width)
2. Coverage (covered/monitored)
3. Open incidents (or NO_INCIDENTS_DETECTED)
4. Active alerts
5. Asset health as **list cards** (not a 5-column row)
6. Preventive actions
7. Activity
8. Quick access

- Sidebar hidden. Menu button in top bar opens Drawer with full nav.
- Org name truncates; remains visible.
- No NOC-style queue.
- Horizontal scroll is allowed only as last resort on wide tables (activos); prefer stacked cards.

### 1.4 Client tables

| Viewport | Behavior |
|----------|----------|
| Desktop | Table |
| Tablet | Table with sticky first column **or** cards if <4 columns of meaning |
| Mobile | Card list: primary identifier + status + one action |

---

## 2. Internal NOC — desktop-first

### 2.1 Desktop ≥1280

- Full Command Center: KPIs + OperationalQueue + evidence | safety split + bottom risks/agents.
- Sidebar 224px persistent.
- Queue is the scanning surface; do not hide columns.

### 2.2 Tablet 768–1279

Preserve **evidence and operational safety**, not every column.

- Sidebar collapsed or drawer.
- KPIs: 3×2 wrap, UNKNOWN card keeps dashed treatment.
- Queue: keep `CUSTOMER, SIGNAL, SEVERITY, ACTION, TIME`. Hide `EVIDENCE, STATUS, OWNER` behind row expand / detail pane.
- Selected signal: **stack** EvidencePanel above Safety gates (do not squeeze two dense columns).
- ApprovalGate remains fully readable (no icon-only L3).

### 2.3 Mobile <768

**Not a full Command Center.**

Show:

1. Platform health chip (ARGOS core)
2. Severity queue: CRITICAL → WARNING → UNKNOWN → other
3. Each row: customer · signal · severity · time
4. Tap → drill-down: evidence summary + hypothesis + **Request approval** if L3 + safe-stop note

Do **not**:

- Render 9-column table at 11px
- Hide L3 behind a swipe-only control
- Auto-execute anything

Optional: “Open on desktop for full queue” helper — not a blocker for seeing CRITICAL items.

### 2.4 NOC table overflow

```
desktop  → full OperationalQueue
tablet   → priority columns + drill-down
mobile   → severity list + drill-down
```

Never truncate `APPROVAL REQUIRED` to a red dot.

---

## 3. Shared chrome behavior

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Top bar | full | full, compact freshness | menu + org/operator + avatar |
| Sidebar | persistent | collapsed / drawer | drawer only |
| Page h1 | visible | visible | visible (smaller scale) |
| Focus | 2px ring | 2px ring | 2px ring, larger hit area |

Sidebar collapse is a layout change, not a permission change.

---

## 4. Panels and overlays

- Client mobile: one panel at a time; no stacked modals.
- NOC tablet: queue list **or** detail, with back control; L3 modal still centered and large enough to read evidence.
- Drawers: left for nav; right reserved for future incident detail (not required for master screens).

---

## 5. Motion and orientation

- Drawer 200ms transform; skipped if `prefers-reduced-motion`.
- Landscape mobile Client: still status-first; do not restore desktop table automatically below 768.
- NOC landscape phone: still severity list, not fake desktop.

---

## 6. What Framer did not close

Framer Stage 1 delivered **desktop** masters only. Tablet/mobile here are **specified**, not pixel-approved. Implementation may refine spacing without changing hierarchy or safety rules.

PUBLIC Corporate tablet/mobile remains **not frozen** (21.6B). This file does not authorize a public responsive restyle.
