# ARGOS Platform Dependency Graph

```mermaid
flowchart LR
  Tenancy --> Assets
  Assets --> Agents
  Assets --> Monitors
  Agents --> Observations
  Monitors --> Observations
  Observations --> Health
  Health --> Alerts
  Alerts --> Incidents
  Incidents --> Notifications
  Observations --> Historical
  Historical --> Reports
  Evidence --> ObjectStore
  Platform --> OTel
  OTel --> ObsBackends
  Runbooks --> JobEngine
  JobEngine --> Remediation
  VulnScanners --> Findings
  Findings --> Evidence
  Findings --> Risk
  NOC --> Tenancy
  NOC --> Incidents
  NOC --> Runbooks
  NOC --> Agents
  ClientPortal --> Tenancy
  ClientPortal --> Health
  ClientPortal --> Chico
  Chico --> Health
  Chico --> Alerts
```

## Critical path dependencies

1. Tenancy before any tenant data plane
2. Evidence metadata before object bytes
3. Telemetry hooks before Prometheus
4. Findings model before Trivy
5. Job idempotency before worker split
