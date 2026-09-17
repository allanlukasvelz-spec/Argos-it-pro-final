-- Phase 2 — Asset registry + TLS certificates (idempotent, non-destructive)
-- Branch: feature/argos-multitenant-platform
-- No private keys. No DROP of existing data.

BEGIN;

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

CREATE INDEX IF NOT EXISTS idx_assets_organization ON assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_org_type ON assets(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_assets_hostname ON assets(organization_id, lower(hostname))
  WHERE hostname IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_org_hostname_type_active
  ON assets (organization_id, lower(hostname), type)
  WHERE hostname IS NOT NULL AND status <> 'archived';

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

CREATE INDEX IF NOT EXISTS idx_tls_certificates_organization ON tls_certificates(organization_id);
CREATE INDEX IF NOT EXISTS idx_tls_certificates_asset ON tls_certificates(asset_id);
CREATE INDEX IF NOT EXISTS idx_tls_certificates_fingerprint
  ON tls_certificates(organization_id, fingerprint_sha256)
  WHERE fingerprint_sha256 IS NOT NULL;

COMMIT;
