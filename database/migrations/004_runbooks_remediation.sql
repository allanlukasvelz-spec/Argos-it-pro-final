-- Phase 6 — Runbooks + safe remediation (additive, idempotent)
-- Branch: feature/argos-multitenant-platform
-- No DROP of Phase 0–5 data. No secrets in defaults.

BEGIN;

CREATE TABLE IF NOT EXISTS runbooks (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('DRAFT', 'ACTIVE', 'DEPRECATED')),
  applies_to JSONB NOT NULL DEFAULT '{}'::jsonb,
  automation_max_level INT NOT NULL DEFAULT 0
    CHECK (automation_max_level >= 0 AND automation_max_level <= 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS runbook_versions (
  id SERIAL PRIMARY KEY,
  runbook_id INT NOT NULL REFERENCES runbooks(id) ON DELETE CASCADE,
  version INT NOT NULL CHECK (version >= 1),
  steps JSONB NOT NULL,
  changelog TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (runbook_id, version)
);

CREATE INDEX IF NOT EXISTS idx_runbook_versions_runbook
  ON runbook_versions(runbook_id, version DESC);

CREATE TABLE IF NOT EXISTS remediation_executions (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id INT REFERENCES incidents(id) ON DELETE SET NULL,
  asset_id INT REFERENCES assets(id) ON DELETE SET NULL,
  runbook_id INT NOT NULL REFERENCES runbooks(id) ON DELETE RESTRICT,
  runbook_version_id INT NOT NULL REFERENCES runbook_versions(id) ON DELETE RESTRICT,
  execution_key TEXT NOT NULL,
  letter TEXT NOT NULL DEFAULT 'A'
    CHECK (letter IN ('A', 'B', 'C')),
  action_type TEXT NOT NULL,
  safety_level TEXT NOT NULL
    CHECK (safety_level IN ('L0', 'L1', 'L2', 'L3', 'L4')),
  state TEXT NOT NULL DEFAULT 'PLANNED'
    CHECK (state IN (
      'PLANNED',
      'DRY_RUN_COMPLETE',
      'AWAITING_APPROVAL',
      'APPROVED',
      'RUNNING',
      'VERIFYING',
      'SUCCEEDED',
      'FAILED',
      'ROLLING_BACK',
      'ROLLED_BACK',
      'ROLLBACK_FAILED',
      'SAFE_STOPPED',
      'CANCELLED'
    )),
  hypothesis TEXT,
  confidence TEXT
    CHECK (confidence IS NULL OR confidence IN ('HIGH', 'MEDIUM', 'LOW', 'UNKNOWN')),
  evidence_in JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_out JSONB NOT NULL DEFAULT '{}'::jsonb,
  failure_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  expected_result TEXT,
  verification_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  rollback_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  actor_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  requested_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  UNIQUE (organization_id, execution_key)
);

CREATE INDEX IF NOT EXISTS idx_remediation_exec_org
  ON remediation_executions(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_remediation_exec_incident
  ON remediation_executions(incident_id)
  WHERE incident_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_remediation_exec_state
  ON remediation_executions(organization_id, state);

CREATE TABLE IF NOT EXISTS remediation_approvals (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  execution_id INT NOT NULL REFERENCES remediation_executions(id) ON DELETE CASCADE,
  requested_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approved_by INT REFERENCES users(id) ON DELETE SET NULL,
  decision TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (decision IN ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED', 'CONSUMED')),
  reason TEXT,
  scope_hash TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_remediation_approvals_exec
  ON remediation_approvals(execution_id, decision);

CREATE TABLE IF NOT EXISTS remediation_events (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  execution_id INT NOT NULL REFERENCES remediation_executions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  actor_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remediation_events_exec
  ON remediation_events(execution_id, created_at ASC);

-- Simulator fixture store (Phase 6B L2 demo only — never customer infra)
CREATE TABLE IF NOT EXISTS remediation_test_flags (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  flag_value TEXT NOT NULL DEFAULT '',
  version INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, flag_key)
);

COMMIT;
