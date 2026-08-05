# 14 — Secrets Reference

## Resumen

Inventario de **dónde viven** secretos. **Ningún valor secreto aparece en este documento.**

## Estado

Referencia operativa · rotación formal parcial.

**Última verificación UTC:** 2026-08-05T10:00Z

## Inventario

| Secreto / material | Dónde vive | Quién lo usa | Rotación |
|---|---|---|---|
| SSH host keys | `/etc/ssh/` | sshd | Solo si compromiso |
| authorized_keys root | `/root/.ssh/authorized_keys` | Operador + Coolify | Sustituir línea clave |
| authorized_keys argosadmin | `/home/argosadmin/.ssh/` | Operador | Sustituir línea |
| rclone R2 config | `/root/argos-prod-ops/keys/rclone-r2.conf` | r2-offsite-sync | Regenerar token R2 + actualizar conf |
| ntfy topic | `/root/argos-prod-ops/keys/ntfy-topic` | monitor | Cambiar topic + actualizar file |
| Coolify `.env` | `/data/coolify/source/.env` (típico) | coolify container | Backup + rotate APP_KEY con procedimiento Coolify |
| Coolify DB password | Coolify env / compose | coolify-db | Coolify docs |
| App env (JWT, DATABASE_URL, OPENAI, CORS, etc.) | Coolify application env | API/Web containers | Coolify UI → redeploy |
| R2 access keys (Coolify storage) | Coolify S3 storage config | Coolify backup jobs / mc | Coolify UI |
| GitHub App credentials | Coolify + GitHub | deploys | Reinstall app |
| TLS certs | Traefik ACME storage bajo `/data/coolify/proxy` | Traefik | Auto LE renew |
| sudoers argosadmin | `/etc/sudoers.d/99-argos-fase10f-argosadmin` | argosadmin | Revisar NOPASSWD policy |
| WordPress / MySQL Hostinger | hPanel | WP | Fuera de VPS |
| Staging backup encryption key | `/root/argos-staging-ops/` (**ruta exacta key file NO VERIFICADA**) | pg-backup-encrypted | Rotar + re-encrypt |

## Configuración

Principio: secretos **fuera de Git**. Repo solo `.env.example`.

## Dependencias

Acceso root/argosadmin · Coolify admin · Cloudflare account · Hostinger.

## Riesgos

NOPASSWD sudo · Coolify APP_KEY en env container inspectable por root · historial chat/agentes puede haber expuesto metadatos.

## Rollback

Backups fase en `/root/argos-fase*-rollback/` no incluyen secretos de app (salvo configs ssh).

## Observaciones

Si se sospecha fuga: rotar JWT, DB passwords, R2 keys, SSH keys, ntfy topic, Coolify session secrets — con ventana de mantenimiento autorizada.

**Última verificación UTC:** 2026-08-05T10:00Z
