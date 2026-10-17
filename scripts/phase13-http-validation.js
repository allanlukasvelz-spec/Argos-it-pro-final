#!/usr/bin/env node
/**
 * Phase 13 HTTP validation against local backend (:4000).
 * Requires running backend with DATABASE_URL. Run after: npm --prefix backend run dev
 */
const http = require("http");
const path = require("path");
const backendDir = path.join(__dirname, "..", "backend");
require(path.join(backendDir, "node_modules", "dotenv")).config({
  path: path.join(backendDir, ".env")
});

const BACKEND = process.env.E2E_BACKEND_URL || "http://127.0.0.1:4000";
const ORIGIN = process.env.E2E_ORIGIN || "http://127.0.0.1:3000";
const PASSWORD = "HttpVal2026!Secure";

function request(method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BACKEND);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          "Content-Type": "application/json",
          Origin: ORIGIN,
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...headers
        }
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            json: raw && raw.trim().startsWith("{") ? JSON.parse(raw) : null,
            cookies: res.headers["set-cookie"] || []
          });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function cookieHeader(setCookies) {
  return setCookies.map((c) => c.split(";")[0]).join("; ");
}

async function register(email, name = "HTTP Val") {
  return request("POST", "/api/auth/register", {
    email,
    password: PASSWORD,
    name,
    company: "ARGOS"
  });
}

async function login(email) {
  const res = await request("POST", "/api/auth/login", { email, password: PASSWORD });
  return { ...res, cookie: cookieHeader(res.cookies) };
}

async function promoteAdmin(email) {
  const { Pool } = require(path.join(backendDir, "node_modules", "pg"));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`UPDATE users SET role = 'admin' WHERE lower(email) = lower($1)`, [email]);
  await pool.end();
}

async function resetRateLimits() {
  const res = await request("POST", "/api/test/reset-rate-limits", null);
  if (res.status !== 200) {
    throw new Error(
      `Rate-limit reset HTTP ${res.status}. Use backend with ARGOS_ALLOW_RATE_LIMIT_RESET=1 and NODE_ENV=test.`
    );
  }
}

async function main() {
  const results = [];
  const log = (name, status, expected) => {
    const ok = Array.isArray(expected) ? expected.includes(status) : status === expected;
    results.push({ name, status, expected, ok });
    console.log(`${ok ? "OK" : "FAIL"} ${name}: ${status} (expected ${expected})`);
    if (!ok) process.exitCode = 1;
  };

  await resetRateLimits();

  const adminEmail = `p13-http-admin-${Date.now()}@example.test`;
  const clientEmail = `p13-http-client-${Date.now()}@example.test`;
  const regAdmin = await register(adminEmail);
  const regClient = await register(clientEmail);
  if (regAdmin.status !== 201 || regClient.status !== 201) {
    throw new Error(`Register failed: admin=${regAdmin.status} client=${regClient.status}`);
  }
  await promoteAdmin(adminEmail);
  const adminLogin = await login(adminEmail);
  const clientLogin = await login(clientEmail);
  if (adminLogin.status !== 200 || clientLogin.status !== 200) {
    throw new Error(`Login failed: admin=${adminLogin.status} client=${clientLogin.status}`);
  }
  const adminH = { Cookie: adminLogin.cookie };
  const clientH = { Cookie: clientLogin.cookie };

  const create = await request(
    "POST",
    "/api/client/web-projects",
    { title: "HTTP P13", projectType: "create" },
    clientH
  );
  if (create.status !== 201) {
    throw new Error(`Create project failed: ${create.status}`);
  }
  const projectId = create.json.project.id;
  const orgId = create.json.project.organizationId;

  const formBody = {
    responses: [
      { fieldKey: "company_trade_name", value: "HTTP Demo" },
      { fieldKey: "company_city", value: "Valencia" },
      { fieldKey: "company_country", value: "España" },
      { fieldKey: "company_phone", value: "+34 600 000 000" },
      { fieldKey: "company_email", value: "a@test.com" },
      { fieldKey: "company_contact_name", value: "Ana" },
      { fieldKey: "company_entity_type", value: "company" },
      { fieldKey: "company_multiple_locations", value: "no" },
      { fieldKey: "has_existing_site", value: "no" },
      { fieldKey: "brand_has_logo", value: "no" },
      { fieldKey: "brand_has_manual", value: "no" },
      { fieldKey: "about_who", value: "Quién" },
      { fieldKey: "about_what_you_do", value: "Qué" },
      { fieldKey: "goals_objectives", value: ["professional_presence"] },
      { fieldKey: "goals_primary_success", value: "OK" },
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
      { fieldKey: "access_ack_no_secrets", value: "yes" },
      { fieldKey: "confirm_reviewed", value: "yes" },
      { fieldKey: "confirm_use_material", value: "yes" },
      { fieldKey: "confirm_authorization", value: "yes" }
    ]
  };
  await request("POST", `/api/client/web-projects/${projectId}/form`, formBody, {
    ...clientH,
    "X-Organization-Id": String(orgId)
  });
  await request(
    "POST",
    `/api/client/web-projects/${projectId}/items`,
    { itemType: "service", title: "S1", payload: { summary: "A" } },
    { ...clientH, "X-Organization-Id": String(orgId) }
  );
  await request(
    "POST",
    `/api/client/web-projects/${projectId}/items`,
    { itemType: "service", title: "S2", payload: { summary: "B" } },
    { ...clientH, "X-Organization-Id": String(orgId) }
  );
  await request("POST", `/api/client/web-projects/${projectId}/submit-review`, null, {
    ...clientH,
    "X-Organization-Id": String(orgId)
  });

  log("GET architecture (no arch yet)", (await request("GET", `/api/noc/web-projects/${projectId}/architecture?organization_id=${orgId}`, null, adminH)).status, 200);

  log("generate blocked REVIEW", (await request("POST", `/api/noc/web-projects/${projectId}/architecture/generate?organization_id=${orgId}`, null, adminH)).status, 409);

  await request("POST", `/api/noc/web-projects/${projectId}/start-architecture?organization_id=${orgId}`, {
    acknowledgeOpenItems: true,
    reason: "HTTP validation fixture override."
  }, adminH);

  log("generate ARCHITECTURE", (await request("POST", `/api/noc/web-projects/${projectId}/architecture/generate?organization_id=${orgId}`, null, adminH)).status, 201);

  const arch = await request("GET", `/api/noc/web-projects/${projectId}/architecture?organization_id=${orgId}`, null, adminH);
  log("GET architecture", arch.status, 200);
  const archId = arch.json.architecture.id;
  const contactPage = arch.json.pages.find((p) => p.pageType === "CONTACT");

  log("validate", (await request("POST", `/api/noc/web-projects/${projectId}/architecture/validate?organization_id=${orgId}`, null, adminH)).status, 200);

  const pagePatch = await request(
    "PATCH",
    `/api/noc/web-projects/${projectId}/architecture/pages/${contactPage.id}?organization_id=${orgId}`,
    { purpose: "Contacto HTTP", seoPriority: "HIGH" },
    adminH
  );
  log("patch page", pagePatch.status, 200);

  const blockCreate = await request(
    "POST",
    `/api/noc/web-projects/${projectId}/architecture/pages/${contactPage.id}/blocks?organization_id=${orgId}`,
    { blockType: "CUSTOM", purpose: "Nota HTTP" },
    adminH
  );
  log("create block", blockCreate.status, 201);
  const blockId = blockCreate.json.block.id;

  log("patch block", (await request("PATCH", `/api/noc/web-projects/${projectId}/architecture/blocks/${blockId}?organization_id=${orgId}`, { purpose: "Actualizado" }, adminH)).status, 200);

  log("approve", (await request("POST", `/api/noc/web-projects/${projectId}/architecture/approve?organization_id=${orgId}`, { acknowledgeWarnings: true }, adminH)).status, 200);

  log("patch approved blocked", (await request("PATCH", `/api/noc/web-projects/${projectId}/architecture/pages/${contactPage.id}?organization_id=${orgId}`, { title: "X" }, adminH)).status, 409);

  log("revision", (await request("POST", `/api/noc/web-projects/${projectId}/architecture/revisions?organization_id=${orgId}`, null, adminH)).status, 201);

  log("start mockup", (await request("POST", `/api/noc/web-projects/${projectId}/start-mockup?organization_id=${orgId}`, null, adminH)).status, 200);

  log("wrong org 404", (await request("GET", `/api/noc/web-projects/${projectId}/architecture?organization_id=999999`, null, adminH)).status, 404);

  log("client 403", (await request("GET", `/api/noc/web-projects/${projectId}/architecture?organization_id=${orgId}`, null, clientH)).status, 403);

  const p2 = (await request("POST", "/api/client/web-projects", { title: "P2", projectType: "create" }, { ...clientH, "X-Organization-Id": String(orgId) })).json.project.id;
  await request("POST", `/api/noc/web-projects/${p2}/start-architecture?organization_id=${orgId}`, { acknowledgeOpenItems: true, reason: "x" }, adminH).catch(() => null);
  log("mockup without approve", (await request("POST", `/api/noc/web-projects/${p2}/start-mockup?organization_id=${orgId}`, null, adminH)).status, 409);

  log("secret rejected", (await request("PATCH", `/api/noc/web-projects/${projectId}/architecture/pages/${contactPage.id}?organization_id=${orgId}`, { purpose: "password=secret" }, adminH)).status, [400, 409]);

  console.log("HTTP_VALIDATION_DONE", results.filter((r) => !r.ok).length === 0 ? "PASS" : "FAIL");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
