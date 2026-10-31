-- Phase 0 — Organizations / tenant foundation (idempotent, non-destructive)
-- Branch: feature/argos-multitenant-platform
-- Does NOT DROP data. Safe to re-run.

BEGIN;

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

CREATE INDEX IF NOT EXISTS idx_organization_members_user
  ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org
  ON organization_members(organization_id);

-- Nullable organization_id on existing tenant-scoped tables (backfill separate)
ALTER TABLE client_services
  ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE website_audits
  ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE client_improvements
  ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE client_messages
  ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE security_logs
  ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL;

-- client_diagnostics may not exist yet on fresh DBs; ensure via backend boot.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_diagnostics'
  ) THEN
    ALTER TABLE client_diagnostics
      ADD COLUMN IF NOT EXISTS organization_id INT REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_client_services_org ON client_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_website_audits_org ON website_audits(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_improvements_org ON client_improvements(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_org ON client_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_org ON form_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_org ON security_logs(organization_id);

COMMIT;
