-- Phase 18 — Web project archive metadata (archived_by, archive_reason)
-- ARCHIVED remains lifecycle via archived_at; not a workflow_status.

ALTER TABLE web_projects
  ADD COLUMN IF NOT EXISTS archived_by INT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE web_projects
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;
