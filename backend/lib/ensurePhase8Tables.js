const fs = require("fs");
const path = require("path");

async function ensurePhase8Tables(pool) {
  const migrationPath = path.join(
    __dirname,
    "..",
    "..",
    "database",
    "migrations",
    "007_phase8_reports_notifications.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf8");
  await pool.query(sql);
}

module.exports = { ensurePhase8Tables };
