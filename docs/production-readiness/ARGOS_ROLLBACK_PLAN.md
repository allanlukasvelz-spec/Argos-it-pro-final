# ARGOS — Rollback Plan

`git revert` alone is **not** production/staging rollback.

## By layer

| Layer | Rollback method | Notes |
|-------|-----------------|-------|
| Frontend | Redeploy previous image/digest | Stateless |
| API | Previous image; ensure schema compatible | |
| Worker | Previous image; drain or wait jobs | Chromium deps must match |
| DB migration | Prefer **forward-fix**; else restore backup | Manual `*_down` only if empty/safe |
| Object store config | Revert endpoint/bucket config; keep bytes | |
| Agent version | Redeploy prior agent script; credentials persist unless revoked | |

## Compatibility window

Document each release: `min_schema` / `max_schema`.  
Order: migrate forward → deploy apps → verify → only then retire old.

## Rollback rehearsal (G15)

1. Deploy build N  
2. Smoke  
3. Deploy build N-1 intentionally  
4. Confirm health + one report path  
5. Record time-to-rollback  
