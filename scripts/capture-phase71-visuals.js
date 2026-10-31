/**
 * Phase 7.1 — truthful CHICO state captures + NOC agent visuals (LOCAL/TEST only).
 * Seeds DB evidence per CHICO contract; does not fake green UI without backend truth.
 */
const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const { Client } = require("../backend/node_modules/pg");
const bcrypt = require("../backend/node_modules/bcrypt");
require("../backend/node_modules/dotenv").config({
  path: path.join(__dirname, "../backend/.env")
});

const BACKEND = process.env.ARGOS_API || "http://127.0.0.1:4000";
const FRONTEND = process.env.ARGOS_FRONTEND || "http://127.0.0.1:3000";
const OUT = path.join(
  __dirname,
  "../docs/architecture/phase7-validation-artifacts/phase71"
);
const PASSWORD = "Phase71Visual2026!x";

async function resetLimits() {
  const res = await fetch(`${BACKEND}/api/test/reset-rate-limits`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: FRONTEND }
  });
  if (!res.ok) {
    throw new Error(
      `rate-limit reset required (HTTP ${res.status}). Start backend with ARGOS_ALLOW_RATE_LIMIT_RESET=1`
    );
  }
}

async function api(method, urlPath, { body, cookie } = {}) {
  const res = await fetch(`${BACKEND}${urlPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: FRONTEND,
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  const setCookie = res.headers.getSetCookie?.() || [];
  return { status: res.status, json, setCookie };
}

function jar(setCookie) {
  return setCookie.map((c) => c.split(";")[0]).filter(Boolean).join("; ");
}

async function ensureFreshHttpEvidence(pg, { orgId, assetId }) {
  const mon = await pg.query(
    `INSERT INTO monitors (
       organization_id, asset_id, type, name, status, enabled, interval_seconds, config
     ) VALUES ($1,$2,'HTTP','phase71-http','ACTIVE',true,60,'{"url":"https://example.com/"}'::jsonb)
     RETURNING id`,
    [orgId, assetId]
  );
  const monitorId = mon.rows[0].id;
  await pg.query(
    `INSERT INTO observations (
       organization_id, monitor_id, asset_id, observed_at, ok, status_code, latency_ms,
       classification, evidence, source
     ) VALUES ($1,$2,$3,NOW(),true,200,42,'DETECTED','{"probe":"phase71"}'::jsonb,'PLATFORM')`,
    [orgId, monitorId, assetId]
  );
  return monitorId;
}

async function clearOrgSignals(pg, orgId) {
  await pg.query(`DELETE FROM remediation_executions WHERE organization_id = $1`, [orgId]);
  await pg.query(`DELETE FROM incidents WHERE organization_id = $1`, [orgId]);
  await pg.query(`DELETE FROM alerts WHERE organization_id = $1`, [orgId]);
  await pg.query(`DELETE FROM observations WHERE organization_id = $1`, [orgId]);
  await pg.query(`DELETE FROM monitors WHERE organization_id = $1`, [orgId]);
}

async function seedState(pg, state, ctx) {
  const { orgId, assetId, userId } = ctx;
  await clearOrgSignals(pg, orgId);

  if (state === "UNKNOWN") {
    return { why: "no_monitors" };
  }

  const monitorId = await ensureFreshHttpEvidence(pg, { orgId, assetId });

  if (state === "NORMAL") {
    return { why: "healthy_with_evidence", monitorId };
  }

  if (state === "ATTENTION") {
    await pg.query(
      `INSERT INTO alerts (
         organization_id, asset_id, monitor_id, severity, state, fingerprint, title, reason, count
       ) VALUES ($1,$2,$3,'WARNING','OPEN',$4,'Phase71 attention','open warning',1)`,
      [orgId, assetId, monitorId, `phase71-att-${Date.now()}`]
    );
    return { why: "open_alerts", monitorId };
  }

  if (state === "CRITICAL") {
    await pg.query(
      `INSERT INTO alerts (
         organization_id, asset_id, monitor_id, severity, state, fingerprint, title, reason, count
       ) VALUES ($1,$2,$3,'CRITICAL','OPEN',$4,'Phase71 critical','critical alert',1)`,
      [orgId, assetId, monitorId, `phase71-crit-${Date.now()}`]
    );
    return { why: "critical_alert", monitorId };
  }

  if (state === "RESOLVED") {
    await pg.query(
      `INSERT INTO incidents (
         organization_id, asset_id, title, summary, severity, state, correlation_key, resolved_at
       ) VALUES ($1,$2,'Phase71 resolved','resolved verified','WARNING','RESOLVED',$3,NOW())`,
      [orgId, assetId, `phase71-res-${Date.now()}`]
    );
    return { why: "verified_resolution", monitorId };
  }

  if (state === "VERIFYING") {
    const rb = await pg.query(
      `INSERT INTO runbooks (slug, name, description, status)
       VALUES ($1,'Phase71 verify RB','test only','ACTIVE')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [`phase71-rb-${orgId}`]
    );
    const runbookId = rb.rows[0].id;
    let ver = await pg.query(
      `SELECT id FROM runbook_versions WHERE runbook_id = $1 ORDER BY version DESC LIMIT 1`,
      [runbookId]
    );
    if (!ver.rows[0]) {
      ver = await pg.query(
        `INSERT INTO runbook_versions (runbook_id, version, steps, changelog)
         VALUES ($1,1,'[{"op":"noop"}]'::jsonb,'phase71') RETURNING id`,
        [runbookId]
      );
    }
    await pg.query(
      `INSERT INTO remediation_executions (
         organization_id, asset_id, runbook_id, runbook_version_id, execution_key,
         letter, action_type, safety_level, state, actor_user_id, requested_by
       ) VALUES ($1,$2,$3,$4,$5,'A','NOOP_TEST','L0','VERIFYING',$6,$6)`,
      [
        orgId,
        assetId,
        runbookId,
        ver.rows[0].id,
        `phase71-verify-${Date.now()}`,
        userId
      ]
    );
    return { why: "remediation_verifying", monitorId };
  }

  return { why: "unknown_state" };
}

async function loginPage(page, email) {
  await page.goto(`${FRONTEND}/auth/login`);
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(PASSWORD);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/login") && r.request().method() === "POST"),
    page.getByRole("button", { name: /Iniciar sesion/i }).click()
  ]);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, ".keep"), "");
  const dbUrl = process.env.DATABASE_URL || "";
  if (!/127\.0\.0\.1|localhost/.test(dbUrl)) {
    throw new Error("Non-local DATABASE_URL");
  }

  await resetLimits();

  const ts = Date.now();
  const clientEmail = `phase71-chico-${ts}@example.test`;
  const adminEmail = `phase71-noc-${ts}@example.test`;
  const hash = await bcrypt.hash(PASSWORD, 10);
  const pg = new Client({ connectionString: dbUrl });
  await pg.connect();

  const client = await pg.query(
    `INSERT INTO users (email, password, name, company, role, client_verified)
     VALUES ($1,$2,'Phase71 Client','ORG-PHASE71','cliente',true) RETURNING id`,
    [clientEmail, hash]
  );
  const admin = await pg.query(
    `INSERT INTO users (email, password, name, company, role, client_verified)
     VALUES ($1,$2,'Phase71 Admin','ORG-PHASE71','admin',true) RETURNING id`,
    [adminEmail, hash]
  );
  const org = await pg.query(
    `INSERT INTO organizations (slug, name, status)
     VALUES ($1,'ORG-PHASE71-TEST','active') RETURNING id`,
    [`org-phase71-${ts}`]
  );
  const orgId = org.rows[0].id;
  const userId = client.rows[0].id;
  await pg.query(
    `INSERT INTO organization_members (organization_id, user_id, org_role)
     VALUES ($1,$2,'org_owner'), ($1,$3,'org_member')`,
    [orgId, admin.rows[0].id, userId]
  );
  const asset = await pg.query(
    `INSERT INTO assets (organization_id, type, hostname, status, name)
     VALUES ($1,'SERVER','asset-phase71.local','active','ASSET-PHASE71-TEST')
     RETURNING id`,
    [orgId]
  );
  const assetId = asset.rows[0].id;
  const ctx = { orgId, assetId, userId };

  const meta = {
    at: new Date().toISOString(),
    chico: {},
    noc: {},
    notReproducible: []
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const states = ["UNKNOWN", "NORMAL", "ATTENTION", "CRITICAL", "VERIFYING", "RESOLVED"];
  for (const state of states) {
    await resetLimits();
    const seed = await seedState(pg, state, ctx);
    const login = await api("POST", "/api/auth/login", {
      body: { email: clientEmail, password: PASSWORD }
    });
    if (login.status !== 200) throw new Error(`client login ${login.status}`);
    const cookie = jar(login.setCookie);
    const guardian = await api("GET", "/api/client/guardian", { cookie });
    const observed = guardian.json?.chico?.state;
    meta.chico[state] = {
      expected: state,
      observed,
      seed,
      match: observed === state
    };
    if (observed !== state) {
      meta.notReproducible.push({
        state,
        observed,
        note: "NOT_REPRODUCIBLE_TEST or seed insufficient"
      });
      console.warn(`CHICO ${state}: API got ${observed}`);
    }

    await page.context().clearCookies();
    await loginPage(page, clientEmail);
    await page.goto(`${FRONTEND}/dashboard`);
    await page.waitForSelector("[data-chico-state]", { timeout: 15000 });
    await page.waitForTimeout(800);
    const file = `chico-${state.toLowerCase()}.png`;
    await page.screenshot({ path: path.join(OUT, file), fullPage: false });
    meta.chico[state].screenshot = file;
    meta.chico[state].domState = await page
      .locator("[data-chico-state]")
      .first()
      .getAttribute("data-chico-state");
    console.log(`CAPTURED ${file} api=${observed} dom=${meta.chico[state].domState}`);
  }

  // NOC visuals: enroll online agent, stale, revoke
  await resetLimits();
  const adminLogin = await api("POST", "/api/auth/login", {
    body: { email: adminEmail, password: PASSWORD }
  });
  let adminCookie = jar(adminLogin.setCookie);

  const enroll = await api("POST", "/api/noc/agents/enrollments", {
    cookie: adminCookie,
    body: { organizationId: orgId, assetId }
  });
  if (enroll.status !== 201) throw new Error(`enroll create ${enroll.status}`);
  const token = enroll.json.token;
  const enrolled = await api("POST", "/api/agent/v1/enroll", {
    body: { token, name: "phase71-ref", agentVersion: "0.0.1" }
  });
  if (enrolled.status !== 201) throw new Error(`enroll ${enrolled.status}`);
  const { agentId, credential } = enrolled.json;
  const hb = await fetch(`${BACKEND}/api/agent/v1/heartbeat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: FRONTEND,
      Authorization: `Bearer ${credential}`
    },
    body: JSON.stringify({ seq: 1 })
  });
  if (!hb.ok) throw new Error(`heartbeat ${hb.status}`);

  await page.context().clearCookies();
  await loginPage(page, adminEmail);
  await page.goto(`${FRONTEND}/noc/agents`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, "noc-agents-list.png"), fullPage: false });
  meta.noc.agents_list = "noc-agents-list.png";

  // Enrollment form capture
  await page.locator('input').nth(0).fill(String(orgId));
  await page.locator('input').nth(1).fill(String(assetId));
  await page.screenshot({ path: path.join(OUT, "noc-enrollment.png"), fullPage: false });
  meta.noc.enrollment = "noc-enrollment.png";

  // Select agent detail
  await page.locator("table tbody tr").first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, "noc-agent-detail.png"), fullPage: false });
  meta.noc.agent_detail = "noc-agent-detail.png";

  // Force STALE via DB (test-supported: age last_seen_at)
  await pg.query(
    `UPDATE agents SET last_seen_at = NOW() - INTERVAL '1 hour', status = 'STALE' WHERE id = $1`,
    [agentId]
  );
  await page.reload();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, "noc-agent-stale.png"), fullPage: false });
  meta.noc.stale_offline = "noc-agent-stale.png";

  // Revoke
  await resetLimits();
  const revLogin = await api("POST", "/api/auth/login", {
    body: { email: adminEmail, password: PASSWORD }
  });
  adminCookie = jar(revLogin.setCookie);
  await api("POST", `/api/noc/agents/${agentId}/revoke`, { cookie: adminCookie });
  await page.reload();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, "noc-agent-revoked.png"), fullPage: false });
  meta.noc.revoked = "noc-agent-revoked.png";

  await browser.close();
  await pg.end();

  fs.writeFileSync(path.join(OUT, "capture-meta.json"), JSON.stringify(meta, null, 2));
  const mismatches = states.filter((s) => meta.chico[s]?.match !== true);
  console.log("PHASE71_VISUAL_DONE", {
    mismatches,
    out: OUT
  });
  if (mismatches.length) process.exitCode = 2;
}

main().catch((e) => {
  console.error("PHASE71_VISUAL_FAIL", e.message);
  process.exit(1);
});
