# ARGOS — External Staging Blockers & Red Team

```
UPDATED = 2026-08-26
LOCAL_STAGING_VALIDATED = YES
EXTERNAL_STAGING_VALIDATED = NO
PRODUCTION_READY = NO
```

Canonical production list: [ARGOS_PRODUCTION_READINESS_BLOCKERS.md](./ARGOS_PRODUCTION_READINESS_BLOCKERS.md).

## B1–B10 reassessment (external staging lens)

| ID | Local status | External staging class | Notes |
|----|--------------|------------------------|-------|
| B1 Scheduler multi-instance | DEFERRED (single owner) | **OPEN** as scale constraint; **NOT_APPLICABLE** if API×1 enforced | Must remain single API scheduler owner externally |
| B2 Worker supervised | RESOLVED locally | **PARTIAL** | Must re-verify on external host (Chromium, heartbeat) |
| B3 Backup/restore | RESOLVED locally | **PARTIAL** | Off-host backup + external isolated restore still **OPEN** |
| B4 MinIO `:latest` | RESOLVED (pinned) | **RESOLVED** if pins preserved | Regression if someone switches to latest |
| B5 Observability | PARTIAL | **OPEN** for external | Need ≥1 outside-host probe (D7) |
| B6 In-memory rate limits | DEFERRED | **NOT_APPLICABLE_TO_STAGING** at S0 single API | Remains scale blocker later |
| B7 Dual DDL | PARTIAL | **PARTIAL** | Migrate job + ensure* mount still required |
| B8 NOTIFICATION_DELIVER | DEFERRED | **NOT_APPLICABLE_TO_STAGING** | Don't enqueue |
| B9 Socket.IO | RESOLVED env false | **RESOLVED** if env preserved | |
| B10 No host/provider | DEFERRED | **OPEN** | **This gate** — waiting D1–D10 |

### Security items

| ID | Class | Notes |
|----|-------|-------|
| S1 Test routes fail-closed | RESOLVED design | Re-prove on external |
| S2 Test flags absent | RESOLVED local | Re-prove on external secrets |
| S3 Tenant isolation | PARTIAL→strong local G12 | Re-run G12 externally |

## Explicit distinctions

| Claim | Meaning |
|-------|---------|
| LOCAL_STAGING_VALIDATED | Compose on operator machine; G12/G13 PASS |
| EXTERNAL_STAGING_VALIDATED | Public TLS hostname; off-host backup; external probes; G12/G13 on that host |
| PRODUCTION_READY | Separate authorization; stricter DR/security/scale |

## Red team (design)

| Attack / failure | Mitigation | Residual risk |
|------------------|------------|---------------|
| Host compromised | Minimal publish; no Docker socket mount; secrets 0600; SSH keys | Full data loss possible — off-host backup critical |
| Leaked `.env` | Rotate all secrets; revoke harness token; invalidate JWTs | Window until detection |
| Postgres exposed | Firewall + no publish; red-team script | Misconfig always possible |
| MinIO/console exposed | Same; console via tunnel only | |
| Harness token leaked | 404 without token; rotate; optional IP allowlist; short-lived synthetic users | Attacker can mint synthetic admins until rotated |
| NOC credential leaked | Real auth; revoke sessions; password rotate | Privileged until revoke |
| Worker crash mid-PDF | Job reclaim / retry; DEAD_LETTER visibility | Partial job states |
| Scheduler duplicated | Compose replicas=1; G10 check | Human scale error |
| Migration partial fail | Migrate job gate; don't start API; restore side env | Manual recovery |
| Disk full | Alerts at 85%; quota on evidence | Backup/PDF fail |
| Backup silently stops | External backup-age monitor | Until X7 wired |
| Object↔metadata split | Existing reconciliation tooling | Run on schedule |
| Cross-tenant report | G12 + code 404 | Re-prove externally |
| Staging→prod resources | Distinct secrets/account; checklist | Catastrophic if ignored |
| DNS wrong host | Manual DNS review; cert name match | Phishing/confusion |
| Cert expires | External TLS monitor + ACME | Downtime |
| Upstream image change | Digest pins | Pin drift if updated carelessly |
| Restore destroys primary | Isolated restore only | Process violation |
| Wrong Git SHA | Record SHA in deploy log; refuse `latest` app tags | Operator error |

## STOP conditions before implementation

- D1–D10 incomplete
- Budget not authorized (D6/D10)
- Plan would expose Postgres/MinIO
- Plan would use production domain/secrets
