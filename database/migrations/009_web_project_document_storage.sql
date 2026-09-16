-- Web project document binary storage (FASE 3).
-- Does not rewrite 008. Adds upload lifecycle only.
-- upload_status: PENDING = metadata without confirmed bytes
--                STORED  = object confirmed in store
--                FAILED  = write/compensation failed
-- CLEAN is not a scan_status. No scanner in CURRENT.

ALTER TABLE web_project_documents
  ADD COLUMN IF NOT EXISTS upload_status TEXT NOT NULL DEFAULT 'PENDING';

ALTER TABLE web_project_documents
  ADD COLUMN IF NOT EXISTS stored_at TIMESTAMPTZ;

ALTER TABLE web_project_documents
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

ALTER TABLE web_project_documents
  DROP CONSTRAINT IF EXISTS web_project_documents_upload_status_check;

ALTER TABLE web_project_documents
  ADD CONSTRAINT web_project_documents_upload_status_check
  CHECK (upload_status IN ('PENDING', 'STORED', 'FAILED'));
