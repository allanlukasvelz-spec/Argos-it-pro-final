# 15 — Disaster Recovery

> **Vigencia — 2026-10-16.** Este archivo conserva el registro de agosto de 2026. No describe el estado verificado el 2026-10-16 y V7.24 no ha reobservado la infraestructura. Coolify como sistema vigente: no verificado. WordPress como tecnología actual del apex: no confirmado; el 2026-10-14 el apex respondió como Next.js en `31.97.52.181`, sin que eso demuestre su retirada de todos los servidores. SHA desplegado, copias de producción y rollback: desconocidos o bloqueados. Clasificación: [ARCHITECTURE_CURRENT_STATUS.md](../ARCHITECTURE_CURRENT_STATUS.md).


## Resumen

Runbook operativo autoritativo detallado: `docs/PRODUCTION_DR_RUNBOOK.md` (v1.0). Este archivo resume CMDB + punteros.

## Estado

Documentado · RPO/RTO recomendados (no SLA) · **restore temporal validado** (dump custom, SHA256, `pg_restore -l`, DB temporal, schema OK, prod intacta, DB temporal eliminada) · falta drill operativo completo de recuperación total del servicio/VPS.

**Última verificación UTC:** 2026-08-05T10:00Z

## Inventario — Objetivos

| Métrica | Valor recomendado |
|---|---|
| RPO | 24 h (backup daily 00:00 UTC) |
| RTO | 2–4 h recuperación operativa inicial |
| Offsite | R2 `argos-it-production-backups` |
| Auth restore prod | Dual (Incident Commander + DBA) |

## Restore temporal — evidencia validada

| Check | Resultado |
|---|---|
| Backup PostgreSQL custom | Válido |
| SHA256 | Verificado |
| `pg_restore -l` | PASS |
| Restore DB temporal | PASS |
| Tablas / índices / PK / FK | 12 / 28 / 12 / 12 |
| UNIQUE / CHECK / secuencias | 3 / 1 / 12 |
| users | 0 |
| Exit code | 0 |
| DB temporal | Eliminada tras prueba |
| Producción | Intacta |

## Orden de recuperación (alto nivel)

1. Clasificar SEV (`PRODUCTION_DR_RUNBOOK` §10).
2. Autorización matriz §12.
3. Diagnóstico solo lectura.
4. Según caso:
   - **App only:** redeploy Coolify commit conocido bueno.
   - **DB:** restore a DB temporal → validar → cutover autorizado.
   - **VPS loss:** reprovision Hostinger → Coolify → restore dumps R2 → DNS.
5. Validación HTTP health + login + monitor.
6. Evidence matrix + postmortem.

## Checklist mínimo

- [x] Restore test DB temporal (validado; ver tabla anterior)
- [ ] Confirmar alcance (prod vs staging vs WP)
- [ ] Congelar deploys
- [ ] Localizar dump R2 + SHA/size
- [ ] Dual auth registrada (cutover prod)
- [ ] Validar portal/API 200 post-recuperación
- [ ] Monitor verde
- [ ] Comunicación stakeholders
- [ ] Drill recuperación total servicio/VPS

## Dependencias

R2 · dumps locales · Coolify · DNS Hostinger · SSH admin · runbook.

## Riesgos

Single VPS · `mc` upload flaky (offsite mitiga con rclone) · falta drill de recuperación total servicio/VPS · WordPress fuera de alcance.

## Rollback

Cualquier restore fallido: no cutover · mantener primary · documentar.

## Observaciones

No ejecutar restore/cutover desde este documento sin autorización explícita. Restore temporal ≠ recuperación total del servicio.

**Última verificación UTC:** 2026-08-05T10:00Z
