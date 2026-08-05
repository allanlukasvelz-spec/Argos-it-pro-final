# 09 — Monitoring

## Resumen

Monitorización host-level por scripts shell + cron + logs + ntfy. Sin APM/Prometheus desplegado.

## Estado

Monitor producción ciclo OK en verificación (`monitor_cycle_done`).

**Última verificación UTC:** 2026-08-05T10:00Z

## Inventario — Scripts

| Script | Ruta | Cron |
|---|---|---|
| monitor producción | `/root/argos-prod-ops/bin/monitor-production.sh` | `*/5 * * * *` |
| r2 offsite sync | `/root/argos-prod-ops/bin/r2-offsite-sync.sh` | `15 0 * * *` |
| monitor staging | `/root/argos-staging-ops/bin/monitor-staging.sh` | `*/5 * * * *` |
| backup staging encrypted | `/root/argos-staging-ops/bin/pg-backup-encrypted.sh` | `15 2 * * *` |

## Logs

| Archivo | Contenido |
|---|---|
| `/root/argos-prod-ops/logs/monitor-YYYYMMDD.log` | Checks detallados |
| `/root/argos-prod-ops/logs/alerts.log` | Alertas |
| `/root/argos-prod-ops/logs/r2-offsite-sync-*.log` | Sync |
| `/root/argos-prod-ops/state/monitor.state` | Estado |

## Alertas / ntfy

Topic file: `/root/argos-prod-ops/keys/ntfy-topic` (contenido no leído).  
Canal exacto URL: **NO VERIFICADO** sin abrir secreto.

## Checks observados (prod)

- HTTP portal/API
- Contenedores web/api/db + restarts
- backup_schedule_enabled / save_s3 / storage / r2_usable
- last_backup_status / backup_age_h
- offsite_dump_count / offsite_age_h / offsite_rclone_ok
- coolify_s3_uploaded (informativo)
- docker_daemon / filesystem rw

## Recovery

Ante ALERT: revisar `alerts.log` · runbook DR · no auto-remediation destructiva.

## Dependencias

cron · curl · docker · rclone · ntfy · Coolify DB queries (si aplica en script).

## Riesgos

Sin paging 24/7 formal · single host · dependencia ntfy externo · Coolify Sentinel health no es alerting humano.

## Rollback

Backup monitor en `/root/argos-fase8l-rollback/` (histórico).

## Observaciones

Coolify Sentinel = health agent Coolify, no sustituye monitor ARGOS.

**Última verificación UTC:** 2026-08-05T10:00Z
