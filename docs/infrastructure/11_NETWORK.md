# 11 — Network

## Resumen

Ingress público vía Traefik en 80/443; apps solo en red Docker; UFW restringe host.

## Estado

Listeners públicos: 22 (sshd), 80/443 (docker-proxy Traefik). Sin 6001/6002/8000/8080 en host.

**Última verificación UTC:** 2026-08-05T10:00Z

## Inventario — Puertos

| Puerto | Proceso | Exposición |
|---|---|---|
| 22/tcp | sshd | Público (UFW allow) |
| 80/tcp | docker-proxy → Traefik | Público |
| 443/tcp+udp | docker-proxy → Traefik | Público |
| 3000/4000/5432 | apps/PG | Solo Docker |
| 6001 | coolify-realtime | Solo Docker |
| 8000 | coolify | Solo Docker (publicado históricamente, cerrado) |

## Docker networking

| Network | Uso |
|---|---|
| coolify | Bridge principal apps/Coolify |
| bridge | Default Docker |

NAT: Docker iptables masquerade estándar — detalle reglas: **NO VERIFICADO** exhaustivo.

## UFW

Active · deny incoming · allow 22/80/443 v4+v6.

## Traefik / TLS

| Campo | Valor |
|---|---|
| Imagen | traefik:v3.6 |
| Compose | `/data/coolify/proxy/docker-compose.yml` |
| HTTP | :80 (redirect/ACME típico Coolify) |
| HTTPS | :443 |
| Certificados | Let's Encrypt vía Traefik (histórico verificado) |

## Dependencias

DNS A records → 91.108.121.181 para subdominios VPS.

## Riesgos

SSH público · sin Cloudflare proxy/Tunnel · WordPress DNS externo.

## Rollback

Backups proxy compose en `/root/argos-prod-ops/backups/`.

## Observaciones

iptables full dump no archivado en esta fase.

**Última verificación UTC:** 2026-08-05T10:00Z
