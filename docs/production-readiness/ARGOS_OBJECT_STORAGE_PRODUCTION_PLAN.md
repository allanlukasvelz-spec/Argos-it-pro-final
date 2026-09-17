# ARGOS — Object Storage Production Plan

```
CURRENT = LocalPrivateObjectStore default + S3CompatibleObjectStore + MinIO POC
```

## 1. Components

| Piece | Role |
|-------|------|
| EvidenceService | Tenant metadata PG + bytes store; checksum; quota |
| LocalPrivateObjectStore | Filesystem under `ARGOS_EVIDENCE_ROOT` |
| S3CompatibleObjectStore | MinIO/S3 API |
| Reconciliation | Dry-run orphan / missing object detection |

## 2. Staging recommendation

| Choice | Verdict |
|--------|---------|
| Local FS | OK single-node staging; weak multi-node/backup |
| **Pinned MinIO** | Preferred isolated staging |
| Managed S3 | When cloud authorized |

**Do not** use `minio/minio:latest` without digest pin.

## 3. Hard requirements

| Control | Rule |
|---------|------|
| Bucket | Private; no anonymous; no public ACL |
| Client access | Via authenticated API only — **no direct object URL** |
| Encryption at rest | MinIO SSE or volume encryption / S3 SSE |
| TLS | Prefer TLS to store endpoint |
| Versioning | ON for staging→prod path |
| Checksum | SHA-256 in metadata; mismatch → fail retrieval |
| Lifecycle | Align with retention matrix |
| LEGAL_HOLD | Retention class exists; policy ops TBD |
| Malware | `scan_status`; **NOT_SCANNED/SKIPPED ≠ CLEAN** |
| Credentials | Rotate; never in git |
| Orphans | Reconciliation job TARGET |
| Metadata w/o object | Fail closed on GET |
| Object w/o metadata | Orphan → quarantine/delete policy |

## 4. POC vs staging

| MinIO POC | Staging |
|-----------|---------|
| Ports 9000/9010 localhost | Private network |
| Root user in compose env example | Separate app keys least privilege |
| Init creates private bucket | Same + versioning + backup mirror |

## 5. Preserve EvidenceService invariants

- Tenant binding on every get  
- Idempotency keys prevent duplicate artifacts  
- Report path uses `report-run:{runId}`  
