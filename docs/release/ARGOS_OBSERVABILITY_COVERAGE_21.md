# ARGOS_OBSERVABILITY_COVERAGE_21

```
ARGOS_OBSERVABILITY_AUDIT_21 = PASS_WITH_FINDINGS
TIMESTAMP                    = 2026-09-03T18:51:26Z
MODE                         = READ-ONLY / FORENSIC / ZERO-PRODUCTION-MUTATION
PRODUCTION_SHA               = 12678f37997479b6f58f11b16947a14e40309910
PRODUCTION_TREE              = e0d7bfa767576e2b6846d44600da23df3511db19
MISSION21_REPORT_STAGED      = NO
```

## Executive verdict

ARGOS already has a **working host-level production monitor** (`*/5` cron + ntfy) covering web/API/DB/TLS/CPU/RAM/disk/container restarts/backup status & staleness/R2 offsite age.

Largest remaining blind spots are **not “missing Prometheus”** — they are:

1. **Same-host monitoring SPOF** — if the VPS is down, the monitor cannot notify.
2. **No AI provider / cost observability** despite LIVE paid OpenAI.
3. **No automated release-identity drift check** against frozen SHA `12678f3…`.
4. **Backup monitoring tracks generation/job success, not VERIFIED_RESTORABLE** (Mission 20 distinction preserved).
5. **September daily `monitor-YYYYMMDD.log` files absent** while `alerts.log` + `monitor.state` still update — OK-cycle history degraded.

Docs `09_MONITORING.md` last formal verify **2026-08-05** → classify **PARTIALLY_CURRENT** (scripts active; doc age stale vs LIVE AI + Mission 20).

---

## Pre / post safety gate

| Gate | WEB | API | SHA web/api |
|------|-----|-----|-------------|
| PRE | 200 | PASS (`OK`/`connected`) | `12678f3…` / `12678f3…` |
| POST | 200 | PASS | unchanged |

Mutations: all **NO** (DB/Coolify/env/git/AI/DNS/firewall).

---

## Existing observability inventory (evidence)

| NAME | LOCATION | PURPOSE | ACTIVE_IN_PRODUCTION | LAST_VERIFIED | SIGNAL | ALERTING | CONFIDENCE |
|------|----------|---------|----------------------|---------------|--------|----------|------------|
| monitor-production.sh | `/root/argos-prod-ops/bin/` | Prod health cycle | YES (`*/5` cron; state mtime 2026-09-03) | Mission 21 live | multi | ntfy.sh + alerts.log | HIGH |
| r2-offsite-sync.sh | same ops bin | rclone dump→R2 | YES (`15 0 * * *`) | Script present; docs Aug-05 | backup offsite | exit≠0 only (no ntfy in script) | MED |
| ntfy topic file | `/root/argos-prod-ops/keys/ntfy-topic` | Push alerts | FILE=YES; human inbox **not** proven | Mission 21 | notify | YES path | MED (delivery UNKNOWN) |
| alerts.log | ops logs | Alert history | YES (entries through 2026-09-03) | Mission 21 | log | n/a | HIGH |
| monitor.state | ops state | restart counters | YES | Mission 21 | state | n/a | HIGH |
| Coolify Sentinel | container | Coolify agent health | healthy | Mission 21 | Coolify-internal | NOT human ARGOS alert | HIGH |
| Coolify DB backup schedule | Coolify | daily dump | objects present through 2026-09-03 | Mission 20/21 | backup artifact | via monitor | HIGH |
| `/api/health` | API | DB ping | YES | Mission 21 | health | polled by monitor | HIGH |
| `/api/live` `/api/ready` | API | liveness/readiness | code present | code | health | **not** polled by monitor | HIGH |
| Docker healthchecks | API+DB yes; **web none** | orchestrator | PARTIAL (R15) | Mission 21 | container | monitor treats `none` as OK | HIGH |
| App AI console.warn | assistantService | AI error codes | YES if errors occur | code | log line | NO | HIGH |
| Platform telemetry | `telemetry.js` | OTEL stub | no-op default | code | NONE | NO | HIGH |
| Product monitors/alerts | backend Phase 3 | **customer estate** uptime | product feature ≠ ARGOS self-monitor | architecture | product | product UI | HIGH |
| E2E / release acceptance | Playwright / missions | journey proof | release-time only | Mission 18 | test | NO continuous | HIGH |
| Mission 20 restore proof | docs/release | restorability | one-shot | Mission 20 | recovery evidence | NO schedule | HIGH |

**Doc age:** `docs/infrastructure/09_MONITORING.md` = **PARTIALLY_CURRENT** (mechanism matches; AI/release/Mission20 absent; formal stamp 2026-08-05).

---

## Coverage by domain (summary)

| Domain | Coverage |
|--------|----------|
| WEB_AVAILABILITY | VERIFIED_ACTIVE (HTTP≠200 → ntfy); no 5xx rate; same-host SPOF |
| API_AVAILABILITY | VERIFIED_ACTIVE (`/api/health` code+status); no 5xx spike; `/api/ready` unused by monitor |
| DATABASE | PARTIAL (container/health/SELECT1/restarts); no locks/long-query/PG data-disk/inode |
| BACKUP | VERIFIED_ACTIVE for job success/age/R2 age; MISSING restore schedule & generated≠verified |
| AI_PROVIDER | MISSING continuous detection/alert (logs only if inspected) |
| AI_COST | MISSING app observability; enforcement exists (Mission 19); provider billing UNKNOWN/external |
| HOST | VERIFIED_ACTIVE CPU/RAM/disk/docker; MISSING inode; HOST_UNREACHABLE external MISSING |
| NETWORK_TLS_DNS | VERIFIED_ACTIVE TLS expiry&lt;14d + portal/API resolve; coolify hostname OPTIONAL/HISTORICAL |
| RELEASE_DRIFT | MISSING automated; manual docker image tag only |
| SECURITY_EVENTS | PARTIAL (rate limits/guards in app; no spike alert) |
| USER_JOURNEY | RELEASE_VALIDATED only → continuous MISSING (NOT_REQUIRED for heavy synthetic) |
| LOGGING | PARTIAL (alerts active; Sep OK logs missing; unstructured console; no request correlation/SHA in logs) |

---

## Detection without alerting

| Signal | Detectable? | Human notified without manual check? |
|--------|-------------|--------------------------------------|
| Portal/API/DB/TLS/resources/backup stale | YES (~5m) | YES **if** ntfy subscriber active (inbox not proven) |
| Host completely down | NO from on-box monitor | NO |
| AI 429/5xx/auth | Only in container logs | NO |
| Release SHA drift | Manual inspect images | NO |
| New dump not restore-validated | Objects appear | NO semantic alert |
| User journey broken with health OK | Release tests only | NO |
| OK-cycle details (Sep) | Degraded log files | N/A |

---

## Blind spots (priority)

| BLIND_SPOT | CLASS | DETECTION | ALERT | BLIND_WINDOW | IMPACT | LIKELIHOOD | PRI |
|------------|-------|-----------|-------|--------------|--------|------------|-----|
| VPS unreachable / power / network | CORE_DEGRADED | none external | none | UNBOUNDED_UNTIL_MANUAL_CHECK | high | med | P1 |
| OpenAI persistent fail while core OK | AI_DEGRADED | logs only | none | UNBOUNDED_UNTIL_MANUAL_CHECK | med | med | P2 |
| Unauthorized/wrong image deploy | RELEASE_DRIFT | manual | none | UNBOUNDED_UNTIL_MANUAL_CHECK | high | low | P1 |
| Backup generated but never restore-validated | DATABASE_INCIDENT risk | job OK ≠ verified | none for semantic | until Mission-style drill | med | med | P2 |
| AI cost spike | AI_DEGRADED/ops | none local | none | UNBOUNDED… | med | med | P2 |
| Monitor OK log continuity (Sep gap) | NORMAL/ops | alerts still fire | partial | history loss | low | high | P3 |
| PG locks / connection exhaustion | DATABASE_INCIDENT | none | none | UNBOUNDED… | high | low | P2 |
| Critical journey fail with /health OK | CORE_DEGRADED | release only | none | until complaint/release | med | low | P3 |

---

## Minimum observability standard (current ARGOS)

Must answer:

1. Public web reachable — **YES** (5m + ntfy)
2. API healthy — **YES** (`/api/health`)
3. PostgreSQL healthy — **YES** (container + SELECT 1)
4. Backups succeeding — **YES** (Coolify status)
5. Backup fresh enough — **YES** (age_h & R2 age, threshold 36h)
6. VPS resource exhaustion — **YES** (CPU/RAM/disk) **except** total host death from outside
7. TLS healthy — **YES** (&lt;14d alert)
8–9. OpenAI fail / 429 — **NO**
10. AI usage abnormal — **NO**
11. Deployed release identity correct — **NO** automated
12. Repeated app failures — **PARTIAL** (container restarts; not 5xx rates)
13. Operator notified — **PARTIAL** (ntfy path YES; subscriber proof UNKNOWN)

**ARGOS_MINIMUM_OBSERVABILITY_STANDARD** = keep existing cron/ntfy; add **external** uptime for portal+API; add **AI failure** + **release SHA** signals; keep Mission 20 semantic (generated ≠ verified); **do not** deploy Prometheus/Grafana/tracing.

---

## Implementation options (gaps only)

| Gap | A reuse | B small add | C platform | Prefer |
|-----|---------|-------------|------------|--------|
| Host-down invisible | — | Free external HTTPS check (UptimeRobot/Better Stack/ cron elsewhere) → ntfy | full APM | **B** |
| AI failures invisible | docker log scrape in monitor | counter endpoint + monitor poll | OpenTelemetry | **B** (log keyword / lightweight) |
| Release drift | manual `docker ps` | monitor compares image tag to `12678f3…` | GitOps controller | **B** |
| Backup verified≠generated | Mission process | weekly restore drill cron isolated | backup SaaS | **A+B process** |
| Cost anomaly | OpenAI dashboard | export usage metadata later | FinOps platform | **A** first |
| OK log gap | fix touch/rotate in existing script | — | ELK | **A** |

Cost class for minimum baseline: **FREE / EXISTING_COST** (ntfy.sh already used). New vendor for external uptime: **optional free tier** — prefer no paid vendor.

Data exposure risk: keep metadata-only; never ship AI prompts/DB rows/cookies to ntfy; TLS issuer strings already in alerts — acceptable.

---

## Work explicitly avoided

- Prometheus / Grafana / Loki / Tempo / OTEL collectors
- New public ports / Coolify panel exposure
- Synthetic OpenAI canaries on a schedule (credit burn)
- Re-running Mission 20 restore / full E2E / visual regression
- Rewriting `09_MONITORING.md` in place
- Alerting on `origin/main != production SHA` (expected)
- Alerting on Coolify `s3_uploaded=false` alone (known false positive; offsite via rclone)

---

## Mutation attestation

```
PRODUCTION_SHA_UNCHANGED=YES
PRODUCTION_DB_MUTATED=NO
COOLIFY_MUTATED=NO
ENV_MUTATED=NO
SOURCE_MUTATED=NO
GIT_MUTATED=NO
AI_CONFIG_MUTATED=NO
DNS_MUTATED=NO
FIREWALL_MUTATED=NO
SECRET_EXPOSURE_EVENT=NO
```
