-- 015_web_project_development.sql
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
