# ARGOS — Configuration & Secret Matrix

```
NEVER PRINT SECRET VALUES
SOURCE = .env.example + code references @ 93b838f
```

## Classification legend

| Class | Meaning |
|-------|---------|
| PUBLIC | Safe in client bundle or non-sensitive config |
| INTERNAL_CONFIG | Server config; not a credential |
| SECRET | Credential / signing key — vault/file 0600 / secret store |
| TEST_ONLY | Must be absent or inert in staging/production |
| DEPRECATED/UNKNOWN | Review |

## Backend

| Variable | Class | Staging | Production | Notes |
|----------|-------|---------|------------|-------|
| `PORT` | INTERNAL_CONFIG | set | set | Default 4000 |
| `NODE_ENV` | INTERNAL_CONFIG | `production` preferred | `production` | Gates `/api/test` |
| `DATABASE_URL` | SECRET | unique staging | unique prod | Least-privilege app role |
| `JWT_SECRET` | SECRET | unique ≥32 | unique ≥32 | Rotate on compromise |
| `JWT_REFRESH_SECRET` | SECRET | distinct from JWT | distinct | |
| `CORS_ORIGINS` | INTERNAL_CONFIG | staging origins only | prod origins | |
| `FRONTEND_URL` | INTERNAL_CONFIG | staging URL | prod URL | CSRF allowlist |
| `ENABLE_SOCKET_IO` | INTERNAL_CONFIG | `false` | `false` until product | |
| `ENABLE_MONITOR_SCHEDULER` | INTERNAL_CONFIG | `true` on **one** API | same | |
| `OPENAI_API_KEY` | SECRET | optional | optional | AI 503 without |
| `OPENAI_MODEL` / `OPENAI_TIMEOUT_MS` / `AI_MESSAGE_MAX_LEN` | INTERNAL_CONFIG | set | set | |
| `RATE_LIMIT_*` / `AUTH_*` / `AI_*` / `CONTACT_*` | INTERNAL_CONFIG | set | set | In-memory stores |
| `CONTACT_FORM_ENDPOINT` | INTERNAL_CONFIG | staging sink | prod | |
| `LOG_LEVEL` | INTERNAL_CONFIG | `info` | `info`/`warn` | |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | INTERNAL_CONFIG | unset until wired | later | No-op today |
| `ARGOS_PLATFORM_TELEMETRY_LOG` | INTERNAL_CONFIG | `0` or `1` debug | `0` | |
| `ARGOS_ALLOW_RATE_LIMIT_RESET` | TEST_ONLY | **UNSET** | **UNSET** | Mounts `/api/test` only if also non-prod |
| `ARGOS_REPORT_PDF_STUB` | TEST_ONLY | **UNSET** | **UNSET** | Fake PDF |
| `ALLOW_NOC_SELF_APPROVAL` | TEST_ONLY / dangerous | **UNSET** | **UNSET** | |
| `ARGOS_MINIO_POC` | TEST_ONLY | **UNSET** | **UNSET** | Verify gate only |
| `ARGOS_EVIDENCE_STORE` | INTERNAL_CONFIG | `local` or `s3` | `s3` target | |
| `ARGOS_EVIDENCE_ROOT` | INTERNAL_CONFIG | volume path | N/A if s3 | |
| `ARGOS_EVIDENCE_MAX_BYTES` / `QUOTA_BYTES` | INTERNAL_CONFIG | set | set | |
| `ARGOS_EVIDENCE_S3_*` | SECRET + config | if s3 | if s3 | Access/secret keys SECRET |
| `ARGOS_WORKER_POLL_MS` | INTERNAL_CONFIG | 2000 | 2000 | |
| `AGENT_*_MS` | INTERNAL_CONFIG | defaults OK | tune | |

## Frontend

| Variable | Class | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_BACKEND_URL` | PUBLIC | Client-visible API base |
| `BACKEND_URL` | INTERNAL_CONFIG | Server-side proxy if used |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC | |
| `NEXT_PUBLIC_CONTACT_FORM_ENDPOINT` | PUBLIC | |

## MinIO POC (must not become staging secret source)

| Variable | Class |
|----------|-------|
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | SECRET |
| `MINIO_API_PORT` / `MINIO_CONSOLE_PORT` | INTERNAL_CONFIG |

## Secrets strategy (TARGET)

1. Staging secrets file or host secret manager — **not** committed  
2. Distinct from developer `.env`  
3. Rotation runbook for JWT pair + DB + S3  
4. Vault = **DEFERRED** unless multi-operator staging requires it  
5. CI secrets separate from staging runtime  

## Fail-closed expectations

| Flag | Fail-closed |
|------|-------------|
| Missing JWT secrets | Auth 500 / boot refusal (short secret rejected) |
| `NODE_ENV=production` | `/api/test` not mounted |
| Evidence store misconfig | EvidenceService errors; no public fallback |
| Self-approval | Denied unless explicit flag |
