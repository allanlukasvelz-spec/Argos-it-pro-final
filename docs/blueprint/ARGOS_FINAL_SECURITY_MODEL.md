# ARGOS — Security model

```
LEVEL = 1 (cannot be overridden by Relume/Framer)
HEAD = ec27eb9
```

---

## 1. Identidad (CURRENT = DONE)

| Control | Implementado |
|---------|--------------|
| Password ≥10 + upper + lower + digit | SÍ |
| bcrypt | SÍ |
| Access JWT cookie `argos_access` | SÍ (24h) |
| Refresh JWT `argos_refresh` path `/api/auth` + jti rotation | SÍ |
| Bearer header rejected | SÍ |
| Logout revokes jti | SÍ |
| CSRF Origin on cookie mutations | SÍ |
| Rate limit auth 8/15m | SÍ |

JWT claims CURRENT: `{ id, email, role }`. Tenant **no** va en el token (correcto: membership puede cambiar).

---

## 2. Tenancy (CURRENT = DONE en `/api/client/*`)

```
JWT → User → Memberships → resolveActiveOrganization(requestedId)
→ req.tenant.id → SQL WHERE organization_id = $id
```

`requestedId` solo desde header `X-Argos-Organization-Id` o query, **y** debe pertenecer a memberships activas. Body org id se ignora (diagnostics).

Fail-closed: `NO_ORGANIZATION_MEMBERSHIP`, `INACTIVE_ORGANIZATION`, `TENANT_REQUIRED`.

Admin global no entra a `/api/client` sin tenant.

Tests: `tenantContext.test.js`, `client.isolation.test.js`, `clientAssets.isolation.test.js`.

### Deuda (PARTIAL)

| Hueco | Riesgo | Fase |
|-------|--------|------|
| `/api/ai/*` por `user_id` | fuga de memoria IA entre orgs si un user tiene 2 orgs / o datos no portables | 4/1.1 |
| `/api/security/dashboard` por `user_id` | no es health de assets; confusión + posible mezcla | 5 o 1.1 |
| `org_role` no enforced | viewer puede CRUD assets | 4 |
| `ai_memory` sin org | ver arriba | 4 |
| `organization_id` nullable en tablas portal legacy | escrituras viejas | 4 |

---

## 3. Autorización TARGET

### Roles globales (`users.role`)

| Rol | Público | Portal de **su** org | NOC |
|-----|---------|----------------------|-----|
| visitante | sí | no | no |
| cliente / cliente_verificado | sí | según membership | no |
| admin / super_admin | sí | solo si membership (no bypass client API) | sí |

### Roles de org (enforcement TARGET = PHASE_4)

| org_role | Read portal | Mutate assets | Approve L3 | Billing FUTURE |
|----------|-------------|---------------|------------|----------------|
| org_viewer | sí | no | no | no |
| org_member | sí | limitado (improvements/messages) | no | no |
| org_admin | sí | sí | sí (org-scoped) | no |
| org_owner | sí | sí | sí | sí |

NOC no usa `org_role` del cliente para autorizar; usa rol global staff + selección explícita de org.

---

## 4. Aislamiento visual y de API

```
ORG A  ─X─>  ORG B
```

- IDOR: 404.  
- List endpoints: filtro org obligatorio (nunca “si olvidas el where, ves todo”).  
- NOC tables: cada row muestra customer; queries `WHERE organization_id = ?` aunque el actor sea super_admin.  
- Logs: no escribir secretos (tokens, passwords, private keys).  
- Discover: `hostnameSecurity.js` — no SSRF a link-local/metadata.

---

## 5. Amenazas y controles

| Amenaza | CURRENT | TARGET extra |
|---------|---------|--------------|
| Auth bypass | cookie-only + tests | session fixation review P10 |
| Tenant leakage | isolation tests client | same for alerts/incidents/NOC |
| Role escalation | requireRole admin stats only | org_role + staff RBAC |
| SSRF | hostname guards on discover | same on all monitors that fetch URLs (P3) |
| Secret exposure | env files gitignored | agent tokens hashed (P7) |
| CSRF | Origin guard | keep |
| XSS | React defaults | no `dangerouslySetInnerHTML` with observations |
| Alert-driven RCE | N/A | Level 4 never auto; command allowlists P6 |
| Agent compromise | N/A | scoped tokens, heartbeat auth, isolate ingest P7 |
| False HEALTHY | portal muestra `—` sin audit | coverage rules P3 |

---

## 6. Automation safety (producto = seguridad)

Level 0–4: ver Master Blueprint §13.  
Level 3+ sin ApprovalGate = **bug de seguridad**, no de UX.  
Framer/Relume no pueden bajar el nivel.

---

## 7. Monitorización de ARGOS (PHASE_10)

Si ARGOS no puede observar, no puede afirmar HEALTHY de clientes. Self-health: DB ping (CURRENT `/api/health`), más scheduler heartbeat, queue depth, last successful check age.

`/api/health` TODAY: 503 `{ status: DEGRADED, db: disconnected }` — reutilizar patrón.

---

## 8. Prohibiciones operativas de esta ejecución

No: `.env`, secrets, DNS, certs, production, stash apply, migrations of new tables, push.

---

## 9. Security tests required before any Phase 3 DONE

- Cross-org IDOR on every new resource (monitor, observation, alert, incident).  
- Header spoof org id.  
- Staff vs client on `/api/noc`.  
- SSRF on monitor targets.  
- Payload cannot force health=HEALTHY without observations.  
- No private key in TLS JSON (already tested).  
- Rate limit check-create if client-triggered.

Patrón: copiar `clientAssets.isolation.test.js`, no un test “feliz” único.
