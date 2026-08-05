# 10 — Security

## Resumen

Hardening progresivo FASE 10: superficie pública reducida a 22/80/443; SSH key-only + AllowUsers; Fail2Ban activo.

## Estado

Postura mejorada vs baseline inicial · MFA SSH no implementado · Cloudflare Access no implementado.

**Última verificación UTC:** 2026-08-05T10:00Z

## Inventario — Controles aplicados

| Control | Estado |
|---|---|
| UFW deny default | Sí — allow 22/80/443 |
| Cierre 8000/8080/6001/6002 host | Sí (10D) |
| PasswordAuthentication | no (10E) |
| Usuario `argosadmin` + sudo | Sí (10F) |
| PermitRootLogin | prohibit-password (10F) |
| AllowUsers root argosadmin | Sí (10G.1) |
| Fail2Ban sshd | Activo |
| Auto-deploy prod | OFF |
| Backups offsite R2 | Operativo (8L) |
| Traefik TLS LE | Operativo (histórico) |

## SSH efectivo

| Parámetro | Valor |
|---|---|
| PasswordAuthentication | no |
| PubkeyAuthentication | yes |
| PermitRootLogin | without-password |
| AllowUsers | root, argosadmin |
| KbdInteractiveAuthentication | no |
| MFA | **No** |

## Puertos públicos

22 · 80 · 443 (y 443/udp Traefik). Resto cerrado.

## Hardening pendiente

| Ítem | Prioridad |
|---|---|
| MFA SSH (TOTP argosadmin) | Alta (diseño 10G.2) |
| Cloudflare Access Coolify | Alta (diseño 10C.6; no implementado) |
| Cerrar/restringir :22 vía bastion | Alta tras Access |
| Swap / capacidad | Media |
| Pin Coolify image digest (~4.2.0 / latest) | Media |
| Rotación secretos documentada | Media |
| Drill recuperación total servicio/VPS | Alta (restore temporal ya validado) |
| MFA / 2FA Coolify UI | **PENDIENTE DE VALIDACIÓN** |
| UX / SEO prod | Media (pendiente) |

## Riesgos

Root SSH por clave (Coolify) · panel Coolify en Internet · sin MFA · single VPS · WordPress superficie separada no auditada aquí.

## Rollback

`/root/argos-fase10e-rollback/` · `10f` · `10g1` · `10d4`.

## Observaciones

No listar fingerprints completos de claves privadas. Fingerprints públicos root documentados en fases 10E/F.

**Última verificación UTC:** 2026-08-05T10:00Z
