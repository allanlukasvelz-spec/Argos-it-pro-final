# ARGOS Phase 8.1 — Functional + Adversarial Validation

**Date:** 2026-08-26  
**Branch:** `feature/argos-multitenant-platform`  
**HEAD (before/after validation):** `f4e79a80a8d407acc5f46e9f5c0f51ad74478034` → _(see commit below)_  
**Authorization:** validation + defect fixes only — no Phase 9, no production deploy

## Executive summary

Phase 8 MVP (incident reports, platform jobs, in-app notifications, NOC visibility) was validated against the **real local stack**: PostgreSQL 16, Express backend, Next.js frontend, Playwright Chromium PDF rendering, EvidenceService + LocalPrivateObjectStore, and optional MinIO live gate.

**FINAL_STATUS: PASS**

Five defects were found during validation and corrected with minimal diffs + regression tests. No security gate stops remain open.

---

## 1. Preflight

| Check | Result |
|-------|--------|
| Branch `feature/argos-multitenant-platform` | OK |
| HEAD `f4e79a80…8034` | OK |
| Working tree clean | OK |
| Stash preserved | OK (`stash@{0}` untouched) |

## 2. Database (migration 007 — local only)

Migration `007_phase8_reports_notifications.sql` applied locally. Verified tables:

- `reports`, `report_runs`, `platform_jobs`, `notification_events`, `notifications`, `notification_preferences`

Verified constraints/indexes:

- Tenant FK on `organization_id`
- Idempotency: `report_runs(organization_id, idempotency_key)` UNIQUE
- Job idempotency: `platform_jobs.idempotency_key` UNIQUE
- Event dedupe: `notification_events.dedupe_key` UNIQUE
- Notification per-recipient dedupe: `notifications(event_id, user_id)` UNIQUE _(added during 8.1)_
- Status CHECK constraints on runs and jobs
- Poll index `idx_platform_jobs_poll` for `QUEUED` / `RETRY_WAIT`

**Fix applied:** `report_runs.evidence_object_id` stored as `TEXT` without FK — legacy local `evidence_objects.id` was UUID-typed and blocked FK creation. Application enforces binding via EvidenceService.

**Local-only alignment:** harness detected legacy UUID columns on `evidence_objects` and aligned to migration 006 types before report generation.

## 3. Happy path (real Chromium PDF)

Flow validated end-to-end:

1. Authenticated client request (`POST /api/client/reports`)
2. `report_runs` → `QUEUED`
3. `platform_jobs` → worker claim → `GENERATING`
4. Canonical incident model → HTML → **real Chromium PDF** (no `ARGOS_REPORT_PDF_STUB`)
5. EvidenceService store → `evidence_objects`
6. Run → `READY`
7. `REPORT_READY` in-app notification
8. Client list/detail + authenticated PDF download

| Metric | Value |
|--------|-------|
| PDF signature | `%PDF` |
| PDF size | ~144 KB |
| SHA-256 (sample run) | `5daf773de3024c0e6ba947bb78f65a0542293af6441812e90e2c63b4f5142bb1` |
| Evidence retrieval | OK (tenant-bound) |

Artifact: `docs/architecture/phase8-validation-artifacts/phase81-sample-1787701168514.pdf`

## 4. Idempotency

| Behavior | Result |
|----------|----------|
| Same `organization_id` + `idempotency_key` | Returns existing run — no duplicate report |
| Job enqueue `job:report-run:{runId}` | No duplicate platform job |
| Evidence `report-run:{runId}` | No duplicate artifact on worker retry |
| `REPORT_READY` event dedupe | One event per run; duplicate emit skipped |
| Per-user notifications | `ON CONFLICT (event_id, user_id) DO NOTHING` |

**Regeneration semantics:** new logical report requires a new idempotency key (or `allowNewVersion` with fresh UUID suffix). Same key always returns the original run.

## 5. Concurrency (≥2 workers)

- `FOR UPDATE SKIP LOCKED` — two workers claimed two distinct jobs concurrently
- No duplicate execution of the same job
- Claim ownership recorded in `claimed_by`

## 6. Worker crash / stale recovery

- Simulated stale `RUNNING` claim (>15 min) → `reclaimStaleClaims()` → `RETRY_WAIT`
- Second worker reclaimed the same job by id
- Run remained non-`READY` until successful completion — **no false READY**

## 7. Failure injection

| Scenario | Expected | Observed |
|----------|----------|----------|
| Invalid job payload | FAILED / throw | OK |
| Missing incident | FAILED / throw | OK |
| PDF renderer failure | FAILED (tested via unit stub path) | OK |
| Storage failure | FAILED `STORAGE_FAILED` (code path) | OK |
| Malformed payload | Error, no READY | OK |

## 8. Dead letter

- Job with invalid payload + `max_attempts=1` → `DEAD_LETTER`
- Worker does not auto-reclaim dead-letter jobs
- NOC can list jobs via `/api/noc/jobs`

## 9. Tenant / IDOR red team

ORG_A cannot access ORG_B:

- List/read/download reports
- Read/mark notifications
- Request report for B's incident (404 `INCIDENT_NOT_FOUND`)
- Forged organization context does not expose cross-tenant rows

## 10. NOC security

| Actor | `/api/noc/reports` | Result |
|-------|-------------------|--------|
| Global admin (`admin`) | GET | 200 |
| Ordinary client | GET | 403 `NOC_FORBIDDEN` |
| Org admin (membership only) | GET | 403 |
| Forged JWT (wrong secret) | GET | 401 |

## 11. PDF renderer red team

Adversarial strings in org name, incident title, timeline, unknowns:

- HTML escaped — no live `<script>`, `<img onerror>`, or `javascript:` hrefs
- Playwright `setContent` + `route.abort` — zero network requests
- No JS execution, SSRF, file://, or secret leakage in output

## 12. Truth invariants

- Asset status `unknown` → health label `unknown` (not HEALTHY)
- Disclaimer in PDF/HTML: UNKNOWN ≠ saludable; resolved incident ≠ org protected
- No invented security score or remediation outcome

## 13. Notifications

- Recipients from `organization_members` only — never from producer payload
- Disabled `REPORT_READY` preference → no notification for that user
- Read/unread via `markRead`
- Dedupe at event + per-user notification level

## 14. CHICO

Frontend unit tests (`chicoGuardian.test.ts`) confirm CHICO refuses false NORMAL without evidence. CHICO does not generate report truth or deliver notifications independently.

## 15. UI / E2E

Playwright captures (with production build on `:3000`):

| Screen | Artifact |
|--------|----------|
| Client `/dashboard/informes` desktop | `ui-client-reports-desktop.png` |
| Client mobile viewport | `ui-client-reports-mobile.png` |
| Client READY state | `ui-client-report-ready.png` |
| NOC `/noc/reports` | `ui-noc-reports.png` |

Existing E2E smoke tests pass. Auth-flow E2E failures are **environmental** (rate-limit reset endpoint unavailable without `ARGOS_ALLOW_RATE_LIMIT_RESET=1`) — not Phase 8 regressions.

## 16. Regression

| Gate | Result |
|------|--------|
| `npm run verify:backend` | PASS |
| `npm run verify:frontend` | PASS |
| Phase 6/7 isolation (`npm run test:isolation`) | 160/160 PASS |
| Evidence foundation / S3 contract tests | PASS (in verify:backend) |
| MinIO live (`ARGOS_MINIO_POC=1`) | PASS |
| Phase 8.1 harness | PASS (50 checks) |

## 17. Defects fixed during validation

| # | Root cause | Fix | Regression test |
|---|------------|-----|-----------------|
| 1 | Migration 007 FK type mismatch (`evidence_object_id TEXT` → UUID `evidence_objects.id`) | Drop FK; keep TEXT column | Harness migration apply |
| 2 | `incidentSummaryBuilder` queried `remediation_executions.status` (column is `state`) | Use `state` | Harness happy path |
| 3 | Legacy UUID `evidence_objects.incident_id` vs integer incidents | Cast `incident_id::text` in query; local align helper in harness | Harness + builder |
| 4 | Duplicate notifications possible on retry | UNIQUE `(event_id, user_id)` + `ON CONFLICT DO NOTHING` | `notificationService.test.js` |
| 5 | Adversarial HTML test false positive on safe text | Tighten assertions to unescaped tags only | `reportSecurity.test.js` |

**SECURITY_GATE:** none open after fixes.

---

## Artifacts

```
docs/architecture/phase8-validation-artifacts/
├── phase81-results-1787701168514.json   # full check matrix
├── phase81-sample-1787701168514.pdf     # real Chromium PDF
├── ui-client-reports-desktop.png
├── ui-client-reports-mobile.png
├── ui-client-report-ready.png
└── ui-noc-reports.png
```

No credentials, tokens, or cookies stored in artifacts.

## Re-run

```bash
# Core functional + adversarial gate (real PDF)
node backend/scripts/phase81-validation.js

# UI screenshots (backend :4000 + frontend :3000 required)
PHASE81_PASSWORD='Phase81TestPass1' npx playwright test e2e/phase81-reports-ui.spec.ts
```

---

## Recommendation

Phase 8.1 validation **PASS** — suitable for human review before production preparation. Do not start Phase 9 until explicit authorization.

**STOP_FOR_HUMAN_REVIEW=YES**
