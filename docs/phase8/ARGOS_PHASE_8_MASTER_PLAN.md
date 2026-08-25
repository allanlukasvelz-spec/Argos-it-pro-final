# ARGOS Phase 8 — Master Plan

```
STATUS = PLANNING ONLY
IMPLEMENTATION_AUTHORIZED = NO
PHASE_8_EXECUTED = NO
DATE = 2026-08-26
BRANCH = feature/argos-multitenant-platform
HEAD_BASELINE = 3114290
PREVIOUS_GATE = OBJECT_STORAGE_FOUNDATION PASS, REAL_MINIO_ROUNDTRIP PASS
```

---

## 0. Mission

Design Phase 8 **before** implementing it.

Phase 8 defines production-suitable architecture for:

| Domain | Scope |
|--------|-------|
| A | Reporting |
| B | Notifications |
| C | Historical evidence intelligence |
| D | Delivery lifecycle |
| E | Client / NOC visibility |
| F | Auditability |
| G | Failure recovery |

**Out of scope:** Phase 9 preventive intelligence, AI prediction, remote execution/remediation, arbitrary automation expansion.

---

## 1. Current checkpoint (verified)

| Gate | Status |
|------|--------|
| Object storage foundation | PASS |
| Real MinIO roundtrip | PASS |
| Default storage | LOCAL |
| MinIO | POC_ONLY |
| Production object storage | NOT_AUTHORIZED |
| Phase 8 runtime | NOT_EXECUTED |
| Remote execution | NO |
| Remote remediation | NO |

---

## 2. What exists today (audit summary)

| Area | Classification |
|------|----------------|
| EvidenceService + evidence_objects | IMPLEMENTED |
| Object store (local + S3 POC) | IMPLEMENTED / POC |
| INCIDENT_EVIDENCE_REFRESH producer | IMPLEMENTED |
| Client/NOC evidence APIs | IMPLEMENTED (no client UI) |
| Reports backend | NOT_IMPLEMENTED |
| Reports UI (`/dashboard/informes`, `/noc/reports`) | PLACEHOLDER |
| Notifications product | NOT_IMPLEMENTED |
| PG job queue | PLANNED (ADR-004) |
| Monitor scheduler (in-process) | IMPLEMENTED |
| Remediation state machine | IMPLEMENTED |
| activity_logs / security_logs | IMPLEMENTED |
| CHICO guardian (explain state) | IMPLEMENTED |
| Formspree (support forms) | PARTIAL (not product notify) |
| Socket.IO alerts | PARTIAL (disabled, no frontend) |

See `ARGOS_PHASE_8_ARCHITECTURE.md` for full capability matrix.

---

## 3. Contradictions reconciled

| Source | Says | CURRENT runtime | Resolution |
|--------|------|-----------------|------------|
| Blueprint DB `reports.file_uri` | Direct URI column | EvidenceService + object_key | Phase 8 uses **evidence_objects link**, not parallel file_uri store |
| Capability matrix row 25 | Reporting MVP = — | Evidence store now exists | MVP reports **authorized in design**; matrix predates evidence foundation |
| Phase 7 validation doc | PHASE_8_RECOMMENDATION = HOLD | Object storage PASS since | **HOLD lifted for planning**; implementation still requires human gate |
| Blueprint `notifications` single table | channel/template/state | Needs deliveries, prefs, dedupe | Expand model in Phase 8 DATA_MODEL; do not use blueprint table verbatim |
| ADR-004 | PG jobs before Redis/Temporal | In-process scheduler only | Phase 8 workers adopt PG queue pattern |

**Rule:** Code/runtime CURRENT wins over stale planning docs. Historical docs are not silently rewritten.

---

## 4. Phase 8 target scope

### IN

- Report lifecycle (query → render → store → access)
- Notification lifecycle (event → policy → deliver → audit)
- Evidence references in reports (provenance, not copy-all)
- Client `/dashboard/informes`
- NOC `/noc/reports` + delivery visibility
- In-app notifications (MVP channel)
- PostgreSQL job queue for async work
- Idempotency, retry, dead-letter design

### OUT

- Phase 9 preventive intelligence
- AI prediction / scoring invention
- WhatsApp / SMS (unless explicitly approved later)
- Remote execution / remediation
- Production MinIO/S3 deployment
- Second file storage mechanism
- Malware scanner integration

---

## 5. Architecture principles

1. **ARGOS owns truth** — reports derive from authoritative PG + evidence_objects; no invented percentages or fake security scores.
2. **UNKNOWN stays UNKNOWN** — reports must not imply HEALTHY/PROTECTED without evidence.
3. **EvidenceService for artifacts** — PDF/HTML bytes via existing object store; no parallel blob path.
4. **Tenant isolation everywhere** — generation, read, notify, delivery all scoped by organization_id.
5. **Async by default** — report generation and outbound delivery never block HTTP request threads.
6. **CHICO explains, does not deliver** — guardian surfaces verified state; not notification engine.
7. **Fail closed** — FAILED generation never marked READY; delivery failure independent of report READY.

---

## 6. MVP definition (recommended)

| Component | MVP |
|-----------|-----|
| Report types | **Incident Summary Report** (one org, one incident or rolling 7-day window) |
| Formats | HTML canonical render → PDF artifact stored in EvidenceService |
| Metadata | reports + report_runs tables |
| Client UI | List, view status, download/view artifact |
| NOC UI | Cross-tenant list, run state, retry, failure reason |
| Notifications | **IN_APP only** |
| Trigger events | REPORT_READY, INCIDENT_OPENED, INCIDENT_CRITICAL, INCIDENT_RESOLVED |
| Job model | PostgreSQL queue + worker process |
| Email / webhook | DEFER to 8I (optional, human-approved) |

**Justification:** Incident Summary leverages existing incidents, incident_events, alerts, and INCIDENT_EVIDENCE_REFRESH evidence chain — highest traceability, lowest invented-data risk.

---

## 7. Document map

| Document | Purpose |
|----------|---------|
| `ARGOS_PHASE_8_ARCHITECTURE.md` | System design, pipelines, boundaries |
| `ARGOS_PHASE_8_MENTAL_MAP.md` | Quick orientation |
| `ARGOS_PHASE_8_REPORTING_MODEL.md` | Report types, sources, lifecycle |
| `ARGOS_PHASE_8_NOTIFICATION_MODEL.md` | Events, channels, delivery |
| `ARGOS_PHASE_8_DATA_MODEL.md` | Proposed tables (no migrations yet) |
| `ARGOS_PHASE_8_API_CONTRACT.md` | Client/NOC endpoints (design only) |
| `ARGOS_PHASE_8_SECURITY_MODEL.md` | Threat model T1–T22 |
| `ARGOS_PHASE_8_FAILURE_MATRIX.md` | A/B/C failure classes |
| `ARGOS_PHASE_8_EXECUTION_PLAN.md` | Sub-phases 8A–8J |
| `ARGOS_PHASE_8_IMPLEMENTATION_MAP.html` | Visual CURRENT/TARGET/FUTURE |
| `ARGOS_PHASE_8_HUMAN_DECISIONS.md` | Decisions requiring sign-off |

---

## 8. Readiness gate (pre-implementation)

```
PHASE_8_IMPLEMENTATION_AUTHORIZED = NO
PRE_IMPLEMENTATION_GATE = GO_FOR_HUMAN_REVIEW
```

**Blockers cleared for planning:**

- Evidence store interface exists
- Producer pattern proven
- Tenant isolation patterns proven (Phases 0–7)

**Blockers remaining for implementation:**

- Human approval of MVP scope
- PG worker process design approval
- PDF library selection
- Email provider decision (if 8I)
- Production object storage pin (if reports in prod use S3)

---

## 9. Success criteria (for future implementation gate)

- [ ] One report type generates deterministic artifact via EvidenceService
- [ ] Client sees only own-org reports
- [ ] NOC sees cross-tenant with audit
- [ ] In-app notification on REPORT_READY
- [ ] Idempotent generation (same key → same or single artifact)
- [ ] FAILED never exposed as READY
- [ ] E2E covers placeholder → functional transition for `/dashboard/informes`
- [ ] Red team: cross-tenant read/generate blocked
- [ ] No secrets in report artifacts or notification payloads

---

## 10. Explicit non-actions (this gate)

- NO runtime code
- NO migrations
- NO new dependencies
- NO Docker changes
- NO push / PR / merge / deploy
- NO production changes
