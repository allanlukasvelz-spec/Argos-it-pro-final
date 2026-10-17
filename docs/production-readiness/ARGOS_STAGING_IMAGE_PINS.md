# ARGOS — Staging Image Pins

```
SCOPE = staging Compose only
NO latest for staging-critical services
```

| Service | Image / base | Digest / tag | Reason | Update procedure |
|---------|--------------|--------------|--------|------------------|
| PostgreSQL | `postgres:16.6-alpine` | `sha256:1d04b9ba1d4996401f2552b51beda8187f175c0645c091e4781134fc9c9a3eef` (arm64 host pin) | Reproducible PG 16 | Pull candidate → smoke migrate → update compose digests |
| MinIO | `minio/minio:RELEASE.2024-12-18T13-15-44Z` | `sha256:1dce27c494a16bae114774f1cec295493f3613142713130c2d22dd5696be6ad3` | Immutable release tag | Same + verify health endpoint + bucket ACL |
| MinIO mc | `minio/mc:RELEASE.2024-11-17T19-35-25Z` | `sha256:8f94d208188dcd04bbaa51b54578bb43ea2a663626ca59889c07d4fb8ae9546d` | Init/mirror tooling | Keep in lockstep with server major |
| Node (API/FE/worker) | `node:22.14.0-bookworm-slim` | `sha256:1c18d9ab3af4585870b92e4dbc5cac5a0dc77dd13df1a5905cea89fc720eb05b` (arm64 host pin) | Staging Dockerfiles | Rebuild images; run `/api/ready` + worker heartbeat |
| Playwright (worker) | `playwright@1.59.1` + Chromium (install in image) | npm pin | PDF path | Bump with `@playwright/test` in lockstep; rebuild worker |

## Exceptions

- Chromium in worker: `--no-sandbox`, writable `/tmp` (documented in Compose `tmpfs`).
- Local **dev** `docker-compose.yml` may still use floating Node alpine tags — not staging.

## Policy

`latest_remaining` for staging-critical services must be **none**.
