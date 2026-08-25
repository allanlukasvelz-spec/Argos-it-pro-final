-- Phase 8 — reports, platform jobs, in-app notifications (LOCAL/TEST — not production)
-- Down: 007_phase8_reports_notifications_down.sql

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY
    CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  title TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_runs (
  id TEXT PRIMARY KEY
    CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id INT REFERENCES incidents(id) ON DELETE SET NULL,
  status TEXT NOT NULL
    CHECK (status IN (
      'REQUESTED', 'QUEUED', 'GENERATING', 'STORING', 'READY', 'FAILED', 'EXPIRED'
    )),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  template_version TEXT NOT NULL,
  evidence_object_id TEXT REFERENCES evidence_objects(id) ON DELETE SET NULL,
  data_freshness TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,
  idempotency_key TEXT NOT NULL,
  requested_by INT REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_report_runs_org_status
  ON report_runs(organization_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_runs_report
  ON report_runs(report_id, created_at DESC);

CREATE TABLE IF NOT EXISTS platform_jobs (
  id BIGSERIAL PRIMARY KEY,
  job_type TEXT NOT NULL,
  organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN (
      'QUEUED', 'CLAIMED', 'RUNNING', 'COMPLETED', 'FAILED',
      'RETRY_WAIT', 'DEAD_LETTER'
    )),
  idempotency_key TEXT NOT NULL UNIQUE,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_by TEXT,
  claimed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_jobs_poll
  ON platform_jobs(status, run_after)
  WHERE status IN ('QUEUED', 'RETRY_WAIT');

CREATE TABLE IF NOT EXISTS notification_events (
  id TEXT PRIMARY KEY
    CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'INFO',
  scope_type TEXT,
  scope_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY
    CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES notification_events(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_target TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id, event_type)
);
