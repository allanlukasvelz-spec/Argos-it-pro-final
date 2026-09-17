# ARGOS Multitenant — Auditoría READ-ONLY y plan

**Branch:** `feature/argos-multitenant-platform`  
**Checkpoint tag:** `argos-pre-multitenant-2026-08-24` → `aa8ce1a`  
**origin/main:** `aa8ce1a`  
**Date:** 2026-08-24  
**Mode:** ANALYSIS FIRST · production changes = NO

---

## Git / Relume reference

```
BRANCH = feature/argos-multitenant-platform
CHECKPOINT = argos-pre-multitenant-2026-08-24
MAIN_PROTECTED = YES
HEAD = aa8ce1a
```

### `docs/design/ARGOS_RELUME_REVIEW_21_7C.md`

| Pregunta | Resultado |
|----------|-----------|
| ¿Existe en esta rama / main? | **NO** |
| ¿Existe en Git? | **SÍ** — solo en `design/21-7c-relume-framer-freeze` |
| Creado | `a86f48c` |
| Última versión | `2f1b299` (`docs/design/ARGOS_RELUME_REVIEW_21_7C.md`) |
| Blob | `2d0d71ad21e35bd4ee43d6b2d6105b16219d7ecc` |

**Conclusión:** la pestaña abierta es **referencia obsoleta**. El archivo vive en la rama documental de diseño 21.7C y **nunca se fusionó a main**. No se crea vacío. No se restaura en esta rama salvo decisión humana explícita (origen exacto: `2f1b299` en `design/21-7c-relume-framer-freeze`).

---

## ===== CURRENT_ARCHITECTURE_MAP =====

### Frontend (Next.js App Router)

| Área | Estado |
|------|--------|
| Web pública | `/`, `/servicios`, `/metodo`, `/sobre-argos-it`, `/contacto`, legales |
| Auth UI | `/auth/login`, `/auth/register` |
| Área privada | **`/dashboard`** (portal cliente monolítico) |
| Labs | `/explainer`, `/mascot-motion-lab` |
| Chrome | `getChromeOwner`: corporate solo `/contacto`; dashboard = `none` |
| Auth client | cookies HttpOnly vía backend; `frontend/lib/auth`, `frontend/proxy.ts` protege `/dashboard` |
| Tests | Playwright e2e (smoke, auth-flow, visual-regression, corporate-chrome) |

### Backend (Express :4000)

| Ruta | Auth | Rol |
|------|------|-----|
| `/api/auth/*` | público (login/register/refresh/logout) | — |
| `/api/contact` | público | — |
| `/api/ai/public` | público + rate limit | — |
| `/api/ai` | JWT cookie | cualquier autenticado |
| `/api/client/*` | JWT | cualquier autenticado (scoped por `req.user.id`) |
| `/api/security/dashboard` | JWT | propio usuario |
| `/api/security/stats` | JWT + `requireRole(admin\|super_admin)` | global |
| `/api/health` | público | DB ping |

**Aislamiento actual:** por **`user_id`** del JWT, no por organización/tenant.

### PostgreSQL (`database/schema.sql` + ensure-*)

| Tabla | Clave de aislamiento | Notas |
|-------|----------------------|-------|
| `users` | — | `company TEXT`, `role`, `client_verified`, `company_profile JSONB` |
| `ai_memory` | `user_id` | chat mascotas |
| `activity_logs` | `user_id` | |
| `security_logs` | `user_id` (nullable) | login fail sin user |
| `services` | global | catálogo |
| `form_submissions` | `user_id` | solicitudes/mensajes |
| `client_services` | `user_id` | contratados |
| `website_audits` | `user_id` | 1 auditoría “actual” en portal |
| `client_improvements` | `user_id` | |
| `client_messages` | `user_id` | |
| `refresh_sessions` | `user_id` | ensure al boot |
| `client_diagnostics` | `user_id` | ensure al boot |

**No existen:** `organizations`, `tenants`, `assets`, `domains`, `servers`, `certificates`, `monitors`, `alerts` (producto), `incidents` (producto), `evidence`, `recommendations` (tabla dedicada).

### Autenticación / roles

- Access JWT (cookie `argos_access`) + refresh (`refresh_sessions`, jti).
- Claims: `{ id, email, role }`.
- Roles texto: `visitante | cliente | cliente_verificado | admin | super_admin`.
- Elevación admin: SQL manual `database/seed_admin.sql`.
- **No hay** membership multi-org; un user = una “empresa” textual.

### Organizaciones / clientes existentes

- Campo `users.company` + `company_profile` JSON.
- Clientes conceptuales (UDIC, Flores Galí, Tuesetcn) **no** están modelados como entidades en BD.
- Portal “honesto”: sin filas de auditoría → score `—` (no inventa salud).

### Auditorías / diagnósticos

- `website_audits` (score, findings JSONB).
- `client_diagnostics` (riesgo low/medium/high/critical).
- No hay pipeline continuo de telemetría por activo.

### Incidentes / alertas / monitorización

| Capa | Qué hay |
|------|---------|
| Producto | `security_logs` + WS `chico_alert` / `security_alert` (acciones de usuario, no uptime de activos) |
| Infra VPS | scripts Coolify/rclone/ntfy en `docs/infrastructure/*` — **host ARGOS**, no por cliente |
| Control Center | **DEFERRED** (`CONTROL_CENTER_FROZEN = NO`) |

### Dominios / proyectos / integraciones

- No hay tablas de dominio/proyecto/servidor/certificado.
- Integraciones: Formspree contacto, OpenAI opcional, cookies auth.

### Administración

- Sin panel admin UI real.
- `GET /api/security/stats` único endpoint admin global documentado.
- Roadmap Fase 6: panel admin pendiente.

### Infra Docker / Compose

- `docker/docker-compose.yml`: postgres:16, backend, frontend.
- Init: `schema.sql` montado en Postgres.
- Producción: Coolify/VPS documentado; **no tocar** en esta fase.

### Tests / seguridad

- Backend: `auth.test.js`, verify scripts.
- E2E auth + smoke.
- Helmet, CORS, CSRF origin, rate limits, body 512kb.
- **Sin tests de aislamiento cross-tenant** (no hay tenants).

---

## ===== EXISTING_CAPABILITIES_TO_REUSE =====

1. **Auth JWT + cookies + refresh sessions** — base de identidad.
2. **`requireRole`** — patrón RBAC; extender a roles *dentro de tenant* + roles globales ARGOS.
3. **Portal `/dashboard` + `GET /api/client/portal`** — semilla del área privada; reestructurar, no duplicar.
4. **`website_audits` / `client_diagnostics` / `client_improvements`** — migrar a `organization_id`.
5. **`client_services`** — vínculo tenant↔servicios ARGOS.
6. **Activity / security logs** — auditoría operativa; añadir `organization_id` + actor.
7. **UI honesta de score ausente** — base del principio `NO_INCIDENTS_DETECTED` ≠ `FULLY_MONITORED_AND_HEALTHY`.
8. **Docker Compose + schema.sql** — canal de migrations versionadas.
9. **Proxy Next** — ampliar a futuras rutas `/app/*` o `/portal/*`.
10. **Diseño Quiet Authority congelado** — no rediseñar; portal mantiene shell legacy hasta fase visual dedicada.

---

## ===== MULTITENANT_GAP_ANALYSIS =====

| Capacidad objetivo | Hoy | Gap |
|--------------------|-----|-----|
| Tenant/Organization aislado | No | **Crítico** — crear entidad + membership |
| Usuarios multi-tenant | 1 user ≈ 1 company string | Membership + roles por org |
| Proyectos / sitios / dominios | No | Nuevas tablas asset |
| Servidores / endpoints / DBs | No | Nuevas tablas asset |
| Certificados TLS | No | Nueva tabla + monitor expiry |
| Monitores / telemetría | No (solo logs login) | Motor monitor + health states |
| Alertas / incidentes producto | Parcial (security_logs) | Modelo incidente/alerta + estados |
| Evidencias / informes | No | Fases posteriores |
| ARGOS supervisa todos | Solo stats security_logs | Admin ARGOS global + queries cross-tenant autorizadas |
| Aislamiento IDOR | user_id JWT | **tenant_id desde sesión**, nunca body |
| Distinción healthy vs unknown | Score null honesto | Explicit health enum |
| Área privada módulos | Dashboard monolítico | IA privada definitiva |
| Tests aislamiento | No | Obligatorios |

---

## ===== TARGET_ARCHITECTURE =====

### Principios

- **Shared database, shared schema, row-level tenant isolation** (fase 1–3).
- Opcional futuro: RLS PostgreSQL / schemas por tenant (fase avanzada).
- `organization_id` / `tenant_id` **siempre** desde contexto autenticado (JWT + membership), **nunca** confiar en ID del navegador.
- Roles globales ARGOS (`admin`, `super_admin`) ≠ roles de cliente (`org_owner`, `org_admin`, `org_member`, `org_viewer`).

### Modelo conceptual

```
ARGOS_PLATFORM
 └── organizations (tenants)          # UDIC, Flores Galí, …
      ├── organization_members        # users ↔ org + org_role
      ├── projects
      ├── assets
      │    ├── websites / domains
      │    ├── servers / endpoints
      │    ├── databases
      │    └── tls_certificates
      ├── monitors
      ├── alerts
      ├── incidents
      ├── audits / diagnostics / evidence
      ├── recommendations
      └── integrations
```

### Health / status model (producto)

```
PROTECTED_HEALTHY
WARNING
CRITICAL
UNKNOWN
```

Event types (no mezclar):

```
CURRENT_INCIDENT
DETECTED_RISK
PREVENTION
MAINTENANCE
RESOLVED
```

Monitoring honesty:

```
NO_INCIDENTS_DETECTED          # no alertas abiertas (puede ser UNKNOWN)
FULLY_MONITORED_AND_HEALTHY    # cobertura suficiente + señales OK
```

### Superficies

| Superficie | Quién | Alcance |
|------------|-------|---------|
| Web pública | anónimos | sin datos tenant |
| Área privada cliente | members org | solo su `organization_id` |
| Admin ARGOS (futuro Control Center) | roles globales | todos los tenants |

---

## ===== DATABASE_MIGRATION_PLAN =====

**Reglas:** reversible donde sea posible · no DROP destructivo de datos · backfill explícito · `IF NOT EXISTS`.

### Phase 0 — Foundation (GO gate)

1. `organizations` (`id`, `slug`, `name`, `status`, timestamps)
2. `organization_members` (`organization_id`, `user_id`, `org_role`, unique pair)
3. Añadir `organization_id NULL` a: `client_services`, `website_audits`, `client_improvements`, `client_messages`, `form_submissions`, `client_diagnostics`, `activity_logs`, `security_logs`
4. Backfill: por cada `users` crear org desde `company` (o `personal-{id}`) + membership `org_owner`
5. Índices `(organization_id, …)`
6. JWT/session enrichment: `active_organization_id` derivado de membership (no del cliente ciego)

### Phase 1 — Portal isolation

- Todas las queries `/api/client/*` filtran por `organization_id` de sesión.
- Tests negativos cross-tenant.

### Phase 2 — Assets & TLS

- `projects`, `assets`, `domains`, `tls_certificates`

### Phase 3 — Monitoring & incidents

- `monitors`, `monitor_checks`, `alerts`, `incidents`, health projections

### Phase 4 — Evidence / reports / recommendations

### Phase 5 — ARGOS global ops UI (Control Center) — separado del freeze visual corporativo

---

## ===== CLIENT_PRIVATE_AREA_PLAN =====

Rutas propuestas (implementación incremental; nombres finales en fase UI):

| Módulo | Contenido |
|--------|-----------|
| Dashboard | Estado general con health + cobertura de monitorización |
| Activos protegidos | Inventario tenant |
| Monitorización | Monitores + última señal |
| Alertas | Abiertas / históricas |
| Incidentes | Ciclo de vida |
| Auditorías | website_audits + diagnostics |
| Certificados TLS | Expiración / estado |
| Dominios / Servicios | Assets + client_services |
| Historial | activity scoped |
| Informes / Recomendaciones | fases 4+ |
| Usuarios/equipo | organization_members |
| Configuración / Soporte | perfil org + mensajes |

**Estado dashboard (UI copy):** nunca “sin incidencias” si `UNKNOWN` o cobertura insuficiente.

---

## ===== SECURITY_ISOLATION_MODEL =====

1. **AuthN:** JWT access cookie (existente).
2. **AuthZ tenant:** middleware `resolveTenantContext` → membership check → `req.tenant.id`.
3. **Query rule:** `WHERE organization_id = $tenantId` en **todas** las lecturas/escrituras de negocio.
4. **Resource access:** cargar recurso por id **y** `organization_id`; 404 si no match (no filtrar solo en frontend).
5. **Admin global:** `requireRole(['admin','super_admin'])` + flag explícito `crossTenant=true` en rutas admin; logs de acceso.
6. **WebSocket:** rooms por `org:{id}`; admin room separado; no broadcast cross-tenant.
7. **IDOR tests:** manipulación de IDs → 403/404.
8. **Usuario sin membership:** sin acceso a portal tenant.
9. **Org admin ≠ ARGOS admin.**

---

## ===== MONITORING_AND_ALERTING_MODEL =====

| Concepto | Definición |
|----------|------------|
| Monitor | Chequeo periódico sobre un asset (HTTPS, TLS expiry, DNS, …) |
| Signal | Resultado de un check (ok / warn / fail / unknown) |
| Alert | Condición sostenida que requiere atención |
| Incident | Evento gestionado con estado (open → investigating → resolved) |
| Coverage | %/lista de assets con monitor activo reciente |

**Regla de oro:** ausencia de alertas + cobertura incompleta → **UNKNOWN**, no HEALTHY.

Infra ntfy/Coolify permanece como ops ARGOS-host; el producto de cliente es capa separada.

---

## ===== IMPLEMENTATION_PHASES =====

| Fase | Entrega | Gate |
|------|---------|------|
| **0** | Orgs + members + nullable org_id + backfill + tenant middleware + isolation tests | lint/typecheck/unit/isolation |
| **1** | Portal API scoped + dashboard consumes tenant context | e2e auth + isolation |
| **2** | Assets / domains / TLS models + CRUD mínimo | isolation |
| **3** | Monitors / alerts / incidents + health API | honesty tests |
| **4** | Private area IA modules (UI) | visual no-regresión dashboard |
| **5** | ARGOS global supervision (admin) | RBAC tests |

**No push/merge a main automático.**  
**Implementación solo en `feature/argos-multitenant-platform`.**

---

## ===== REGRESSION_RISKS =====

| ID | Riesgo | Mitigación |
|----|--------|------------|
| R1 | Portal actual rompe si org_id NULL | backfill obligatorio + fallback controlado |
| R2 | JWT sin org claim → acceso accidental | middleware fail-closed |
| R3 | Admin cliente elevado a global | roles separados |
| R4 | E2E auth/dashboard fallan | actualizar fixtures tras Phase 1 |
| R5 | Visual corporate chrome | no tocar rutas corporate en Phase 0–3 |
| R6 | Mascotas / labs | fuera de alcance |
| R7 | Migrations destructivas | solo ADD COLUMN / CREATE; no DROP data |
| R8 | Secretos .env | no versionar; no leer en commits |
| R9 | Confundir “sin alertas” con “sano” | enum health + coverage |

---

## ===== PRE_WRITE_GATE =====

```
COMPATIBLE_WITH_EXISTING_ARCHITECTURE = YES
STRATEGY = EVOLUTIONARY_SHARED_SCHEMA_ROW_ISOLATION
DESTRUCTIVE_MIGRATIONS = NO
PRODUCTION_TOUCH = NO
MAIN_TOUCH = NO
TAG_PROTECTION = argos-pre-multitenant-2026-08-24 KEPT

PRE_WRITE_GATE = GO
AUTHORIZED_NEXT = PHASE_0_FOUNDATION_ONLY
```

Phase 0 puede comenzar en esta rama tras este documento.

---

## Phase 0 execution log (2026-08-24)

Implemented on `feature/argos-multitenant-platform`:

- `database/migrations/001_organizations_foundation.sql`
- `database/schema.sql` — orgs + nullable `organization_id` on scoped tables
- `backend/lib/ensureOrganizations.js` — boot DDL + backfill
- `backend/middleware/tenantContext.js` — membership-derived tenant context
- Isolation unit tests (`ensureOrganizations.test.js`, `tenantContext.test.js`)
- Boot hook in `server.js`
- `migrate.sh` applies numbered migrations

**Not yet (Phase 1):** wiring `resolveTenantContext` into `/api/client/*` (portal still user_id-scoped to avoid breaking existing sessions before backfill is verified in each env).

## Phase 1 execution log (2026-08-24)

```
PHASE_1_STATUS = COMPLETE
CLIENT_ROUTES_TENANT_SCOPED = PASS
resolveTenantContext = sync factory (bugfix: was returning Promise)
UNMAPPED_PORTAL_LEGACY_ROWS = 0 after boot backfill (rows with user_id)
Register creates primary organization + org_owner membership
```

Routes audited/changed under `/api/client/*`:

| Route | Type | Scope |
|-------|------|-------|
| GET /portal | READ | org-scoped lists; user profile by actor user_id |
| POST /improvements | CREATE | organization_id forced from session |
| POST /messages | CREATE | organization_id forced from session |
| GET /diagnostics | READ | organization_id |
| GET /diagnostics/:id | READ | id + organization_id → 404 cross-tenant |
| POST /diagnostics | CREATE | organization_id forced from session |

No UPDATE/DELETE endpoints under `/api/client` in this codebase.

