# ARGOS Object Storage — Live Validation Record

```
DATE = 2026-08-26
STATUS = LOCAL/POC VALIDATED
PRODUCTION = NOT_CONFIGURED
BRANCH = feature/argos-multitenant-platform
BASELINE_COMMIT = d68f593
```

## Scope

End-to-end validation of:

```
EvidenceService
      ↓
S3CompatibleObjectStore
      ↓
MinIO (local Docker POC)
```

## Validated contract (PASS)

| Step | Operation | Result |
|------|-----------|--------|
| 1 | PUT via `EvidenceService.store` | PASS |
| 2 | HEAD via `S3CompatibleObjectStore.head` | PASS |
| 3 | GET via `EvidenceService.getContent` | PASS |
| 4 | SHA-256 verify | PASS (digest MATCH) |
| 5 | DELETE via `S3CompatibleObjectStore.delete` | PASS |
| 6 | Missing confirmed | PASS (`NOT_FOUND`, `STORAGE_MISSING`) |

## Local environment evidence

| Property | Value |
|----------|-------|
| MinIO API port (validated) | **9010** (host collision: 9000 occupied) |
| MinIO console port (validated) | **9011** |
| Canonical defaults | 9000 / 9001 |
| Bucket | `argos-evidence-poc` |
| Bucket policy | private (`mc anonymous set none`) |
| Anonymous access | disabled |
| Bind | `127.0.0.1` only |
| Public exposure | NO |

## MinIO image policy

```
MINIO_IMAGE_POLICY = POC_ONLY
```

The prior pinned tag `RELEASE.2024-12-18T13-15-44Z` was **invalid/unavailable**.

Local validation succeeded with Docker `minio/minio:latest` and `minio/mc:latest`.

**Follow-up required before production adoption:**

- Pin a verified immutable MinIO version **and** digest.
- `latest` is **NOT** production-safe.

## Verification integration

| Command | Behavior |
|---------|----------|
| `npm run verify:backend` | Full backend suite; MinIO live **SKIPPED** |
| `ARGOS_MINIO_POC=1 npm run verify:backend` | Full suite + live MinIO flow **RUNS** |
| `npm run verify:minio-live` | Live flow only (requires MinIO + PG) |

Live script: `backend/scripts/evidence-minio-live-flow.js`

Gate: `scripts/verify-minio-live-gate.js` (no Docker auto-start)

## Security gates (confirmed)

- secrets committed: NO
- public bucket: NO
- anonymous access: NO
- client direct object access: NO
- silent backend fallback: NO
- remote execution: NO

## Human review

STOP before production MinIO/S3 rollout or Phase 8.
