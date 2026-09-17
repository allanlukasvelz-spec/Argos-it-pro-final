#!/usr/bin/env node
/** Seed for Phase 8 pipeline closure — run inside API container. */
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const stamp = Date.now();
  const email = `p8pipe-${stamp}@example.test`;
  const password = "StagingP8Pipe1x";
  const hash = await bcrypt.hash(password, 10);
  const org = (
    await pool.query(
      `INSERT INTO organizations (name, slug, status) VALUES ($1,$2,'active') RETURNING id`,
      [`P8 Pipe ${stamp}`, `p8-pipe-${stamp}`]
    )
  ).rows[0].id;
  const user = (
    await pool.query(
      `INSERT INTO users (email, password, name, role, client_verified)
       VALUES ($1,$2,'P8','cliente',true) RETURNING id`,
      [email, hash]
    )
  ).rows[0].id;
  await pool.query(
    `INSERT INTO organization_members (organization_id, user_id, org_role)
     VALUES ($1,$2,'org_owner') ON CONFLICT DO NOTHING`,
    [org, user]
  );
  const asset = (
    await pool.query(
      `INSERT INTO assets (organization_id, name, type, hostname, status)
       VALUES ($1,'p8','DOMAIN','p8.example.test','active') RETURNING id`,
      [org]
    )
  ).rows[0].id;
  const inc = (
    await pool.query(
      `INSERT INTO incidents (organization_id, asset_id, title, severity, state, correlation_key)
       VALUES ($1,$2,'P8 pipe incident','WARNING','OPEN',$3) RETURNING id`,
      [org, asset, `p8-corr-${stamp}`]
    )
  ).rows[0].id;
  console.log(JSON.stringify({ email, password, org, user, asset, inc, stamp }));
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
