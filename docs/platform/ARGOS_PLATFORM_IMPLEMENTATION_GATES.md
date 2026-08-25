# ARGOS Platform Implementation Gates

```
DATE = 2026-08-25
```

## PLATFORM_FOUNDATION_PRE_WRITE_GATE

### Recommended ADOPT_NOW

| Item | Type |
|------|------|
| OpenTelemetry-ready telemetry interface (no-op) | code |
| Storage class + port registry | code/docs |
| schema.sql include 004/005 DDL | database |
| platform-health enrichment (process uptime/mem, db ping) | code |

### Rejected / deferred (NOT in foundation)

Wazuh, Vault, Temporal, Kubernetes, ZAP active, Nmap workers, Falco, Prometheus/Grafana/Loki/MinIO **containers** (defer to later gates).

### Architecture changes

- None to Phase 0–7 product semantics
- Additive platform lib under `backend/lib/platform/`

### New services / ports / volumes

**None in foundation runtime.**

### New env vars

Documented optional only, e.g. future `OTEL_EXPORTER_OTLP_ENDPOINT` (unset = no-op).

### New secrets

None.

### New dependencies (npm)

**None required** for no-op telemetry (avoid openai-style boot risk). Pure JS interfaces.

### Migrations

Prefer aligning `schema.sql` with existing 004/005 (idempotent CREATE IF NOT EXISTS) — no new numbered migration required if DDL already applied by ensure*.

### Resource requirements

Negligible.

### Security impact

Positive (completeness + governance). No privilege increase. Remote exec remains NO.

### Rollback

Revert commit; schema objects remain IF NOT EXISTS (safe). Remove platform lib.

---

## Decision

```
FOUNDATION_IMPLEMENTATION = GO
```

Scope locked to items marked ADOPT_NOW above. Anything else = HOLD until new gate.
