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
