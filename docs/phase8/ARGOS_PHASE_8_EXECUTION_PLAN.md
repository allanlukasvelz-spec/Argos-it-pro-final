# ARGOS Phase 8 — Execution Plan

```
STATUS = PLANNING ONLY
ALL SUB-PHASES: IMPLEMENTATION_AUTHORIZED = NO
```

---

## Overview

| Phase | Name | Deliverable |
|-------|------|-------------|
| 8A | Audit + threat model | Sign-off doc, renderer choice |
| 8B | Data model + job model | Migrations 007-009, platform_jobs worker skeleton |
| 8C | Report core | ReportRun state machine, queue enqueue |
| 8D | First report producer | INCIDENT_SUMMARY generator |
| 8E | Evidence artifact integration | PDF via EvidenceService |
| 8F | Client reports UI | `/dashboard/informes` functional |
| 8G | In-app notifications | inbox + REPORT_READY |
| 8H | NOC reports/delivery | `/noc/reports`, deliveries view |
| 8I | Optional email adapter | **HUMAN APPROVAL REQUIRED** |
| 8J | Red team + E2E + freeze | Phase 8 status doc |

---

## 8A — Audit + threat model

**Goal:** Lock MVP scope and security baseline.

Tasks:
- [ ] Human sign-off MVP report type (Incident Summary)
- [ ] PDF library evaluation (puppeteer vs pdfkit vs others)
- [ ] Template engine security review
- [ ] Confirm ADR-004 worker deployment model
- [ ] Update capability matrix row 25/31

Exit gate: `ARGOS_PHASE_8_HUMAN_DECISIONS.md` signed items checked.

---

## 8B — Data model + job model

**Goal:** Durable async foundation.

Tasks:
- [ ] Migration 007 reports + report_runs
- [ ] Migration 008 notifications*
- [ ] Migration 009 platform_jobs + dead_letter
- [ ] Worker entrypoint with CLAIM/ACK pattern
- [ ] Stale job reclaim loop
- [ ] Tests: job idempotency

Exit gate: worker processes test job without blocking API.

---

## 8C — Report core

**Goal:** State machine + enqueue API.

Tasks:
- [ ] ReportRunService (status transitions)
- [ ] POST client/noc report request → QUEUED job
- [ ] GET list/detail endpoints (empty runs OK)
- [ ] FAILED never READY guards

---

## 8D — First report producer

**Goal:** Real data → report model JSON.

Tasks:
- [ ] Query layer: incident + events + alerts + assets + evidence refs
- [ ] UNKNOWN section builder
- [ ] data_freshness computation
- [ ] Unit tests: deterministic output for fixture DB

---

## 8E — Evidence artifact integration

**Goal:** PDF in object store.

Tasks:
- [ ] HTML template v1.0.0
- [ ] PDF render pipeline
- [ ] EvidenceService.store with retentionClass REPORT
- [ ] Link evidence_object_id on READY
- [ ] Content stream endpoint

---

## 8F — Client reports UI

**Goal:** Replace placeholder.

Tasks:
- [ ] Reports list page
- [ ] Status badges
- [ ] Download/view READY
- [ ] FAILED honest state
- [ ] E2E update `client-portal.spec.ts` informes

---

## 8G — In-app notifications

**Goal:** First channel live.

Tasks:
- [ ] notification_events + notifications on REPORT_READY / INCIDENT_*
- [ ] delivery worker IN_APP adapter
- [ ] Client inbox UI (header bell or /dashboard/notifications)
- [ ] PATCH read
- [ ] Preferences CRUD minimal
- [ ] Dedupe tests

---

## 8H — NOC reports/delivery

**Goal:** Operator visibility.

Tasks:
- [ ] `/noc/reports` functional
- [ ] Cross-tenant list + retry
- [ ] `/api/noc/deliveries` FAILED view
- [ ] security_logs audit on cross-tenant generate

---

## 8I — Optional email (DEFER default)

**Only if explicitly approved.**

Tasks:
- [ ] SMTP adapter with header injection guards
- [ ] Verified email destination
- [ ] Opt-in preferences
- [ ] Separate security review

---

## 8J — Red team + E2E + freeze

Tasks:
- [ ] Cross-tenant IDOR tests
- [ ] FAILED/READY invariant tests
- [ ] Notification dedupe tests
- [ ] E2E report generate → download
- [ ] `docs/architecture/ARGOS_PHASE_8_STATUS.md`
- [ ] PHASE_8_EXECUTED = YES (only after human gate)

---

## Critical path

```
8A (decisions) → 8B (jobs) → 8C (state machine) → 8D (queries)
     → 8E (PDF+evidence) → 8F (client UI)
     → 8G (notify) → 8H (NOC) → 8J (freeze)
```

8G can start after 8C (event model) but full value needs 8E READY.

---

## Dependencies (external)

| Dependency | Phase | Decision |
|------------|-------|----------|
| PDF library | 8A/8E | BUILD evaluate |
| Email SMTP | 8I | INTEGRATE defer |
| Production S3 pin | before prod | INFRA |

No new dependencies authorized in this planning gate.

---

## Estimated risk

| Risk | Mitigation |
|------|------------|
| PDF non-determinism | fixed templates + pinned renderer version |
| Worker ops complexity | start single worker process, same repo |
| Alert notification noise | strict MVP event list |
| Scope creep to Phase 9 | explicit OUT list in master plan |

---

## Rollback strategy

- Feature flag `ENABLE_REPORTS=false` default until 8J
- Migrations reversible via `_down.sql`
- Placeholder UI restorable if flag off
