# ARGOS Phase 7 — Mental Map

```
STATUS = PLANNING_ONLY
IMPLEMENTATION_AUTHORIZED = NO
```

## CURRENT vs PHASE 7 TARGET

```mermaid
mindmap
  root((ARGOS))
    Public Website
      CURRENT
    Client Portal
      CURRENT dashboard
      CHICO Security Guardian TARGET_UI
    NOC
      CURRENT ops console
      Agents placeholder CURRENT
      Agents real TARGET_P7
    ARGOS Core
      Organizations CURRENT
      Assets CURRENT
      Monitoring PLATFORM CURRENT
      Health CURRENT
      Alerts CURRENT
      Incidents CURRENT
      Runbooks Remediation CURRENT_P6
      Agents TARGET_P7
        Identity
        Enrollment
        Credentials
        Capabilities
        Heartbeats
        Observations
        Offline Buffer
        Audit
        NOC Management
```

## CHICO — Security Guardian (canonical architecture)

```
                    CUSTOMER
                       │
                       ▼
                ┌─────────────┐
                │    CHICO    │
                │  SECURITY   │
                │  GUARDIAN   │
                └──────┬──────┘
                       │
            explains / warns / guides
                       │
                ┌──────▼──────┐
                │ ARGOS CORE  │
                │ SOURCE TRUTH│
                └──────┬──────┘
                       ▲
                       │
               VERIFIED OBSERVATIONS
                       ▲
                       │
              ┌────────┴────────┐
              │ ARGOS TECHNICAL │
              │      AGENTS     │
              └────────┬────────┘
                       ▲
                       │
              CUSTOMER INFRASTRUCTURE
```

Separately (not in the security path):

```
DUMBO = EXISTING ARGOS ROBOT PERSONA
      = GUIDE / UX ROLE PRESERVED
      = NOT SECURITY GUARDIAN
```

```mermaid
flowchart TB
  Customer[CUSTOMER]
  Chico[CHICO SECURITY GUARDIAN]
  Core[ARGOS CORE — source of truth]
  TechAgent[ARGOS TECHNICAL AGENTS]
  Infra[CUSTOMER INFRASTRUCTURE]
  Dumbo[DUMBO — guide/UX preserved]

  Customer --> Chico
  Chico -->|explains / warns / guides| Core
  TechAgent -->|verified observations| Core
  Infra --> TechAgent
  Dumbo -.->|not security path| Customer
```

Cardinality: `1 org → 1 CHICO → many assets/monitors → 0..N technical agents`.

## Global after Phase 7 (TARGET)

```mermaid
flowchart LR
  subgraph Cust[Customer zone - untrusted]
    Hosts[Hosts / Apps / DB]
    Agent[ARGOS Agent]
    Hosts --> Agent
  end

  subgraph Edge[Trust boundary]
    TLS[Outbound TLS 1.2+]
  end

  subgraph Argos[ARGOS Core]
    Ingest[Agent Ingest API]
    Sec[AuthN AuthZ Anti-replay]
    Norm[Normalize Idempotency]
    Obs[(Observations)]
    HE[Health Engine]
    AL[Alerts / Incidents]
    RB[Runbooks P6]
    DB[(PostgreSQL)]
  end

  subgraph Access[Access]
    NOC[NOC Agents]
    Client[Client Portal + CHICO Guardian]
  end

  Agent --> TLS --> Ingest --> Sec --> Norm --> Obs --> HE --> AL
  Norm --> DB
  HE --> DB
  AL --> NOC
  AL --> Client
  RB -.->|NO remote exec via agent| Agent
```

## Agent state machine

```mermaid
stateDiagram-v2
  [*] --> ENROLLMENT_PENDING
  ENROLLMENT_PENDING --> ONLINE: enroll + heartbeat
  ONLINE --> STALE: missed heartbeats
  STALE --> ONLINE: heartbeat resumes
  STALE --> OFFLINE: prolonged silence
  OFFLINE --> ONLINE: heartbeat resumes
  ONLINE --> REVOKED: operator/security
  STALE --> REVOKED
  OFFLINE --> REVOKED
  ENROLLMENT_PENDING --> UNKNOWN: invalid/incomplete
  REVOKED --> [*]
```

Note: these are **agent** states, not asset HEALTHY/WARNING/CRITICAL/UNKNOWN.

## Phase 6 ↔ Agent boundary (remote execution BLOCKED)

```mermaid
flowchart TB
  subgraph Allowed[Allowed Phase 7]
    A1[Agent heartbeats]
    A2[Typed observations]
  end
  subgraph P6[Phase 6]
    R1[Dry-run]
    R2[Approval]
    R3[Typed execute]
    R4[Verify / Rollback]
  end
  subgraph Blocked[NOT AUTHORIZED]
    X1[Agent shell]
    X2[Agent as remediation transport]
    X3[Silent auto-fix on host]
  end
  A1 --> Core[ARGOS Core]
  A2 --> Core
  R3 --> Core
  R3 --> X2
  X2:::bad
  classDef bad fill:#b91c1c,color:#fff
```

## Implementation dependency graph

```mermaid
flowchart TD
  A[7A Threat Model] --> B[7B Identity Data Model]
  B --> C[7C Enrollment]
  C --> D[7D Auth API]
  D --> E[7E Heartbeats]
  D --> F[7F Observations]
  E --> G[7G Spool Retry]
  F --> G
  E --> H[7H NOC UI]
  F --> H
  C --> I[7I Rotate Revoke Audit]
  D --> I
  H --> J[7J Red Team Freeze]
  I --> J
  G --> J
```

## Enrollment sequence

```mermaid
sequenceDiagram
  participant NOC
  participant API as ARGOS API
  participant DB
  participant Agent
  NOC->>API: create enrollment
  API->>DB: store hash(token) PENDING
  API-->>NOC: one-time token (once)
  Agent->>API: POST enroll(token)
  API->>DB: validate + atomic consume
  API->>DB: store cred hash
  API-->>Agent: operational credential
  Agent->>API: heartbeat
  API->>DB: ONLINE
```

## Observation → Health path

```mermaid
flowchart LR
  Agent --> Ingest --> Validate --> WriteObs[observations source=AGENT]
  WriteObs --> HealthEngine
  HealthEngine --> Alerts
  Alerts --> Incidents
  HealthEngine --> ClientCHICO[Client / CHICO Security Guardian]
  Incidents --> NOC
```
