# ARGOS — Existing VPS Compatibility Decision

```
CAN_HOST_ARGOS_STAGING = NO
REASON                 = Multi-tenant Plesk host overloaded (disk 96%, load >10, 65 vhosts); see H1–H2 result
NEW_VPS_REQUIRED       = REVIEW_REQUIRED (recommended YES for Argos)
SSH_ACCESS             = RESTORED (udic @ 2220, key-only verified)
DEPLOY_NOW             = NO
```

## Update after H1–H2 live audit (2026-08-26)

Prior external-only verdict `YES_WITH_CHANGES` is **superseded**.

Live facts:

- AlmaLinux 8.10 + Plesk Obsidian (not Ubuntu 24.04 as declared)
- ~455 GB disk, **96% full**
- Load average **~11** on 2 vCPU, **no swap**
- **65** vhosts under `/var/www/vhosts` (udic.es + many others)
- Docker **absent**
- SSH key access for `udic` restored; firewall/sshd hardening deferred (no sudo)

**Do not deploy Argos on this VPS.** Prefer a dedicated Hostinger KVM for `staging.argos-it.es` within the €80 budget, keeping this host for UDIC/customers only.

Canonical detail: [ARGOS_EXISTING_VPS_H1_H2_RESULT.md](./ARGOS_EXISTING_VPS_H1_H2_RESULT.md)

## Decision

**YES_WITH_CHANGES** — The existing Hostinger KVM 2 (Vilnius) can host Argos **S0 external staging** after hardening/isolation, provided humans accept **shared-host risk** with UDIC/Plesk workloads.

It is **not** a greenfield VM. Evidence ties this host to:

- Plesk + nginx on 80/443/8443
- `udic.es` (production web)
- `staging2.udic.es`

## Why not YES (clean)

| Issue | Impact |
|-------|--------|
| SSH pubkey not authorized for audit/deploy operator key | Cannot complete live inventory or safe deploy |
| Shared production-adjacent WordPress/Plesk | Blast radius, CPU/RAM contention, restore coupling |
| Public Plesk admin ports | Attack surface beyond Argos |
| Hostinger FW “0 rules” | Exposure unclear; local FW UNKNOWN |
| 2 vCPU + Chromium PDF peaks | Needs monitoring; may contend with Plesk |

## Why not NO

| Factor | Support |
|--------|---------|
| RAM 8 GB / disk ~90 GB free (panel) | Fits S0 ranges with monitoring |
| Postgres/MinIO **not** publicly open | Aligns with Argos invariants (external view) |
| Human decision USE_EXISTING_VPS_FIRST | New VPS not authorized |
| Architecture Class A (Compose) | Compatible if Docker installed/isolated later |

## Capacity verdict

`PASS_WITH_MONITORING` — acceptable for **staging S0 only**; never infer production capacity.

## Required before any Argos deploy

1. Authorize operator SSH key (see audit doc fingerprint) — complete live inventory  
2. Human sign-off on **shared UDIC/Plesk** coexistence  
3. Execute hardening plan H1–H11 as applicable ([ARGOS_EXISTING_VPS_HARDENING_PLAN.md](./ARGOS_EXISTING_VPS_HARDENING_PLAN.md))  
4. Separate EXTERNAL_STAGING_IMPLEMENTATION authorization  
5. DNS only for `staging.argos-it.es` (not production apex)  
6. Off-host backup destination (D5) configured  

## Explicit non-claims

| Claim | Status |
|-------|--------|
| LOCAL_STAGING_VALIDATED | YES (elsewhere) |
| EXTERNAL_STAGING_VALIDATED | **NO** |
| PRODUCTION_READY | **NO** |
| Complete SSH host audit | **NO** |

## Related

- [ARGOS_EXISTING_VPS_AUDIT.md](./ARGOS_EXISTING_VPS_AUDIT.md)
- [ARGOS_EXISTING_VPS_HARDENING_PLAN.md](./ARGOS_EXISTING_VPS_HARDENING_PLAN.md)
- [ARGOS_EXTERNAL_STAGING_HUMAN_DECISIONS.md](./ARGOS_EXTERNAL_STAGING_HUMAN_DECISIONS.md)
