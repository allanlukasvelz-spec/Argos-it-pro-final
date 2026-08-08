# 04 — Coolify

## Resumen

Coolify orquesta proyectos staging/producción, proxy Traefik, backups y panel en `https://coolify.argos-it.com`.

## Estado

Panel HTTPS 200 · contenedor healthy · Laravel Framework 12.61.1 (artisan) · **Coolify 4.2.0 fijado** (`LATEST_IMAGE=4.2.0`; digest `b8aea35f…`; 346 migraciones / pending 0; batch 337+9). Downgrade a 4.1.2 **no autorizado**.

**Última verificación UTC:** 2026-08-06T16:08Z

## Inventario

| Recurso | Valor |
|---|---|
| Contenedor | `coolify` (`coollabsio/coolify:4.2.0`) |
| `LATEST_IMAGE` | `4.2.0` (persistido en `/data/coolify/source/.env`) |
| Digest en ejecución | `sha256:b8aea35f4113e54c38be3e88f842e09856aebcf92bd3e264b06c567c99ed4921` |
| App efectiva | **4.2.0** (pin FASE 13.2B) |
| DB interna | `coolify-db` PostgreSQL 15.18 |
| Redis | `coolify-redis` Redis 7 |
| Realtime | `coolify-realtime` 1.0.16 |
| Sentinel | `coolify-sentinel` 0.0.21 |
| Proxy | `coolify-proxy` Traefik v3.6 |
| Datos | `/data/coolify/` |
| Source compose | `/data/coolify/source/docker-compose.yml` + `docker-compose.prod.yml` |

## Proyectos

| ID | Nombre | UUID |
|---|---|---|
| 1 | argos-it-staging | `z1bkmitihuqa8f1jnn486dty` |
| 2 | argos-it-production | `kuj0ntmv03fj5rwiu90hnsom` |

## Applications

| Nombre | UUID | FQDN | Branch | Auto-deploy | Status |
|---|---|---|---|---|---|
| argos-it-staging-api | `i121mjb3zyjekyn3nuqgeqfr` | api-staging.argos-it.com | deploy/staging-readiness | **true** | running:healthy |
| argos-it-staging-web | `r5rn3xgjxyln22k18pwa2a98` | staging.argos-it.com | deploy/staging-readiness | **true** | running:unknown |
| argos-it-production-api | `ufcwdojnv5wajhllw0df7olg` | api.portal.argos-it.com | deploy/production-v1 | **false** | running:healthy |
| argos-it-production-web | `rpp5o3j1lvbbq1wjleaqyu91` | portal.argos-it.com | deploy/production-v1 | **false** | running:unknown |

Build pack: `dockerfile` (todas).

## Databases (standalone PostgreSQL)

| UUID | Rol | Imagen |
|---|---|---|
| `iw42qpqc1w1umsddrl9fwpi9` | Producción | postgres:16-alpine |
| `e52no3cf4ai3k6vk28hz0hk9` | Staging | postgres:16-alpine |

Nombres lógicos Coolify: producción backupea DB `postgres`; staging schedule referencia `argos_it` (schedule staging **disabled**).

## Storages (S3/R2)

| Nombre | UUID | usable |
|---|---|---|
| argos-it-production-backups | `qzrnhrzylrp6ngup2ahfalox` | true |
| argos-it-staging-backups | `ld0jk183xv81x4wyn3gm2f9s` | true |

## Backup schedules

| UUID | DB | enabled | frequency | save_s3 | retention local amount/days | retention S3 amount/days |
|---|---|---|---|---|---|---|
| `uu5d6t4m6oatofvf4hwl5oeg` | standalone PG #2 (prod) | **true** | daily | true | 7 / 14 | 30 / 30 |
| `mij49w0vvyikci2djpsxz38u` | standalone PG #1 (stg) | **false** | daily | true | 0 / 0 | 0 / 0 |

## Environment / Secrets

- Variables de aplicación viven en Coolify (no en Git).
- API prod env count contenedor: **24** (nombres/valores **no impresos**).
- Web prod env count: **13**.
- Coolify `.env` en `/data/coolify/source/` — **no leído en esta fase** (secretos).

## Builds / Deploys

- Producción: deploy manual (auto-deploy OFF).
- Staging: auto-deploy ON (webhook).
- Commit runtime prod verificado en imagen: `651deb54e543748e990ca28f427cbfe2ca6fbccc`.
- Historial deployments tabla: **PENDIENTE DE VALIDACIÓN** (query limitada en esta pasada).

## Workers

Coolify queue workers: **NO VERIFICADO** (interno Laravel). Realtime/Soketi operativo.

## Dependencias

GitHub App `argos-i-t-coolify` · DNS · Traefik · Docker.

## Riesgos

`coolify:latest` sin pin · app ~4.2.0 · staging auto-deploy ON · upload `mc` a R2 falla (IPv6); offsite OK vía rclone · panel público en 443.

## Rollback

Compose backups: `/root/argos-prod-ops/backups/`, `/root/argos-fase10d4-rollback/`. Redeploy imagen anterior `7be6f06` posible si retiene tag. Downgrade Coolify a 4.1.2 **no autorizado**.

## Observaciones

No presentar 4.1.2 como versión actual efectiva. La etiqueta `latest` resuelve al digest actualmente en ejecución; pin explícito pendiente de autorización.

**Última verificación UTC:** 2026-08-05T10:00Z
