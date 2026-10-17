#!/usr/bin/env node
/**
 * Phase 13 closure — validate migration 013 on local/test PostgreSQL.
 * Run from repo root: node scripts/phase13-validate-postgres.js
 */
const path = require("path");
const fs = require("fs");
const backendDir = path.join(__dirname, "..", "backend");
require(path.join(backendDir, "node_modules", "dotenv")).config({
  path: path.join(backendDir, ".env")
});
const { Pool } = require(path.join(backendDir, "node_modules", "pg"));
const { ensureWebProjects } = require(path.join(backendDir, "lib", "ensureWebProjects"));

const REQUIRED_TABLES = [
  "web_project_architectures",
  "web_project_architecture_pages",
  "web_project_architecture_blocks"
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("BLOCKED: DATABASE_URL missing in backend/.env");
    process.exit(2);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await ensureWebProjects(pool);

    const tables = await pool.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1::text[]) ORDER BY tablename`,
      [REQUIRED_TABLES]
    );
    const found = tables.rows.map((r) => r.tablename);
    for (const name of REQUIRED_TABLES) {
      if (!found.includes(name)) {
        console.error(`FAIL: missing table ${name}`);
        process.exit(1);
      }
    }
    console.log("TABLES_OK:", found.join(", "));

    const indexes = await pool.query(
      `SELECT indexname, tablename FROM pg_indexes
       WHERE schemaname = 'public' AND tablename LIKE 'web_project_architecture%'
       ORDER BY tablename, indexname`
    );
    console.log("INDEXES:", indexes.rows.map((r) => `${r.tablename}.${r.indexname}`).join("; "));

    const draftIdx = indexes.rows.find((r) => r.indexname === "idx_web_project_architectures_one_draft");
    if (!draftIdx) {
      console.error("FAIL: missing partial unique DRAFT index");
      process.exit(1);
    }
    console.log("DRAFT_PARTIAL_UNIQUE_OK");

    const fks = await pool.query(
      `SELECT conname, conrelid::regclass AS table_name
       FROM pg_constraint
       WHERE contype = 'f' AND conrelid::regclass::text LIKE 'web_project_architecture%'`
    );
    console.log("FK_COUNT:", fks.rowCount);

    const checks = await pool.query(
      `SELECT conname, conrelid::regclass AS table_name
       FROM pg_constraint
       WHERE contype = 'c' AND conrelid::regclass::text LIKE 'web_project_architecture%'`
    );
    console.log("CHECK_COUNT:", checks.rowCount);

    const cols = await pool.query(
      `SELECT table_name, column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name LIKE 'web_project_architecture%'
       ORDER BY table_name, ordinal_position`
    );
    const secretCols = cols.rows.filter((c) =>
      /object_key|secret|credential/i.test(c.column_name)
    );
    if (secretCols.length > 0) {
      console.error("FAIL: unexpected secret-like columns", secretCols);
      process.exit(1);
    }
    console.log("NO_SECRET_COLUMNS_OK");

    const org = await pool.query(`SELECT id FROM organizations ORDER BY id LIMIT 1`);
    const user = await pool.query(`SELECT id FROM users ORDER BY id LIMIT 1`);
    if (!org.rows[0] || !user.rows[0]) {
      console.log("INSERT_SKIP: no org/user seed for live insert probe");
    } else {
      const orgId = org.rows[0].id;
      const userId = user.rows[0].id;
      const proj = await pool.query(
        `INSERT INTO web_projects (organization_id, title, project_type, workflow_status, created_by)
         VALUES ($1, 'PG13 probe', 'create', 'ARCHITECTURE', $2)
         RETURNING id`,
        [orgId, userId]
      );
      const projectId = proj.rows[0].id;
      const arch = await pool.query(
        `INSERT INTO web_project_architectures
           (organization_id, web_project_id, version, status, primary_language, created_by)
         VALUES ($1, $2, 1, 'DRAFT', 'es', $3)
         RETURNING id`,
        [orgId, projectId, userId]
      );
      const archId = arch.rows[0].id;
      const page = await pool.query(
        `INSERT INTO web_project_architecture_pages
           (organization_id, web_project_id, architecture_id, title, slug, route,
            page_type, template_type, sort_order, navigation_placement, seo_priority, content_readiness)
         VALUES ($1,$2,$3,'Inicio','','/','HOME','SYSTEM',0,'PRIMARY','HIGH','READY')
         RETURNING id`,
        [orgId, projectId, archId]
      );
      const pageId = page.rows[0].id;
      await pool.query(
        `INSERT INTO web_project_architecture_blocks
           (organization_id, web_project_id, architecture_id, architecture_page_id,
            block_type, sort_order, purpose, required)
         VALUES ($1,$2,$3,$4,'HERO',0,'Probe',false)`,
        [orgId, projectId, archId, pageId]
      );
      const dupDraft = await pool.query(
        `INSERT INTO web_project_architectures
           (organization_id, web_project_id, version, status, created_by)
         VALUES ($1, $2, 2, 'DRAFT', $3)`,
        [orgId, projectId, userId]
      ).catch((err) => err);
      if (!dupDraft.code || dupDraft.code !== "23505") {
        console.error("FAIL: second DRAFT should violate partial unique index");
        process.exit(1);
      }
      console.log("DRAFT_UNIQUE_ENFORCED_OK");
      await pool.query(`DELETE FROM web_project_architecture_blocks WHERE web_project_id = $1`, [projectId]);
      await pool.query(`DELETE FROM web_project_architecture_pages WHERE web_project_id = $1`, [projectId]);
      await pool.query(`DELETE FROM web_project_architectures WHERE web_project_id = $1`, [projectId]);
      await pool.query(`DELETE FROM web_projects WHERE id = $1`, [projectId]);
      console.log("INSERT_PROBE_OK");
    }

    console.log("POSTGRES_VALIDATION_PASS");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("POSTGRES_VALIDATION_FAIL:", err.message);
  process.exit(1);
});
