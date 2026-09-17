# ARGOS — Failure / Action matrix

```
FORMAT = Problem | Signal | Evidence | Hypothesis | Action A | A Failure | Action B | B Failure | Action C | Rollback
LEVELS = 0–4 (see remediation model)
NO IMPROVISATION IN AUTOMATION
```

Confidence remains qualitative. Rollback column is mandatory for L2+.

---

| Problem | Signal | Evidence | Hypothesis | Action A | A Failure | Action B | B Failure | Action C | Rollback |
|---------|--------|----------|------------|----------|-----------|----------|-----------|----------|----------|
| TLS expiring | `not_after` < 14d DETECTED | cert observe | renewal path broken or unattended | Notify + re-observe SAN/dates (L0) | still expiring / mismatch | Request renewal via known method; keep old cert (L2/L3) | new cert invalid | Manual install + customer approval (L3) | Restore previous cert files |
| TLS expired | handshake fail / `EXPIRED` | observe + HTTP fail optional | site HTTPS down | Confirm expiry vs clock/hostname (L0) | not expiry (mismatch/chain) | Switch hypothesis; see mismatch row | — | Emergency cert + approve (L3) | Previous cert if still valid |
| TLS hostname mismatch | `HOSTNAME_MISMATCH` | SAN vs hostname | wrong cert or vhost | Compare SAN/vhost config (L0) | SAN actually matches (false) | Correct vhost/cert mapping (L3) | still mismatch | New cert for hostname (L3) | Revert vhost/cert |
| TLS chain error | `CHAIN_ERROR` | openssl evidence | incomplete chain | Re-fetch chain (L0) | chain complete (transient) | Install intermediate (L2) | still broken | Replace cert (L3) | Backup chain files |
| DNS NXDOMAIN | resolve fail | DNS answers | typo vs NS outage vs deletion | Query second resolver (L0) | both NX | Check registrar/NS (L0) | NS dead | Restore record / escalate registrar (L3) | Restore last known zone snapshot if exists |
| DNS unexpected change | record diff vs baseline | before/after | hijack vs legitimate change | Alert OBSERVE; freeze auto-DNS (L0) | confirmed customer change | Revert to baseline if unauthorized (L3) | revert fails | Registrar lock + escalate (L3/4 never auto) | Re-apply baseline |
| HTTP timeout | probe timeout | latency/error_class | origin down vs network vs ARGOS path | Retry other vantage / TCP check (L0) | TCP ok | Inspect origin/app (L0) | still timeout | Scale/restart **with approval** (L3) | Undo restart only if runbook says |
| HTTP 5xx confirmed | N consecutive 5xx | status codes | app error | Capture status/body hash (L0) | 200 returns | Restart app service (L3) | 5xx remains | Rollback last deploy (L3) | Re-deploy previous artifact |
| HTTP 4xx mass | spike 404/401 | codes | misconfig vs attack | Classify path (L0) | benign | WAF/rate limit (L3) | still spike | Escalate security (L3) | Remove WAF rule |
| API down | TCP/HTTP fail on API asset | same | process vs port vs gateway | Port check (L0) | port open | Process/supervisor (L3) | still down | Failover gateway (L3) | Revert failover |
| DB connection refused | `CONN_REFUSED` | tcp error | **listener/service/network more likely than password** | TCP/DNS to DB host (L0) | TCP open | Check service/listen address (L0/L3 restart) | auth errors appear | Creds/IAM only after listener proven (L3) | Restart undo; never guess-drop DB (L4) |
| DB timeout | query/probe timeout | latency | lock vs load vs net | Show process/locks read-only (L0) | no locks | Connection storm shed (L3) | still timeout | Failover (L3) | Failback |
| Disk full | agent %used | metrics | logs vs data | Identify top dirs (L0) | not full (stale agent) | Rotate logs (L2) | still full | Expand volume (L3) | Stop rotation? N/A; keep backups |
| Backup stale | last_success old | timestamp | job fail | Read backup job log (L0) | job actually OK (clock) | Re-run backup (L2) | fail again | Alternate backup target (L3) | N/A for data; keep last good backup |
| Agent mute | heartbeat age | last_seen | host down vs agent crash | ICMP/HTTP to host (L0) | host up | Restart agent (L3) | still mute | Out-of-band / isolate untrusted agent (L3) | Previous agent version |
| Agent compromise suspected | anomalous commands / auth fails | audit | stolen token | **SAFE STOP automations** (L0) | false positive | Rotate token, isolate (L3) | still anomalous | Rebuild host (L3/4) | Re-enable only new token |
| Auth ARGOS fail | login 401 storm | logs | attack vs outage IdP | Rate limit already on; confirm DB (L0) | DB ok | Block IPs / captcha (L3) | users locked out | Degrade to maintenance (L3) | Unblock lists |
| Notification fail | send error | provider status | provider vs template | Retry (L1) | still fail | Alternate channel (L2) | both fail | Page phone runbook (L3) | N/A |
| Monitoring engine down | no observations / heartbeat | self-health | worker crash | Restart worker (L2) | crash loop | Failover instance (L3) | no checks | Manual checks + freeze HEALTHY (L0 policy) | Previous worker binary |
| ARGOS platform outage | `/api/health` 503 | db disconnected | postgres vs app | Restart API (L2) | still 503 | Failover DB replica (L3) | data issue | Status page + stop customer automations | DB restore **only** with backup drill (L4 never auto) |
| Docker/container down | inspect/exit | docker ps | crashloop | Logs read (L0) | healthy | Recreate container (L3) | loop | Previous image (L3) | `docker` previous image tag |
| False HEALTHY risk | health=HEALTHY + zero obs | engine audit | bug | Force UNKNOWN (L0/L1) | — | Disable monitor publish (L2) | — | Patch engine (human) | Revert engine version |

---

## Notes

- L4 never appears as Action A automatic.
- DB password rotation is **not** Action A for connection refused.
- Customer-facing copy: failure matrix stays internal; portal uses language matrix.
