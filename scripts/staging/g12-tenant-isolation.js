#!/usr/bin/env node
/**
 * G12 staging tenant/authorization closure — real HTTP against staging API.
 * Synthetic data only. No simulated PASS.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const API = process.env.STAGING_API_URL || "http://127.0.0.1:4010";
const ORIGIN = process.env.STAGING_ORIGIN || "http://127.0.0.1:3010";
const results = [];
let fails = 0;
let fwd = 1;

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) fails += 1;
}

function nextFwd() {
  fwd = (fwd % 250) + 1;
  return `198.51.100.${fwd}`;
}

async function req(method, pathName, { cookie, body, headers } = {}) {
  const res = await fetch(`${API}${pathName}`, {
    method,
    headers: {
      Origin: ORIGIN,
      "X-Forwarded-For": nextFwd(),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { status: res.status, json, text, res };
}

function cookieJarFrom(res) {
  const raw =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

async function login(email, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      "Content-Type": "application/json",
      "X-Forwarded-For": nextFwd()
    },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, cookie: cookieJarFrom(res), res };
}

async function main() {
  console.log("[g12] seeding via API container...");
  const seedRaw = execSync(
    "docker exec argos-staging-api node scripts/staging-g12-seed.js",
    { encoding: "utf8", maxBuffer: 5_000_000 }
  );
  const seed = JSON.parse(seedRaw);
  const outDir = path.join(__dirname, "../../var/staging-e2e");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "g12-seed.json"), JSON.stringify(seed, null, 2));

  const loginA = await login(seed.emailA, seed.password);
  const loginB = await login(seed.emailB, seed.password);
  const loginOA = await login(seed.emailOrgAdmin, seed.password);
  const loginAd = await login(seed.emailAdmin, seed.password);
  record("login_A", loginA.status === 200, `http=${loginA.status}`);
  record("login_B", loginB.status === 200, `http=${loginB.status}`);
  record("login_org_admin", loginOA.status === 200, `http=${loginOA.status}`);
  record("login_admin", loginAd.status === 200, `http=${loginAd.status}`);

  const a = loginA.cookie;
  const oa = loginOA.cookie;
  const ad = loginAd.cookie;

  const assetsA = await req("GET", "/api/client/assets", { cookie: a });
  const assetsCross = await req("GET", `/api/client/assets/${seed.assetB}`, { cookie: a });
  const list = assetsA.json?.assets || assetsA.json || [];
  const ids = Array.isArray(list) ? list.map((x) => x.id) : [];
  record(
    "assets",
    assetsA.status === 200 && !ids.includes(seed.assetB) && [403, 404].includes(assetsCross.status),
    `list=${assetsA.status} cross=${assetsCross.status}`
  );

  const mon = await req("GET", "/api/client/monitors", { cookie: a });
  const monCross = await req("GET", `/api/client/monitors/${seed.monB}`, { cookie: a });
  record(
    "monitoring",
    mon.status === 200 && [403, 404].includes(monCross.status),
    `list=${mon.status} cross=${monCross.status}`
  );

  const alerts = await req("GET", "/api/client/alerts", { cookie: a });
  const bodyAlerts = JSON.stringify(alerts.json || {});
  record(
    "alerts",
    alerts.status === 200 && !bodyAlerts.includes("alert-b"),
    `http=${alerts.status}`
  );

  const incidents = await req("GET", "/api/client/incidents", { cookie: a });
  const incCross = await req("GET", `/api/client/incidents/${seed.incB}`, { cookie: a });
  record(
    "incidents",
    incidents.status === 200 && [403, 404].includes(incCross.status),
    `list=${incidents.status} cross=${incCross.status}`
  );

  const evCross = await req("GET", `/api/client/evidence/${seed.evB}`, { cookie: a });
  const evContent = await req("GET", `/api/client/evidence/${seed.evB}/content`, { cookie: a });
  record(
    "evidence",
    [403, 404].includes(evCross.status) && [403, 404].includes(evContent.status),
    `meta=${evCross.status} content=${evContent.status}`
  );

  const repCross = await req("GET", `/api/client/reports/${seed.repB}`, { cookie: a });
  // content endpoint uses report id in clientReports — check both report and run paths
  const repContent = await req("GET", `/api/client/reports/${seed.repB}/content`, { cookie: a });
  const runContent = await req("GET", `/api/client/reports/${seed.runB}/content`, { cookie: a });
  record(
    "reports",
    [403, 404].includes(repCross.status) &&
      [403, 404].includes(repContent.status) &&
      [403, 404].includes(runContent.status),
    `meta=${repCross.status} content=${repContent.status} runContent=${runContent.status}`
  );

  const noteCross = await req("GET", `/api/client/notifications/${seed.nB}`, { cookie: a });
  const noteMut = await req("PATCH", `/api/client/notifications/${seed.nB}/read`, { cookie: a });
  record(
    "notifications",
    [403, 404].includes(noteCross.status) && [403, 404].includes(noteMut.status),
    `get=${noteCross.status} mut=${noteMut.status}`
  );

  const nocA = await req("GET", "/api/noc/summary", { cookie: a });
  const nocOA = await req("GET", "/api/noc/summary", { cookie: oa });
  const nocAd = await req("GET", "/api/noc/summary", { cookie: ad });
  record("client_noc_denial", nocA.status === 403, `http=${nocA.status}`);
  record("org_admin_noc_denial", nocOA.status === 403, `http=${nocOA.status}`);
  record("admin_noc", nocAd.status === 200, `http=${nocAd.status}`);

  const spoof = await req("POST", "/api/agent/v1/heartbeat", {
    headers: {
      Authorization: `Bearer ${seed.agentCredential}`,
      "Content-Type": "application/json"
    },
    body: {
      seq: 1,
      organizationId: seed.orgB,
      assetId: seed.assetB,
      status: "ONLINE"
    }
  });
  const orgAfter = execSync(
    `docker exec argos-staging-postgres psql -U "$(grep STAGING_POSTGRES_USER docker/.env.staging | cut -d= -f2)" -d "$(grep STAGING_POSTGRES_DB docker/.env.staging | cut -d= -f2)" -tAc "SELECT organization_id||':'||asset_id FROM agents WHERE id=${seed.agentA}"`,
    { encoding: "utf8", cwd: path.join(__dirname, "../..") }
  ).trim();
  const [orgKeep, assetKeep] = orgAfter.split(":").map(Number);
  record(
    "agent_org_spoof",
    orgKeep === seed.orgA,
    `http=${spoof.status} org=${orgKeep} expected=${seed.orgA}`
  );
  record(
    "agent_asset_spoof",
    assetKeep === seed.assetA,
    `http=${spoof.status} asset=${assetKeep} expected=${seed.assetA}`
  );

  const summary = { fails, results, seedFile: "var/staging-e2e/g12-seed.json" };
  fs.writeFileSync(path.join(outDir, "g12-results.json"), JSON.stringify(summary, null, 2));
  console.log("===== G12 SUMMARY =====");
  console.log(JSON.stringify(summary, null, 2));
  if (fails > 0) {
    console.log("G12=FAIL");
    process.exit(1);
  }
  console.log("G12=PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
