# ARGOS Phase 8 — Failure Matrix

```
STATUS = PLANNING ONLY
CLASSIFICATION = A (fail closed) | B (retry) | C (degrade with audit)
```

---

## 1. Report generation failures

| Scenario | Class | Behavior | User-visible |
|----------|-------|----------|--------------|
| A. Query/data source fails | **A** | status=FAILED; never READY | "Report could not be generated" |
| B. Render/template fails | **B** | retry up to max; then FAILED | GENERATING → FAILED |
| C. EvidenceService put fails | **A** | FAILED; no download link | FAILED + retry option (NOC) |
| D. DB commit after put fails | **A** | orphan compensation via EvidenceService delete pattern | FAILED; reconciliation |
| E. Notification after READY fails | **C** | report stays READY; delivery retries | report available; notify delayed |
| F. Partial data (missing TLS) | **C** | generate with UNKNOWN section | report READY with explicit unknowns |
| G. Worker crash mid-GENERATING | **B** | reclaim stale job; retry | stuck → retry |
| H. Idempotency collision | **C** | return existing READY run | 200 replay |
| I. Quota exceeded (evidence) | **A** | FAILED QUOTA | sanitized message |
| J. CHECKSUM mismatch on re-read | **A** | FAILED integrity; audit | do not serve |

---

## 2. Notification delivery failures

| Scenario | Class | Behavior |
|----------|-------|----------|
| Provider unavailable | **B** | RETRY_WAIT → retry |
| Invalid destination | **A** | FAILED; no retry (bad email) |
| Rate limit | **B** | backoff retry |
| Timeout | **B** | retry with jitter |
| Duplicate event | **C** | dedupe skip; audit |
| Queue crash | **B** | jobs persist in PG; reclaim |
| Worker restart | **B** | reclaim CLAIMED stale |
| DB unavailable | **A** | fail job; alert ops |
| IN_APP insert fails | **B** | retry delivery row |

---

## 3. Dead letter policy

Enter DEAD_LETTER when:
- `attempts >= max_attempts`
- invalid destination confirmed
- webhook SSRF block (future)

Exit only via human-reviewed NOC retry.

---

## 4. Compensation / reconciliation

| Divergence | Detection | Repair |
|------------|-----------|--------|
| report_run READY but no evidence_object | reconciliation job | mark FAILED |
| evidence_object without report_run | reconciliation | orphan evidence path (existing) |
| delivery SENDING stale > 15m | worker sweep | reclaim or FAIL |

Reuse patterns from `evidenceReconciliation.js` — dry-run first.

---

## 5. Client vs NOC error visibility

| Error detail | Client | NOC |
|--------------|--------|-----|
| error_code | YES | YES |
| error_message | sanitized | full |
| stack trace | NEVER | NEVER in UI (logs only) |
| evidence_object_id | NO | YES |
| delivery last_error | NO | YES |

---

## 6. Failure test requirements (future)

- Inject PG query failure → FAILED not READY
- Inject put failure → no artifact link
- Kill worker mid-GENERATING → reclaim
- Duplicate REPORT_READY event → single notification
- Cross-tenant content request → 403

---

## 7. Silent fallback forbidden

| Forbidden | Why |
|-----------|-----|
| FAILED → show old READY run without label | stale misrepresentation |
| s3 → local store for reports | split brain |
| Skip UNKNOWN sections | false confidence |
| Auto-delete failed runs | audit loss |
