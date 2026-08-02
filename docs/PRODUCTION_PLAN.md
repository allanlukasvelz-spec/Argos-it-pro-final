# Plan de producción ARGOS-IT

Fecha de preparación: 2026-08-02
Rama de trabajo: `release/production-v1`
Commit base auditado: `db5c5a4`
Estado: **preparación documental únicamente** — sin deploy, sin DNS, sin recursos nuevos, sin merge.

Referencias: [STAGING.md](./STAGING.md), [STAGING_RESULTADOS.md](./STAGING_RESULTADOS.md), [DEPLOYMENT.md](./DEPLOYMENT.md), [DEPLOY_AUTH.md](./DEPLOY_AUTH.md), [VERIFY.md](./VERIFY.md).

---

## 1. Resumen ejecutivo

Este documento prepara el cutover a producción del stack Next.js + Express + PostgreSQL **sin desplegar todavía** y **sin tocar** WordPress, apex, `www`, correo, MySQL ni el staging operativo.

Arquitectura acordada: el sitio público actual permanece en WordPress (`argos-it.com` / `www.argos-it.com`); la aplicación ARGOS-IT vive en subdominios dedicados (`portal` + `api.portal`) con PostgreSQL privado independiente, secretos nuevos y sin reutilizar JWT ni usuarios de staging.

**Auditoría de repositorio (solo lectura):** plantillas `.env.example`, Dockerfiles, HEALTHCHECK del backend, `database/migrate.sh` y documentación existente son suficientes para planificar. Falta decisión/credenciales externas (proveedor offsite, OpenAI, Socket.IO, creación de DNS/recursos cuando se autorice).

---

## 2. Arquitectura objetivo

```text
Internet
   │
   ├─ argos-it.com / www.argos-it.com  →  WordPress actual (INTACTO)
   │
   ├─ portal.argos-it.com              →  Frontend Next.js (Coolify / VPS)
   │         │
   │         └─ NEXT_PUBLIC_BACKEND_URL → https://api.portal.argos-it.com
   │
   └─ api.portal.argos-it.com          →  Backend Express (Coolify / VPS)
             │
             └─ DATABASE_URL (privado) →  PostgreSQL producción (recurso nuevo, no staging)
```

| Capa | Staging (existente, no tocar) | Producción (propuesta) |
|------|-------------------------------|-------------------------|
| Frontend | `staging.argos-it.com` | `portal.argos-it.com` |
| Backend | `api-staging.argos-it.com` | `api.portal.argos-it.com` |
| PostgreSQL | DB privada staging | DB privada **nueva** |
| JWT | secretos staging | secretos **nuevos y distintos** |
| Usuarios | cuentas staging | usuarios **nuevos** (sin copiar staging) |
| Proyecto Coolify | `argos-it-staging` | proyecto/recursos **separados** (p. ej. `argos-it-production`) |

Reglas de aislamiento:

- No compartir `DATABASE_URL`, JWT, refresh secrets, usuarios ni contenedores con staging.
- No apuntar CORS/FRONTEND de producción a dominios de staging.
- No publicar PostgreSQL a Internet.
- WordPress/MySQL del hosting compartido no forman parte de este stack.

---

## 3. Dominios

### Mantener (sin cambios en esta fase)

| Host | Destino |
|------|---------|
| `argos-it.com` | WordPress actual |
| `www.argos-it.com` | WordPress actual |

### Recomendados para producción ARGOS-IT (no crear todavía)

| Host | Rol |
|------|-----|
| `portal.argos-it.com` | Frontend Next.js |
| `api.portal.argos-it.com` | Backend Express |

DNS (cuando se autorice en fase posterior): registros `A`/`AAAA` (o CNAME si aplica) hacia el VPS/proxy de Coolify; TLS Let’s Encrypt vía proxy. **No crear DNS en esta fase.**

CAA existente (`0 issue "letsencrypt.org"`) es compatible; no reintroducir CAA incorrectos.

---

## 4. Variables

Nunca versionar `.env` reales. Generar secretos con `openssl rand -hex 48` (dos veces, valores distintos). Plantillas auditadas: `.env.example`, `backend/.env.example`, `frontend/.env.example`, `docker/.env.example`.

### 4.1 Backend producción (Coolify / proveedor)

```text
NODE_ENV=production
PORT=4000
DATABASE_URL=<producción — cadena privada, no staging>
JWT_SECRET=<nuevo — openssl rand -hex 48>
JWT_REFRESH_SECRET=<nuevo y distinto — openssl rand -hex 48>
CORS_ORIGINS=https://portal.argos-it.com
FRONTEND_URL=https://portal.argos-it.com
ENABLE_SOCKET_IO=false
OPENAI_API_KEY=<pendiente decisión>
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT_MS=45000
AI_MESSAGE_MAX_LEN=6000
CONTACT_FORM_ENDPOINT=https://formspree.io/f/xpqooedl
LOG_LEVEL=info
```

Opcionales recomendados (ya en `backend/.env.example`; ajustar solo si se decide endurecer prod):

```text
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=120
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=8
AI_RATE_LIMIT_WINDOW_MS=900000
AI_RATE_LIMIT_MAX=30
CONTACT_RATE_LIMIT_WINDOW_MS=3600000
CONTACT_RATE_LIMIT_MAX=5
```

### 4.2 Frontend producción

```text
NEXT_PUBLIC_BACKEND_URL=https://api.portal.argos-it.com
BACKEND_URL=<URL interna o pública confirmada del API>
NEXT_PUBLIC_CONTACT_FORM_ENDPOINT=https://formspree.io/f/xpqooedl
# Opcional metadata/OG:
# NEXT_PUBLIC_SITE_URL=https://portal.argos-it.com
```

Notas de auditoría:

- `NEXT_PUBLIC_BACKEND_URL` se inyecta en **build** (`frontend/Dockerfile` `ARG`/`ENV`); debe ser la URL pública del API.
- `BACKEND_URL` la usan route handlers del servidor Next (p. ej. relay mascot-chat); puede ser la misma URL pública o una URL interna de red Coolify si se confirma reachability.
- No usar `db`, `backend`, `localhost` ni `127.0.0.1` como URL pública de producción.

### 4.3 PostgreSQL producción

Variables típicas del servicio (Coolify / imagen `postgres:16`):

```text
POSTGRES_USER=<rol_aplicación_prod>
POSTGRES_PASSWORD=<nuevo — no reutilizar staging>
POSTGRES_DB=argos_it
```

Cadena de aplicación (backend):

```text
DATABASE_URL=postgresql://<rol_aplicación_prod>:<password>@<host_interno>:5432/argos_it
```

Recomendación operativa (también en `database/migrate.sh`): rol de migración DDL distinto del rol de aplicación DML, cuando el proveedor lo permita.

### 4.4 Monitorización

| Variable / dato | Uso |
|-----------------|-----|
| URLs a vigilar | `https://portal.argos-it.com`, `https://api.portal.argos-it.com/api/health` |
| Canal de alertas | ntfy / Coolify notifications / SMTP — **nuevo canal de producción**, no reutilizar topic de staging |
| Umbrales | HTTP ≠ 200; CPU/RAM/disco; reinicios de contenedor; fallo/staleness de backup; TLS &lt; 14 días |

### 4.5 Backups

| Dato | Producción |
|------|------------|
| Cifrado | AES-256-CBC + PBKDF2 (u equivalente); clave almacenada fuera del repositorio |
| Retención local | 7 diarios + 4 semanales |
| Destino offsite | **obligatorio antes de go-live** (R2 / B2 / S3-compatible o SCP) |
| Credenciales offsite | endpoint, bucket, access key, secret, región — **pendientes** (no inventar) |

---

## 5. PostgreSQL

| Ítem | Plan |
|------|------|
| Recurso | Nuevo servicio privado (no clonar/reutilizar staging) |
| Imagen de referencia | `postgres:16` / `postgres:16-alpine` (alineado con staging operativo) |
| Exposición | Solo red interna Coolify |
| Migraciones | `DATABASE_URL="<prod>" ./database/migrate.sh` — idempotente (`schema.sql` + `refresh_sessions.sql`); **no** ejecutar en esta fase |
| Admin | `database/seed_admin.sql` es **manual** y separado; nunca en migrate automático |
| Datos | No importar dump de staging con usuarios/JWT de prueba |
| Antes de migrate | Backup vacío o snapshot del volumen nuevo |

Auditoría `database/migrate.sh`: exige `DATABASE_URL`; `ON_ERROR_STOP=1`; no hace DROP destructivo ni seed admin. Comentario del script: no aplicar a producción sin autorización explícita y backup.

---

## 6. Backend

| Ítem | Hallazgo / plan |
|------|-----------------|
| Dockerfile | `backend/Dockerfile` — Node 22 Alpine, `npm ci --omit=dev`, `EXPOSE 4000`, `CMD npm start` |
| HEALTHCHECK | Presente: `fetch('http://127.0.0.1:4000/api/health')` interval 30s / timeout 5s / start 20s / retries 3 |
| Coolify health | Preferir HEALTHCHECK de imagen; no forzar HTTP con curl en Alpine |
| Health endpoint | `GET /api/health` → 200 |
| Socket.IO | `ENABLE_SOCKET_IO=false` hasta decisión explícita |
| OpenAI | Vacío → 503 `assistant_unavailable` hasta decisión explícita |
| Proyecto Coolify | Recurso/aplicación **nueva** (no reutilizar app de staging) |
| Rama de deploy | Definir en fase de deploy (p. ej. `main` o tag); **no merge automático en esta fase** |

---

## 7. Frontend

| Ítem | Hallazgo / plan |
|------|-----------------|
| Dockerfile | `frontend/Dockerfile` — Node 22 Alpine, `npm ci`, build con `ARG NEXT_PUBLIC_BACKEND_URL`, `EXPOSE 3000` |
| HEALTHCHECK | **Ausente** en imagen frontend (a diferencia del backend) — documentar; evaluar en fase de implementación (fuera de esta preparación) |
| Build-arg producción | `NEXT_PUBLIC_BACKEND_URL=https://api.portal.argos-it.com` |
| Runtime | Confirmar bind host adecuado para Coolify (patrón ya usado en staging) |
| Dominio | `portal.argos-it.com` |
| Formspree | Endpoint documentado en plantillas; validar cuota/permisos en go-live |

---

## 8. DNS y TLS

| Paso | Estado en esta fase |
|------|---------------------|
| Crear `portal` / `api.portal` | **No crear todavía** |
| TLS Let’s Encrypt | Cuando existan hosts → proxy Coolify/Traefik |
| CAA | Conservar `letsencrypt.org`; no tocar apex/`www` |
| Separación | Staging DNS (`staging`, `api-staging`) permanece; producción es independiente |

---

## 9. Backups

### Checklist offsite (pre–go-live)

- [ ] Proveedor elegido (Cloudflare R2 / Backblaze B2 / S3-compatible / SCP)
- [ ] Credenciales reales entregadas (endpoint, bucket, keys, región)
- [ ] `rclone` (u equivalente) configurado solo en servidor de producción
- [ ] Backup diario cifrado local
- [ ] Subida offsite automática post-backup
- [ ] Verificación de checksum o tamaño
- [ ] Log éxito/fallo + alerta (ntfy/Coolify) en error
- [ ] Retención: 7 diarios + 4 semanales; no borrar la copia más reciente válida
- [ ] Prueba: backup nuevo → upload → download temp → restore DB temporal → DROP temp
- [ ] Clave de cifrado fuera del repo y fuera de Git

**Bloqueo conocido (staging):** offsite automático aún sin proveedor. Producción **no debe** ir a go-live sin resolver este punto en el entorno de producción.

---

## 10. Restauración

| Regla | Detalle |
|-------|---------|
| Nunca | Restaurar dump encima de producción en caliente sin ventana y backup previo |
| Prueba | Siempre en base temporal (`argos_restore_tmp_*`) y DROP al verificar |
| Evidencia mínima | Conteos de tablas / usuarios de aplicación coherentes con el dump |
| Runbook | Documentar comando restore + responsable + RTO/RPO acordados |

---

## 11. Monitorización

Comprobar al menos:

1. `https://portal.argos-it.com` → HTTP 200
2. `https://api.portal.argos-it.com/api/health` → HTTP 200
3. CPU / RAM / disco del VPS
4. Reinicios de contenedores de producción
5. Fallo o staleness de backups
6. Expiración TLS (&lt; 14 días)

Canal de alertas de **producción** separado del de staging. Coolify Sentinel + notificaciones nativas (SMTP/webhook) recomendadas.

---

## 12. QA

### Automatizado (pre-deploy)

- [ ] `npm run verify`
- [ ] `CI=1 npm run test:e2e` (o pipeline CI verde en la rama/tag a desplegar)
- [ ] `./scripts/verify-api.sh` contra API de producción **tras** deploy (público + tokens prod)

### Manual (portal)

- [ ] Home / servicios / método / contacto / legales
- [ ] Responsive móvil/tablet/desktop
- [ ] Formulario de contacto
- [ ] Chat mascotas (200 con OpenAI o 503 documentado)
- [ ] Idiomas
- [ ] SEO (`robots.txt`, `sitemap.xml`, metadatos)
- [ ] Consola sin errores críticos
- [ ] Imágenes / assets
- [ ] Login / registro / dashboard
- [ ] Roles: cliente 403 en stats; admin 200 en stats; refresh 200

### Separación WordPress

- [ ] `https://argos-it.com` y `https://www.argos-it.com` siguen sirviendo WordPress
- [ ] Portal no rompe enlaces críticos del sitio marketing actual (acordar enlaces cruzados si aplica)

---

## 13. Cutover

Orden propuesto (**no ejecutar en esta fase**):

1. Aprobar go-live (criterios §17).
2. Crear proyecto/recursos Coolify de producción (PG + API + Web) — **nuevos**.
3. Generar e inyectar secretos de producción (nunca copiar staging).
4. Crear DNS `portal` y `api.portal` → VPS; emitir TLS.
5. Migrar schema con `migrate.sh` sobre DB prod (tras backup inicial).
6. Desplegar backend; verificar `/api/health`.
7. Desplegar frontend con build-arg de API prod; verificar HTTP 200.
8. Crear admin de producción (flujo register + `seed_admin.sql` manual).
9. Activar backups cifrados + offsite + monitorización prod.
10. Ejecutar QA automatizado + manual.
11. Comunicar URL del portal; mantener WordPress en apex/`www`.
12. Observabilidad 24–48 h; rollback listo (§14).

---

## 14. Rollback

| Escenario | Acción |
|-----------|--------|
| Deploy frontend fallido | Coolify Rollback / redeploy imagen o commit previo del recurso web prod |
| Deploy backend fallido | Rollback recurso API; no tocar WordPress ni staging |
| Migración incorrecta | Restaurar desde backup cifrado a **ventana controlada**; preferir forward-fix si es seguro |
| DNS/TLS | Apuntar de nuevo o retirar hosts `portal`/`api.portal` sin tocar apex/`www` |
| Incidente grave | Deshabilitar rutas Traefik de portal/API; sitio WordPress permanece |

Reglas: sin `docker compose down -v` destructivo; sin force push; sin merge de emergencia a ciegas; no restaurar dumps de staging sobre prod.

Commit/imagen de referencia a documentar en el momento del primer deploy exitoso (hoy: base de preparación `db5c5a4` en `release/production-v1`).

---

## 15. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Ausencia de offsite en producción | Bloqueo de go-live hasta proveedor + prueba restore |
| Reutilizar secretos de staging | Checklist: JWT/DB nuevos; verificación de longitud y desigualdad |
| Confundir CORS con WordPress apex | `CORS_ORIGINS` solo `https://portal.argos-it.com` salvo decisión explícita |
| `OPENAI_API_KEY` vacía | IA 503; producto debe comunicarlo o activar clave |
| `ENABLE_SOCKET_IO=false` | Sin WS hasta decisión y cliente real |
| Frontend sin HEALTHCHECK en Dockerfile | Riesgo de “Running” sin probe; valorar en fase impl. |
| sharp transitivo (Next.js) | No `npm audit fix --force` |
| Divergencia WordPress vs portal | Enlaces y expectativa de marca claros en cutover |
| Rate limit auth agresivo (8/15 min) | Operación consciente en smoke login |

---

## 16. Bloqueos

### Bloqueos externos (impiden crear recursos / go-live)

1. **Proveedor offsite** (R2/B2/S3/SCP): endpoint, bucket, access key, secret, región — no existen en repo ni se inventan.
2. **Autorización explícita** para crear DNS `portal` / `api.portal`.
3. **Autorización explícita** para crear PostgreSQL y apps Coolify de producción.
4. **Decisión** `OPENAI_API_KEY` (activar / dejar 503).
5. **Decisión** `ENABLE_SOCKET_IO` (mantener false / activar).
6. **Canal de alertas de producción** (ntfy/SMTP/Coolify) distinto de staging.
7. **Confirmación** de `BACKEND_URL` interna vs pública en Coolify.

### No bloquean la preparación documental (ya cubiertos en repo)

- Plantillas `.env.example` (raíz, backend, frontend, docker)
- HEALTHCHECK backend Node `fetch`
- Script de migración idempotente
- Evidencia de staging operativo como referencia de patrón (no como fuente de secretos)

---

## 17. Criterios de go-live

- [ ] Recursos prod creados y aislados de staging
- [ ] DNS + TLS en `portal` y `api.portal`
- [ ] Variables prod inyectadas (JWT nuevos, DB nueva, CORS/FRONTEND correctos)
- [ ] `migrate.sh` aplicado con éxito
- [ ] `/api/health` 200 y frontend 200
- [ ] verify-api público + autenticado PASS en prod
- [ ] Backup cifrado + offsite + restore temporal PASS
- [ ] Monitorización y alertas prod activas
- [ ] QA manual portal PASS
- [ ] WordPress apex/`www` verificado intacto
- [ ] Rollback ensayado o al menos documentado con commit/imagen previos
- [ ] Aprobación explícita del operador para abrir tráfico

---

## 18. Criterios de no-go

- Cualquier reutilización de secretos o DB de staging
- Offsite automático sin proveedor o sin prueba de restore
- TLS inválido o CAA que impida Let’s Encrypt
- CI rojo en el commit/tag a desplegar
- CORS/`NEXT_PUBLIC_BACKEND_URL` apuntando a staging o a localhost
- PostgreSQL expuesto públicamente
- Cambios no autorizados a WordPress / apex / `www` / correo / MySQL
- `OPENAI_API_KEY` prometida al usuario final pero vacía sin comunicado
- Fuerza merge/deploy sin checklist §17

---

## Apéndice A — Archivos auditados (solo lectura)

| Archivo | Resultado breve |
|---------|-----------------|
| `.env.example` | Plantilla backend+frontend+limits; placeholders; sin secretos reales |
| `backend/.env.example` | Variables API completas; JWT dual; Socket.IO/OpenAI documentados |
| `frontend/.env.example` | `BACKEND_URL` + `NEXT_PUBLIC_BACKEND_URL` + Formspree |
| `docker/.env.example` | Postgres local + JWT + puertos; compose local |
| `backend/Dockerfile` | Node 22 Alpine + HEALTHCHECK `fetch` `/api/health` |
| `frontend/Dockerfile` | Node 22 Alpine + build-arg `NEXT_PUBLIC_BACKEND_URL`; sin HEALTHCHECK |
| `database/migrate.sh` | Idempotente; requiere `DATABASE_URL`; sin seed admin |
| `docs/STAGING.md` / `STAGING_RESULTADOS.md` | Staging operativo; offsite staging pendiente de proveedor |
| `docs/DEPLOYMENT.md` / `VERIFY.md` / `DEPLOY_AUTH.md` | Guías previas; este plan las especializa a portal/api.portal |

## Apéndice B — Decisiones pendientes (operador)

1. Proveedor y credenciales offsite.
2. Activar o no OpenAI en producción.
3. Activar o no Socket.IO.
4. Fecha/ventana de cutover.
5. Enlaces desde WordPress hacia `portal.argos-it.com` (si aplica).
6. Quién genera y custodia JWT/DB/offsite keys.
7. Cuándo autorizar creación de DNS y recursos Coolify.
