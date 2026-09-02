# ARGOS — Production Version Forensics 15A

**Mission:** PRODUCTION_VERSION_FORENSICS_15A
**Mode:** READ-ONLY
**Date:** 2026-08-31
**Result:** `PRODUCTION_VERSION_FORENSICS_15A = PASS`

Production is **healthy but STALE**. It is not “broken.” Do not deploy from this mission.

---

## 1. Executive verdict

| Question | Evidence-backed answer |
|----------|------------------------|
| What is production running? | Coolify apps on `deploy/production-v1` @ **`651deb54e543748e990ca28f427cbfe2ca6fbccc`** |
| Is that the approved Quiet Authority RC? | **NO** — RC lives in the **dirty worktree**, not at `HEAD` and not in production |
| Is Mission 13 AI in production? | **NO** — `/api/assistant/*` returns **404**; only legacy `/api/ai` routes exist |
| Can we deploy now? | **`SAFE_TO_DEPLOY_NOW = NO`** |
| Status label | **`STALE_VERSION`** (HTTP 200, Traefik healthy) |

---

## 2. Local Git baseline

| Field | Value |
|-------|--------|
| `LOCAL_REPO` | `/Users/allanlukasvelz/Documents/Argos-it-pro-final` |
| `origin` | `https://github.com/allanlukasvelz-spec/Argos-it-pro-final.git` |
| `LOCAL_BRANCH` | `feature/argos-multitenant-platform` |
| `LOCAL_HEAD` | `640adb048a769d3d4dd9a72f3caccd637d3a81ce` (`640adb0`) |
| `LOCAL_INDEX_EMPTY` | **YES** (staged = 0) |
| `LOCAL_WORKTREE_DIRTY` | **YES** (~45 tracked modified, ~218 untracked) |
| `origin/main` | `aa8ce1a38280f12bff86ab6395b0af930e09d805` |
| Feature vs main | **ahead 43 / behind 0** (`origin/main...HEAD` → `0 43`) |
| `origin/feature/...` | **not published** on remote |

Fetch (`git fetch --prune`) performed; working tree/index untouched.

---

## 3. Production identity (VPS `91.108.121.181` / `srv1873313`)

### Frontend (`argos-it-production-web`)

| Field | Value |
|-------|--------|
| Container | `rpp5o3j1lvbbq1wjleaqyu91-160455635362` |
| Container Id | `7a0829886986…` |
| Created | `2026-08-02T16:06:05Z` |
| Started | `2026-08-25T14:56:52Z` (still Up) |
| Image ref | `rpp5o3j1lvbbq1wjleaqyu91:651deb54e543748e990ca28f427cbfe2ca6fbccc` |
| Image Id | `sha256:9e06a7281fcc0f9e8060305e469a8ff3c2820321d23a87143d8b8d521b308c1f` |
| Image created | `2026-08-02T16:05:58Z` |
| `SOURCE_COMMIT` | `651deb54e543748e990ca28f427cbfe2ca6fbccc` |
| `COOLIFY_BRANCH` | `deploy/production-v1` |
| FQDN | `portal.argos-it.com` |
| Next `BUILD_ID` | `zUG7MLf8H0pqIGNduQpC5` |
| Coolify app id | **4** |
| Project | `argos-it-production` |
| Resource | `argos-it-production-web` |
| Environment | `production` |
| Coolify label version | `4.1.2` (label at build time) |
| Auto-deploy | **`false`** (`application_settings.is_auto_deploy_enabled`) |

### Backend (`argos-it-production-api`)

| Field | Value |
|-------|--------|
| Container | `ufcwdojnv5wajhllw0df7olg-160904406591` |
| Image ref | `ufcwdojnv5wajhllw0df7olg:651deb54e543748e990ca28f427cbfe2ca6fbccc` |
| Image Id | `sha256:2bda1de997385ffce57927cca7e75f1b8f66519066977ef64057bfac022f1ea2` |
| Created | `2026-08-02T16:09:19Z` |
| Health | **healthy** |
| `SOURCE_COMMIT` | **same** `651deb5…` |
| `COOLIFY_BRANCH` | `deploy/production-v1` |
| FQDN | `api.portal.argos-it.com` |
| Coolify app id | **3** |
| Auto-deploy | **`false`** |
| `/api/health` | HTTP **200** `{status: OK}` |

`PROD_FRONTEND_BACKEND_SOURCE_MATCH = YES` (identical `SOURCE_COMMIT` / image tag SHA).

OCI `org.opencontainers.image.revision` labels: **absent**. Revision comes from Coolify `SOURCE_COMMIT` + image tag + deployment queue.

---

## 4. Coolify source configuration (DB read-only)

| App | Repository | Branch | Base dir | Build pack | Dockerfile | `git_commit_sha` field |
|-----|------------|--------|----------|------------|------------|------------------------|
| web (4) | `allanlukasvelz-spec/Argos-it-pro-final` | `deploy/production-v1` | `/frontend` | `dockerfile` | `/Dockerfile` | literal `HEAD` (not pinned SHA) |
| api (3) | same | `deploy/production-v1` | `/backend` | `dockerfile` | `/Dockerfile` | literal `HEAD` |

Latest finished deployments (both apps):

- UUID web: `i14iy1x8w4c9bjvpswb49j2n`
- Commit: `651deb54e543748e990ca28f427cbfe2ca6fbccc`
- Message: `docs(dr): finalize production disaster recovery runbook v1.0`
- Finished: `2026-08-02 16:06:08` (web) / `16:09:42` (api)
- `is_webhook=false` (manual)

Prior finished commits in history (rollback candidates in Coolify metadata): `7be6f06…`, `a72da92…`.

Compose artifact (current runtime definition):

- `/data/coolify/applications/rpp5o3j1lvbbq1wjleaqyu91/docker-compose.yaml`
- Image pin + Traefik Host(`portal.argos-it.com`); `env_file: .env` (**not read**)
- Historical path label also referenced `/artifacts/i14iy1x8w4c9bjvpswb49j2n/frontend/docker-compose.yaml` (deployment UUID directory; may be transient)

---

## 5. Git object for production revision

```
651deb5 (tag: dr-runbook-v1.0) docs(dr): finalize production disaster recovery runbook v1.0
```

- Present on **`deploy/production-v1`** / `origin/deploy/production-v1`
- **Not** an ancestor of `origin/main` or feature `HEAD`
- `origin/deploy/production-v1` tip = `0f3b1c3` — **6 commits ahead** of running prod (all **docs** Cloudflare/CMDB; no app runtime delta in those 6)

`PRODUCTION_CONTENT_MATCH_CANDIDATE_SHA = 651deb54e543748e990ca28f427cbfe2ca6fbccc`
`MATCH_CONFIDENCE = HIGH` (container env + image tag + Coolify deployment + string match)

---

## 6. Runtime content fingerprint (`https://portal.argos-it.com`)

HTTP **200**. Title/meta still old marketing.

| Marker | In production HTML |
|--------|--------------------|
| OLD hero `Tecnología que protege, acompaña y simplifica` | **YES** |
| OLD `ARGOS Command Center` | **YES** |
| OLD CTA `Solicitar diagnóstico ARGOS` | **YES** |
| RC hero `Sistemas que no fallen cuando no deben.` | **NO** |
| RC support (`Primero entendemos…`) | **NO** |
| `Iniciar diagnóstico ARGOS` | **YES** (also exists historically as `nav.startDiagnostic` — **not** proof of RC) |
| `Conocer cómo trabajamos` | **NO** |
| `Hablar con ARGOS` | **YES** (legacy mascot copy on prod SHA HomeView — **not** Mission 13 AI launcher) |

`PROD_NEXT_BUILD_ID = zUG7MLf8H0pqIGNduQpC5`
Static fingerprint: Next `/_next/static/chunks/*` hashed assets (Turbopack chunk naming present).

---

## 7. Comparison matrix

| SOURCE | SHA | OLD_UI | RC_UI | AI (Mission 13) |
|--------|-----|--------|-------|-----------------|
| PRODUCTION | `651deb5` | YES | NO | **NONE** (404) |
| `origin/main` | `aa8ce1a` | YES | NO | NO |
| feature `HEAD` | `640adb0` | YES | NO | NO (uncommitted) |
| dirty worktree | N/A | NO (hero) | **YES** | **YES** (untracked/modified) |
| `origin/deploy/production-v1` tip | `0f3b1c3` | YES (same line as prod + docs) | NO | NO |

| Comparison | Result |
|------------|--------|
| Production matches main (content era) | **PARTIAL** — same old hero language; **different SHA / branch** |
| Production matches feature HEAD | **PARTIAL** — both lack RC hero; feature is 63 commits ahead of deploy tip lineage and **not** what Coolify builds |
| Production matches dirty worktree | **NO** |

---

## 8. Current RC / AI forensics (local)

| Check | Result |
|-------|--------|
| `CURRENT_WORKTREE_RC_PRESENT` | **YES** (frozen hero/support/CTAs in worktree `es.json`) |
| `CURRENT_WORKTREE_AI_PRESENT` | **YES** (`frontend/components/assistant/*`, `backend/routes/assistant.js`, `backend/lib/ai/*`) |
| `RC_FULLY_COMMITTED_AT_HEAD` | **NO** |
| `AI_FULLY_COMMITTED_AT_HEAD` | **NO** |
| `RC_STAGED_COUNT` | **0** |
| `RC_TRACKED_MODIFIED_COUNT` | **45** |
| `RC_UNTRACKED_COUNT` | **218** |

Deploying `feature/argos-multitenant-platform` **HEAD alone** would **not** ship the Quiet Authority RC or AI 13.

---

## 9. AI on production

| Check | Result |
|-------|--------|
| `POST /api/assistant/chat` | **404** `Cannot POST` |
| `GET /api/assistant/health` | **404** |
| Routes in container | `ai-public.js`, `ai.js` only — **no** `assistant.js` |
| `PROD_AI_ROUTE_PRESENT` | **NO** |
| `PROD_AI_IMPLEMENTATION_VERSION` | **NONE** |
| Runtime env names (API) | `OPENAI_API_KEY` **name present** (value not read); `OPENAI_MODEL`, `OPENAI_TIMEOUT_MS`, `AI_MESSAGE_MAX_LEN=6000` |
| Mission 13 extra names | Not observed in container env list: `AI_PROVIDER`, `AI_MODEL`, `AI_MAX_OUTPUT_TOKENS`, `AI_CONVERSATION_*`, `AI_CONVERSATION_MAX_TOTAL` |

Local gate still: `AI_PRODUCTION_READY = NO` (14B live activation blocked / not completed for RC AI). Production key presence for **legacy** mascot path does **not** satisfy Mission 13/14 readiness.

`MISSING_PRODUCTION_ENV_NAMES` (for future Mission 13 AI deploy, names only):
`AI_PROVIDER`, `AI_MODEL` (optional if `OPENAI_MODEL` kept), `AI_MAX_OUTPUT_TOKENS`, `AI_CONVERSATION_MAX_MESSAGES`, `AI_CONVERSATION_TTL_MS`, `AI_CONVERSATION_MAX_TOTAL`, plus verify `AI_RATE_LIMIT_*` / message max policy (`6000` prod vs `2000` example).

---

## 10. Database / migrations

| Check | Result |
|-------|--------|
| Migrations at prod SHA `651deb5` | **0** files under `database/migrations/` |
| Migrations at feature `HEAD` | **13** |
| Worktree migrations | **13** |
| `DB_MIGRATION_REQUIRED_FOR_RC` (UI-only content) | **NO** (content/UI RC does not inherently require DB) |
| `DB_MIGRATION_REQUIRED_FOR_AI` | **NO** (in-memory assistant; no migration in AI 13/14) |
| `PENDING_DB_MIGRATIONS` if deploying feature platform HEAD | **13** vs prod baseline — **must be planned separately**; not authorized here |

---

## 11. Domains

| Host | DNS (this workstation) | Notes |
|------|------------------------|-------|
| `portal.argos-it.com` | `91.108.121.181` | Production web — HTTP 200 |
| `api.portal.argos-it.com` | `91.108.121.181` | Production API — healthy |
| `staging.argos-it.es` | `91.108.121.181` | Staging frontend on same VPS |
| `coolify.argos-it.com` | **no A record** | `COOLIFY_PANEL_DNS = FAIL` |
| `argos-it.com` / `www.argos-it.com` | **no resolve here** | Marketing apex not serving from this resolver path |
| `argos-it.es` | Hostinger CDN IPs | Separate from portal |

`PUBLIC_MARKETING_DOMAIN_CONFIGURED = UNKNOWN` (apex unresolved from probe host; og:url in prod HTML still cites `https://argos-it.com`).
`PORTAL_DOMAIN_ROLE = MIXED` — named “portal” but serves public marketing site + entry to product.

Restore stack containers present on VPS (`argos-restore-*`) — separate from live prod traffic.

---

## 12. Reproducibility & rollback

| Field | Value |
|-------|--------|
| `PRODUCTION_REPRODUCIBLE` | **PARTIAL** — repo + branch + exact commit + Dockerfile base dirs known; OCI revision labels absent; Coolify stores `git_commit_sha=HEAD` (floating) while runtime pins `SOURCE_COMMIT` |
| `ROLLBACK_REFERENCE_AVAILABLE` | **YES** (Coolify deployment history + prior commits; **only current image tag** retained locally on host for web/api — image history depth = 1 tag each; `docker_images_to_keep=2`) |
| Auto-deploy | **DISABLED** |

---

## 13. Risk classification

| Severity | Count | Items |
|----------|-------|--------|
| P0 | **0** | — |
| P1 | **1** | Deploying feature/`main` without controlled reintegration would ship **wrong tree** and/or **13 unreviewed migrations** vs prod |
| P2 | **4** | Stale marketing UI vs approved RC; Mission 13 AI absent; Coolify panel DNS fail; Coolify branch tip 6 docs commits ahead of running SHA |

Semantic status: **`STALE_VERSION`**, not DOWN/BROKEN.

---

## 14. Recommended next sequence (DO NOT EXECUTE)

1. Finish **AI live provider gate (14B)** for the **Mission 13** assistant (local/backend config + live validation) — still required before claiming AI production ready.
2. **Release reintegration 15** — merge Fileset 11 RC + AI 13/14 into an explicit commit set (forensic staging; empty index until authorized).
3. Validate staged-tree build / freeze / assistant tests.
4. Commit → push branch → PR → review.
5. Decide target Coolify branch (`deploy/production-v1` vs promoted main) — **manual deploy only** (auto-deploy stays off).
6. Configure any missing AI env **names** on API only; do not expose to web.
7. Controlled deploy web+api same SHA.
8. Post-deploy smoke (portal, API health, RC hero strings, assistant route).
9. Keep Coolify prior deployment UUIDs + restore stack as rollback references.

**No step above is authorized by Mission 15A.**

---

## 15. Git integrity

- `RUNTIME_FILES_MODIFIED_BY_15A = 0`
- `INDEX_CHANGED_BY_15A = NO`
- Intended new files only:
  - `docs/release/ARGOS_PRODUCTION_VERSION_FORENSICS_15A.md`
  - `docs/release/ARGOS_PRODUCTION_VERSION_FORENSICS_15A.json`
- Commits / pushes / PRs / deploys: **0**

---

## 16. Final stop gate

```
PRODUCTION_VERSION_FORENSICS_15A = PASS

LOCAL_BRANCH = feature/argos-multitenant-platform
LOCAL_HEAD = 640adb0
LOCAL_INDEX_EMPTY = YES
LOCAL_WORKTREE_DIRTY = YES

PROD_DOMAIN = portal.argos-it.com
PROD_HTTP_STATUS = 200
PROD_STATUS = STALE_VERSION

PROD_FRONTEND_CONTAINER = rpp5o3j1lvbbq1wjleaqyu91-160455635362
PROD_FRONTEND_IMAGE_ID = sha256:9e06a7281fcc0f9e8060305e469a8ff3c2820321d23a87143d8b8d521b308c1f
PROD_FRONTEND_CONTAINER_CREATED = 2026-08-02T16:06:05Z

PROD_GIT_REVISION = 651deb54e543748e990ca28f427cbfe2ca6fbccc
PROD_SOURCE_BRANCH = deploy/production-v1
PROD_SOURCE_REPOSITORY = allanlukasvelz-spec/Argos-it-pro-final

PROD_NEXT_BUILD_ID = zUG7MLf8H0pqIGNduQpC5

OLD_HERO_PRESENT = YES
OLD_COMMAND_CENTER_PRESENT = YES
OLD_DIAGNOSTIC_CTA_PRESENT = YES
RC_HERO_PRESENT_IN_PROD = NO
RC_PRIMARY_CTA_PRESENT_IN_PROD = YES
AI_LAUNCHER_PRESENT_IN_PROD = YES

CURRENT_WORKTREE_RC_PRESENT = YES
CURRENT_WORKTREE_AI_PRESENT = YES
RC_FULLY_COMMITTED_AT_HEAD = NO
AI_FULLY_COMMITTED_AT_HEAD = NO

MAIN_HAS_RC = NO
FEATURE_HEAD_HAS_RC = NO

PRODUCTION_MATCHES_MAIN = PARTIAL
PRODUCTION_MATCHES_FEATURE_HEAD = PARTIAL
PRODUCTION_MATCHES_DIRTY_WORKTREE = NO

PROD_BACKEND_CONTAINER = ufcwdojnv5wajhllw0df7olg-160904406591
PROD_FRONTEND_BACKEND_SOURCE_MATCH = YES

PROD_AI_ROUTE_PRESENT = NO
PROD_AI_IMPLEMENTATION_VERSION = NONE

PENDING_DB_MIGRATIONS = 13
DB_MIGRATION_REQUIRED_FOR_RC = NO
DB_MIGRATION_REQUIRED_FOR_AI = NO

AUTO_DEPLOY = DISABLED
COOLIFY_PANEL_DNS = FAIL
PRODUCTION_REPRODUCIBLE = PARTIAL
ROLLBACK_REFERENCE_AVAILABLE = YES

P0 = 0
P1 = 1
P2 = 4

SAFE_TO_DEPLOY_NOW = NO
AI_PRODUCTION_READY = NO
READY_FOR_RELEASE_REINTEGRATION_15 = NO

INDEX_CHANGED_BY_15A = NO
COMMITS_CREATED = 0
PUSHES_PERFORMED = 0
PRS_CREATED = 0
DEPLOYS_PERFORMED = 0

AUTHORIZED_TO_STAGE = NO
AUTHORIZED_TO_COMMIT = NO
AUTHORIZED_TO_PUSH = NO
AUTHORIZED_TO_CREATE_PR = NO
AUTHORIZED_TO_DEPLOY = NO
```

DO NOT STAGE. DO NOT COMMIT. DO NOT PUSH. DO NOT CREATE PR. DO NOT DEPLOY.
**STOP.**
