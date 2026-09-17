-- 011_web_project_invitations.sql
-- Additive only. Does not rewrite 008, 009 or 010.
-- Client invitation + onboarding. Token stored as hash only.

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
