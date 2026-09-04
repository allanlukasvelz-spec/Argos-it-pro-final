# ARGOS_OBSERVABILITY_P1_CLOSURE_22

```
ARGOS_OBSERVABILITY_P1_CLOSURE_22 = PASS_WITH_OWNER_ACTION
TIMESTAMP                          = 2026-09-03T19:05:52Z
PRODUCTION_SHA                     = 12678f37997479b6f58f11b16947a14e40309910
MISSION22_REPORT_STAGED            = NO
```

## What changed (ops only)

| Item | Result |
|------|--------|
| App release | UNCHANGED `12678f3…` |
| monitor-production.sh | Extended with §12 release-identity guard |
| New helper | `/root/argos-prod-ops/bin/argos-release-identity.sh` |
| Off-host probe script | `/root/argos-prod-ops/bin/argos-external-uptime.sh` (not cron'd on VPS) |
| Pre-change backup | `/root/argos-prod-ops/backups/monitor-production.sh.m22-20260903T185734Z` |
| Cron | still exactly one `*/5` production monitor |

SHA256 monitor:
BEFORE `051f1f066fa289ae8c2a615a560d76de0860d5ec49cdd88ddbb76114f0357dad`
AFTER `55ef5372e9802d2851a31b25fdae2a25ff2bf3e5ccac96e8b371cdef41fc037d`

## Release identity guard

- Compares **running Docker image tags** of web (`rpp5…`) and API (`ufcw…`) to frozen SHA.
- Does **not** compare `origin/main`.
- MATCH → OK, no alert.
- DRIFT / MISMATCH → ntfy once per state transition.
- UNKNOWN (unreadable tag) → not treated as drift.

Live cycle 2026-09-03T19:03:17Z:
`release_identity=MATCH web=12678f3… api=12678f3…`
No new row in `alerts.log`.

Dry-run (helper env overrides, production images untouched): MATCH / DRIFT / MISMATCH / UNKNOWN all behaved as specified.

## Existing monitor regression (same cycle)

portal HTTP 200 · API health OK · postgres healthy + SELECT 1 · TLS 57d · CPU/RAM/disk OK · container restarts 0 · backup success · age_h=19 · offsite 30 dumps · docker ok · filesystem rw.

## ntfy human delivery

One labeled test: `ARGOS MONITOR TEST — MISSION 22` (not an outage).
ntfy.sh HTTP **429** (not accepted). One malformed retry aborted. **No further sends.**
Human ACK: **NOT_CONFIRMED**.
Implication: existing on-box alerts may also be rate-limited on public ntfy.sh.

ntfy.sh itself is **off-VPS** (SaaS). Reuse is valid **if** publish is accepted.

## External / host-down SPOF

| Requirement | Evidence |
|-------------|----------|
| Probe runs off-host | YES — this workstation: portal 200, `/api/health` 200 |
| Sustained-failure logic | YES — dry-run vs `127.0.0.1:1`, notify only at consecutive ≥2 |
| 24/7 off-host scheduler | **NO** — not installed (VPS cron would not close SPOF; Hostinger API timed out; no new vendor account created) |
| Off-host notification when VPS dead | **NOT PROVEN** — depends on ntfy 429 + owner subscription |

`argos-external-uptime.sh` is present for copy to any always-on off-host. **Do not cron it on 91.108.121.181.**

### Owner action to close HOST_UNREACHABLE

Pick **one** (no paid plan required):

1. **Free UptimeRobot (or equivalent)** HTTPS monitors:
   - `https://portal.argos-it.com` expect 200, 5 min, alert after 2 failures
   - `https://api.portal.argos-it.com/api/health` expect 200 + body contains `"status":"OK"`, same cadence
   - Notify via email/app **not hosted on the ARGOS VPS**
2. **GitHub Actions** `schedule: "*/5 * * * *"` on `ubuntu-latest` curling those URLs (requires owner commit/push — not done in Mission 22).
3. **Always-on off-host cron** running `argos-external-uptime.sh` with `NTFY_PUBLISH_URL` set privately (never commit the URL).

Also: fix ntfy.sh 429 (token / self-host / wait) and **ACK** the labeled test.

## Rollback

Restore `/root/argos-prod-ops/backups/monitor-production.sh.m22-20260903T185734Z` over `bin/monitor-production.sh`. Remove helper if desired. Do **not** rollback application SHA.

## Secrets

No topic, keys, or customer data in this report. SECRET_SCAN=PASS.

## Backup semantics

Latest verified remains `pg-dump-postgres-1788393629.dmp` VERIFIED_RESTORABLE. Generated ≠ verified. Unchanged.
