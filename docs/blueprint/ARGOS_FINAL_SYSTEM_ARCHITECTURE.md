# ARGOS — System architecture (CURRENT vs TARGET)

```
HEAD = ec27eb9
DO_NOT_MIX_CURRENT_AND_TARGET
```

---

## 1. CURRENT ARCHITECTURE (Phases 0–2 only)

```
[Browser Next.js :3000]
   public pages + /auth + /dashboard (monolith)
   mascot dock → /api/ai/public/* (proxy)
        │  cookies HttpOnly
        ▼
[Express :4000]
   helmet → cors → cookies → json 512kb → morgan → ratelimit → csrf origin
   /api/auth/*
   /api/contact
   /api/ai  (user_id)
   /api/security  (user_id / admin global)
   /api/client/*  (JWT → tenantContext → organization_id)
        │
        ▼
[PostgreSQL 16]
   users, organizations, members, assets, tls_certificates,
   portal tables, logs, refresh_sessions
   (+ client_diagnostics via ensure)
```

Socket.IO opcional (`ENABLE_SOCKET_IO`): no hay cliente frontend real. No es monitoring.

Docker: `docker/docker-compose.yml` postgres + backend + frontend. Producción: Coolify/VPS documentado en `docs/infrastructure/` — **no tocar** en esta fase.

### Frontend structure (CURRENT)

`frontend/app/*` routes · `components/layout` + `corporate` · `lib/api.ts` axios `withCredentials` · `lib/auth.ts` · `proxy.ts` guard dashboard/auth.

### Backend structure (CURRENT)

`server.js` · `middleware/auth.js` cookie-only · `tenantContext.js` · `routes/client.js` `clientAssets.js` `clientDiagnostics.js` · `lib/ensureOrganizations.js` `ensureAssets.js` `hostnameSecurity.js` `tlsStatus.js`.

### What CURRENT cannot do

- Periodic checks / scheduler
- Health derived from monitors
- Product alerts/incidents
- NOC
- Cross-tenant staff console
- Enforce org_role
- Declare PROTECTED from coverage

---

## 2. TARGET ARCHITECTURE

```
                    PUBLIC          CLIENT PORTAL         NOC
                    Next.js          Next.js              Next.js
                         \              |                  /
                          \             |                 /
                           +----- API GATEWAY / EXPRESS ----+
                           |  auth    tenant    staff RBAC  |
                           +---------------+----------------+
                                           |
                    +----------------------+----------------------+
                    |                      |                      |
                 AUTH/TENANCY         OPERATIONS CORE         OBSERVABILITY
                 memberships          health/risk engines     ARGOS self-health
                 assets/TLS           alerts/incidents        PHASE_10
                                      runbooks/remediation
                                      notifications
                                           |
                                      POSTGRESQL
                                      (+ object store FUTURE for evidence blobs)
```

| Block | Status |
|-------|--------|
| Auth / tenancy / assets / TLS | DONE |
| Client APIs portal | DONE (subset) |
| Monitor scheduler + checks | PHASE_3 |
| Health / risk / alert / incident | PHASE_3 |
| Client IA completa | PHASE_4 |
| NOC + `/api/noc` | PHASE_5 |
| Runbooks / remediation exec | PHASE_6 |
| Agents | PHASE_7 |
| Notifications / reports | PHASE_8 |
| Preventive intelligence | PHASE_9 |
| Self-monitoring | PHASE_10 |

### TARGET frontend

- Public: conservar App Router; Relume puede añadir páginas **sin** borrar las actuales.
- Client: App Shell + rutas hijas `/dashboard/*`. Reutilizar `lib/api.ts` y tenant cookie.
- NOC: árbol `/noc/*`, chrome denso, **otro** layout. Misma app Next salvo decisión futura de split (no requerida para V1).
- No Socket.IO obligatorio para V1; polling/SSE PHASE_8+.

### TARGET backend

Módulos (nombres lógicos, no creados ahora):

| Module | Phase | Duty |
|--------|-------|------|
| `monitorRunner` | 3 | schedule + execute checks |
| `healthEngine` | 3 | derive health from observations + coverage |
| `alertEngine` | 3 | open/close/dedup alerts |
| `incidentEngine` | 3 | group alerts → incidents |
| `riskEngine` | 6–9 | DETECTED/INFERRED/PREDICTED |
| `remediationEngine` | 6 | A/B/C + safety levels |
| `agentIngest` | 7 | heartbeats + observations from agents |
| `notify` | 8 | email/ntfy/etc |
| `nocApi` | 5 | staff cross-tenant, still parameterized by org on each query |

Reutilizar: `hostnameSecurity`, `tlsStatus`, `resolveTenantContext`, isolation test pattern.

### TARGET data flow (happy path)

```
Asset (DONE)
  → Monitor config (P3)
  → Check result Observation (P3)
  → Health snapshot (P3)
  → Alert (P3)
  → Incident (P3)
  → Visible in client APIs (P3/P4)
  → Visible in NOC (P5)
  → Runbook A/B/C (P6)
```

---

## 3. Dependency graph

```
Organizations
  → Memberships
    → Assets
      → Monitors
        → Observations
          → Health
            → Risks
              → Alerts
                → Incidents
                  → Runbooks
                    → Remediations
```

Branches:

```
Agents → Observations
Notifications ← Alerts / Incidents
Reports ← Historical observations + incidents
Client Portal ← Tenant-scoped APIs
NOC ← Staff APIs (same DB, different authz)
```

---

## 4. Critical path / MVP

MVP de protección real (no marketing):

```
organization → asset → monitor → check → observation
→ health → alert → incident → client visibility → NOC visibility
```

| Piece | Class |
|-------|--------|
| organization, asset | DONE |
| monitor…incident + una vista cliente honesta + una vista staff mínima | MVP |
| portal completo + NOC completo | V1 |
| A/B/C execution + agents | V1.5 |
| prediction ML, marketplace, billing | FUTURE |

Staff mínima en MVP puede ser API + UI austera, no Command Center final (ese es PHASE_5 / Relume).

---

## 5. Infrastructure notes (CURRENT, not changed)

| Item | State |
|------|--------|
| Postgres 16 | REQUIRED |
| `DATABASE_URL` | REQUIRED or backend crash |
| JWT secrets ≥32 distinct | REQUIRED |
| OPENAI_API_KEY | optional; public AI 503 without it |
| Production DNS/certs/secrets | DO NOT TOUCH in this phase |
| `migrate.sh` applying `_down.sql` | RISK — fix in a dedicated hardening task, not Phase 3 product |

---

## 6. Frontend/backend contract rules

1. Client never sends `organization_id` as source of truth; header only selects among memberships.
2. NOC APIs require staff role; still **bind every query** to an explicit org id from server-side selection.
3. UNKNOWN must be representable in JSON (`health: "UNKNOWN"`, `coverage: { … }`).
4. Demo numbers only if `source: "MOCK"` — production APIs must not emit fake scores.
5. OpenAPI: not present CURRENT; FUTURE (PHASE_12 docs). Until then, route tables in this blueprint + tests are the contract.
