# ARGOS Production Baseline 18

**Mission:** POST-RELEASE PRODUCTION FREEZE & OPERATIONS BASELINE
**Timestamp (UTC):** 2026-09-03T03:31:32Z
**Mode:** READ-ONLY verify / document / monitor
**Status:** LIVE_AND_VALIDATED

## Canonical release (write-protected)

| Field | Value |
|-------|-------|
| PRODUCTION_SHA | `12678f37997479b6f58f11b16947a14e40309910` |
| PRODUCTION_TREE | `e0d7bfa767576e2b6846d44600da23df3511db19` |
| SOURCE_BRANCH | `deploy/production-v1` |
| Production web | https://portal.argos-it.com |
| Production API | https://api.portal.argos-it.com |

## Observed identity

| Check | Result |
|-------|--------|
| Remote `origin/deploy/production-v1` | `12678f37997479b6f58f11b16947a14e40309910` |
| Remote deploy tree | `e0d7bfa767576e2b6846d44600da23df3511db19` |
| Remote `origin/main` | `a2fe6139a3ccde6006d7a9475c293b8f89b64d50` (expected divergence; not production runtime) |
| Web running image SHA | `12678f37997479b6f58f11b16947a14e40309910` |
| API running image SHA | `12678f37997479b6f58f11b16947a14e40309910` |
| Coolify API/Web git branch | `deploy/production-v1` |
| RELEASE_IDENTITY_MATCH | YES |
| TREE_IDENTITY_MATCH | YES |
| SOURCE_BRANCH_MATCH | YES |

## Core health

| Surface | Result |
|---------|--------|
| Web HTTP checks | 5/5 = 200 |
| API `/api/health` | 5/5 = 200 (`OK`, `db=connected`) |
| API restart loop | NO (`restartCount=0`, healthy) |
| Web restart loop | NO (`restartCount=0`) |
| Critical runtime log hits (30m) | 0 (API), 0 (Web) |

## AI production baseline

| Field | Value |
|-------|-------|
| AI_PRODUCT_MODE | LIVE |
| AI_PRODUCTION_READY | YES |
| AI_PROVIDER_EFFECTIVE_STATE | LIVE (`AI_PROVIDER` absent/empty → OpenAI when key present) |
| OPENAI_API_KEY_AVAILABLE | YES (runtime nonempty; buildtime no) |
| OPENAI_API_KEY_VALUE_EXPOSED | NO |
| Frontend / NEXT_PUBLIC AI secret | NO |
| Canary HTTP | 200 |
| Canary grounded / blocked claims / secret / prompt leak | YES / NO / NO / NO |

## UX smoke (bounded)

HOME / SERVICES / METHOD / ABOUT (`/sobre-argos-it`) / CONTACT = PASS
DIAGNOSTIC_OPEN / DIAGNOSTIC_FUNCTIONAL = PASS
AI_LAUNCHER / PANEL_OPEN / RESPONSE_RENDER / CLOSE = PASS
Desktop & 390px: nav not occluded; horizontal overflow = 0
Open assistant uses intentional fixed drawer overlay of lower viewport (expected).

## Security smoke (bounded)

- Unauthenticated `/api/admin*`, `/api/noc`, `/api/internal`, `/api/agents` → HTTP 404 (not publicly open admin surfaces).
- Auth routes are POST-only (`/login`, `/refresh`, `/logout`, `/register`); no public `/api/auth/me`.
- No `OPENAI_API_KEY` / `NEXT_PUBLIC_*OPENAI` / `sk-…` patterns in frontend source or home HTML.

## Database

| Field | Value |
|-------|-------|
| DATABASE_HEALTH | PASS (API health + direct query OK) |
| Public table count (observed) | 12 |
| NO_SCHEMA_CHANGE_SINCE_RELEASE | YES (no migration executed; release identity unchanged) |
| MIGRATION_REQUIRED | NO |
| Latest verified pre-release backup | `pg-dump-postgres-1788332702.dmp` |
| Backup size | 38241 |
| Backup SHA-256 | `cad6b1d77e721bb1ade53da64622de56556efbd094f19f8a3a1e019f68a4c003` |
| Newer dump present (listing) | `pg-dump-postgres-1788393629.dmp` (2026-09-03) |

No credentials included.

## Rollback readiness

| Field | Value |
|-------|-------|
| Tag | `production/rollback-2026-09-02-651deb54` |
| Resolves to | `651deb54e543748e990ca28f427cbfe2ca6fbccc` |
| ROLLBACK_REFERENCE_VALID | YES |
| ROLLBACK_EXECUTED | NO |

### Semantic rollback hierarchy

1. **LEVEL_1 — AI-specific failure**
   Set `AI_PROVIDER=none` on production API only → apply via API restart if needed → preserve current application release `12678f3…`.

2. **LEVEL_2 — Application runtime regression**
   Controlled application rollback to tag `production/rollback-2026-09-02-651deb54` (or later approved app rollback point).

3. **LEVEL_3 — Database incident**
   Separate DB recovery from verified dump metadata; never infer DB rollback from app rollback.

## Drift

UNEXPLAINED_PRODUCTION_DRIFT = 0

Expected non-issues:

- `origin/main` ≠ production SHA (branch lineage difference).
- Local original worktree historically dirty (not production).
- RC worktree may have local untracked artifacts (not production).

## Operating classes

| Class | Condition | Response |
|-------|-----------|----------|
| NORMAL | Web+API healthy, AI canary healthy, release identity unchanged | Monitor only |
| AI_DEGRADED | Core healthy; AI provider unavailable | Fail AI closed (`AI_PROVIDER=none`); preserve core release; investigate provider independently |
| CORE_DEGRADED | Web/API application failure | Incident analysis before rollback |
| RELEASE_DRIFT | Runtime SHA/tree ≠ canonical | STOP deployments; forensic reconciliation |
| DATABASE_INCIDENT | DB health/integrity problem | Separate DB recovery workflow |

Never mix incident classes.

## Mission mutation attestation

PRODUCTION_MUTATED_BY_MISSION = NO
COOLIFY_CONFIG_MUTATED = NO
ENVIRONMENT_MUTATED = NO
SOURCE_CODE_MUTATED = NO
GIT_MUTATED = NO
DATABASE_MUTATED = NO
WEB_RELEASE_MUTATED = NO
API_RELEASE_MUTATED = NO

This report must remain **UNSTAGED**. No commit authorized for Mission 18.
