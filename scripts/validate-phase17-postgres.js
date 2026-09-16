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
  "web_project_publication_plans",
  "web_project_publication_steps",
  "web_project_publication_blockers",
  "web_project_completion_handoffs"
];

async function seedPublicationHandoff(pool, organizationId) {
  const proj = await pool.query(
    `INSERT INTO web_projects (organization_id, title, project_type, workflow_status, created_by)
     VALUES ($1, 'PG17 probe', 'create', 'PUBLICATION', NULL) RETURNING id`,
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

  const pubHandoff = await pool.query(
    `INSERT INTO web_project_publication_handoffs (
       organization_id, web_project_id, validation_handoff_id, validation_plan_id, schema_version, payload, readiness_state
     ) VALUES ($1,$2,$3,$4,'v1','{}','READY') RETURNING id`,
    [organizationId, projectId, vh.rows[0].id, vp.rows[0].id]
  );

  return { projectId, handoffId: pubHandoff.rows[0].id, validationPlanId: vp.rows[0].id };
}

async function main() {
  const pool = new Pool({ connectionString: loadDatabaseUrl() });
  const results = [];
  const push = (name, ok, detail = "") => results.push({ name, ok, detail });

  try {
    const mig = fs.readFileSync(
      path.join(__dirname, "..", "database", "migrations", "017_web_project_publication.sql"),
      "utf8"
    );
    await pool.query(mig);
    push("apply migration 017", true);

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

    const { projectId, handoffId, validationPlanId } = await seedPublicationHandoff(
      pool,
      organizationId
    );
    push("insert probe chain", true, `project=${projectId}`);

    const plan = await pool.query(
      `INSERT INTO web_project_publication_plans (
         organization_id, web_project_id, publication_handoff_id, validation_plan_id, status, created_by
       ) VALUES ($1,$2,$3,$4,'ACTIVE',NULL) RETURNING id`,
      [organizationId, projectId, handoffId, validationPlanId]
    );
    push("INSERT publication plan", Boolean(plan.rows[0]?.id), `id=${plan.rows[0]?.id}`);

    const dup = await pool
      .query(
        `INSERT INTO web_project_publication_plans (
           organization_id, web_project_id, publication_handoff_id, validation_plan_id, status
         ) VALUES ($1,$2,$3,$4,'ACTIVE')`,
        [organizationId, projectId, handoffId, validationPlanId]
      )
      .then(() => ({ ok: true }))
      .catch((err) => ({ ok: false, code: err.code }));
    push("UNIQUE publication plan per handoff", dup.ok === false && dup.code === "23505");

    const planId = plan.rows[0].id;
    const step = await pool.query(
      `INSERT INTO web_project_publication_steps (
         organization_id, web_project_id, publication_plan_id, step_type, title, status, priority, required, sort_order
       ) VALUES ($1,$2,$3,'DNS_PREP','DNS probe','TODO','HIGH',TRUE,0) RETURNING id`,
      [organizationId, projectId, planId]
    );
    push("INSERT publication step", Boolean(step.rows[0]?.id));

    const badStatus = await pool
      .query(`UPDATE web_project_publication_steps SET status = 'INVALID' WHERE id = $1`, [
        step.rows[0].id
      ])
      .then(() => ({ ok: true }))
      .catch((err) => ({ ok: false, code: err.code }));
    push("CHECK invalid step status blocked", badStatus.ok === false);

    const completion = await pool.query(
      `INSERT INTO web_project_completion_handoffs (
         organization_id, web_project_id, publication_handoff_id, publication_plan_id,
         schema_version, payload, readiness_state
       ) VALUES ($1,$2,$3,$4,'web-project-completion-handoff.v1','{}','READY') RETURNING id`,
      [organizationId, projectId, handoffId, planId]
    );
    push("INSERT completion handoff", Boolean(completion.rows[0]?.id));

    const dupCompletion = await pool
      .query(
        `INSERT INTO web_project_completion_handoffs (
           organization_id, web_project_id, publication_handoff_id, publication_plan_id,
           schema_version, payload, readiness_state
         ) VALUES ($1,$2,$3,$4,'web-project-completion-handoff.v1','{}','READY')`,
        [organizationId, projectId, handoffId, planId]
      )
      .then(() => ({ ok: true }))
      .catch((err) => ({ ok: false, code: err.code }));
    push("UNIQUE completion handoff per plan", dupCompletion.ok === false && dupCompletion.code === "23505");

    const failed = results.filter((r) => !r.ok);
    console.log(JSON.stringify({ pass: failed.length === 0, total: results.length, results }, null, 2));
    process.exit(failed.length ? 1 : 0);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
