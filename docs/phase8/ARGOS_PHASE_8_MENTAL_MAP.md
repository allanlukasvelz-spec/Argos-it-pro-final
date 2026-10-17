# ARGOS Phase 8 — Mental Map

```
One-page orientation — PLANNING ONLY
```

---

## The question Phase 8 answers

> How does ARGOS turn **authoritative operational data** into **auditable reports** and **trustworthy notifications** for Client and NOC — without inventing truth, leaking tenants, or creating a second storage stack?

---

## Three pipelines

```
REPORTING:   Data → Query → Render → EvidenceService → Metadata → UI
NOTIFY:      Event → Policy → Recipient → Queue → Deliver → Audit
EVIDENCE:    report_run ──links──► evidence_object_id ──SHA-256──► bytes
```

---

## What we have vs need

| HAVE | NEED (Phase 8) |
|------|----------------|
| incidents, alerts, events | report generator |
| evidence_objects + store | report → evidence link |
| placeholders UI | functional informes/reports |
| activity/security logs | notification audit trail |
| in-process scheduler | PG job queue + worker |
| CHICO explain layer | wire to REPORT_READY |

---

## MVP in one sentence

**Generate an Incident Summary Report as a PDF in EvidenceService, show it on Client/NOC, notify in-app when READY — async via PostgreSQL jobs.**

---

## Hard rules

- UNKNOWN ≠ healthy
- FAILED ≠ READY
- Tenant scope on every query
- No client-visible stack traces
- CHICO does not send mail
- No Phase 9 / no remote exec

---

## Doc index

| Need | Read |
|------|------|
| Scope & gates | MASTER_PLAN |
| Pipelines | ARCHITECTURE |
| Report fields & sources | REPORTING_MODEL |
| Notify events & channels | NOTIFICATION_MODEL |
| Tables (proposed) | DATA_MODEL |
| API shapes | API_CONTRACT |
| Threats | SECURITY_MODEL |
| Failures | FAILURE_MATRIX |
| Build order | EXECUTION_PLAN |
| Visual | IMPLEMENTATION_MAP.html |
| Sign-offs | HUMAN_DECISIONS |
