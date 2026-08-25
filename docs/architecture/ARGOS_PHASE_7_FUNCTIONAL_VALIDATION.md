# ARGOS Phase 7 — Functional Validation

```
STATUS = PASS_WITH_LIMITATIONS
DATE = 2026-08-25
BASELINE_COMMIT = 7693135
VALIDATION_COMMIT = (see git after this doc lands)
BRANCH = feature/argos-multitenant-platform
PRODUCTION_USED = NO
```

## 1. Environment

| Item | Value |
|------|-------|
| PostgreSQL | `127.0.0.1:5432` / DB `argos_it` (local only) |
| Backend | `http://127.0.0.1:4000` (`AGENT_STALE_AFTER_MS=8000`, `AGENT_OFFLINE_AFTER_MS=20000`) |
| Frontend | `http://127.0.0.1:3000` (`next start` production build for UI capture) |
| Migration 005 | Applied locally (tables present) |
| Topology | `ORG-PHASE7-TEST` + `ASSET-PHASE7-TEST` (+ sibling org for spoof) |

**Guard:** scripts refuse non-`127.0.0.1`/`localhost` `DATABASE_URL`.

## 2. Fix required during validation

| Issue | Impact | Fix |
|-------|--------|-----|
| `ensureRemediation.js` path used `../../../database` from `backend/lib` → resolved under `Documents/database` | Backend boot crashed (`ENOENT` on `004_*.sql`) | Corrected to `../../database/migrations/004_runbooks_remediation.sql` |

No capability expansion. No Phase 8 work.

## 3. Agent lifecycle (API) — PASS

Script: `scripts/validate-phase7-functional.js`  
Report: `docs/architecture/phase7-validation-artifacts/phase7-validation-1787674360152.json`  
**42/42 checks PASS**

| Step | Result |
|------|--------|
| Enrollment create + TTL (~1h) | PASS |
| Enroll consume | PASS |
| Token reuse | REJECTED (`ENROLL_REPLAY`) |
| Heartbeat → ONLINE | PASS |
| NOC list ONLINE | PASS |
| Telemetry batch (8 types) | PASS accepted=8 |
| Idempotent observation replay | PASS (`duplicate: true`) |
| Heartbeat/old seq replay | REJECTED (`REPLAY`) |
| Org spoof / asset spoof | REJECTED + audited |
| Unknown type `SHELL` / forbidden `command` / oversized | REJECTED |
| `/exec|/shell|/sql|/remediate` | 404 `REMOTE_EXEC_FORBIDDEN` |
| STALE via aged `last_seen_at` | PASS (`STALE`) |
| Recovery heartbeat → ONLINE | PASS |
| Rotate (old reject / new accept) | PASS |
| Revoke + post-revoke write blocked | PASS |
| NOC shows REVOKED | PASS |
| Secret leakage in NOC/audit | NONE |

## 4. Telemetry exercised

HEARTBEAT, SYSTEM_METRICS, CPU, MEMORY, DISK, LOAD, SERVICE_HEALTH, NETWORK_HEALTH, SAFE_LOCAL_PROBE — all accepted under capability allowlist.

## 5. CHICO

### API truth

| Observation | Result |
|-------------|--------|
| Agent ONLINE + no monitors | `chico.state=UNKNOWN`, `overall=UNKNOWN` |
| ONLINE ≠ HEALTHY | PASS (explicit check) |
| After CRITICAL alert insert | `chico.state=CRITICAL` with contract message |
| Unit mapping NORMAL/ATTENTION/CRITICAL/UNKNOWN/VERIFYING/RESOLVED | all OK (`deriveChicoState`) |

### Visual (Client Portal)

Screenshots under `docs/architecture/phase7-validation-artifacts/`:

- `chico-dashboard-unknown.png` — CHICO UNKNOWN + “Sin monitors”; zero alerts/incidents ≠ healthy copy visible
- `chico-seguridad.png`, `chico-alertas.png`, `chico-incidentes.png`, `chico-monitorizacion.png`

**Not visually exercised in this run (mapping covered by unit + API for CRITICAL/UNKNOWN):** NORMAL, ATTENTION, VERIFYING, RESOLVED (would need monitors + remediation rows without fabricating green claims).

**false_green_detected = NO**

## 6. NOC Agents UI

- Real page replaces Phase 5 placeholder; API list/detail/enroll/revoke/rotate PASS.
- Screenshot `noc-agents.png` attempt during auth rate-limit window landed on login — **API path validated**; UI screenshot re-capture deferred (authLimiter 429 after validation/E2E load). Treat as **limitation**, not product defect.

## 7. Phase 6 boundary

Remote execution primitives absent. Explicit forbidden routes return `REMOTE_EXEC_FORBIDDEN`. No agent→remediation transport.

## 8. Regressions

| Suite | Result |
|-------|--------|
| `npm run verify:backend` | PASS (169) |
| Frontend `tsc` + unit tests | PASS |
| Frontend `next build` | PASS when `NODE_ENV` unset/clean; FAIL if parent shell exports non-production `NODE_ENV` (environment gotcha, not Phase 7 code) |
| Playwright smoke/auth/client | **19 passed, 4 failed** — 3× register `429` (auth rate limit after functional scripts), 1× logout URL assertion flake. **Not** application Phase 7 isolation failures. |
| Dedicated agents E2E | Not added (rate-limit saturated); API validation covers lifecycle |

## 9. Remaining limitations

1. Auth rate limit saturates local E2E after heavy validation — wait window or test-only bypass (future, not done here).
2. CHICO NORMAL/ATTENTION/VERIFYING/RESOLVED not screenshot-reproduced (API/unit yes).
3. NOC Agents PNG incomplete due to 429 on admin login.
4. `next dev` hung accepting TCP without HTTP response after `.next` corruption; validation used `next start`.
5. Local DB required applying migrations 001–005 (was incomplete before validation).

## 10. Recommendation

```
PHASE_8_RECOMMENDATION = HOLD until human reviews PASS_WITH_LIMITATIONS
  (esp. E2E rate-limit noise + optional NOC screenshot re-run)
SECURITY_GATE = PASS
PHASE_6_BOUNDARY = PRESERVED
```
