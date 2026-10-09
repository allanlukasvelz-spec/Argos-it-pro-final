# ARGOS Platform Security Model

```
DATE = 2026-08-25
REMOTE_EXECUTION = NO
REMOTE_REMEDIATION = NO
```

## Identity chain

```
JWT → user → membership OR global NOC role → tenant context → organization_id → scoped resource
```

NOC: `admin|super_admin` only on `/api/noc/*`. Never weaken `/api/client/*`.

## Secrets CURRENT

| Secret | Handling |
|--------|----------|
| JWT_SECRET / JWT_REFRESH_SECRET | Env; ≥32; distinct |
| DATABASE_URL | Env |
| OPENAI_API_KEY | Env; optional |
| Agent credentials | SHA-256 stored; plaintext once |
| Enrollment tokens | SHA-256; one-time |

TARGET hygiene: rotation runbook, redaction in logs, no secrets in observations (already sanitized). Vault DEFER.

## Port governance

See `port-registry.yaml`. Default bind private. No accidental `0.0.0.0` admin UIs.

## Service isolation

New services: name, purpose, network, ports, exposure, volumes, CPU/mem limits, healthcheck, restart, secrets, logs, backup, upgrade, rollback.

## False HEALTHY protection

Missing/stale/tool-down → UNKNOWN. Platform healthy ≠ customers healthy. Agent ONLINE ≠ asset HEALTHY.
