# ARGOS — Security Pre-Production Checklist

## Identity & session

- [ ] Distinct staging `JWT_SECRET` / `JWT_REFRESH_SECRET` (≥32, different)  
- [ ] Cookie flags: HttpOnly access/refresh; Secure when HTTPS  
- [ ] CSRF Origin allowlist = staging frontend only  
- [ ] CORS credentials limited to staging origins  
- [ ] Session/refresh revocation path tested  

## Authorization

- [ ] `org_admin` cannot access `/api/noc/*`  
- [ ] Client cannot cross-tenant reports/evidence/notifications  
- [ ] Agent credential revoke works  
- [ ] NOC actions audited in `security_logs`  

## Test surfaces (CRITICAL)

| Surface | Staging | Production |
|---------|---------|------------|
| `POST /api/test/*` | Prefer unset flag; if `NODE_ENV=production` not mounted | Must not mount |
| `ARGOS_ALLOW_RATE_LIMIT_RESET` | UNSET | UNSET |
| `ARGOS_REPORT_PDF_STUB` | UNSET | UNSET |
| `ALLOW_NOC_SELF_APPROVAL` | UNSET | UNSET |
| `ARGOS_MINIO_POC` | UNSET | UNSET |

If production can enable test surfaces while serving traffic → **SECURITY_BLOCKER**.

CURRENT: `/api/test` requires non-production `NODE_ENV` **and** flag — verify staging uses `NODE_ENV=production` **or** accepts residual risk with flag unset.

## Network

- [ ] PG/MinIO not publicly reachable  
- [ ] No public buckets  
- [ ] No direct Client object URLs  

## Rate limits

- [ ] Auth limits enabled  
- [ ] Understand in-memory limits ≠ shared across replicas  

## Supply chain

- [ ] `package-lock` committed  
- [ ] Images pinned  
- [ ] `npm audit` reviewed (no silent force)  
