# ARGOS — Staging Security Result

```
SECURITY_GATE = PASS
STOP_SECURITY_GATE = NO
DATE = 2026-08-26
```

## Red-team checks (`scripts/staging/security-redteam.sh`)

| Finding | Result |
|---------|--------|
| Public PostgreSQL host publish | PASS (not published) |
| Public MinIO API | PASS (not published) |
| Public MinIO console | PASS (not published) |
| Worker inbound port | PASS (none) |
| `/api/test/*` | PASS (404/403) |
| Privileged containers | PASS (false) |
| Docker socket mounts | PASS (absent) |
| `ARGOS_ALLOW_RATE_LIMIT_RESET` | PASS (empty) |
| `ARGOS_REPORT_PDF_STUB` | PASS (empty) |
| `ALLOW_NOC_SELF_APPROVAL` | PASS (empty) |
| Anonymous / public bucket | PASS (`private`) |
| CHANGE_ME secrets in runtime env | PASS (bootstrap generated) |

## Fail-closed code policy

`backend/lib/ops/testSurfacePolicy.js`:

- Staging/production runtime never mounts `/api/test`
- Rate-limit reset requires `NODE_ENV` in `{test,development}` **and** explicit flag
- PDF stub forbidden in staging/production even if flag set
- NOC self-approval forbidden in staging/production

## Residual risks (accepted for S0 staging)

- MinIO root credentials == evidence S3 keys (local staging only)
- Dual DDL (`migrate` + `ensure*`) still present — migrate is authority for staging boot order; ensure* needs `/database` mount
- In-memory rate limits (scale blocker)
