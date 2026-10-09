#!/usr/bin/env node
/**
 * Phase 16 — real HTTP validation against local backend.
 */
const { spawnSync } = require("child_process");
const path = require("path");

const BACKEND = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4014";
const ORIGIN = process.env.E2E_ORIGIN || BACKEND.replace(/:\d+$/, ":3031");
const PASSWORD = "E2eSecure2026!x";
const ORG_B = 20;

const results = [];
function record(method, pathKey, expected, actual, ok, note = "") {
  results.push({ method, path: pathKey, expected, actual, ok, note });
}

function promoteAdmin(email) {
  const backendDir = path.join(__dirname, "..", "backend");
  const r = spawnSync(
    process.execPath,
    [
      "-e",
      `require('dotenv').config(); const {Pool}=require('pg'); (async()=>{const p=new Pool({connectionString:process.env.DATABASE_URL}); await p.query("UPDATE users SET role='admin' WHERE lower(email)=lower($1)", [process.argv[1]]); await p.end();})();`,
      email
    ],
    { cwd: backendDir, encoding: "utf8" }
  );
  if (r.status !== 0) throw new Error(`promote admin failed: ${r.stderr}`);
}

async function fetchJson(method, urlPath, body, cookie = "") {
  const headers = { "content-type": "application/json", Origin: ORIGIN };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(new URL(urlPath, BACKEND), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  return {
    status: res.status,
    json: text && text.trim().startsWith("{") ? JSON.parse(text) : null,
    headers: res.headers
  };
}

async function login(email) {
  const res = await fetchJson("POST", "/api/auth/login", { email, password: PASSWORD });
  const setCookie = res.headers.get("set-cookie") || "";
  return setCookie.split(",").map((c) => c.split(";")[0]).join("; ");
}

async function bootstrapToValidation(clientCookie, staffCookie, title = "HTTP16 Val") {
  const create = await fetchJson(
    "POST",
    "/api/client/web-projects",
    { title, projectType: "create" },
    clientCookie
  );
  if (create.status !== 201 || !create.json?.project?.id) {
    throw new Error(`create project failed: ${create.status} ${JSON.stringify(create.json)}`);
  }
  const projectId = create.json.project.id;
  const orgId = create.json.project.organizationId;
  const h = { Origin: ORIGIN, Cookie: clientCookie };
  const form = [
    { fieldKey: "company_trade_name", value: "Demo Services Co" },
    { fieldKey: "company_city", value: "Valencia" },
    { fieldKey: "company_country", value: "España" },
    { fieldKey: "company_phone", value: "+34 600 000 000" },
    { fieldKey: "company_email", value: "hola@demo-services.test" },
    { fieldKey: "company_contact_name", value: "Ana Pérez" },
    { fieldKey: "company_entity_type", value: "company" },
    { fieldKey: "company_multiple_locations", value: "no" },
    { fieldKey: "has_existing_site", value: "no" },
    { fieldKey: "brand_has_logo", value: "no" },
    { fieldKey: "brand_has_manual", value: "no" },
    { fieldKey: "about_who", value: "Equipo demo" },
    { fieldKey: "about_what_you_do", value: "Servicios" },
    { fieldKey: "goals_objectives", value: ["professional_presence"] },
    { fieldKey: "goals_primary_success", value: "Web clara" },
    { fieldKey: "goals_b2b_b2c", value: "b2b" },
    { fieldKey: "goals_priority", value: "normal" },
    { fieldKey: "offer_kinds", value: ["services"] },
    { fieldKey: "content_has_texts", value: "no" },
    { fieldKey: "content_needs_copy", value: "yes" },
    { fieldKey: "media_has_photos", value: "no" },
    { fieldKey: "media_has_videos", value: "no" },
    { fieldKey: "media_needs_production", value: "yes" },
    { fieldKey: "media_commercial_rights", value: "pending" },
    { fieldKey: "primary_language", value: "es" },
    { fieldKey: "languages_multilingual", value: "no" },
    { fieldKey: "sales_mode", value: "contact_forms" },
    { fieldKey: "legal_notice", value: "yes" },
    { fieldKey: "legal_privacy", value: "yes" },
    { fieldKey: "legal_cookies", value: "yes" },
    { fieldKey: "access_ack_no_secrets", value: "yes" },
    { fieldKey: "confirm_reviewed", value: "yes" },
    { fieldKey: "confirm_use_material", value: "yes" },
    { fieldKey: "confirm_authorization", value: "yes" }
  ];
  await fetch(`${BACKEND}/api/client/web-projects/${projectId}/form`, {
    method: "POST",
    headers: { ...h, "content-type": "application/json" },
    body: JSON.stringify({ responses: form })
  });
  await fetch(`${BACKEND}/api/client/web-projects/${projectId}/items`, {
    method: "POST",
    headers: { ...h, "content-type": "application/json" },
    body: JSON.stringify({ itemType: "service", title: "Demo Service", payload: { summary: "x" } })
  });
  await fetch(`${BACKEND}/api/client/web-projects/${projectId}/submit-review`, {
    method: "POST",
    headers: h
  });
  const sh = { Origin: ORIGIN, Cookie: staffCookie, "content-type": "application/json" };
  await fetch(`${BACKEND}/api/noc/web-projects/${projectId}/start-architecture?organization_id=${orgId}`, {
    method: "POST",
    headers: sh,
    body: JSON.stringify({ acknowledgeOpenItems: true, reason: "HTTP16" })
  });
  await fetch(`${BACKEND}/api/noc/web-projects/${projectId}/architecture/generate?organization_id=${orgId}`, {
    method: "POST",
    headers: sh
  });
  await fetch(`${BACKEND}/api/noc/web-projects/${projectId}/architecture/approve?organization_id=${orgId}`, {
    method: "POST",
    headers: sh,
    body: JSON.stringify({ acknowledgeWarnings: true })
  });
  await fetch(`${BACKEND}/api/noc/web-projects/${projectId}/start-mockup?organization_id=${orgId}`, {
    method: "POST",
    headers: sh
  });
  await fetch(`${BACKEND}/api/noc/web-projects/${projectId}/mockup/generate?organization_id=${orgId}`, {
    method: "POST",
    headers: sh
  });
  const mockupRes = await fetchJson("GET", `/api/noc/web-projects/${projectId}/mockup?organization_id=${orgId}`, null, staffCookie);
  await fetch(`${BACKEND}/api/noc/web-projects/${projectId}/mockup/send-client?organization_id=${orgId}`, {
    method: "POST",
    headers: sh,
    body: JSON.stringify({ mockupId: mockupRes.json.mockup.id, acknowledgeWarnings: true })
  });
  await fetch(`${BACKEND}/api/client/web-projects/${projectId}/mockup/approve`, {
    method: "POST",
    headers: h
  });
  await fetch(`${BACKEND}/api/noc/web-projects/${projectId}/start-development?organization_id=${orgId}`, {
    method: "POST",
    headers: sh
  });
  const devPrepare = await fetchJson(
    "POST",
    `/api/noc/web-projects/${projectId}/development/prepare?organization_id=${orgId}`,
    null,
    staffCookie
  );
  for (const item of devPrepare.json.items.filter((i) => i.required && i.status !== "NOT_APPLICABLE")) {
    const order = ["TODO", "READY", "IN_PROGRESS", "REVIEW", "DONE"];
    const start = order.indexOf(item.status);
    for (let i = Math.max(start + 1, 1); i < order.length; i += 1) {
      await fetchJson(
        "PATCH",
        `/api/noc/web-projects/${projectId}/development/items/${item.id}?organization_id=${orgId}`,
        { status: order[i] },
        staffCookie
      );
    }
  }
  await fetchJson(
    "POST",
    `/api/noc/web-projects/${projectId}/start-validation?organization_id=${orgId}`,
    { acknowledgeWarnings: true },
    staffCookie
  );
  return { projectId, orgId };
}

async function main() {
  try {
    const health = await fetch(`${BACKEND}/api/health`);
    if (!health.ok) throw new Error(`health ${health.status}`);
    await fetch(`${BACKEND}/api/test/reset-rate-limits`, {
      method: "POST",
      headers: { "content-type": "application/json", Origin: ORIGIN }
    });
  } catch (err) {
    console.error(`Backend unreachable at ${BACKEND}: ${err.message}`);
    process.exit(1);
  }

  const stamp = Date.now();
  const clientEmail = `http16-client-${stamp}@example.test`;
  const staffEmail = `http16-staff-${stamp}@example.test`;
  await fetchJson("POST", "/api/auth/register", {
    email: clientEmail,
    password: PASSWORD,
    name: "HTTP Client",
    company: "ARGOS"
  });
  await fetchJson("POST", "/api/auth/register", {
    email: staffEmail,
    password: PASSWORD,
    name: "HTTP Staff",
    company: "ARGOS"
  });
  promoteAdmin(staffEmail);
  const clientCookie = await login(clientEmail);
  const staffCookie = await login(staffEmail);

  const { projectId, orgId } = await bootstrapToValidation(clientCookie, staffCookie);

  let r = await fetchJson("GET", `/api/noc/web-projects/${projectId}/validation?organization_id=${orgId}`, null, staffCookie);
  record("GET", "/validation", 200, r.status, r.status === 200);

  r = await fetchJson("POST", `/api/noc/web-projects/${projectId}/validation/prepare?organization_id=${orgId}`, null, staffCookie);
  record("POST", "/validation/prepare", 200, r.status, r.status === 200);
  const planId = r.json.plan?.id;
  const checks = r.json.checks || [];
  const requiredCheck = checks.find((c) => c.required) || checks[0];

  r = await fetchJson("POST", `/api/noc/web-projects/${projectId}/validation/prepare?organization_id=${orgId}`, null, staffCookie);
  record("POST", "/validation/prepare idempotent", 200, r.status, r.status === 200 && r.json.plan?.id === planId);

  r = await fetchJson(
    "PATCH",
    `/api/noc/web-projects/${projectId}/validation/checks/${requiredCheck.id}?organization_id=${orgId}`,
    { status: "IN_PROGRESS" },
    staffCookie
  );
  record("PATCH", "/validation/checks/:id IN_PROGRESS", 200, r.status, r.status === 200);

  r = await fetchJson(
    "PATCH",
    `/api/noc/web-projects/${projectId}/validation/checks/${requiredCheck.id}?organization_id=${orgId}`,
    { status: "PASS" },
    staffCookie
  );
  record("PATCH", "/validation/checks/:id PASS", 200, r.status, r.status === 200);

  const failCheck = checks.find((c) => c.required && c.id !== requiredCheck.id) || requiredCheck;
  r = await fetchJson(
    "PATCH",
    `/api/noc/web-projects/${projectId}/validation/checks/${failCheck.id}?organization_id=${orgId}`,
    { status: "IN_PROGRESS" },
    staffCookie
  );
  r = await fetchJson(
    "PATCH",
    `/api/noc/web-projects/${projectId}/validation/checks/${failCheck.id}?organization_id=${orgId}`,
    { status: "FAIL", actualResult: "Desalineado con mockup" },
    staffCookie
  );
  record("PATCH", "/validation/checks/:id FAIL", 200, r.status, r.status === 200);

  r = await fetchJson(
    "POST",
    `/api/noc/web-projects/${projectId}/validation/checks/${failCheck.id}/defects?organization_id=${orgId}`,
    { title: "Defecto demo", description: "Visual", severity: "HIGH" },
    staffCookie
  );
  record("POST", "/validation/checks/:id/defects", 200, r.status, r.status === 200);
  const defectId = r.json.defect?.id;

  r = await fetchJson(
    "POST",
    `/api/noc/web-projects/${projectId}/validation/checks/${requiredCheck.id}/evidence?organization_id=${orgId}`,
    { evidenceType: "TEXT_NOTE", textNote: "Revisado manualmente" },
    staffCookie
  );
  record("POST", "/validation/checks/:id/evidence", 200, r.status, r.status === 200);

  r = await fetchJson(
    "POST",
    `/api/noc/web-projects/${projectId}/validation/checks/${requiredCheck.id}/evidence?organization_id=${orgId}`,
    { evidenceType: "URL", url: "javascript:alert(1)" },
    staffCookie
  );
  record("POST", "/validation/evidence unsafe URL", 400, r.status, r.status === 400);

  r = await fetchJson("GET", `/api/noc/web-projects/${projectId}/validation?organization_id=${ORG_B}`, null, staffCookie);
  record("GET", "/validation wrong org", 404, r.status, r.status === 404);

  r = await fetchJson("GET", `/api/noc/web-projects/${projectId}/validation?organization_id=${orgId}`, null, clientCookie);
  record("GET", "/validation insufficient NOC", 403, r.status, r.status === 403);

  r = await fetchJson("POST", `/api/noc/web-projects/${projectId}/start-publication?organization_id=${orgId}`, null, staffCookie);
  record("POST", "/start-publication NOT_READY", 409, r.status, r.status === 409);

  r = await fetchJson(
    "PATCH",
    `/api/noc/web-projects/${projectId}/validation/defects/${defectId}?organization_id=${orgId}`,
    { status: "IN_PROGRESS" },
    staffCookie
  );
  r = await fetchJson(
    "PATCH",
    `/api/noc/web-projects/${projectId}/validation/defects/${defectId}?organization_id=${orgId}`,
    { status: "FIXED", resolutionNote: "Corregido" },
    staffCookie
  );
  r = await fetchJson(
    "POST",
    `/api/noc/web-projects/${projectId}/validation/defects/${defectId}/retest?organization_id=${orgId}`,
    { checkStatus: "PASS", actualResult: "Verificado" },
    staffCookie
  );
  record("POST", "/validation/defects/:id/retest", 200, r.status, r.status === 200);

  const fresh = await bootstrapToValidation(clientCookie, staffCookie, `HTTP16 Ready ${stamp}`);
  r = await fetchJson(
    "POST",
    `/api/noc/web-projects/${fresh.projectId}/validation/prepare?organization_id=${fresh.orgId}`,
    null,
    staffCookie
  );
  for (const check of r.json.checks.filter((c) => c.required)) {
    if (check.status === "NOT_APPLICABLE") continue;
    await fetchJson(
      "PATCH",
      `/api/noc/web-projects/${fresh.projectId}/validation/checks/${check.id}?organization_id=${fresh.orgId}`,
      { status: "IN_PROGRESS" },
      staffCookie
    );
    const body =
      check.status === "NOT_TESTABLE" || check.category === "BOOKING"
        ? { status: "NOT_APPLICABLE", actualResult: "No aplica en fixture" }
        : { status: "PASS" };
    await fetchJson(
      "PATCH",
      `/api/noc/web-projects/${fresh.projectId}/validation/checks/${check.id}?organization_id=${fresh.orgId}`,
      body,
      staffCookie
    );
  }
  r = await fetchJson(
    "POST",
    `/api/noc/web-projects/${fresh.projectId}/start-publication?organization_id=${fresh.orgId}`,
    null,
    staffCookie
  );
  record("POST", "/start-publication READY", 200, r.status, r.status === 200);

  r = await fetchJson(
    "POST",
    `/api/noc/web-projects/${fresh.projectId}/start-publication?organization_id=${fresh.orgId}`,
    null,
    staffCookie
  );
  record("POST", "/start-publication double", 409, r.status, r.status === 409);

  console.log("\nMETHOD | PATH | EXPECTED | ACTUAL | RESULT | NOTE");
  for (const row of results) {
    console.log(
      `${row.method} | ${row.path} | ${row.expected} | ${row.actual} | ${row.ok ? "PASS" : "FAIL"} | ${row.note}`
    );
  }
  const failed = results.filter((r) => !r.ok);
  if (failed.length) process.exit(1);
  console.log(`\nAll ${results.length} HTTP checks passed against ${BACKEND}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
