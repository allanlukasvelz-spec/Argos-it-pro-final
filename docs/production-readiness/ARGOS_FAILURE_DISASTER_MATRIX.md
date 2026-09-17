# ARGOS — Failure & Disaster Matrix

| Failure | Detection | Impact | Auto recovery | Manual | Data loss? | Safe state | Rollback |
|---------|-----------|--------|---------------|--------|------------|------------|----------|
| API crash | Health fail / supervisor | UI/API down; scheduler stops if in API | Restart container | Check logs/DB | No if PG OK | Restart | Redeploy prior image |
| Frontend crash | Probe | UI down | Restart | | No | | Prior image |
| Worker crash | Process / queue age | Reports stuck QUEUED | Restart; stale reclaim | Inspect DEAD_LETTER | No false READY if coded | Jobs RETRY_WAIT | Prior worker image |
| Scheduler crash | No checks / lag | Stale monitors | API restart | Enable flag | Delayed detection | | |
| Postgres down | Health 503 | Full platform degrade | Wait/restart PG | Restore if corrupt | Possible if disk fail | API DEGRADED | Restore backup |
| PG corruption | Query errors | Severe | No | Restore + verify | Yes without backup | Offline | PITR/backup |
| Object store down | Evidence/report fail | No new READY PDFs | Retry | Fix store | Metadata without bytes risk | Fail closed | |
| Object missing | GET STORAGE_MISSING | Report download fail | Reconcile | Re-generate report | Artifact | | |
| Checksum mismatch | EvidenceService | Fail closed | No auto trust | Investigate | Integrity event | Quarantine | |
| Disk full | Host metrics | Writes fail | No | Expand/clean | Yes risk | Stop writers | |
| Network partition | Timeouts | Partial | Retry | | Usually no | | |
| Agent offline | Stale/offline state | UNKNOWN coverage | Spool retry | Check host | No | Honest UNKNOWN | |
| Credential compromise | Auth anomalies | Tenant/agent risk | Revoke | Rotate JWT/agents | Breach | Force logout | |
| Migration failure | migrate exit≠0 | Deploy stop | No | Restore or forward-fix | Schema partial risk | Don't start apps | Restore |
| Bad deploy | Smoke fail | Wrong behavior | Rollback images | | | | Rollback plan |
| Queue stuck | Age metric | No READY | Worker scale/restart | Dead letter review | | | |
| Chromium failure | Job errors | Report FAILED | Bounded retry | Fix Playwright deps | | | |
| Rate-limit storm | 429s | Auth/API friction | Tunable limits | | | | |
| Test flag in prod | Config audit | Security | Fail closed if NODE_ENV prod for /api/test | Remove flags | | | |
| Two API schedulers | Duplicate alerts | Noise / wrong ops | **None CURRENT** | Disable extras | Semantic noise | Single owner | |

## RPO/RTO

See Backup plan — targets not current SLAs.
