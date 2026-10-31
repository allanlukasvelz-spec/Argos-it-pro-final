/**
 * Phase 7 — ensure agent tables (reads migration 005).
 */
const fs = require("fs");
const path = require("path");

async function ensureAgentsTables(pool) {
  const migrationPath = path.join(
    __dirname,
    "..",
    "..",
    "database",
    "migrations",
    "005_agents_observation.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf8");
  await pool.query(sql);
}

module.exports = { ensureAgentsTables };
