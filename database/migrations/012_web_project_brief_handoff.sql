-- 012_web_project_brief_handoff.sql
-- Additive only. Does not rewrite 008–011.
-- Internal ARGOS brief notes + immutable architecture handoff snapshot.
-- Questionnaire answers remain in web_project_form_responses (source of truth).

CREATE TABLE IF NOT EXISTS web_project_brief_notes (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  note_type TEXT NOT NULL
    CHECK (note_type IN (
      'ARCHITECTURE_NOTE',
      'ASSUMPTION',
      'EXCLUSION',
      'RISK',
      'DECISION_REQUIRED'
    )),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'RESOLVED')),
  blocking BOOLEAN NOT NULL DEFAULT FALSE,
  severity TEXT
    CHECK (severity IS NULL OR severity IN ('LOW', 'MEDIUM', 'HIGH')),
  resolution_note TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_web_project_brief_notes_org_project
  ON web_project_brief_notes(organization_id, web_project_id);

CREATE TABLE IF NOT EXISTS web_project_architecture_handoffs (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  web_project_id INT NOT NULL REFERENCES web_projects(id) ON DELETE RESTRICT,
  schema_version TEXT NOT NULL,
  payload JSONB NOT NULL,
  readiness_state TEXT NOT NULL,
  override_used BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, web_project_id)
);

CREATE INDEX IF NOT EXISTS idx_web_project_architecture_handoffs_org_project
  ON web_project_architecture_handoffs(organization_id, web_project_id);
