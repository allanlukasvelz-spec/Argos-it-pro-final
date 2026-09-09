# ARGOS_OFFHOST_WATCHDOG_22B

```
ARGOS_OFFHOST_WATCHDOG_22B = PASS_WITH_GIT_AUTH
TIMESTAMP                  = 2026-09-03T19:28:00Z
BRANCH                     = ops/argos-external-watchdog
BASE_SHA                   = a2fe6139a3ccde6006d7a9475c293b8f89b64d50
WORKTREE                   = /Users/allanlukasvelz/Documents/Argos-it-pro-final-ops-watchdog
WORKTREE_CLEAN_EXCEPT_M22B = YES
COMMITTED                  = NO
PUSHED                     = NO
```

## Selection

**OPTION A — GitHub Actions** on existing public repo `allanlukasvelz-spec/Argos-it-pro-final`.

| Gate | Result |
|------|--------|
| REPOSITORY_ACTIONS_ENABLED | YES (`allowed_actions=all`) |
| SCHEDULED_WORKFLOWS_ALLOWED | YES (public repo; cron supported) |
| DEFAULT_BRANCH | main |
| EXISTING_MONITORING_WORKFLOW | NO (CI only) |
| NEW_SECRET_REQUIRED | NO (public HTTPS only) |
| VIEWER_PERMISSION | ADMIN |

Reason: already-owned, off-VPS (`ubuntu-latest`), no paid vendor, no ARGOS secrets, auditable.

GitHub cron is **not** a hard 5-minute SLA; runs can delay under platform load.

## Artifacts (unstaged)

- `.github/workflows/production-watchdog.yml`
- `scripts/ops/production-watchdog.sh` (same probe for local validation)

Workflow: `*/5 * * * *` + `workflow_dispatch`; `permissions: contents: read`; no SSH, Coolify, DB, OpenAI, ntfy URL.

## Local validation

| Test | Result |
|------|--------|
| portal https://portal.argos-it.com/ | HTTP 200 |
| api `/api/health` | HTTP 200; body `status=OK` `db=connected` |
| simulated failure 127.0.0.1:1 | retry then CORE_DEGRADED, exit 1 |
| bash -n | PASS |
| production targets unchanged | YES |

Persistent GitHub-hosted run: **NOT EXECUTED** (no commit/push).

## Notification

Preferred path: **GitHub workflow failure** (email/app to repo watchers). Independent of ARGOS VPS.

ntfy.sh: public SaaS; anonymous ~250 msgs/day + burst; Mission 22 publish HTTP **429**. **No Mission 22B ntfy send** (stop after prior 429). Self-hosting ntfy on the VPS would not close host-down SPOF.

HUMAN_ALERT_ACK=NO (owner must confirm after first real GitHub failure/test run).

## Release guard

Not redesigned. Runtime images still `12678f3…` web+API. MATCH assumed from Mission 22 + live image tags this mission.

## SAME_HOST_SPOF

**NOT closed** until the workflow is on `main` (or otherwise scheduled) and a GitHub-hosted run exists.

## Owner Git authorization

Mission 22B did **not** commit or push.

To activate:

```
cd /Users/allanlukasvelz/Documents/Argos-it-pro-final-ops-watchdog
git add .github/workflows/production-watchdog.yml scripts/ops/production-watchdog.sh
git commit -m "ops: add off-host production watchdog (Mission 22B)"
git push -u origin ops/argos-external-watchdog
gh pr create --base main --title "ops: off-host production watchdog"
```

After merge to `main`, enable Actions notifications for the operator. Optionally run `workflow_dispatch` once.

Rollback: delete workflow file / disable workflow. No app rollback.

## Dirty historical worktree

`/Users/allanlukasvelz/Documents/Argos-it-pro-final` remains `feature/argos-multitenant-platform` — not used for this change.
