-- SCHEMA ROLLBACK PRE-DATA ONLY.
-- Do not use after real reviews or document replacements exist in production.

ALTER TABLE web_project_documents
  DROP CONSTRAINT IF EXISTS web_project_documents_replaces_document_id_fkey;

ALTER TABLE web_project_documents
  DROP COLUMN IF EXISTS replaces_document_id;

DROP INDEX IF EXISTS idx_web_project_reviews_target;

ALTER TABLE web_project_reviews
  DROP CONSTRAINT IF EXISTS web_project_reviews_target_type_check;

ALTER TABLE web_project_reviews
  DROP COLUMN IF EXISTS schema_version;

ALTER TABLE web_project_reviews
  DROP COLUMN IF EXISTS correction_message;

ALTER TABLE web_project_reviews
  DROP COLUMN IF EXISTS target_key;

ALTER TABLE web_project_reviews
  DROP COLUMN IF EXISTS target_id;

ALTER TABLE web_project_reviews
  DROP COLUMN IF EXISTS target_type;
