-- SCHEMA ROLLBACK PRE-DATA ONLY
-- Do not run against databases that already contain brief/handoff rows.

DROP INDEX IF EXISTS idx_web_project_architecture_handoffs_org_project;
DROP TABLE IF EXISTS web_project_architecture_handoffs;
DROP INDEX IF EXISTS idx_web_project_brief_notes_org_project;
DROP TABLE IF EXISTS web_project_brief_notes;
