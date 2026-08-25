# ARGOS Storage Architecture

```
DATE = 2026-08-25
```

## Storage classes

| Class | Examples | Primary store |
|-------|----------|---------------|
| TRANSACTIONAL | orgs, assets, alerts, incidents, runbooks, agents | PostgreSQL |
| TIME_SERIES | metrics samples | Prometheus (TARGET) |
| LOG | access/app logs | files → Loki (TARGET) |
| OBJECT | PDFs, screenshots, diagnostic bundles | S3/MinIO (TARGET) |
| CACHE | rate-limit counters (today memory) | memory → Redis later if needed |
| EPHEMERAL | spool files on agent host | local disk bounded |

Every dataset belongs to **exactly one** primary class.

## Object storage controls (TARGET)

- `organization_id` binding in metadata (PG)
- object key prefix isolation `org/{orgId}/...`
- SHA-256 integrity
- MIME allowlist + size limits + quota
- encryption at rest (bucket)
- retention + deletion policy
- signed access (short TTL); **never** raw bucket to clients
- malware scan strategy (async) before client download of untrusted uploads
- audit of create/read/delete
- backup of metadata + objects

## CURRENT

All evidence in PostgreSQL JSONB. No MinIO/S3 in app compose. Ops infra may use R2 for DB dumps (`docs/infrastructure`) — separate from product object store.

## Migration path

1. Interface `EvidenceStore` (put/get/sign) — no-op or local filesystem for TEST
2. Metadata table `evidence_objects` (org_id, sha256, mime, bytes, key, created_at)
3. MinIO/S3 adapter
4. Phase 8 reports write through interface

Do not move existing observation JSONB blindly into object store.
