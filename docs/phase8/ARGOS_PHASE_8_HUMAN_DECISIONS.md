# ARGOS Phase 8 — Human Decisions

```
STATUS = AWAITING SIGN-OFF
IMPLEMENTATION_AUTHORIZED = NO
```

Decisions below must be explicitly approved before sub-phase implementation begins.

---

## D1 — MVP report type

| Option | Recommendation |
|--------|----------------|
| Incident Summary (single incident) | **RECOMMENDED** |
| Security Summary (period aggregate) | V1 |

**Decision:** `[ ] APPROVED  [ ] HOLD  [ ] MODIFY`

Signed: _________________ Date: _______

---

## D2 — PDF rendering library

| Option | Pros | Cons |
|--------|------|------|
| Puppeteer/headless Chrome | High fidelity HTML→PDF | Heavy dep, ops |
| PDFKit programmatic | Light, deterministic | Layout effort |
| react-pdf | React alignment | SSR complexity |

**Decision:** `[ ] Puppeteer  [ ] PDFKit  [ ] Other: _____  [ ] HOLD`

Signed: _________________ Date: _______

---

## D3 — PostgreSQL job queue (ADR-004)

Confirm worker as separate process in same repo.

**Decision:** `[ ] APPROVED  [ ] HOLD  [ ] Use alternative: _____`

Signed: _________________ Date: _______

---

## D4 — MVP notification channels

| Channel | Include MVP? |
|---------|--------------|
| IN_APP | Recommended YES |
| EMAIL | Recommended NO (8I) |

**Decision:** `[ ] APPROVED as designed  [ ] Include EMAIL in MVP  [ ] HOLD`

Signed: _________________ Date: _______

---

## D5 — Client-initiated report generation

| Option | Description |
|--------|-------------|
| A | Client can request Incident Summary for own incidents |
| B | NOC-only generation in MVP |

**Recommendation:** A (limited to own org)

**Decision:** `[ ] A  [ ] B  [ ] HOLD`

Signed: _________________ Date: _______

---

## D6 — Production object storage for report artifacts

Reports in production require pinned S3/MinIO (not `latest`).

**Decision:** `[ ] Local only until prod pin  [ ] Approve prod S3 timeline: _____  [ ] HOLD`

Signed: _________________ Date: _______

---

## D7 — Phase 8 implementation authorization

Master gate to begin 8A runtime work.

**Decision:** `[ ] IMPLEMENTATION_AUTHORIZED=YES  [ ] HOLD`

Conditions attached: _______________________________

Signed: _________________ Date: _______

---

## D8 — Phase 9 boundary reaffirmation

Confirm Phase 8 does not include preventive intelligence.

**Decision:** `[ ] CONFIRMED  [ ] HOLD`

Signed: _________________ Date: _______

---

## Planning gate completion

| Item | Status |
|------|--------|
| Architecture docs complete | YES |
| Threat model reviewed | PENDING human |
| MVP scope agreed | PENDING D1 |
| IMPLEMENTATION_AUTHORIZED | **NO** |
