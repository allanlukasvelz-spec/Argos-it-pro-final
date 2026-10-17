# ARGOS — Release Gates

Production remains **FORBIDDEN** until staging passes required gates.

| Gate | Name | Required evidence |
|------|------|-------------------|
| G0 | Source clean | Expected branch/HEAD; clean tree; stash preserved |
| G1 | Tests | `verify:backend`, `verify:frontend`, isolation |
| G2 | Build | Frontend build + images if used |
| G3 | Migration dry-run | migrate.sh on staging copy / CI DB |
| G4 | Backup verified | Dump exists + checksum |
| G5 | Restore verified | Drill restored isolated stack |
| G6 | Security configuration | Checklist signed |
| G7 | Secrets | No test flags; unique staging secrets |
| G8 | Service health | API/FE/PG probes green |
| G9 | Worker | Claims jobs; real PDF path |
| G10 | Scheduler | Single owner; checks advancing |
| G11 | Object storage | Put/get/checksum; private bucket |
| G12 | Tenant isolation | IDOR red-team sample |
| G13 | Smoke/E2E | Critical paths + visual isolation |
| G14 | Observability | Logs+alerts wired minimally |
| G15 | Rollback rehearsal | Prior image rollback practiced |

## Gate policy

- Any SECURITY blocker → HOLD  
- G5 missing → cannot claim DR  
- Scheduler multi-owner → fail G10  
