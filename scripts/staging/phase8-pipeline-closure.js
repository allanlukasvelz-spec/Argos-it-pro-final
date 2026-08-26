#!/usr/bin/env node
/**
 * Phase 8 real report pipeline + worker interruption on staging.
 * No PDF stub. Synthetic data only.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const API = process.env.STAGING_API_URL || "http://127.0.0.1:4010";
const ORIGIN = process.env.STAGING_ORIGIN || "http://127.0.0.1:3010";
const outDir = path.join(__dirname, "../../var/staging-e2e");
fs.mkdirSync(outDir, { recursive: true });

let fwd = 10;
function nextFwd() {
  fwd = (fwd % 250) + 1;
  return `203.0.113.${fwd}`;
}

function cookieJar(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
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
  return { status: res.status, cookie: cookieJar(res), json: await res.json().catch(() => ({})) };
}

async function api(method, p, cookie, body) {
  const res = await fetch(`${API}${p}`, {
    method,
    headers: {
      Origin: ORIGIN,
      Cookie: cookie,
      ...(body ? { "Content-Type": "application/json" } : {}),
      "X-Forwarded-For": nextFwd()
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const buf = Buffer.from(await res.arrayBuffer());
  let json = null;
  try {
    json = JSON.parse(buf.toString("utf8"));
  } catch {
    /* binary */
  }
  return { status: res.status, json, buf, headers: res.headers };
}

function sqlJson(sql) {
  return execSync(
    `docker exec argos-staging-api node -e ${JSON.stringify(
      `const {Pool}=require('pg');(async()=>{const p=new Pool({connectionString:process.env.DATABASE_URL});const r=await p.query(${JSON.stringify(sql)});console.log(JSON.stringify(r.rows));await p.end();})().catch(e=>{console.error(e);process.exit(1)});`
    )}`,
    { encoding: "utf8" }
  ).trim();
}

async function main() {
  const results = { steps: [], fails: 0 };
  const pass = (k, ok, d) => {
    results.steps.push({ k, ok, d });
    console.log(`${ok ? "PASS" : "FAIL"} ${k} — ${d}`);
    if (!ok) results.fails += 1;
  };

  execSync(
    "docker cp backend/scripts/staging-phase8-pipeline-seed.js argos-staging-api:/app/scripts/staging-phase8-pipeline-seed.js",
    { stdio: "inherit" }
  );
  const seedOut = execSync(
    "docker exec argos-staging-api node scripts/staging-phase8-pipeline-seed.js",
    { encoding: "utf8" }
  );
  const seed = JSON.parse(seedOut.trim().split("\n").pop());
  const loginRes = await login(seed.email, seed.password);
  pass("login", loginRes.status === 200, `http=${loginRes.status}`);
  const cookie = loginRes.cookie;

  const reqReport = await api("POST", "/api/client/reports", cookie, {
    incidentId: seed.inc
  });
  pass(
    "request",
    reqReport.status === 201 || reqReport.status === 200 || reqReport.status === 202,
    `http=${reqReport.status} body=${JSON.stringify(reqReport.json).slice(0, 300)}`
  );
  const runId = reqReport.json?.run?.id || reqReport.json?.runId;
  const reportId = reqReport.json?.report?.id || reqReport.json?.reportId;

  await new Promise((r) => setTimeout(r, 1500));
  execSync("docker restart argos-staging-worker", { stdio: "inherit" });
  pass("worker_interrupt", true, "restarted worker mid-pipeline");

  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (reportId) {
      const content = await api("GET", `/api/client/reports/${reportId}/content`, cookie);
      if (content.status === 200 && content.buf?.slice(0, 4).toString() === "%PDF") {
        ready = true;
        break;
      }
      const one = await api("GET", `/api/client/reports/${reportId}`, cookie);
      const blob = JSON.stringify(one.json || {});
      if (blob.includes('"READY"') || one.json?.report?.status === "READY") {
        ready = true;
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  pass("ready", ready, ready ? "READY observed via content/meta" : "timeout waiting READY");

  const jobState = sqlJson(
    `SELECT status, COUNT(*)::int AS n FROM platform_jobs WHERE organization_id = ${Number(seed.org)} GROUP BY status`
  );
  pass("queue", true, jobState);

  let contentRes = reportId
    ? await api("GET", `/api/client/reports/${reportId}/content`, cookie)
    : null;
  const isPdf = Boolean(contentRes?.buf && contentRes.buf.slice(0, 4).toString() === "%PDF");
  pass(
    "pdf_signature",
    isPdf,
    `http=${contentRes?.status} head=${contentRes?.buf?.slice(0, 8)?.toString("utf8")}`
  );
  const sha = isPdf ? crypto.createHash("sha256").update(contentRes.buf).digest("hex") : null;
  pass("sha256", Boolean(sha), sha || "n/a");
  if (sha) {
    fs.writeFileSync(path.join(outDir, "report.pdf"), contentRes.buf);
    fs.writeFileSync(path.join(outDir, "report.sha256"), sha);
  }

  const notes = await api("GET", "/api/client/notifications", cookie);
  const notesJson = JSON.stringify(notes.json || {});
  pass(
    "notification",
    notes.status === 200 && /REPORT_READY|report|informe|Listo|READY/i.test(notesJson),
    `http=${notes.status}`
  );

  const stubEnv = execSync(
    "docker exec argos-staging-worker printenv ARGOS_REPORT_PDF_STUB || true",
    { encoding: "utf8" }
  ).trim();
  pass("pdf_stub_off", !stubEnv || stubEnv === "0", `stub='${stubEnv}'`);

  const dup = JSON.parse(
    sqlJson(
      `SELECT status, COUNT(*)::int AS n FROM report_runs WHERE organization_id = ${Number(seed.org)} AND incident_id = ${Number(seed.inc)} GROUP BY status`
    )
  );
  const notesCount = JSON.parse(
    sqlJson(
      `SELECT COUNT(*)::int AS n FROM notifications WHERE organization_id = ${Number(seed.org)}`
    )
  );
  const readyCount = (dup.find((x) => x.status === "READY") || { n: 0 }).n;
  pass(
    "no_duplicate_ready",
    readyCount <= 1,
    `readyRuns=${readyCount} notes=${notesCount[0]?.n}`
  );

  results.seed = { org: seed.org, inc: seed.inc, email: seed.email };
  results.runId = runId;
  results.reportId = reportId;
  results.sha256 = sha;
  fs.writeFileSync(path.join(outDir, "phase8-pipeline.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  process.exit(results.fails ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
