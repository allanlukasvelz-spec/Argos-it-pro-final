# ARGOS — External Staging Deployment Runbook

```
STATUS = DESIGN — NOT EXECUTED
LATEST_TAG = FORBIDDEN for staging-critical bases
DESTRUCTIVE_DOWN_MIGRATIONS = NO (automatic)
```

## Flow

```
SOURCE COMMIT (recorded SHA)
    ↓
BUILD (API / worker / frontend images from Dockerfiles)
    ↓
PINNED BASE IMAGES (see ARGOS_STAGING_IMAGE_PINS.md)
    ↓
SECURITY GATE (flags empty; secrets present; no CHANGE_ME)
    ↓
BACKUP (primary) — before migrate/swap
    ↓
MIGRATIONS (forward-only migrate job)
    ↓
API (replicas=1, scheduler owner)
    ↓
WORKER
    ↓
FRONTEND
    ↓
REVERSE PROXY / TLS
    ↓
HEALTH (/api/live, /api/ready, FE probe)
    ↓
G12 (tenant isolation script against staging origin)
    ↓
G13 (Playwright staging config against public origins)
    ↓
EXTERNAL PROBE (uptime checks green)
```

## Preconditions

- Human decisions D1–D10 answered
- Implementation gate authorized
- Distinct secrets from local/dev/prod
- `ARGOS_COOKIE_SECURE=1`
- CORS/CSRF origins = staging HTTPS origin(s)
- Harness policy decided (D9)
- Local stash untouched; deploy from known Git SHA

## Record every deploy

| Field | Example |
|-------|---------|
| `GIT_SHA` | `5e1bf63…` |
| `IMAGE_DIGESTS` | api/worker/fe/postgres/minio |
| `STARTED_AT` / `FINISHED_AT` | UTC |
| `OPERATOR` | human id |
| `BACKUP_ID` | pre-deploy stamp |
| `G12` / `G13` | PASS/FAIL |
| `NOTES` | anomalies |

## Compose posture

Reuse `docker/docker-compose.staging.yml` as the application core.

External deltas (implementation gate later):

- Unpublish FE/API host ports; attach reverse proxy network
- Or publish only to `127.0.0.1` and proxy locally
- Never publish Postgres/MinIO
- Pin digests unchanged unless update procedure followed

## Scripts to reuse

| Script | Role |
|--------|------|
| `scripts/staging/bootstrap-env.sh` | Env template hygiene |
| `scripts/staging/up.sh` | Local up — adapt for remote carefully |
| `scripts/staging/security-redteam.sh` | Exposure checks |
| `scripts/staging/release-gates.sh` | Gate recorder |
| `scripts/staging/g12-tenant-isolation.js` | Isolation |
| `playwright.staging.config.ts` | G13 |

## STOP if

- Wrong Git SHA checked out
- Secrets contain `CHANGE_ME`
- Second API with scheduler would start
- Deploy would touch production resources
- Backup step skipped
