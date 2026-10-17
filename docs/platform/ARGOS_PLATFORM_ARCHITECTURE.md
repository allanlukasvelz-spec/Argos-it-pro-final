# ARGOS Platform Architecture

```
DOCUMENT = ARGOS_PLATFORM_ARCHITECTURE
DATE = 2026-08-25
BASELINE_HEAD = 756b801
```

## 1. CURRENT architecture (CODE truth)

```
                    PUBLIC WEB (Next.js :3000)
                           |
              +------------+------------+
              |                         |
        Client Portal              Internal NOC
        /dashboard/*               /noc/*
        JWT + tenant               JWT + admin|super_admin
              |                         |
              +------------+------------+
                           |
                    Express API (:4000)
                           |
     +----------+----------+----------+----------+
     |          |          |          |          |
  /api/auth  /api/client /api/noc  /api/agent  /api/ai*
                           |
                    PostgreSQL 16
         (control + most evidence JSONB today)
                           |
              In-process monitor scheduler
              (ENABLE_MONITOR_SCHEDULER)
                           |
                 Reference agents (observation-only)
```

### CURRENT components

| Layer | Implementation |
|-------|----------------|
| Control plane | orgs, members, assets, monitors, alerts, incidents, runbooks, remediations, agents, audit logs — **PostgreSQL** |
| Data plane (today) | observations + agent_observations + evidence JSONB **inside PostgreSQL** |
| Object store | **NOT_IMPLEMENTED** |
| Metrics/logs/traces backends | **NOT_IMPLEMENTED** (morgan + console only) |
| Queue | **PARTIALLY** — monitor_checks + in-process scheduler; no Redis/Temporal |
| CHICO | Client guardian API + UI; separate public mascot chat |
| Remediation | L0–L3 NOC; L4 blocked; no remote customer mutation |

### Explicit CURRENT gaps (ops)

1. `database/schema.sql` lacks tables from migrations **004** and **005**; Docker init alone is incomplete until boot ensure* or `migrate.sh`.
2. Rate limits are **in-memory per process** (test reset gated).
3. No durable async worker process separate from API.

## 2. TARGET architecture (conceptual)

```
                         ARGOS PLATFORM
                               |
          +--------------------+--------------------+
          |                    |                    |
       PUBLIC               CLIENT                 NOC
       WEBSITE              PORTAL               INTERNAL
          |                    |                    |
          +--------------------+--------------------+
                               |
                           ARGOS CORE
                     (truth + tenancy + policy)
                               |
     +-----------+-------------+-------------+------------+
     |           |             |             |            |
   TENANCY     ASSETS       INCIDENTS      RUNBOOKS     REPORTS*
                               |
                        ORCHESTRATION
                               |
             +-----------------+------------------+
             |                 |                  |
         ARGOS AGENTS       WORKERS*          CONNECTORS*
             |                 |                  |
             +-----------------+------------------+
                               |
                     CUSTOMER ENVIRONMENTS
                               |
             +-----------------+------------------+
             |                 |                  |
           METRICS*           LOGS*             TRACES*
             |                 |                  |
             +-----------------+------------------+
                               |
                      OBSERVABILITY FABRIC*
                               |
              +----------------+----------------+
              |                |                |
          POSTGRES        TIME SERIES*      OBJECT STORE*

* = TARGET / gated — not CURRENT runtime
```

## 3. Control plane vs data plane

| Plane | Contents | Primary store TARGET |
|-------|----------|----------------------|
| **Control** | orgs, memberships, assets, monitors, alerts, incidents, runbooks, approvals, agents metadata, policies, report metadata, audit metadata | PostgreSQL |
| **Data** | high-volume metrics, logs, traces, large evidence blobs, screenshots, diagnostic bundles, PDF bytes | Time-series / log store / object store |

**Rule:** do not move existing Phase 0–7 rows out of PostgreSQL for purity. Design **adapters**; migrate only when volume or retention forces it.

## 4. Health authority

```
External signal (Prometheus / agent / scanner)
        ↓
ARGOS normalized observation / finding
        ↓
ARGOS healthEngine / vulnerability policy
        ↓
ARGOS alert / incident
        ↓
CHICO (presentation only)
```

External tools **must not** redefine `HEALTHY | WARNING | CRITICAL | UNKNOWN`.

## 5. CHICO boundary

```
TOOLS / AGENTS → ARGOS CORE → SECURITY TRUTH → CHICO
```

CHICO represents truth; does not create it. DUMBO remains UX guide. Technical agents ≠ CHICO.

## 6. Service topology TARGET (gated)

| Service | Exposure | When |
|---------|----------|------|
| frontend | public (Traefik) | CURRENT |
| backend | private / API hostname | CURRENT |
| postgres | private | CURRENT |
| otel-collector | private | V1 |
| prometheus | private | V1 |
| grafana | private NOC-only | V1 / ADOPT_LATER |
| minio/s3 | private + signed URLs | MVP PLATFORM |
| loki/tempo | private | V1.5 if volume |
| vault | private | FUTURE if justified |
| temporal | private | FUTURE if justified |

Default for every new service: **NOT PUBLICLY EXPOSED**.
