# ARGOS Platform Scale Model

```
DATE = 2026-08-25
LABEL = CAPACITY_MODEL_ESTIMATE
NOT_MEASURED_PRODUCTION = YES
```

| Scenario | Orgs | Assets | Agents |
|----------|------|--------|--------|
| **S0** | 10 | 100 | 10 |
| **S1** | 100 | 2,000 | 500 |
| **S2** | 1,000 | 25,000 | 5,000 |

## Estimates (CAPACITY_MODEL_ESTIMATE)

| Metric | S0 | S1 | S2 |
|--------|----|----|-----|
| Heartbeats/min | ~10–30 | ~500–1,500 | ~5k–15k |
| Observations/min | ~20–100 | ~1k–5k | ~10k–50k |
| Metrics cardinality (platform) | low thousands | tens of thousands | needs budgets |
| Logs/day (platform) | MB | GB | multi-GB → Loki |
| Object storage growth | MB (reports) | GB | TB class planning |
| DB growth | low | monitors+obs dominant | partition/retention needed |
| Worker concurrency | in-process OK | dedicated workers | multi-worker |

## Implication

Compose + PG sufficient for **S0–S1** with retention. **S2** forces worker split, metrics TSDB, object store, and cardinality controls — still not automatic Kubernetes.
