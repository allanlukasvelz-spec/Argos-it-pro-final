# 18 — Open Risks

## Resumen

Riesgos abiertos post-hardening 10x y backups 8L.

## Estado

Lista viva · priorizada.

**Última verificación UTC:** 2026-08-05T10:00Z

## Inventario

| ID | Riesgo | Prioridad | Impacto | Mitigación | Estado |
|---|---|---|---|---|---|
| R01 | Single VPS SPOF | Crítica | Outage total portal/Coolify | DR runbook · R2 · futuro HA | Abierto |
| R02 | Sin swap | Alta | OOM bajo picos | Añadir swap controlado | Abierto |
| R03 | SSH :22 público | Alta | Brute/exploit surface | MFA + Access/bastion (10G.2/10C) | Abierto |
| R04 | Sin MFA SSH | Alta | Compromiso clave = full admin | 10G.3 TOTP argosadmin | Abierto (diseñado) |
| R05 | Coolify panel público 443 | Alta | Ataques auth UI | Cloudflare Access 10C.6 (diseño) | Abierto (diseñado) |
| R06 | Coolify `mc` S3 upload broken (IPv6) | Media | Flag `s3_uploaded` engañoso | rclone host + monitor R2 | **Mitigado** (residual reporting) |
| R07 | Staging Coolify backup schedule disabled | Media | Menos retención stg | Habilitar o fiar script encrypted | Abierto |
| R08 | Auto-deploy staging ON | Media | Deploys inesperados | Política/watch_paths | Abierto |
| R09 | coolify:latest unpinned (~4.2.0) | Media | Drift upgrades | Pin digest | Abierto |
| R10 | Falta drill recuperación total servicio/VPS | Alta | RTO real no medido end-to-end | Drill autorizado post restore temporal | Abierto (restore temporal **ya validado**) |
| R11 | WordPress fuera de monitor VPS | Media | Marketing down sin alerta VPS | Monitor Hostinger/CF | Abierto |
| R12 | Capacidad 2 vCPU | Media | Saturación builds concurrentes | Serializar builds · upgrade | Abierto |
| R13 | NOPASSWD sudo argosadmin | Media | Lateral si clave admin | Password sudo o MFA | Abierto (revisión pendiente) |
| R14 | Documentos CF diseño ≠ reality | Baja | Decisiones erróneas | Leer `13_CLOUDFLARE.md` | Mitigado vía doc |
| R15 | Frontend Docker health none | Baja | Orquestación ciega | Healthcheck HTTP | Abierto |
| R16 | UX / SEO prod pendientes | Media | Calidad go-live comercial | Checklist SEO/perf | Abierto |
| R17 | Access / Tunnel no implementados | Alta | Sin Zero Trust en admin | 10C.5/10C.6 | Abierto (diseño) |

## Dependencias

Decisiones CAB · presupuesto Hostinger/CF.

## Riesgos

Lista incompleta si hay servicios no descubiertos — reportar hallazgos.

## Rollback

N/A.

## Observaciones

Actualizar este archivo en cada fase de hardening.

**Última verificación UTC:** 2026-08-05T10:00Z
