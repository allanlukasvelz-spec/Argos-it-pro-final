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
