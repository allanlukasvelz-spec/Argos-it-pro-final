# ARGOS Evidence Object Storage

```
DATE = 2026-08-25
STATUS = FOUNDATION + PHASE6 PRODUCER (INCIDENT_EVIDENCE_REFRESH)
```

## Architecture

```
Incident (PG)
  ↓
INCIDENT_EVIDENCE_REFRESH (Phase 6 L1)
  ↓
collect safe snapshot → JSON artifact
  ↓
EvidenceService.store()
  ↓
evidence_objects (metadata) + LocalPrivateObjectStore (bytes)
  ↓
incident_events (EVIDENCE) payload.evidenceObjectId
  ↓
GET /api/client/evidence/:id/content  (tenant-scoped)
GET /api/noc/evidence/:id/content     (NOC audited)
```

## Storage classes

| Layer | Store | Content |
|-------|-------|---------|
| TRANSACTIONAL | PostgreSQL | `evidence_objects`, `incident_events` |
| OBJECT | LocalPrivateObjectStore **or** S3CompatibleObjectStore (MinIO POC) | JSON artifact bytes |

Legacy JSONB evidence in `observations` / `alerts` / remediation fields is **unchanged**.

## Producer (CURRENT)

| Field | Value |
|-------|-------|
| Action | `INCIDENT_EVIDENCE_REFRESH` |
| Module | `backend/lib/remediation/actions/evidence.js` |
| Artifact builder | `backend/lib/remediation/incidentEvidenceArtifact.js` |
| MIME | `application/json` |
| Schema version | `1` |

## Artifact schema (v1)

```json
{
  "schemaVersion": 1,
  "source": "INCIDENT_EVIDENCE_REFRESH",
  "collectedAt": "ISO-8601",
  "organizationId": 10,
  "incidentId": 100,
  "remediationExecutionId": 501,
  "assetId": 5,
  "signal": { "severity", "state", "correlationKey" },
  "incident": { "id", "title", "summary", "severity", "state", "correlationKey", timestamps },
  "alerts": { "openCount", "bySeverity" },
  "health": { "assetId", "overall", "reasons" } | null,
  "safeEvidence": { sanitized evidenceIn/input }
}
```

**Excluded:** tokens, credentials, private keys, cookies, Authorization, environment secrets.

Sanitization: `sanitizeRemediationPayload` + `sanitizeEvidence`.

## Idempotency

| Key | `remediation:INCIDENT_EVIDENCE_REFRESH:exec:{executionId}` |
| Effect | Same remediation execution retry → one AVAILABLE `evidence_objects` row |
| Event dedupe | `incident_events` lookup by `payload.remediationExecutionId` |

## Failure model

| Failure | Behavior |
|---------|----------|
| Preconditions / collection | Action throws; no object, no event |
| EvidenceService / object store | Action throws `EVIDENCE_STORE_*`; no incident event |
| DB insert metadata rollback | Object put compensated (delete bytes) on transaction failure |
| Incident event append after object | Action throws `EVENT_LINK_FAILED`; object retained; `activity_logs` marker `evidence_event_link_failed` |
| Checksum mismatch on read | 503 fail-closed |

**Never** report successful refresh if object persistence failed.

## Tenant model

- `evidence_objects.organization_id` required
- Client retrieval scoped to `req.tenant.id`
- NOC cross-tenant read audited in `security_logs`

## Configuration

| Env | Default | Purpose |
|-----|---------|---------|
| `ARGOS_EVIDENCE_ROOT` | `backend/data/evidence` | Private object root (outside `frontend/public`) |
| `ARGOS_EVIDENCE_MAX_BYTES` | 10485760 | Max artifact size |
| `ARGOS_EVIDENCE_QUOTA_BYTES` | 0 (unlimited) | Per-org quota hook |

## Remaining limitations

- No MinIO/S3 adapter (interface ready)
- Malware scan hook = SKIPPED
- Phase 7 agents do not produce file evidence
- Orphan bytes possible only if compensation delete fails (logged)
- No automated orphan sweeper

## Future

1. MinIO/S3 adapter implementing same `EvidenceStore` interface
2. Phase 8 reports → same `EvidenceService`
3. Optional async orphan reconciliation job
