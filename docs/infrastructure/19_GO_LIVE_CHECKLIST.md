# 19 — Go-Live Checklist

## Resumen

Checklist consolidado de preparación go-live / auditoría producción portal.

## Estado

Portal en producción operativa · varios ítems seguridad/DR aún abiertos.

**Última verificación UTC:** 2026-08-05T10:00Z

## Infraestructura

- [x] VPS Ubuntu 24.04 operativo
- [x] Docker + Coolify + Traefik
- [x] DNS portal/api/coolify/staging → VPS
- [x] TLS HTTPS 200
- [x] PG prod healthy
- [ ] HA / multi-AZ — **No**
- [ ] Swap — **No**

## Seguridad

- [x] UFW 22/80/443 only
- [x] Puertos Coolify legacy cerrados
- [x] SSH password off
- [x] AllowUsers
- [x] Fail2Ban
- [ ] MFA SSH
- [ ] Cloudflare Access Coolify
- [ ] Bastion / :22 restringido

## Backups

- [x] Schedule Coolify daily prod
- [x] Offsite R2 vía rclone
- [x] Monitor offsite age
- [x] Restore temporal validado (dump custom / SHA256 / pg_restore / DB temp / cleanup)
- [ ] Drill recuperación total servicio/VPS

## DR

- [x] Runbook v1.0 en repo
- [x] Restore temporal documentado
- [ ] Owners/approvers nombrados (PENDIENTE en runbook)
- [ ] Dual-auth ensayo (cutover prod)

## Aplicación

- [x] Portal 200
- [x] API health 200
- [x] Auto-deploy prod OFF
- [ ] SEO prod checklist firmado — **PENDIENTE DE VALIDACIÓN** (UX/SEO)
- [ ] Performance budget — **PENDIENTE DE VALIDACIÓN**

## Cloudflare

- [x] R2 backups
- [ ] Access — **diseño únicamente** (no implementado)
- [ ] Tunnel — **No**
- [ ] Observability — needsAuth / no autorizado
- [ ] Orange-cloud portal — **No** (DNS autoritativo Hostinger)

## Dominio / WordPress

- [x] Apex/www responden
- [ ] Integrado en mismo monitor — **No**

## Monitorización

- [x] monitor-production */5
- [x] ntfy topic file presente
- [ ] On-call rota formal — **PENDIENTE**

## Dependencias

Ver docs 01–16.

## Riesgos

Ver `18_OPEN_RISKS.md`.

## Rollback

Plan deploy Coolify + DR DB.

## Observaciones

Go-live **funcional** ya ocurrió; checklist sirve para **aceptación hardening/compliance**.

**Última verificación UTC:** 2026-08-05T10:00Z
