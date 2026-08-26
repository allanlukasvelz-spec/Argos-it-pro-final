# ARGOS — External Staging Human Decisions

```
STATUS                        = RECORDED
RECORDED_AT                   = 2026-08-26
NO_GUESSING                   = YES
BILLABLE_INFRASTRUCTURE       = AUTHORIZED_FOR_STAGING_ONLY (D10)
IMPLEMENTATION_GATE           = NOT STARTED (await separate execute authorization)
PRODUCTION                    = NO
CUSTOMER_DATA                 = NO
CUSTOMER_AGENTS               = NO
PUBLIC_PRODUCTION_DNS         = NO
PHASE_9                       = NO
REMOTE_EXECUTION              = NO
REMOTE_REMEDIATION            = NO
```

## Decisions (binding)

| ID | Decision | Recorded value | Status |
|----|----------|----------------|--------|
| D1 | Hosting provider | **HOSTINGER_VPS** | RECORDED |
| D2 | Geographic region | **EUROPE_WEST** | RECORDED |
| D3 | Staging hostname | **staging.argos-it.es** | RECORDED |
| D4 | Object storage | **PRIVATE_MINIO_ON_STAGING_VPS** | RECORDED |
| D5 | Backup destination | **OFF_HOST_S3_COMPATIBLE_STORAGE** | RECORDED |
| D6 | Monthly budget ceiling | **€80** | RECORDED |
| D7 | External monitoring | **UPTIME_PROVIDER_MINIMUM_ONE_EXTERNAL_PROBE** | RECORDED |
| D8 | Secret management | **HOST_FILE_0600_WITH_ROTATION**; Vault deferred | RECORDED |
| D9 | Staging harness | **ENABLED_STAGING_ONLY**; strong token; IP restrict if practical | RECORDED |
| D10 | Billable infrastructure | **AUTHORIZED_FOR_STAGING_ONLY** | RECORDED |

## Hard limits (binding)

| Limit | Value |
|-------|-------|
| PRODUCTION | NO |
| CUSTOMER_DATA | NO |
| CUSTOMER_AGENTS | NO |
| PUBLIC_PRODUCTION_DNS | NO |
| PHASE_9 | NO |
| REMOTE_EXECUTION | NO |
| REMOTE_REMEDIATION | NO |

## Architecture alignment

| Choice | Matches recommendation |
|--------|------------------------|
| Hostinger VPS + Compose | Class A |
| Private MinIO on VPS | D4 = architecture default |
| Off-host S3-compatible backups | External backup requirement |
| Host file 0600 secrets | S0 secrets model |
| Harness staging-only + token | Fail-closed design |
| Hostname `staging.argos-it.es` | Dedicated staging; not production apex |

## Implications for next gate (not executed here)

1. Provision Hostinger VPS in Europe West within €80/mo envelope (compute + disk + off-host backup + uptime + TLS).
2. DNS: create/point **only** `staging.argos-it.es` (no production DNS changes).
3. TLS on that hostname; `ARGOS_COOKIE_SECURE=1`; CORS/CSRF = `https://staging.argos-it.es`.
4. MinIO private (no public 9000/9001); Postgres private.
5. Off-host S3-compatible bucket for backups (credentials in host file 0600).
6. ≥1 external uptime probe against FE + `/api/live` or `/api/ready`.
7. Harness enabled with unique strong token; IP allowlist if practical (CI/operator).
8. Synthetic data only; no customer agents.

## Sign-off block

```
OPERATOR: (human — decisions supplied in chat 2026-08-26)
DATE: 2026-08-26
D1=HOSTINGER_VPS
D2=EUROPE_WEST
D3=staging.argos-it.es
D4=PRIVATE_MINIO_ON_STAGING_VPS
D5=OFF_HOST_S3_COMPATIBLE_STORAGE
D6=80_EUR
D7=UPTIME_PROVIDER_MINIMUM_ONE_EXTERNAL_PROBE
D8=HOST_FILE_0600_WITH_ROTATION; VAULT_DEFERRED
D9=ENABLED_STAGING_ONLY; STRONG_TOKEN; IP_RESTRICT_IF_PRACTICAL
D10_BILLABLE_AUTHORIZED= YES (STAGING_ONLY)
HARD_LIMITS= PRODUCTION=NO CUSTOMER_DATA=NO CUSTOMER_AGENTS=NO
  PUBLIC_PRODUCTION_DNS=NO PHASE_9=NO REMOTE_EXECUTION=NO REMOTE_REMEDIATION=NO
```

## STOP

Decisions are recorded. **Do not** create VPS, change DNS, or spend until a separate **EXTERNAL_STAGING_IMPLEMENTATION** authorization is issued explicitly.

Related: [ARGOS_EXTERNAL_STAGING_MASTER_PLAN.md](./ARGOS_EXTERNAL_STAGING_MASTER_PLAN.md)
