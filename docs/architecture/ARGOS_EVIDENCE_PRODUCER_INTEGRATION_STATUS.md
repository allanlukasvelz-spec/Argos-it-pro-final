# ARGOS Evidence Producer Integration — Status

```
DATE = 2026-08-25
PRODUCER = INCIDENT_EVIDENCE_REFRESH (Phase 6)
```

## Flow

```
remediation execution
  → incidentEvidenceArtifact (collect + serialize)
  → EvidenceService.store (idempotent)
  → incident_events EVIDENCE (evidenceObjectId reference)
```

## Files

| File | Role |
|------|------|
| `backend/lib/remediation/incidentEvidenceArtifact.js` | Snapshot + artifact schema v1 |
| `backend/lib/remediation/actions/evidence.js` | Execute / verify / dry-run |
| `backend/lib/platform/evidenceService.js` | Metadata + bytes + orphan compensation |
| `backend/lib/remediation/evidence.producer.test.js` | Integration + failure tests |

## Idempotency

- Object: `remediation:INCIDENT_EVIDENCE_REFRESH:exec:{executionId}`
- Event: existing row matched by `payload.remediationExecutionId`

## Failure behaviors (tested)

| Case | Result |
|------|--------|
| Store failure | No event; execution fails |
| Event link failure | Object kept; audit marker; execution fails |
| DB COMMIT after put | Bytes deleted (compensation) |
| Retry same execution | Single object + single event |

## Security

- No arbitrary uploads
- Secrets redacted in artifact
- Tenant isolation on retrieval unchanged

## Next slice options

1. Wire additional producers (diagnostics bundle, remediation PDF)
2. MinIO adapter when authorized
3. Orphan sweeper cron (local only)
