-- Phase 3 — Monitors, checks, observations, alerts, incidents (idempotent)
-- Branch: feature/argos-multitenant-platform
-- No secrets in config. No DROP of Phase 0–2 data.

BEGIN;

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_monitors_org_asset_type_active
  ON monitors (organization_id, asset_id, type)
  WHERE enabled = true AND status <> 'DISABLED';

CREATE INDEX IF NOT EXISTS idx_monitors_organization ON monitors(organization_id);
CREATE INDEX IF NOT EXISTS idx_monitors_asset ON monitors(asset_id);
CREATE INDEX IF NOT EXISTS idx_monitors_next_check
  ON monitors(next_check_at)
  WHERE enabled = true AND status = 'ACTIVE';

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

CREATE INDEX IF NOT EXISTS idx_monitor_checks_org ON monitor_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_monitor_checks_monitor ON monitor_checks(monitor_id, created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_observations_org_asset_time
  ON observations(organization_id, asset_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_observations_monitor_time
  ON observations(monitor_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_observations_org ON observations(organization_id);

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_org_fingerprint_open
  ON alerts (organization_id, fingerprint)
  WHERE state IN ('OPEN', 'ACKNOWLEDGED');

CREATE INDEX IF NOT EXISTS idx_alerts_org_state ON alerts(organization_id, state);
CREATE INDEX IF NOT EXISTS idx_alerts_asset ON alerts(organization_id, asset_id);

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_incidents_org_correlation_open
  ON incidents (organization_id, correlation_key)
  WHERE state IN ('OPEN', 'INVESTIGATING', 'MITIGATED');

CREATE INDEX IF NOT EXISTS idx_incidents_org_state ON incidents(organization_id, state);
CREATE INDEX IF NOT EXISTS idx_incidents_asset ON incidents(organization_id, asset_id);

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

CREATE INDEX IF NOT EXISTS idx_incident_events_incident
  ON incident_events(incident_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_incident_events_org
  ON incident_events(organization_id);

COMMIT;
