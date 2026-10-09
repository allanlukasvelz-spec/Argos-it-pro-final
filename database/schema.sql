-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  company TEXT,
  role TEXT DEFAULT 'cliente', -- 'visitante', 'cliente', 'cliente_verificado', 'admin', 'super_admin'
  client_verified BOOLEAN DEFAULT false,
  company_profile JSONB DEFAULT '{}'::jsonb,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organizations / tenants (Phase 0 multitenant foundation)
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_role TEXT NOT NULL DEFAULT 'org_member'
    CHECK (org_role IN ('org_owner', 'org_admin', 'org_member', 'org_viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

-- Phase 2 asset registry (also ensured at boot / migrations/002)
CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_asset_id INT REFERENCES assets(id) ON DELETE SET NULL,
  type TEXT NOT NULL
    CHECK (type IN (
      'DOMAIN', 'HOSTNAME', 'WEBSITE', 'SERVER',
      'API', 'DATABASE', 'SERVICE', 'TLS_CERTIFICATE'
    )),
  name TEXT NOT NULL,
  hostname TEXT,
  address TEXT,
  environment TEXT NOT NULL DEFAULT 'production'
    CHECK (environment IN ('production', 'staging', 'development', 'other')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived', 'unknown')),
  kind TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_observed_at TIMESTAMPTZ,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tls_certificates (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id INT REFERENCES assets(id) ON DELETE SET NULL,
  provider TEXT,
  serial TEXT,
  fingerprint_sha256 TEXT,
  issuer TEXT,
  subject TEXT,
  not_before TIMESTAMPTZ,
  not_after TIMESTAMPTZ,
  sans JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_wildcard BOOLEAN NOT NULL DEFAULT false,
  auto_renew BOOLEAN,
  renewal_method TEXT,
  last_observed_at TIMESTAMPTZ,
  observation_status TEXT NOT NULL DEFAULT 'UNKNOWN'
    CHECK (observation_status IN (
      'VALID', 'EXPIRING', 'EXPIRED',
      'HOSTNAME_MISMATCH', 'CHAIN_ERROR', 'UNKNOWN'
    )),
  hostname_match BOOLEAN,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phase 3 monitoring domain (also migrations/003 + ensureMonitors.js)
CREATE TABLE IF NOT EXISTS monitors (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('HTTP', 'TLS', 'DNS')),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'PAUSED', 'DISABLED', 'ERROR')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  interval_seconds INT NOT NULL DEFAULT 60
    CHECK (interval_seconds >= 30 AND interval_seconds <= 86400),
  timeout_ms INT NOT NULL DEFAULT 8000
    CHECK (timeout_ms >= 1000 AND timeout_ms <= 60000),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_check_at TIMESTAMPTZ,
  next_check_at TIMESTAMPTZ,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monitor_checks (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  monitor_id INT NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  asset_id INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN (
      'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'TIMED_OUT', 'CANCELLED'
    )),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_class TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS observations (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  monitor_id INT NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  monitor_check_id INT REFERENCES monitor_checks(id) ON DELETE SET NULL,
  asset_id INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ok BOOLEAN NOT NULL,
  status_code INT,
  latency_ms INT,
  error_class TEXT,
  classification TEXT NOT NULL DEFAULT 'DETECTED'
    CHECK (classification IN ('DETECTED', 'INFERRED', 'PREDICTED')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'PLATFORM'
    CHECK (source IN ('PLATFORM', 'AGENT')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id INT REFERENCES assets(id) ON DELETE SET NULL,
  monitor_id INT REFERENCES monitors(id) ON DELETE SET NULL,
  severity TEXT NOT NULL
    CHECK (severity IN ('WARNING', 'CRITICAL')),
  state TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (state IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
  fingerprint TEXT NOT NULL,
  title TEXT NOT NULL,
  reason TEXT,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  observation_id INT REFERENCES observations(id) ON DELETE SET NULL,
  count INT NOT NULL DEFAULT 1,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id INT REFERENCES assets(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  severity TEXT NOT NULL
    CHECK (severity IN ('WARNING', 'CRITICAL')),
  state TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (state IN ('OPEN', 'INVESTIGATING', 'MITIGATED', 'RESOLVED')),
  correlation_key TEXT NOT NULL,
  owner_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS incident_events (
  id SERIAL PRIMARY KEY,
  incident_id INT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind TEXT NOT NULL
    CHECK (kind IN (
      'ALERT_LINKED', 'NOTE', 'STATE_CHANGE', 'EVIDENCE',
      'HYPOTHESIS', 'ACTION_A', 'ACTION_B', 'ACTION_C',
      'VERIFY', 'SAFE_STOP', 'ROLLBACK'
    )),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de memoria IA
CREATE TABLE IF NOT EXISTS ai_memory (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'dumbo', 'chico'
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de logs de actividad
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de logs de seguridad
CREATE TABLE IF NOT EXISTS security_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de servicios
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  icon TEXT,
  category TEXT,
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de formularios enviados
CREATE TABLE IF NOT EXISTS form_submissions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
  service_id INT REFERENCES services(id),
  data JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'accepted'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de servicios contratados por cliente
CREATE TABLE IF NOT EXISTS client_services (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
  service_slug TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  renewed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabla de auditorías y mejoras web
CREATE TABLE IF NOT EXISTS website_audits (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
  website_url TEXT,
  score INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  findings JSONB DEFAULT '[]'::jsonb,
  reviewed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_improvements (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  priority TEXT DEFAULT 'Media',
  status TEXT DEFAULT 'pending',
  page_url TEXT,
  details TEXT,
  reviewed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_messages (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
  related_submission_id INT REFERENCES form_submissions(id) ON DELETE SET NULL,
  sender_role TEXT DEFAULT 'cliente',
  subject TEXT,
  message TEXT NOT NULL,
  urgency TEXT DEFAULT 'Normal',
  read_at TIMESTAMP,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_organization_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_organization ON assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_org_type ON assets(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_tls_certificates_organization ON tls_certificates(organization_id);
CREATE INDEX IF NOT EXISTS idx_tls_certificates_asset ON tls_certificates(asset_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_monitors_org_asset_type_active
  ON monitors (organization_id, asset_id, type)
  WHERE enabled = true AND status <> 'DISABLED';
CREATE INDEX IF NOT EXISTS idx_monitors_organization ON monitors(organization_id);
CREATE INDEX IF NOT EXISTS idx_monitors_asset ON monitors(asset_id);
CREATE INDEX IF NOT EXISTS idx_monitors_next_check
  ON monitors(next_check_at)
  WHERE enabled = true AND status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_monitor_checks_org ON monitor_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_monitor_checks_monitor ON monitor_checks(monitor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_observations_org_asset_time
  ON observations(organization_id, asset_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_observations_monitor_time
  ON observations(monitor_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_observations_org ON observations(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_org_fingerprint_open
  ON alerts (organization_id, fingerprint)
  WHERE state IN ('OPEN', 'ACKNOWLEDGED');
CREATE INDEX IF NOT EXISTS idx_alerts_org_state ON alerts(organization_id, state);
CREATE INDEX IF NOT EXISTS idx_alerts_asset ON alerts(organization_id, asset_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_incidents_org_correlation_open
  ON incidents (organization_id, correlation_key)
  WHERE state IN ('OPEN', 'INVESTIGATING', 'MITIGATED');
CREATE INDEX IF NOT EXISTS idx_incidents_org_state ON incidents(organization_id, state);
CREATE INDEX IF NOT EXISTS idx_incidents_asset ON incidents(organization_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_incident_events_incident
  ON incident_events(incident_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_incident_events_org
  ON incident_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_user ON ai_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_org ON security_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_client_services_user ON client_services(user_id);
CREATE INDEX IF NOT EXISTS idx_client_services_org ON client_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_website_audits_user ON website_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_website_audits_org ON website_audits(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_improvements_user ON client_improvements(user_id);
CREATE INDEX IF NOT EXISTS idx_client_improvements_org ON client_improvements(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_user ON client_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_org ON client_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_org ON form_submissions(organization_id);

-- Sesiones de refresh token (jti + rotación en POST /api/auth/refresh)
CREATE TABLE IF NOT EXISTS refresh_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jti TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user ON refresh_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_jti ON refresh_sessions(jti);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_expires ON refresh_sessions(expires_at);

-- =============================================================================
-- Phase 6–7 tables (aligned with migrations 004 + 005 for Docker init completeness)
-- Source: database/migrations/004_runbooks_remediation.sql
--          database/migrations/005_agents_observation.sql
-- Boot ensure* still applies these; keeping schema.sql complete for initdb.
-- =============================================================================



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



-- Allow AGENT observations without a platform monitor row
ALTER TABLE observations
  ALTER COLUMN monitor_id DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- agents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ENROLLMENT_PENDING'
    CHECK (status IN (
      'ENROLLMENT_PENDING', 'ONLINE', 'STALE', 'OFFLINE', 'UNKNOWN', 'REVOKED'
    )),
  capabilities JSONB NOT NULL DEFAULT '["HEARTBEAT"]'::jsonb,
  agent_version TEXT,
  last_seen_at TIMESTAMPTZ,
  last_seq BIGINT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agents_org ON agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_agents_asset ON agents(asset_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_last_seen ON agents(last_seen_at);

-- ---------------------------------------------------------------------------
-- enrollment tokens (plaintext never stored)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_enrollments (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  capabilities JSONB NOT NULL DEFAULT '["HEARTBEAT"]'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'CONSUMED', 'EXPIRED', 'REVOKED')),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  agent_id INT REFERENCES agents(id) ON DELETE SET NULL,
  agent_name_hint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_enrollments_org ON agent_enrollments(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_enrollments_status ON agent_enrollments(status, expires_at);

-- ---------------------------------------------------------------------------
-- credentials (secret_hash only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_credentials (
  id SERIAL PRIMARY KEY,
  agent_id INT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  secret_hash TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'ROTATING', 'REVOKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE (agent_id, version)
);

CREATE INDEX IF NOT EXISTS idx_agent_credentials_agent ON agent_credentials(agent_id)
  WHERE status = 'ACTIVE';

-- ---------------------------------------------------------------------------
-- heartbeats
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_heartbeats (
  id BIGSERIAL PRIMARY KEY,
  agent_id INT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  seq BIGINT NOT NULL,
  agent_reported_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  agent_version TEXT,
  capabilities JSONB,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (agent_id, seq)
);

CREATE INDEX IF NOT EXISTS idx_agent_heartbeats_agent_time
  ON agent_heartbeats(agent_id, received_at DESC);

-- ---------------------------------------------------------------------------
-- typed observations (raw + optional projection)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_observations (
  id BIGSERIAL PRIMARY KEY,
  agent_id INT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  idempotency_key TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'ACCEPTED'
    CHECK (status IN ('ACCEPTED', 'REJECTED')),
  reject_reason TEXT,
  measurement JSONB NOT NULL DEFAULT '{}'::jsonb,
  projected_observation_id INT REFERENCES observations(id) ON DELETE SET NULL,
  UNIQUE (agent_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_agent_observations_asset_time
  ON agent_observations(asset_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_observations_org
  ON agent_observations(organization_id, received_at DESC);

-- ---------------------------------------------------------------------------
-- security / audit events (redacted details)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_security_events (
  id BIGSERIAL PRIMARY KEY,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
  agent_id INT REFERENCES agents(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'INFO'
    CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_security_events_org
  ON agent_security_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_security_events_agent
  ON agent_security_events(agent_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- evidence object metadata (migration 006; bytes in ObjectStore adapter)
-- ---------------------------------------------------------------------------
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

-- Web projects (expediente web). DDL must match migrations/008_web_projects.sql.
-- FK: RESTRICT on documentation tree. No CASCADE. Archive via archived_at.
-- workflow_status ≠ archived. Multiple active projects per organization allowed.

CREATE TABLE IF NOT EXISTS web_projects (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  project_type TEXT NOT NULL
    CHECK (project_type IN ('create', 'improve')),
  workflow_status TEXT NOT NULL DEFAULT 'INTAKE'
    CHECK (workflow_status IN (
      'INTAKE',
      'REVIEW',
      'ARCHITECTURE',
      'MOCKUP',
      'DEVELOPMENT',
      'VALIDATION',
      'PUBLICATION',
      'COMPLETED'
    )),
  website_asset_id INT REFERENCES assets(id) ON DELETE SET NULL,
  website_hostname TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  archived_by INT REFERENCES users(id) ON DELETE SET NULL,
  archive_reason TEXT,
  completed_at TIMESTAMPTZ,
  submitted_for_review_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_web_projects_org
  ON web_projects(organization_id);

CREATE INDEX IF NOT EXISTS idx_web_projects_org_workflow
  ON web_projects(organization_id, workflow_status);

CREATE INDEX IF NOT EXISTS idx_web_projects_org_archived
  ON web_projects(organization_id, archived_at);

CREATE TABLE IF NOT EXISTS web_project_items (
  id SERIAL PRIMARY KEY,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  item_type TEXT NOT NULL
    CHECK (item_type IN (
      'page',
      'service',
      'product',
      'tour',
      'team_member',
      'location',
      'deliverable',
      'custom'
    )),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_web_project_items_org_project
  ON web_project_items(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_documents (
  id TEXT PRIMARY KEY
    CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  object_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  requirement_key TEXT,
  declared_extension TEXT,
  mime_type TEXT NOT NULL,
  byte_length BIGINT NOT NULL CHECK (byte_length >= 0 AND byte_length <= 20971520),
  sha256 TEXT
    CHECK (sha256 IS NULL OR sha256 ~ '^[a-f0-9]{64}$'),
  scan_status TEXT NOT NULL DEFAULT 'SCAN_NOT_AVAILABLE'
    CHECK (scan_status IN ('SCAN_NOT_AVAILABLE', 'UNSCANNED', 'PENDING', 'REJECTED')),
  status TEXT NOT NULL DEFAULT 'AVAILABLE'
    CHECK (status IN ('AVAILABLE', 'DELETED')),
  upload_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (upload_status IN ('PENDING', 'STORED', 'FAILED')),
  stored_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  replaces_document_id TEXT REFERENCES web_project_documents(id) ON DELETE RESTRICT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_web_project_documents_org_project
  ON web_project_documents(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_comments (
  id SERIAL PRIMARY KEY,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  body TEXT NOT NULL,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_web_project_comments_org_project
  ON web_project_comments(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_reviews (
  id SERIAL PRIMARY KEY,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  verdict TEXT NOT NULL
    CHECK (verdict IN ('APPROVED', 'CORRECTION_REQUESTED', 'REJECTED')),
  summary TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'PROJECT'
    CHECK (target_type IN ('PROJECT', 'FORM_FIELD', 'ITEM', 'DOCUMENT')),
  target_id TEXT,
  target_key TEXT,
  correction_message TEXT,
  schema_version TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_reviews_org_project
  ON web_project_reviews(organization_id, web_project_id);

CREATE INDEX IF NOT EXISTS idx_web_project_reviews_target
  ON web_project_reviews(organization_id, web_project_id, target_type, target_id, target_key);

CREATE TABLE IF NOT EXISTS web_project_form_responses (
  id SERIAL PRIMARY KEY,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  schema_version TEXT NOT NULL,
  field_key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (web_project_id, schema_version, field_key)
);

CREATE INDEX IF NOT EXISTS idx_web_project_form_responses_org_project
  ON web_project_form_responses(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_credential_status (
  web_project_id INT PRIMARY KEY REFERENCES web_projects(id) ON DELETE RESTRICT,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'NONE'
    CHECK (status IN (
      'NONE',
      'REQUESTED',
      'RECEIVED_OUT_OF_BAND',
      'VERIFIED',
      'REVOKED'
    )),
  updated_by INT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_credential_status_org
  ON web_project_credential_status(organization_id);

-- 011 invitations. Token stored as hash only. Additive to 008/009/010.

CREATE TABLE IF NOT EXISTS web_project_invitations (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  project_type TEXT NOT NULL
    CHECK (project_type IN ('create', 'improve')),
  project_title TEXT,
  organization_id INT REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT REFERENCES web_projects(id) ON DELETE RESTRICT,
  invited_by INT REFERENCES users(id) ON DELETE SET NULL,
  token_hash TEXT NOT NULL UNIQUE
    CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
  delivery_status TEXT NOT NULL DEFAULT 'NONE'
    CHECK (delivery_status IN ('NONE', 'PENDING', 'SENT', 'FAILED')),
  created_organization BOOLEAN NOT NULL DEFAULT FALSE,
  intended_org_role TEXT NOT NULL DEFAULT 'org_owner'
    CHECK (intended_org_role IN ('org_owner', 'org_admin', 'org_member', 'org_viewer')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_invitations_email_status
  ON web_project_invitations(email, status);

CREATE INDEX IF NOT EXISTS idx_web_project_invitations_org
  ON web_project_invitations(organization_id);

CREATE INDEX IF NOT EXISTS idx_web_project_invitations_expires
  ON web_project_invitations(status, expires_at);

-- 012 brief notes + architecture handoff. Additive to 008–011.

CREATE TABLE IF NOT EXISTS web_project_brief_notes (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  note_type TEXT NOT NULL
    CHECK (note_type IN (
      'ARCHITECTURE_NOTE',
      'ASSUMPTION',
      'EXCLUSION',
      'RISK',
      'DECISION_REQUIRED'
    )),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'RESOLVED')),
  blocking BOOLEAN NOT NULL DEFAULT FALSE,
  severity TEXT
    CHECK (severity IS NULL OR severity IN ('LOW', 'MEDIUM', 'HIGH')),
  resolution_note TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_web_project_brief_notes_org_project
  ON web_project_brief_notes(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_architecture_handoffs (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  schema_version TEXT NOT NULL,
  payload JSONB NOT NULL,
  readiness_state TEXT NOT NULL,
  override_used BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, web_project_id)
);

CREATE INDEX IF NOT EXISTS idx_web_project_architecture_handoffs_org_project
  ON web_project_architecture_handoffs(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_architectures (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  version INT NOT NULL CHECK (version > 0),
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'APPROVED', 'SUPERSEDED')),
  primary_language TEXT,
  additional_languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  language_selector_required BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by INT REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  supersedes_architecture_id INT REFERENCES web_project_architectures(id) ON DELETE RESTRICT,
  UNIQUE (organization_id, web_project_id, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_web_project_architectures_one_draft
  ON web_project_architectures(web_project_id)
  WHERE status = 'DRAFT';

CREATE INDEX IF NOT EXISTS idx_web_project_architectures_org_project
  ON web_project_architectures(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_architecture_pages (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  architecture_id INT NOT NULL REFERENCES web_project_architectures(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  route TEXT NOT NULL,
  page_type TEXT NOT NULL
    CHECK (page_type IN (
      'HOME', 'ABOUT', 'SERVICE_INDEX', 'SERVICE_DETAIL', 'PRODUCT_INDEX', 'PRODUCT_DETAIL',
      'TOUR_INDEX', 'TOUR_DETAIL', 'TEAM', 'LOCATIONS', 'LOCATION_DETAIL', 'CONTACT', 'FAQ',
      'BLOG_INDEX', 'ARTICLE', 'LEGAL', 'BOOKING', 'ECOMMERCE', 'LANDING', 'CUSTOM'
    )),
  template_type TEXT NOT NULL
    CHECK (template_type IN ('UNIQUE', 'INDEX', 'DETAIL', 'LEGAL', 'SYSTEM', 'LANDING')),
  parent_page_id INT REFERENCES web_project_architecture_pages(id) ON DELETE RESTRICT,
  sort_order INT NOT NULL DEFAULT 0,
  navigation_placement TEXT NOT NULL DEFAULT 'NONE'
    CHECK (navigation_placement IN ('PRIMARY', 'SECONDARY', 'UTILITY', 'FOOTER', 'HIDDEN', 'NONE')),
  navigation_label TEXT,
  purpose TEXT,
  summary TEXT,
  primary_cta TEXT,
  secondary_cta TEXT,
  seo_priority TEXT NOT NULL DEFAULT 'MEDIUM'
    CHECK (seo_priority IN ('HIGH', 'MEDIUM', 'LOW', 'NONE')),
  content_readiness TEXT NOT NULL DEFAULT 'PARTIAL'
    CHECK (content_readiness IN ('READY', 'PARTIAL', 'MISSING', 'NOT_APPLICABLE')),
  content_binding_type TEXT
    CHECK (content_binding_type IS NULL OR content_binding_type IN (
      'service', 'product', 'tour', 'team_member', 'location', 'page', 'custom'
    )),
  content_binding_mode TEXT
    CHECK (content_binding_mode IS NULL OR content_binding_mode IN ('collection', 'detail', 'single')),
  source_page_item_id INT REFERENCES web_project_items(id) ON DELETE SET NULL,
  migration_disposition TEXT
    CHECK (migration_disposition IS NULL OR migration_disposition IN (
      'KEEP', 'REDESIGN', 'MERGE', 'REMOVE', 'REDIRECT'
    )),
  entity_count INT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_architecture_pages_arch
  ON web_project_architecture_pages(architecture_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_web_project_architecture_pages_org_project
  ON web_project_architecture_pages(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_architecture_blocks (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  architecture_id INT NOT NULL REFERENCES web_project_architectures(id) ON DELETE RESTRICT,
  architecture_page_id INT NOT NULL REFERENCES web_project_architecture_pages(id) ON DELETE RESTRICT,
  block_type TEXT NOT NULL
    CHECK (block_type IN (
      'HERO', 'INTRO', 'RICH_TEXT', 'SERVICE_GRID', 'SERVICE_DETAIL', 'PRODUCT_GRID', 'PRODUCT_DETAIL',
      'TOUR_GRID', 'TOUR_DETAIL', 'TEAM_GRID', 'LOCATIONS', 'FEATURES', 'BENEFITS', 'PROCESS', 'FAQ',
      'TESTIMONIALS', 'GALLERY', 'VIDEO', 'MAP', 'CONTACT_FORM', 'QUOTE_FORM', 'BOOKING_WIDGET',
      'ECOMMERCE_ACTION', 'CTA', 'RELATED_CONTENT', 'NEWS', 'NEWSLETTER', 'LEGAL_TEXT', 'CUSTOM'
    )),
  sort_order INT NOT NULL DEFAULT 0,
  title TEXT,
  purpose TEXT,
  notes TEXT,
  content_source_type TEXT
    CHECK (content_source_type IS NULL OR content_source_type IN (
      'service', 'product', 'tour', 'team_member', 'location', 'page', 'custom'
    )),
  content_source_id INT,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_architecture_blocks_page
  ON web_project_architecture_blocks(architecture_page_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_web_project_architecture_blocks_arch
  ON web_project_architecture_blocks(architecture_id);


-- Synced from migrations/014_web_project_mockups.sql
-- Additive only. Visual mockup persistence for Web Projects Phase 14.

CREATE TABLE IF NOT EXISTS web_project_mockups (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  version INT NOT NULL CHECK (version > 0),
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'INTERNAL_REVIEW', 'CLIENT_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'SUPERSEDED')),
  architecture_id INT NOT NULL REFERENCES web_project_architectures(id) ON DELETE RESTRICT,
  architecture_version INT NOT NULL CHECK (architecture_version > 0),
  visual_direction JSONB NOT NULL DEFAULT '{}'::jsonb,
  design_tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  header_variant TEXT NOT NULL DEFAULT 'STANDARD'
    CHECK (header_variant IN ('STANDARD', 'CENTERED', 'MINIMAL', 'TRANSPARENT')),
  footer_variant TEXT NOT NULL DEFAULT 'STANDARD'
    CHECK (footer_variant IN ('STANDARD', 'COMPACT', 'EXPANDED')),
  preview_item_id INT REFERENCES web_project_items(id) ON DELETE SET NULL,
  preview_item_type TEXT
    CHECK (preview_item_type IS NULL OR preview_item_type IN (
      'service', 'product', 'tour', 'page', 'team_member', 'location', 'custom'
    )),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  internal_notes TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by INT REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  sent_to_client_at TIMESTAMPTZ,
  sent_to_client_by INT REFERENCES users(id) ON DELETE SET NULL,
  supersedes_mockup_id INT REFERENCES web_project_mockups(id) ON DELETE RESTRICT,
  UNIQUE (organization_id, web_project_id, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_web_project_mockups_one_active_draft
  ON web_project_mockups(web_project_id)
  WHERE status IN ('DRAFT', 'INTERNAL_REVIEW');

CREATE INDEX IF NOT EXISTS idx_web_project_mockups_org_project
  ON web_project_mockups(organization_id, web_project_id);

CREATE INDEX IF NOT EXISTS idx_web_project_mockups_architecture
  ON web_project_mockups(architecture_id);

CREATE TABLE IF NOT EXISTS web_project_mockup_pages (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  mockup_id INT NOT NULL REFERENCES web_project_mockups(id) ON DELETE RESTRICT,
  architecture_page_id INT NOT NULL REFERENCES web_project_architecture_pages(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  route TEXT NOT NULL,
  page_type TEXT NOT NULL,
  template_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'READY')),
  visual_notes TEXT,
  responsive_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_mockup_pages_mockup
  ON web_project_mockup_pages(mockup_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_web_project_mockup_pages_org_project
  ON web_project_mockup_pages(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_mockup_sections (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  mockup_id INT NOT NULL REFERENCES web_project_mockups(id) ON DELETE RESTRICT,
  mockup_page_id INT NOT NULL REFERENCES web_project_mockup_pages(id) ON DELETE RESTRICT,
  architecture_block_id INT REFERENCES web_project_architecture_blocks(id) ON DELETE SET NULL,
  section_type TEXT NOT NULL
    CHECK (section_type IN (
      'HEADER', 'FOOTER', 'HERO', 'INTRO', 'RICH_TEXT', 'SERVICE_GRID', 'SERVICE_DETAIL',
      'PRODUCT_GRID', 'PRODUCT_DETAIL', 'TOUR_GRID', 'TOUR_DETAIL', 'TEAM_GRID', 'LOCATIONS',
      'FEATURES', 'BENEFITS', 'PROCESS', 'FAQ', 'TESTIMONIALS', 'GALLERY', 'VIDEO', 'MAP',
      'CONTACT_FORM', 'QUOTE_FORM', 'BOOKING_WIDGET', 'ECOMMERCE_ACTION', 'CTA', 'RELATED_CONTENT',
      'NEWS', 'NEWSLETTER', 'LEGAL_TEXT', 'CUSTOM'
    )),
  variant TEXT NOT NULL DEFAULT 'DEFAULT',
  alignment TEXT NOT NULL DEFAULT 'CENTER'
    CHECK (alignment IN ('LEFT', 'CENTER', 'RIGHT')),
  density TEXT NOT NULL DEFAULT 'NORMAL'
    CHECK (density IN ('COMPACT', 'NORMAL', 'SPACIOUS')),
  visual_props JSONB NOT NULL DEFAULT '{}'::jsonb,
  asset_document_id TEXT REFERENCES web_project_documents(id) ON DELETE SET NULL,
  placeholder_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  visual_notes TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_mockup_sections_page
  ON web_project_mockup_sections(mockup_page_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_web_project_mockup_sections_mockup
  ON web_project_mockup_sections(mockup_id);

-- Extend review targets for mockup client feedback (additive constraint replace)
ALTER TABLE web_project_reviews DROP CONSTRAINT IF EXISTS web_project_reviews_target_type_check;

ALTER TABLE web_project_reviews
  ADD CONSTRAINT web_project_reviews_target_type_check
  CHECK (target_type IN (
    'PROJECT', 'FORM_FIELD', 'ITEM', 'DOCUMENT',
    'MOCKUP', 'MOCKUP_PAGE', 'MOCKUP_SECTION'
  ));


-- Synced from migrations/015_web_project_development.sql
-- Additive only. Development handoff, plan, work items, dependencies, blockers, validation handoff.

CREATE TABLE IF NOT EXISTS web_project_development_handoffs (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  architecture_id INT NOT NULL REFERENCES web_project_architectures(id) ON DELETE RESTRICT,
  architecture_version INT NOT NULL CHECK (architecture_version > 0),
  mockup_id INT NOT NULL REFERENCES web_project_mockups(id) ON DELETE RESTRICT,
  mockup_version INT NOT NULL CHECK (mockup_version > 0),
  mockup_approved_at TIMESTAMPTZ,
  mockup_approved_by INT REFERENCES users(id) ON DELETE SET NULL,
  schema_version TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, web_project_id)
);

CREATE INDEX IF NOT EXISTS idx_web_project_development_handoffs_org_project
  ON web_project_development_handoffs(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_development_plans (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  handoff_id INT NOT NULL REFERENCES web_project_development_handoffs(id) ON DELETE RESTRICT,
  version INT NOT NULL CHECK (version > 0),
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'SUPERSEDED')),
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, web_project_id, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_web_project_development_plans_one_active
  ON web_project_development_plans(web_project_id)
  WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS web_project_development_items (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  development_plan_id INT NOT NULL REFERENCES web_project_development_plans(id) ON DELETE RESTRICT,
  item_type TEXT NOT NULL
    CHECK (item_type IN (
      'PROJECT_SETUP', 'GLOBAL_STYLES', 'HEADER', 'FOOTER', 'PAGE', 'TEMPLATE',
      'SECTION', 'CONTENT', 'MEDIA', 'FORM', 'INTEGRATION', 'SEO', 'LEGAL',
      'RESPONSIVE', 'ACCESSIBILITY', 'PERFORMANCE', 'ANALYTICS', 'MIGRATION',
      'REDIRECT', 'CUSTOM'
    )),
  title TEXT NOT NULL,
  description TEXT,
  architecture_page_id INT REFERENCES web_project_architecture_pages(id) ON DELETE SET NULL,
  architecture_block_id INT REFERENCES web_project_architecture_blocks(id) ON DELETE SET NULL,
  mockup_page_id INT REFERENCES web_project_mockup_pages(id) ON DELETE SET NULL,
  mockup_section_id INT REFERENCES web_project_mockup_sections(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'TODO'
    CHECK (status IN ('TODO', 'READY', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE', 'NOT_APPLICABLE')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM'
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  content_readiness TEXT NOT NULL DEFAULT 'NOT_APPLICABLE'
    CHECK (content_readiness IN ('READY', 'PARTIAL', 'MISSING', 'NOT_APPLICABLE')),
  sort_order INT NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_development_items_plan
  ON web_project_development_items(development_plan_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_web_project_development_items_org_project
  ON web_project_development_items(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_development_checklist_entries (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  development_item_id INT NOT NULL REFERENCES web_project_development_items(id) ON DELETE RESTRICT,
  label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_development_checklist_item
  ON web_project_development_checklist_entries(development_item_id, sort_order);

CREATE TABLE IF NOT EXISTS web_project_development_dependencies (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  development_plan_id INT NOT NULL REFERENCES web_project_development_plans(id) ON DELETE RESTRICT,
  item_id INT NOT NULL REFERENCES web_project_development_items(id) ON DELETE RESTRICT,
  depends_on_item_id INT NOT NULL REFERENCES web_project_development_items(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (item_id, depends_on_item_id),
  CHECK (item_id <> depends_on_item_id)
);

CREATE TABLE IF NOT EXISTS web_project_development_blockers (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  development_item_id INT NOT NULL REFERENCES web_project_development_items(id) ON DELETE RESTRICT,
  blocker_type TEXT NOT NULL
    CHECK (blocker_type IN (
      'CLIENT_CONTENT', 'CLIENT_ASSET', 'CLIENT_DECISION', 'INTERNAL_DECISION',
      'TECHNICAL_DEPENDENCY', 'EXTERNAL_PROVIDER', 'CREDENTIAL_REQUIRED', 'LEGAL', 'OTHER'
    )),
  description TEXT NOT NULL,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by INT REFERENCES users(id) ON DELETE SET NULL,
  resolution_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_web_project_development_blockers_item
  ON web_project_development_blockers(development_item_id, created_at DESC);

CREATE TABLE IF NOT EXISTS web_project_validation_handoffs (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  development_plan_id INT NOT NULL REFERENCES web_project_development_plans(id) ON DELETE RESTRICT,
  schema_version TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  readiness_state TEXT NOT NULL
    CHECK (readiness_state IN ('NOT_READY', 'READY_WITH_WARNINGS', 'READY')),
  override_used BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, web_project_id, development_plan_id)
);

CREATE INDEX IF NOT EXISTS idx_web_project_validation_handoffs_org_project
  ON web_project_validation_handoffs(organization_id, web_project_id);
-- Phase 16 — Web project validation / QA / publication readiness

CREATE TABLE IF NOT EXISTS web_project_validation_plans (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  validation_handoff_id INT NOT NULL REFERENCES web_project_validation_handoffs(id) ON DELETE RESTRICT,
  architecture_id INT REFERENCES web_project_architectures(id) ON DELETE SET NULL,
  architecture_version INT,
  mockup_id INT REFERENCES web_project_mockups(id) ON DELETE SET NULL,
  mockup_version INT,
  development_plan_id INT NOT NULL REFERENCES web_project_development_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'SUPERSEDED')),
  representative_samples JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, web_project_id, validation_handoff_id)
);

CREATE INDEX IF NOT EXISTS idx_web_project_validation_plans_org_project
  ON web_project_validation_plans(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_validation_runs (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  validation_plan_id INT NOT NULL REFERENCES web_project_validation_plans(id) ON DELETE RESTRICT,
  run_number INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'CLOSED')),
  started_by INT REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  UNIQUE (validation_plan_id, run_number)
);

CREATE INDEX IF NOT EXISTS idx_web_project_validation_runs_plan
  ON web_project_validation_runs(validation_plan_id, run_number DESC);

CREATE TABLE IF NOT EXISTS web_project_validation_checks (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  validation_plan_id INT NOT NULL REFERENCES web_project_validation_plans(id) ON DELETE RESTRICT,
  validation_run_id INT NOT NULL REFERENCES web_project_validation_runs(id) ON DELETE RESTRICT,
  category TEXT NOT NULL
    CHECK (category IN (
      'STRUCTURE', 'ROUTING', 'NAVIGATION', 'CONTENT', 'MEDIA', 'VISUAL', 'RESPONSIVE',
      'FUNCTIONAL', 'FORM', 'BOOKING', 'ECOMMERCE', 'INTEGRATION', 'SEO', 'LEGAL',
      'ACCESSIBILITY', 'PERFORMANCE', 'ANALYTICS', 'SECURITY', 'MIGRATION', 'REDIRECT', 'CUSTOM'
    )),
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT,
  source_id INT,
  architecture_page_id INT REFERENCES web_project_architecture_pages(id) ON DELETE SET NULL,
  architecture_block_id INT REFERENCES web_project_architecture_blocks(id) ON DELETE SET NULL,
  mockup_page_id INT REFERENCES web_project_mockup_pages(id) ON DELETE SET NULL,
  mockup_section_id INT REFERENCES web_project_mockup_sections(id) ON DELETE SET NULL,
  development_item_id INT REFERENCES web_project_development_items(id) ON DELETE SET NULL,
  template_group_key TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'PASS', 'FAIL', 'BLOCKED', 'NOT_TESTABLE', 'NOT_APPLICABLE')),
  severity_if_failed TEXT
    CHECK (severity_if_failed IS NULL OR severity_if_failed IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  required BOOLEAN NOT NULL DEFAULT TRUE,
  expected_result TEXT,
  actual_result TEXT,
  status_reason TEXT,
  tested_by INT REFERENCES users(id) ON DELETE SET NULL,
  tested_at TIMESTAMPTZ,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_validation_checks_plan
  ON web_project_validation_checks(validation_plan_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_web_project_validation_checks_run
  ON web_project_validation_checks(validation_run_id, category);

CREATE TABLE IF NOT EXISTS web_project_validation_evidence (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  validation_check_id INT NOT NULL REFERENCES web_project_validation_checks(id) ON DELETE RESTRICT,
  evidence_type TEXT NOT NULL
    CHECK (evidence_type IN ('SCREENSHOT', 'DOCUMENT', 'URL', 'TEXT_NOTE', 'AUTOMATED_RESULT')),
  label TEXT,
  url TEXT,
  text_note TEXT,
  document_id TEXT REFERENCES web_project_documents(id) ON DELETE SET NULL,
  automated_result JSONB,
  captured_at TIMESTAMPTZ,
  uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_validation_evidence_check
  ON web_project_validation_evidence(validation_check_id, created_at DESC);

CREATE TABLE IF NOT EXISTS web_project_validation_defects (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  validation_plan_id INT NOT NULL REFERENCES web_project_validation_plans(id) ON DELETE RESTRICT,
  validation_run_id INT REFERENCES web_project_validation_runs(id) ON DELETE SET NULL,
  check_id INT REFERENCES web_project_validation_checks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL
    CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'FIXED', 'RETEST_REQUIRED', 'VERIFIED', 'WONT_FIX')),
  assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
  development_item_id INT REFERENCES web_project_development_items(id) ON DELETE SET NULL,
  wont_fix_reason TEXT,
  resolution_note TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by INT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_web_project_validation_defects_plan
  ON web_project_validation_defects(validation_plan_id, status);

CREATE TABLE IF NOT EXISTS web_project_validation_check_results (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  validation_check_id INT NOT NULL REFERENCES web_project_validation_checks(id) ON DELETE RESTRICT,
  defect_id INT REFERENCES web_project_validation_defects(id) ON DELETE SET NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  actual_result TEXT,
  note TEXT,
  tested_by INT REFERENCES users(id) ON DELETE SET NULL,
  tested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_validation_check_results_check
  ON web_project_validation_check_results(validation_check_id, tested_at DESC);

CREATE TABLE IF NOT EXISTS web_project_publication_handoffs (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  validation_handoff_id INT NOT NULL REFERENCES web_project_validation_handoffs(id) ON DELETE RESTRICT,
  validation_plan_id INT NOT NULL REFERENCES web_project_validation_plans(id) ON DELETE RESTRICT,
  validation_run_id INT REFERENCES web_project_validation_runs(id) ON DELETE SET NULL,
  schema_version TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  readiness_state TEXT NOT NULL
    CHECK (readiness_state IN ('NOT_READY', 'READY_WITH_WARNINGS', 'READY')),
  override_used BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, web_project_id, validation_plan_id)
);

CREATE INDEX IF NOT EXISTS idx_web_project_publication_handoffs_org_project
  ON web_project_publication_handoffs(organization_id, web_project_id);

-- Phase 17 — Web project publication plan + completion handoff

CREATE TABLE IF NOT EXISTS web_project_publication_plans (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  publication_handoff_id INT NOT NULL REFERENCES web_project_publication_handoffs(id) ON DELETE RESTRICT,
  validation_plan_id INT NOT NULL REFERENCES web_project_validation_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'SUPERSEDED')),
  target_hostname TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, web_project_id, publication_handoff_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_web_project_publication_plans_one_active
  ON web_project_publication_plans(web_project_id)
  WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_web_project_publication_plans_org_project
  ON web_project_publication_plans(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_publication_steps (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  publication_plan_id INT NOT NULL REFERENCES web_project_publication_plans(id) ON DELETE RESTRICT,
  step_type TEXT NOT NULL
    CHECK (step_type IN (
      'PRELAUNCH_REVIEW', 'HOSTING_PREP', 'DNS_PREP', 'SSL_CERT', 'STAGING_VERIFY',
      'CONTENT_MIGRATION', 'REDIRECTS', 'INTEGRATIONS', 'ANALYTICS', 'MONITORING',
      'SEO_LAUNCH', 'LEGAL_LAUNCH', 'SMOKE_TEST', 'CLIENT_HANDOFF', 'POST_LAUNCH', 'CUSTOM'
    )),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'TODO'
    CHECK (status IN ('TODO', 'READY', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE', 'NOT_APPLICABLE')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM'
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  required BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  notes TEXT,
  evidence_url TEXT,
  assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_publication_steps_plan
  ON web_project_publication_steps(publication_plan_id, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_web_project_publication_steps_org_project
  ON web_project_publication_steps(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_publication_blockers (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  publication_plan_id INT NOT NULL REFERENCES web_project_publication_plans(id) ON DELETE RESTRICT,
  publication_step_id INT NOT NULL REFERENCES web_project_publication_steps(id) ON DELETE RESTRICT,
  blocker_type TEXT NOT NULL
    CHECK (blocker_type IN (
      'CLIENT_CONTENT', 'CLIENT_DECISION', 'CLIENT_CREDENTIAL', 'DNS_PROVIDER',
      'HOSTING_PROVIDER', 'EXTERNAL_PROVIDER', 'LEGAL', 'TECHNICAL', 'OTHER'
    )),
  description TEXT NOT NULL,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by INT REFERENCES users(id) ON DELETE SET NULL,
  resolution_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_web_project_publication_blockers_step
  ON web_project_publication_blockers(publication_step_id, created_at DESC);

CREATE TABLE IF NOT EXISTS web_project_completion_handoffs (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  publication_handoff_id INT NOT NULL REFERENCES web_project_publication_handoffs(id) ON DELETE RESTRICT,
  publication_plan_id INT NOT NULL REFERENCES web_project_publication_plans(id) ON DELETE RESTRICT,
  schema_version TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  readiness_state TEXT NOT NULL
    CHECK (readiness_state IN ('NOT_READY', 'READY_WITH_WARNINGS', 'READY')),
  override_used BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, web_project_id, publication_plan_id)
);

CREATE INDEX IF NOT EXISTS idx_web_project_completion_handoffs_org_project
  ON web_project_completion_handoffs(organization_id, web_project_id);
