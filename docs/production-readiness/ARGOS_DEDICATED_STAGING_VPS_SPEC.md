# ARGOS — Dedicated Staging VPS Specification

```
STATUS                        = RECORDED
DATE                          = 2026-08-26
PURPOSE                       = ARGOS_ONLY
SUPERSEDES                    = USE_EXISTING_VPS_FIRST (vetoed — see H1–H2 result)
PROVISIONING_EXECUTED         = NO
DNS_CHANGED                   = NO
ARGOS_DEPLOYED                = NO
PRODUCTION                    = NO
CUSTOMER_DATA                 = NO
PHASE_9                       = NO
REMOTE_REMEDIATION            = NO
```

## Why dedicated

The existing Hostinger Plesk VPS was audited and **vetoed** for Argos:

- Multi-tenant (~65 vhosts)
- Disk ~96% full, load ≫ CPU count
- AlmaLinux/Plesk mail stack — not an Argos-only host

Canonical veto: [ARGOS_EXISTING_VPS_H1_H2_RESULT.md](./ARGOS_EXISTING_VPS_H1_H2_RESULT.md)

## Binding specification

| Field | Value |
|-------|-------|
| Provider | **Hostinger** |
| Purpose | **ARGOS ONLY** (no UDIC, no customer sites, no mail hosting) |
| Region | **Europe** |
| OS | **Ubuntu 24.04 LTS** |
| CPU | **4 vCPU recommended** |
| RAM | **8 GB minimum** |
| Disk | **≥ 100 GB** SSD/NVMe |
| Swap | **Configured** (required) |
| Public IPv4 | **1** |
| Hostname / DNS | **staging.argos-it.es** (only staging hostname; no production DNS changes) |

## Network policy

### Public

| Port | Service | Notes |
|------|---------|-------|
| 22/TCP | SSH | Prefer IP allowlist / key-only |
| 80/TCP | HTTP → HTTPS redirect | Reverse proxy |
| 443/TCP | HTTPS | Reverse proxy → FE/API |

### Private only (never publish)

| Port | Service |
|------|---------|
| 5432 | PostgreSQL |
| 9000 / 9001 | MinIO API / console |
| 4000 | Argos API (loopback / Docker net) |
| 3000 | Frontend (loopback / Docker net) |
| — | Worker — **no inbound** |

## Workloads (Compose Class A)

1. Reverse proxy (Caddy/nginx) + TLS  
2. Frontend  
3. API (scheduler owner ×1)  
4. Worker (+ Chromium)  
5. PostgreSQL 16 (pinned)  
6. MinIO (pinned, private)  

Align with [ARGOS_EXTERNAL_STAGING_ARCHITECTURE.md](./ARGOS_EXTERNAL_STAGING_ARCHITECTURE.md) and local `docker/docker-compose.staging.yml`.

## Budget / prior decisions

Still bound by D1–D10 where compatible:

- D5 off-host S3-compatible backups  
- D6 ≤ €80/mo ceiling (validate Hostinger 4 vCPU / 8 GB / ≥100 GB fits)  
- D7 ≥1 external uptime probe  
- D8 `/etc/argos/staging.env` mode 0600  
- D9 staging harness token-gated  

If the **4 vCPU** SKU exceeds €80, human must either raise D6 or accept **2–4 vCPU** trade-off explicitly before purchase.

## Hard limits

| Limit | Value |
|-------|-------|
| Customer production data | NO |
| Production | NO |
| Phase 9 | NO |
| Remote remediation / execution | NO |
| Shared with existing Plesk VPS | NO |

## Next gate (not this document)

Requires explicit **EXTERNAL_STAGING_VPS_PROVISION** authorization to:

1. Purchase/create Hostinger VPS matching this spec  
2. Point DNS A/AAAA for `staging.argos-it.es` only  
3. Baseline harden (SSH key-only, UFW, swap)  
4. Then separate deploy gate for Argos Compose  

Until that authorization: **STOP** — no spend, no DNS, no deploy.
