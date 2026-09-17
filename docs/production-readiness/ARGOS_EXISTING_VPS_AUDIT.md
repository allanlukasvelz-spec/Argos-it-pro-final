# ARGOS — Existing Hostinger VPS Audit

```
GATE                      = EXISTING_VPS_AUDIT
DATE                      = 2026-08-26
AUDIT_MODE                = READ_ONLY
REMOTE_SERVER_CHANGED     = NO
SSH_LIVE_INVENTORY        = INCOMPLETE (publickey denied)
EXTERNAL_PROBES           = DONE
PANEL_FACTS               = HUMAN_PROVIDED
PUBLIC_IP_IN_DOC          = REDACTED
```

## 0. Scope & method

| Source | Status |
|--------|--------|
| Local git preflight | PASS (`e4a3514`, clean, stash preserved) |
| SSH interactive inventory | **BLOCKED** — `Permission denied (publickey…)` on configured host alias `udic` (port **2220**) |
| External TCP probes | PASS (from operator workstation) |
| DNS correlation | PASS |
| Hostinger panel utilization | Accepted as human observation (not re-fetched) |
| Package install / firewall change / restart | **NOT DONE** (forbidden) |

Operator local pubkey fingerprint (for authorization on server):  
`SHA256:v8piXPK8pNuYe+VWj9Q1ex+S+yGkAzzL98J6f5qWGsg` (ED25519)

Server hostkey fingerprints observed via `ssh-keyscan` (port 2220):  
- RSA `SHA256:L8tu6/uMKNoWYWLzRfueArtR6/PIKfaOpNRPDQMgLzE`  
- ED25519 `SHA256:85ZZuZiQA6VVzKqnzm1KbiifFZeLbd/4MxZCZl9SS8c`

## 1. Declared VPS identity (human)

| Field | Value |
|-------|-------|
| Provider | HOSTINGER |
| Plan | KVM 2 |
| Region | Vilnius, Lithuania |
| OS | Ubuntu 24.04 LTS (declared; live `os-release` **UNKNOWN** without SSH) |
| CPU | 2 vCPU |
| RAM | 8 GB |
| Disk | 100 GB |
| Bandwidth | 8 TB |
| Hostinger backup | weekly (declared) |
| Decision | USE_EXISTING_VPS_FIRST |
| NEW_VPS | NO |

Panel snapshot (human): disk ≈9 GB used; memory ≈18%; CPU ≈13% at observation time.

## 2. Network identity (correlation, IP redacted)

| Check | Result |
|-------|--------|
| SSH config host aliases | `udic` (port 2220), `udic-staging` (port 22) |
| Port 22 | **CLOSED** externally |
| Port 2220 | **OPEN** (SSH responds; auth fails for local key) |
| `udic.es` A | **Same address** as SSH `HostName` |
| `staging2.udic.es` A | **Same address** |
| `argos-it.es` A | **Different** Hostinger addresses (shared/web hosting class) |
| `staging.argos-it.es` A | **No record** (not delegated yet) |

**Conclusion:** The audited Hostinger VPS is the **UDIC/Plesk** host, not a blank VM.

## 3. External listening ports (observed)

| Port | State | Classification |
|------|-------|----------------|
| 22 | CLOSED | SSH default unused |
| 2220 | OPEN | SSH (non-default) — PUBLIC_REQUIRED for ops |
| 80 | OPEN | HTTP — PUBLIC_REQUIRED (Plesk/nginx) |
| 443 | OPEN | HTTPS — PUBLIC_REQUIRED |
| 8443 | OPEN | Plesk panel — PUBLIC_UNEXPECTED for world (admin surface) |
| 8880 | OPEN | Plesk-related — PUBLIC_UNEXPECTED unless required |
| 5432 | CLOSED | postgres_public=NO (external) |
| 9000/9001 | CLOSED | minio_public=NO (external) |
| 3000/4000 | CLOSED | Argos not deployed |
| 3306/6379 | CLOSED | No MySQL/Redis public from probe |

HTTP to host IP: `Server: nginx`, default page.  
HTTPS to host IP (`-k`): **303 → `/login.php`** with `X-Powered-By` patterns consistent with **Plesk** panel.

`udic.es` HTTPS: `server: nginx`, `x-powered-by: PleskLin`, PHP 8.2.x.

## 4. Host inventory via SSH — status

| Item | Result |
|------|--------|
| hostname / kernel / uptime / timezone | **UNKNOWN** |
| CPU model / exact load | **UNKNOWN** (panel snapshot only) |
| free/df/inodes | **UNKNOWN** (panel: ~9 GB disk used) |
| systemd services / failed units | **UNKNOWN** |
| Docker / Compose / containers | **UNKNOWN** |
| UFW / nftables / iptables rules | **UNKNOWN** |
| sshd effective config | **UNKNOWN** (auth path offers publickey; password may be offered by protocol banner but not validated) |
| Local cron / backup jobs | **UNKNOWN** |

SSH attempt detail (no secrets): BatchMode + `IdentitiesOnly` + `~/.ssh/id_ed25519` → **denied**. Agent had **no identities**.

## 5. Existing workloads (evidence-based)

| Workload | Evidence | Confidence |
|----------|----------|------------|
| Plesk control panel | Port 8443 + HTTPS `/login.php` | HIGH |
| nginx reverse proxy | HTTP/HTTPS banners | HIGH |
| WordPress / PHP sites | `udic.es` PleskLin + PHP | HIGH |
| UDIC production web | DNS `udic.es` → this VPS | HIGH |
| UDIC staging2 | DNS `staging2.udic.es` → this VPS | HIGH |
| MariaDB/MySQL | Typical Plesk; **not** public on 3306 | MEDIUM (presence), HIGH (not public) |
| Docker / Argos | No evidence externally | UNKNOWN |
| MinIO | No public 9000/9001 | UNKNOWN if installed privately |
| PostgreSQL | No public 5432 | UNKNOWN if installed privately |

Treat UDIC + Plesk as **protected existing services**.

## 6. Firewall

| Layer | Finding |
|-------|---------|
| Hostinger panel rules | Human: **zero rules** displayed — interpret as **UNKNOWN** whether (A) no cloud FW, (B) local-only, (C) elsewhere |
| Local UFW/nft | UNKNOWN without SSH |
| Effective exposure | 80/443/2220/8443/8880 reachable from internet |

## 7. Backup

| Type | Status |
|------|--------|
| Hostinger weekly backup | Declared present — **≠** Argos application backup |
| Local Argos dump/object jobs | Not present (Argos not deployed) |
| Off-host S3-compatible (D5) | **REQUIRED** before EXTERNAL_STAGING_VALIDATED |

## 8. Capacity (conservative estimate)

Baselines (panel + plan):

| Metric | Current |
|--------|---------|
| CURRENT_CPU_BASELINE | 2 vCPU; panel ~13% idle sample |
| CURRENT_RAM_BASELINE | 8 GB; panel ~18% used sample |
| CURRENT_DISK_BASELINE | 100 GB; ~9 GB used → ~90 GB free (panel) |

Argos S0 add-on (ranges, not precision):

| Component | RAM idle→peak | Disk | CPU risk |
|-----------|---------------|------|----------|
| PostgreSQL | 256–512 MB → 1 GB | 5–20 GB grow | Low–med |
| MinIO | 256–512 MB | 10–40 GB objects | Low |
| API | 256–512 MB | low | Med (scheduler) |
| Worker + Chromium | 512 MB → **1.5–3 GB peak** | browser cache | **HIGH peak** |
| Frontend | 128–256 MB | low | Low |
| Docker/proxy overhead | 256–512 MB | images 5–15 GB | Low |
| **Estimated Argos total** | **~2.5–5 GB peak** | **~20–60 GB** | Spiky |

Headroom vs 8 GB with Plesk/WordPress already resident: **tight but plausible for S0** if peaks monitored.

**capacity_status = PASS_WITH_MONITORING** (2 vCPU accepted for S0 staging; not production capacity proof).

## 9. Conflicts

| Area | Conflict |
|------|----------|
| Ports 80/443 | Owned by Plesk/nginx — Argos must add **vhost** for `staging.argos-it.es`, not bind competing host nginx carelessly |
| 8443/8880 | Admin surfaces publicly reachable — harden separately |
| Storage | Need dedicated Docker volumes / paths outside Plesk vhosts |
| Security blast radius | Compromise of Argos container or Plesk → shared host |
| Restart blast radius | Docker/host reboot affects UDIC |
| Backup blast radius | Provider backup restores whole VM |

## 10. Audit limitations

This gate **cannot** truthfully claim a complete live host inventory until SSH key access is authorized. External + DNS evidence is sufficient to classify **shared Plesk/UDIC host** and public port posture.
