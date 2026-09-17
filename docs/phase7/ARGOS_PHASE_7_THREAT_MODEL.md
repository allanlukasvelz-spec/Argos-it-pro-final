# ARGOS Phase 7 — Threat Model

```
STATUS = PLANNING_ONLY
IMPLEMENTATION_AUTHORIZED = NO
```

Each row: THREAT → vector → impact → prevention → detection → A/B/C → SAFE STOP → rollback → human → audit.

Abbreviations: **Prev**=Prevention **Det**=Detection **SS**=Safe Stop **RB**=Rollback **H**=Human **Au**=Audit event

---

| ID | Threat | Entry | Impact | Prev | Det | A | Verify | B | Verify | C | SS | RB | H | Au |
|----|--------|-------|--------|------|-----|---|--------|---|--------|---|----|----|---|-----|
| T01 | Stolen enrollment token | Leak from NOC/chat | Unauthorized agent | TTL+hash+single-use | Reuse attempt | Reject replay | 401/409 | Revoke pending | status | Rotate NOC access | Stop issuing | Expire token | YES | ENROLL_REPLAY |
| T02 | Enrollment replay | Double POST | Dual creds | Atomic consume | 2nd redeem fail | Reject | DB unique | Alert security | ticket | — | — | — | YES | ENROLL_REPLAY |
| T03 | Stolen agent cred | Host malware | Fake telemetry | Rotate/revoke; TLS | Anomaly flood/clone | Revoke | 401 | Re-enroll clean | ONLINE | Isolate host OOB | Distrust obs | — | YES | CRED_COMPROMISE |
| T04 | Cloned agent | Copy secret | Split brain | Seq/device claim | Concurrent seq | Challenge/revoke | — | Force re-enroll | — | — | YES | — | YES | CLONE_SUSPECT |
| T05 | Tenant spoof | Body org_id | Cross-tenant write | Bind from cred | Mismatch | 403 | no write | Auto-revoke | 401 | Incident | YES | — | YES | TENANT_SPOOF |
| T06 | Asset spoof | Body asset_id | Wrong asset health | Bind asset | Mismatch | 403 | — | Revoke | — | — | YES | — | YES | ASSET_SPOOF |
| T07 | Org reassignment | Update FK casually | Confusion | Forbid move | Attempt | Reject | — | Revoke+new enroll | — | — | — | — | YES | ORG_MOVE_DENY |
| T08 | Malicious agent | Attacker install | Poison obs | Capability allowlist | Schema anomalies | Drop payload | — | Disable caps | — | Revoke | YES | — | YES | MALICIOUS_AGENT |
| T09 | Compromised host | Rootkit | Lies + cred theft | Least privilege | Host EDR OOB | Revoke agent | — | Prefer PLATFORM | — | Rebuild host | YES | — | YES | HOST_COMPROMISE |
| T10 | Compromised ARGOS API | Server breach | Mass forge | Hardening P10 | IDS | Kill ingest flag | — | Rotate all | — | Restore backup | YES | DB restore L4 never auto | YES | API_BREACH |
| T11 | Payload tampering | MITM w/o TLS | Corrupt data | TLS1.2+ | TLS fail | Reject | — | — | — | — | — | — | — | TLS_FAIL |
| T12 | Replayed observations | Resend old HEALTHY | False calm | Idempotency+watermark | Old seq | Ignore/409 | — | Mark untrusted window | — | Revoke | YES | — | YES | OBS_REPLAY |
| T13 | Duplicate observations | Retry | Double alerts | Unique key | Conflict | Idempotent OK | one row | — | — | — | — | — | — | OBS_DUP |
| T14 | Stale observations | Delayed spool | Wrong timeline | Max age discard | age check | Drop stale | — | Annotate UNKNOWN | — | — | — | — | — | OBS_STALE |
| T15 | Forged timestamps | Client clock | Bypass STALE | Prefer server_received | Skew >N | Clamp/reject | — | UNKNOWN state | — | — | — | — | — | CLOCK_SKEW |
| T16 | Clock drift | NTP fail | Same | Same | Same | Same | — | — | — | — | — | — | — | CLOCK_SKEW |
| T17 | Oversized payloads | DoS | Resource exhaust | Size cap | 413 | Reject | — | Rate limit | — | Temp ban agent | YES | — | YES | PAYLOAD_OVERSIZE |
| T18 | Malformed payloads | Fuzz | Crash/500 | Schema | 400 | Reject | — | — | — | — | — | — | — | SCHEMA_FAIL |
| T19 | Schema downgrade | Old agent | Bypass fields | Min version | version | Reject | — | Force upgrade path FUTURE | — | — | — | — | YES | SCHEMA_DOWN |
| T20 | Capability escalation | Claim SHELL | RCE | Server allowlist | Unknown cap | Reject | — | Revoke | — | — | YES | — | YES | CAP_ESCALATE |
| T21 | Rotation failure | Network cut | Lockout | Dual window | Errors | Keep old | heartbeat | Retry rotate | — | Re-enroll | YES | prior cred | YES | ROTATE_FAIL |
| T22 | Revocation race | In-flight | Late write | Check revoke each req | Post-revoke hit | Reject | — | — | — | — | — | — | — | REVOKE_ENFORCE |
| T23 | Offline buffer abuse | Fill disk | Host DoS | Bounded spool | Local metric | Drop oldest | — | Pause obs | — | Alert user | YES | — | YES | SPOOL_FULL |
| T24 | Telemetry flood | Botnet | ARGOS DoS | Rate limit 429 | QPS | Backoff | — | Shed load | — | Revoke noisy | YES | — | YES | FLOOD |
| T25 | Log injection | Crafted strings | SIEM confuse | Redact/encode | Pattern | Sanitize | — | — | — | — | — | — | — | LOG_INJECT |
| T26 | Secret leakage | Accidental log | Cred expose | Redaction tests | Secret scan | Rotate | — | — | — | — | YES | — | YES | SECRET_LEAK |
| T27 | Cross-tenant ingest | IDOR id | Data leak | Always org from cred | Tests | 404/403 | — | — | — | — | YES | — | YES | IDOR |
| T28 | IDOR NOC | Guess agent id | Info leak | org filter + role | Tests | 404 | — | — | — | — | — | — | YES | NOC_IDOR |
| T29 | Race enroll | Parallel redeem | Dual agent | Tx+unique | Conflict | One wins | — | — | — | — | — | — | — | ENROLL_RACE |
| T30 | Partial network | Intermittent | Flapping | Hysteresis STALE | Flap count | Debounce | — | — | — | — | — | — | — | NET_PARTIAL |
| T31 | ARGOS outage | Ops | Spool grow | Bound+backoff | Agent errors | Spool | — | Drop old | — | — | YES | — | — | ARGOS_DOWN |
| T32 | PostgreSQL outage | Ops | Ingest fail | 503 | Health | Reject write | — | Queue FUTURE | — | — | YES | — | YES | DB_DOWN |
| T33 | Corrupted spool | Disk fault | Bad replay | Checksum | Parse fail | Quarantine | — | Resync | — | Reinstall | YES | delete spool | YES | SPOOL_CORRUPT |

---

## Red team (≥20) — architecture must fail closed

1. Tenant A cred + tenant B asset → **reject**  
2. Cloned cred second machine → **detect/revoke**  
3. Replay old HEALTHY obs → **idempotent/watermark reject**  
4. Flood → **429 / revoke**  
5. Modify observed_at → **server time / skew reject**  
6. Concurrent enrollment token → **one consume**  
7. Revoked keeps sending → **401**  
8. Agent offline + last HEALTHY → **decay UNKNOWN, not frozen HEALTHY**  
9. No heartbeat + PLATFORM probe OK → **agent STALE; asset may stay evidenced**  
10. Heartbeat OK + service fail → **health from obs, not heartbeat**  
11. DB unavailable → **fail closed 503**  
12. Duplicate after retry → **one row**  
13. Wrong agent revoke → **confirm UX + re-enroll path**  
14. org_admin NOC agents → **403**  
15. Payload secrets → **redact/drop**  
16. HTML/log injection → **encode**  
17. Huge batch → **413**  
18. Rotation interrupted → **dual window**  
19. Old cred after rotate → **reject after cutover**  
20. Large clock skew → **UNKNOWN / reject**  

All designed to **fail safely** (no silent HEALTHY, no cross-tenant write).
