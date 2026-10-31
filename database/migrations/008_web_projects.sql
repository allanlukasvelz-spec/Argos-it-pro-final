-- Phase: web projects (expediente web)
-- Source of truth with database/schema.sql (keep DDL identical).
--
-- FK POLICY (no silent destruction of client documentation)
-- - organizations → web_projects: ON DELETE RESTRICT
--   Deleting an organization must fail if expedientes exist.
-- - web_projects → children: ON DELETE RESTRICT
--   Hard-delete of a project must fail while documents/comments/reviews/items/responses exist.
-- - website_asset_id → assets: ON DELETE SET NULL (asset registry can change; expediente remains)
-- - created_by / updated_by → users: ON DELETE SET NULL (actor may leave; history remains)
--
-- NO ON DELETE CASCADE on the documentation tree.
-- Lifecycle uses archived_at. Archive does not destroy rows.
--
-- workflow_status is commercial workflow. ARCHIVED is NOT a workflow status.
-- Multiple active web_projects per organization are allowed (no unique org+type).
--
-- scan_status: no CLEAN value. There is no malware scanner in CURRENT.
-- Default SCAN_NOT_AVAILABLE. Do not claim a file was scanned.
--
-- credential_status stores lifecycle only. NEVER a secret column.

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
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_reviews_org_project
  ON web_project_reviews(organization_id, web_project_id);

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
