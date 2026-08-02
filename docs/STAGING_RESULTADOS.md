# Resultados de staging ARGOS-IT

Fecha: 2026-08-02  
Rama: `deploy/staging-readiness`  
Commit desplegado (backend): `59dcd7d` — `fix(deploy): add Node fetch HEALTHCHECK to backend image`  
Commit frontend en Coolify (sin redespliegue en esta fase): `971de79`  
Responsable: operador staging / Coolify Root Team

## URLs

| Recurso | URL | Evidencia |
|---------|-----|-----------|
| Frontend | https://staging.argos-it.com | HTTP 200 |
| Backend health | https://api-staging.argos-it.com/api/health | HTTP 200 `{"status":"OK",...}` |
| Coolify | https://coolify.argos-it.com | panel operativo |
| PostgreSQL | privado (`argos-it-staging-db`, uuid `e52no3cf4ai3k6vk28hz0hk9`) | healthy, sin puerto público |

Proveedor: Hostinger VPS + Coolify 4.1.2 (`91.108.121.181`).

## Automatizado

- [x] CI verde — GitHub Actions run `30726075473` (PR #6) success ~2m
- [x] `npm run verify` — PASS local (pre-commit HEALTHCHECK)
- [x] E2E 8/8 — PASS local (`CI=1 npx playwright test`)
- [x] API health 200 (staging remoto)
- [x] verify-api público (staging remoto) — PASS; IA 503 `assistant_unavailable` (OPENAI_API_KEY vacía, esperado)
- [x] cliente 403 stats (staging remoto)
- [x] cliente 200 portal (staging remoto)
- [x] admin 200 stats (staging remoto)
- [x] refresh 200 (staging remoto)
- [x] IA real 200 o 503 documentado — **503** documentado

### Local (pre-staging)

- [x] `npm run verify` — TypeScript, build Next.js y `node --check` PASS
- [x] `CI=1 E2E_PORT=3001 npx playwright test` — 8/8 PASS
- [x] `./scripts/verify-api.sh` público — PASS
- [x] Roles locales — cliente stats 403, cliente portal 200, admin stats 200 y refresh 200
- [x] Docker health — PostgreSQL y backend healthy

## Auth staging (cuentas de prueba)

Cuentas exclusivas de staging (`@argos-staging.test`). Sin datos personales reales. Contraseñas/tokens no se documentan.

- Cliente: `staging.client.1785632874@argos-staging.test` (rol `cliente`)
- Admin: `staging.admin.1785632874@argos-staging.test` (elevado a `admin` vía SQL en PG privado)

Ejecución única:

```bash
BASE_URL=https://api-staging.argos-it.com \
TOKEN_CLIENT=… TOKEN_ADMIN=… TOKEN_REFRESH=… \
./scripts/verify-api.sh
```

Resultado: **PASS** (cliente stats 403, portal 200, admin stats 200, refresh 200).

## Healthcheck backend

- Dockerfile (`backend/Dockerfile`): HEALTHCHECK Node 22 `fetch` a `http://127.0.0.1:4000/api/health` (sin curl/wget)
- Contenedor Coolify tras redespliegue: **healthy** (`i121…:59dcd7d…`)
- Coolify UI: detectó *custom healthcheck* del Dockerfile (`custom_healthcheck_found=true`). **No** se activó el healthcheck HTTP/CMD de la UI porque Coolify advierte que reemplazaría el HEALTHCHECK del Dockerfile (y el HTTP inyectaría curl ausente en Alpine).

## CAA

Autoridad (`ns1`/`ns2.dns-parking.com`): solo `0 issue "letsencrypt.org"`.  
Eliminado el incorrecto `0 issue "argos-it.com"` (ningún otro registro DNS tocado).  
Verificado coherente en `@1.1.1.1` y `@8.8.8.8` (3 sondeos consecutivos OK tras purga de caché anycast).

## Backup PostgreSQL

| Ítem | Detalle |
|------|---------|
| Frecuencia | diaria cron `15 2 * * *` UTC |
| Script | `/root/argos-staging-ops/bin/pg-backup-encrypted.sh` |
| Cifrado | AES-256-CBC + PBKDF2 (`openssl`), clave en `/root/argos-staging-ops/keys/pg-backup.key` |
| Retención | 7 diarios + 4 semanales (domingo UTC) en `/var/lib/argos-offsite-backups/{daily,weekly}` |
| Destino externo al VPS | copia verificada vía `scp` a estación operador: `Documents/argos-staging-offsite-backups/`; hook `/root/argos-staging-ops/bin/offsite-sync.sh` (rclone `argos-offsite:` o `keys/offsite-scp.target`) |
| Prueba | `OK 20260802T010846Z size=4016` |

## Restauración (base temporal)

- Script: `/root/argos-staging-ops/bin/pg-restore-temp-test.sh`
- Restaurado a `argos_restore_tmp_*` (nunca sobre staging)
- Resultado: `OK restore_test temp_tables=12 users=9` y DROP de la DB temporal

## Monitorización

Cron `*/5 * * * *` → `/root/argos-staging-ops/bin/monitor-staging.sh`

Comprueba:

- https://staging.argos-it.com → HTTP 200
- https://api-staging.argos-it.com/api/health → HTTP 200
- CPU (load), RAM, disco
- reinicios de contenedores staging (api/web/db)
- health Docker del backend
- fallo/staleness de backups (>36h)
- expiración TLS (<14 días)
- estado sync offsite

Alertas: ntfy topic `argos-it-staging-3346f3cfa0f1e421` (`https://ntfy.sh/argos-it-staging-3346f3cfa0f1e421`). Primer ciclo sin alertas (todo OK).

Coolify Sentinel también expone métricas del servidor; canal de notificaciones Coolify UI sigue pendiente de SMTP/webhook dedicado.

## Manual (staging remoto)

- [ ] Responsive
- [ ] Formulario
- [ ] Chat
- [ ] Idiomas
- [ ] Legal
- [ ] SEO
- [ ] Consola
- [ ] Imágenes
- [ ] Login
- [ ] Dashboard

## Riesgos pendientes

- `OPENAI_API_KEY` vacía → IA pública 503 (esperado en staging)
- `ENABLE_SOCKET_IO=false`
- Offsite automatizado diario: falta configurar sink permanente (`rclone` remoto `argos-offsite` **o** `offsite-scp.target`); hay copia manual verificada fuera del VPS
- Coolify UI healthcheck no activado a propósito (preservar HEALTHCHECK Dockerfile)
- Coolify realtime warning en panel; notificaciones Coolify nativas no habilitadas (sí ntfy)
- Hostinger DNS MCP a veces `Unauthenticated` — CAA corregido vía zona/autoridad
- sharp transitivo de Next.js — no forzar `npm audit fix --force`
- Cuentas de prueba staging deben rotarse/borrarse antes de producción
- No fusionar a `main` en esta fase

## Rollback

| Ítem | Valor |
|------|-------|
| Commit backend anterior | `971de79` |
| Procedimiento | Coolify → app `argos-it-staging-api` → Rollback / redeploy commit previo; **no** tocar frontend/WordPress/apex/www/MySQL |
| Base de datos | no restaurar backups encima de staging salvo incidente; usar DB temporal para pruebas |
| DNS | no revertir CAA a `issue "argos-it.com"` |
| Responsable | operador |

## Notas

- Rama de trabajo exclusiva: `deploy/staging-readiness` (sin force push, sin merge a `main`).
- Ver [STAGING.md](./STAGING.md) y [DEPLOY_AUTH.md](./DEPLOY_AUTH.md).
