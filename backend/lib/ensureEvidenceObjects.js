/**
 * Evidence object metadata table (migration 006).
 */
const fs = require("fs");
const path = require("path");

async function ensureEvidenceObjectsTable(pool) {
  const migrationPath = path.join(
    __dirname,
    "..",
    "..",
    "database",
    "migrations",
    "006_evidence_objects.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf8");
  await pool.query(sql);
}

module.exports = { ensureEvidenceObjectsTable };
