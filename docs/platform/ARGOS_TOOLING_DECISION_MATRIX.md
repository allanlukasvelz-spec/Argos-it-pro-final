# ARGOS Tooling Decision Matrix

```
DOCUMENT = ARGOS_TOOLING_DECISION_MATRIX
DATE = 2026-08-25
SCORE = 1-5 with short reason
DECISIONS = ADOPT_NOW | POC | ADOPT_LATER | INTEGRATE | DEFER | REJECT
```

Scoring axes: SEC, MULTI_TENANT, MATURITY, RESOURCE, OPS_COMPLEX, INTEGRATION, PORTABILITY, OBS, BACKUP, LICENSE, LOCKIN, ARGOS_FIT

## Summary table

| Tool | Decision | Resource | Why (short) |
|------|----------|----------|-------------|
| OpenTelemetry SDK + interfaces | **ADOPT_NOW** (hooks only) | LOW | Standardizes future export; no backend required yet |
| OTel Collector | **ADOPT_LATER** (V1) | MED | Needed when volume > morgan; multi-tenant routing is non-trivial |
| Prometheus | **ADOPT_LATER** (V1) | MED | Best metrics engine; ARGOS must normalize → health |
| Grafana | **ADOPT_LATER** | MED | NOC-only internal viz; never Client Portal |
| Loki | **DEFER** (V1.5) | MED | After structured logs exist |
| Tempo / Jaeger | **DEFER** | MED | After tracing instrumented |
| MinIO / S3-compatible | **ADOPT_LATER** (MVP platform) | LOW–MED | Required for reports/evidence; start with interface NOW |
| Trivy | **ADOPT_LATER** | LOW | Image/fs/CVE; ARGOS owns findings model |
| Semgrep | **POC** | LOW | CI SAST; no runtime privilege |
| OWASP ZAP | **DEFER** | MED | Active scan high risk; passive POC later |
| Wazuh | **REJECT/DEFER** | HIGH | Heavy; privilege; not needed for S0–S1 |
| osquery | **DEFER** | MED | Host inventory alternative to typed agent caps |
| Falco | **REJECT now** | MED | Needs privileged/eBPF; threat model first |
| HashiCorp Vault | **DEFER** | HIGH | Official docs: powerful but ops-heavy; Coolify/env sufficient at S0 |
| PostgreSQL queue / workers | **ADOPT_NOW** (design) + **ADOPT_LATER** (split process) | LOW | Fits CURRENT stack; Temporal not justified yet |
| Redis / BullMQ | **DEFER** | MED | Only if PG queue saturates |
| Temporal | **DEFER** | HIGH | Overkill until multi-step durable workflows dominate |
| Sentry | **POC** | LOW | API error tracking; redact secrets |
| Nmap | **REJECT unrestricted**; **POC** only with scope policy | MED | Scanner scope escape risk |
| Docker Compose | **ADOPT_NOW** (keep) | LOW | CURRENT topology |
| Kubernetes | **REJECT now** | HIGH | No scale/ops trigger; see container strategy |

## Scorecards (selected)

### OpenTelemetry (SDK hooks)

| Axis | Score | Reason |
|------|-------|--------|
| SEC | 4 | No extra privilege; export must stay private |
| MULTI_TENANT | 3 | Tenant id must be stamped by ARGOS, not assumed |
| MATURITY | 5 | CNCF standard |
| RESOURCE | 5 | SDK hooks cheap |
| OPS_COMPLEX | 5 | No collector yet |
| ARGOS_FIT | 5 | Engines subordinate |
| **Decision** | **ADOPT_NOW** | Interfaces + optional no-op exporter |

### Prometheus

| Axis | Score | Reason |
|------|-------|--------|
| SEC | 3 | Must not bind 0.0.0.0 public |
| MULTI_TENANT | 2 | Not a tenant product DB; ARGOS normalizes |
| MATURITY | 5 | De-facto metrics |
| RESOURCE | 3 | Cardinality risk |
| OPS_COMPLEX | 3 | Retention/ops |
| ARGOS_FIT | 4 | Engine only |
| **Decision** | **ADOPT_LATER** | After hooks + cardinality policy |

### Vault

| Axis | Score | Reason |
|------|-------|--------|
| SEC | 5 | Strong model |
| OPS_COMPLEX | 1 | Unseal/HA/DR burden (HashiCorp docs warn for simple needs) |
| RESOURCE | 2 | Another critical service |
| ARGOS_FIT | 3 | Useful later, not S0 |
| **Decision** | **DEFER** | Improve env rotation + agent credential model first |

### Temporal

| Axis | Score | Reason |
|------|-------|--------|
| MATURITY | 5 | Excellent workflows |
| OPS_COMPLEX | 2 | Cluster + visibility |
| ARGOS_FIT | 2 | Phase 6 engine already covers L0–L3 |
| **Decision** | **DEFER** | PG-backed jobs first |

### Kubernetes

| Axis | Score | Reason |
|------|-------|--------|
| OPS_COMPLEX | 1 | Team size vs benefit |
| RESOURCE | 1 | Overkill for 3-service app |
| ARGOS_FIT | 2 | Compose sufficient through S1 |
| **Decision** | **REJECT now** | Trigger: multi-node HA + many workers + ops team |
