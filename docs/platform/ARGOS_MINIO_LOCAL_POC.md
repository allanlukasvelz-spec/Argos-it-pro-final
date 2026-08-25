# ARGOS MinIO Local POC

```
STATUS = LOCAL/TEST ONLY
PRODUCTION = NO
PUBLIC = NO
```

## Purpose

Prove `EvidenceService` works with an S3-compatible backend (MinIO) without replacing `LocalPrivateObjectStore` for dev.

## Start

```bash
cp docker/.env.minio-poc.example docker/.env.minio-poc
# Edit passwords in docker/.env.minio-poc (never commit)

docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.minio-poc.yml \
  --env-file docker/.env.minio-poc \
  up -d minio minio-init
```

## Teardown

```bash
docker compose \
  -f docker/docker-compose.yml \
  -f docker/docker-compose.minio-poc.yml \
  down -v
```

## Port governance

| Port | Service | Bind | Auth | PUBLIC |
|------|---------|------|------|--------|
| 9000 | MinIO S3 API | 127.0.0.1 | access keys | NO |
| 9001 | MinIO Console | 127.0.0.1 | root user/pass | NO |

## Security properties

- Private Docker network for inter-container traffic
- Published ports bound to **127.0.0.1** only
- `minio-init` sets bucket policy **none** (no anonymous access)
- Credentials from env files only — **not committed**
- No AWS / cloud credentials

## Backend configuration

Set in `backend/.env` (local) or export before start:

```
ARGOS_EVIDENCE_STORE=s3
ARGOS_EVIDENCE_S3_ENDPOINT=http://127.0.0.1:9000
ARGOS_EVIDENCE_S3_BUCKET=argos-evidence-poc
ARGOS_EVIDENCE_S3_ACCESS_KEY=...
ARGOS_EVIDENCE_S3_SECRET_KEY=...
ARGOS_EVIDENCE_S3_FORCE_PATH_STYLE=true
```

## Optional live test

```bash
ARGOS_MINIO_POC=1 node --test backend/lib/platform/s3CompatibleObjectStore.test.js
```

Requires MinIO running and env vars set.
