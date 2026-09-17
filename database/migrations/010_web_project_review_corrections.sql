-- 010_web_project_review_corrections.sql
-- Additive only. Does not rewrite 008 or 009.
-- Extends web_project_reviews with granular targets.
-- Adds non-destructive document replacement.

ALTER TABLE web_project_reviews
  ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'PROJECT';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'web_project_reviews_target_type_check'
  ) THEN
    ALTER TABLE web_project_reviews
      ADD CONSTRAINT web_project_reviews_target_type_check
      CHECK (target_type IN ('PROJECT', 'FORM_FIELD', 'ITEM', 'DOCUMENT'));
  END IF;
END $$;

ALTER TABLE web_project_reviews
  ADD COLUMN IF NOT EXISTS target_id TEXT;

ALTER TABLE web_project_reviews
  ADD COLUMN IF NOT EXISTS target_key TEXT;

ALTER TABLE web_project_reviews
  ADD COLUMN IF NOT EXISTS correction_message TEXT;

ALTER TABLE web_project_reviews
  ADD COLUMN IF NOT EXISTS schema_version TEXT;

CREATE INDEX IF NOT EXISTS idx_web_project_reviews_target
  ON web_project_reviews(organization_id, web_project_id, target_type, target_id, target_key);

ALTER TABLE web_project_documents
  ADD COLUMN IF NOT EXISTS replaces_document_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'web_project_documents_replaces_document_id_fkey'
  ) THEN
    ALTER TABLE web_project_documents
      ADD CONSTRAINT web_project_documents_replaces_document_id_fkey
      FOREIGN KEY (replaces_document_id) REFERENCES web_project_documents(id) ON DELETE RESTRICT;
  END IF;
END $$;
