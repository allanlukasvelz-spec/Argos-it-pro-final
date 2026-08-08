# 02 — VPS

## Resumen

VPS Hostinger KVM 2 Ubuntu 24.04.4 LTS, único host de Coolify, portal, staging y PostgreSQL de aplicaciones.

## Estado

Operativo · uptime >4 días en verificación · filesystem rw · Docker healthy · swap activo.

**Última verificación UTC:** 2026-08-06T16:08Z

## Inventario

| Campo | Valor verificado |
|---|---|
| Proveedor | Hostinger VPS |
| Hostname | `srv1873313` |
| IP pública | `91.108.121.181` |
| Panel | `hpanel.hostinger.com` VPS id `1873313` (histórico) |
| Kernel | `6.8.0-134-generic` |
| OS | Ubuntu 24.04.4 LTS (noble) |
| CPU | 2 vCPU (`nproc=2`) |
| RAM | 7.8 GiB total · ~6.3 GiB available |
| Swap | **2.0 GiB** (`/swapfile`) · `vm.swappiness=10` · `vm.vfs_cache_pressure=50` |
| Disco | `/dev/sda1` ext4 96G · ~9.1G used · ~87G avail (10%; +2G swapfile) |
| Boot | `/boot` 881M · EFI 105M |

## Configuración — Paquetes relevantes

| Paquete | Versión |
|---|---|
| docker-ce | 5:29.7.1-1~ubuntu.24.04~noble |
| docker-compose-plugin | 5.3.1 |
| openssh-server | 1:9.6p1-3ubuntu13.18 |
| fail2ban | 1.0.2-3ubuntu0.1 |
| ufw | 0.36.2-6 |
| rclone | 1.60.1+dfsg-3ubuntu0.24.04.6 |
| unattended-upgrades | presente |

## Usuarios

| Usuario | UID | Shell | Notas |
|---|---|---|---|
| root | 0 | /bin/bash | SSH clave; Coolify key |
| argosadmin | 1000 | /bin/bash | sudo NOPASSWD (FASE 10F) |

Grupo `sudo`: `argosadmin`.

## SSH (efectivo)

| Parámetro | Valor |
|---|---|
| PermitRootLogin | without-password / prohibit-password |
| PasswordAuthentication | no |
| PubkeyAuthentication | yes |
| KbdInteractiveAuthentication | no |
| AllowUsers | root argosadmin |
| UsePAM | yes |
| MaxAuthTries | 6 |

Drop-ins: `00-argos-fase10g1-allowusers.conf`, `50-cloud-init.conf`, `99-argos-fase10e.conf`.

## Firewall (UFW)

Active · default deny incoming · allow outgoing.

| Regla | Acción |
|---|---|
| 22/tcp | ALLOW (v4/v6) SSH |
| 80/tcp | ALLOW (v4/v6) HTTP |
| 443/tcp | ALLOW (v4/v6) HTTPS |

Sin 6001/6002/8000/8080.

## Fail2Ban

Active · jail `sshd` · currently banned: 0 (en verificación).

## Cron (root)

```
15 2 * * * /root/argos-staging-ops/bin/pg-backup-encrypted.sh
*/5 * * * * /root/argos-staging-ops/bin/monitor-staging.sh
*/5 * * * * /root/argos-prod-ops/bin/monitor-production.sh
15 0 * * * /root/argos-prod-ops/bin/r2-offsite-sync.sh
```

## Logs

| Ruta | Uso |
|---|---|
| `/root/argos-prod-ops/logs/monitor-YYYYMMDD.log` | Monitor prod |
| `/root/argos-prod-ops/logs/alerts.log` | Alertas |
| `/root/argos-prod-ops/logs/r2-offsite-sync-*.log` | Sync R2 |
| journalctl -u ssh | SSH |
| /var/log/auth.log | Auth |

## Dependencias

Hostinger hardware · red pública · DNS.

## Riesgos

Swap 2G activo (FASE FINAL) · single node · root SSH aún permitido por clave (necesario Coolify). Rollback swap: `/root/argos-fase-final-cierre/SWAP_ROLLBACK.txt`.

## Rollback

Backups config en `/root/argos-fase*-rollback/`.

## Observaciones

No reinventar hostname corto vs FQDN `srv1873313.hstgr.cloud` — FQDN **NO VERIFICADO** en esta pasada.

**Última verificación UTC:** 2026-08-05T10:00Z
