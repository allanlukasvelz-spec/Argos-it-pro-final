# ARGOS — Capacity Model

```
TYPE = TRANSPARENT ESTIMATES — not load-test results
```

## Assumptions (label clearly)

| Variable | S0 staging | S1 | S2 |
|----------|------------|----|----|
| Organizations | 5–20 | 50–100 | 500 |
| Assets / org | 10 | 30 | 50 |
| Monitors / asset | 2 | 3 | 3 |
| Check interval | 60–300s | 60–120s | 60s |
| Agents / org | 0–2 | 5 | 20 |
| Agent heartbeat | 60s | 60s | 30–60s |
| Reports / org / week | 1–5 | 10 | 50 |

## Derived rough math (S1 example)

```
orgs=100, assets=30, monitors=3, interval=120s
checks/sec ≈ 100*30*3 / 120 = 75/s peak theoretical
observations/day ≈ 75 * 86400 ≈ 6.5e6  (upper bound if all due continuously)
```

Real due batching + enabled flags reduce this — treat as **ceiling**, not measured.

## Storage rough order

| Item | Estimate |
|------|----------|
| Observation row | ~0.5–2 KB JSONB-ish |
| Evidence PDF | ~100–300 KB each |
| Report jobs | small metadata |

**S0 month:** low GB Postgres + <10GB objects  
**S1 month:** tens of GB possible if intervals aggressive  

## Tier recommendations

| Tier | Topology |
|------|----------|
| **S0** | 1 VM Compose: API×1, worker×1, PG, MinIO/local |
| **S1** | Same + worker×2, larger PG disk, pinned MinIO, backups |
| **S2** | Requires scheduler redesign before multi-API; consider split scheduler |

## CURRENT tier

**S0-capable locally.** Not S2-safe for multi-API due to scheduler SCALE_BLOCKER.
