# ARGOS — Information Architecture final

```
STATUS = TARGET_IA + CURRENT_IA
RELUME = REQUIRED TO RECONCILE PUBLIC TARGET
FINAL_UI = SPECIFIED_NOT_IMPLEMENTED
HEAD = 7e8c127 (docs may trail HEAD; product IA unchanged)
```

Tres árboles. Un producto.

Contrato por pantalla (campos Relume):

`ROUTE · PURPOSE · USER · INFORMATION HIERARCHY · DATA REQUIRED · API REQUIRED · COMPONENTS REQUIRED · PRIMARY ACTION · SECONDARY ACTION · SECURITY · PERMISSIONS · STATES · RESPONSIVE PRIORITY · RELUME UX · FRAMER VISUAL`

Framer visual = principios, no pixels.

---

## A. PUBLIC WEBSITE

### A.0 CURRENT (IMPLEMENTED, FROZEN_IA = YES hasta Relume)

```
/
/servicios
/servicios/consultoria-it
/servicios/mantenimiento-informatico
/servicios/seguridad-informatica
/servicios/web-wordpress
/servicios/automatizacion-ia
/servicios/auditoria-digital
/metodo
/metodo/analizar | reforzar | guiar | optimizar | supervisar
/sobre-argos-it
/contacto
/aviso-legal
/privacidad
/cookies
/legal/*  → 301 a canónicas cortas
/auth/login
/auth/register
```

Labs (fuera de marketing): `/explainer`, `/mascot-motion-lab`.

Nav: Inicio, Servicios, Método, Sobre ARGOS-IT, Contacto.

### A.1 TARGET (superconjunto)

Relume **añade**, no borra A.0.

| Route TARGET | Maps to CURRENT | Phase |
|--------------|-----------------|-------|
| `/` Inicio | `/` | DONE |
| Cómo funciona | `/metodo` o página nueva que enlace `/metodo` | Relume |
| Protección preventiva | **nueva** | Relume + copy aprobada |
| Ciberseguridad | `/servicios/seguridad-informatica` | DONE slug |
| Auditoría | `/servicios/auditoria-digital` | DONE slug |
| Monitorización 24/7 | **nueva** | Relume |
| Servicios / Planes | `/servicios` + ancla planes | DONE (planes estáticos, sin checkout) |
| Casos de uso | **nueva** — sin clientes reales | Relume |
| Sobre ARGOS | `/sobre-argos-it` | DONE URL |
| Contacto | `/contacto` | DONE |
| Login | `/auth/login` | DONE |
| Legal | actuales | DONE |

### A.2 Contratos de pantalla (PUBLIC)

#### `/` Inicio

| Campo | Valor |
|-------|--------|
| PURPOSE | Captar y explicar ARGOS |
| USER | Anónimo |
| INFORMATION HIERARCHY | Promesa → problema → método → servicios → continuidad → CTA |
| DATA REQUIRED | Copy i18n. Sin métricas de plataforma. |
| API REQUIRED | Ninguna de producto. Contacto vía Formspree o `/api/contact`. |
| COMPONENTS | Header, hero editorial, método 5 pasos, grid 6 servicios, planes (sin precios inventados), footer |
| PRIMARY ACTION | Contacto / consulta |
| SECONDARY ACTION | Ver servicios o método |
| SECURITY | Público |
| PERMISSIONS | — |
| STATES | default; no health states |
| RESPONSIVE | Desktop institucional → móvil hero+CTA |
| RELUME | Recuperar narrativa útil; descartar fake command-center y prueba social inventada |
| FRAMER | Quiet Authority; no neon identity |

#### `/servicios` y `/servicios/[slug]`

PURPOSE: elegir oferta real. USER: anónimo. DATA: i18n `services.*`. API: ninguna. PRIMARY: ver ficha o contacto. STATES: 404 si slug no está en la lista cerrada. Relume no añade un 7º servicio.

#### `/metodo` y pasos

PURPOSE: explicar Analizar→Reforzar→Guiar→Optimizar→Supervisar. PRIMARY: contacto o paso siguiente. PROHIBIDO: sexto paso. Galaxy = experimental, no marca.

#### `/contacto`

PURPOSE: convertir. API: Formspree (`NEXT_PUBLIC_CONTACT_FORM_ENDPOINT`) y/o `POST /api/contact`. STATES: empty, validation, submitting, error, success. Chrome corporate CURRENT (piloto). Relume no inventa canales/SLA.

#### `/auth/login` `/auth/register`

PURPOSE: acceder / crear cuenta. API: `/api/auth/login` `/register`. PRIMARY: submit → `/dashboard`. SECURITY: rate limit, CSRF origin, cookies HttpOnly. Relume: fuera del lab Corporate visual.

#### Páginas TARGET nuevas (preventiva, 24/7, casos de uso)

PURPOSE: diferenciación / identificación. DATA: copy aprobada solamente. API: ninguna. STATES: default. Relume define URL y secciones. Hasta copy aprobada: no implementar.

---

## B. CLIENT PORTAL

### B.0 CURRENT

Una ruta: `/dashboard`. Guard: cookie sesión + client check. Datos reales: `GET /api/client/portal`, assets, TLS, diagnostics, POST improvements/messages, domain discover.

Sin sidebar. Campos tipados no renderizados: `companyProfile`, `activeServices`, `improvementPanel`, `messages[]`, `activity[]`.

### B.1 TARGET tree

```
/dashboard
/dashboard/activos
/dashboard/activos/dominios
/dashboard/activos/websites
/dashboard/activos/servidores
/dashboard/activos/apis
/dashboard/activos/bases-de-datos
/dashboard/activos/servicios
/dashboard/activos/certificados-tls
/dashboard/monitorizacion
/dashboard/seguridad
/dashboard/alertas
/dashboard/incidentes
/dashboard/prevencion
/dashboard/auditorias
/dashboard/informes
/dashboard/soporte
/dashboard/cuenta
```

Raíz `/dashboard` se conserva. Hijos = PHASE_4 (algunos datos de activos/TLS ya existen en APIs Phase 2).

### B.2 Contrato tipo — `/dashboard` Resumen

| Campo | Valor |
|-------|--------|
| PURPOSE | Responder las 6 preguntas en 10s |
| USER | org member autenticado |
| INFORMATION HIERARCHY | Status → atención → salud por dominio → preventivas → atajos |
| DATA REQUIRED | org, coverage, latest health **cuando exista**, open alerts/incidents, preventive list. Hoy: portal + assets + TLS only |
| API CURRENT | `GET /api/client/portal`, `/assets`, `/tls` |
| API TARGET | + `/monitors/health`, `/alerts`, `/incidents`, `/preventive-actions` (PHASE_3–6) |
| COMPONENTS | AppShell, ProtectionStatus, HealthOverview, PreventiveList, AttentionList, MockLabel |
| PRIMARY ACTION | Resolver atención requerida o «todo en observación» |
| SECONDARY | Ir a activos / soporte |
| SECURITY | JWT + tenant |
| PERMISSIONS | viewer: read; owner/admin: add asset |
| STATES | loading empty unknown warning critical error (+ healthy solo con evidencia) |
| RESPONSIVE | móvil: status primero |
| RELUME | shell + sidebar; no NOC density |
| FRAMER | calm premium; TBD after Relume |

Resto de páginas: `ARGOS_FINAL_CLIENT_PORTAL_BLUEPRINT.md`.

---

## C. INTERNAL NOC

### C.0 CURRENT

`NOT_IMPLEMENTED`. No `app/noc`. `GET /api/security/stats` es admin global, **no** es NOC.

### C.1 TARGET tree

```
/noc
/noc/customers
/noc/organizations
/noc/assets
/noc/health
/noc/monitoring
/noc/alerts
/noc/incidents
/noc/predicted-risks
/noc/preventive-actions
/noc/tls
/noc/dns
/noc/servers
/noc/databases
/noc/backups
/noc/agents
/noc/runbooks
/noc/remediations
/noc/reports
/noc/support
/noc/audit
/noc/platform-health
```

PHASE_5 (+ datos PHASE_3). Relume puede agrupar infra.

### C.2 Contrato tipo — `/noc` Command Center

| Campo | Valor |
|-------|--------|
| PURPOSE | Priorizar el trabajo operativo de ARGOS ahora |
| USER | admin / super_admin / futuro noc_operator |
| INFORMATION HIERARCHY | Platform health → prioridades → predichos → A/B/C del item seleccionado |
| DATA | cross-tenant **solo** vía APIs internas staff; cada fila lleva `organization_id` |
| API TARGET | `/api/noc/*` (NO EXISTE) |
| COMPONENTS | dense shell, KPI MOCK, priority table, predicted table, WhyThisAction, ApprovalGate |
| PRIMARY | Inspect / Action A or Request approval |
| SECONDARY | B/C, rollback, escalate |
| SECURITY | staff only; deny client JWT even if admin role spoofed without server role |
| STATES | igual semántica + empty queue |
| RESPONSIVE | desktop first |
| RELUME | densidad operativa |
| FRAMER | no unificar look con marketing |

Detalle: `ARGOS_FINAL_NOC_BLUEPRINT.md`.

---

## D. Navegación cruzada (prohibiciones)

- Público no enlaza a `/noc`.
- Portal no enlaza a `/noc`.
- NOC puede «ver como cliente» solo como vista read-only auditada (FUTURE), nunca mezclando orgs.
- Login público → solo portal.
- Staff login: mismo auth, autorización por `users.role`, no por membership del cliente.
