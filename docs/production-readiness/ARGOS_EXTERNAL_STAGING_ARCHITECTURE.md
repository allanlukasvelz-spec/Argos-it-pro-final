# ARGOS — External Staging Architecture

```
STATUS = PRE_IMPLEMENTATION RECOMMENDATION
KUBERNETES = NO
SCALE_TIER = S0
SCHEDULER = SINGLE OWNER (API×1)
```

## Inventory — what external staging requires

### Compute (minimum S0)

| Resource | Minimum | Rationale |
|----------|---------|-----------|
| Arch | `amd64` or `arm64` (match image pins) | Current pins documented per host arch |
| CPU | 4 vCPU | API + worker (Chromium) + PG + MinIO |
| RAM | 8 GB | Worker Chromium + PG + FE; 4 GB is risky |
| Disk | 80 GB SSD (system) + 40 GB data | Images, PG, objects, local backup buffer |
| OS | Linux with Docker Engine + Compose v2 | Reproduce validated stack |
| Swap | Prefer avoid; if used, monitor carefully | OOM during PDF |

### Network

| Need | Requirement |
|------|-------------|
| Public entry | HTTPS only (443); optional HTTP→HTTPS redirect |
| Private | Postgres, MinIO API/console, worker, Docker bridge |
| Firewall | Deny world → 5432, 9000, 9001, worker |
| Reverse proxy | Required for TLS + cookie Secure |
| IPv4 | Assumed; IPv6 = human decision |
| Outbound | Docker pulls, OS updates, optional AI/uptime egress |

### DNS / TLS

| Item | Value |
|------|-------|
| Hostname | `staging.<domain>` preferred — **REQUIRED_HUMAN_INPUT** |
| Production DNS | **NO CHANGES** |
| Certificate | Let's Encrypt / managed ACM — edge terminates TLS |
| Cookie Secure | `ARGOS_COOKIE_SECURE=1` on external HTTPS |

### Database

| Item | Requirement |
|------|-------------|
| Engine | PostgreSQL 16 (pinned image) |
| Persistence | Named volume or managed disk |
| Migrations | One-shot `migrate` job; forward-only; identity = migrate container |
| Public | **NO** |
| Backup | Off-host copy mandatory (see backup doc) |

### Object storage

| Option | When |
|--------|------|
| **A. Pinned MinIO on private Docker network** | Default — matches local validated topology |
| **B. Managed S3-compatible** | If human prefers ops offload (D4) |

Bucket private; versioning on; no public ACL; no console exposure.

### Application processes

| Process | Count | Notes |
|---------|-------|-------|
| Frontend | 1 | Behind proxy |
| API | **1** | `ARGOS_SCHEDULER_OWNER=1`, scheduler ON |
| Worker | ≥1 | No inbound ports; Chromium for PDF |
| Migrate | 1 (job) | Completes before API start |

Do **not** run a second API with scheduler ON (B1 SCALE_BLOCKER).

## Deployment class comparison

| Class | Cost | Ops | Security | Backup | Restore | Repro | Scale | Lock-in | Fit S0 |
|-------|------|-----|----------|--------|---------|-------|-------|---------|--------|
| **A. Hardened VPS + Compose** | Low | Low | Good if firewall/TLS done | Needs off-host design | Isolated drill compose | Excellent (same files) | S0–S1 | Low | **BEST** |
| B. Managed containers + managed PG/S3 | Med–High | Med | Strong if VPC | Managed snaps | Platform-specific | Medium | Better | Med–High | Premature |
| C. Small VM + managed PG/S3 | Med | Med | Strong | Managed DB + object | Split restore | Medium | Better | Med | Acceptable alt |

### Recommendation

**Class A — Single hardened VPS + Docker Compose** using existing `docker/docker-compose.staging.yml` (+ reverse proxy sibling / host nginx/Caddy).

Reasons:

- Faithfully reproduces **validated** local topology
- Honors scheduler single-owner constraint without redesign
- Image pins + scripts already exist
- Lowest premature complexity; no Kubernetes

Class C is the fallback if human forbids colocating Postgres/MinIO on the app host (still Compose for FE/API/worker).

## Explicit non-goals

- Kubernetes / multi-region
- Multi-API active-active
- Production DNS or shared prod secrets
- Silent local-disk evidence fallback when `ARGOS_EVIDENCE_STORE=s3`
- Redesigning product semantics for “easier hosting”

## Related

- Local architecture: [ARGOS_STAGING_ARCHITECTURE.md](./ARGOS_STAGING_ARCHITECTURE.md)
- Capacity: [ARGOS_CAPACITY_MODEL.md](./ARGOS_CAPACITY_MODEL.md)
- Image pins: [ARGOS_STAGING_IMAGE_PINS.md](./ARGOS_STAGING_IMAGE_PINS.md)
