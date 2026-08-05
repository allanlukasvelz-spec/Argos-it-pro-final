# 13 — Cloudflare (estado ACTUAL implementado)

## Resumen

**Solo lo implementado.** Diseños Access/Tunnel/DNS migration existen en `docs/CLOUDFLARE_*.md` pero **no** están activos como control plane.

## Estado

R2 en uso operativo. Access: **diseño únicamente**. Tunnel: **no implementado**. Workers: **no implementados**. Observability: **needsAuth / no autorizado**. DNS autoritativo: **Hostinger**.

**Última verificación UTC:** 2026-08-05T10:00Z

## Inventario — Implementado

| Servicio | Estado actual |
|---|---|
| **R2** | Bucket `argos-it-production-backups` con 4 dumps · staging bucket registrado en Coolify |
| DNS authoritative Cloudflare | **NO** — DNS apex/www/resolución vía Hostinger / hstgr |
| Cloudflare proxy (orange cloud) en portal | **NO** (A records apuntan IP VPS directa en dig 1.1.1.1) |
| Access | **NO implementado** (solo diseño 10C.6) |
| Tunnel / cloudflared | **NO implementado** (diseño 10C.5) |
| Workers | **NO implementado** |
| Observability (CF) | **needsAuth / no autorizado** |

## DNS (evidencia pública dig)

| Nombre | Resultado |
|---|---|
| portal.argos-it.com | A `91.108.121.181` |
| api.portal.argos-it.com | A `91.108.121.181` |
| coolify.argos-it.com | A `91.108.121.181` |
| argos-it.com | A Hostinger (`84.32.84.19`, `2.57.91.50`) |
| www.argos-it.com | CNAME `www.argos-it.com.cdn.hstgr.net.` + IPs Hostinger |

## Dependencias

Cuenta Cloudflare para R2 · tokens en host rclone.

## Riesgos

Confundir documentos de diseño con estado real · Access no protege Coolify aún.

## Rollback

N/A.

## Observaciones

Cualquier afirmación de “Cloudflare delante de Coolify” es **falsa hoy**; solo R2.

**Última verificación UTC:** 2026-08-05T10:00Z
