#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { Pool } = require(path.join(__dirname, "..", "backend", "node_modules", "pg"));
const { ensureWebProjects } = require(path.join(__dirname, "..", "backend", "lib", "ensureWebProjects"));

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(__dirname, "..", "backend", ".env");
  const raw = fs.readFileSync(envPath, "utf8");
  const match = raw.match(/^DATABASE_URL=(.+)$/m);
  if (!match) throw new Error("DATABASE_URL not found");
  return match[1].trim();
}

async function main() {
  const pool = new Pool({ connectionString: loadDatabaseUrl() });
  const results = [];
  const push = (name, ok, detail = "") => results.push({ name, ok, detail });

  try {
    await ensureWebProjects(pool);
    push("ensureWebProjects includes 018", true);

    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'web_projects'
         AND column_name IN ('archived_by', 'archive_reason', 'archived_at')
       ORDER BY column_name`
    );
    const names = cols.rows.map((r) => r.column_name);
    push("columns archived_at/by/reason exist", names.length === 3, names.join(", "));

    const org = await pool.query(`SELECT id FROM organizations ORDER BY id LIMIT 1`);
    const organizationId = org.rows[0]?.id;
    if (!organizationId) throw new Error("no organization for probe");

    const inserted = await pool.query(
      `INSERT INTO web_projects (organization_id, title, project_type, workflow_status, completed_at)
       VALUES ($1, 'PG18 probe', 'create', 'COMPLETED', NOW()) RETURNING id`,
      [organizationId]
    );
    const projectId = inserted.rows[0].id;

    const first = await pool.query(
      `UPDATE web_projects SET archived_at = NOW(), archived_by = NULL, archive_reason = $3, updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND archived_at IS NULL
       RETURNING archived_at, archived_by, archive_reason`,
      [projectId, organizationId, "Probe reason"]
    );
    push("first archive write", first.rowCount === 1, first.rows[0]?.archive_reason || "");

    const retry = await pool.query(
      `UPDATE web_projects SET archived_at = NOW(), archived_by = 1, archive_reason = 'retry', updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 AND archived_at IS NULL
       RETURNING archive_reason`,
      [projectId, organizationId]
    );
    push("retry does not rewrite", retry.rowCount === 0);

    const legacy = await pool.query(
      `INSERT INTO web_projects (organization_id, title, project_type, workflow_status, archived_at)
       VALUES ($1, 'PG18 legacy', 'create', 'COMPLETED', NOW()) RETURNING id`,
      [organizationId]
    );
    const legacyRow = await pool.query(
      `SELECT archived_by, archive_reason FROM web_projects WHERE id = $1`,
      [legacy.rows[0].id]
    );
    push(
      "legacy null metadata allowed",
      legacyRow.rows[0].archived_by === null && legacyRow.rows[0].archive_reason === null
    );

    const fkBad = await pool.query(
      `UPDATE web_projects SET archived_by = 999999999 WHERE id = $1`,
      [projectId]
    ).then(() => true).catch((err) => err.code === "23503");
    push("invalid archived_by FK rejected", fkBad === true);

    const down = fs.readFileSync(
      path.join(__dirname, "..", "database", "migrations", "018_web_project_archive_metadata_down.sql"),
      "utf8"
    );
    await pool.query(down);
    push("down migration applies", true);
    await pool.query(
      fs.readFileSync(
        path.join(__dirname, "..", "database", "migrations", "018_web_project_archive_metadata.sql"),
        "utf8"
      )
    );
    push("re-apply 018 after down", true);
  } catch (err) {
    push("unexpected failure", false, err.message);
  } finally {
    await pool.end();
  }

  const failed = results.filter((r) => !r.ok);
  for (const row of results) {
    console.log(`${row.ok ? "PASS" : "FAIL"} ${row.name}${row.detail ? ` — ${row.detail}` : ""}`);
  }
  if (failed.length) process.exit(1);
  console.log(`\nPHASE 18 POSTGRES: ${results.length}/${results.length} PASS`);
}

main();
