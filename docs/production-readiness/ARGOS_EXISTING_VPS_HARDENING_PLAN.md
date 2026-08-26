# ARGOS — Existing VPS Hardening Plan (NOT EXECUTED)

```
STATUS = PLAN ONLY
REMOTE_CONFIGURATION_CHANGED = NO
IMPLEMENTATION = REQUIRES SEPARATE AUTHORIZATION
```

Ordered remediation. **Do not implement in this gate.**

Any change that can impact UDIC/Plesk requires **explicit human review**.

---

### H1 SSH

| | |
|--|--|
| CURRENT | Port 2220 open; operator `id_ed25519` **not** authorized; port 22 closed |
| TARGET | Key-only auth for deploy user; root login disabled or key-only; password auth off if still on; AllowUsers restricted |
| WHY | Complete audit + safe deploy; reduce brute force |
| RISK | Lockout if keys misconfigured |
| ROLLBACK | Hostinger/Plesk console recovery |
| DOWNTIME | None if additive key install |
| EXISTING_IMPACT | Low if new key added without removing others |

### H2 Firewall

| | |
|--|--|
| CURRENT | Hostinger panel “0 rules”; local FW UNKNOWN; 80/443/2220/8443/8880 public |
| TARGET | Allow 80/443; SSH 2220 from operator/CI IPs if practical; **restrict 8443/8880** to admin IPs; deny 5432/9000/9001/3000/4000 publicly |
| WHY | Reduce admin and DB/object exposure |
| RISK | Lock out Plesk admin if 8443 restricted wrongly |
| ROLLBACK | Panel console / temporary allow-all carefully |
| DOWNTIME | Possible brief admin access loss |
| EXISTING_IMPACT | **HIGH** for Plesk operators — human review required |

### H3 Users

| | |
|--|--|
| CURRENT | UNKNOWN |
| TARGET | Dedicated non-root `argos` deploy user; sudo limited; no shared WP credentials |
| WHY | Least privilege |
| RISK | Permission errors on deploy |
| ROLLBACK | Remove user |
| DOWNTIME | None |
| EXISTING_IMPACT | Low |

### H4 Docker

| | |
|--|--|
| CURRENT | UNKNOWN if installed |
| TARGET | Docker Engine + Compose v2; no Docker socket mount into Argos containers; dedicated compose project `argos-staging` |
| WHY | Reproduce validated topology |
| RISK | Disk growth from images; conflict with future Plesk Docker if any |
| ROLLBACK | Stop compose project; do not wipe unrelated images until inventoried |
| DOWNTIME | None for UDIC if isolated |
| EXISTING_IMPACT | Med — needs live inventory first |

### H5 Network isolation

| | |
|--|--|
| CURRENT | Plesk host network; Argos absent |
| TARGET | Docker bridge `argos_staging_net`; publish FE/API only to loopback or proxy network; **never** publish PG/MinIO |
| WHY | Tenant/security invariants |
| RISK | Mis-publish |
| ROLLBACK | `compose down` publish ports |
| DOWNTIME | Argos only |
| EXISTING_IMPACT | Low if no shared docker network with WP |

### H6 Reverse proxy

| | |
|--|--|
| CURRENT | Plesk/nginx owns 80/443 |
| TARGET | Plesk vhost or nginx additional server_name `staging.argos-it.es` → Argos FE/API upstreams (127.0.0.1) |
| WHY | TLS coexistence without fighting Plesk |
| RISK | Break other vhosts if edited wrongly |
| ROLLBACK | Remove vhost; restore Plesk config backup |
| DOWNTIME | Possible brief nginx reload |
| EXISTING_IMPACT | **MED–HIGH** — human review |

### H7 TLS

| | |
|--|--|
| CURRENT | Plesk TLS for existing domains; `staging.argos-it.es` not resolving |
| TARGET | Certificate for `staging.argos-it.es` via Plesk/Let’s Encrypt after DNS |
| WHY | `ARGOS_COOKIE_SECURE=1` |
| RISK | Rate limits / wrong DNS |
| ROLLBACK | Remove cert/domain |
| DOWNTIME | None for UDIC |
| EXISTING_IMPACT | Low |

### H8 Filesystem / volumes

| | |
|--|--|
| CURRENT | Plesk `/var/www/vhosts/...` for UDIC |
| TARGET | Dedicated paths/volumes for Argos data (`/var/lib/argos-staging` or Docker volumes); never write into UDIC httpdocs |
| WHY | Isolation |
| RISK | Disk fill |
| ROLLBACK | Remove volumes after backup |
| DOWNTIME | None |
| EXISTING_IMPACT | Low if paths isolated |

### H9 Secrets

| | |
|--|--|
| CURRENT | N/A for Argos |
| TARGET | `/etc/argos/staging.env` mode `0600` (D8); distinct JWT/DB/MinIO/harness; no CHANGE_ME |
| WHY | Fail-closed ops |
| RISK | Leak via backups of env file |
| ROLLBACK | Rotate secrets |
| DOWNTIME | Argos restart |
| EXISTING_IMPACT | None |

### H10 Monitoring

| | |
|--|--|
| CURRENT | UNKNOWN local; D7 requires external probe |
| TARGET | ≥1 external uptime on `https://staging.argos-it.es` + `/api/live` or `/api/ready`; disk/RAM alerts; PDF peak awareness |
| WHY | Shared host contention |
| RISK | Alert noise |
| ROLLBACK | Disable checks |
| DOWNTIME | None |
| EXISTING_IMPACT | None |

### H11 Backup

| | |
|--|--|
| CURRENT | Hostinger weekly VM backup only |
| TARGET | Argos `pg_dump` + MinIO mirror + checksums → **off-host S3-compatible** (D5); isolated restore drill |
| WHY | Provider backup ≠ app DR |
| RISK | Credential for off-host store |
| ROLLBACK | N/A |
| DOWNTIME | None |
| EXISTING_IMPACT | Disk I/O during dump — schedule off-peak |

### H12 Argos deployment

| | |
|--|--|
| CURRENT | Not deployed |
| TARGET | Follow [ARGOS_EXTERNAL_STAGING_DEPLOYMENT_RUNBOOK.md](./ARGOS_EXTERNAL_STAGING_DEPLOYMENT_RUNBOOK.md) after H1–H11 gate |
| WHY | Reproducible SHA-pinned staging |
| RISK | Resource contention with UDIC |
| ROLLBACK | compose down; keep volumes until DR tested |
| DOWNTIME | Argos only |
| EXISTING_IMPACT | CPU/RAM during PDF — monitor |

---

## Red team summary (shared host)

| Scenario | Current control | Required | Residual |
|----------|-----------------|----------|----------|
| Host compromise | Unknown hardening | H1–H3, minimize publish | Full VM loss → off-host backup |
| SSH brute force | Non-22 port only | Key-only + allowlist | Residual until FW |
| Public Postgres/MinIO | Closed externally now | Keep unpublished + FW | Misconfig risk |
| Plesk panel exposure | 8443 open | Restrict admin IPs | Residual admin surface |
| Chromium OOM | Unknown | Monitor + swap policy caution | Job failures |
| Staging→prod resources | Process | Distinct secrets/accounts | Human error |
| Restore destroys UDIC | Provider whole-VM restore | Argos isolated volumes + app-level backup | Coupled if VM restore used |

## H1 / H2 status (2026-08-26)

| Item | Status |
|------|--------|
| H1 SSH access | **DONE** — key-only session verified for `udic` @ 2220 |
| H1 sshd hardening (disable password/root) | **DEFERRED** — needs root sudo + zero-lockout plan |
| H2 firewall changes | **DEFERRED** — firewalld active; no passwordless sudo; multi-tenant risk |
| Full result | [ARGOS_EXISTING_VPS_H1_H2_RESULT.md](./ARGOS_EXISTING_VPS_H1_H2_RESULT.md) |

**Argos must not be deployed on this host** until a dedicated VPS is chosen (disk/load/multi-tenant).
