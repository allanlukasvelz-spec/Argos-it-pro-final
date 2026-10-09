# ARGOS Evidence Object Reconciliation

```
STATUS = POC (dry-run first)
DATE = 2026-08-26
AUTO_DELETE = NO
```

## Problem

Prior limitation: `EVENT_LINK_FAILED` could leave an evidence object in storage without a linked `incident_events` row.

## Categories

| Category | Meaning |
|----------|---------|
| `METADATA_WITHOUT_OBJECT` | PG row exists; bytes missing |
| `OBJECT_WITHOUT_METADATA` | Bytes exist; no AVAILABLE PG row |
| `OBJECT_WITHOUT_EVENT_LINK` | Object + metadata; missing EVIDENCE event for remediation execution |
| `CHECKSUM_MISMATCH` | Bytes SHA-256 ≠ metadata |

## API (NOC)

```
GET /api/noc/evidence/reconcile?dry_run=1&organization_id=10&scan_orphans=0
```

- `dry_run=1` (default) — detection only, no mutations
- `scan_orphans=1` — bounded store listing (may be slower on S3)

## Module

`backend/lib/platform/evidenceReconciliation.js`

## Policy

- **No automatic delete** of evidence bytes or metadata
- Cleanup/destruction requires explicit future policy + human approval
- Repair of missing event links is flagged but not auto-applied in POC

## Production

Not scheduled. Run manually in local/test before any production rollout.
