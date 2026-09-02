# 17 — Infrastructure Changelog

## Resumen

Cronología de cambios de infraestructura ARGOS-IT (VPS/Coolify). Fechas UTC aproximadas según evidencias de fases y rollbacks.

## Estado

Vivo · ampliar en cada cambio futuro.

**Última verificación UTC:** 2026-08-06T16:08Z

## Inventario cronológico

| Fecha UTC | Fase | Qué cambió | Por qué | Resultado | Rollback |
|---|---|---|---|---|---|
| 2026-08-06 | **13.2B** | `LATEST_IMAGE=4.2.0`; recreate solo `coolify` `--pull never` | Fijar imagen (mismo digest) | **OK** digest `b8aea35f…` | `/root/argos-fase13-2b-rollback/` |
| 2026-08-06 | **FASE FINAL** | Auditoría cierre + swap 2G + sysctl + CMDB sync | Cierre v1.0 infra | **OK** | `/root/argos-fase-final-cierre/` |
| 2026-08-01 | Bootstrap | VPS Ubuntu, UFW, Coolify install | Host staging/prod | Coolify up | N/A |
| 2026-08-01/02 | DNS staging/coolify | A records Hostinger | Acceso nombres | OK | N/A |
| 2026-08-02 | Staging deploy | Apps+PG staging | Entorno prueba | 200/200 | Coolify redeploy |
| 2026-08-02 | Prod deploy | Apps+PG prod `deploy/production-v1` | Go-live portal | 200/200 | Redeploy |
| 2026-08-02 | FASE 6 | Auto-deploy OFF prod | Evitar redeploys cruzados | OK | Re-enable si auth |
| 2026-08-02 | FASE 8/9 | Backups R2 + monitor + DR docs | Continuidad | Parcial→OK | Scripts backup |
| 2026-08-03 | 10D.1–10D.2 | Cierre publish 8080/8000 | Superficie | OK | compose backups |
| 2026-08-04 | 10D prep | Compose 6001 cleanup histórico | Hardening | Parcial | backups ops |
| 2026-08-05 | 10D.3.5 | Auditoría R2 `s3_uploaded=false` | Diagnóstico | Clasificado C | N/A |
| 2026-08-05 | **8L** | rclone offsite + backfill + monitor | Reparar R2 | **OK** 4 dumps | `/root/argos-fase8l-rollback/` |
| 2026-08-05 | **10D.4** | Quitar `6002:6002` + UFW 6001 | Cerrar realtime público | **OK** | `/root/argos-fase10d4-rollback/` |
| 2026-08-05 | **10E** | PasswordAuthentication no | SSH key-only | **OK** | `/root/argos-fase10e-rollback/` |
| 2026-08-05 | **10F** | Usuario argosadmin + PermitRootLogin prohibit-password | Admin dedicado | **OK** | `/root/argos-fase10f-rollback/` |
| 2026-08-05 | **10G.1** | AllowUsers root argosadmin | Restringir auth | **OK** | `/root/argos-fase10g1-rollback/` |
| 2026-08-05 | **10G.2** | Auditoría MFA (sin cambios) | Diseño | Completada | N/A |
| 2026-08-05 | **11** | CMDB docs `docs/infrastructure/` | Documentación maestra | Este set | Git revert docs |
| 2026-08-05 | **11.1** | Revisión consistencia CMDB | Alinear restore/Coolify 4.2/offsite/riesgos | Diff docs | Git revert docs |

## Dependencias

Evidencia en `/root/argos-fase*-rollback/` y transcripts operativos.

## Riesgos

Fechas de fases tempranas (ago 1–2) pueden tener minutos no exactos → marcar **aprox** si auditoría legal exige minuto.

## Rollback

Ver columna Rollback.

## Observaciones

Cambios solo-docs Cloudflare Access/Tunnel: diseño, no changelog de runtime.

**Última verificación UTC:** 2026-08-05T10:00Z
