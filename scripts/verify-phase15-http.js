#!/usr/bin/env node
/**
 * Phase 15 — real HTTP validation against local backend (default :4003).
 */
const { spawnSync } = require("child_process");
const path = require("path");

const BACKEND = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4003";
const ORIGIN = process.env.E2E_ORIGIN || "http://127.0.0.1:3020";
const PASSWORD = "E2eSecure2026!x";
const ORG_A = 10;
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
  return { status: res.status, json: text && text.startsWith("{") ? JSON.parse(text) : null, headers: res.headers };
}

async function login(email) {
  const res = await fetchJson("POST", "/api/auth/login", { email, password: PASSWORD });
  const setCookie = res.headers.get("set-cookie") || "";
  return setCookie.split(",").map((c) => c.split(";")[0]).join("; ");
}

async function bootstrapDevelopment(cookie, staffCookie, title = "HTTP15 Dev") {
  const create = await fetchJson(
    "POST",
    "/api/client/web-projects",
    { title, projectType: "create" },
    cookie
  );
  const projectId = create.json.project.id;
  const orgId = create.json.project.organizationId;
  const h = { Origin: ORIGIN, Cookie: cookie };
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
    { fieldKey: "about_who", value: "Equipo de servicios de ejemplo" },
    { fieldKey: "about_what_you_do", value: "Servicios profesionales" },
    { fieldKey: "goals_objectives", value: ["professional_presence"] },
    { fieldKey: "goals_primary_success", value: "Web clara de servicios" },
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
    body: JSON.stringify({ acknowledgeOpenItems: true, reason: "HTTP15" })
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
  if (!mockupRes.json?.mockup?.id) {
    throw new Error(`mockup missing after generate: ${mockupRes.status} ${JSON.stringify(mockupRes.json)}`);
  }
  const mockupId = mockupRes.json.mockup.id;
  await fetch(`${BACKEND}/api/noc/web-projects/${projectId}/mockup/send-client?organization_id=${orgId}`, {
    method: "POST",
    headers: sh,
    body: JSON.stringify({ mockupId, acknowledgeWarnings: true })
  });
  await fetch(`${BACKEND}/api/client/web-projects/${projectId}/mockup/approve`, {
    method: "POST",
    headers: h
  });
  await fetch(`${BACKEND}/api/noc/web-projects/${projectId}/start-development?organization_id=${orgId}`, {
    method: "POST",
    headers: sh
  });
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
  const clientEmail = `http15-client-${stamp}@example.test`;
  const staffEmail = `http15-staff-${stamp}@example.test`;
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

  const { projectId, orgId } = await bootstrapDevelopment(clientCookie, staffCookie);

  let r = await fetchJson("GET", `/api/noc/web-projects/${projectId}/development?organization_id=${orgId}`, null, staffCookie);
  record("GET", "/development", 200, r.status, r.status === 200);

  r = await fetchJson("POST", `/api/noc/web-projects/${projectId}/development/prepare?organization_id=${orgId}`, null, staffCookie);
  record("POST", "/development/prepare", 200, r.status, r.status === 200);

  const globalItem = r.json.items.find((i) => i.itemType === "GLOBAL_STYLES");
  r = await fetchJson(
    "PATCH",
    `/api/noc/web-projects/${projectId}/development/items/${globalItem.id}?organization_id=${orgId}`,
    { status: "IN_PROGRESS" },
    staffCookie
  );
  record("PATCH", "/development/items/:id", 200, r.status, r.status === 200);

  r = await fetchJson(
    "POST",
    `/api/noc/web-projects/${projectId}/development/items/${globalItem.id}/block?organization_id=${orgId}`,
    { blockerType: "CLIENT_CONTENT", description: "Falta copy neutral" },
    staffCookie
  );
  record("POST", "/development/items/:id/block", 200, r.status, r.status === 200);

  r = await fetchJson(
    "POST",
    `/api/noc/web-projects/${projectId}/development/items/${globalItem.id}/unblock?organization_id=${orgId}`,
    { resolutionNote: "Recibido" },
    staffCookie
  );
  record("POST", "/development/items/:id/unblock", 200, r.status, r.status === 200);

  const headerItem = r.json.items.find((i) => i.itemType === "HEADER");
  r = await fetchJson(
    "POST",
    `/api/noc/web-projects/${projectId}/development/items/${headerItem.id}/dependencies?organization_id=${orgId}`,
    { dependsOnItemId: globalItem.id },
    staffCookie
  );
  record("POST", "/development/items/:id/dependencies", 200, r.status, r.status === 200);

  r = await fetchJson("GET", `/api/noc/web-projects/${projectId}/development?organization_id=${ORG_B}`, null, staffCookie);
  record("GET", "/development wrong org", 404, r.status, r.status === 404);

  const clientOnly = await login(clientEmail);
  r = await fetchJson("GET", `/api/noc/web-projects/${projectId}/development?organization_id=${orgId}`, null, clientOnly);
  record("GET", "/development insufficient NOC", 403, r.status, r.status === 403);

  r = await fetchJson(
    "PATCH",
    `/api/noc/web-projects/${projectId}/development/items/${globalItem.id}?organization_id=${orgId}`,
    { status: "DONE" },
    staffCookie
  );
  record("PATCH", "/development invalid transition", 409, r.status, r.status === 409);

  r = await fetchJson(
    "POST",
    `/api/noc/web-projects/${projectId}/development/items/${globalItem.id}/dependencies?organization_id=${orgId}`,
    { dependsOnItemId: globalItem.id },
    staffCookie
  );
  record("POST", "/development self dependency", 409, r.status, r.status === 409);

  r = await fetchJson(
    "POST",
    `/api/noc/web-projects/${projectId}/development/items/${globalItem.id}/dependencies?organization_id=${orgId}`,
    { dependsOnItemId: headerItem.id },
    staffCookie
  );
  record("POST", "/development dependency cycle", 409, r.status, r.status === 409);

  r = await fetchJson("POST", `/api/noc/web-projects/${projectId}/start-validation?organization_id=${orgId}`, null, staffCookie);
  record("POST", "/start-validation NOT_READY", 409, r.status, r.status === 409);

  r = await fetchJson(
    "POST",
    `/api/noc/web-projects/${projectId}/development/items/${globalItem.id}/block?organization_id=${orgId}`,
    { blockerType: "OTHER", description: "password=secret123456789" },
    staffCookie
  );
  record("POST", "/block secret rejected", 400, r.status, r.status === 400);

  await fetch(`${BACKEND}/api/test/reset-rate-limits`, {
    method: "POST",
    headers: { "content-type": "application/json", Origin: ORIGIN }
  });
  const ready = await bootstrapDevelopment(clientCookie, staffCookie, `HTTP15 Ready ${stamp}`);
  r = await fetchJson(
    "POST",
    `/api/noc/web-projects/${ready.projectId}/development/prepare?organization_id=${ready.orgId}`,
    null,
    staffCookie
  );
  for (const item of r.json.items.filter((i) => i.required)) {
    for (const status of item.status === "TODO" ? ["READY", "IN_PROGRESS", "REVIEW", "DONE"] : ["IN_PROGRESS", "REVIEW", "DONE"]) {
      await fetchJson(
        "PATCH",
        `/api/noc/web-projects/${ready.projectId}/development/items/${item.id}?organization_id=${ready.orgId}`,
        { status },
        staffCookie
      );
    }
  }
  r = await fetchJson(
    "POST",
    `/api/noc/web-projects/${ready.projectId}/start-validation?organization_id=${ready.orgId}`,
    { acknowledgeWarnings: true },
    staffCookie
  );
  record("POST", "/start-validation READY", 200, r.status, r.status === 200);

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
