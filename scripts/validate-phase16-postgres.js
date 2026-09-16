#!/usr/bin/env node
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
  "web_project_validation_plans",
  "web_project_validation_runs",
  "web_project_validation_checks",
  "web_project_validation_evidence",
  "web_project_validation_defects",
  "web_project_validation_check_results",
  "web_project_publication_handoffs"
];

async function main() {
  const pool = new Pool({ connectionString: loadDatabaseUrl() });
  const results = [];
  const push = (name, ok, detail = "") => results.push({ name, ok, detail });

  try {
    const mig = fs.readFileSync(
      path.join(__dirname, "..", "database", "migrations", "016_web_project_validation.sql"),
      "utf8"
    );
    await pool.query(mig);
    push("apply migration 016", true);

    for (const table of TABLES) {
      const r = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
        [table]
      );
      push(`table ${table}`, r.rows.length > 0, `${r.rows.length} columns`);
    }

    const org = await pool.query(`SELECT id FROM organizations ORDER BY id LIMIT 1`);
    if (!org.rows[0]) throw new Error("No organization");
    const organizationId = org.rows[0].id;

    const proj = await pool.query(
      `INSERT INTO web_projects (organization_id, title, project_type, workflow_status, created_by)
       VALUES ($1, 'PG16 probe', 'create', 'VALIDATION', NULL) RETURNING id`,
      [organizationId]
    );
    const projectId = proj.rows[0].id;

    const planDev = await pool.query(
      `INSERT INTO web_project_development_plans (organization_id, web_project_id, handoff_id, version, status, created_by)
       SELECT $1, $2, 1, 1, 'ACTIVE', NULL
       WHERE EXISTS (SELECT 1 FROM web_project_development_handoffs LIMIT 1)
       RETURNING id`,
      [organizationId, projectId]
    );

    let devPlanId = planDev.rows[0]?.id;
    if (!devPlanId) {
      const dh = await pool.query(
        `INSERT INTO web_project_development_handoffs (
           organization_id, web_project_id, architecture_id, architecture_version, mockup_id, mockup_version,
           mockup_approved_at, schema_version, payload, created_by
         )
         SELECT $1, $2, a.id, 1, m.id, 1, NOW(), 'v1', '{}'::jsonb, NULL
         FROM web_project_architectures a
         JOIN web_project_mockups m ON m.web_project_id = a.web_project_id
         WHERE a.organization_id = $1 LIMIT 1
         RETURNING id, architecture_id, mockup_id`,
        [organizationId, projectId]
      );
      if (!dh.rows[0]) {
        const arch = await pool.query(
          `INSERT INTO web_project_architectures (organization_id, web_project_id, version, status, primary_language, created_by)
           VALUES ($1,$2,1,'APPROVED','es',NULL) RETURNING id`,
          [organizationId, projectId]
        );
        const mock = await pool.query(
          `INSERT INTO web_project_mockups (organization_id, web_project_id, architecture_id, version, status, created_by)
           VALUES ($1,$2,$3,1,'APPROVED',NULL) RETURNING id`,
          [organizationId, projectId, arch.rows[0].id]
        );
        const handoff = await pool.query(
          `INSERT INTO web_project_development_handoffs (
             organization_id, web_project_id, architecture_id, architecture_version, mockup_id, mockup_version,
             mockup_approved_at, schema_version, payload, created_by
           ) VALUES ($1,$2,$3,1,$4,1,NOW(),'v1','{}',NULL) RETURNING id`,
          [organizationId, projectId, arch.rows[0].id, mock.rows[0].id]
        );
        const dp = await pool.query(
          `INSERT INTO web_project_development_plans (organization_id, web_project_id, handoff_id, version, status, created_by)
           VALUES ($1,$2,$3,1,'ACTIVE',NULL) RETURNING id`,
          [organizationId, projectId, handoff.rows[0].id]
        );
        devPlanId = dp.rows[0].id;
      }
    }

    const vh = await pool.query(
      `INSERT INTO web_project_validation_handoffs (
         organization_id, web_project_id, development_plan_id, schema_version, payload, readiness_state, created_by
       ) VALUES ($1,$2,$3,'v1','{}','READY',NULL) RETURNING id`,
      [organizationId, projectId, devPlanId]
    );

    const vp = await pool.query(
      `INSERT INTO web_project_validation_plans (
         organization_id, web_project_id, validation_handoff_id, development_plan_id, created_by
       ) VALUES ($1,$2,$3,$4,NULL) RETURNING id`,
      [organizationId, projectId, vh.rows[0].id, devPlanId]
    );

    const run = await pool.query(
      `INSERT INTO web_project_validation_runs (organization_id, web_project_id, validation_plan_id, run_number)
       VALUES ($1,$2,$3,1) RETURNING id`,
      [organizationId, projectId, vp.rows[0].id]
    );

    const check = await pool.query(
      `INSERT INTO web_project_validation_checks (
         organization_id, web_project_id, validation_plan_id, validation_run_id, category, title, status, required
       ) VALUES ($1,$2,$3,$4,'STRUCTURE','Probe', 'PENDING', true) RETURNING id`,
      [organizationId, projectId, vp.rows[0].id, run.rows[0].id]
    );

    await pool.query(
      `INSERT INTO web_project_validation_evidence (organization_id, web_project_id, validation_check_id, evidence_type, text_note)
       VALUES ($1,$2,$3,'TEXT_NOTE','probe')`,
      [organizationId, projectId, check.rows[0].id]
    );

    const defect = await pool.query(
      `INSERT INTO web_project_validation_defects (
         organization_id, web_project_id, validation_plan_id, check_id, title, severity
       ) VALUES ($1,$2,$3,$4,'Defect probe','LOW') RETURNING id`,
      [organizationId, projectId, vp.rows[0].id, check.rows[0].id]
    );

    await pool.query(
      `INSERT INTO web_project_validation_check_results (
         organization_id, web_project_id, validation_check_id, previous_status, new_status
       ) VALUES ($1,$2,$3,'PENDING','IN_PROGRESS')`,
      [organizationId, projectId, check.rows[0].id]
    );

    await pool.query(
      `INSERT INTO web_project_publication_handoffs (
         organization_id, web_project_id, validation_handoff_id, validation_plan_id, schema_version, payload, readiness_state
       ) VALUES ($1,$2,$3,$4,'v1','{}','READY')`,
      [organizationId, projectId, vh.rows[0].id, vp.rows[0].id]
    );
    push("insert probe chain", true);

    let dupOk = false;
    try {
      await pool.query(
        `INSERT INTO web_project_publication_handoffs (
           organization_id, web_project_id, validation_handoff_id, validation_plan_id, schema_version, payload, readiness_state
         ) VALUES ($1,$2,$3,$4,'v1','{}','READY')`,
        [organizationId, projectId, vh.rows[0].id, vp.rows[0].id]
      );
    } catch {
      dupOk = true;
    }
    push("duplicate publication handoff rejected", dupOk);

    void defect;
  } finally {
    await pool.end();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, results }, null, 2));
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
