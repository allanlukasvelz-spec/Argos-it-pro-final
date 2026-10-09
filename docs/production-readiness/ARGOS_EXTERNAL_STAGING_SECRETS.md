# ARGOS — External Staging Secrets Model

```
COMMIT_ALLOWED = NO (for secret values)
VALUES_IN_THIS_DOC = NONE
VAULT = OPTIONAL (S0 may use host file 0600)
```

Canonical classification: [ARGOS_CONFIGURATION_SECRET_MATRIX.md](./ARGOS_CONFIGURATION_SECRET_MATRIX.md).

## Inventory (names only)

| Secret | SOURCE | ROTATION | CONSUMER | EXPOSURE_BOUNDARY | COMMIT |
|--------|--------|----------|----------|-------------------|--------|
| `STAGING_POSTGRES_PASSWORD` / `DATABASE_URL` | Generated at provision; host secret file or SM | On leak / quarterly | postgres, migrate, api, worker | Private host / SM | NO |
| `STAGING_JWT_SECRET` | Generate ≥32 | On compromise | api (auth cookies) | Private | NO |
| `STAGING_JWT_REFRESH_SECRET` | Distinct from access | On compromise | api | Private | NO |
| `STAGING_MINIO_ROOT_*` / S3 keys | Generate; never reuse local POC | On leak | minio, api, worker | Private Docker net / SM | NO |
| `ARGOS_STAGING_HARNESS_TOKEN` | Generate ≥32; no `CHANGE_ME` | After each suspected leak; after operator change | api + CI/E2E only | Operator/CI; not browsers | NO |
| Synthetic NOC admin passwords | Harness output one-shot | Destroy after suite | Playwright / ops | Ephemeral | NO |
| Agent enrollment tokens | Created via NOC API | Short TTL; revoke | Synthetic agents only | Private tests | NO |
| TLS private key | ACME / cert manager | Auto renew | Reverse proxy | Proxy host only | NO |
| SSH host keys / deploy keys | Host provision | On staff change | Operators | Bastion | NO |
| `OPENAI_API_KEY` | Optional | Provider rotate | api | Private | NO |
| Backup encryption key | Separate from DB password | Annually / leak | backup scripts | Offline / SM | NO |
| Off-host backup credentials | Object storage / rsync target | On leak | backup job | Backup destination only | NO |

## S0 secure alternative (no Vault)

1. Host file `/etc/argos/staging.env` mode `0600`, owner deploy user  
2. Loaded only by Compose `--env-file` (gitignored; never in image layers)  
3. Separate from developer `backend/.env` and local `docker/.env.staging`  
4. Encrypted off-host copy of env **names + retrieval procedure** (not plaintext in git)  
5. Break-glass: two-operator password manager entry (human process)

Vault/Secrets Manager justified when: multi-operator, automated rotate, or compliance requires it (D8).

## Fail-closed reminders

| Item | Rule |
|------|------|
| Example templates | May contain `CHANGE_ME_*` only |
| Test flags | Empty / unset on external staging |
| Prod reuse | Forbidden — distinct JWT/DB/S3 |
| Image env | Prefer runtime inject over `ENV` with secrets in Dockerfile |
| Logs | Never print tokens, cookies, or harness passwords |

## Cookie / origin pairing

| Variable | External staging |
|----------|------------------|
| `ARGOS_COOKIE_SECURE` | `1` |
| `FRONTEND_URL` / `CORS_ORIGINS` | Exact `https://staging.<domain>` |
| `NEXT_PUBLIC_BACKEND_URL` | Public API origin as reached by browsers |

Domain values: **REQUIRED_HUMAN_INPUT** (D3).
