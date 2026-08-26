# ARGOS — External Staging Human Decisions

```
STATUS = AWAITING HUMAN INPUT
NO_GUESSING = YES
BILLABLE_INFRASTRUCTURE = BLOCKED UNTIL D10=YES
```

Fill each row. Do not invent values in automation.

| ID | Decision | Options / notes | Status |
|----|----------|-----------------|--------|
| D1 | Hosting provider | VPS vendor / cloud account — not assumed | **REQUIRED_HUMAN_INPUT** |
| D2 | Geographic region | Latency, data residency | **REQUIRED_HUMAN_INPUT** |
| D3 | Staging hostname/domain | e.g. `staging.<domain>` — ownership required | **REQUIRED_HUMAN_INPUT** |
| D4 | Object storage model | Pinned MinIO on VM **vs** managed S3-compatible | **REQUIRED_HUMAN_INPUT** (arch recommends MinIO-on-VM for fidelity) |
| D5 | Backup destination | Off-host bucket / second host — not same disk only | **REQUIRED_HUMAN_INPUT** |
| D6 | Monthly budget ceiling | Compute + storage + TLS + monitoring | **REQUIRED_HUMAN_INPUT** |
| D7 | External monitoring | Uptime provider / self-hosted probe off-box | **REQUIRED_HUMAN_INPUT** |
| D8 | Secret-management model | Host file 0600 **vs** Secrets Manager/Vault | **REQUIRED_HUMAN_INPUT** (S0 default: host file) |
| D9 | Staging harness externally | Enabled+token (+ optional IP allowlist) **vs** disabled | **REQUIRED_HUMAN_INPUT** |
| D10 | Authorization to create billable infrastructure | Explicit YES required | **REQUIRED_HUMAN_INPUT** = NO until signed |

## Recommended defaults (non-binding)

Only apply after human confirms:

| ID | Suggested default |
|----|-------------------|
| Architecture | Class A — hardened VPS + Compose |
| D4 | MinIO private on same Compose network |
| D8 | `/etc/argos/staging.env` mode 0600 |
| D9 | Enabled with strong token + CI/operator IP allowlist if feasible |
| Cookies | `ARGOS_COOKIE_SECURE=1` |

## Sign-off block

```
OPERATOR:
DATE:
D1= D2= D3= D4= D5=
D6= D7= D8= D9=
D10_BILLABLE_AUTHORIZED= NO | YES
NOTES:
```

Until D10=YES and this file updated, **STOP** — no VPS create, no DNS, no spend.
