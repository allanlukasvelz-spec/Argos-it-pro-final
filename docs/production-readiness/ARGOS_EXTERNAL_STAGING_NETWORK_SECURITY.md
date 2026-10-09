# ARGOS — External Staging Network & Security

```
POSTGRES_PUBLIC = NO
OBJECT_STORE_PUBLIC = NO
MINIO_CONSOLE_PUBLIC = NO
WORKER_INBOUND_PUBLIC = NO
WILDCARD_CORS = NO
```

## Trust diagram

```
INTERNET
   |
   v
[ TLS reverse proxy :443 ]   ← only public entry (staging hostname)
   |
   +----> Frontend (container / :3000 private)
   |
   +----> API (container / :4000 private)
              |
              +----> PostgreSQL  PRIVATE (Docker net / VPC only)
              |
              +----> Object store PRIVATE (MinIO :9000 or managed S3 VPC/endpoint)
              |
              +----> Worker      PRIVATE (no publish)
              |
              +----> Scheduler   (in-process on single API owner)

MinIO console :9001 — admin/operator only via SSH tunnel or private VPN — NEVER public.
```

## Public vs private services

| Service | Public | Notes |
|---------|--------|-------|
| Reverse proxy HTTPS | YES | Staging hostname only |
| Frontend | via proxy only | No direct host publish preferred |
| API | via proxy only | Same-origin or explicit API host |
| PostgreSQL | **NO** | |
| MinIO API | **NO** | App reaches it on Docker network |
| MinIO console | **NO** | |
| Worker | **NO** | |
| Staging harness | **Not public by intent** | Token + optional IP allowlist (D9) |

## Firewall policy (host)

```
ALLOW: 0.0.0.0/0 → tcp/443 (and tcp/80 redirect only)
ALLOW: operators (VPN/bastion) → tcp/22 (key-only)
DENY:  world → 5432, 9000, 9001, 4000, 3000 (if published, prefer unpublish)
DENY:  Docker daemon socket to containers (already staging posture)
```

Align with [ARGOS_PORT_NETWORK_MATRIX.md](./ARGOS_PORT_NETWORK_MATRIX.md).

## Application security posture (external)

| Control | External staging requirement |
|---------|------------------------------|
| CORS | Exact staging origin(s) only — no `*` |
| CSRF | Origin allowlist = frontend origin(s) |
| Cookies | `Secure` + `HttpOnly` + `SameSite=Lax` (`ARGOS_COOKIE_SECURE=1`) |
| NOC | `requireNocAccess` — admin/super_admin only; org_admin DENIED |
| Tenant isolation | Unchanged; re-prove G12 after deploy |
| Test surfaces | `/api/test` fail-closed (`ARGOS_ENVIRONMENT=staging`, flags empty) |
| Staging harness | Token ≥32; not `CHANGE_ME`; production incapable (`ARGOS_ENVIRONMENT≠staging`) |
| Rate limits | In-memory — accept S0; multi-API still blocked by B6 |

## Staging harness (external)

Current code (`backend/routes/stagingHarness.js`):

- Mounts only if `ARGOS_ENVIRONMENT=staging` **and** strong token
- Wrong/missing token → **404**
- Does not bypass `requireNocAccess` for `/api/noc/*`
- Synthetic users; real `/api/auth/login` required

External additions (policy, not yet implemented):

| Control | Recommendation |
|---------|----------------|
| Token | Unique per environment; rotate on leak; store off-repo |
| Network | Prefer restrict harness to operator VPN / CI egress IPs (D9) |
| Lifetime | Synthetic passwords one-shot; revoke users after suites |
| Audit | Log harness provision events (ops log); no secrets in logs |
| Disable | Empty `ARGOS_STAGING_HARNESS_TOKEN` unmounts surface |

Production: `ARGOS_ENVIRONMENT=production` → harness **cannot** mount.

## Anti-patterns (STOP)

- Publishing Postgres or MinIO “temporarily for debugging”
- Pointing staging Compose at production `DATABASE_URL` / buckets
- Wildcard CORS to “make browsers work”
- `ARGOS_COOKIE_SECURE=0` on public HTTPS (session theft risk)
- Enabling harness without token or with example `CHANGE_ME`
