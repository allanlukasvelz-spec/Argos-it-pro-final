# ARGOS — Staging Mental Map

## Three planes

```mermaid
flowchart TB
  subgraph CURRENT [CURRENT local]
    C1[API+scheduler]
    C2[manual worker]
    C3[PG]
    C4[local evidence]
    C5[MinIO POC optional]
  end

  subgraph STAGING [STAGING TARGET]
    S1[Compose supervision]
    S2[API x1 scheduler owner]
    S3[worker xN SKIP LOCKED]
    S4[PG backups]
    S5[pinned MinIO or S3]
    S6[synthetic data]
    S7[release gates G0-G15]
  end

  subgraph PROD [PRODUCTION FUTURE]
    P1[Forbidden until staging gates pass]
    P2[Meta-monitoring]
    P3[PITR + restore drills]
    P4[Hardened secrets]
  end

  CURRENT --> STAGING
  STAGING -.->|authorize later| PROD
```

## Experience isolation

```mermaid
flowchart TB
  PUB[PUBLIC website chrome]
  CLI[CLIENT ClientShell cp-*]
  NOC[NOC NocShell noc-*]
  CORE[ARGOS API + PG + store + worker]

  PUB --> CORE
  CLI --> CORE
  NOC --> CORE
```

## Job / report mental path

```
Client POST /api/client/reports
  → report_runs QUEUED
  → platform_jobs QUEUED
  → worker claim SKIP LOCKED
  → model → HTML → Chromium PDF
  → EvidenceService
  → READY + REPORT_READY notification
```

## Scheduler mental path (CURRENT risk)

```
API process tick 15s
  → SELECT due monitors (no row lock)
  → executeCheck
  → update next_check_at AFTER run
```

If two APIs: **duplicate checks** possible → mark SCALE_BLOCKER.
