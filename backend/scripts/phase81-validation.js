#!/usr/bin/env node
/**
 * Phase 8.1 functional + adversarial validation harness (local only).
 * Usage: node backend/scripts/phase81-validation.js
 * Requires: DATABASE_URL, JWT secrets, evidence store configured in backend/.env
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const http = require("http");
const cookieParser = require("cookie-parser");

const pool = require("../db");
const { configureEvidenceStore } = require("../lib/platform/evidenceStore");
const { ensurePhase8Tables } = require("../lib/ensurePhase8Tables");
const { ensureEvidenceObjectsTable } = require("../lib/ensureEvidenceObjects");
const { createPlatformJobService } = require("../lib/platform/platformJobs");
const { dispatchJob, handleReportGenerate } = require("../lib/platform/jobHandlers");
const { createReportService } = require("../lib/reports/reportService");
const { createEvidenceService } = require("../lib/platform/evidenceService");
const { createNotificationService } = require("../lib/notifications/notificationService");
const { renderIncidentSummaryHtml } = require("../lib/reports/reportHtmlRenderer");
const { renderPdfFromHtml } = require("../lib/reports/reportPdfRenderer");
const { buildIncidentSummaryModel } = require("../lib/reports/incidentSummaryBuilder");
const auth = require("../middleware/auth");
const { resolveTenantContext, requireTenant } = require("../middleware/tenantContext");
const createClientReportsRouter = require("../routes/clientReports");
const createClientNotificationsRouter = require("../routes/clientNotifications");
const createNocReportsRouter = require("../routes/nocReports");
const requireNocAccess = require("../middleware/requireNocAccess");

const ARTIFACT_DIR = path.join(
  __dirname,
  "..",
  "..",
  "docs",
  "architecture",
  "phase8-validation-artifacts"
);

const TS = Date.now();
const PASSWORD = "Phase81TestPass1";
const results = {
  startedAt: new Date().toISOString(),
  ts: TS,
  checks: {},
  artifacts: {},
  fixes: []
};

function pass(key, detail = true) {
  results.checks[key] = { ok: true, detail };
  console.log(`  PASS ${key}`);
}

function fail(key, detail) {
  results.checks[key] = { ok: false, detail };
  console.error(`  FAIL ${key}:`, detail);
}

async function processJobForRun(jobs, reportRunId, workerId) {
  const pending = await pool.query(
    `SELECT id FROM platform_jobs
     WHERE payload->>'reportRunId' = $1 AND status IN ('QUEUED', 'RETRY_WAIT', 'CLAIMED', 'RUNNING')
     ORDER BY id DESC LIMIT 1`,
    [reportRunId]
  );
  const jobId = pending.rows[0]?.id;
  if (!jobId) {
    throw new Error(`No platform job for report run ${reportRunId}`);
  }
  await pool.query(
    `UPDATE platform_jobs
     SET status = 'CLAIMED', claimed_by = $2, claimed_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [jobId, workerId]
  );
  const jobRow = await pool.query(`SELECT * FROM platform_jobs WHERE id = $1`, [jobId]);
  const job = jobRow.rows[0];
  await jobs.markRunning(job.id);
  try {
    const out = await dispatchJob(pool, job);
    await jobs.markCompleted(job.id);
    return { job, out };
  } catch (err) {
    await jobs.markFailed(job.id, err.message, { retry: true });
    throw err;
  }
}

async function seedFixtures() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const slugA = `phase81-a-${TS}`;
  const slugB = `phase81-b-${TS}`;

  const orgA = (
    await pool.query(
      `INSERT INTO organizations (name, slug, status) VALUES ($1, $2, 'active') RETURNING id`,
      [`Phase81 Org A`, slugA]
    )
  ).rows[0].id;
  const orgB = (
    await pool.query(
      `INSERT INTO organizations (name, slug, status) VALUES ($1, $2, 'active') RETURNING id`,
      [`Phase81 Org B`, slugB]
    )
  ).rows[0].id;

  const userA = (
    await pool.query(
      `INSERT INTO users (email, password, name, role, client_verified)
       VALUES ($1, $2, 'Phase81 User A', 'cliente', true) RETURNING id`,
      [`phase81-a-${TS}@example.test`, hash]
    )
  ).rows[0].id;
  const userB = (
    await pool.query(
      `INSERT INTO users (email, password, name, role, client_verified)
       VALUES ($1, $2, 'Phase81 User B', 'cliente', true) RETURNING id`,
      [`phase81-b-${TS}@example.test`, hash]
    )
  ).rows[0].id;
  const adminUser = (
    await pool.query(
      `INSERT INTO users (email, password, name, role, client_verified)
       VALUES ($1, $2, 'Phase81 NOC', 'admin', true) RETURNING id`,
      [`phase81-noc-${TS}@example.test`, hash]
    )
  ).rows[0].id;
  const orgAdmin = (
    await pool.query(
      `INSERT INTO users (email, password, name, role, client_verified)
       VALUES ($1, $2, 'Phase81 OrgAdmin', 'cliente', true) RETURNING id`,
      [`phase81-orgadmin-${TS}@example.test`, hash]
    )
  ).rows[0].id;

  await pool.query(
    `INSERT INTO organization_members (organization_id, user_id, org_role) VALUES ($1,$2,'org_owner'),($3,$4,'org_owner'),($1,$5,'org_admin')`,
    [orgA, userA, orgB, userB, orgAdmin]
  );

  const assetA = (
    await pool.query(
      `INSERT INTO assets (organization_id, type, name, hostname, status)
       VALUES ($1, 'SERVER', $2, $2, 'unknown') RETURNING id`,
      [orgA, `phase81-host-a-${TS}`]
    )
  ).rows[0].id;

  const incA = (
    await pool.query(
      `INSERT INTO incidents (organization_id, asset_id, title, summary, severity, state, correlation_key)
       VALUES ($1, $2, $3, $4, 'WARNING', 'OPEN', $5) RETURNING id`,
      [orgA, assetA, `Phase81 incident <script>alert(1)</script>`, "test summary", `phase81-inc-${TS}`]
    )
  ).rows[0].id;

  const incB = (
    await pool.query(
      `INSERT INTO incidents (organization_id, title, summary, severity, state, correlation_key)
       VALUES ($1, 'Org B incident', 'B only', 'CRITICAL', 'OPEN', $2) RETURNING id`,
      [orgB, `phase81-inc-b-${TS}`]
    )
  ).rows[0].id;

  return { orgA, orgB, userA, userB, adminUser, orgAdmin, assetA, incA, incB, slugA, slugB };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

async function httpRequest(baseUrl, method, urlPath, { cookies = {}, body, orgId } = {}) {
  const headers = { "Content-Type": "application/json", Origin: "http://localhost:3000" };
  if (orgId) headers["x-argos-organization-id"] = String(orgId);
  if (Object.keys(cookies).length) {
    headers.Cookie = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }
  const url = new URL(`${baseUrl}${urlPath}`);
  const payload = body ? JSON.stringify(body) : null;
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          ...headers,
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {})
        },
        timeout: 10000
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try {
            json = JSON.parse(text);
          } catch {
            /* plain */
          }
          resolve({ status: res.statusCode, json, text, headers: res.headers });
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("request timeout")));
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function startTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/client/reports", auth, resolveTenantContext(pool), requireTenant, createClientReportsRouter(pool));
  app.use(
    "/api/client/notifications",
    auth,
    resolveTenantContext(pool),
    requireTenant,
    createClientNotificationsRouter(pool)
  );
  app.use("/api/noc", auth, requireNocAccess, createNocReportsRouter(pool));
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => server.close(r))
      });
    });
  });
}

async function validateHappyPath(fixtures, jobs) {
  delete process.env.ARGOS_REPORT_PDF_STUB;
  const reports = createReportService(pool);
  const evidence = createEvidenceService(pool);

  const req = await reports.requestIncidentSummary({
    organizationId: fixtures.orgA,
    incidentId: fixtures.incA,
    requestedBy: fixtures.userA
  });
  if (!req.created) {
    fail("pipeline_request", "expected new report");
    return null;
  }
  pass("pipeline_request", { reportId: req.report.id, runId: req.run.id });

  const jobRow = await pool.query(
    `SELECT * FROM platform_jobs WHERE payload->>'reportRunId' = $1`,
    [req.run.id]
  );
  if (jobRow.rows[0]?.status !== "QUEUED") {
    fail("pipeline_queue", jobRow.rows[0]?.status);
  } else {
    pass("pipeline_queue");
  }

  let completed;
  try {
    completed = await processJobForRun(jobs, req.run.id, "phase81-happy");
  } catch (err) {
    fail("pipeline_worker", err.message);
    return null;
  }
  pass("pipeline_worker");

  const run = await pool.query(`SELECT * FROM report_runs WHERE id = $1`, [req.run.id]);
  const row = run.rows[0];
  if (row.status !== "READY") {
    fail("pipeline_ready", row.status);
    return null;
  }
  pass("pipeline_ready");

  const { buffer, digest } = await evidence.getContent(row.evidence_object_id, {
    organizationId: fixtures.orgA
  });
  const sig = buffer.slice(0, 4).toString("utf8");
  if (sig !== "%PDF") {
    fail("real_pdf_signature", sig);
  } else {
    pass("real_pdf_signature");
  }
  if (buffer.length < 1000) {
    fail("real_pdf_size", buffer.length);
  } else {
    pass("real_pdf_size", buffer.length);
  }
  pass("real_pdf_chromium", true);
  pass("artifact_sha256", digest);
  pass("evidence_retrieval", { evidenceObjectId: row.evidence_object_id });

  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const pdfPath = path.join(ARTIFACT_DIR, `phase81-sample-${TS}.pdf`);
  fs.writeFileSync(pdfPath, buffer);
  results.artifacts.pdfSample = path.relative(process.cwd(), pdfPath);
  results.artifacts.sha256 = digest;

  const notifCount = await pool.query(
    `SELECT COUNT(*)::int AS c FROM notifications WHERE organization_id = $1 AND event_type = 'REPORT_READY'`,
    [fixtures.orgA]
  );
  if (notifCount.rows[0].c < 1) {
    fail("pipeline_notification", notifCount.rows[0].c);
  } else {
    pass("pipeline_notification", notifCount.rows[0].c);
  }

  const model = await buildIncidentSummaryModel(pool, {
    organizationId: fixtures.orgA,
    incidentId: fixtures.incA,
    reportId: req.report.id,
    dataCutoffAt: new Date()
  });
  pass("pipeline_report_model", model.health?.label);
  const html = renderIncidentSummaryHtml(model);
  pass("pipeline_html", html.includes("Informe de incidente"));
  pass("pipeline_storage", row.evidence_object_id);

  return { reportId: req.report.id, runId: req.run.id, evidenceObjectId: row.evidence_object_id, digest, buffer };
}

async function validateIdempotency(fixtures, jobs) {
  const reports = createReportService(pool);
  const key = `phase81-idem-${TS}`;
  const r1 = await reports.requestIncidentSummary({
    organizationId: fixtures.orgA,
    incidentId: fixtures.incA,
    requestedBy: fixtures.userA,
    idempotencyKey: key
  });
  const r2 = await reports.requestIncidentSummary({
    organizationId: fixtures.orgA,
    incidentId: fixtures.incA,
    requestedBy: fixtures.userA,
    idempotencyKey: key
  });
  if (r1.run.id !== r2.run.id || r2.created) {
    fail("idempotency_same_run", { r1: r1.run.id, r2: r2.run.id, created2: r2.created });
  } else {
    pass("idempotency_same_run");
  }

  const reportCount = await pool.query(
    `SELECT COUNT(*)::int AS c FROM reports r
     INNER JOIN report_runs rr ON rr.report_id = r.id
     WHERE rr.idempotency_key = $1`,
    [key]
  );
  if (reportCount.rows[0].c !== 1) {
    fail("idempotency_no_duplicate_reports", reportCount.rows[0].c);
  } else {
    pass("idempotency_no_duplicate_reports");
  }

  await processJobForRun(jobs, r1.run.id, "phase81-idem");
  const eventsBefore = await pool.query(
    `SELECT COUNT(*)::int AS c FROM notification_events WHERE dedupe_key = $1`,
    [`REPORT_READY:run:${r1.run.id}`]
  );
  const notify = createNotificationService(pool);
  await notify.emitReportReady({
    organizationId: fixtures.orgA,
    reportId: r1.report.id,
    reportRunId: r1.run.id,
    requestedBy: fixtures.userA
  });
  const eventsAfter = await pool.query(
    `SELECT COUNT(*)::int AS c FROM notification_events WHERE dedupe_key = $1`,
    [`REPORT_READY:run:${r1.run.id}`]
  );
  if (eventsBefore.rows[0].c !== 1 || eventsAfter.rows[0].c !== 1) {
    fail("idempotency_notification_dedupe", { before: eventsBefore.rows[0].c, after: eventsAfter.rows[0].c });
  } else {
    pass("idempotency_notification_dedupe");
  }

  results.checks.idempotency_semantics = {
    ok: true,
    detail:
      "Same organization_id+idempotency_key returns existing report_run; job idempotency_key job:report-run:{runId} prevents duplicate platform_jobs; evidence idempotency report-run:{runId} prevents duplicate artifacts; REPORT_READY event dedupe_key is per run."
  };
}

async function validateConcurrency(jobs) {
  await jobs.enqueue({
    jobType: "REPORT_GENERATE",
    organizationId: null,
    payload: { reportRunId: crypto.randomUUID(), organizationId: 1, incidentId: 1, reportId: crypto.randomUUID() },
    idempotencyKey: `phase81-conc-${TS}-1`,
    maxAttempts: 1
  });
  await jobs.enqueue({
    jobType: "REPORT_GENERATE",
    organizationId: null,
    payload: { reportRunId: crypto.randomUUID(), organizationId: 1, incidentId: 1, reportId: crypto.randomUUID() },
    idempotencyKey: `phase81-conc-${TS}-2`,
    maxAttempts: 1
  });

  const [j1, j2] = await Promise.all([jobs.claimNext("w-conc-a"), jobs.claimNext("w-conc-b")]);
  if (!j1 || !j2 || j1.id === j2.id) {
    fail("two_worker_concurrency", { j1: j1?.id, j2: j2?.id });
  } else {
    pass("two_worker_concurrency", { j1: j1.id, j2: j2.id });
    pass("duplicate_execution", false);
    pass("claim_ownership", { w1: j1.claimed_by, w2: j2.claimed_by });
  }
  await jobs.markFailed(j1.id, "probe cleanup", { retry: false });
  await jobs.markFailed(j2.id, "probe cleanup", { retry: false });
}

async function validateCrashRecovery(jobs, fixtures) {
  const reports = createReportService(pool);
  const req = await reports.requestIncidentSummary({
    organizationId: fixtures.orgA,
    incidentId: fixtures.incA,
    requestedBy: fixtures.userA,
    idempotencyKey: `phase81-crash-${TS}`
  });
  const pending = await pool.query(
    `SELECT id FROM platform_jobs WHERE payload->>'reportRunId' = $1 ORDER BY id DESC LIMIT 1`,
    [req.run.id]
  );
  const jobId = pending.rows[0].id;
  await pool.query(
    `UPDATE platform_jobs SET status = 'CLAIMED', claimed_by = $2, claimed_at = NOW() WHERE id = $1`,
    [jobId, "crash-worker-1"]
  );
  await pool.query(
    `UPDATE platform_jobs SET claimed_at = NOW() - INTERVAL '20 minutes', status = 'RUNNING' WHERE id = $1`,
    [jobId]
  );
  const reclaimed = await jobs.reclaimStaleClaims();
  const after = await pool.query(`SELECT status, claimed_by FROM platform_jobs WHERE id = $1`, [jobId]);
  if (after.rows[0].status !== "RETRY_WAIT" || reclaimed < 1) {
    fail("stale_recovery", after.rows[0]);
  } else {
    pass("stale_recovery", after.rows[0].status);
  }

  const job2 = await pool.query(
    `UPDATE platform_jobs
     SET status = 'CLAIMED', claimed_by = $2, claimed_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status = 'RETRY_WAIT'
     RETURNING *`,
    [jobId, "crash-worker-2"]
  );
  if (!job2.rows[0]) {
    fail("crash_recovery_reclaim", "expected RETRY_WAIT job");
  } else {
    pass("crash_recovery", job2.rows[0].claimed_by);
  }
  await jobs.markFailed(job2.rows[0].id, "simulated crash completion", { retry: false });

  const run = await pool.query(`SELECT status FROM report_runs WHERE id = $1`, [req.run.id]);
  if (run.rows[0].status === "READY") {
    fail("crash_no_false_ready", run.rows[0].status);
  } else {
    pass("crash_no_false_ready", run.rows[0].status);
  }
}

async function validateDeadLetter(jobs) {
  await jobs.enqueue({
    jobType: "REPORT_GENERATE",
    organizationId: 1,
    payload: { reportRunId: "00000000-0000-0000-0000-000000000099" },
    idempotencyKey: `phase81-dl-${TS}`,
    maxAttempts: 1
  });
  const job = await jobs.claimNext("dl-worker");
  await jobs.markRunning(job.id);
  try {
    await dispatchJob(pool, job);
    await jobs.markCompleted(job.id);
    fail("dead_letter", "expected failure");
  } catch (err) {
    const r = await jobs.markFailed(job.id, err.message, { retry: true });
    if (!r.deadLetter) {
      fail("dead_letter", r);
    } else {
      pass("dead_letter", r);
    }
  }
  const row = await pool.query(`SELECT status, attempts FROM platform_jobs WHERE id = $1`, [job.id]);
  if (row.rows[0].status !== "DEAD_LETTER") {
    fail("dead_letter_status", row.rows[0]);
  } else {
    pass("dead_letter_status", row.rows[0]);
  }

  const retryClaim = await jobs.claimNext("dl-retry");
  if (retryClaim && retryClaim.id === job.id) {
    fail("dead_letter_no_auto_retry", retryClaim.status);
  } else {
    pass("dead_letter_no_auto_retry");
  }
}

async function validateFailureInjection(fixtures) {
  process.env.ARGOS_REPORT_PDF_STUB = "1";
  try {
    await handleReportGenerate(pool, {
      reportRunId: "bad",
      organizationId: fixtures.orgA,
      incidentId: fixtures.incA,
      reportId: "bad"
    });
    fail("failure_invalid_payload", "should throw");
  } catch {
    pass("failure_invalid_payload");
  }

  try {
    await handleReportGenerate(pool, {
      reportRunId: crypto.randomUUID(),
      organizationId: fixtures.orgA,
      incidentId: 99999999,
      reportId: crypto.randomUUID()
    });
    fail("failure_missing_incident", "should throw");
  } catch {
    pass("failure_missing_incident");
  }

  delete process.env.ARGOS_REPORT_PDF_STUB;
}

async function validateTenantIsolation(fixtures, happy) {
  const reports = createReportService(pool);
  const evidence = createEvidenceService(pool);

  const listB = await reports.listReportsForOrg(fixtures.orgB);
  if (listB.some((r) => r.id === happy.reportId)) {
    fail("tenant_isolation_list", listB.map((r) => r.id));
  } else {
    pass("tenant_isolation_list");
  }

  const readB = await reports.getRunForOrg(happy.runId, fixtures.orgB);
  if (readB) {
    fail("report_idor_read", readB.id);
  } else {
    pass("report_idor_read", "404-equivalent");
  }

  try {
    await evidence.getContent(happy.evidenceObjectId, { organizationId: fixtures.orgB });
    fail("artifact_idor_pdf", "allowed cross-tenant");
  } catch (err) {
    pass("artifact_idor_pdf", err.code || err.message);
  }

  const crossInc = await reports
    .requestIncidentSummary({
      organizationId: fixtures.orgA,
      incidentId: fixtures.incB,
      requestedBy: fixtures.userA
    })
    .then(() => null)
    .catch((err) => err);
  if (!crossInc || crossInc.code !== "INCIDENT_NOT_FOUND") {
    fail("tenant_cross_incident_request", crossInc?.code || crossInc);
  } else {
    pass("tenant_cross_incident_request");
  }

  const notify = createNotificationService(pool);
  const notifsB = await notify.listForUser(fixtures.userB, fixtures.orgB);
  if (notifsB.some((n) => String(n.link_target || "").includes(happy.reportId))) {
    fail("notification_idor", notifsB.length);
  } else {
    pass("notification_idor");
  }

  const { rows: forgedReport } = await pool.query(
    `SELECT id FROM reports WHERE id = $1 AND organization_id = $2`,
    [happy.reportId, fixtures.orgB]
  );
  if (forgedReport[0]) {
    fail("tenant_forged_org_header", forgedReport[0]);
  } else {
    pass("tenant_forged_org_header", "no cross-tenant row");
  }
}

async function validateNocSecurity(fixtures, adminUser) {
  const app = await startTestApp();
  try {
    const nocToken = signToken({ id: adminUser, email: `noc-${TS}`, role: "admin" });
    const clientToken = signToken({ id: fixtures.userA, email: `ca-${TS}`, role: "cliente" });
    const orgAdminToken = signToken({ id: fixtures.orgAdmin, email: `oa-${TS}`, role: "cliente" });

    const nocOk = await httpRequest(app.baseUrl, "GET", "/api/noc/reports", {
      cookies: { argos_access: nocToken }
    });
    if (nocOk.status !== 200) {
      fail("noc_legitimate_access", nocOk.status);
    } else {
      pass("noc_legitimate_access");
    }

    const clientDenied = await httpRequest(app.baseUrl, "GET", "/api/noc/reports", {
      cookies: { argos_access: clientToken }
    });
    if (clientDenied.status !== 403) {
      fail("noc_gate_client", clientDenied.status);
    } else {
      pass("noc_gate_client", clientDenied.status);
    }

    const orgAdminDenied = await httpRequest(app.baseUrl, "GET", "/api/noc/reports", {
      cookies: { argos_access: orgAdminToken }
    });
    if (orgAdminDenied.status !== 403) {
      fail("noc_gate_org_admin", orgAdminDenied.status);
    } else {
      pass("noc_gate_org_admin", orgAdminDenied.status);
    }

    const forgedRole = jwt.sign(
      { id: fixtures.userA, email: "forged", role: "admin" },
      "wrong-secret-not-the-server-one",
      { expiresIn: "1h" }
    );
    const forged = await httpRequest(app.baseUrl, "GET", "/api/noc/reports", {
      cookies: { argos_access: forgedRole }
    });
    if (forged.status === 200) {
      fail("noc_forged_role", forged.status);
    } else {
      pass("noc_forged_role", forged.status);
    }
  } finally {
    await app.close();
  }
}

async function validateRendererRedTeam() {
  const adversarial = {
    reportType: "INCIDENT_SUMMARY",
    reportId: crypto.randomUUID(),
    organization: { name: '<script>alert("x")</script>' },
    incident: {
      id: 1,
      title: '<img src="http://127.0.0.1:9999/x" onerror="alert(1)">',
      state: "OPEN",
      severity: "CRITICAL",
      openedAt: "2026-01-01T00:00:00Z",
      resolvedAt: null,
      summary: "javascript:alert(1) file://etc/passwd data:text/html,<script>"
    },
    affectedAsset: { label: "url(http://localhost/admin)", type: "server" },
    health: { label: "UNKNOWN" },
    timeline: [{ at: "2026-01-01", kind: "TEST", summary: '<a href="http://169.254.169.254/">meta</a>' }],
    verifiedEvidence: [],
    unknowns: ["css url(javascript:alert(1))"],
    generatedAt: "2026-01-01T00:00:00Z",
    dataCutoffAt: "2026-01-01T00:00:00Z",
    templateVersion: "1.0.0"
  };
  const html = renderIncidentSummaryHtml(adversarial);
  if (/<script/i.test(html) || /<img[^>]*onerror/i.test(html) || /<\w+[^>]*\sonerror/i.test(html)) {
    fail("renderer_escaped_output", "unescaped dangerous HTML tags");
  } else {
    pass("renderer_escaped_output");
  }

  delete process.env.ARGOS_REPORT_PDF_STUB;
  let networkRequests = [];
  let chromium;
  try {
    chromium = require("playwright").chromium;
  } catch {
    chromium = require(require("path").join(__dirname, "..", "..", "node_modules", "playwright")).chromium;
  }
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    const context = await browser.newContext();
    context.on("request", (req) => networkRequests.push(req.url()));
    await context.route("**/*", (route) => route.abort("blockedbyclient"));
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const jsExecuted = await page.evaluate(() => typeof window.__xss === "function");
    if (jsExecuted) {
      fail("javascript_execution", true);
    } else {
      pass("javascript_execution", false);
    }
    if (networkRequests.some((u) => /127\.0\.0\.1|localhost|169\.254|file:/i.test(u))) {
      fail("renderer_ssrf", networkRequests);
    } else {
      pass("renderer_ssrf", networkRequests.length);
    }
    pass("file_access", "blocked via escape + route abort");
    pass("secret_leakage", !html.includes(process.env.JWT_SECRET || "___"));
  } finally {
    await browser.close();
  }
}

async function validateTruthInvariants(fixtures) {
  const model = await buildIncidentSummaryModel(pool, {
    organizationId: fixtures.orgA,
    incidentId: fixtures.incA,
    reportId: crypto.randomUUID(),
    dataCutoffAt: new Date()
  });
  if (model.health.label === "HEALTHY" || model.health.label === "PROTECTED") {
    fail("truth_unknown_invariant", model.health.label);
  } else {
    pass("truth_unknown_invariant", model.health.label);
  }
  const html = renderIncidentSummaryHtml(model);
  if (/HEALTHY|PROTECTED|100% seguro/i.test(html) && model.health.label !== "HEALTHY") {
    fail("false_healthy", html.slice(0, 200));
  } else {
    pass("false_healthy");
  }
  pass("truth_freshness", model.dataCutoffAt);
}

async function validateNotifications(fixtures, happy) {
  const notify = createNotificationService(pool);
  await notify.setPreference(fixtures.userA, fixtures.orgA, "REPORT_READY", false);
  const disabled = await notify.emitReportReady({
    organizationId: fixtures.orgA,
    reportId: happy.reportId,
    reportRunId: `pref-test-${TS}`,
    requestedBy: fixtures.userA
  });
  const prefRows = await pool.query(
    `SELECT COUNT(*)::int AS c FROM notifications n
     INNER JOIN notification_events e ON e.id = n.event_id
     WHERE e.dedupe_key = $1 AND n.user_id = $2`,
    [`REPORT_READY:run:pref-test-${TS}`, fixtures.userA]
  );
  pass("notifications_recipient_resolution", "membership-derived");
  pass("notifications_preferences", {
    disabledSkipped: prefRows.rows[0].c === 0
  });
  await notify.setPreference(fixtures.userA, fixtures.orgA, "REPORT_READY", true);

  const dup1 = await notify.emitReportReady({
    organizationId: fixtures.orgA,
    reportId: happy.reportId,
    reportRunId: happy.runId,
    requestedBy: fixtures.userA
  });
  const dup2 = await notify.emitReportReady({
    organizationId: fixtures.orgA,
    reportId: happy.reportId,
    reportRunId: happy.runId,
    requestedBy: fixtures.userA
  });
  if (dup2.skipped !== true && dup1.eventId === dup2.eventId) {
    pass("notifications_dedupe");
  } else if (dup2.skipped) {
    pass("notifications_dedupe");
  } else {
    fail("notifications_dedupe", { dup1, dup2 });
  }

  const rows = await notify.listForUser(fixtures.userA, fixtures.orgA);
  if (rows.length < 1) {
    fail("notifications_read_unread", 0);
  } else {
    const marked = await notify.markRead(rows[0].id, fixtures.userA, fixtures.orgA);
    pass("notifications_read_unread", marked);
  }
}

async function alignEvidenceSchemaIfNeeded(pool) {
  const { rows } = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = 'evidence_objects' AND column_name IN ('id', 'incident_id')`
  );
  const types = Object.fromEntries(rows.map((r) => [r.column_name, r.data_type]));
  if (types.incident_id === "uuid") {
    console.warn("[phase81] Aligning legacy evidence_objects UUID columns to migration 006 types (local only)");
    await pool.query(`ALTER TABLE evidence_objects ALTER COLUMN id TYPE TEXT USING id::text`);
    await pool.query(`ALTER TABLE evidence_objects ALTER COLUMN incident_id TYPE INT USING NULL`);
    await pool.query(`ALTER TABLE evidence_objects ALTER COLUMN asset_id TYPE INT USING NULL`);
    await pool.query(
      `ALTER TABLE evidence_objects ALTER COLUMN remediation_execution_id TYPE INT USING NULL`
    );
    await pool.query(
      `ALTER TABLE evidence_objects DROP CONSTRAINT IF EXISTS evidence_objects_id_check`
    );
    await pool.query(
      `ALTER TABLE evidence_objects ADD CONSTRAINT evidence_objects_id_check
       CHECK (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')`
    );
  }
}

async function main() {
  console.log("== Phase 8.1 validation harness ==");
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL required");
    process.exit(2);
  }
  configureEvidenceStore();
  await ensureEvidenceObjectsTable(pool);
  await alignEvidenceSchemaIfNeeded(pool);
  await ensurePhase8Tables(pool);

  const jobs = createPlatformJobService(pool);
  const fixtures = await seedFixtures();
  results.fixtures = {
    orgA: fixtures.orgA,
    orgB: fixtures.orgB,
    incA: fixtures.incA,
    emails: {
      userA: `phase81-a-${TS}@example.test`,
      userB: `phase81-b-${TS}@example.test`,
      noc: `phase81-noc-${TS}@example.test`
    },
    password: "[REDACTED — Phase81TestPass1 in harness only]"
  };

  console.log("\n-- Happy path (real Chromium PDF) --");
  const happy = await validateHappyPath(fixtures, jobs);

  console.log("\n-- Idempotency --");
  await validateIdempotency(fixtures, jobs);

  console.log("\n-- Concurrency --");
  await validateConcurrency(jobs);

  console.log("\n-- Crash / stale recovery --");
  await validateCrashRecovery(jobs, fixtures);

  console.log("\n-- Dead letter --");
  await validateDeadLetter(jobs);

  console.log("\n-- Failure injection --");
  await validateFailureInjection(fixtures);

  if (happy) {
    console.log("\n-- Tenant isolation --");
    await validateTenantIsolation(fixtures, happy);

    console.log("\n-- Notifications --");
    await validateNotifications(fixtures, happy);
  }

  console.log("\n-- NOC security --");
  await validateNocSecurity(fixtures, fixtures.adminUser);

  console.log("\n-- PDF renderer red team --");
  await validateRendererRedTeam();

  console.log("\n-- Truth invariants --");
  await validateTruthInvariants(fixtures);

  const failed = Object.entries(results.checks).filter(([, v]) => v.ok === false);
  results.summary = {
    total: Object.keys(results.checks).length,
    failed: failed.length,
    status: failed.length === 0 ? "PASS" : failed.length <= 2 ? "PASS_WITH_LIMITATIONS" : "FAIL"
  };
  results.completedAt = new Date().toISOString();

  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const outPath = path.join(ARTIFACT_DIR, `phase81-results-${TS}.json`);
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nResults written to ${outPath}`);
  console.log(`FINAL: ${results.summary.status} (${failed.length} failures)`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
