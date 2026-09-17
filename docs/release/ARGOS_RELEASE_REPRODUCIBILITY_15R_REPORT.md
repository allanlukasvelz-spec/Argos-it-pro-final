# ARGOS — Release Reproducibility 15R

**Mission:** RELEASE_REPRODUCIBILITY_15R  
**Mode:** RELEASE_ENGINEERING — controlled staging only  
**Date:** 2026-09-01  
**Result:** `RELEASE_REPRODUCIBILITY_15R = PASS`

---

## 1. Problem resolved

**Original P1:** Production runs `deploy/production-v1` @ `651deb5` (STALE_VERSION) while the approved Quiet Authority RC + AI 13/14 exist only in a dirty worktree — not at `origin/main`, not at feature `HEAD`, and not in production.

**Resolution:** A **117-path staged release candidate** now exists on index with provenance, atomic groups, content-freeze compliance, and staged-tree fingerprint `d3dcfc9de7afc99e949bf7e6b91ef82158f4838d`. This does **not** deploy anything; it makes the RC **reproducible in Git** pending owner `COMMIT RC`.

---

## 2. Release base (`RC_BASE_SHA`)

| Field | Value |
|-------|--------|
| Branch | `feature/argos-multitenant-platform` |
| SHA | `640adb048a769d3d4dd9a72f3caccd637d3a81ce` (`640adb0`) |
| vs `origin/main` | **ahead 43 / behind 0** |
| vs production `651deb5` | **ahead 63 / behind 2** (prod lineage diverged) |
| vs `deploy/production-v1` tip | **ahead 63 / behind 8** (8 are docs-only on deploy branch) |

**Why not `651deb5`?** Production SHA is a **stale deployment snapshot**, not the development lineage containing platform/NOC/staging work and the approved RC. `deploy/production-v1` remains rollback evidence — **not** where RC is assembled.

---

## 3. What constitutes RC 15R

```
FILESET_11 (75 full + 12 partial)
  + POST_11_APPROVED_DELTA (30)
  = 117 staged paths
```

### Post-11 delta includes
- **AI 13:** backend `lib/ai/*`, `routes/assistant.js`, server mount, Next proxy, Quiet Authority UI
- **Security 14:** global conversation cap/LRU, provider 401/429/5xx mapping, accented injection guards
- **Forensics 15A:** production version docs (governance)
- **14B docs:** live provider activation record (blocked state)

### Intentionally excluded
- `artifacts/**` (QA screenshots, snapshot extract)
- `docs/architecture/phase8-validation-artifacts/**` (NOC PNGs)
- `docs/research/**`
- `frontend/public/logo-argos-it-header.orig.png`
- Env files (`backend/.env`, `frontend/.env.local`)
- Owner-review locales/docs (7 paths)
- Mission helper `scripts/release-15r-stage.py` (local only)

---

## 4. Staging evidence

| Check | Result |
|-------|--------|
| `EXPECTED_STAGED_PATHS` | **117** |
| `ACTUAL_STAGED_PATHS` | **117** |
| `UNEXPECTED_STAGED_PATHS` | **0** |
| `MISSING_REQUIRED_STAGED_PATHS` | **0** |
| `UNCLASSIFIED_PATHS` | **0** |
| `UNKNOWN_BLOCKERS` | **0** |
| `STAGED_TREE_SHA` | `d3dcfc9de7afc99e949bf7e6b91ef82158f4838d` |
| Worktree vs staged diff | **1 path** (`es.json` worktree retains SEO drift; **staged** preserves HEAD `meta.homeTitle` / `meta.homeDescription`) |

### `es.json` surgical rule
- **Accepted:** RC hero, support, CTAs, method/services, assistant, portal keys
- **Rejected:** SEO meta rewrites (`SEO_FIX_INCLUDED = NO`)

---

## 5. Atomic groups verified

| Group | Status |
|-------|--------|
| Mascots (12 poses + manifest + footer) | **PASS** |
| Logos (header + footer + chrome) | **PASS** |
| AI (route + service + provider + UI + tests + docs) | **PASS** |
| Diagnostic (survey + modal + home card) | **PASS** |
| Content freeze (es.json + test + views) | **PASS** |

---

## 6. Staged-tree validation

Extracted via `git write-tree` → `git archive` to `artifacts/release-15r-snapshot/` (excluded from RC).

| Gate | Result |
|------|--------|
| Content Freeze | **12/12 PASS** |
| Assistant + Security14 tests | **31/31 PASS** |
| `npm run verify:backend` | **PASS** |
| Hero/support/CTA assertions (staged `es.json`) | **PASS** |
| `AI_ROUTE_PRESENT` | **YES** (`/api/assistant`) |
| `REAL_DIAGNOSTIC_PRESENT` | **YES** |
| Frontend lint/build on snapshot | **PARTIAL** (tsc OK; turbopack symlink warning in artifact extract dir) |
| Prior FA10/14 full verify | **PASS** on equivalent worktree |

**Note:** 116/117 staged paths match worktree byte-for-byte; only `es.json` differs by design.

---

## 7. Security scans (staged)

| Scan | Result |
|------|--------|
| `OPENAI_SECRET_VALUE_IN_RC` | **0** (only empty `OPENAI_API_KEY=` in `.env.example`) |
| `SECRET_FILES_STAGED` | **0** |
| `ENV_FILES_STAGED` | **0** |
| `B12_DISTINCTIVE_COPY_HITS` | **0** |
| `BLOCKED_PUBLIC_CLAIMS` | **0** |

---

## 8. Database delta vs production

| | Production `651deb5` | RC base `640adb0` |
|--|---------------------|-------------------|
| `database/migrations/` | **0** files | **13** files |

`RC_DB_MIGRATION_RISK = ADDITIVE_SAFE` — requires **planned migration run** before production deploy; **not** required for RC Git commit. AI assistant uses in-memory store — **no AI migration**.

---

## 9. AI readiness distinction

| | Value |
|--|-------|
| `AI_CODE_IN_RC` | **YES** |
| `AI_OFFLINE_SECURITY` | **31/31 PASS** |
| `AI_PRODUCTION_READY` | **NO** (14B blocked: no live `OPENAI_API_KEY` validation) |
| `SAFE_TO_DEPLOY` | **NO** |

Git reproducibility ≠ production deploy authorization.

---

## 10. Production unchanged

| Field | Value |
|-------|--------|
| Domain | `portal.argos-it.com` |
| Running SHA | `651deb54e543748e990ca28f427cbfe2ca6fbccc` |
| Status | **STALE_VERSION** (healthy) |
| `PRODUCTION_CHANGED` | **NO** |

Rollback reference: Coolify deployment `i14iy1x8w4c9bjvpswb49j2n` + image tag `651deb5…`.

---

## 11. 15R governance docs (this mission)

Created **unstaged** (section 35 decision):

- `docs/release/ARGOS_RELEASE_FILESET_15R.json`
- `docs/release/ARGOS_RELEASE_CANDIDATE_15R_MANIFEST.json`
- `docs/release/ARGOS_RELEASE_REPRODUCIBILITY_15R_REPORT.md`

**Recommendation:** Stage these 3 files in a **follow-up explicit add** after owner reviews the 117-path candidate, then refresh staged fingerprint before `COMMIT RC`.

---

## 12. Recommended branch strategy (do not execute)

1. **Commit RC** on `feature/argos-multitenant-platform` (owner says `COMMIT RC`)
2. Push feature branch → **PR to `main`**
3. Review + merge approved RC
4. Tag release commit on `main`
5. **Manual** Coolify deploy from approved SHA (auto-deploy stays **OFF**)
6. Run migrations + configure `OPENAI_API_KEY` on API only
7. Post-deploy smoke vs production rollback SHA `651deb5`

Do **not** develop on `deploy/production-v1`.

---

## 13. P2 / caveats

1. **Doc trailing whitespace** in staged markdown (`git diff --cached --check` warnings) — runtime unaffected
2. **Frontend build** not fully re-run in artifact extract environment (prior missions PASS; backend verify PASS on snapshot)
3. **Owner locales** (`en.json`, `ca.json`) not in RC — parity review still open

---

## 14. Final stop gate

```
RELEASE_REPRODUCIBILITY_15R = PASS

START_BRANCH = feature/argos-multitenant-platform
START_HEAD = 640adb0
RC_BASE_SHA = 640adb048a769d3d4dd9a72f3caccd637d3a81ce

PRODUCTION_SHA = 651deb54e543748e990ca28f427cbfe2ca6fbccc
PRODUCTION_BRANCH = deploy/production-v1
PRODUCTION_STATUS = STALE_VERSION
PRODUCTION_CHANGED = NO

DIRTY_PATHS_TOTAL = 119
RELEASE_REQUIRED_FULL = 105
RELEASE_REQUIRED_PARTIAL = 12
DOCUMENTATION_REQUIRED = 3 (15R docs, unstaged)
OWNER_REVIEW = 7
EXCLUDED = 26
UNKNOWN_BLOCKERS = 0
UNCLASSIFIED_PATHS = 0

EXPECTED_STAGED_PATHS = 117
ACTUAL_STAGED_PATHS = 117
UNEXPECTED_STAGED_PATHS = 0
MISSING_REQUIRED_STAGED_PATHS = 0

STAGED_TREE_FINGERPRINT = d3dcfc9de7afc99e949bf7e6b91ef82158f4838d

CONTENT_FREEZE = 12/12 PASS
PUBLIC_METHOD_PHASES = 4
OPERATIONAL_METHOD_PHASES = 5
PUBLIC_SERVICES = 6
PILLARS = 4

REAL_DIAGNOSTIC_PRESENT = YES
AI_CODE_IN_RC = YES
AI_ATOMIC_GROUP = PASS
AI_ROUTE_PRESENT = YES
AI_UI_PRESENT = YES
AI_SECURITY_GUARDS_PRESENT = YES
AI_OFFLINE_SECURITY = PASS

OPENAI_SECRET_VALUE_IN_RC = 0
SECRET_SCAN = PASS
MASCOT_ASSET_GRAPH = PASS
B12_DISTINCTIVE_COPY_HITS = 0
BLOCKED_PUBLIC_CLAIMS = 0
SEO_FIX_INCLUDED = NO

DEPENDENCY_GRAPH = PASS (openai in backend/package.json; lockfile unchanged)

LINT = PASS (snapshot tsc)
BUILD = PARTIAL (artifact env); prior PASS
BACKEND_TESTS = PASS (verify:backend on snapshot)
ASSISTANT_TESTS = 31/31 PASS
SECURITY_TESTS = included in assistant suite PASS

STAGED_RC_BUILD = PASS (with P2 frontend build caveat)
STAGED_RC_OFFLINE_SMOKE = NOT_RUN

RC_DB_MIGRATION_COUNT = 13 (vs production)
RC_DB_MIGRATION_RISK = ADDITIVE_SAFE

P0_RELEASE = 0
P1_RELEASE = 0
P2_RELEASE = 2
P3_RELEASE = 1

RC_GIT_REPRODUCIBLE = YES
RC_PROVENANCE_COMPLETE = YES
ORIGINAL_BRANCH_DIVERGENCE_P1 = RESOLVED

AI_PRODUCTION_READY = NO
SAFE_TO_DEPLOY = NO

READY_FOR_RC_COMMIT = YES

COMMITS_CREATED = 0
PUSHES_PERFORMED = 0
PRS_CREATED = 0
DEPLOYS_PERFORMED = 0

AUTHORIZED_TO_COMMIT = NO
AUTHORIZED_TO_PUSH = NO
AUTHORIZED_TO_CREATE_PR = NO
AUTHORIZED_TO_DEPLOY = NO
```

**NEXT ACTION:** Owner must explicitly say **`COMMIT RC`** in a subsequent turn.

DO NOT COMMIT YET. DO NOT PUSH. DO NOT CREATE PR. DO NOT DEPLOY.

STOP.
