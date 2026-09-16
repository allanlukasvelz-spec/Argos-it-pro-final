-- SCHEMA ROLLBACK PRE-DATA ONLY — Phase 18 archive metadata

ALTER TABLE web_projects DROP COLUMN IF EXISTS archive_reason;
ALTER TABLE web_projects DROP COLUMN IF EXISTS archived_by;
