# ARGOS — External Staging Rollback

`git revert` alone is **not** external staging rollback.

Canonical layers: [ARGOS_ROLLBACK_PLAN.md](./ARGOS_ROLLBACK_PLAN.md).

## Independent rollback by layer

| Layer | Method | Constraint |
|-------|--------|------------|
| Frontend | Redeploy previous image digest behind proxy | Stateless |
| API | Previous image; schema must remain compatible | Single replica + scheduler |
| Worker | Previous image; drain in-flight PDF jobs | Chromium deps match image |
| Database schema | Prefer **forward-fix** migration | Automatic `*_down` forbidden |
| Object storage | Keep bytes; revert endpoint/bucket config only if safe | Never wipe bucket to “undo” |
| Config/secrets | Restore prior env file from encrypted backup | Rotate if leak suspected |
| Reverse proxy / TLS | Prior config + cert | Cert expiry separate |

## Database rule

If schema migration already applied and apps cannot run on N-1:

1. Forward-fix migration, **or**
2. Isolated restore of pre-migrate backup to a **side** environment and cut over only with human approval

Never restore a dump onto primary “to undo” without an approved DR exercise.

## Compatibility window

Each external release notes: `min_schema` / `max_schema` / `GIT_SHA` / digests.

Order: backup → migrate forward → deploy apps → verify → only then retire previous images.

## Rollback rehearsal (future gate)

Required before claiming EXTERNAL_STAGING_VALIDATED for DR confidence (maps to G15).
