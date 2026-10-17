-- Evidence object metadata (bytes in ObjectStore adapter; not in PG)
-- Down migration: 006_evidence_objects_down.sql (manual)

CREATE TABLE IF NOT EXISTS evidence_objects (
  id TEXT PRIMARY KEY
    CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id INT REFERENCES assets(id) ON DELETE SET NULL,
  incident_id INT REFERENCES incidents(id) ON DELETE SET NULL,
  remediation_execution_id INT REFERENCES remediation_executions(id) ON DELETE SET NULL,
  object_key TEXT NOT NULL UNIQUE,
  sha256 TEXT NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  mime_type TEXT NOT NULL,
  byte_length BIGINT NOT NULL CHECK (byte_length >= 0),
  retention_class TEXT NOT NULL DEFAULT 'STANDARD'
    CHECK (retention_class IN ('STANDARD', 'SHORT', 'LONG', 'LEGAL_HOLD')),
  retention_until TIMESTAMPTZ,
  scan_status TEXT NOT NULL DEFAULT 'SKIPPED'
    CHECK (scan_status IN ('PENDING', 'SKIPPED', 'CLEAN', 'QUARANTINED')),
  status TEXT NOT NULL DEFAULT 'AVAILABLE'
    CHECK (status IN ('AVAILABLE', 'DELETED', 'ORPHANED')),
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_objects_org_idempotency
  ON evidence_objects(organization_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND status = 'AVAILABLE';

CREATE INDEX IF NOT EXISTS idx_evidence_objects_org
  ON evidence_objects(organization_id);

CREATE INDEX IF NOT EXISTS idx_evidence_objects_org_created
  ON evidence_objects(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_objects_status
  ON evidence_objects(status);
