-- SCHEMA ROLLBACK PRE-DATA ONLY.
--
-- This file may drop empty development/pre-production tables.
-- It is NOT a production application rollback after real expedientes exist.
--
-- PRODUCTION APPLICATION ROLLBACK (data present):
--   1. Disable routes / feature flag
--   2. Keep tables and objects
--   3. Remove navigation
--   4. Restore previous application
--   5. Do NOT DROP TABLE
--
-- NEVER use these DROP statements to "roll back" client documentation.

DROP TABLE IF EXISTS web_project_credential_status;
DROP TABLE IF EXISTS web_project_form_responses;
DROP TABLE IF EXISTS web_project_reviews;
DROP TABLE IF EXISTS web_project_comments;
DROP TABLE IF EXISTS web_project_documents;
DROP TABLE IF EXISTS web_project_items;
DROP TABLE IF EXISTS web_projects;
