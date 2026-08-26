# ARGOS — Staging Final Validation Closure

```
GATE = STAGING_FINAL_VALIDATION
DATE = 2026-08-26
HEAD_START = eb2159155b15725ecf1bb8d56a46760450278657
CUSTOMER_DATA = NO
PRODUCTION = NO
EXTERNAL_STAGING_DEPLOY = NO
PHASE_9 = NO
```

## Preflight

| Check | Result |
|-------|--------|
| branch | `feature/argos-multitenant-platform` |
| HEAD | `eb21591…` matched expected |
| stash | `stash@{0}` WIP Phase 3 preserved |
| Stack | FE `:3010` / API `:4010` READY |

## RESOLVED historical limitations

| Limitation (prior G13) | Status |
|------------------------|--------|
| NOC visual skipped — no admin fixture | **RESOLVED** — `/api/staging-harness` token-gated provision + real `/api/auth/login` |
| Phase 7 skipped — private Postgres | **RESOLVED** — `e2e/phase7-agents-staging.spec.ts` via harness age-agent (no host PG publish) |

Do not delete prior PASS_WITH_LIMITATIONS records; they remain historical.

## Staging harness (fail-closed)

- Mounted only when `ARGOS_ENVIRONMENT=staging` **and** `ARGOS_STAGING_HARNESS_TOKEN` ≥32 and not `CHANGE_ME`
- Never mounts for production; wrong/missing token → **404**
- Distinct from `/api/test` (still absent on staging)
- Creates synthetic `admin` + `cliente` + org + asset + incident; Playwright still uses real auth
- `POST /age-agent` ages `last_seen_at` for STALE/OFFLINE derivation
- `POST /provision-org-admin` proves `org_admin` → NOC **403**
- Local HTTP loopback: `ARGOS_COOKIE_SECURE=0` (set `1` behind TLS)

## G13 — Playwright staging suite

Config: `playwright.staging.config.ts`

| Metric | Value |
|--------|-------|
| total executed | 39 |
| passed | 38 |
| failed | 0 |
| skipped | 1 (deliberate) |
| flaky | 0 |

**Deliberate skip**

- `e2e/phase7-agents.spec.ts` (local DATABASE_URL path) — replaced by `phase7-agents-staging.spec.ts`

**Deliberate testIgnore (not counted as skips)**

- `visual-regression.spec.ts` — pixel baselines / `networkidle` hang on staging marketing; isolation covered by `visual-reconciliation` + `noc-visual-staging`
- `phase81-reports-ui.spec.ts` — local phase81 fixture seed; reports UI covered by NOC visual + Phase 8 pipeline script

**G13=PASS**

## NOC visual

Routes verified: `/noc`, `/noc/reports`, `/noc/agents`, `/noc/incidents`, `/noc/remediations`, `/noc/platform-health` + narrow viewport.

Chrome: NocShell only; no SiteHeader marketing; no cookie banner; no CHICO guardian in NOC chrome.

Screenshots: `docs/architecture/phase8-validation-artifacts/noc-*.png`

## Phase 7 agents E2E (staging)

Enrollment → heartbeat → observation → ONLINE → STALE → OFFLINE → guardian → revoke → revoked rejected; org/asset binding; replay 409; TENANT_SPOOF rejected; `/exec|/shell|/sql` → 404.

## Security proof

| Check | Result |
|-------|--------|
| role bypass | NO |
| hardcoded production admin | NO |
| `/api/test` on staging | 404 |
| harness without token | 404 |
| org_admin NOC | DENIED 403 |
| cross-tenant spoof | DENIED |
| remote execution | NO |

## Regression

| Suite | Result |
|-------|--------|
| `npm run verify:backend` | PASS |
| frontend `tsc` | PASS |
| Phase 6 simulator | PASS |
| Phase 7 unit + harness policy | PASS |
| chrome / CHICO isolation unit | PASS |
| Phase 8 pipeline closure | PASS |
| security-redteam | PASS |
| MinIO | PASS via Phase 8 evidence store (live PoC script still opt-in `ARGOS_MINIO_POC=1`) |

## Final

`FINAL_STATUS=STAGING_VALIDATED` — G13=PASS; prior limitations RESOLVED; no production / push / Phase 9.
