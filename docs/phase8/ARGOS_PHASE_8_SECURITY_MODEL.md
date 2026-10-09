# ARGOS Phase 8 — Security Model

```
STATUS = PLANNING ONLY
THREAT_MODEL_VERSION = 1.0
DATE = 2026-08-26
```

---

## Threat register

| ID | Threat | L | I | Control | Test | Residual |
|----|--------|---|---|---------|------|----------|
| T1 | Cross-tenant report read | M | C | org_id on every query + middleware | isolation test | L |
| T2 | Cross-tenant report generation | M | C | org_id on POST + NOC audit | red team | L |
| T3 | Report artifact IDOR | M | C | EvidenceService tenant check | IDOR test | L |
| T4 | Signed URL leakage | L | H | No presigned URLs MVP; backend stream | config audit | L |
| T5 | Recipient spoofing | M | H | Resolve from org_members only | unit test | L |
| T6 | Notification spam | M | M | dedupe + rate limits | load test | M |
| T7 | Duplicate delivery | M | M | idempotency keys | replay test | L |
| T8 | Template injection | M | H | allowlist template engine; no user HTML | fuzz | M |
| T9 | HTML/PDF XSS | M | H | sanitize output; CSP on HTML view | security scan | M |
| T10 | Malicious report content | L | M | data from PG only; no user HTML in body | — | L |
| T11 | Email header injection | — | H | defer email; validate when added | — | — |
| T12 | Webhook SSRF | — | C | defer; allowlist URLs when added | — | — |
| T13 | Webhook secret leakage | — | H | defer; encrypt at rest | — | — |
| T14 | Report data overexposure | M | H | field allowlist per report type | review | M |
| T15 | NOC role bypass | L | C | requireNocAccess | auth test | L |
| T16 | Client role escalation | L | C | requireRole + tenant | auth test | L |
| T17 | Preference tampering | M | M | user can only PATCH own prefs | test | L |
| T18 | Dead-letter secret leakage | M | H | payload_redacted column | audit | M |
| T19 | Object-store bypass | L | C | all bytes via EvidenceService | integration | L |
| T20 | False HEALTHY in report | M | H | UNKNOWN invariant; health engine source | content test | M |
| T21 | Stale data as current | M | M | data_freshness field mandatory | test | M |
| T22 | FAILED marked READY | M | C | state machine guards | unit test | L |

L=Likelihood, I=Impact, C=Critical

---

## Security invariants

1. **Tenant isolation** — every report/notification/delivery row has verifiable org scope
2. **No IDOR** — UUID ids validated against org membership before content stream
3. **No recipient spoofing** — destinations from users table only
4. **Fail closed** — generation/storage/checksum failures never expose READY
5. **Audit** — NOC cross-tenant actions in security_logs
6. **Secret redaction** — sanitizeEvidence on all logged payloads
7. **CHICO boundary** — no delivery authority
8. **No anonymous report access**

---

## Security blockers for implementation gate

| Blocker | Status |
|---------|--------|
| EvidenceService tenant isolation proven | CLEAR |
| PDF renderer XSS review | REQUIRED before 8C |
| Template engine choice security review | REQUIRED before 8C |
| Email SSRF/injection (if 8I) | N/A until approved |
| Webhook SSRF allowlist design | REQUIRED before webhook |

---

## Controls mapping

| OWASP-style | Phase 8 control |
|-------------|-----------------|
| Broken access control | tenant middleware + EvidenceService |
| Injection | parameterized SQL; template allowlist |
| XSS | output encoding; sanitize HTML |
| SSRF | no webhooks MVP |
| Security misconfiguration | fail closed states |
| Integrity | SHA-256 on artifacts |

---

## Residual risks (accepted for MVP planning)

- Template injection if renderer choice wrong → mitigate in 8A review
- Notification spam under alert storms → dedupe + severity gates
- Operator error on NOC retry → audit + confirmation UX
