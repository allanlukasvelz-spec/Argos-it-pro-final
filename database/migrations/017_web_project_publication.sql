-- Phase 17 — Web project publication plan + completion handoff

CREATE TABLE IF NOT EXISTS web_project_publication_plans (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  publication_handoff_id INT NOT NULL REFERENCES web_project_publication_handoffs(id) ON DELETE RESTRICT,
  validation_plan_id INT NOT NULL REFERENCES web_project_validation_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'SUPERSEDED')),
  target_hostname TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, web_project_id, publication_handoff_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_web_project_publication_plans_one_active
  ON web_project_publication_plans(web_project_id)
  WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_web_project_publication_plans_org_project
  ON web_project_publication_plans(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_publication_steps (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  publication_plan_id INT NOT NULL REFERENCES web_project_publication_plans(id) ON DELETE RESTRICT,
  step_type TEXT NOT NULL
    CHECK (step_type IN (
      'PRELAUNCH_REVIEW', 'HOSTING_PREP', 'DNS_PREP', 'SSL_CERT', 'STAGING_VERIFY',
      'CONTENT_MIGRATION', 'REDIRECTS', 'INTEGRATIONS', 'ANALYTICS', 'MONITORING',
      'SEO_LAUNCH', 'LEGAL_LAUNCH', 'SMOKE_TEST', 'CLIENT_HANDOFF', 'POST_LAUNCH', 'CUSTOM'
    )),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'TODO'
    CHECK (status IN ('TODO', 'READY', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE', 'NOT_APPLICABLE')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM'
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  required BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  notes TEXT,
  evidence_url TEXT,
  assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_project_publication_steps_plan
  ON web_project_publication_steps(publication_plan_id, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_web_project_publication_steps_org_project
  ON web_project_publication_steps(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_publication_blockers (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  publication_plan_id INT NOT NULL REFERENCES web_project_publication_plans(id) ON DELETE RESTRICT,
  publication_step_id INT NOT NULL REFERENCES web_project_publication_steps(id) ON DELETE RESTRICT,
  blocker_type TEXT NOT NULL
    CHECK (blocker_type IN (
      'CLIENT_CONTENT', 'CLIENT_DECISION', 'CLIENT_CREDENTIAL', 'DNS_PROVIDER',
      'HOSTING_PROVIDER', 'EXTERNAL_PROVIDER', 'LEGAL', 'TECHNICAL', 'OTHER'
    )),
  description TEXT NOT NULL,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by INT REFERENCES users(id) ON DELETE SET NULL,
  resolution_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_web_project_publication_blockers_step
  ON web_project_publication_blockers(publication_step_id, created_at DESC);

CREATE TABLE IF NOT EXISTS web_project_completion_handoffs (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  publication_handoff_id INT NOT NULL REFERENCES web_project_publication_handoffs(id) ON DELETE RESTRICT,
  publication_plan_id INT NOT NULL REFERENCES web_project_publication_plans(id) ON DELETE RESTRICT,
  schema_version TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  readiness_state TEXT NOT NULL
    CHECK (readiness_state IN ('NOT_READY', 'READY_WITH_WARNINGS', 'READY')),
  override_used BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, web_project_id, publication_plan_id)
);

CREATE INDEX IF NOT EXISTS idx_web_project_completion_handoffs_org_project
  ON web_project_completion_handoffs(organization_id, web_project_id);
