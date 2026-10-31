# ARGOS Platform Master Plan

```
DOCUMENT = ARGOS_PLATFORM_MASTER_PLAN
DATE = 2026-08-25
BASELINE_HEAD = 756b801
STATUS = AUTHORITATIVE_FOR_PLATFORM_PROGRAM
```

## 1. Mission

Evolve ARGOS into a **multi-tenant IT operations, security, observability and automation platform** suitable for a professional technology consultancy — while remaining:

- fail-closed
- tenant-isolated
- evidence-first
- reversible
- surgically expandable

ARGOS must **orchestrate and tell the truth**, not reinvent every specialized engine.

## 2. Current verified baseline (CODE)

| Phase | Status |
|-------|--------|
| 0 Organization foundation | DONE |
| 1 Tenant scoping | DONE |
| 2 Assets + TLS | DONE |
| 3 Monitoring + alerts + incidents | DONE |
| 4 Client Portal | DONE |
| 5 Internal NOC | DONE |
| 6 Runbooks + safe remediation | DONE (L0–L3; L4 blocked; no remote infra mutation) |
| 7 Agents + CHICO Security Guardian | DONE |
| 7.1 Functional validation | PASS |
| 8 Reports / notifications | **NOT EXECUTED** |
| 9 Preventive intelligence | **FORBIDDEN in this program** |

**Stack CURRENT:** Next.js (3000) + Express (4000) + PostgreSQL 16. Docker Compose = 3 services. No Prometheus/Grafana/Loki/MinIO/Vault/Temporal/Redis in app compose.

**Safety boundary CURRENT (do not silently change):**

```
REMOTE_EXECUTION = NO
REMOTE_SHELL = NO
REMOTE_SQL = NO
REMOTE_HTTP_MUTATION = NO
REMOTE_REMEDIATION = NO
```

## 3. Product role of ARGOS

ARGOS is the **orchestration + truth + tenancy + decision + experience** layer.

| ARGOS owns | External engines may provide |
|------------|------------------------------|
| organization / membership | metrics scrape (Prometheus) |
| assets | log storage (Loki / object) |
| health semantics | traces (Tempo/Jaeger) |
| alerts → incidents | vuln scanning (Trivy) |
| CHICO presentation | object bytes (S3/MinIO) |
| runbooks / approval | workflow durability (later) |
| audit / customer UX | DNS/TLS probe libraries |

## 4. Critical path (not phase fashion)

```
FOUNDATION (now)
  → schema completeness + port/storage governance
  → platform self-health honesty
  → telemetry/storage interfaces (no mandatory backends)
MVP PLATFORM
  → object storage metadata + signed access
  → notification channel (Phase 8-adjacent)
  → structured platform metrics (OTel SDK → collector later)
V1
  → OTel Collector + Prometheus (platform + optional tenant signals)
  → vulnerability findings normalized model
  → job/worker separation from API process
V1.5
  → Loki/Tempo as needed by volume
  → scanner integrations with scope policy
  → backup evidence domain
FUTURE
  → Vault (if secret sprawl justifies ops cost)
  → Temporal (if durable multi-step workflows exceed PG queue)
  → Kubernetes (only if scale/ops triggers fire)
  → Wazuh/Falco/osquery (privileged — separate security gates)
```

### Phase 8 vs platform foundation

**Recommendation:** run **platform foundation (interfaces + schema + governance) before or in parallel with a thin Phase 8**, not after a big-bang Phase 8 rewrite.

| Why foundation first | Why not delay Phase 8 forever |
|----------------------|-------------------------------|
| Reports need object storage design | Customers need reports/notifications |
| Notifications need job durability model | Can ship email via existing Formspree-like path first |
| False HEALTHY risk grows with more data | Phase 8 must consume ARGOS truth, not invent it |

**Phase 8 should consume platform abstractions**, not invent a parallel storage/notification stack.

## 5. Build / buy / integrate rule

For every capability: **BUILD | BUY | INTEGRATE | ADOPT_OSS | DEFER | REJECT**.

Do not rebuild Prometheus. Do not outsource ARGOS health semantics. Do not install privileged scanners without scope + threat model.

## 6. Implementation policy

1. Document → gate → minimal code → verify → red-team → stop for human review.
2. Separate commits: docs vs runtime.
3. No push / PR / production / main.
4. Strangler adapters: old paths stay until replacement proven.

## 7. Success criteria

ARGOS grows in **capability** without uncontrolled growth in **complexity or privilege**.

Every tool has an owner. Every dataset has a storage class. Every customer datum has a tenant. Every uncertain state stays **UNKNOWN**.
