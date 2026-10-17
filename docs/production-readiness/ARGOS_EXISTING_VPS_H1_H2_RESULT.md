# ARGOS — Existing VPS H1–H2 Result

```
GATE                          = EXISTING_VPS_H1_H2
DATE                          = 2026-08-26
HUMAN_AUTHORIZATION           = YES
ARGOS_DEPLOYED                = NO
UDIC_CHANGED                  = NO
PRODUCTION_CHANGED            = NO
SSH_ACCESS_RESTORED           = YES
VERIFIED_SECOND_SESSION       = YES (key-only BatchMode)
FIREWALL_CHANGES_APPLIED      = NO (no passwordless sudo; deferred)
SSHD_CONFIG_CHANGED           = NO (zero-lockout + no sudo)
PASSWORD_IN_DOCS              = NO
```

## H1 — SSH access

| Item | Result |
|------|--------|
| Public key fingerprint verified locally | `SHA256:v8piXPK8pNuYe+VWj9Q1ex+S+yGkAzzL98J6f5qWGsg` MATCH |
| Password login (operator-provided, not stored in repo) | SUCCESS as `udic` @ port **2220** |
| Authorized key install | Additive; key already present → **KEY_ALREADY_PRESENT** |
| Second session key-only | **SECOND_SESSION_OK** |
| Operator user | `udic` (uid 10062, home `/var/www/vhosts/udic.es`, group `psacln`) |
| sudo | Password required — **no passwordless sudo** |
| Hostinger API OAuth for VPS keys | 401 Unauthenticated (MCP token ≠ VPS API) |

### SSH posture (observed)

| Setting | Value |
|---------|-------|
| SSH_PORT | **2220** (`sshd` listening; port 22 closed externally) |
| Process | OpenSSH (`sshd.service` active); also `plesk-ssh-terminal` |
| root sessions | Multiple long-lived `sshd: root@pts/*` observed |
| PasswordAuthentication | Still offered by protocol (not disabled) |
| PubkeyAuthentication | Works for `udic` |
| PermitRootLogin / MaxAuthTries / AllowUsers | **UNKNOWN** (`/etc/ssh/sshd_config` not readable by `udic`) |
| fail2ban | **active** |

### H1 hardening applied

| Change | Status |
|--------|--------|
| Verify + use operator pubkey | DONE |
| Disable password auth | **DEFERRED** (needs root; lockout risk; keep console recovery) |
| Disable root login | **DEFERRED** (root sessions in use; needs controlled plan) |
| Change SSH port | **NOT DONE** (forbidden until identified; 2220 is intentional) |

## H2 — Firewall / exposure

| Layer | Result |
|-------|--------|
| Hostinger panel rules | Still “0” previously reported — meaning UNKNOWN |
| firewalld | **active** (service); rule dump needs sudo → **UNKNOWN detail** |
| ufw | Not usable without sudo |
| nft/iptables | Not readable without sudo |
| Plesk firewall | UNKNOWN ownership without root |
| Effective exposure (from `ss`) | See ports below |

### Ports (live)

| Port | Bind | Classification |
|------|------|----------------|
| 2220 | 0.0.0.0 | SSH — PUBLIC_REQUIRED (admin) |
| 22 | none | CLOSED |
| 80/443 | nginx on public IP | PUBLIC_REQUIRED |
| 8443 | 0.0.0.0 — `sw-cp-server` (Plesk) | REQUIRED (panel) / RESTRICTABLE ideally |
| 8880 | 0.0.0.0 — Plesk http | REQUIRED/RESTRICTABLE |
| 7080/7081 | * — Apache/nginx proxy chain | Plesk internal edge |
| 25/465/587/110/143/993/995/4190 | mail stack | REQUIRED for hosted mail |
| 21 | FTP | RESTRICTABLE / unexpected for Argos |
| 53 | named (DNS) | Hosted DNS |
| 3306 | 127.0.0.1 only | PRIVATE (MariaDB) |
| 5432 | none | PRIVATE / absent |
| 9000/9001 | none | PRIVATE / absent |
| 3000/4000 | none | absent |

### H2 changes applied

**NONE.** Closing or restricting ports without root sudo and without full Plesk/mail inventory would risk UDIC and ~60 other vhosts.

## Live resource baseline (critical)

| Metric | Observed |
|--------|----------|
| Declared by human (prior) | Ubuntu 24.04, 100 GB, ~9 GB used |
| **Actual** | **AlmaLinux 8.10**, kernel 4.18, KVM |
| CPU | 2 vCPU |
| Load average | **11.21 / 7.20 / 4.54** (severe overload for 2 cores) |
| RAM | 7.6 Gi total; ~3.2 Gi available; **swap = 0** |
| Disk | **/dev/vda3 454G, 433G used, 22G free (96%)** |
| Inodes | ~5% used on `/` |
| Docker | **NOT INSTALLED** |
| Uptime | ~70 days |

Top CPU at sample: `php-fpm`, `pzstd` (mail compress), `php-cgi`, `mysqld`.

## Workloads

| Item | Finding |
|------|---------|
| Plesk | Obsidian **18.0.80.4** |
| Web | nginx + httpd active |
| DB | MariaDB 10.3 (localhost) |
| Mail | postfix, dovecot, pc-remote |
| Domains under `/var/www/vhosts` | **65** entries including **udic.es** and many unrelated customer sites |
| Argos | Not present |
| External checks | `udic.es` HTTPS 200; `staging2.udic.es` HTTPS 200 |

## Compatibility impact (post H1–H2)

| Question | Answer |
|----------|--------|
| CAN_PROCEED_TO_ARGOS_DEPLOYMENT | **NO** |
| SHARED_HOST_RISK | **HIGH** (multi-tenant Plesk + mail + disk/load critical) |
| NEW_VPS_REQUIRED | **REVIEW_REQUIRED** → strongly recommended **YES** for Argos staging |
| Capacity for Chromium/MinIO/PG | **INSUFFICIENT** on current headroom |

Reasons for NO:

1. Disk **96%** full (~22 GB free) — images + MinIO + PG unsafe  
2. Load **>10** on 2 vCPU — Chromium PDF would worsen contention  
3. **65** vhosts — blast radius / noisy neighbors  
4. No Docker yet; installing Docker on this host is high-risk  
5. Declared Hostinger panel facts **do not match** live OS/disk (wrong assumptions corrected)

## Security findings

| Finding | Severity |
|---------|----------|
| Password auth still enabled | MED (key works; rotate password after chat exposure) |
| Plesk 8443/8880 world-reachable | MED |
| FTP :21 open | MED |
| Multi-tenant shared host | HIGH for Argos isolation |
| No swap + high load | HIGH ops |

## Explicit non-actions (this gate)

- No Argos deploy / Compose / DB / MinIO  
- No DNS / TLS for staging.argos-it.es  
- No nginx/Plesk site edits  
- No firewall closes  
- No sshd hardening that needs root  
- No reboot  

## Operator note

A password was used interactively to recover access. **Rotate that password** in Hostinger/Plesk after key-only access is confirmed durable. Do not store it in git or docs.
