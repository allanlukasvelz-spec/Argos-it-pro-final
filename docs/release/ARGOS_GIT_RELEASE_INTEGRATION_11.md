# ARGOS GIT RELEASE INTEGRATION 11

**Mission:** FORENSIC STAGING PLAN + APPROVED CHANGESET ISOLATION
**Mode:** READ-ONLY Git — NO STAGE — NO COMMIT — NO PUSH — NO PR — NO DEPLOY
**Timestamp (UTC):** 2026-08-31T17:50:00Z
**Verdict:** `GIT_RELEASE_INTEGRATION_11 = PASS`
**Machine fileset:** `docs/release/ARGOS_RELEASE_FILESET_11.json`

---

# Executive Verdict

FINAL_ACCEPTANCE_10 remains **PASS**. The dirty tree (~42 modified + ~67 untracked porcelain) can be isolated into an explicit release fileset:

- **75** whole-file INCLUDE paths
- **12** PARTIAL (hunk-plan) paths — especially `es.json` (reject SEO meta hunks)
- **30** hard EXCLUDE paths/groups
- **7** OWNER_REVIEW paths

No sensitive files are proposed for release. Required logos and 12 untracked runtime mascot poses are accounted for. Index was empty at start and must stay empty after this mission.

`READY_FOR_CONTROLLED_STAGING_12 = YES`
`AUTHORIZED_TO_COMMIT = NO` · `AUTHORIZED_TO_PUSH = NO` · `AUTHORIZED_TO_DEPLOY = NO`

---

# Repository State

| Field | Value |
|-------|-------|
| `CURRENT_BRANCH` | `feature/argos-multitenant-platform` |
| `CURRENT_HEAD` | `640adb0` (`640adb048a769d3d4dd9a72f3caccd637d3a81ce`) |
| Tracked modified | **42** |
| Untracked porcelain | **67** (FA10 had 66; `docs/release/` added by FA10) |
| Staged initial | **0** |
| Cached diff bytes | **0** |
| Index fingerprint | empty (`INDEX_CHANGED_BY_INTEGRATION_11 = NO` required at end) |
| Lockfiles dirty | **No** (`package.json` only: freeze test hook) |

---

# Final Acceptance Baseline

From `docs/release/ARGOS_RELEASE_MANIFEST_10.json` / FA10 report:

| Gate | Value |
|------|-------|
| FINAL_ACCEPTANCE_10 | PASS |
| P0 / P1 / P2 | 0 / 0 / 0 |
| CONTENT_FREEZE | 12/12 PASS |
| LINT / BUILD | PASS |
| READY_FOR_PR | YES |
| READY_FOR_DEPLOY | NO |
| AUTHORIZED_TO_DEPLOY | NO |

---

# Complete Dirty-Tree Inventory

## Tracked modified (42)

| PATH | PROVENANCE | MISSION | COMMIT_POLICY | STAGING_MODE | RISK |
|------|------------|---------|---------------|--------------|------|
| `docs/architecture/.../noc-*.png` (×6) | PREEXISTING_UNRELATED | none | EXCLUDE | — | Low if excluded |
| `docs/design/ARGOS_FRONTEND_SOURCE_OF_TRUTH_RECONCILIATION.md` | PREEXISTING_RELATED / docs | pre-RC | OWNER_REVIEW | — | Medium |
| `e2e/corporate-chrome.spec.ts` | APPROVED_ARGOS | 04+chrome | INCLUDE | full | Low |
| `e2e/smoke.spec.ts` | APPROVED_ARGOS | chrome/mascot | INCLUDE | full | Low |
| `e2e/static-banner.spec.ts` | APPROVED_ARGOS | chrome | INCLUDE | full | Low |
| `frontend/ai/mascotStates.ts` | APPROVED_ARGOS | 06 | INCLUDE | full | Low |
| `frontend/app/globals.css` | APPROVED_ARGOS | 07 | INCLUDE | full | Low |
| `frontend/assets/css/argos-corporate.css` | MIXED | adoption+04–09 | PARTIAL_ONLY | `-p` | High complexity |
| `frontend/components/ArgosExplainerAnimation.tsx` | APPROVED_ARGOS | visual | INCLUDE | full | Low |
| `frontend/components/ClientAssistants.tsx` | APPROVED_ARGOS | chrome | INCLUDE | full | Low |
| `frontend/components/corporate/CorporateFooter.tsx` | MIXED | 05–06 | PARTIAL_ONLY | `-p` | Asset-dependent |
| `frontend/components/corporate/CorporateHeader.tsx` | MIXED | 05–06 | PARTIAL_ONLY | `-p` | Medium |
| `frontend/components/diagnostic/DiagnosticSurvey.tsx` | APPROVED_ARGOS | 07 | INCLUDE | full | Low |
| `frontend/components/diagnostic/DiagnosticSurveyModal.tsx` | APPROVED_ARGOS | 09 | INCLUDE | full | Low |
| `frontend/components/layout/CorporatePageShell.tsx` | APPROVED_ARGOS | 06 | INCLUDE | full | Low |
| `frontend/components/layout/SiteFooter.tsx` | APPROVED_ARGOS | chrome | INCLUDE | full | Low |
| `frontend/components/layout/SiteHeader.tsx` | PREEXISTING_RELATED | chrome | INCLUDE | full | Low |
| `frontend/components/layout/SiteShell.tsx` | MIXED | 06 | PARTIAL_ONLY | `-p` | Medium |
| `frontend/components/mascots/ChicoDumboSpriteSystem.tsx` | APPROVED_ARGOS | 05+09 | INCLUDE | full | Asset-dependent |
| `frontend/components/mascots/MascotChatContext.tsx` | APPROVED_ARGOS | 06 | INCLUDE | full | Low |
| `frontend/components/pages/AboutView.tsx` | MIXED | 06 | PARTIAL_ONLY | `-p` | Copy spot-check |
| `frontend/components/pages/ContactView.tsx` | MIXED→tiny | 06 | PARTIAL_ONLY | `-p`≈full | Low |
| `frontend/components/pages/HomeView.tsx` | MIXED | 04–09 | PARTIAL_ONLY | `-p` | High |
| `frontend/components/pages/MethodStepPageView.tsx` | MIXED | 06 | PARTIAL_ONLY | `-p` | Medium |
| `frontend/components/pages/MethodView.tsx` | MIXED | 04–06 | PARTIAL_ONLY | `-p` | High |
| `frontend/components/pages/ServiceDetailView.tsx` | MIXED | 06 | PARTIAL_ONLY | `-p` | Medium |
| `frontend/components/pages/ServicesView.tsx` | MIXED | 04+06 | PARTIAL_ONLY | `-p` | Medium |
| `frontend/i18n/locales/ca.json` | MIXED / locale | adoption | OWNER_REVIEW | — | Medium |
| `frontend/i18n/locales/en.json` | MIXED / locale | adoption | OWNER_REVIEW | — | Medium |
| `frontend/i18n/locales/es.json` | MIXED | 04+chrome+SEO | PARTIAL_ONLY | `-p` **mandatory** | **Critical** |
| `frontend/lib/chromeOwnership.ts` (+test) | APPROVED_ARGOS | chrome | INCLUDE | full | Low |
| `frontend/lib/corporateNav.ts` | APPROVED_ARGOS | chrome | INCLUDE | full | Low |
| `frontend/public/logo-argos-it-header.png` | APPROVED_ARGOS | 05 | INCLUDE | full | Required asset |
| `frontend/sprites/spriteManifest.ts` | APPROVED_ARGOS | 05–06 | INCLUDE | full | Needs poses |
| `frontend/styles/mascot-sprites.css` | APPROVED_ARGOS | 05+09 | INCLUDE | full | Low |
| `package.json` | APPROVED_ARGOS | 04 | INCLUDE | full | Low |

## Untracked (summary)

| Group | PROVENANCE | COMMIT_POLICY |
|-------|------------|---------------|
| New corporate/home/portal/lib sources | APPROVED_ARGOS | INCLUDE |
| 12 mascot pose binaries (manifest-required) | APPROVED_ARGOS | INCLUDE |
| `logo-argos-it-footer.png` | APPROVED_ARGOS | INCLUDE |
| `logo-argos-it-header.orig.png` | LOCAL_ONLY | EXCLUDE |
| `docs/content/*`, mission design reports, audits, `docs/release/*` | DOCUMENTATION | INCLUDE (core) |
| Wireframes / framer reconciliation docs | DOCUMENTATION | OWNER_REVIEW |
| `docs/research/*` | UNKNOWN | EXCLUDE |
| Phase8 framer/quiet/surgical PNGs | GENERATED_QA | EXCLUDE |
| `artifacts/**` (~111 files) | GENERATED_QA | EXCLUDE |
| `e2e/visual-adoption-01.spec.ts` | APPROVED_ARGOS | INCLUDE |
| gitignored `.env*` | SENSITIVE | EXCLUDE |

---

# Provenance Method

1. Reconcile FA10 manifest path lists with `git status --porcelain=v1`.
2. Cross-check mission reports 04–09 `FILES_CHANGED` / `FIX_09_TARGET_FILES`.
3. Hunk-inspect every modified tracked runtime file (`git diff -- <path>`).
4. Classify: APPROVED_ARGOS / PREEXISTING_RELATED / PREEXISTING_UNRELATED / MIXED / GENERATED_QA / DOCUMENTATION / LOCAL_ONLY / SENSITIVE / UNKNOWN.
5. Runtime reference scan for logos + `spriteManifest.ts` paths.
6. Default: mixed → `PARTIAL_ONLY` + hunk plan; unknown → cannot enter PR.

---

# Approved ARGOS Files

See JSON `includeFull` (75) + approved hunks inside `includePartial` (12).
Core lineage: Content 04 → Visual 05–07 → QA 08 (docs only) → Fix 09 → Acceptance 10 (docs only).

Mission 08 / 10: **runtime diff authored by those missions = 0** (reports/artifacts only).

---

# Mixed-Provenance Files

Exact register + hunk plans: `ARGOS_RELEASE_FILESET_11.json` → `mixedFiles` (12).

**Default:** `SAFE_TO_STAGE_WHOLE_FILE = NO`.

**Critical exception path:** `es.json` — must reject `meta.homeTitle` / `meta.homeDescription` hunks (`SEO_FIX_INCLUDED_IN_RELEASE_11 = NO`).

**Inseparable RC CSS/views:** accept all *RC-lineage* hunks; no unrelated NOC/auth hunks found; owner may later authorize whole-file only after full-diff review.

---

# Preexisting Related Files

Quiet Authority / Visual Adoption layers inside corporate CSS and page views — **in-scope for this public UI RC**, but chronologically pre-04 → marked MIXED, not “unrelated.”

`SiteHeader.tsx` goHome helper: related chrome; INCLUDE full.

---

# Preexisting Unrelated Files

Exact EXCLUDE:

- Six modified `docs/architecture/phase8-validation-artifacts/noc-*.png`
- Untracked phase8 framer / quiet-authority / surgical PNG dumps
- `docs/research/notebook-audit/*`

---

# Untracked File Analysis

| Class | Action |
|-------|--------|
| Runtime TSX/TS + required assets | INCLUDE |
| Governance docs | INCLUDE |
| Wireframes / extra reconciliation | OWNER_REVIEW |
| Research | EXCLUDE |
| QA screenshot trees | EXCLUDE |
| `.orig` backup | EXCLUDE |
| Env files (gitignored) | EXCLUDE |

`APPROVED_UNTRACKED_RUNTIME_ASSET_WITHOUT_REFERENCE = 0` for the 12 pose files (all referenced by `spriteManifest.ts` and/or footer).

---

# Hard Exclusions

- `artifacts/` (visual-qa-08, visual-fix-09, final-acceptance-10, visual-adoption, mov, etc.)
- `*.orig`
- Env files
- Unrelated NOC PNGs (modified + do not re-add)
- `node_modules/`, `.next/`, `dist/`, `coverage/`, `playwright-report/`, `test-results/`, logs, `.DS_Store` (not in dirty tree as proposed includes)

---

# Sensitive / Environment Audit

| Item | Status |
|------|--------|
| `.env` / `.env.local` / `docker/.env.staging` | Gitignored; EXCLUDE |
| Secrets in proposed docs | No tokens/keys; FA10 report has **local absolute path** (non-secret) |
| `SENSITIVE_FILES_PROPOSED_FOR_RELEASE` | **0** |

---

# Runtime Asset Inventory

| Asset | Tracked | Dirty | Runtime ref | Commit |
|-------|---------|-------|-------------|--------|
| Header logo `logo-argos-it-header.png` | YES | YES | YES | **REQUIRED** |
| Method circular `/chico-dumbo.png` | YES | NO | YES | already tracked |
| Footer `logo-argos-it-footer.png` | NO | YES (??) | YES | **REQUIRED** |
| `logo-argos-it-dark.png` | YES | NO | NO (superseded by footer.png) | not required |
| `.orig` header | NO | YES | **NO** | EXCLUDE |

`RUNTIME_REFERENCE = NO` for `.orig` — **PASS**.

---

# Mascot Asset Inventory

**Tracked poses:** 25 under `frontend/public/mascots/**` (already in Git).

**Untracked required (12)** — all `COMMIT_REQUIRED`:

Chico: `chico_sit.png`, `chico_alert.png`, `chico_jump.jpg`, `chico_lay.jpg`, `chico_sleep.jpg`, `chico_turn.jpg`, `chico_walk_01.jpg`
Dumbo: `dumbo_jump.jpg`, `dumbo_lay.jpg`, `dumbo_look.jpg`, `dumbo_sleep.jpg`, `dumbo_walk_01.jpg`

`RUNTIME_REFERENCE_TO_EXCLUDED_REQUIRED_ASSET = 0` (all listed in INCLUDE).

---

# Logo Asset Inventory

See Runtime Asset Inventory.
`REQUIRED_LOGOS_ACCOUNTED_FOR = YES`
`REQUIRED_MASCOT_ASSETS_ACCOUNTED_FOR = YES`

---

# Dependency Review

| File | Dirty | Classification |
|------|-------|----------------|
| `package.json` | YES (+ freeze test in `verify:frontend`) | APPROVED_REQUIRED |
| `package-lock.json` / pnpm / yarn | NO | — |

`UNEXPECTED_DEPENDENCY_CHANGES = 0`

---

# Documentation Policy

| Doc class | Policy |
|-----------|--------|
| Content freeze / ownership / 04 report / decision packs | INCLUDE |
| Visual 05–07, QA 08, Fix 09 reports | INCLUDE |
| FA10 + this Integration 11 pair | INCLUDE |
| B12 audit + content baseline | INCLUDE |
| Wireframes / framer maps / SoT reconciliation churn | OWNER_REVIEW |
| Research notebook audit | EXCLUDE |
| QA screenshot dumps | EXCLUDE |

---

# Atomic Dependency Groups

See JSON `atomicGroups`: AG-CONTENT, AG-CORP-UI, AG-MASCOT, AG-LOGO, AG-DIAG, AG-E2E, AG-DOCS.

**Do not** stage `spriteManifest.ts` without the 12 pose binaries.
**Do not** stage `CorporateFooter.tsx` without `logo-argos-it-footer.png` + `chico_sit.png`.

`ATOMIC_GROUPS_COMPLETE = YES`

---

# Release Include — Full Files

Exact list: JSON `includeFull` (**75** paths).

---

# Release Include — Partial Files

Exact list: JSON `includePartial` (**12** paths) + `mixedFiles` hunk plans.

---

# Release Exclude

Exact list: JSON `exclude` (**30** entries including `artifacts/` and `docs/research/`).

---

# Owner Review Required

Exact list: JSON `ownerReview` (**7**):

- `en.json` / `ca.json` — locale parity vs ES freeze; serene EN/CA home titles
- SoT / Framer / public UI reconciliation docs
- Wireframe docs 21_7C

---

# Proposed Staging Order

**DO NOT EXECUTE.**

1. Required new assets (footer logo + 12 mascot poses)
2. New runtime source files (`includeFull` under `frontend/components|app|hooks|lib`)
3. Safe whole-file tracked modifications (diagnostics, chromeOwnership, package.json, e2e, small files)
4. Mixed files via `git add -p` (CSS, views, header/footer, SiteShell, **es.json last among content**)
5. Approved tests not already staged
6. Governance docs (`docs/content`, design reports, audits)
7. Release docs (`docs/release/*`)

Never: `git add .` / `git add -A` / wildcards that capture `artifacts/` or NOC PNGs.

---

# Proposed Exact Staging Commands

**PLAN ONLY — DO NOT RUN.**

```bash
# 1) Assets (exact paths)
git add -- frontend/public/logo-argos-it-footer.png \
  frontend/public/mascots/chico/chico_alert.png \
  frontend/public/mascots/chico/chico_jump.jpg \
  frontend/public/mascots/chico/chico_lay.jpg \
  frontend/public/mascots/chico/chico_sit.png \
  frontend/public/mascots/chico/chico_sleep.jpg \
  frontend/public/mascots/chico/chico_turn.jpg \
  frontend/public/mascots/chico/chico_walk_01.jpg \
  frontend/public/mascots/dumbo/dumbo_jump.jpg \
  frontend/public/mascots/dumbo/dumbo_lay.jpg \
  frontend/public/mascots/dumbo/dumbo_look.jpg \
  frontend/public/mascots/dumbo/dumbo_sleep.jpg \
  frontend/public/mascots/dumbo/dumbo_walk_01.jpg

# 2) New sources — one path per call preferred; example batch of exact paths:
git add -- frontend/app/portal/page.tsx \
  frontend/components/corporate/ArgosCard.tsx \
  frontend/components/corporate/ArgosDetailDialog.tsx \
  frontend/components/corporate/ArgosExpandableCard.tsx \
  frontend/components/corporate/ArgosPhaseLettersRow.tsx \
  frontend/components/corporate/ArgosReveal.tsx \
  frontend/components/corporate/CorporateHeaderBanner.tsx \
  frontend/components/corporate/CorporateHistoryNav.tsx \
  frontend/components/corporate/CorporateNavDrawer.tsx \
  frontend/components/corporate/MethodArgosBar.tsx \
  frontend/components/corporate/MethodBrandHeader.tsx \
  frontend/components/corporate/PublicMovementsGrid.tsx \
  frontend/components/home/HomeDiagnosisCard.tsx \
  frontend/components/home/HomePerimeterPanel.tsx \
  frontend/components/pages/PortalView.tsx \
  frontend/hooks/useBrowserHistoryNav.ts \
  frontend/lib/contentFreezeV1.test.ts \
  frontend/lib/mascotPoseGraph.ts \
  frontend/lib/publicMethodMovements.ts

# 3) Safe modified wholes
git add -- frontend/ai/mascotStates.ts \
  frontend/app/globals.css \
  frontend/components/ArgosExplainerAnimation.tsx \
  frontend/components/ClientAssistants.tsx \
  frontend/components/diagnostic/DiagnosticSurvey.tsx \
  frontend/components/diagnostic/DiagnosticSurveyModal.tsx \
  frontend/components/layout/CorporatePageShell.tsx \
  frontend/components/layout/SiteFooter.tsx \
  frontend/components/layout/SiteHeader.tsx \
  frontend/components/mascots/ChicoDumboSpriteSystem.tsx \
  frontend/components/mascots/MascotChatContext.tsx \
  frontend/lib/chromeOwnership.ts \
  frontend/lib/chromeOwnership.test.ts \
  frontend/lib/corporateNav.ts \
  frontend/public/logo-argos-it-header.png \
  frontend/sprites/spriteManifest.ts \
  frontend/styles/mascot-sprites.css \
  package.json \
  e2e/corporate-chrome.spec.ts \
  e2e/smoke.spec.ts \
  e2e/static-banner.spec.ts \
  e2e/visual-adoption-01.spec.ts

# 4) Mixed — patch staging
git add -p -- frontend/assets/css/argos-corporate.css
git add -p -- frontend/components/corporate/CorporateHeader.tsx
git add -p -- frontend/components/corporate/CorporateFooter.tsx
git add -p -- frontend/components/layout/SiteShell.tsx
git add -p -- frontend/components/pages/HomeView.tsx
git add -p -- frontend/components/pages/MethodView.tsx
git add -p -- frontend/components/pages/ServicesView.tsx
git add -p -- frontend/components/pages/AboutView.tsx
git add -p -- frontend/components/pages/ContactView.tsx
git add -p -- frontend/components/pages/ServiceDetailView.tsx
git add -p -- frontend/components/pages/MethodStepPageView.tsx
git add -p -- frontend/i18n/locales/es.json
# For es.json: REJECT meta.homeTitle / meta.homeDescription hunks

# 5) Docs (exact)
git add -- docs/content/ARGOS_CONTENT_FREEZE_V1.md \
  docs/content/ARGOS_CONTENT_OWNERSHIP_MAP.json \
  docs/content/ARGOS_CONTENT_DRIFT_REGISTER.md \
  docs/content/ARGOS_CONTENT_IMPLEMENTATION_04_REPORT.md \
  docs/content/ARGOS_DECISION_RESOLUTION_02.md \
  docs/content/ARGOS_HUMAN_DECISION_PACK_01.md \
  docs/content/ARGOS_METHOD_MAPPING_4_TO_5.md \
  docs/content/ARGOS_SERVICE_ARCHITECTURE_MAPPING.md \
  docs/design/ARGOS_VISUAL_REFINEMENT_05_REPORT.md \
  docs/design/ARGOS_VISUAL_INTEGRATION_06_REPORT.md \
  docs/design/ARGOS_VISUAL_POLISH_07_REPORT.md \
  docs/design/ARGOS_OWNER_VISUAL_QA_08_REPORT.md \
  docs/design/ARGOS_SURGICAL_VISUAL_FIX_09_REPORT.md \
  docs/design/ARGOS_CONTENT_FREEZE_POLICY.md \
  docs/audits/ARGOS_B12_CONTAMINATION_AUDIT.md \
  docs/audits/ARGOS_CONTENT_BASELINE.md \
  docs/audits/ARGOS_CONTENT_BASELINE.json \
  docs/release/ARGOS_FINAL_ACCEPTANCE_10_REPORT.md \
  docs/release/ARGOS_RELEASE_MANIFEST_10.json \
  docs/release/ARGOS_GIT_RELEASE_INTEGRATION_11.md \
  docs/release/ARGOS_RELEASE_FILESET_11.json

# 6) Verify (after future staging mission)
git diff --cached --stat
git diff --cached --name-status
git diff --cached
```

---

# Staged-Diff Verification Gate

After a future staging mission (not now):

| Gate | Required |
|------|----------|
| STAGED_UNKNOWN_FILES | 0 |
| STAGED_LOCAL_ONLY_FILES | 0 |
| STAGED_SENSITIVE_FILES | 0 |
| STAGED_QA_SCREENSHOT_DUMPS | 0 |
| STAGED_NOC_PNGS | 0 |
| STAGED_ORIG_FILES | 0 |
| CONTENT_FREEZE_ON_STAGED_TREE | PASS |
| BUILD_FROM_STAGED_EQUIVALENT | PASS |
| SEO meta.home* staged change | MUST be absent |

---

# Proposed Logical Commits

| ID | Title | Notes |
|----|-------|-------|
| A | `feat(content): implement ARGOS Content Freeze v1.0 runtime wiring` | es.json via `-p` |
| B | `feat(ui): integrate ARGOS Quiet Authority corporate visual system` | components + CSS |
| C | `feat(mascots): integrate Chico/Dumbo poses and brand logos` | binaries + manifest |
| D | `fix(ui): apply surgical visual QA corrections from FIX 09` | fold if already in B/C |
| E | `test(e2e): align corporate chrome and freeze assertions` | |
| F | `docs(release): record ARGOS acceptance and git integration plan` | |

`PROPOSED_LOGICAL_COMMITS = 6`
Interwoven CSS/Home make perfect 04/05/06/07/09 isolation unsafe — group by atomic rollback, not by mission number alone.

---

# Commit Dependency Order

A → B → C → (D optional fold) → E; F independent.
Prefer **one PR** containing A–F for buildability; avoid landing A alone on remote without B/C assets.

---

# Proposed PR Scope

**Include:** RUNTIME + ASSETS + TESTS + GOVERNANCE_DOCS + RELEASE_DOCS per JSON lists.

**Exclude:** QA dumps, env, backups, `.orig`, unrelated NOC, research UNKNOWN, owner-review until approved.

**Unknown files cannot enter PR** — research/wireframes stay out unless owner promotes them.

---

# Proposed PR Description

**TITLE:** `feat(public): ARGOS content freeze + Quiet Authority visual release candidate`

```markdown
# Summary
Isolates the approved ARGOS public UI release candidate (Content Freeze v1.0 + Quiet Authority visual system + FIX 09) from a dirty worktree without unrelated NOC/QA/local files.

# Content Architecture
Frozen ES hero/method/services invariants; dual-layer method (4 public + 5 operational); ownership/freeze docs.

# Visual System
Corporate chrome, Detail Mode, portal, design tokens in argos-corporate.css.

# Method
Single Method ARGOS bar; circular /chico-dumbo.png mark; operational phase rail.

# Services
Six commercial slugs unchanged; four pillar names.

# Diagnostic
Real survey engine preserved; modal shell visual fix only.

# Mascots / Brand Assets
Dumbo=guía / Chico=protege; required pose binaries; footer rectangular logo; header logo refresh.

# Responsive / Accessibility
FIX 09 footer/dock/method-390 corrections; focus/Escape smoke from FA10.

# Verification
contentFreeze tests, lint/tsc, build PASS (FA10). CI must install Playwright browsers before relying on e2e.

# Content Freeze
es.json staged with patch exclusion of historical meta.home* SEO drift hunks.

# Known Non-Blocking Items
- P3 mint/service card height consistency
- Historical SEO slogan drift (intentionally not “fixed” here)
- Unmounted MethodArgosShowcase “garantizada” dead string (untouched)

# Excluded Local Artifacts
artifacts/**, *.orig, env files, unrelated NOC PNGs, research notebook dumps, phase8 screenshot archives

# Deployment Status
READY_FOR_PRODUCTION_BUILD = YES
READY_FOR_DEPLOY = NO
DEPLOYMENT NOT AUTHORIZED
```

---

# Known Non-Blocking Items

1. P3 card height consistency (mint + services) — `P3_SCOPE_CREEP = 0`
2. SEO historical drift — leave unstaged meta hunks
3. Dead guarantee string in unmounted `MethodArgosShowcase.tsx` — untouched
4. EN/CA locale parity — owner review
5. FA10 report local absolute path — optional future redact

---

# Risks

| # | Risk | Mitigation in plan |
|---|------|--------------------|
| 1 | Approved asset excluded | 12 poses + footer logo in INCLUDE |
| 2 | Unrelated file included | Hard EXCLUDE lists; no `git add -A` |
| 3 | Mixed file staged whole | PARTIAL_ONLY + `-p`; es.json SEO reject |
| 4 | Missing required asset | AG-MASCOT / AG-LOGO atomic groups |
| 5 | Sensitive inclusion | Env EXCLUDE; scan clean |
| 6 | Build split broken | Prefer single PR with A–C ordered |
| 7 | Report local path | Non-secret; optional redact later |
| 8 | Untracked source required | New corporate components listed INCLUDE |

---

# Final Recommendation

Proceed to **CONTROLLED STAGING 12** using exact paths in `ARGOS_RELEASE_FILESET_11.json`. Do not stage artifacts, NOC PNGs, `.orig`, envs, or research. Patch-stage `es.json` to keep SEO drift out of the PR. Do not commit until staging verification gates pass and owner authorizes.

---

# Manifest Cross-Check

| Check | Result |
|-------|--------|
| Branch/HEAD match FA10 | YES |
| Staged still 0 | YES |
| Modified still 42 | YES |
| MANIFEST_EXTRA | `docs/release/*`, `artifacts/final-acceptance-10/*` (expected FA10 outputs) |
| MANIFEST_MISSING | none material for release planning |
| PROVENANCE_CONFLICTS | FA10 dual-listed mixed/approved → resolved as PARTIAL |

---

# Final State Verification

Allowed new files this mission:

- `docs/release/ARGOS_GIT_RELEASE_INTEGRATION_11.md`
- `docs/release/ARGOS_RELEASE_FILESET_11.json`

| Gate | Value |
|------|-------|
| RUNTIME_FILES_MODIFIED_BY_INTEGRATION_11 | **0** |
| INDEX_CHANGED_BY_INTEGRATION_11 | **NO** |
| COMMITS_CREATED | **0** |
| PUSHES_PERFORMED | **0** |
| PRS_CREATED | **0** |
| DEPLOYS_PERFORMED | **0** |

---

# Final Stop Gate

```
GIT_RELEASE_INTEGRATION_11 = PASS

CURRENT_BRANCH = feature/argos-multitenant-platform
CURRENT_HEAD = 640adb0

DIRTY_PATHS_TOTAL = 109
TRACKED_MODIFIED = 42
UNTRACKED = 67
STAGED_INITIAL = 0

APPROVED_ARGOS_FILES = 75 (includeFull) + partial approved hunks
PREEXISTING_RELATED_FILES = mixed RC lineage (counted in PARTIAL)
PREEXISTING_UNRELATED_FILES = 7 tracked NOC/recon + phase8 PNG dumps
MIXED_PROVENANCE_FILES = 12
UNKNOWN_PROVENANCE_FILES = docs/research (+ excluded)

RELEASE_INCLUDE_FULL = 75
RELEASE_INCLUDE_PARTIAL = 12
RELEASE_EXCLUDE = 30
OWNER_REVIEW_REQUIRED = 7

QA_ARTIFACT_PATHS_PROPOSED = 0
ENV_FILES_PROPOSED = 0
ORIG_FILES_PROPOSED = 0
UNRELATED_NOC_FILES_PROPOSED = 0

SENSITIVE_FILES_PROPOSED_FOR_RELEASE = 0

REQUIRED_LOGOS_ACCOUNTED_FOR = YES
REQUIRED_MASCOT_ASSETS_ACCOUNTED_FOR = YES
RUNTIME_REFERENCE_TO_EXCLUDED_REQUIRED_ASSET = 0
RELEASE_IMPORTS_LOCAL_ONLY_FILE = 0

MIXED_FILES_HAVE_HUNK_PLANS = YES
ATOMIC_GROUPS_COMPLETE = YES
RELEASE_FILESET_EXPLICIT = YES

CONTENT_FREEZE_PROTECTED_IN_PLAN = YES
DIAGNOSTIC_PROTECTED_IN_PLAN = YES
SEO_HISTORICAL_DRIFT_UNTOUCHED = YES
DEAD_GUARANTEE_STRING_UNTOUCHED = YES
P3_SCOPE_CREEP = 0

PROPOSED_LOGICAL_COMMITS = 6

UNKNOWN_PROVENANCE_RELEASE_FILES = 0

RUNTIME_FILES_MODIFIED_BY_INTEGRATION_11 = 0
INDEX_CHANGED_BY_INTEGRATION_11 = NO

COMMITS_CREATED = 0
PUSHES_PERFORMED = 0
PRS_CREATED = 0
DEPLOYS_PERFORMED = 0

REPORT_CREATED = YES
RELEASE_FILESET_JSON_CREATED = YES
STAGING_PLAN_CREATED = YES
PR_PLAN_CREATED = YES

READY_FOR_CONTROLLED_STAGING_12 = YES
READY_FOR_PR = YES
READY_FOR_DEPLOY = NO

AUTHORIZED_TO_COMMIT = NO
AUTHORIZED_TO_PUSH = NO
AUTHORIZED_TO_DEPLOY = NO
```

**DO NOT STAGE. DO NOT COMMIT. DO NOT PUSH. DO NOT DEPLOY. STOP.**
