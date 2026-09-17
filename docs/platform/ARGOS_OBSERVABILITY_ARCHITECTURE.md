# ARGOS Observability Architecture

```
DATE = 2026-08-25
STATUS = TARGET + GATED
```

## Principle

Observability engines feed ARGOS. ARGOS remains product authority for health and incidents.

```
ARGOS / Agents / Workers / DB / Containers
        ↓
   OTel (normalization)
        ↓
  Prometheus / Loki / Tempo
        ↓
 ARGOS connectors (tenant-stamped)
        ↓
 normalized observations / platform SLIs
        ↓
 healthEngine / platform-health
        ↓
 alerts / incidents / CHICO
```

## CURRENT

- HTTP access logs: morgan combined
- console.error for failures
- `/api/health` + `/api/noc/platform-health` = DB ping
- Agent metrics → `agent_observations` → health merge
- Monitor latency/ok → `observations`

## TARGET layers

1. **Instrumentation hooks (ADOPT_NOW):** structured events + counters interface; no-op default.
2. **OTel Collector (V1):** private network; stamp `organization.id` only for tenant telemetry; platform telemetry uses `argos.component`.
3. **Prometheus (V1):** scrape collector; cardinality budget; never public.
4. **Grafana (ADOPT_LATER):** NOC VPN/internal only.
5. **Loki/Tempo (V1.5):** when log/trace volume exceeds PG/console.

## Multi-tenancy

OTel does not provide product tenancy. ARGOS must:

- stamp resource attributes
- reject unscoped tenant export from client-facing paths
- never let Grafana become client UI

## Failure

If observability backends unavailable → platform SLI = UNKNOWN/DEGRADED; **customer health unchanged** unless evidence freshness expires → UNKNOWN (not HEALTHY).

## Resource cost

| Stage | Cost |
|-------|------|
| Hooks only | LOW |
| Collector + Prometheus | MEDIUM |
| Full LGTM stack | HIGH |
