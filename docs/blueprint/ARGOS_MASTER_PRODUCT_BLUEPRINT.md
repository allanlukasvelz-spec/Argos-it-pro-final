# ARGOS — Master Product / Architecture Blueprint

```
DOCUMENT            = ARGOS_MASTER_PRODUCT_BLUEPRINT
STATUS              = STAGE_1_ARCHITECTURAL_PRODUCT_BLUEPRINT
AUTHORITY           = LEVEL_2_PRODUCT_FUNCTION
DATE                = 2026-08-24
BRANCH              = feature/argos-multitenant-platform
HEAD                = ec27eb9
CHECKPOINT          = argos-pre-multitenant-2026-08-24
WORKING_TREE        = CLEAN at authoring
STASH               = stash@{0} PRESENT — DO NOT APPLY / POP / DROP / REUSE
PHASE_3             = NOT AUTHORIZED FOR IMPLEMENTATION
VISUAL_FIDELITY     = STRUCTURAL ONLY
FINAL_UI            = PENDING RELUME + FRAMER
```

Este archivo es la **fuente de verdad de producto**. Un desarrollador debe poder construir ARGOS siguiéndolo, sin improvisar arquitectura.

Los satélites de `docs/blueprint/` profundizan tablas, ER, matrices y contratos de pantalla. Si hay conflicto entre un satélite y este archivo, **gana este archivo**, salvo cláusulas de seguridad del Nivel 1 (código + modelo de seguridad).

---

## 0. Cómo leer este plano

| Pregunta | Respuesta aquí |
|----------|----------------|
| ¿Qué es ARGOS? | §1 |
| ¿Qué hay hoy vs qué será? | §4–§5 |
| ¿Qué ve el público / el cliente / el NOC? | §6–§8 |
| ¿Cómo se aíslan clientes? | §9, satélite Security |
| ¿Cómo se detecta, predice y actúa? | §10–§14 |
| ¿Qué pasa si A falla? | §13–§14, Failure Matrix |
| ¿Qué construir primero? | §18–§20 |
| ¿Qué significa DONE? | §21 |
| ¿Cómo se ve? | Estructura aquí; alta fidelidad **después** de Relume + Framer |

Principio de construcción:

```
DESIGN → ARCHITECT → PLAN → IMPLEMENT → VERIFY → HARDEN → RELEASE
```

Prohibido:

```
IMPLEMENT → DISCOVER PROBLEMS → REDESIGN ON THE FLY
```

---

## 1. Qué es ARGOS

ARGOS es **una sola plataforma** de protección tecnológica continua para organizaciones cliente.

No es un monitor de uptime disfrazado. No es tres productos. No es un dashboard de marketing.

Promesa:

> La tecnología del cliente debe sentirse controlada, comprensible, vigilada y estable.

ARGOS:

1. registra la organización y sus activos;
2. observa señales (cuando el motor exista — Fase 3+);
3. evalúa salud y riesgo **sin fingir certeza**;
4. alerta e incidenta con evidencia;
5. propone o ejecuta acciones preventivas y correctivas con A/B/C y rollback;
6. muestra al cliente un estado calmado y verdadero;
7. muestra al NOC un estado denso y accionable;
8. vende y explica en la web pública **sin** convertirse en NOC.

### 1.1 Tres experiencias, un núcleo

```
                    ARGOS PLATFORM
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   PUBLIC WEBSITE     CLIENT PORTAL        INTERNAL NOC
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                      ARGOS CORE
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
      AUTH              TENANCY          OPERATIONS
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                      POSTGRESQL
```

| Experiencia | Ruta raíz | Usuario | Trabajo |
|-------------|-----------|---------|---------|
| Web pública | `/` | anónimo | captar, explicar, convertir |
| Portal cliente | `/dashboard` | miembro de una org | entender protección y actuar lo mínimo |
| NOC interno | `/noc` | staff ARGOS | operar todos los tenants |

**Control Center** como nombre de producto: **SUPERSEDED** por **NOC**. `CONTROL_CENTER_FROZEN = NO` en docs de marca; este blueprint define NOC. No existe UI `/noc` en HEAD.

---

## 2. Jerarquía de autoridad y pipeline de diseño

```
LEVEL 1  Security / Data / System     Cursor + código + este blueprint (seguridad)
LEVEL 2  Product function             ESTE DOCUMENTO
LEVEL 3  IA / UX                      Relume aprobado
LEVEL 4  Visual design                Framer aprobado
LEVEL 5  Implementation               Cursor implementa la combinación aprobada
```

Pipeline:

```
CURSOR (esta ejecución) → RELUME → FRAMER → CURSOR (implementación)
```

Esta ejecución **no** congela: pixel-perfect, composición visual definitiva, tipografía nueva del portal/NOC, motion, spacing exacto, representación final de dashboards.

Wireframes de este plano = **estructurales**.

---

## 3. Preflight congelado (no negociable)

```
BRANCH       = feature/argos-multitenant-platform
HEAD         = ec27eb9   feat(multitenant): add tenant-scoped assets domains and TLS
CHECKPOINT   = argos-pre-multitenant-2026-08-24
PHASE_0      = COMPLETE  3444916
PHASE_1      = COMPLETE  c19a8ce
PHASE_2      = COMPLETE  ec27eb9
PHASE_3      = NOT AUTHORIZED
STASH        = stash@{0}  WIP Phase 3 stopped before master blueprint 2026-08-24
```

El blueprint se construye desde HEAD + historial + código + docs. El stash es **referencia histórica de seguridad**, no fuente de implementación.

---

## 4. CURRENT — lo que existe en `ec27eb9`

Clasificación: `IMPLEMENTED` | `PARTIALLY_IMPLEMENTED` | `PLANNED` | `NOT_IMPLEMENTED` | `SUPERSEDED` | `HISTORICAL`.

**Regla:** no dibujar capacidades futuras como existentes.

### 4.1 CURRENT_FRONTEND — IMPLEMENTED / parcial

Next.js App Router, i18n propio (es/en/ca/fr/de/it/pt), axios + cookies, Zustand auth.

| Ruta | Estado | Qué hace de verdad |
|------|--------|--------------------|
| `/` `/servicios` `/servicios/[slug]` `/metodo` `/metodo/[slug]` `/sobre-argos-it` `/contacto` legales | IMPLEMENTED | marketing |
| `/auth/login` `/auth/register` | IMPLEMENTED | JWT cookie → `/dashboard` |
| `/dashboard` | PARTIALLY_IMPLEMENTED | **una sola página**: portal + activos + TLS + diagnósticos + mejoras + mensajes. Sin sidebar, sin hijos |
| `/noc` | NOT_IMPLEMENTED | |
| `/explainer` `/mascot-motion-lab` | IMPLEMENTED | labs; noindex / gated |

Chrome: legacy en casi todo lo público; corporate **solo** `/contacto`. Dashboard chrome = none.

Mascotas Chico/Dumbo: dock ASSISTANT_ONLY. Visual freeze Quiet Authority: **documentado**, no migrado a Home producción.

### 4.2 CURRENT_BACKEND — IMPLEMENTED / parcial

Express `:4000`. Auth cookie-only. Tenant middleware en `/api/client/*`.

| Superficie | Estado |
|------------|--------|
| Auth register/login/refresh/logout | IMPLEMENTED |
| Client portal, improvements, messages, diagnostics | IMPLEMENTED (scoped org) |
| Assets CRUD, domains discover, TLS list/get | IMPLEMENTED (Phase 2) |
| `/api/security/dashboard` `/stats` | PARTIALLY_IMPLEMENTED — **user_id**, no tenant |
| `/api/ai/*` | PARTIALLY_IMPLEMENTED — `user_id`, no tenant |
| Monitors / observations / alerts / incidents APIs | NOT_IMPLEMENTED |
| NOC APIs | NOT_IMPLEMENTED |
| Org membership admin CRUD | NOT_IMPLEMENTED (solo ensure/backfill) |
| RBAC por `org_role` en rutas | NOT_IMPLEMENTED (cualquier miembro del tenant opera igual) |

### 4.3 CURRENT_DATABASE — EXISTS en `database/schema.sql`

`users`, `organizations`, `organization_members`, `assets`, `tls_certificates`, `ai_memory`, `activity_logs`, `security_logs`, `services`, `form_submissions`, `client_services`, `website_audits`, `client_improvements`, `client_messages`, `refresh_sessions`.

`client_diagnostics`: **no** en schema.sql; ensure al boot. Migración `001` añade `organization_id` si la tabla existe.

**No existen:** `monitors`, `observations`, `alerts`, `incidents`, `incident_events`, `preventive_actions`, `runbooks`, `remediation_actions`, `audit_events`, `reports`, `notifications`, `agents`, `agent_heartbeats`, `support_tickets`.

Deuda: `database/migrate.sh` aplica `*_down.sql` junto al resto → riesgo destructivo si se reejecuta.

### 4.4 CURRENT_AUTH / TENANCY

- Access JWT 24h cookie `argos_access` + refresh 7d `argos_refresh` con rotación jti.
- Claims: `{ id, email, role }`. **Sin `organization_id` en el JWT** — el tenant se resuelve por membership + header `X-Argos-Organization-Id` / query, **solo si hay membership**.
- Roles globales: `visitante` `cliente` `cliente_verificado` `admin` `super_admin` (comentario schema). Código usa también `cliente` default.
- Org roles: `org_owner` `org_admin` `org_member` `org_viewer` — **modelo EXISTS, enforcement NOT_IMPLEMENTED**.
- Fail-closed sin membership / org inactiva.
- Admin global **no** bypass de `/api/client` (`TENANT_REQUIRED`).

Flujo real:

```
JWT cookie → Authenticated User → memberships → Tenant Context → organization_id → scoped SQL
```

Aislamiento visual obligatorio:

```
ORG A  ─X─>  ORG B
```

### 4.5 CURRENT_PUBLIC / CLIENT / NOC

| Experiencia | Estado |
|-------------|--------|
| Public site | IMPLEMENTED (IA congelada 21.6B) |
| Client portal | PARTIALLY_IMPLEMENTED (página monolítica con datos reales de portal/assets/TLS) |
| NOC | NOT_IMPLEMENTED |
| Monitoring pipeline | NOT_IMPLEMENTED |
| Prevention / A/B/C engines | NOT_IMPLEMENTED (principio de producto, no código) |

### 4.6 CURRENT_SECURITY / TESTS / DESIGN

Security IMPLEMENTED: Helmet, CORS allowlist, CSRF Origin, rate limits, body 512KB, password policy, SSRF guards en discover, cookie-only REST.

Tests IMPLEMENTED: isolation Phase 0–2, hostname/TLS unit, e2e smoke/auth/visual/corporate-chrome. **No hay** tests de monitoring (no existe).

Design: tokens canónicos documentados; UI general **legacy** (cyan/blue). Corporate piloto `/contacto`. Mascotas freeze CURRENT.

### 4.7 Docs previas

| Doc | Clasificación |
|-----|----------------|
| Design Director Brief, Visual Freeze 21.6B, mascot freezes, tokens, source-hierarchy | CURRENT (marca) |
| `ARGOS_MULTITENANT_AUDIT_2026_08_24.md` | HISTORICAL — mapa CURRENT **STALE** (niega tables que ya existen). Plan de fases **SUPERSEDED** por este blueprint |
| Relume 21.7C | HISTORICAL (otra rama). Principio reutilizado: no inventar rutas Corporate; sitemap canónico; paywall aceptado |

---

## 5. TARGET — qué será ARGOS al final

Una plataforma. Tres vistas. Un Postgres. Operación basada en evidencia.

Cada bloque TARGET lleva fase:

`DONE` | `PHASE_3` | `PHASE_4` | `PHASE_5` | `FUTURE`

```
[DONE] Organizations + Members + Auth
[DONE] Assets + TLS observations (puntuales, no pipeline)
[PHASE_3] Monitors → Checks → Observations → Health → Alerts → Incidents
[PHASE_4] Client private experience (IA completa, estados, lenguaje cliente)
[PHASE_5] Internal NOC
[PHASE_6] Runbooks + Remediation A/B/C
[PHASE_7] Agents
[PHASE_8] Notifications + Reporting
[PHASE_9] Preventive intelligence (predicción honesta)
[PHASE_10] Hardening + ARGOS self-monitoring
[PHASE_11] Pilot customers
[PHASE_12] Production readiness
```

TARGET **no** está implementado. Este documento lo define para no improvisar en Fase 3+.

Detalle: `ARGOS_FINAL_SYSTEM_ARCHITECTURE.md`.

---

## 6. Experiencia PUBLIC WEBSITE

**Objetivo:** captación, confianza, explicación, conversión visitante → lead → cliente.

**No es un dashboard.**

### 6.1 CURRENT IA (FROZEN hasta reconciliación Relume)

Nav: Inicio · Servicios · Método · Sobre ARGOS-IT · Contacto.

Rutas: ver `ARGOS_FINAL_INFORMATION_ARCHITECTURE.md` §PUBLIC CURRENT.

Servicios locked: los 6 slugs de `frontend/lib/services.ts`.  
Método locked: Analizar → Reforzar → Guiar → Optimizar → Supervisar.

### 6.2 TARGET IA (superconjunto; Relume reconcilia)

Intenciones nuevas: Cómo funciona, Protección preventiva, Monitorización 24/7, Casos de uso.

**Regla:** Relume puede **añadir**. No puede **borrar** rutas CURRENT sin aprobación humana. `/metodo` y los 6 servicios no desaparecen.

Contrato de pantalla (campos Relume): ver satélite IA + handoff Relume.

Visual: premium, corporate, technical, clean, trustworthy. Dirección Quiet Authority **CURRENT** para Corporate. Home producción sigue legacy hasta fase visual autorizada.

Debe explicar: qué protege, cómo detecta, cómo previene, cómo reacciona, cómo informa, qué ve el cliente, qué diferencia ARGOS de monitoring básico.

---

## 7. Experiencia CLIENT PORTAL

**Ruta:** `/dashboard` (CURRENT = una página; TARGET = árbol).

**Usuario:** miembro de una organización (`org_owner` / `org_admin` / `org_member` / `org_viewer`).

**Objetivo visual (estructura, no pixels):** simple, calm, clear, premium, business-oriented. El cliente responde en 10 segundos:

1. ¿Estoy protegido?
2. ¿Hay algún riesgo?
3. ¿Hay incidencias?
4. ¿Qué ha prevenido ARGOS?
5. ¿Qué necesita mi atención?
6. ¿Qué servicios tengo protegidos?

### 7.1 Nav TARGET

```
Dashboard
├── Resumen
├── Mis activos (Dominios, Websites, Servidores, APIs, BBDD, Servicios, TLS)
├── Monitorización
├── Seguridad
├── Alertas
├── Incidentes
├── Prevención
├── Auditorías
├── Informes
├── Soporte
└── Cuenta
```

Detalle por página: `ARGOS_FINAL_CLIENT_PORTAL_BLUEPRINT.md`.

### 7.2 Wireframe estructural — Resumen

```
┌──────────────────────────────────────────────────────────────┐
│ ARGOS                    [ORG NAME]                  PERFIL  │
├───────────────┬──────────────────────────────────────────────┤
│ Resumen       │ PROTECTION STATUS                            │
│ Mis activos   │          ● PROTECTED | WARNING | CRITICAL    │
│ Monitor       │          ● UNKNOWN si faltan datos           │
│ Seguridad     │  Protection Score MOCK    Availability MOCK  │
│ Alertas       ├──────────────────────────────────────────────┤
│ Incidentes    │ HEALTH OVERVIEW                              │
│ Prevención    │ Web / TLS / DNS / Backups / Server           │
│ Auditorías    │ (UNKNOWN ≠ Healthy)                          │
│ Informes      ├──────────────────────────────────────────────┤
│ Soporte       │ PREVENTIVE ACTIONS                           │
│ Cuenta        │ ✓ …  ! …                                     │
└───────────────┴──────────────────────────────────────────────┘
```

Todo número: **MOCK / DEMO / PLACEHOLDER**.

### 7.3 Estados visuales (contrato de producto)

`PROTECTED/HEALTHY` · `OBSERVE` · `WARNING` · `HIGH` · `CRITICAL` · `INCIDENT` · `MITIGATED` · `RESOLVED` · `UNKNOWN`

```
UNKNOWN != HEALTHY
```

No mostrar «todo correcto» sin cobertura mínima + evidencias recientes.

Estados de pantalla obligatorios: loading, empty, unknown, warning, critical, error.

---

## 8. Experiencia INTERNAL NOC

**Ruta TARGET:** `/noc`. **NOT_IMPLEMENTED.**

**Usuario:** staff ARGOS (`admin` / `super_admin`; roles NOC futuros). Nunca un `org_member` de un cliente viendo otro cliente.

**Visual (estructura):** technical, dense, fast, operational, evidence-driven.

Nav TARGET: Command Center, Customers, Organizations, Assets, Global Health, Monitoring, Alerts, Incidents, Predicted Risks, Preventive Actions, TLS, DNS, Servers, Databases, Backups, Agents, Runbooks, Remediations, Reports, Support, Audit Log, Platform Health.

Wireframe Command Center: KPIs MOCK, Active Priorities, Predicted Incidents, panel A/B/C.

Contrato: `ARGOS_FINAL_NOC_BLUEPRINT.md`.

Selector de cliente: una org a la vez. `ORG A ─X─> ORG B`.

---

## 9. Multi-tenant y seguridad

```
ARGOS
├── Organization A
│   ├── Members
│   ├── Assets / TLS
│   ├── Monitors / Observations     PHASE_3
│   ├── Alerts / Incidents          PHASE_3
│   └── Reports                     PHASE_8
├── Organization B
└── Organization N
```

```
JWT → User → Membership → Tenant Context → organization_id → Scoped Query → Resource
```

Toda query de recurso de cliente **debe** incluir `organization_id` derivado del contexto, no del body del cliente.

IDOR → 404 (no 403 que confirme existencia cross-tenant), patrón ya usado en diagnostics/assets.

Nivel 1 no se negocia en Relume/Framer.

Detalle: `ARGOS_FINAL_SECURITY_MODEL.md`.

---

## 10. Modelo de datos TARGET (no crear tablas ahora)

| Entidad | Marca |
|---------|--------|
| users, organizations, organization_members, assets, tls_certificates, logs, portal tables, refresh_sessions | EXISTS |
| client_diagnostics | EXISTS_VIA_ENSURE (deuda: no está en schema.sql) |
| monitors, observations, alerts, incidents, incident_events | PHASE_3 |
| preventive_actions, runbooks, remediation_actions | PHASE_6 |
| agents, agent_heartbeats | PHASE_7 |
| notifications, reports | PHASE_8 |
| audit_events (producto), support_tickets | PHASE_8 / FUTURE |

ER y columnas: `ARGOS_FINAL_DATABASE_MODEL.md`. **NO DDL en esta ejecución.**

---

## 11. Monitoring pipeline (PHASE_3 — diseño, no código)

```
ASSET → MONITOR → SCHEDULER → CHECK → OBSERVATION
        → HEALTH ENGINE → RISK ENGINE → ALERT → INCIDENT
        → ACTION PLAN → VERIFY → RESOLVE
```

- Un **asset** puede tener N **monitors**.
- Un **check** produce una **observation** (nunca “salud” directa).
- **Health** se deriva de observaciones + cobertura. Sin cobertura → `UNKNOWN`, no `HEALTHY`.
- **Risk** distingue DETECTED / INFERRED / PREDICTED. No llamar «AI» a reglas deterministas.
- **Alert** ≠ **Incident**. Alert = señal que requiere atención. Incident = agrupación operativa con ownership.

Detalle: `ARGOS_FINAL_MONITORING_MODEL.md`.

---

## 12. Prevention engine (PHASE_6–9)

```
HISTORICAL SIGNALS + CURRENT SIGNALS + RULES + THRESHOLDS
+ ASSET CONTEXT + TREND
        → RISK EVALUATION → POTENTIAL FAILURE → PREVENTIVE ACTION
```

Ejemplo honesto (TLS): `not_after` cercano + `auto_renew` falso → riesgo DETECTED de expiración → acción preventiva de renovación. Eso **no** es predicción ML.

PREDICHOS (Fase 9) requieren tendencia + metodología. Si no hay metodología cuantificable, confianza = `UNKNOWN` o cualitativa (`HIGH|MEDIUM|LOW`), **nunca un % inventado**.

---

## 13. Motor Action A / B / C (principio central)

Toda acción relevante **antes de ejecutar** debe tener:

ACTION A · ACTION B · ACTION C · ROLLBACK

```
SIGNAL → EVIDENCE → HYPOTHESIS → ACTION A
   ├── PASS → VERIFY → RESOLVE
   └── FAIL → FAILURE EVIDENCE → UPDATE HYPOTHESIS → ACTION B
         ├── PASS → VERIFY → RESOLVE
         └── FAIL → ACTION C
               ├── PASS → VERIFY
               └── FAIL → SAFE STOP / ROLLBACK / ESCALATE
```

El fallo **genera conocimiento**:

```
A falló
→ cómo falló se convierte en evidencia
→ se reducen hipótesis incompatibles
→ se refuerzan las restantes
→ se elige B (no se improvisa)
```

Ejemplo:

```
DATABASE CONNECTION REFUSED
→ credenciales menos probables
→ listener / servicio / red más probables
→ Action B = verificar listener/service (no reintentar password a ciegas)
```

### Why this action?

Toda recomendación responde:

Evidence · Hypothesis · Confidence (`HIGH|MEDIUM|LOW|UNKNOWN`) · Alternatives considered · Expected result · Risk · Failure signal · Action B · Action C · Rollback

### Automation safety

| Level | Nombre | Ejemplo | UI |
|-------|--------|---------|----|
| 0 | READ ONLY | leer TLS, listar procesos | default |
| 1 | SAFE AUTOMATION | re-check, refresh observation | auto OK |
| 2 | REVERSIBLE CHANGE | renovar cert con rollback de archivo | auto con registro + rollback listo |
| 3 | HIGH IMPACT / HUMAN APPROVAL | restart service, DNS change | **ApprovalGate** |
| 4 | NEVER AUTOMATIC | drop DB, destroy VM, disable auth globally | no botón «auto» |

Framer no puede convertir Level 3 en «Auto Fix».

---

## 14. Cuándo ARGOS debe detenerse

Safe stop / no ejecutar / no afirmar HEALTHY cuando:

1. falta evidencia suficiente (`UNKNOWN`);
2. A/B/C agotados;
3. rollback no está definido para una acción Level 2+;
4. la acción es Level 3+ sin aprobación;
5. la acción es Level 4;
6. hay duda de tenant (no ejecutar cross-org);
7. el propio ARGOS está degradado (Fase 10) — no remediar clientes a ciegas;
8. storm de alertas — degradar a agrupación, no automatizar en masa;
9. hipótesis contradictorias con la misma evidencia;
10. el failure signal de la acción en curso se dispara.

Detalle de clases de fallo: `ARGOS_FAILURE_ACTION_MATRIX.md`.

---

## 15. Onboarding y nuevos activos

### Cliente nuevo

```
NEW CUSTOMER → ORGANIZATION → MEMBERS → PRIMARY DOMAIN
→ DISCOVERY → ASSET CONFIRMATION → OWNERSHIP VERIFICATION
→ PROTECTION PROFILE → MONITORS → BASELINE → COVERAGE ASSESSMENT
→ CLIENT DASHBOARD → ACTIVE MONITORING
```

**No declarar PROTECTED** hasta cobertura mínima (definida en Monitoring Model). Antes: `UNKNOWN` o «en onboarding».

### Activo nuevo

```
ADD ASSET → VALIDATE INPUT → VALIDATE OWNERSHIP → SECURITY VALIDATION
→ DISCOVER → CLASSIFY → CREATE MONITORS → BASELINE → COVERAGE → ACTIVE
```

SSRF: reutilizar `hostnameSecurity.js` (IMPLEMENTED). No ampliar a IPs privadas / link-local / metadata clouds.

---

## 16. Lenguaje cliente vs NOC

| Interno | Cliente |
|---------|---------|
| TLS hostname mismatch | Se ha detectado una incompatibilidad en la protección HTTPS. |
| Database connection refused | Uno de sus servicios de datos no está respondiendo correctamente. |
| UNKNOWN coverage | Aún no hay datos suficientes para confirmar el estado. |
| Action A restart nginx (L3) | ARGOS recomienda una intervención en el servicio web. Requiere su autorización. |

No ocultar la verdad. No saturar. Matriz completa en portal + NOC blueprints.

---

## 17. User journeys (TARGET)

1. VISITOR → LEAD → CUSTOMER  
2. CUSTOMER → LOGIN → DASHBOARD → ALERT  
3. CUSTOMER → INCIDENT → RESOLUTION  
4. NOC → ALERT → INVESTIGATION → A/B/C → VERIFY  
5. NEW CUSTOMER → ONBOARDING → PROTECTION  
6. NEW ASSET → DISCOVERY → BASELINE  
7. TLS WARNING → PREVENTION → RENEWAL  
8. DB FAILURE → DIAGNOSIS → RECOVERY  

Diagramas en HTML/PPTX estructurales. Relume detalla UX.

---

## 18. Roadmap, dependencias, critical path

Grafo:

```
Organizations → Memberships → Assets → Monitors → Observations
→ Health → Risks → Alerts → Incidents → Runbooks → Remediations
```

Ramas: Agents → Observations · Notifications ← Alerts/Incidents · Reports ← historial · Client Portal ← Tenant APIs · NOC ← Internal APIs.

**MVP real (critical path):**

```
organization → asset → monitor → check → observation
→ health → alert → incident → client visibility → NOC visibility
```

| Tramo | Clase |
|-------|--------|
| Org + asset + TLS observe | DONE (MVP parcial: registro, no pipeline) |
| monitor…incident | MVP (Phase 3 + visibilidad mínima) |
| portal IA completa | V1 (Phase 4) |
| NOC | V1 (Phase 5) |
| A/B/C execution | V1.5 (Phase 6) |
| Agents, prediction | FUTURE / V1.5+ |

Fases 0–12, plantilla y DoD: `ARGOS_IMPLEMENTATION_ROADMAP.md`.

**Ajuste de secuencia vs propuesta original:** se mantiene 3→12. No se invierte 4 y 5: el portal cliente puede mostrar salud **mínima** en la misma fase que las APIs tenant (3+4 solapables), pero el NOC denso es Fase 5. Implementar NOC antes de observations sería teatro.

---

## 19. Product completion map

| Módulo | Status | Evidence | Dependency | Next |
|--------|--------|----------|------------|------|
| Auth | DONE | `routes/auth.js` | — | — |
| Organizations | DONE | schema + ensure + tests | — | membership admin UI |
| Tenant scoping portal | DONE | isolation tests Phase 1 | org | remaining `/api/ai` `/api/security` |
| Assets + TLS | DONE | Phase 2 routes + tests | tenant | monitoring |
| Client dashboard IA | PARTIAL | una página | APIs | Phase 4 |
| Monitoring | NOT STARTED | — | assets | Phase 3 (**blocked on authorization**) |
| Alerts/Incidents | NOT STARTED | — | monitoring | Phase 3 |
| NOC | NOT STARTED | — | incidents | Phase 5 |
| Runbooks/A-B-C | NOT STARTED | — | incidents | Phase 6 |
| Agents | NOT STARTED | — | monitors | Phase 7 |
| Public IA TARGET | PARTIAL | CURRENT frozen | Relume | Relume reconcilia |
| Visual final | BLOCKED | freeze 21.6B + pending Relume/Framer | Relume | no migrar Home |

No se inventan porcentajes de avance.

---

## 20. Plantilla de fase (obligatoria antes de implementar)

Cada fase futura declara: GOAL · WHY NOW · DEPENDENCIES · DATABASE · BACKEND · FRONTEND · SECURITY · TESTS · DOCUMENTATION · FAILURE MODES · ACTION A · ACTION B · ACTION C · ROLLBACK · EXIT CRITERIA.

Fase 3 **no** se rellena para ejecutarla ahora; el template vive en el roadmap para cuando se autorice.

---

## 21. Definition of Done

Una fase **no** está DONE si solo compila.

DONE exige: arquitectura coherente · migration safe (sin aplicar `_down` accidental) · tenant isolation · API verified · UI implemented · loading/empty/unknown/warning/critical/error · security tests · regression · build · docs · diagrams · rollback · no secrets · acceptance PASS.

---

## 22. Tests y riesgos

Pirámide: UNIT → INTEGRATION → API → TENANT ISOLATION → SECURITY → FRONTEND → E2E → FAILURE INJECTION → REGRESSION → PRODUCTION READINESS.

Casos críticos: IDOR, SSRF, auth bypass, tenant leakage, role escalation, secret exposure, false HEALTHY, false positive/negative, alert storm, unsafe remediation, agent compromise.

Riesgos: `ARGOS_RISK_REGISTER.md`. Tests: `ARGOS_TEST_STRATEGY.md`.

---

## 23. Consistencia CURRENT vs TARGET vs docs vs UI

Chequeo de autoría (doc vs código HEAD):

| Tema | Resultado |
|------|-----------|
| Organizations/assets existen | SÍ en schema — audit 2026-08-24 STALE si dice lo contrario |
| Monitoring tables | NO — blueprint las marca PHASE_3, no EXISTS |
| `/noc` | NO en frontend |
| Dashboard hijos | NO |
| org_role enforced | NO |
| JWT cookie-only | SÍ |
| Relume 21.7C en rama | NO — principios extraídos por `git show` |
| Números de salud en dashboard actual | score de auditoría de **website_audits**, no uptime de assets — no etiquetar como Protection Score de monitoring |

`CONSISTENCY_ERRORS` residuales documentados (deuda, no de este blueprint):

1. `client_diagnostics` fuera de `schema.sql`.  
2. `migrate.sh` incluye `*_down.sql`.  
3. `/api/security` y `/api/ai` no tenant-scoped.  
4. Audit multitenant CURRENT map STALE.  
5. Dual chrome public (legacy vs corporate).

Ninguno se “arregla” en esta ejecución (sería implementación o reescritura de docs históricas). El blueprint los nombra para no contradecirlos en silencio.

---

## 24. Handoffs

- Relume: `docs/blueprint/handoff/ARGOS_RELUME_HANDOFF.md`  
- Framer: `docs/blueprint/handoff/ARGOS_FRAMER_HANDOFF.md` (**DRAFT**)  
- Design contract: `docs/blueprint/ARGOS_DESIGN_CONTRACT.md` (`AWAITING_RELUME_AND_FRAMER`)

---

## 25. Next recommended action

1. **No** implementar Fase 3.  
2. No aplicar stash.  
3. Entregar a Relume el handoff PUBLIC / CLIENT / NOC.  
4. Tras Relume aprobado: completar Framer handoff + Design Contract.  
5. Solo entonces: autorización humana de Fase 3 (monitoring) sobre este plano.

---

## Índice de satélites

| Archivo | Profundiza |
|---------|------------|
| `ARGOS_FINAL_INFORMATION_ARCHITECTURE.md` | Rutas y contratos de pantalla |
| `ARGOS_FINAL_SYSTEM_ARCHITECTURE.md` | CURRENT vs TARGET técnico |
| `ARGOS_FINAL_DATABASE_MODEL.md` | ER |
| `ARGOS_FINAL_SECURITY_MODEL.md` | Amenazas y controles |
| `ARGOS_FINAL_MONITORING_MODEL.md` | Pipeline y cobertura |
| `ARGOS_FINAL_INCIDENT_MODEL.md` | Alertas e incidentes |
| `ARGOS_FINAL_REMEDIATION_MODEL.md` | A/B/C, levels, rollback |
| `ARGOS_FINAL_CLIENT_PORTAL_BLUEPRINT.md` | Cada página cliente |
| `ARGOS_FINAL_NOC_BLUEPRINT.md` | Cada página NOC |
| `ARGOS_FAILURE_ACTION_MATRIX.md` | Fallos por clase |
| `ARGOS_IMPLEMENTATION_ROADMAP.md` | Fases 0–12 |
| `ARGOS_TEST_STRATEGY.md` | Pruebas |
| `ARGOS_RISK_REGISTER.md` | Riesgos |
| `ARGOS_DESIGN_CONTRACT.md` | Placeholder visual |
