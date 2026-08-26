# ARGOS — Production Readiness Blockers

```
FINAL_STATUS_CONTEXT = STAGING_FOUNDATION_PASS_WITH_DEFERRED
UPDATED = 2026-08-26
```

## Critical blockers (must resolve or explicitly accept before staging implementation)

| ID | Blocker | Severity | Status | Notes |
|----|---------|----------|--------|-------|
| B1 | Monitor scheduler lacks multi-instance locking | **SCALE_BLOCKER** | **DEFERRED** | Single API scheduler owner mandatory (`ARGOS_SCHEDULER_OWNER=1`) |
| B2 | Worker not in app Compose / not supervised in CURRENT stack | HIGH | **RESOLVED** | Staging Compose supervises `worker` with heartbeat + SIGTERM |
| B3 | No automated backup + proven restore | HIGH | **RESOLVED** | `backup.sh` + isolated `restore-drill.sh` proven |
| B4 | MinIO POC uses `:latest` | MEDIUM | **RESOLVED** | Pinned RELEASE + digest in staging Compose |
| B5 | Observability = logs only; no meta-monitoring | MEDIUM | **PARTIAL** | Meta-health probe script + platform-health queue; no LGTM/SaaS |
| B6 | In-memory rate limits | LOW–MED | **DEFERRED** | `RATE_LIMIT_SCALE_BLOCKER=YES` |
| B7 | Dual DDL (`migrate` + `ensure*`) | MEDIUM | **PARTIAL** | Staging migrate job is boot gate; ensure* still needs `/database` mount |
| B8 | `NOTIFICATION_DELIVER` allowlisted without handler | LOW | **DEFERRED** | Don't enqueue |
| B9 | Socket.IO defaults ON in code | LOW | **RESOLVED** | Staging env sets `ENABLE_SOCKET_IO=false` |
| B10 | No staging host/provider authorized | PROCESS | **DEFERRED** | Local staging foundation only |

## Security blockers

| ID | Item | Status |
|----|------|--------|
| S1 | Test routes gated by NODE_ENV+flag | **RESOLVED** — staging/production fail-closed via `testSurfacePolicy` |
| S2 | Test flags must be absent from staging secrets | **RESOLVED** — empty in Compose + red-team |
| S3 | Tenant isolation proven locally | **PARTIAL** — synthetic dual-org seed + restore; continue in smoke |

## Explicitly out of scope (not blockers for this gate)

- Phase 9 features  
- Kubernetes  
- Remote execution  
- Production DNS  
- Vault  

## Acceptance path

1. ~~Human authorizes **staging implementation gate** addressing B2–B4, B7, B9 operationally~~ **DONE**  
2. B1 accepted via single-API policy until redesign  
3. ~~B3 restore drill executed~~ **DONE**  
4. Only then consider production readiness narrative  

Historical evidence preserved; statuses updated in place (no deletion of prior wording intent).
