# 03 — Docker

## Resumen

Docker Engine 29.7.1 orquesta Coolify y todas las aplicaciones ARGOS-IT en el VPS.

## Estado

Daemon OK · 12 contenedores en ejecución en verificación.

**Última verificación UTC:** 2026-08-05T10:00Z

## Inventario — Contenedores

| Nombre | Imagen | Restart | Health | Puertos host |
|---|---|---|---|---|
| coolify-proxy | traefik:v3.6 | unless-stopped | healthy | 80,443 tcp/udp |
| coolify | coollabsio/coolify:latest (~4.2.0) | always | healthy | (interno) 8000/8080/8443/9000 — **sin publish host** |
| coolify-db | postgres:15-alpine | always | healthy | 5432 interno |
| coolify-redis | redis:7-alpine | always | healthy | 6379 interno |
| coolify-realtime | coollabsio/coolify-realtime:1.0.16 | always | healthy | 6001/tcp (sin publish host) |
| coolify-sentinel | coollabsio/sentinel:0.0.21 | no | healthy | — |
| ufcwdoj… (API prod) | …:651deb54… | unless-stopped | healthy | 4000 interno |
| rpp5o3… (Web prod) | …:651deb54… | unless-stopped | none | 3000 interno |
| iw42qp… (PG prod) | postgres:16-alpine | unless-stopped | healthy | 5432 interno |
| i121mj… (API stg) | …:59dcd7d6… | unless-stopped | healthy | 4000 interno |
| r5rn3x… (Web stg) | …:971de796… | unless-stopped | none | 3000 interno |
| e52no3… (PG stg) | postgres:16-alpine | unless-stopped | healthy | 5432 interno |

## Digests (parcial)

| Imagen | Digest / Image ID |
|---|---|
| traefik:v3.6 | sha256:8ffcb1b31207… |
| coolify:latest (~4.2.0) | sha256:b8aea35f4113e54c38be3e88f842e09856aebcf92bd3e264b06c567c99ed4921 |
| coolify-realtime:1.0.16 | sha256:b5bb9d1c95d9… |
| postgres:16-alpine | sha256:57c72fd2a128… |
| postgres:15-alpine | sha256:3d0f7584ed7d… |
| redis:7-alpine | sha256:e7723ff73d96… |
| API prod 651deb54 | sha256:2bda1de99738… |
| Web prod 651deb54 | sha256:9e06a7281fcc… |

## Networks

| Network | Driver |
|---|---|
| coolify | bridge |
| bridge | bridge (default) |
| host / none | built-in |

## Volumes

| Volume | Uso |
|---|---|
| coolify-db | Coolify PostgreSQL 15 |
| coolify-redis | Coolify Redis |
| postgres-data-iw42qpqc1w1umsddrl9fwpi9 | PG producción |
| postgres-data-e52no3cf4ai3k6vk28hz0hk9 | PG staging |

## Bind mounts (conocidos)

| Contenedor | Mount |
|---|---|
| coolify-realtime | `/data/coolify/ssh` → storage SSH |
| coolify-proxy | `/data/coolify/proxy` compose |

Otros binds Coolify: **PENDIENTE DE VALIDACIÓN** (inspección exhaustiva no listada).

## Healthchecks

Presentes en: coolify, coolify-proxy, coolify-db, coolify-redis, coolify-realtime, coolify-sentinel, APIs, PGs.  
Web frontend Coolify: health Docker = `none` (HTTP vía Traefik verificado 200).

## Dependencias

Docker CE · overlay2 · red `coolify` · Traefik labels.

## Riesgos

Tag `coolify:latest` sin pin (app ~4.2.0; digest conocido) · imágenes app antiguas (`7be6f06`) aún en host · sentinel restart `no`.

## Rollback

Imágenes previas retenidas localmente (`7be6f06` tags presentes). Compose backups en `/root/argos-prod-ops/backups/` y fase rollbacks.

## Observaciones

No se listan todos los labels Traefik por volumen; ver app en Coolify UI / `docker inspect`.

**Última verificación UTC:** 2026-08-05T10:00Z
