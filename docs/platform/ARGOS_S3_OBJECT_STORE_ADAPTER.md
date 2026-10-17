# ARGOS S3-Compatible Object Store Adapter

```
STATUS = POC / LOCAL+TEST
DATE = 2026-08-26
PRODUCTION_NOT_CONFIGURED = YES
```

## Role

Transport-only adapter behind the existing ObjectStore interface. **EvidenceService** remains owner of:

- tenant binding (`organization_id`)
- opaque object keys (`org/{id}/ev/{uuid}`)
- MIME allowlist + sniff
- size / quota policy
- SHA-256 checksum + verify on read
- metadata in PostgreSQL (`evidence_objects`)
- audit logs

## Interface (unchanged contract)

| Method | Purpose |
|--------|---------|
| `put(objectKey, buffer)` | Write bytes |
| `get(objectKey)` | Read bytes (S3: bounded retry) |
| `head(objectKey)` | Metadata probe |
| `delete(objectKey)` | Remove bytes |
| `exists(objectKey)` | Boolean probe |
| `listKeysUnderPrefix` | **Internal** reconciliation only |

No client-controlled bucket/key. No bucket browser API.

## Backend selection

| `ARGOS_EVIDENCE_STORE` | Adapter |
|------------------------|---------|
| `local` (default) | `LocalPrivateObjectStore` |
| `s3` | `S3CompatibleObjectStore` |

Invalid value → **fail closed** at boot. **No silent fallback** from `s3` to `local`.

### S3 env (local/test)

```
ARGOS_EVIDENCE_S3_ENDPOINT=http://127.0.0.1:9000
ARGOS_EVIDENCE_S3_BUCKET=argos-evidence-poc
ARGOS_EVIDENCE_S3_ACCESS_KEY=...
ARGOS_EVIDENCE_S3_SECRET_KEY=...
ARGOS_EVIDENCE_S3_REGION=us-east-1
ARGOS_EVIDENCE_S3_FORCE_PATH_STYLE=true
ARGOS_EVIDENCE_S3_READ_MAX_ATTEMPTS=3
```

## Signed URL model (TARGET — not exposed)

Current: authenticated backend streaming via `/api/client/evidence/:id/content` and NOC equivalent.

Future signed URL design:

- TTL ≤ 5 minutes
- single object scope
- tenant check before issue
- `Content-Disposition` attachment
- audit event on issue + download
- revocation = do not issue new URLs; existing URLs expire naturally

Clients do **not** receive presigned URLs in this POC.

## Failure mapping

| Condition | Code |
|-----------|------|
| Missing object | `NOT_FOUND` |
| Bad credentials | `STORAGE_AUTH_FAILED` |
| Missing bucket | `BUCKET_UNAVAILABLE` |
| Network / reset on write | `STORAGE_PUT_FAILED` |
| Network on read (after retries) | `STORAGE_DOWN` |
| Timeout | `TIMEOUT` |

## Files

- `backend/lib/platform/s3CompatibleObjectStore.js`
- `backend/lib/platform/objectKey.js` (shared key rules)
- `backend/lib/platform/evidenceStore.js` (backend selection)
