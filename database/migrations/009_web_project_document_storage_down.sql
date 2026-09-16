-- SCHEMA ROLLBACK PRE-DATA ONLY.
-- Do not use after real client documents exist in production.
-- Production application rollback: disable upload routes, keep tables and objects.

ALTER TABLE web_project_documents
  DROP CONSTRAINT IF EXISTS web_project_documents_upload_status_check;

ALTER TABLE web_project_documents
  DROP COLUMN IF EXISTS failed_at;

ALTER TABLE web_project_documents
  DROP COLUMN IF EXISTS stored_at;

ALTER TABLE web_project_documents
  DROP COLUMN IF EXISTS upload_status;
