#!/usr/bin/env node
/**
 * Seed synthetic G12 tenants inside staging API container.
 * Usage: docker exec argos-staging-api node scripts/staging-g12-seed.js
 */
const crypto = require("crypto");
const { randomUUID } = require("crypto");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const { sha256Hex } = require("../lib/agents/crypto");
const { configureEvidenceStore } = require("../lib/platform/evidenceStore");
const { createEvidenceService } = require("../lib/platform/evidenceService");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const PASSWORD = process.env.G12_PASSWORD || "StagingG12Pass1x";

async function main() {
  configureEvidenceStore();
  const stamp = Date.now();
  const hash = await bcrypt.hash(PASSWORD, 10);
  const emailA = `g12-a-${stamp}@example.test`;
  const emailB = `g12-b-${stamp}@example.test`;
  const emailOrgAdmin = `g12-oa-${stamp}@example.test`;
  const emailAdmin = `g12-admin-${stamp}@example.test`;

  const orgA = (
    await pool.query(
      `INSERT INTO organizations (name, slug, status) VALUES ($1,$2,'active') RETURNING id`,
      [`G12 A ${stamp}`, `g12-a-${stamp}`]
    )
  ).rows[0].id;
  const orgB = (
    await pool.query(
      `INSERT INTO organizations (name, slug, status) VALUES ($1,$2,'active') RETURNING id`,
      [`G12 B ${stamp}`, `g12-b-${stamp}`]
    )
  ).rows[0].id;

  const uA = (
    await pool.query(
      `INSERT INTO users (email, password, name, role, client_verified)
       VALUES ($1,$2,'User A','cliente',true) RETURNING id`,
      [emailA, hash]
    )
  ).rows[0].id;
  const uB = (
    await pool.query(
      `INSERT INTO users (email, password, name, role, client_verified)
       VALUES ($1,$2,'User B','cliente',true) RETURNING id`,
      [emailB, hash]
    )
  ).rows[0].id;
  const uOA = (
    await pool.query(
      `INSERT INTO users (email, password, name, role, client_verified)
       VALUES ($1,$2,'Org Admin','cliente',true) RETURNING id`,
      [emailOrgAdmin, hash]
    )
  ).rows[0].id;
  const uAd = (
    await pool.query(
      `INSERT INTO users (email, password, name, role, client_verified)
       VALUES ($1,$2,'NOC Admin','admin',true) RETURNING id`,
      [emailAdmin, hash]
    )
  ).rows[0].id;

  await pool.query(
    `INSERT INTO organization_members (organization_id, user_id, org_role)
     VALUES ($1,$2,'org_owner'), ($3,$4,'org_owner'), ($1,$5,'org_admin')
     ON CONFLICT DO NOTHING`,
    [orgA, uA, orgB, uB, uOA]
  );

  const assetA = (
    await pool.query(
      `INSERT INTO assets (organization_id, name, type, hostname, status)
       VALUES ($1,'g12-a','DOMAIN','a.g12.test','active') RETURNING id`,
      [orgA]
    )
  ).rows[0].id;
  const assetB = (
    await pool.query(
      `INSERT INTO assets (organization_id, name, type, hostname, status)
       VALUES ($1,'g12-b','DOMAIN','b.g12.test','active') RETURNING id`,
      [orgB]
    )
  ).rows[0].id;

  const monA = (
    await pool.query(
      `INSERT INTO monitors (organization_id, asset_id, type, name, status, enabled, config)
       VALUES ($1,$2,'HTTP','mon-a','ACTIVE',true,'{}'::jsonb) RETURNING id`,
      [orgA, assetA]
    )
  ).rows[0].id;
  const monB = (
    await pool.query(
      `INSERT INTO monitors (organization_id, asset_id, type, name, status, enabled, config)
       VALUES ($1,$2,'HTTP','mon-b','ACTIVE',true,'{}'::jsonb) RETURNING id`,
      [orgB, assetB]
    )
  ).rows[0].id;

  await pool.query(
    `INSERT INTO alerts (organization_id, asset_id, monitor_id, fingerprint, title, severity, state)
     VALUES ($1,$2,$3,$4,'alert-a','WARNING','OPEN')`,
    [orgA, assetA, monA, `fp-a-${stamp}`]
  );
  await pool.query(
    `INSERT INTO alerts (organization_id, asset_id, monitor_id, fingerprint, title, severity, state)
     VALUES ($1,$2,$3,$4,'alert-b','WARNING','OPEN')`,
    [orgB, assetB, monB, `fp-b-${stamp}`]
  );

  const incA = (
    await pool.query(
      `INSERT INTO incidents (organization_id, asset_id, title, severity, state, correlation_key)
       VALUES ($1,$2,'inc-a','WARNING','OPEN',$3) RETURNING id`,
      [orgA, assetA, `corr-a-${stamp}`]
    )
  ).rows[0].id;
  const incB = (
    await pool.query(
      `INSERT INTO incidents (organization_id, asset_id, title, severity, state, correlation_key)
       VALUES ($1,$2,'inc-b','WARNING','OPEN',$3) RETURNING id`,
      [orgB, assetB, `corr-b-${stamp}`]
    )
  ).rows[0].id;

  const evidence = createEvidenceService(pool);
  const { row: evA } = await evidence.store({
    organizationId: orgA,
    assetId: assetA,
    incidentId: incA,
    buffer: Buffer.from(JSON.stringify({ tenant: "A", stamp })),
    mimeType: "application/json",
    createdBy: uA,
    idempotencyKey: `g12-ev-a-${stamp}`
  });
  const { row: evB } = await evidence.store({
    organizationId: orgB,
    assetId: assetB,
    incidentId: incB,
    buffer: Buffer.from(JSON.stringify({ tenant: "B", stamp })),
    mimeType: "application/json",
    createdBy: uB,
    idempotencyKey: `g12-ev-b-${stamp}`
  });

  const repA = randomUUID();
  const runA = randomUUID();
  const repB = randomUUID();
  const runB = randomUUID();
  await pool.query(
    `INSERT INTO reports (id, organization_id, report_type, title, created_by)
     VALUES ($1,$2,'incident_summary','rep-a',$3)`,
    [repA, orgA, uA]
  );
  await pool.query(
    `INSERT INTO report_runs (
       id, report_id, organization_id, incident_id, status, template_version,
       evidence_object_id, idempotency_key, requested_by, completed_at
     ) VALUES ($1,$2,$3,$4,'READY','g12',$5,$6,$7,NOW())`,
    [runA, repA, orgA, incA, evA.id, `g12-run-a-${stamp}`, uA]
  );
  await pool.query(
    `INSERT INTO reports (id, organization_id, report_type, title, created_by)
     VALUES ($1,$2,'incident_summary','rep-b',$3)`,
    [repB, orgB, uB]
  );
  await pool.query(
    `INSERT INTO report_runs (
       id, report_id, organization_id, incident_id, status, template_version,
       evidence_object_id, idempotency_key, requested_by, completed_at
     ) VALUES ($1,$2,$3,$4,'READY','g12',$5,$6,$7,NOW())`,
    [runB, repB, orgB, incB, evB.id, `g12-run-b-${stamp}`, uB]
  );

  const evNA = randomUUID();
  const nA = randomUUID();
  const evNB = randomUUID();
  const nB = randomUUID();
  await pool.query(
    `INSERT INTO notification_events (id, organization_id, event_type, severity, payload, dedupe_key)
     VALUES ($1,$2,'g12.test','INFO','{}'::jsonb,$3)`,
    [evNA, orgA, `g12-n-a-${stamp}`]
  );
  await pool.query(
    `INSERT INTO notifications (id, organization_id, user_id, event_id, event_type, severity, title, body)
     VALUES ($1,$2,$3,$4,'g12.test','INFO','n-a','body')`,
    [nA, orgA, uA, evNA]
  );
  await pool.query(
    `INSERT INTO notification_events (id, organization_id, event_type, severity, payload, dedupe_key)
     VALUES ($1,$2,'g12.test','INFO','{}'::jsonb,$3)`,
    [evNB, orgB, `g12-n-b-${stamp}`]
  );
  await pool.query(
    `INSERT INTO notifications (id, organization_id, user_id, event_id, event_type, severity, title, body)
     VALUES ($1,$2,$3,$4,'g12.test','INFO','n-b','body')`,
    [nB, orgB, uB, evNB]
  );

  const agentA = (
    await pool.query(
      `INSERT INTO agents (organization_id, asset_id, name, status)
       VALUES ($1,$2,'agent-a','ONLINE') RETURNING id`,
      [orgA, assetA]
    )
  ).rows[0].id;
  const agentSecret = crypto.randomBytes(32).toString("hex");
  await pool.query(
    `INSERT INTO agent_credentials (agent_id, organization_id, secret_hash, status)
     VALUES ($1,$2,$3,'ACTIVE')`,
    [agentA, orgA, sha256Hex(agentSecret)]
  );

  const out = {
    stamp,
    password: PASSWORD,
    emailA,
    emailB,
    emailOrgAdmin,
    emailAdmin,
    orgA,
    orgB,
    assetA,
    assetB,
    monA,
    monB,
    incA,
    incB,
    evA: evA.id,
    evB: evB.id,
    objectKeyA: evA.object_key,
    objectKeyB: evB.object_key,
    repA,
    runA,
    repB,
    runB,
    nA,
    nB,
    agentA,
    agentSecret,
    agentCredential: `${agentA}.${agentSecret}`
  };
  console.log(JSON.stringify(out, null, 2));
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
