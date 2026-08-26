# ARGOS — Existing VPS Compatibility Decision

```
CAN_HOST_ARGOS_STAGING = YES_WITH_CHANGES
NEW_VPS_REQUIRED       = NO  (per human USE_EXISTING_VPS_FIRST)
DEPLOY_NOW             = NO
SSH_ACCESS             = BLOCKED_UNTIL_KEY_AUTHORIZED
```

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
