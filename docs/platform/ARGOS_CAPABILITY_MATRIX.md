# ARGOS Capability Matrix

```
DOCUMENT = ARGOS_CAPABILITY_MATRIX
DATE = 2026-08-25
HEAD = 756b801
LEGEND_CURRENT = IMPLEMENTED | PARTIAL | PLANNED | NOT_IMPLEMENTED
DECISION = BUILD | BUY | INTEGRATE | ADOPT_OSS | DEFER | REJECT
```

Columns: CURRENT | TARGET | BUSINESS_VALUE | SECURITY_RISK | DECISION | MVP | V1 | V1.5 | FUTURE

| # | Capability | CURRENT | TARGET | Value | Risk | Decision | MVP | V1 | V1.5 | FUTURE |
|---|------------|---------|--------|-------|------|----------|-----|----|------|--------|
| 01 | Security posture (CHICO) | IMPLEMENTED | Richer findings feed | HIGH | MED | BUILD (truth) + INTEGRATE scanners | CHICO | findings | — | — |
| 02 | Infrastructure inventory | PARTIAL (assets) | Host/OS inventory via agents | HIGH | MED | BUILD model + agent caps | — | host inventory | — | — |
| 03 | Operating systems | PARTIAL (agent metrics) | Typed OS facts | HIGH | HIGH if exec | BUILD allowlist only | — | OS facts | — | privileged |
| 04 | Networks | PARTIAL (NETWORK_HEALTH_READ) | Expected vs observed ports | HIGH | HIGH | DEFER scanners; BUILD model | model | — | scoped scan | — |
| 05 | Ports | NOT | Expected/observed/exposed | HIGH | HIGH | DEFER Nmap | policy | — | POC | — |
| 06 | Websites | IMPLEMENTED (HTTP) | Deeper content/WAF | HIGH | MED | BUILD probes; INTEGRATE ZAP later | HTTP | — | ZAP passive | active |
| 07 | APIs | PARTIAL (asset type) | API health contracts | MED | MED | BUILD | — | API monitors | — | — |
| 08 | Databases | PARTIAL (asset type) | Connectivity/backup evidence | HIGH | HIGH | DEFER remote SQL forever | — | metadata | — | — |
| 09 | Containers | NOT in product | Image SBOM + metrics | MED | HIGH | DEFER runtime; ADOPT Trivy later | — | image scan | runtime | K8s |
| 10 | TLS / PKI | IMPLEMENTED | Continuous + inventory | HIGH | LOW | BUILD | keep | — | — | — |
| 11 | DNS / Domains | IMPLEMENTED (DNS mon) | Registrar sync | MED | LOW | BUILD | keep | — | — | — |
| 12 | Backups | NOT (NOC placeholder) | Evidence of backup success | HIGH | MED | INTEGRATE evidence | — | backup evidence | — | — |
| 13 | Storage (object) | NOT | Evidence/PDFs | HIGH | MED | INTEGRATE S3/MinIO | interface | MinIO/S3 | — | — |
| 14 | Performance | PARTIAL (latency obs) | SLOs | MED | LOW | BUILD on metrics | — | SLO model | — | — |
| 15 | Availability / SRE | PARTIAL | Error budgets | MED | LOW | BUILD | — | — | budgets | — |
| 16 | Logs | PARTIAL (morgan) | Central logs | HIGH | MED | ADOPT OTel+Loki later | hooks | — | Loki | — |
| 17 | Metrics | PARTIAL (agent+obs) | TSDB | HIGH | MED | ADOPT Prometheus V1 | hooks | Prom | — | — |
| 18 | Traces | NOT | Distributed traces | MED | LOW | ADOPT Tempo later | — | — | Tempo | — |
| 19 | Vulnerabilities | NOT | Normalized findings | HIGH | MED | INTEGRATE Trivy | model | Trivy | — | — |
| 20 | Dependencies | NOT | SCA in CI | HIGH | LOW | INTEGRATE Semgrep/Trivy fs | CI | — | — | — |
| 21 | Secrets | PARTIAL (env+agent hash) | Lifecycle | HIGH | HIGH | DEFER Vault; BUILD hygiene | rotate docs | — | — | Vault |
| 22 | CI/CD | PARTIAL (verify scripts) | Pipeline gates | MED | LOW | BUILD scripts | keep | — | — | — |
| 23 | Cloud | NOT | Cloud asset connectors | MED | HIGH | DEFER | — | — | POC | — |
| 24 | Evidence | PARTIAL (JSONB) | Blob + hash + tenant | HIGH | MED | BUILD metadata + INTEGRATE store | interface | store | — | — |
| 25 | Reporting | NOT | PDF/exports | HIGH | LOW | BUILD Phase 8 on store | — | reports | — | — |
| 26 | Compliance | NOT | Control mapping | MED | LOW | BUILD evidence map | — | — | CIS/NIST map | ISO support |
| 27 | Certifications evidence | NOT | Evidence packs | MED | LOW | DEFER claims | — | — | packs | — |
| 28 | Automation | PARTIAL (runbooks) | More L0–L2 | HIGH | HIGH | BUILD registry | keep | more L0 | — | — |
| 29 | Remediation | IMPLEMENTED safe | Still no remote | HIGH | CRITICAL | REJECT remote | keep boundary | — | — | — |
| 30 | Agents | IMPLEMENTED | More typed caps | HIGH | HIGH | BUILD allowlist | keep | host facts | — | — |
| 31 | Notifications | NOT | Email/webhook | HIGH | MED | BUILD Phase 8 | — | notify | — | — |
| 32 | Workflow orchestration | PARTIAL (in-process) | Durable jobs | HIGH | MED | PG queue first; DEFER Temporal | — | workers | — | Temporal |
| 33 | ARGOS self-observability | PARTIAL (/api/health) | Platform SLIs | HIGH | LOW | BUILD | platform-health+ | OTel | — | — |

## Invariants

- Every row with SECURITY_RISK=HIGH requires threat model before ADOPT_NOW.
- Remote remediation / generic exec remain REJECT.
