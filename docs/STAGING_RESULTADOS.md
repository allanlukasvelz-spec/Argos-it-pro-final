# Resultados de Staging ARGOS-IT

Fecha: 2026-08-02  
Rama: `deploy/staging-readiness`  
Commit desplegado (backend): `59dcd7d` — `fix(deploy): add Node fetch HEALTHCHECK to backend image`  
Commit frontend en Coolify (sin redespliegue en esta fase): `971de79`  
Responsable: operador staging / Coolify Root Team

## 1. Resumen ejecutivo

Staging ARGOS-IT está desplegado en Hostinger VPS + Coolify 4.1.2, con frontend, API, PostgreSQL privado, TLS, CAA, autenticación y backups locales cifrados verificados. El CI de la rama está verde. La producción y el sitio WordPress actuales no se han modificado. El PR #6 permanece sin merge.

## 2. Estado global

El staging se encuentra operativo y completamente verificable.

El único bloqueo técnico de infraestructura pendiente es la automatización del backup offsite mediante un proveedor de almacenamiento externo.

Además permanecen pendientes tareas operativas y de QA antes de autorizar el paso a producción.

Producción, WordPress, apex, `www`, correo y MySQL: intactos.

## 3. Componentes verificados

| Área | Estado |
|------|--------|
| CI verde | Sí — runs `30726075473` / `30726822516` (PR #6) |
| Frontend | https://staging.argos-it.com → HTTP 200 |
| Backend health | https://api-staging.argos-it.com/api/health → HTTP 200 |
| Contenedor API | **healthy** (HEALTHCHECK Node `fetch` en Dockerfile) |
| TLS Let’s Encrypt | Válido (~89 días en última comprobación) |
| CAA | Solo `0 issue "letsencrypt.org"` (autoridad + resolvers públicos) |
| Auth staging | cliente stats 403, portal 200, admin stats 200, refresh 200 |
| IA pública | 503 `assistant_unavailable` (`OPENAI_API_KEY` vacía, esperado) |
| Backup local cifrado | Diario AES-256-CBC + PBKDF2; cron `15 2 * * *` UTC |
| Restauración temporal | PASS en DB temporal (nunca sobre staging); DB temp eliminada |
| Retención local | 7 diarios + 4 semanales |
| Monitorización básica | Cron `*/5`; HTTP, TLS, CPU/RAM/disco, reinicios, backup stale |
| PostgreSQL | Privado, healthy; `ENABLE_SOCKET_IO=false` sin cambios |

## 4. URLs verificadas

| Recurso | URL | Evidencia |
|---------|-----|-----------|
| Frontend | https://staging.argos-it.com | HTTP 200 |
| Backend health | https://api-staging.argos-it.com/api/health | HTTP 200 `{"status":"OK",...}` |
| Coolify | https://coolify.argos-it.com | panel operativo |
| PostgreSQL | privado (`argos-it-staging-db`, UUID interno) | healthy, sin puerto público |

Proveedor: Hostinger VPS de staging + Coolify 4.1.2.

## 5. CI y pruebas

- [x] CI verde — GitHub Actions runs `30726075473` / `30726822516` (PR #6)
- [x] `npm run verify` — PASS local (fase healthcheck)
- [x] E2E 8/8 — PASS local (`CI=1 npx playwright test`)
- [x] API health 200 (staging remoto)
- [x] `./scripts/verify-api.sh` público — PASS; IA 503 documentado
- [x] `./scripts/verify-api.sh` autenticado — PASS (roles y refresh)
- [ ] Offsite automático diario con checksum y alerta — pendiente (falta proveedor)

## 6. Backend

- Dockerfile: HEALTHCHECK Node 22 `fetch` → `http://127.0.0.1:4000/api/health` (sin curl/wget)
- Contenedor Coolify tras redespliegue de `59dcd7d`: **healthy**
- Coolify UI healthcheck HTTP/CMD: no activado a propósito (preservar el HEALTHCHECK del Dockerfile; el HTTP inyectaría curl ausente en Alpine)
- `ENABLE_SOCKET_IO=false` (sin cambios en esta fase)
- `OPENAI_API_KEY` vacía → IA pública 503 `assistant_unavailable` (esperado)

## 7. Frontend

- URL: https://staging.argos-it.com → HTTP 200
- Commit en Coolify (sin redespliegue en la fase de cierre de healthcheck): `971de79`
- QA manual de UI (responsive, formulario, chat, idiomas, legal, SEO, consola, imágenes, login, dashboard): pendiente

## 8. PostgreSQL

- Instancia privada en Coolify (`argos-it-staging-db`, UUID interno)
- Estado: healthy, sin exposición pública
- Usuario/DB de aplicación: `argos_app` / `argos_it`
- No se ha restaurado ningún backup encima de staging

## 9. Autenticación

Cuentas exclusivas de staging, sin datos personales reales. Contraseñas y tokens no se documentan.

- Cliente temporal de staging (rol `cliente`)
- Administrador temporal de staging (rol `admin`)

Ejecución única de:

```bash
BASE_URL=https://api-staging.argos-it.com \
TOKEN_CLIENT=… TOKEN_ADMIN=… TOKEN_REFRESH=… \
./scripts/verify-api.sh
```

Resultado: **PASS** — cliente stats 403, portal 200, admin stats 200, refresh 200.

Pendiente: eliminar o desactivar estas cuentas temporales antes de producción.

## 10. TLS y DNS

- TLS Let’s Encrypt válido en `staging.argos-it.com` y `api-staging.argos-it.com` (~89 días en última comprobación)
- CAA autoridad (`ns1`/`ns2.dns-parking.com`) y resolvers públicos (`@1.1.1.1`, `@8.8.8.8`): solo `0 issue "letsencrypt.org"`
- Eliminado el CAA incorrecto `0 issue "argos-it.com"`
- Ningún otro registro DNS modificado; WordPress / apex / `www` / correo / MySQL intactos

## 11. Backups

| Tipo | Estado |
|------|--------|
| Backup local | ✔ Verificado |
| Restauración temporal | ✔ Verificada |
| Copia manual externa | ✔ Verificada |
| Backup offsite automático | ⛔ Pendiente por ausencia de proveedor |

Detalle del backup local:

| Ítem | Detalle |
|------|---------|
| Frecuencia | diaria cron `15 2 * * *` UTC |
| Script operativo | `/root/argos-staging-ops/bin/pg-backup-encrypted.sh` |
| Cifrado | AES-256-CBC + PBKDF2; clave almacenada fuera del repositorio |
| Retención local | 7 diarios + 4 semanales en `/var/lib/argos-offsite-backups/{daily,weekly}` |
| Prueba registrada | `OK 20260802T010846Z size=4016` |

Offsite automático: no hay `rclone`, remoto configurado, Coolify `s3_storages`, ni destino SCP. Existe hook preparado sin proveedor (`offsite-sync.sh`). No se inventan credenciales.

## 12. Restauración

- Script: `/root/argos-staging-ops/bin/pg-restore-temp-test.sh`
- Resultado: `OK restore_test temp_tables=12 users=9`
- Base temporal eliminada tras la prueba
- Staging no sobrescrito

## 13. Monitorización

- Cron `*/5 * * * *` → `/root/argos-staging-ops/bin/monitor-staging.sh`
- Comprueba: HTTP staging y `/api/health`, TLS, CPU, RAM, disco, reinicios de contenedores, health Docker del backend, staleness de backup, hint de sync offsite
- Alertas vía ntfy en el servidor (canal a rotar solo en servidor; no versionar el topic en Git)
- Coolify Sentinel disponible; notificaciones nativas Coolify (SMTP/webhook) pendientes

## 14. Pendientes

- QA manual completa
- eliminar cuentas temporales
- rotación del canal ntfy
- configurar proveedor offsite
- decidir `OPENAI_API_KEY`
- decidir `ENABLE_SOCKET_IO`
- configurar notificaciones nativas de Coolify

## 15. Riesgos

- ausencia de almacenamiento offsite
- cuentas temporales activas
- `OPENAI_API_KEY` vacía
- `ENABLE_SOCKET_IO=false`
- notificaciones Coolify pendientes
- dependencia transitiva sharp

## 16. Requisitos para Producción

1. Configurar offsite permanente (endpoint + bucket + claves de R2/B2/S3-compatible, o destino SCP) y ejecutar prueba upload/download/restore temporal.
2. Eliminar o desactivar cuentas temporales de staging.
3. Decidir y configurar `OPENAI_API_KEY` y `ENABLE_SOCKET_IO` para el entorno productivo.
4. Completar QA manual.
5. Configurar notificaciones Coolify y rotar el canal ntfy en el servidor si se considera expuesto.
6. Merge controlado del PR #6 / rama `deploy/staging-readiness` → `main` solo tras los puntos anteriores (no automático).
7. No tocar WordPress / apex / `www` / correo / MySQL del sitio actual en el cutover sin plan explícito.

## 17. Rollback

| Ítem | Valor |
|------|-------|
| Commit backend anterior | `971de79` |
| Procedimiento | Coolify → `argos-it-staging-api` → Rollback / redeploy commit previo; no tocar frontend/WordPress/apex/`www`/MySQL |
| Base de datos | no restaurar backups encima de staging salvo incidente; usar DB temporal para pruebas |
| DNS | no reintroducir CAA `issue "argos-it.com"` |
| Responsable | operador |

## 18. Estado Final

| Área | Estado |
|------|--------|
| Staging | ✅ Operativo |
| Frontend | ✅ Verificado |
| Backend | ✅ Verificado |
| PostgreSQL | ✅ Verificado |
| TLS / DNS | ✅ Verificados |
| Autenticación | ✅ Verificada |
| Backup local | ✅ Verificado |
| Restauración | ✅ Verificada |
| Monitorización | ✅ Activa |
| Backup offsite automático | ⛔ Pendiente |
| QA manual | ⏳ Pendiente |
| Producción | ❌ No autorizada |
| PR #6 | ⏳ Pendiente de merge |
