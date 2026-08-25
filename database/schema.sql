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
