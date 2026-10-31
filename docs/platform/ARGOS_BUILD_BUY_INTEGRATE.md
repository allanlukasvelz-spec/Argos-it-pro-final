# ARGOS Build / Buy / Integrate

```
DOCUMENT = ARGOS_BUILD_BUY_INTEGRATE
DATE = 2026-08-25
```

## Rule

**Do not build what a mature tool already solves well** unless ARGOS has a strong product reason to own it.

## Ownership map

| Concern | Own in ARGOS? | Engine? |
|---------|---------------|---------|
| Tenant isolation | **OWN** | — |
| Health semantics (HEALTHY/WARNING/CRITICAL/UNKNOWN) | **OWN** | — |
| Alert → incident policy | **OWN** | — |
| CHICO security presentation | **OWN** | — |
| Runbook approval / L-levels | **OWN** | — |
| Agent capability allowlist | **OWN** | — |
| Metrics time-series storage | NO | Prometheus / managed |
| Log aggregation | NO | Loki / managed |
| Distributed tracing backend | NO | Tempo / Jaeger |
| Object bytes | NO | S3 / MinIO |
| Object metadata, SHA-256, tenant binding, signed access | **OWN** | — |
| CVE database / scanners | NO | Trivy / Semgrep |
| Normalized findings + lifecycle | **OWN** | — |
| Grafana dashboards | NOC optional | Grafana |
| Client Portal UX | **OWN** | never replace with Grafana |
| Email delivery | INTEGRATE | SMTP / provider |
| Workflow durability (simple) | **OWN** (PG) | — |
| Workflow durability (complex) | later | Temporal |
| Secrets at S0 | **OWN** (env + hashed agent secrets) | — |
| Secrets at regulated scale | later | Vault / cloud SM |

## Examples

- **Prometheus metrics engine:** ARGOS SHOULD NOT REBUILD.
- **ARGOS health semantics:** ARGOS SHOULD OWN.
- **Grafana:** internal NOC only; Client Portal remains ARGOS-owned.
- **Trivy:** ARGOS integrates scanner; owns findings + customer presentation.
- **Object storage:** ARGOS integrates; owns metadata, tenancy, authorization.
