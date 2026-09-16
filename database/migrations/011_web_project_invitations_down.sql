-- SCHEMA ROLLBACK PRE-DATA ONLY
-- Do not run against databases that already contain invitation rows.

DROP INDEX IF EXISTS idx_web_project_invitations_expires;
DROP INDEX IF EXISTS idx_web_project_invitations_org;
DROP INDEX IF EXISTS idx_web_project_invitations_email_status;
DROP TABLE IF EXISTS web_project_invitations;
