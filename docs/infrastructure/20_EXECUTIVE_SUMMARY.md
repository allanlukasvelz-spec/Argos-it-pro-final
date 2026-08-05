# 20 — Executive Summary

## Resumen

ARGOS-IT opera un portal full-stack (Next.js + Express + PostgreSQL) en un VPS Hostinger con Coolify (~4.2.0), separado del WordPress marketing. Hardening de puertos y SSH avanzado; backups offsite operativos vía rclone→R2; restore temporal PG validado; MFA y Zero Trust pendientes.

## Estado del proyecto

| Área | % estimado | Notas |
|---|---|---|
| Aplicación prod usable | ~90% | HTTP OK · features negocio aparte |
| Infraestructura base | ~85% | Coolify/Traefik/PG OK |
| Backups / offsite | ~85% | R2 OK vía rclone · `mc` residual |
| Seguridad host | ~70% | 10D–10G.1 hechos · MFA/Access no |
| Observabilidad | ~60% | Scripts ntfy · sin APM |
| DR readiness | ~70% | Restore temporal validado · falta drill total servicio/VPS |
| Cloudflare Zero Trust | ~15% | Solo R2 real |
| Documentación CMDB | ~95% | FASE 11 + 11.1 |

**Completitud global infra (juicio):** **~75%** hacia postura “production hardened + DR parcialmente probado”.

## Arquitectura (una frase)

Un VPS Ubuntu corre Coolify+Traefik y hospeda portal/API/PG prod+staging; WordPress vive en Hostinger web; dumps salen a Cloudflare R2 vía rclone.

## Riesgos principales

1. SPOF VPS  
2. SSH `:22` / Coolify sin MFA/Access  
3. Falta drill de recuperación total servicio/VPS (restore temporal ya OK)  
4. Capacidad 2 vCPU / sin swap  
5. `coolify:latest` sin pin  

## Recomendaciones

1. Autorizar **10G.3** TOTP en `argosadmin`.  
2. Implementar **Cloudflare Access** (diseño 10C.6) + plan cierre exposición — **solo tras autorización**.  
3. Drill recuperación total servicio/VPS (post restore temporal ya hecho).  
4. Añadir swap y pin de digest Coolify.  
5. Nombrar owners en DR runbook.  
6. Cerrar pendientes UX/SEO comerciales.  

## Dependencias

Hostinger · Cloudflare R2 · GitHub · DNS Hostinger.

## Riesgos

Porcentajes son estimaciones de gestión, no métricas instrumentadas.

## Rollback

N/A documento.

## Observaciones

Fuente de verdad runtime: VPS + Coolify DB. Diseños en `docs/CLOUDFLARE_*.md` no implican implementación.

**Última verificación UTC:** 2026-08-05T10:00Z
