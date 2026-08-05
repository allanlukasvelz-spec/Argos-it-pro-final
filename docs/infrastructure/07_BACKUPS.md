# 07 — Backups

## Resumen

Cadena híbrida: dump Coolify diario + sync host-level rclone a Cloudflare R2 + monitor cada 5 minutos.

## Estado

Último backup status success · offsite_dump_count=4 · offsite_rclone_ok=1 · cadena offsite **operativa** vía rclone · `coolify_s3_uploaded=false` es residual del fallo `mc`/IPv6 (no implica offsite roto).

**Última verificación UTC:** 2026-08-05T10:00Z

## Arquitectura

```
PG prod (iw42…)
   │ Coolify schedule 00:00 UTC
   ▼
Dump local Coolify (/data/coolify/backups/…)
   │ rclone cron 00:15 UTC
   ▼
R2 bucket argos-it-production-backups
   │
Monitor */5 ──► edad objeto R2 + status Coolify
```

## Inventario

| Pieza | Ubicación |
|---|---|
| Schedule prod | UUID `uu5d6t4m6oatofvf4hwl5oeg` |
| Storage R2 Coolify | UUID `qzrnhrzylrp6ngup2ahfalox` |
| Script sync | `/root/argos-prod-ops/bin/r2-offsite-sync.sh` |
| rclone conf | `/root/argos-prod-ops/keys/rclone-r2.conf` (600) |
| Monitor | `/root/argos-prod-ops/bin/monitor-production.sh` |
| Staging encrypted backup | `/root/argos-staging-ops/bin/pg-backup-encrypted.sh` @ 02:15 |

## Retenciones (config Coolify prod)

Local: amount 7 · days 14  
S3 config: amount 30 · days 30  
R2 objetos `.dmp` verificados: 4 (2026-08-02 … 2026-08-05)

## Historial offsite (lsf)

| Timestamp UTC | Objeto |
|---|---|
| 2026-08-02 13:23:19 | pg-dump-postgres-1785676996.dmp |
| 2026-08-03 00:00:50 | pg-dump-postgres-1785715235.dmp |
| 2026-08-04 00:00:28 | pg-dump-postgres-1785801624.dmp |
| 2026-08-05 00:00:25 | pg-dump-postgres-1785888021.dmp |

## Restore

Ver `docs/PRODUCTION_DR_RUNBOOK.md` y `15_DISASTER_RECOVERY.md`.

- **Restore temporal:** validado (dump custom, SHA256, `pg_restore -l`, DB temporal, schema OK, prod intacta, cleanup).
- **Drill operativo completo** (recuperación total servicio/VPS + cutover): pendiente.

## Validaciones monitor

Checks OK observados: `last_backup_status=success`, `backup_age_h≈9`, `offsite_dump_count=4`, `r2_usable=1`, `offsite_rclone_ok=1`.

## Dependencias

Coolify schedule · rclone · R2 credentials · cron · disco local.

## Riesgos

`mc` Coolify falla con IPv6/AAAA (`s3_uploaded` puede quedar false) · offsite real = rclone+cron+monitor R2 · dependencia script host · staging schedule Coolify disabled.

## Rollback

FASE 8L evidencia `/root/argos-fase8l-rollback/`.

## Observaciones

No confiar solo en `s3_uploaded` Coolify; fuente de verdad offsite = rclone/R2 object age.

**Última verificación UTC:** 2026-08-05T10:00Z
