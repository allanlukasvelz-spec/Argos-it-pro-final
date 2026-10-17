# ARGOS Object Storage Runbook

```
DATE = 2026-08-25
AUDIENCE = operators / NOC
```

## Local development

1. Backend boot calls `configureEvidenceStore()` — default `ARGOS_EVIDENCE_STORE=local` → `backend/data/evidence/`
2. Migration 006 applied at boot via `ensureEvidenceObjectsTable`
3. Local override: `ARGOS_EVIDENCE_ROOT=/path/outside/public`
4. MinIO POC (optional): see `docs/platform/ARGOS_MINIO_LOCAL_POC.md` — set `ARGOS_EVIDENCE_STORE=s3`

## Live MinIO validation (POC)

| Command | MinIO live |
|---------|------------|
| `npm run verify:backend` | SKIPPED |
| `ARGOS_MINIO_POC=1 npm run verify:minio-live` | RUNS |
| `ARGOS_MINIO_POC=1 npm run verify:backend` | RUNS (after unit suite) |

Validated locally on API **9010** / console **9011** when host **9000** was occupied.

See `docs/architecture/ARGOS_OBJECT_STORAGE_LIVE_VALIDATION.md`.

Do not auto-start Docker from verify scripts.

## Reconciliation (POC)

```
GET /api/noc/evidence/reconcile?dry_run=1
```

See `docs/platform/ARGOS_OBJECT_RECONCILIATION.md`

## Triggering evidence refresh

Phase 6 remediation execution with action `INCIDENT_EVIDENCE_REFRESH`:

1. Dry-run → plan shows EvidenceService persistence
2. Execute → creates `evidence_objects` row + `incident_events` kind `EVIDENCE`
3. Verify → requires `eventId` + `evidenceObjectId`

## Retrieval

| Role | Endpoint |
|------|----------|
| Client (tenant) | `GET /api/client/evidence/:id/content` |
| NOC | `GET /api/noc/evidence/:id/content` |

Never expose filesystem paths or public URLs.

## Reconciliation: event link failure

If execute fails with `EVENT_LINK_FAILED`:

1. Object likely exists — check `activity_logs` for `evidence_event_link_failed`
2. Find object via `evidence_objects.remediation_execution_id` or idempotency key
3. Manually append incident event or re-run execution (idempotent object, event dedupe by execution id)

## Reconciliation: orphan bytes

If DB COMMIT fails after put, EvidenceService attempts delete compensation.

If compensation fails (check logs `[EvidenceService] orphan compensation delete failed`):

1. Scan `ARGOS_EVIDENCE_ROOT/org/{orgId}/ev/` for keys not in `evidence_objects`
2. Delete unreferenced files manually after backup

## Rollback migration 006

Manual only:

```bash
psql "$DATABASE_URL" -f database/migrations/006_evidence_objects_down.sql
```

Object bytes under `ARGOS_EVIDENCE_ROOT` are **not** removed by SQL rollback — delete separately if required.

## Production

**Not authorized in this slice.** Do not apply migration 006 to production without explicit approval and backup.
