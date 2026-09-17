# ARGOS MinIO Local POC

```
STATUS = LOCAL/TEST ONLY
PRODUCTION = NO
PUBLIC = NO
MINIO_IMAGE_POLICY = POC_ONLY
```

## Purpose

Prove `EvidenceService` works with an S3-compatible backend (MinIO) without replacing `LocalPrivateObjectStore` for dev.

## Image policy

Docker images use `latest` **temporarily** for local POC reproduction.

```
MINIO_IMAGE_POLICY=POC_ONLY
```

Before any production adoption, pin a verified immutable MinIO version/digest.

**`latest` is NOT production-safe.**

## Start

```bash
cp docker/.env.minio-poc.example docker/.env.minio-poc
# Edit passwords in docker/.env.minio-poc (never commit)

docker compose \
  -f docker/docker-compose.minio-poc.yml \
  --env-file docker/.env.minio-poc \
  up -d minio minio-init
```

If host port **9000** is occupied, set collision-safe ports in `docker/.env.minio-poc`:

```
MINIO_API_PORT=9010
MINIO_CONSOLE_PORT=9011
```

Then export `MINIO_API_PORT=9010` when running live validation.

## Teardown

```bash
docker compose \
  -f docker/docker-compose.minio-poc.yml \
  --env-file docker/.env.minio-poc \
  down -v
```

## Port governance

| Port | Service | Bind | Auth | PUBLIC | Notes |
|------|---------|------|------|--------|-------|
| 9000 | MinIO S3 API | 127.0.0.1 | access keys | NO | canonical default |
| 9001 | MinIO Console | 127.0.0.1 | root user/pass | NO | canonical default |
| 9010 | MinIO S3 API | 127.0.0.1 | access keys | NO | local collision-safe (validated 2026-08-26) |
| 9011 | MinIO Console | 127.0.0.1 | root user/pass | NO | local collision-safe (validated 2026-08-26) |

## Security properties

- Private Docker network for inter-container traffic
- Published ports bound to **127.0.0.1** only
- `minio-init` sets bucket policy **none** (no anonymous access)
- Credentials from env files only — **not committed**
- No AWS / cloud credentials

## Backend configuration

Set in `backend/.env` (local) or rely on `docker/.env.minio-poc`:

```
ARGOS_EVIDENCE_STORE=s3
ARGOS_EVIDENCE_S3_ENDPOINT=http://127.0.0.1:9000
ARGOS_EVIDENCE_S3_BUCKET=argos-evidence-poc
ARGOS_EVIDENCE_S3_ACCESS_KEY=...
ARGOS_EVIDENCE_S3_SECRET_KEY=...
ARGOS_EVIDENCE_S3_FORCE_PATH_STYLE=true
```

When using alternate host ports, set `MINIO_API_PORT` — the live script derives the endpoint.

## Live validation

Documented record: `docs/architecture/ARGOS_OBJECT_STORAGE_LIVE_VALIDATION.md`

```bash
# Ordinary backend verify (MinIO live SKIPPED)
npm run verify:backend

# With MinIO running locally
MINIO_API_PORT=9010 ARGOS_MINIO_POC=1 npm run verify:backend

# Live flow only
MINIO_API_PORT=9010 npm run verify:minio-live
```

Requires MinIO running, PostgreSQL with migration 006, and env files present.
