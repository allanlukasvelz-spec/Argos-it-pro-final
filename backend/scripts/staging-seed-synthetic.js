#!/usr/bin/env node
/**
 * Synthetic staging seed — NO production/customer data.
 * Run: docker compose ... exec api node scripts/staging-seed-synthetic.js
 */
const crypto = require("crypto");
const { randomUUID } = require("crypto");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const { configureEvidenceStore, getEvidenceStore } = require("../lib/platform/evidenceStore");
const { createEvidenceService } = require("../lib/platform/evidenceService");
const { createPlatformJobService } = require("../lib/platform/platformJobs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function main() {
  configureEvidenceStore();
  const stamp = Date.now();
  const passwordHash = await bcrypt.hash("StagingSeedPass1", 10);

  const orgA = (
    await pool.query(
      `INSERT INTO organizations (name, slug, status)
       VALUES ($1, $2, 'active') RETURNING id`,
      [`Staging Org A ${stamp}`, `staging-a-${stamp}`]
    )
  ).rows[0].id;
  const orgB = (
    await pool.query(
      `INSERT INTO organizations (name, slug, status)
       VALUES ($1, $2, 'active') RETURNING id`,
      [`Staging Org B ${stamp}`, `staging-b-${stamp}`]
    )
  ).rows[0].id;

  const userA = (
    await pool.query(
      `INSERT INTO users (email, password, name, role)
       VALUES ($1, $2, 'Staging User A', 'cliente')
       RETURNING id`,
      [`staging-a-${stamp}@example.test`, passwordHash]
    )
  ).rows[0].id;
  const userB = (
    await pool.query(
      `INSERT INTO users (email, password, name, role)
       VALUES ($1, $2, 'Staging User B', 'cliente')
       RETURNING id`,
      [`staging-b-${stamp}@example.test`, passwordHash]
    )
  ).rows[0].id;

  await pool.query(
    `INSERT INTO organization_members (organization_id, user_id, org_role)
     VALUES ($1, $2, 'org_owner'), ($3, $4, 'org_owner')
     ON CONFLICT DO NOTHING`,
    [orgA, userA, orgB, userB]
  );

  const assetA = (
    await pool.query(
      `INSERT INTO assets (organization_id, name, type, hostname, status)
       VALUES ($1, 'staging-web-a', 'DOMAIN', 'staging-a.example.test', 'active')
       RETURNING id`,
      [orgA]
    )
  ).rows[0].id;

  const incidentId = (
    await pool.query(
      `INSERT INTO incidents (
         organization_id, asset_id, title, summary, severity, state, correlation_key
       ) VALUES ($1, $2, 'Staging synthetic incident', 'synthetic', 'WARNING', 'OPEN', $3)
       RETURNING id`,
      [orgA, assetA, `staging-corr-${stamp}`]
    )
  ).rows[0].id;

  const agentId = (
    await pool.query(
      `INSERT INTO agents (organization_id, asset_id, name, status, metadata)
       VALUES ($1, $2, 'staging-agent-a', 'UNKNOWN', $3::jsonb)
       RETURNING id`,
      [orgA, assetA, JSON.stringify({ synthetic: true, stamp })]
    )
  ).rows[0].id;

  const evidenceSvc = createEvidenceService(pool);
  const payload = Buffer.from(
    JSON.stringify({ kind: "staging-seed", stamp, orgId: orgA }),
    "utf8"
  );
  const { row: evidenceRow } = await evidenceSvc.store({
    organizationId: orgA,
    assetId: assetA,
    incidentId,
    buffer: payload,
    mimeType: "application/json",
    createdBy: userA,
    idempotencyKey: `staging-seed-ev-${stamp}`
  });

  const reportId = randomUUID();
  await pool.query(
    `INSERT INTO reports (id, organization_id, report_type, title, created_by, status)
     VALUES ($1, $2, 'incident_summary', 'Staging seed report', $3, 'ACTIVE')`,
    [reportId, orgA, userA]
  );

  const runId = randomUUID();
  await pool.query(
    `INSERT INTO report_runs (
       id, report_id, organization_id, incident_id, status, template_version,
       evidence_object_id, idempotency_key, requested_by, completed_at
     ) VALUES ($1, $2, $3, $4, 'READY', 'staging-seed-1', $5, $6, $7, NOW())`,
    [runId, reportId, orgA, incidentId, evidenceRow.id, `staging-run-${stamp}`, userA]
  );

  const eventId = randomUUID();
  await pool.query(
    `INSERT INTO notification_events (
       id, organization_id, event_type, severity, payload, dedupe_key
     ) VALUES ($1, $2, 'staging.seed', 'INFO', '{}'::jsonb, $3)`,
    [eventId, orgA, `staging-dedupe-${stamp}`]
  );

  const notificationId = randomUUID();
  await pool.query(
    `INSERT INTO notifications (
       id, organization_id, user_id, event_id, event_type, severity, title, body
     ) VALUES ($1, $2, $3, $4, 'staging.seed', 'INFO', 'Staging notify', 'synthetic')`,
    [notificationId, orgA, userA, eventId]
  );

  const jobs = createPlatformJobService(pool);
  const { job } = await jobs.enqueue({
    organizationId: orgA,
    jobType: "REPORT_GENERATE",
    payload: { reportRunId: runId, synthetic: true },
    idempotencyKey: `staging-seed-job-${stamp}`
  });

  const store = getEvidenceStore();
  const got = await store.get(evidenceRow.object_key);
  if (sha256(got) !== evidenceRow.sha256) {
    throw new Error("evidence checksum mismatch after seed");
  }

  const out = {
    orgA,
    orgB,
    userA,
    userB,
    assetA,
    incidentId,
    agentId,
    evidenceId: evidenceRow.id,
    objectKey: evidenceRow.object_key,
    evidenceSha256: evidenceRow.sha256,
    reportId,
    reportRunId: runId,
    notificationId,
    jobId: job.id,
    stamp
  };
  console.log(JSON.stringify(out, null, 2));
  await pool.end();
}

main().catch(async (err) => {
  console.error("[seed] FAIL:", err);
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
