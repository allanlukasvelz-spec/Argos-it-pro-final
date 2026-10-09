# ARGOS Phase 7 — Functional Validation

```
STATUS = PASS (Phase 7.1 closure)
DATE = 2026-08-25
BASELINE_COMMIT = 7693135
VALIDATION_COMMIT = 3f3cce2
CLOSURE_BASELINE_HEAD = 339bf05
BRANCH = feature/argos-multitenant-platform
PRODUCTION_USED = NO
```

## 1. Environment

| Item | Value |
|------|-------|
| PostgreSQL | `127.0.0.1:5432` / DB `argos_it` (local only) |
| Backend | `http://127.0.0.1:4000` (`ARGOS_ALLOW_RATE_LIMIT_RESET=1`, `AUTH_RATE_LIMIT_MAX=8`) |
| Frontend | `http://127.0.0.1:3000` (`next start`) |
| Migration 005 | Applied locally |
| Topology | `ORG-PHASE7-TEST` / `ORG-PHASE71-TEST` + assets TEST only |

**Guard:** validation scripts refuse non-`127.0.0.1`/`localhost` `DATABASE_URL`.

## 2. Fixes during validation / Phase 7.1 closure

| Issue | Classification | Fix | Security impact |
|-------|----------------|-----|-----------------|
| `ensureRemediation.js` wrong migration path | boot blocker | `../../database/migrations/004_…` | none |
| Auth `429` after validation/E2E load | `IP_BASED_LIMIT` + `SHARED_COUNTER_STATE` + `PROCESS_REUSE` + `TEST_ISOLATION` | Resettable in-memory stores + gated `POST /api/test/reset-rate-limits` when `ARGOS_ALLOW_RATE_LIMIT_RESET=1` and `NODE_ENV≠production`; Playwright `globalSetup` + `beforeEach` reset; production `AUTH_RATE_LIMIT_MAX=8` unchanged | **none** — production limits unchanged; reset route absent in production |
| E2E client-portal strict-mode flake | locator | `.first()` on NOT_AVAILABLE copy | none |
| Backend boot hang on `require("openai")` (local env) | OTHER (dependency load) | Lazy-load OpenAI inside `getOpenAIClient()` | none — AI still gated by key; not auth bypass |

No capability expansion. No Phase 8 work. Auth rate limiting **not** removed.

### Rate-limit root cause (detail)

- `authLimiter` keys by client IP (default).
- Local validation scripts + Playwright share `127.0.0.1`.
- In-memory counters persist for the process lifetime (`PROCESS_REUSE` when `reuseExistingServer`).
- Default max **8** / 15 min is correct for production; suites exceeded it without isolation → `429`.

**Allowed fix applied:** deterministic store reset for local/test only.

## 3. Agent lifecycle (API) — PASS

Script: `scripts/validate-phase7-functional.js` (prior run 42/42)  
Phase 7.1 E2E: `e2e/phase7-agents.spec.ts` — enrollment → heartbeat → NOC ONLINE → CHICO → revoke → post-revoke reject.

## 4. Telemetry exercised

HEARTBEAT, SYSTEM_METRICS, CPU, MEMORY, DISK, LOAD, SERVICE_HEALTH, NETWORK_HEALTH, SAFE_LOCAL_PROBE — prior functional script PASS.

## 5. CHICO visual (Phase 7.1)

Artifacts: `docs/architecture/phase7-validation-artifacts/phase71/`  
Meta: `capture-meta.json` (API state matched DOM for all six).

| State | Result | File |
|-------|--------|------|
| UNKNOWN | PASS | `chico-unknown.png` |
| NORMAL | PASS | `chico-normal.png` |
| ATTENTION | PASS | `chico-attention.png` |
| CRITICAL | PASS | `chico-critical.png` |
| VERIFYING | PASS | `chico-verifying.png` |
| RESOLVED | PASS | `chico-resolved.png` |

Seeded via local DB evidence only (monitors/observations/alerts/incidents/remediation_executions). **false_green_detected = NO**.

## 6. NOC visual (Phase 7.1)

| Capture | File |
|---------|------|
| Agents list (ONLINE visible) | `noc-agents-list.png` |
| Enrollment form | `noc-enrollment.png` |
| Agent detail | `noc-agent-detail.png` |
| Stale (aged `last_seen_at` TEST) | `noc-agent-stale.png` |
| Revoked | `noc-agent-revoked.png` |

## 7. Phase 6 boundary

`POST /api/agent/v1/{exec,shell}` → **404** `REMOTE_EXEC_FORBIDDEN`. Remotes remediation via agent absent.

## 8. Regressions (Phase 7.1)

| Suite | Result |
|-------|--------|
| `npm run verify:backend` | PASS (**171** tests) |
| Frontend `tsc` | PASS |
| Frontend unit tests | PASS (8) |
| Frontend `next build` | PASS (clean `.next`) |
| Playwright smoke + auth + client + phase7-agents | **24 passed / 0 failed** |

## 9. Remaining limitations

1. `POST /api/test/reset-rate-limits` requires explicit local flag; reused production-like backends without the flag will still 429 under load (by design).
2. `require("openai")` can hang in some local Node environments; lazy-load avoids boot block; first AI call may still pay that cost.
3. Visual STALE used DB aging of `last_seen_at` (TEST-supported), not a long wall-clock wait.

## 10. Recommendation

```
PHASE_8_RECOMMENDATION = HOLD for human review (validation closed; product Phase 8 not started)
SECURITY_GATE = PASS
PHASE_6_BOUNDARY = PRESERVED
```
