# ARGOS Object Storage Foundation — Status

```
DATE = 2026-08-26
BRANCH = feature/argos-multitenant-platform
```

## Milestones

| Milestone | Commit area | Status |
|-----------|-------------|--------|
| Interface + NoopEvidenceStore | `evidenceStore.js` | DONE |
| LocalPrivateObjectStore | `localPrivateObjectStore.js` | DONE |
| S3CompatibleObjectStore | `s3CompatibleObjectStore.js` | POC_LOCAL |
| MinIO local overlay | `docker/docker-compose.minio-poc.yml` | POC_LOCAL |
| Backend selection | `ARGOS_EVIDENCE_STORE=local\|s3` | DONE |
| evidence_objects table (006) | migration + schema | DONE |
| EvidenceService | policy, SHA-256, quota hooks | DONE |
| Client/NOC retrieval | `clientEvidence`, `nocEvidence` | DONE |
| Phase 6 producer | `INCIDENT_EVIDENCE_REFRESH` | DONE |
| Reconciliation dry-run | `evidenceReconciliation.js` | POC |

## Backends

| Backend | Use |
|---------|-----|
| `local` | Default dev/test (`backend/data/evidence`) |
| `s3` | MinIO POC / future S3-compatible production |

**No silent fallback** between backends.

## Not implemented

- Cloud AWS S3 production deployment
- Phase 8 report PDFs
- Agent binary uploads
- Malware scanner (`NOT_SCANNED != CLEAN` preserved)
- Automated orphan sweeper (dry-run only)
- Client presigned URLs

## Verification

```bash
npm run verify:backend
# includes evidence.foundation, evidence.producer, s3 adapter, reconciliation tests
```

Optional MinIO live: see `docs/platform/ARGOS_MINIO_LOCAL_POC.md`

## Human review

STOP before production migration or external object store rollout.
