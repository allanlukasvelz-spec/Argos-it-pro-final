# ARGOS — Production Readiness Blockers

```
FINAL_STATUS_CONTEXT = READY_WITH_BLOCKERS
```

## Critical blockers (must resolve or explicitly accept before staging implementation)

| ID | Blocker | Severity | Notes |
|----|---------|----------|-------|
| B1 | Monitor scheduler lacks multi-instance locking | **SCALE_BLOCKER** | Single API scheduler owner mandatory |
| B2 | Worker not in app Compose / not supervised in CURRENT stack | HIGH | Reports won't READY without worker |
| B3 | No automated backup + proven restore | HIGH | G4/G5 open |
| B4 | MinIO POC uses `:latest` | MEDIUM | Pin digest for staging |
| B5 | Observability = logs only; no meta-monitoring | MEDIUM | Who watches ARGOS? |
| B6 | In-memory rate limits | LOW–MED | Uneven under multi-API |
| B7 | Dual DDL (`migrate` + `ensure*`) | MEDIUM | Pick authority for staging |
| B8 | `NOTIFICATION_DELIVER` allowlisted without handler | LOW | Don't enqueue |
| B9 | Socket.IO defaults ON in code | LOW | Set `false` in staging env |
| B10 | No staging host/provider authorized | PROCESS | Human gate |

## Security blockers

| ID | Item | Status |
|----|------|--------|
| S1 | Test routes gated by NODE_ENV+flag | OK if NODE_ENV=production |
| S2 | Test flags must be absent from staging secrets | Checklist |
| S3 | Tenant isolation proven locally | Continue in staging smoke |

## Explicitly out of scope (not blockers for this gate)

- Phase 9 features  
- Kubernetes  
- Remote execution  
- Production DNS  
- Vault  

## Acceptance path

1. Human authorizes **staging implementation gate** addressing B2–B4, B7, B9 operationally  
2. B1 accepted via single-API policy until redesign  
3. B3 restore drill executed  
4. Only then consider production readiness narrative  
