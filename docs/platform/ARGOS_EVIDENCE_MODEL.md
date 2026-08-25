# ARGOS Evidence Model

```
DATE = 2026-08-25
```

## CURRENT

- `observations.evidence` JSONB (sanitized, size-capped)
- `alerts.evidence`, agent measurements
- TLS metadata without private keys
- Remediation evidence_in/out JSONB
- **`evidence_objects` table** — tenant-isolated metadata (migration 006)
- **`LocalPrivateObjectStore`** — private filesystem adapter under `backend/data/evidence` (or `ARGOS_EVIDENCE_ROOT`)
- **`EvidenceService`** — SHA-256, MIME policy, size limits, retention metadata, quota hooks
- Authenticated retrieval: `/api/client/evidence/*` (tenant-scoped), `/api/noc/evidence/*` (cross-tenant audited)
- NOC-only store endpoint for operational producers; **no arbitrary client/agent uploads**

## TARGET object evidence

Metadata (TRANSACTIONAL / PG):

- organization_id, asset_id?, incident_id?
- sha256, mime, byte_length, storage_key, created_by, created_at
- retention_class, scan_status

Bytes (OBJECT store): immutable blob.

## Integrity

SHA-256 at write; verify on read for critical downloads. Fail closed on mismatch.

## Tenant

Every evidence row requires organization_id. NOC cross-tenant access audited.
