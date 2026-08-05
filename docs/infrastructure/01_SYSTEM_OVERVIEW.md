# 01 — System Overview

## Resumen

Inventario maestro de la arquitectura ARGOS-IT en producción y staging sobre un único VPS Hostinger, orquestado por Coolify 4.x + Traefik, con WordPress en hosting separado y backups offsite en Cloudflare R2.

## Estado

| Ámbito | Estado |
|---|---|
| Portal producción | Operativo (HTTP 200) |
| API producción | Operativo / healthy |
| Staging | Operativo |
| Coolify panel | Operativo HTTPS |
| WordPress apex/www | Operativo (hosting distinto) |
| Documentación FASE 11 | Generada |

**Última verificación UTC:** 2026-08-05T10:00Z

## Inventario — Mapa lógico

```
Internet
  │
  ├─ DNS Hostinger (apex/www → WordPress Hostinger)
  │     argos-it.com / www.argos-it.com
  │
  └─ DNS A → VPS 91.108.121.181
        ├─ coolify.argos-it.com
        ├─ portal.argos-it.com
        ├─ api.portal.argos-it.com
        ├─ staging.argos-it.com
        └─ api-staging.argos-it.com
              │
              ▼
        Traefik v3.6 (coolify-proxy) :80/:443
              │
    ┌─────────┼──────────────┐
    ▼         ▼              ▼
 Coolify   Portal FE      Staging FE
 panel     + API + PG     + API + PG
```

## Inventario — Mapa físico

| Capa | Ubicación |
|---|---|
| Compute | Hostinger VPS `91.108.121.181` (`srv1873313`) — KVM 2 |
| Control plane | Coolify containers en `/data/coolify` |
| Apps | Contenedores Docker en red `coolify` |
| WordPress | Hostinger web hosting (IPs públicas distintas al VPS) |
| Offsite backups | Cloudflare R2 `argos-it-production-backups` |
| Ops scripts | `/root/argos-prod-ops/`, `/root/argos-staging-ops/` |
| Código | GitHub `allanlukasvelz-spec/Argos-it-pro-final` |

## Diagrama ASCII

```
┌─────────────────────────────────────────────────────────────┐
│  VPS Ubuntu 24.04 · 2 vCPU · 7.8 GiB RAM · 96G disk        │
│  UFW: 22,80,443 · Fail2Ban · SSH key-only                   │
│                                                             │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │coolify-proxy│  │ coolify  │  │ coolify-db/redis/rt/sen│ │
│  │ Traefik 3.6 │  │ ~4.2.0   │  │ PG15 / Redis7 / Soketi │ │
│  └──────┬──────┘  └──────────┘  └────────────────────────┘ │
│         │                                                   │
│  ┌──────┴───────────────────────────────────────────────┐  │
│  │ PROD: web:rpp5… api:ufcw… pg:iw42…                   │  │
│  │ STG:  web:r5rn… api:i121… pg:e52n…                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Cron: monitor */5 · r2-sync 00:15 · staging backup/monitor│
└─────────────────────────────────────────────────────────────┘
         │ rclone                          │
         ▼                                 ▼
   Cloudflare R2                    ntfy alerts (topic file)
```

## Componentes

| Componente | Rol |
|---|---|
| Coolify | Orquestación apps/DB/proxy/backups |
| Traefik | Ingress TLS HTTP/HTTPS |
| Portal Next.js | Frontend producción |
| API Express | Backend producción |
| PostgreSQL 16 | Datos portal (prod + staging) |
| WordPress | Sitio marketing apex/www |
| R2 + rclone | Offsite dumps |
| Monitor shell | Salud + alertas |

## Flujos

1. **HTTP público:** DNS → Traefik → contenedor app (labels Coolify).
2. **Deploy:** GitHub → Coolify GitHub App → build Dockerfile → restart container (prod auto-deploy OFF).
3. **Backup prod:** Coolify schedule 00:00 UTC dump local → rclone host 00:15 UTC → R2.
4. **Monitor:** cada 5 min checks HTTP/Docker/R2 → log + ntfy.

## Dependencias

- VPS Hostinger (único SPOF compute para portal/Coolify).
- DNS Hostinger para subdominios VPS.
- Cloudflare R2 para offsite (API tokens en host).
- GitHub App Coolify para builds.
- WordPress **independiente** del VPS.

## Riesgos

- Un solo VPS sin HA.
- Sin swap.
- Coolify image tag `latest` (app efectiva ~4.2.0; pin pendiente).
- Upload nativo Coolify (`mc`) falla por IPv6/AAAA; offsite operativo vía rclone (FASE 8L).
- MFA SSH no implementado (diseño 10G.2).
- Restore temporal PG validado; falta drill de recuperación total servicio/VPS.

## Rollback

N/A (documento). Operación: ver `15_DISASTER_RECOVERY.md` y `docs/PRODUCTION_DR_RUNBOOK.md`.

## Observaciones

WordPress y correo **no** corren en este VPS. Cloudflare Access/Tunnel están en **diseño**, no implementados.

**Última verificación UTC:** 2026-08-05T10:00Z
