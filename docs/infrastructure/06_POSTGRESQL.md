# 06 — PostgreSQL

## Resumen

Tres instancias PostgreSQL: Coolify meta-DB (15), producción app (16), staging app (16).

## Estado

Prod y Coolify healthy · Staging container healthy · versión staging exacta: ver notas.

**Última verificación UTC:** 2026-08-05T10:00Z

## Inventario

| Instancia | Contenedor / UUID | Imagen | Versión verificada | Volume |
|---|---|---|---|---|
| Coolify | `coolify-db` | postgres:15-alpine | **15.18** | `coolify-db` |
| Producción | `iw42qpqc1w1umsddrl9fwpi9` | postgres:16-alpine | **16.14** | `postgres-data-iw42…` |
| Staging | `e52no3cf4ai3k6vk28hz0hk9` | postgres:16-alpine | Imagen OK · patch **NO VERIFICADO** (auth) | `postgres-data-e52n…` |

## Configuración

| Campo | Producción | Staging |
|---|---|---|
| DB lógica backup | `postgres` | `argos_it` (schedule) |
| Puerto host | no publicado | no publicado |
| Acceso | red Docker `coolify` | red Docker |

Usuarios/roles/esquemas detallados: **NO VERIFICADO** (sin listar secretos ni `\du` en esta fase).

## Backups

Ver `07_BACKUPS.md`. Schedule prod `uu5d6t4m6oatofvf4hwl5oeg` daily enabled. Staging schedule `mij49w0v…` **disabled**.

## Restore

Procedimiento autorizado: `docs/PRODUCTION_DR_RUNBOOK.md` · dual auth · DB temporal de prueba.

## Políticas

| Política | Prod |
|---|---|
| Retención local Coolify | 7 dumps / 14 días |
| Retención S3 configurada | 30 / 30 días |
| Offsite real | rclone → R2 (4 dumps verificados Aug 2–5) |

## Dependencias

Disco VPS · R2 · Coolify scheduler · monitor.

## Riesgos

Schedule staging disabled · Coolify `s3_uploaded` puede ser false (`mc`/IPv6; offsite OK vía rclone) · restore temporal validado; falta drill de recuperación total servicio/VPS · sin HA.

## Rollback

Restore desde dump local Coolify o R2 según runbook.

## Observaciones

No imprimir passwords. Credenciales solo en Coolify vault / env.

**Última verificación UTC:** 2026-08-05T10:00Z
