# ARGOS Platform Threat Model

```
DATE = 2026-08-25
METHOD = STRIDE-lite + red-team questions
```

## Assets

Customer telemetry, evidence blobs, credentials, tenant metadata, remediation state, CHICO trust.

## Top threats

| ID | Threat | Mitigation |
|----|--------|------------|
| T1 | Cross-tenant telemetry leak | org_id on all rows; NOC audited; OTel stamp by ARGOS |
| T2 | Scanner scope escape | Explicit allowlist targets; no arbitrary CIDR |
| T3 | Object storage IDOR | Signed URLs + metadata authz |
| T4 | Agent generic execution | Capability allowlist; 404 exec routes |
| T5 | Compromised engine → PG | Network policy; least privilege DB roles (future) |
| T6 | Public Grafana/Prom | Private network only; port registry |
| T7 | Duplicate job / remediations | Idempotency keys |
| T8 | Stale → HEALTHY | healthEngine freshness rules |
| T9 | Secret in logs | Sanitizers; structured redaction |
| T10 | Metrics cardinality DoS | Budgets; drop high-card labels |
| T11 | Docker socket mount | Forbidden in compose policy |
| T12 | CHICO certainty without evidence | UNKNOWN states + copy |
| T13 | NOC bypass approval | Server-side L3 approval |
| T14 | Unlimited object growth | Quotas |
| T15 | Silent backup failure | Platform SLI + alerts |
| T16 | Tool cascade failure | Isolate; degrade UNKNOWN |
| T17 | Migration data loss | Expand-only migrations; downs manual |
| T18 | Irreversible upgrade | Pin images; rollback procedure |

## Red-team answers (pre-implementation)

1. Tenant A telemetry to B? → Prevented by CURRENT tenant filters; future OTel must stamp org.
2. Scanner escape? → No scanner deployed; policy required before POC.
3. Object leak? → No object store yet; design signed+metadata.
4. Agent generic exec? → Rejected by design (verified Phase 7).
5. Tool → PG? → Compose private network; harden further at V1.
6. Public admin panels? → Port registry + default private.
7. Queue double-exec? → Design idempotent jobs before worker split.
8. Retry duplicate remediation? → Existing execution_key UNIQUE.
9. Stale HEALTHY? → Engine forbids.
10. Log secrets? → Ongoing; expand redaction with structured logs.
11. Cardinality? → Policy before Prometheus.
12. Docker socket? → Not mounted CURRENT; keep banned.
13. CHICO false certainty? → UNKNOWN validated Phase 7.1.
14. NOC approval bypass? → Server enforces L3.
15. Object growth? → Quota in storage design.
16. Failed backups unnoticed? → Ops gap; platform SLI needed.
17. Tool cascade? → Separate health planes.
18. Migration destroy 0–7? → Additive only in program.
19. Upgrade rollback impossible? → Pin + documented rollback.
20. Complexity > value? → Many tools DEFER/REJECT; foundation minimal.

**Unresolved before privileged tools:** scanner scope, object malware pipeline, DB role separation — track as remaining; do not block interface-only foundation.
