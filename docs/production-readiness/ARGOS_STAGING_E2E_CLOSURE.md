# ARGOS — Staging Full E2E Closure

```
GATE = STAGING_FULL_E2E_CLOSURE
DATE = 2026-08-26
HEAD_START = 58f69bc933291e02ec235512190f3f1db80fae14
CUSTOMER_DATA = NO
PRODUCTION = NO
```

## Preflight

- branch `feature/argos-multitenant-platform`
- HEAD matched expected
- working tree clean at start; stash preserved

## Stack

Compose staging (existing): postgres/migrate/minio/api/worker/frontend healthy; scheduler_instances=1; `/api/ready` READY.

## G12 — Tenant isolation

Script: `scripts/staging/g12-tenant-isolation.js` + `backend/scripts/staging-g12-seed.js`

| Check | Result |
|-------|--------|
| assets / monitoring / alerts / incidents | PASS (cross-tenant 404) |
| evidence | PASS (403) |
| reports meta/content | PASS (404 after APPLICATION_DEFECT fix) |
| notifications | PASS |
| client/org_admin NOC denial | PASS (403) |
| admin NOC | PASS (200) |
| agent org/asset spoof | PASS (binding unchanged) |

**G12=PASS**

### Application defect fixed

Cross-tenant `GET /api/client/reports/:id/content` returned **409** (status oracle). Now returns **404** when report is not owned by tenant (`backend/routes/clientReports.js`).

## G13 — Playwright vs staging

Config: `playwright.staging.config.ts` (no local backend with reset flags).

Harness adaptations (no staging security flags enabled):

- Soft-skip rate-limit reset when `E2E_STAGING=1`
- Unique `X-Forwarded-For` for auth isolation
- `gotoE2e` uses `domcontentloaded` (staging home never emits `load`)
- ~~NOC visual skipped without admin fixture~~ → **RESOLVED** (see `ARGOS_STAGING_FINAL_VALIDATION.md`)
- ~~Phase 7 agents skipped (staging Postgres not host-published)~~ → **RESOLVED** via staging harness E2E

| Metric | Value |
|--------|--------|
| Applicable run (smoke/auth/client/corporate/static/visual/phase7) | 36 planned |
| Passed (full run + reruns) | 33+ (auth 6, smoke 16, corporate 2, static 7, client 1, visual PUBLIC+CLIENT 2) |
| Failed unexplained application | 0 |
| Skipped | phase7 agents; NOC visual |
| Flaky | 0 observed after harness fix |

**G13=PASS_WITH_LIMITATIONS** (topology skips documented; not application regressions) — **historical**. Superseded by **G13=PASS** in `ARGOS_STAGING_FINAL_VALIDATION.md` (2026-08-26 final gate).

## Phase 8 real report pipeline

`scripts/staging/phase8-pipeline-closure.js`

| Step | Result |
|------|--------|
| request (202 QUEUED) | PASS |
| worker interrupt mid-job | PASS |
| COMPLETED + READY PDF `%PDF` | PASS |
| SHA-256 | PASS |
| REPORT_READY notification | PASS |
| stub off | PASS |
| no duplicate READY | PASS |

Worker fix: `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright` in `Dockerfile.worker` (ENVIRONMENT/APPLICATION defect — Chromium not visible to non-root user).

## CHICO / Phase 6 / Security

- CHICO unit: PASS (UNKNOWN ≠ false NORMAL)
- Phase 6 simulator: PASS (self-approval denied; L3 needs approval)
- Security red-team: PASS; `/api/test/*` → 404; flags empty

## Backup / restore post-E2E

Backup stamp `20260826T015153Z`; isolated restore PASS; SHA-256 ok; reconcile dry-run no unexpected divergence.

## Regression

- `npm run verify:backend` PASS
- frontend `tsc` PASS
- MinIO live gate SKIPPED (flag unset; intentional)

## Final

`FINAL_STATUS=PASS_WITH_LIMITATIONS` — G12 PASS; G13 limited by private Postgres (phase7) and NOC admin fixture; foundation otherwise closed.

**Update 2026-08-26:** those G13 limitations are **RESOLVED** — see `ARGOS_STAGING_FINAL_VALIDATION.md` (`FINAL_STATUS=STAGING_VALIDATED`, `G13=PASS`).
