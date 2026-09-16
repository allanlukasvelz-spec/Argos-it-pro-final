-- 014_web_project_mockups_down.sql — rollback Phase 14 mockup tables only.

ALTER TABLE web_project_reviews DROP CONSTRAINT IF EXISTS web_project_reviews_target_type_check;
ALTER TABLE web_project_reviews
  ADD CONSTRAINT web_project_reviews_target_type_check
  CHECK (target_type IN ('PROJECT', 'FORM_FIELD', 'ITEM', 'DOCUMENT'));

DROP TABLE IF EXISTS web_project_mockup_sections;
DROP TABLE IF EXISTS web_project_mockup_pages;
DROP TABLE IF EXISTS web_project_mockups;
