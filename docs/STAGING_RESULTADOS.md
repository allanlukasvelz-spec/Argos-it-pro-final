# Resultados de staging ARGOS-IT

Fecha: 2026-08-02  
Rama: `deploy/staging-readiness`  
Commit desplegado (backend): `59dcd7d` — `fix(deploy): add Node fetch HEALTHCHECK to backend image`  
Commit frontend en Coolify (sin redespliegue en esta fase): `971de79`  
Documentación de cierre: actualizar con este archivo en la rama (ver historial git)  
Responsable: operador staging / Coolify Root Team

## Estado global

**Staging operativo y verificable.**  
**Único bloqueo restante para cerrar la fase de backups offsite: configuración de un almacenamiento externo real** (credenciales + bucket/endpoint S3-compatible, B2, R2 o equivalente). No se inventan credenciales ni se configura `rclone` hasta disponer de un proveedor.

Producción, WordPress, apex, `www`, correo y MySQL: **intactos**. PR **sin merge**.

## Completado (válido)

| Área | Estado |
|------|--------|
| CI verde | Sí — runs `30726075473` / `30726822516` (PR #6) |
| Frontend | https://staging.argos-it.com → HTTP 200 |
| Backend health | https://api-staging.argos-it.com/api/health → HTTP 200 |
| Contenedor API | **healthy** (HEALTHCHECK Node `fetch` en Dockerfile) |
| TLS Let’s Encrypt | Válido (~89 días en última comprobación) |
| CAA | Solo `0 issue "letsencrypt.org"` (auth + resolvers públicos) |
| Auth staging | cliente stats 403, portal 200, admin stats 200, refresh 200 |
| IA pública | 503 `assistant_unavailable` (OPENAI_API_KEY vacía, esperado) |
| Backup local cifrado | Diario AES-256-CBC + PBKDF2; cron `15 2 * * *` UTC |
| Restauración temporal | PASS en DB temporal (nunca sobre staging); DB temp eliminada |
| Retención local | 7 diarios + 4 semanales en `/var/lib/argos-offsite-backups/{daily,weekly}` |
| Monitorización básica | Cron `*/5`; HTTP, TLS, CPU/RAM/disco, reinicios, backup stale |
| Staging stack | PostgreSQL privado healthy; `ENABLE_SOCKET_IO=false` sin cambios |

## Pendiente (bloqueo documentado)

### Offsite automático — BLOQUEADO

No hay en el VPS:

- binario `rclone`
- remoto `argos-offsite` / `rclone.conf`
- registros Coolify `s3_storages`
- `offsite-scp.target`
- variables/credenciales S3, B2 o R2

Por tanto **no** se configura sync automático ni se inventa destino.

Hook preparado (sin proveedor): `/root/argos-staging-ops/bin/offsite-sync.sh` — requiere `rclone` remoto `argos-offsite:` **o** `keys/offsite-scp.target`.

Copia manual puntual fuera del VPS (estación operador) existió como evidencia operativa; **no sustituye** un destino offsite permanente y automático.

### Otros pendientes no bloqueantes de infra staging

- QA manual (responsive, formulario, chat, idiomas, legal, SEO, consola, imágenes, login UI, dashboard)
- Desactivar/eliminar cuentas `@argos-staging.test` tras evidencia (aún presentes; no se tocaron en este cierre documental)
- Rotar canal ntfy si se considera expuesto (solo en servidor; nunca en Git)
- Notificaciones nativas Coolify (SMTP/webhook)
- Activar sink offsite cuando el operador entregue credenciales reales

## URLs

| Recurso | URL | Evidencia |
|---------|-----|-----------|
| Frontend | https://staging.argos-it.com | HTTP 200 |
| Backend health | https://api-staging.argos-it.com/api/health | HTTP 200 `{"status":"OK",...}` |
| Coolify | https://coolify.argos-it.com | panel operativo |
| PostgreSQL | privado (`argos-it-staging-db`, uuid `e52no3cf4ai3k6vk28hz0hk9`) | healthy, sin puerto público |

Proveedor: Hostinger VPS + Coolify 4.1.2 (`91.108.121.181`).

## Automatizado

- [x] CI verde
- [x] `npm run verify` / E2E 8/8 (locales en fase de healthcheck)
- [x] API health 200 (staging remoto)
- [x] verify-api público + autenticado (staging remoto)
- [x] IA 503 documentado
- [ ] Offsite automático diario con checksum y alerta — **PENDIENTE / BLOQUEADO** (falta proveedor)

## Auth staging (cuentas de prueba)

Cuentas exclusivas de staging (`@argos-staging.test`). Sin datos personales reales. Contraseñas/tokens no se documentan.

- Cliente: `staging.client.1785632874@argos-staging.test` (rol `cliente`)
- Admin: `staging.admin.1785632874@argos-staging.test` (rol `admin`)

Resultado verify-api autenticado: **PASS**. Pendiente de desactivación/borrado antes de producción.

## Healthcheck backend

- Dockerfile: HEALTHCHECK Node 22 `fetch` → `/api/health` (sin curl/wget)
- Contenedor: **healthy**
- Coolify UI healthcheck HTTP/CMD: **no activado** a propósito (preservar HEALTHCHECK del Dockerfile)

## CAA

Solo `0 issue "letsencrypt.org"`. Eliminado `0 issue "argos-it.com"`. Sin otros cambios DNS.

## Backup PostgreSQL (local — válido)

| Ítem | Detalle |
|------|---------|
| Frecuencia | diaria cron `15 2 * * *` UTC |
| Script | `/root/argos-staging-ops/bin/pg-backup-encrypted.sh` |
| Cifrado | AES-256-CBC + PBKDF2 |
| Retención local | 7 diarios + 4 semanales |
| Prueba registrada | `OK 20260802T010846Z size=4016` |
| Offsite automático | **PENDIENTE** — sin credenciales de proveedor |

## Restauración (base temporal — válida)

- `OK restore_test temp_tables=12 users=9`
- DB temporal eliminada tras la prueba
- Staging no sobrescrito

## Monitorización (válida)

Cron `*/5 * * * *` → `/root/argos-staging-ops/bin/monitor-staging.sh`  
HTTP, TLS, CPU/RAM/disco, reinicios, health backend, staleness de backup, hint de offsite.  
Canal ntfy en servidor (no versionar el topic en Git tras rotación futura).

## Requisitos para pasar a producción

1. **Offsite permanente:** entregar endpoint + bucket + access key + secret (+ región) de R2/B2/S3-compatible **o** destino SCP, luego configurar `rclone` y prueba upload/download/restore temp.
2. Rotar/eliminar cuentas `@argos-staging.test`.
3. Decidir y configurar `OPENAI_API_KEY` y `ENABLE_SOCKET_IO` para el entorno productivo (staging los deja vacíos/false a propósito).
4. Completar QA manual de la checklist.
5. Revisar notificaciones Coolify + rotar ntfy si el topic quedó expuesto.
6. Merge controlado del PR `#6` / rama `deploy/staging-readiness` → `main` **solo tras** los puntos anteriores acordados (no automático).
7. No tocar WordPress/apex/`www`/correo/MySQL del sitio actual en el cutover sin plan explícito.

## Riesgos restantes

- **Bloqueo único de cierre offsite:** falta almacenamiento externo real
- `OPENAI_API_KEY` vacía / Socket.IO deshabilitado en staging (esperado)
- Cuentas de prueba aún activas
- Topic ntfy documentado previamente — rotar en servidor si se considera filtrado
- Coolify realtime / notificaciones nativas incompletas
- sharp transitivo de Next.js — no `npm audit fix --force`

## Rollback

| Ítem | Valor |
|------|-------|
| Commit backend anterior | `971de79` |
| Procedimiento | Coolify → `argos-it-staging-api` → Rollback / redeploy commit previo |
| Base de datos | no restaurar encima de staging salvo incidente |
| DNS | no reintroducir CAA `issue "argos-it.com"` |
| Responsable | operador |

## Notas

- Sin force push; sin merge a `main` en esta fase.
- Ver [STAGING.md](./STAGING.md) y [DEPLOY_AUTH.md](./DEPLOY_AUTH.md).
