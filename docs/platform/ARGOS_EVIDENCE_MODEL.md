# ARGOS Evidence Model

```
DATE = 2026-08-25
```

## CURRENT

- `observations.evidence` JSONB (sanitized, size-capped)
- `alerts.evidence`, agent measurements
- TLS metadata without private keys
- Remediation evidence_in/out JSONB

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
