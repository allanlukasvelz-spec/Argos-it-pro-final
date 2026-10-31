# ARGOS — External Staging Observability

```
PLATFORM = S0 MINIMAL
LGTM_FULL = DEFERRED
CIRCULAR_DEPENDENCY = AVOID
```

Canonical plan: [ARGOS_OBSERVABILITY_PLAN.md](./ARGOS_OBSERVABILITY_PLAN.md).

## Distinguish

| Signal | Meaning |
|--------|---------|
| `/api/live` | Process up |
| `/api/ready` | DB + schema + evidence store ready |
| `/api/health` | Platform health (not customer estate) |
| NOC Platform Health chip | Operator view |
| Customer monitors | Tenant estate — do **not** sole-watch ARGOS itself |

## Minimum external staging monitors

| Check | Where | Outside host? |
|-------|-------|---------------|
| Frontend HTTPS 200 | Synthetic GET `/` | **YES** (uptime provider) |
| API `/api/live` | Synthetic | **YES** |
| API `/api/ready` | Synthetic (auth not required) | **YES** |
| TLS expiry | External cert check | **YES** |
| Worker heartbeat | Container health / log / NOC | Host + optional push |
| Scheduler owner | Meta-health / single API policy | Host script |
| PostgreSQL | Via `/api/ready` + container health | Indirect external via ready |
| Object storage | Via ready + periodic evidence put/get | Prefer internal + alert |
| Queue depth / DEAD_LETTER | `scripts/staging/meta-health-probe.sh` + NOC | Host; alert outward |
| Disk usage | Host node metrics / df cron | Host → alert |
| Backup age | Cron stamp file / object mtime | **YES** if possible |

**At least one monitor must originate outside the Argos host** (uptime robot / Cloudflare / independent probe — D7).

## What not to build yet

- Full Prometheus/Grafana/Loki stack (S2)
- Using only CHICO/customer monitors as meta-monitoring
- Shipping secrets in logs

## Alert routing

Pager/email to operators (human channel). Staging severity < production; still alert on ready fail, disk, backup age, DEAD_LETTER growth.
