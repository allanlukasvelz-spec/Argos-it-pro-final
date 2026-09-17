#!/usr/bin/env node
/**
 * Phase 15 — real PostgreSQL validation (local/test only).
 */
const fs = require("fs");
const path = require("path");
const { Pool } = require(path.join(__dirname, "..", "backend", "node_modules", "pg"));

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(__dirname, "..", "backend", ".env");
  const raw = fs.readFileSync(envPath, "utf8");
  const match = raw.match(/^DATABASE_URL=(.+)$/m);
  if (!match) throw new Error("DATABASE_URL not found");
  return match[1].trim();
}

const TABLES = [
  "web_project_development_handoffs",
  "web_project_development_plans",
  "web_project_development_items",
  "web_project_development_checklist_entries",
  "web_project_development_dependencies",
  "web_project_development_blockers",
  "web_project_validation_handoffs"
];

async function main() {
  const pool = new Pool({ connectionString: loadDatabaseUrl() });
  const results = [];
  const push = (name, ok, detail = "") => results.push({ name, ok, detail });

  try {
    for (const table of TABLES) {
      const r = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
        [table]
      );
      push(`table ${table}`, r.rows.length > 0, `${r.rows.length} columns`);
    }

    const fk = await pool.query(`
      SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (tc.table_name LIKE 'web_project_development%' OR tc.table_name = 'web_project_validation_handoffs')
    `);
    push("foreign keys present", fk.rows.length >= 10, `${fk.rows.length} FK rows`);

    const checks = await pool.query(`
      SELECT conrelid::regclass::text AS table_name, conname
      FROM pg_constraint
      WHERE contype = 'c'
        AND conrelid::regclass::text IN (${TABLES.map((_, i) => `$${i + 1}`).join(",")})
    `, TABLES);
    push("CHECK constraints", checks.rows.length >= 5, `${checks.rows.length} checks`);

    const org = await pool.query(`SELECT id FROM organizations ORDER BY id LIMIT 1`);
    if (!org.rows[0]) throw new Error("No organization for probe");
    const organizationId = org.rows[0].id;

    const proj = await pool.query(
      `INSERT INTO web_projects (organization_id, title, project_type, workflow_status, created_by)
       VALUES ($1, 'PG15 probe', 'create', 'DEVELOPMENT', NULL)
       RETURNING id`,
      [organizationId]
    );
    const projectId = proj.rows[0].id;

    const arch = await pool.query(
      `INSERT INTO web_project_architectures (organization_id, web_project_id, version, status, primary_language, created_by)
       VALUES ($1, $2, 1, 'APPROVED', 'es', NULL) RETURNING id`,
      [organizationId, projectId]
    );
    const architectureId = arch.rows[0].id;

    const mock = await pool.query(
      `INSERT INTO web_project_mockups (
         organization_id, web_project_id, architecture_id, architecture_version, version, status, approved_at, created_by
       ) VALUES ($1, $2, $3, 1, 1, 'APPROVED', NOW(), NULL) RETURNING id`,
      [organizationId, projectId, architectureId]
    );
    const mockupId = mock.rows[0].id;

    const handoff = await pool.query(
      `INSERT INTO web_project_development_handoffs (
         organization_id, web_project_id, architecture_id, architecture_version,
         mockup_id, mockup_version, schema_version, payload, created_by
       ) VALUES ($1,$2,$3,1,$4,1,'web-project-development-handoff.v1','{}',NULL)
       RETURNING id`,
      [organizationId, projectId, architectureId, mockupId]
    );
    push("INSERT handoff", Boolean(handoff.rows[0]), `id=${handoff.rows[0].id}`);

    let dupBlocked = false;
    try {
      await pool.query(
        `INSERT INTO web_project_development_handoffs (
           organization_id, web_project_id, architecture_id, architecture_version,
           mockup_id, mockup_version, schema_version, payload
         ) VALUES ($1,$2,$3,1,$4,1,'v','{}')`,
        [organizationId, projectId, architectureId, mockupId]
      );
    } catch (err) {
      dupBlocked = err.code === "23505";
    }
    push("handoff UNIQUE per project", dupBlocked, "23505 on duplicate");

    const plan = await pool.query(
      `INSERT INTO web_project_development_plans (organization_id, web_project_id, handoff_id, version, status)
       VALUES ($1,$2,$3,1,'ACTIVE') RETURNING id`,
      [organizationId, projectId, handoff.rows[0].id]
    );
    const planId = plan.rows[0].id;

    const itemA = await pool.query(
      `INSERT INTO web_project_development_items (
         organization_id, web_project_id, development_plan_id, item_type, title, status, priority, content_readiness, required
       ) VALUES ($1,$2,$3,'GLOBAL_STYLES','Styles','READY','HIGH','NOT_APPLICABLE',true) RETURNING id`,
      [organizationId, projectId, planId]
    );
    const itemB = await pool.query(
      `INSERT INTO web_project_development_items (
         organization_id, web_project_id, development_plan_id, item_type, title, status, priority, content_readiness, required
       ) VALUES ($1,$2,$3,'PAGE','Home','TODO','MEDIUM','PARTIAL',true) RETURNING id`,
      [organizationId, projectId, planId]
    );

    await pool.query(
      `INSERT INTO web_project_development_dependencies (organization_id, web_project_id, development_plan_id, item_id, depends_on_item_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [organizationId, projectId, planId, itemB.rows[0].id, itemA.rows[0].id]
    );
    push("INSERT dependency", true);

    let selfDep = false;
    try {
      await pool.query(
        `INSERT INTO web_project_development_dependencies (organization_id, web_project_id, development_plan_id, item_id, depends_on_item_id)
         VALUES ($1,$2,$3,$4,$4)`,
        [organizationId, projectId, planId, itemA.rows[0].id]
      );
    } catch (err) {
      selfDep = err.code === "23514" || err.message.includes("check");
    }
    push("self dependency CHECK blocked", selfDep);

    let badStatus = false;
    try {
      await pool.query(
        `UPDATE web_project_development_items SET status = 'INVALID' WHERE id = $1`,
        [itemA.rows[0].id]
      );
    } catch (err) {
      badStatus = err.code === "23514";
    }
    push("invalid status CHECK blocked", badStatus);

    await pool.query(
      `INSERT INTO web_project_development_checklist_entries (organization_id, web_project_id, development_item_id, label, required)
       VALUES ($1,$2,$3,'Hero',true)`,
      [organizationId, projectId, itemB.rows[0].id]
    );
    push("INSERT checklist", true);

    await pool.query(
      `INSERT INTO web_project_development_blockers (organization_id, web_project_id, development_item_id, blocker_type, description)
       VALUES ($1,$2,$3,'CLIENT_CONTENT','Falta copy neutral')`,
      [organizationId, projectId, itemB.rows[0].id]
    );
    push("INSERT blocker", true);

    await pool.query(
      `INSERT INTO web_project_validation_handoffs (
         organization_id, web_project_id, development_plan_id, schema_version, payload, readiness_state
       ) VALUES ($1,$2,$3,'web-project-validation-handoff.v1','{\"progress\":100}','READY')`,
      [organizationId, projectId, planId]
    );
    push("INSERT validation handoff", true);

    await pool.query(`DELETE FROM web_project_validation_handoffs WHERE web_project_id = $1`, [projectId]);
    await pool.query(
      `DELETE FROM web_project_development_blockers WHERE development_item_id IN
       (SELECT id FROM web_project_development_items WHERE web_project_id = $1)`,
      [projectId]
    );
    await pool.query(
      `DELETE FROM web_project_development_checklist_entries WHERE web_project_id = $1`,
      [projectId]
    );
    await pool.query(`DELETE FROM web_project_development_dependencies WHERE web_project_id = $1`, [projectId]);
    await pool.query(`DELETE FROM web_project_development_items WHERE web_project_id = $1`, [projectId]);
    await pool.query(`DELETE FROM web_project_development_plans WHERE web_project_id = $1`, [projectId]);
    await pool.query(`DELETE FROM web_project_development_handoffs WHERE web_project_id = $1`, [projectId]);
    await pool.query(`DELETE FROM web_project_mockups WHERE web_project_id = $1`, [projectId]);
    await pool.query(`DELETE FROM web_project_architectures WHERE web_project_id = $1`, [projectId]);
    await pool.query(`DELETE FROM web_projects WHERE id = $1`, [projectId]);
    push("cleanup probe project", true);
  } finally {
    await pool.end();
  }

  const failed = results.filter((r) => !r.ok);
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"} — ${r.name}${r.detail ? `: ${r.detail}` : ""}`);
  }
  if (failed.length) {
    process.exitCode = 1;
    console.error(`\n${failed.length} probe(s) failed`);
  } else {
    console.log(`\nAll ${results.length} PostgreSQL probes passed`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
