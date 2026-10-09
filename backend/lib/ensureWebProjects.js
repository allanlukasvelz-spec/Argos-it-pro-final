/**
 * Boot compatibility: apply 008–012 verbatim.
 * Does not duplicate DDL. Same pattern as ensurePhase8Tables.
 */
const fs = require("fs");
const path = require("path");

const MIGRATIONS = [
  "008_web_projects.sql",
  "009_web_project_document_storage.sql",
  "010_web_project_review_corrections.sql",
  "011_web_project_invitations.sql",
  "012_web_project_brief_handoff.sql",
  "013_web_project_architecture.sql",
  "014_web_project_mockups.sql",
  "015_web_project_development.sql",
  "016_web_project_validation.sql",
  "017_web_project_publication.sql",
  "018_web_project_archive_metadata.sql"
];

async function ensureMockupActiveDraftIndex(pool) {
  // 014 defines one editable mockup per project (DRAFT | INTERNAL_REVIEW only).
  // Older local DBs may have CHANGES_REQUESTED in this partial index, which blocks revision v2.
  await pool.query(`
    DROP INDEX IF EXISTS idx_web_project_mockups_one_active_draft;
    CREATE UNIQUE INDEX idx_web_project_mockups_one_active_draft
      ON web_project_mockups(web_project_id)
      WHERE status IN ('DRAFT', 'INTERNAL_REVIEW');
  `);
}

async function ensureWebProjects(pool) {
  const dir = path.join(__dirname, "..", "..", "database", "migrations");
  for (const filename of MIGRATIONS) {
    const sql = fs.readFileSync(path.join(dir, filename), "utf8");
    await pool.query(sql);
  }
  await ensureMockupActiveDraftIndex(pool);
}

module.exports = { ensureWebProjects, ensureMockupActiveDraftIndex };
