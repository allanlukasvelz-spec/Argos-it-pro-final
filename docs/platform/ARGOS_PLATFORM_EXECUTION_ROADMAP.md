# ARGOS Platform Execution Roadmap

```
DATE = 2026-08-25
```

## FOUNDATION (this program)

- Platform docs + ADRs
- Port registry + storage class constants
- Telemetry no-op interface
- schema.sql align 004/005 (Docker init completeness)
- Richer platform-health (process/DB only; not customer health)

## MVP PLATFORM

- `evidence_objects` metadata migration
- S3/MinIO adapter behind interface (private)
- Notification channel design (Phase 8 start)
- Cardinality / retention policies written

## V1

- OTel Collector + Prometheus private
- Worker process for monitors/jobs
- Vulnerability findings tables + Trivy CI/POC
- DB role least privilege

## V1.5

- Loki/Tempo if needed
- Scoped passive ZAP / limited port discovery POC
- Backup evidence domain

## FUTURE

- Vault, Temporal, K8s, Wazuh/Falco — **trigger-gated**

## Phase 8 placement

Thin Phase 8 (reports/notifications) **after** evidence store interface; **not** blocked waiting for full LGTM stack.
