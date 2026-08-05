# 05 — Applications

## Resumen

Aplicaciones públicas: portal/API producción, staging, WordPress marketing, panel Coolify.

## Estado

Todos los endpoints HTTP verificados 200 (www 301) en 2026-08-05.

**Última verificación UTC:** 2026-08-05T10:00Z

## Inventario

| App | URL | Contenedor / host | Puerto interno | Health |
|---|---|---|---|---|
| Portal prod | https://portal.argos-it.com/ | `rpp5o3j1lvbbq1wjleaqyu91-…` | 3000 | HTTP 200 |
| API prod | https://api.portal.argos-it.com/api/health | `ufcwdojnv5wajhllw0df7olg-…` | 4000 | 200 + Docker healthy |
| Staging web | https://staging.argos-it.com/ | `r5rn3xgjxyln22k18pwa2a98-…` | 3000 | HTTP 200 |
| Staging API | https://api-staging.argos-it.com/api/health | `i121mjb3zyjekyn3nuqgeqfr-…` | 4000 | 200 + healthy |
| Coolify | https://coolify.argos-it.com/login | coolify vía Traefik | 8000 interno | 200 |
| WordPress | https://argos-it.com/ | Hostinger (no VPS) | N/A | 200 |
| WordPress www | https://www.argos-it.com/ | CDN/hostinger | N/A | 301 |

## Configuración

### Producción

| Campo | Valor |
|---|---|
| Rama | `deploy/production-v1` |
| Commit imagen | `651deb54e543748e990ca28f427cbfe2ca6fbccc` |
| Auto-deploy | OFF |
| PG | `iw42qpqc1w1umsddrl9fwpi9` |

### Staging

| Campo | Valor |
|---|---|
| Rama | `deploy/staging-readiness` |
| Commits imagen | API `59dcd7d6…` · Web `971de796…` |
| Auto-deploy | ON |
| PG | `e52no3cf4ai3k6vk28hz0hk9` |

### Variables

Secretos en Coolify — ver `14_SECRETS_REFERENCE.md`. No se listan valores. Conteos env: API prod 24 · Web prod 13.

## Dependencias

Traefik TLS · PostgreSQL · (opcional) OpenAI · JWT · CORS · Formspree (contacto) — detalle código en repo.

## Riesgos

Web Docker health `none` · auto-deploy staging · WordPress fuera de este CMDB operativo VPS.

## Rollback

Redeploy commit anterior en Coolify · no force-push · DR runbook.

## Observaciones

DNS apex/www: IPs Hostinger (`84.32.84.19`, `2.57.91.50`, CDN `hstgr.net`) — **no** el VPS.

**Última verificación UTC:** 2026-08-05T10:00Z
