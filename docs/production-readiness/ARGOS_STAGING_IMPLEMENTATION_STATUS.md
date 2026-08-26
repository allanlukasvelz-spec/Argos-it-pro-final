# ARGOS — Staging Implementation Status

```
GATE = STAGING_IMPLEMENTATION
DATE = 2026-08-26
PRODUCTION = NO
PUBLIC_DNS = NO
PHASE_9 = NO
```

## Pre-write gate (recorded)

```
===== ARGOS STAGING PRE-WRITE GATE =====
BLOCKERS_B1_B10=B1 SCALE; B2 worker; B3 backup/restore; B4 MinIO pin; B5 observability; B6 rate-limit scale; B7 dual DDL; B8 NOTIFICATION_DELIVER; B9 Socket.IO default; B10 host auth
BLOCKERS_SOLVABLE_IN_THIS_GATE=B2,B3,B4,B7(ops),B9(env)
BLOCKERS_DEFERRED=B1,B5(full),B6,B8,B10
SECURITY_BLOCKERS=S1/S2 addressed via fail-closed test surfaces
ARCHITECTURE_BLOCKERS=SCHEDULER_SCALE_BLOCKER; RATE_LIMIT_SCALE_BLOCKER
PROPOSED_SERVICES=postgres,migrate,minio,minio-init,api,worker,frontend
PROPOSED_PORTS=API 127.0.0.1:4010, FE 127.0.0.1:3010; PG/MinIO private
PROPOSED_VOLUMES=staging_pg_data,staging_minio_data
PROPOSED_ENV=docker/.env.staging.example → docker/.env.staging (gitignored)
PROPOSED_SECRETS=JWT pair + PG + MinIO (generated; never committed)
PROPOSED_IMAGES=see ARGOS_STAGING_IMAGE_PINS.md
PROPOSED_HEALTHCHECKS=/api/live,/api/ready,worker heartbeat file
PROPOSED_BACKUP=scripts/staging/backup.sh
PROPOSED_RESTORE=scripts/staging/restore-drill.sh (isolated project)
PROPOSED_ROLLBACK=scripts/staging/rollback-rehearsal.sh (no *_down auto)
PRE_WRITE_GATE=GO
```

## Delivered

| Area | Artifact |
|------|----------|
| Compose | `docker/docker-compose.staging.yml` |
| Restore overlay | `docker/docker-compose.staging.restore.yml` |
| Env template | `docker/.env.staging.example` |
| Images | `backend/Dockerfile.staging`, `Dockerfile.worker`, `frontend/Dockerfile.staging` |
| Migrate job | `scripts/staging/migrate-entrypoint.sh` (forward only) |
| Ops scripts | `scripts/staging/{up,backup,restore-drill,release-gates,security-redteam,meta-health-probe,failure-injection,rollback-rehearsal,bootstrap-env}.sh` |
| Synthetic seed | `backend/scripts/staging-seed-synthetic.js` |
| Test fail-closed | `backend/lib/ops/testSurfacePolicy.js` |
| Probes | `/api/live`, `/api/ready`, `/api/health` |
| Worker lifecycle | SIGTERM drain + heartbeat; Compose supervised |
| Pins | `ARGOS_STAGING_IMAGE_PINS.md` |

## Explicit scale blockers (accepted)

- `SCHEDULER_SCALE_BLOCKER=YES` — exactly one API with `ARGOS_SCHEDULER_OWNER=1`
- `RATE_LIMIT_SCALE_BLOCKER=YES` — in-memory limits OK for S0 single API only

## Not done (out of scope / deferred)

- External SaaS meta-monitoring purchase
- Redis rate limits
- Distributed scheduler lock
- Production DNS/TLS/VPS
- Phase 9

## How to boot

```bash
bash scripts/staging/bootstrap-env.sh
bash scripts/staging/up.sh
docker exec argos-staging-api node scripts/staging-seed-synthetic.js
bash scripts/staging/backup.sh
bash scripts/staging/restore-drill.sh <backup-dir>
bash scripts/staging/security-redteam.sh
bash scripts/staging/meta-health-probe.sh
```
