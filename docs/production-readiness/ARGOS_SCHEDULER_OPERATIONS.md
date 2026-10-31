# ARGOS — Scheduler Operations

```
LOCATION = in-process inside API (backend/lib/monitoring/scheduler.js)
DEFAULT  = ENABLED unless ENABLE_MONITOR_SCHEDULER=false
```

## CURRENT behavior

| Parameter | Value |
|-----------|-------|
| Tick | 15s |
| Concurrency | 3 |
| Batch | 10 |
| Claim SQL | `SELECT … WHERE next_check_at <= NOW() LIMIT n` **without** `FOR UPDATE SKIP LOCKED` |
| next_check_at | Updated after check completes |

Failures log and mark monitor ERROR; HTTP server continues.

## SCALE_BLOCKER

```
SCALE_BLOCKER = YES for >1 API replica with scheduler enabled
```

Two API processes can select the same due monitors → duplicate observations/alerts.

## Staging policy (required)

| Pattern | Policy |
|---------|--------|
| Single API | Scheduler ON |
| Multi API (future) | Scheduler ON **only** on designated owner; others `ENABLE_MONITOR_SCHEDULER=false` |
| Ideal future | Extract scheduler process + advisory lock / SKIP LOCKED claim |

## Missed schedule recovery

Due monitors remain selectable on next tick (`next_check_at` in past). No separate catch-up queue.

## Overlap

`running` flag prevents re-entrant tick in **one** process; does not coordinate across processes.

## TARGET correction architecture (do not implement in this gate)

1. Claim with `UPDATE … WHERE id IN (SELECT … FOR UPDATE SKIP LOCKED)`  
2. Or separate `monitor-scheduler` service with singleton lease  
3. Document lease TTL + fencing  

## Ops checklist

- [ ] Exactly one scheduler owner in staging  
- [ ] Metrics: checks/min, error rate, lag (`now - next_check_at`)  
- [ ] Alert: no successful check for N minutes while monitors ACTIVE  
