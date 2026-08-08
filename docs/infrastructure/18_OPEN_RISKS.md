# 18 — Open Risks

## Resumen

Riesgos abiertos post-hardening 10x, backups 8L, pin Coolify 13.2B y swap FASE FINAL.

## Estado

Lista viva · priorizada.

**Última verificación UTC:** 2026-08-06T16:08Z

## Inventario

| ID | Riesgo | Prioridad | Impacto | Mitigación | Estado |
|---|---|---|---|---|---|
| R01 | Single VPS SPOF | P0 / Crítica | Outage total portal/Coolify | DR runbook · R2 · futuro HA | Abierto |
| R02 | Sin swap | — | OOM bajo picos | Swap 2G + swappiness=10 | **Mitigado** (FASE FINAL) |
| R03 | SSH :22 público | P1 / Alta | Brute/exploit surface | MFA + Access/bastion (10G.2/10C) | Abierto |
| R04 | Sin MFA SSH | P1 / Alta | Compromiso clave = full admin | 10G.3 TOTP argosadmin | Abierto (diseñado) |
| R05 | Coolify panel público 443 | P1 / Alta | Ataques auth UI | Cloudflare Access 10C.6 (diseño) | Abierto (diseñado) |
| R06 | Coolify `mc` S3 upload broken (IPv6) | P2 / Media | Flag `s3_uploaded` engañoso | rclone host + monitor R2 | **Mitigado** (residual reporting) |
| R07 | Staging Coolify backup schedule disabled | P2 / Media | Menos retención stg | Script encrypted diario activo | Abierto (parcialmente cubierto) |
| R08 | Auto-deploy staging ON | P2 / Media | Deploys inesperados | Política/watch_paths | Abierto |
| R09 | coolify:latest unpinned | — | Drift upgrades | `LATEST_IMAGE=4.2.0` + digest fijado | **Mitigado** (13.2B) |
| R09b | `UpdateCoolifyJob` diario aún programado | P2 / Media | Puede intentar update pese a pin | Vigilar logs; no desactivar sin auth | Abierto (residual) |
| R10 | Falta drill recuperación total servicio/VPS | P1 / Alta | RTO real no medido end-to-end | Drill autorizado post restore temporal | Abierto (restore temporal **ya validado**) |
| R11 | WordPress fuera de monitor VPS | P2 / Media | Marketing down sin alerta VPS | Monitor Hostinger/CF | Abierto |
| R12 | Capacidad 2 vCPU | P2 / Media | Saturación builds concurrentes | Serializar builds · upgrade | Abierto |
| R13 | NOPASSWD sudo argosadmin | P2 / Media | Lateral si clave admin | Password sudo o MFA | Abierto (revisión pendiente) |
| R14 | Documentos CF diseño ≠ reality | P3 / Baja | Decisiones erróneas | Leer `13_CLOUDFLARE.md` | Mitigado vía doc |
| R15 | Frontend Docker health none | P3 / Baja | Orquestación ciega | Healthcheck HTTP | Abierto |
| R16 | UX / SEO prod pendientes | P2 / Media | Calidad go-live comercial | Checklist SEO/perf | Abierto |
| R17 | Access / Tunnel no implementados | P1 / Alta | Sin Zero Trust en admin | 10C.5/10C.6 | Abierto (diseño) |

## Dependencias

Decisiones CAB · presupuesto Hostinger/CF.

## Riesgos

Lista incompleta si hay servicios no descubiertos — reportar hallazgos.

## Rollback

N/A.

## Observaciones

Actualizar este archivo en cada fase de hardening.

**Última verificación UTC:** 2026-08-06T16:08Z
