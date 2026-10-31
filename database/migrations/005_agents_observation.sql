-- Phase 7 — ARGOS technical agents (remote observation only)
-- NO remote shell / SQL / exec / remediation transport
-- Down migration: 005_agents_observation_down.sql (manual)

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
