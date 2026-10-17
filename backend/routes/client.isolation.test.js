/**
 * /api/client route isolation tests (Phase 1).
 * Uses injectable pool + express without listening on a real DB.
 *
 * Run: node --test backend/routes/client.isolation.test.js
 */
const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const createClientRouter = require("./client");
const { resolveTenantContext, requireTenant } = require("../middleware/tenantContext");

const ORG_A = 10;
const ORG_B = 20;
const USER_A = 1;
const USER_B = 2;

function createFakePool() {
  const state = {
    users: [
      {
        id: USER_A,
        email: "a@argos.test",
        name: "A",
        company: "Tenant A",
        created_at: new Date().toISOString(),
        role: "cliente",
        client_verified: true,
        company_profile: {}
      },
      {
        id: USER_B,
        email: "b@argos.test",
        name: "B",
        company: "Tenant B",
        created_at: new Date().toISOString(),
        role: "cliente",
        client_verified: true,
        company_profile: {}
      }
    ],
    memberships: {
      [USER_A]: [
        {
          organization_id: ORG_A,
          org_role: "org_owner",
          slug: "tenant-a",
          name: "Tenant A",
          status: "active"
        },
        {
          organization_id: 30,
          org_role: "org_member",
          slug: "tenant-c",
          name: "Tenant C",
          status: "active"
        }
      ],
      [USER_B]: [
        {
          organization_id: ORG_B,
          org_role: "org_admin",
          slug: "tenant-b",
          name: "Tenant B",
          status: "active"
        }
      ],
      3: [
        {
          organization_id: 40,
          org_role: "org_owner",
          slug: "suspended-org",
          name: "Suspended",
          status: "suspended"
        }
      ]
    },
    form_submissions: [
      { id: 101, organization_id: ORG_A, user_id: USER_A, data: { type: "direct_message", subject: "A" }, status: "pending", created_at: "2026-01-01" },
      { id: 202, organization_id: ORG_B, user_id: USER_B, data: { type: "direct_message", subject: "B" }, status: "pending", created_at: "2026-01-02" }
    ],
    activity_logs: [
      { id: 1, organization_id: ORG_A, user_id: USER_A, action_type: "login", details: {}, created_at: "2026-01-01" },
      { id: 2, organization_id: ORG_B, user_id: USER_B, action_type: "login", details: {}, created_at: "2026-01-02" }
    ],
    client_services: [
      { service_slug: "consultoria-it", status: "active", metadata: { name: "A svc" }, started_at: "2026-01-01", organization_id: ORG_A, user_id: USER_A },
      { service_slug: "seguridad-informatica", status: "active", metadata: { name: "B svc" }, started_at: "2026-01-01", organization_id: ORG_B, user_id: USER_B }
    ],
    website_audits: [
      { website_url: "https://a.example", score: 80, status: "done", findings: [], reviewed_at: "2026-01-01", organization_id: ORG_A, user_id: USER_A },
      { website_url: "https://b.example", score: 50, status: "done", findings: [], reviewed_at: "2026-01-01", organization_id: ORG_B, user_id: USER_B }
    ],
    client_improvements: [
      { id: 11, title: "Improve A", priority: "Alta", status: "pending", page_url: "/", details: "a", created_at: "2026-01-01", organization_id: ORG_A, user_id: USER_A },
      { id: 22, title: "Improve B", priority: "Alta", status: "pending", page_url: "/", details: "b", created_at: "2026-01-01", organization_id: ORG_B, user_id: USER_B }
    ],
    client_diagnostics: [
      {
        id: 1001,
        organization_id: ORG_A,
        user_id: USER_A,
        score: 10,
        max_score: 24,
        risk_level: "low",
        risk_label: "Bajo",
        summary: "diag A",
        created_at: "2026-01-01",
        source: "diagnostico-argos",
        strengths: [],
        risks: [],
        priorities: [],
        answers: []
      },
      {
        id: 2002,
        organization_id: ORG_B,
        user_id: USER_B,
        score: 20,
        max_score: 24,
        risk_level: "high",
        risk_label: "Alto",
        summary: "diag B secret",
        created_at: "2026-01-02",
        source: "diagnostico-argos",
        strengths: [],
        risks: [],
        priorities: [],
        answers: []
      }
    ],
    inserts: []
  };

  async function query(sql, params = []) {
    const s = String(sql).replace(/\s+/g, " ");

    if (s.includes("FROM organization_members")) {
      const userId = params[0];
      const rows = state.memberships[userId] || [];
      return { rows, rowCount: rows.length };
    }

    if (s.includes("FROM users WHERE id")) {
      const user = state.users.find((u) => u.id === params[0]);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    if (s.includes("FROM form_submissions") && s.includes("WHERE organization_id")) {
      const orgId = params[0];
      const rows = state.form_submissions.filter((r) => r.organization_id === orgId);
      return { rows, rowCount: rows.length };
    }

    if (s.includes("FROM activity_logs") && s.includes("WHERE organization_id")) {
      const orgId = params[0];
      const rows = state.activity_logs.filter((r) => r.organization_id === orgId);
      return { rows, rowCount: rows.length };
    }

    if (s.includes("FROM client_services") && s.includes("WHERE organization_id")) {
      const orgId = params[0];
      const rows = state.client_services.filter((r) => r.organization_id === orgId);
      return { rows, rowCount: rows.length };
    }

    if (s.includes("FROM website_audits") && s.includes("WHERE organization_id")) {
      const orgId = params[0];
      const rows = state.website_audits.filter((r) => r.organization_id === orgId);
      return { rows, rowCount: rows.length };
    }

    if (s.includes("FROM client_improvements") && s.includes("WHERE organization_id")) {
      const orgId = params[0];
      const rows = state.client_improvements.filter((r) => r.organization_id === orgId);
      return { rows, rowCount: rows.length };
    }

    if (s.includes("FROM client_diagnostics") && s.includes("WHERE id = $1 AND organization_id = $2")) {
      const id = params[0];
      const orgId = params[1];
      const rows = state.client_diagnostics.filter((r) => r.id === id && r.organization_id === orgId);
      return { rows, rowCount: rows.length };
    }

    if (s.includes("FROM client_diagnostics") && s.includes("WHERE organization_id")) {
      const orgId = params[0];
      const rows = state.client_diagnostics.filter((r) => r.organization_id === orgId);
      return { rows, rowCount: rows.length };
    }

    if (s.includes("INSERT INTO form_submissions")) {
      const [user_id, organization_id, dataJson, status] = params;
      const row = {
        id: 9000 + state.inserts.length,
        user_id,
        organization_id,
        data: typeof dataJson === "string" ? JSON.parse(dataJson) : dataJson,
        status,
        created_at: new Date().toISOString()
      };
      state.form_submissions.push(row);
      state.inserts.push({ table: "form_submissions", row, params });
      return { rows: [row], rowCount: 1 };
    }

    if (s.includes("INSERT INTO activity_logs")) {
      const [user_id, organization_id, action_type, details] = params;
      const row = { id: 8000 + state.inserts.length, user_id, organization_id, action_type, details, created_at: new Date().toISOString() };
      state.activity_logs.push(row);
      state.inserts.push({ table: "activity_logs", row, params });
      return { rows: [row], rowCount: 1 };
    }

    if (s.includes("INSERT INTO client_diagnostics")) {
      const organization_id = params[1];
      const user_id = params[0];
      const row = {
        id: 7000 + state.inserts.length,
        user_id,
        organization_id,
        created_at: new Date().toISOString()
      };
      state.client_diagnostics.push({
        ...row,
        score: params[3],
        max_score: params[4],
        risk_level: params[5],
        risk_label: params[6],
        summary: params[7],
        source: params[2],
        strengths: [],
        risks: [],
        priorities: [],
        answers: []
      });
      state.inserts.push({ table: "client_diagnostics", row, params });
      return { rows: [row], rowCount: 1 };
    }

    throw new Error(`Unhandled SQL in fake pool: ${s.slice(0, 160)}`);
  }

  return { query, state };
}

function buildApp(pool, user) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = user;
    next();
  });
  app.use("/api/client", resolveTenantContext(pool), requireTenant(), createClientRouter(pool));
  return app;
}

function request(app, { method, path, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const payload = body ? JSON.stringify(body) : null;
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path,
          method,
          headers: {
            "content-type": "application/json",
            ...(payload ? { "content-length": Buffer.byteLength(payload) } : {}),
            ...headers
          }
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            server.close();
            const text = Buffer.concat(chunks).toString("utf8");
            let json = null;
            try {
              json = text ? JSON.parse(text) : null;
            } catch {
              json = text;
            }
            resolve({ status: res.statusCode, body: json });
          });
        }
      );
      req.on("error", (err) => {
        server.close();
        reject(err);
      });
      if (payload) req.write(payload);
      req.end();
    });
  });
}

describe("Phase 1 — /api/client tenant isolation", () => {
  let pool;

  before(() => {
    pool = createFakePool();
  });

  it("1. Tenant A lists only A resources on portal", async () => {
    const app = buildApp(pool, { id: USER_A, role: "cliente", email: "a@argos.test" });
    const res = await request(app, { method: "GET", path: "/api/client/portal" });
    assert.equal(res.status, 200);
    assert.equal(res.body.organization.id, ORG_A);
    assert.equal(res.body.activeServices.length, 1);
    assert.equal(res.body.activeServices[0].slug, "consultoria-it");
    assert.equal(res.body.websiteAudit.websiteUrl, "https://a.example");
    assert.ok(res.body.suggestedImprovements.some((t) => t.includes("Improve A")));
    assert.ok(!res.body.suggestedImprovements.some((t) => t.includes("Improve B")));
    assert.equal(res.body.argosDiagnostics.length, 1);
    assert.equal(res.body.argosDiagnostics[0].id, 1001);
  });

  it("2. Tenant B lists only B resources on portal", async () => {
    const app = buildApp(pool, { id: USER_B, role: "cliente", email: "b@argos.test" });
    const res = await request(app, { method: "GET", path: "/api/client/portal" });
    assert.equal(res.status, 200);
    assert.equal(res.body.organization.id, ORG_B);
    assert.equal(res.body.activeServices[0].slug, "seguridad-informatica");
    assert.equal(res.body.argosDiagnostics[0].id, 2002);
  });

  it("3. Tenant A requesting Tenant B diagnostic id → 404", async () => {
    const app = buildApp(pool, { id: USER_A, role: "cliente" });
    const res = await request(app, { method: "GET", path: "/api/client/diagnostics/2002" });
    assert.equal(res.status, 404);
    assert.equal(res.body.error, "Diagnostico no encontrado.");
    assert.ok(!JSON.stringify(res.body).includes("diag B secret"));
  });

  it("4/5. No update/delete client routes exist — create cannot target other tenant", async () => {
    const app = buildApp(pool, { id: USER_A, role: "cliente" });
    const res = await request(app, {
      method: "POST",
      path: "/api/client/improvements",
      body: {
        category: "web",
        title: "Hack",
        message: "try",
        organization_id: ORG_B,
        organizationId: ORG_B
      }
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.request.organization_id, ORG_A);
    const last = pool.state.inserts.filter((i) => i.table === "form_submissions").at(-1);
    assert.equal(last.row.organization_id, ORG_A);
  });

  it("6. body organization_id tampering does not change tenant on diagnostics create", async () => {
    const answers = Array.from({ length: 12 }, (_, i) => ({
      questionId: `q${i}`,
      question: `Question ${i}`,
      answerLabel: "Sí",
      riskPoints: 1
    }));
    const app = buildApp(pool, { id: USER_A, role: "cliente" });
    const res = await request(app, {
      method: "POST",
      path: "/api/client/diagnostics",
      body: {
        organization_id: ORG_B,
        organizationId: ORG_B,
        score: 5,
        maxScore: 24,
        riskLevel: "low",
        riskLabel: "Bajo",
        summary: "ok",
        strengths: [],
        risks: [],
        priorities: [],
        answers
      }
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.diagnostic.organizationId, String(ORG_A));
  });

  it("7. query organizationId tampering ignored unless membership", async () => {
    const app = buildApp(pool, { id: USER_A, role: "cliente" });
    const res = await request(app, {
      method: "GET",
      path: `/api/client/portal?organizationId=${ORG_B}`
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.organization.id, ORG_A);
  });

  it("8. user without membership → fail closed", async () => {
    const app = buildApp(pool, { id: 99, role: "cliente" });
    const res = await request(app, { method: "GET", path: "/api/client/portal" });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "NO_ORGANIZATION_MEMBERSHIP");
  });

  it("9. inactive membership → fail closed", async () => {
    const app = buildApp(pool, { id: 3, role: "cliente" });
    const res = await request(app, { method: "GET", path: "/api/client/portal" });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "INACTIVE_ORGANIZATION");
  });

  it("10. org_admin is not global ARGOS admin", async () => {
    const app = buildApp(pool, { id: USER_B, role: "cliente" });
    const res = await request(app, { method: "GET", path: "/api/client/portal" });
    assert.equal(res.status, 200);
    assert.equal(res.body.organization.orgRole, "org_admin");
    assert.equal(res.body.user.role, "cliente");
  });

  it("11. global admin without membership cannot use client portal (requireTenant)", async () => {
    const app = buildApp(pool, { id: 77, role: "super_admin" });
    const res = await request(app, { method: "GET", path: "/api/client/portal" });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "TENANT_REQUIRED");
  });

  it("12. multi-org switch only via valid membership header", async () => {
    const app = buildApp(pool, { id: USER_A, role: "cliente" });
    const ok = await request(app, {
      method: "GET",
      path: "/api/client/portal",
      headers: { "x-argos-organization-id": "30" }
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.organization.id, 30);

    const bad = await request(app, {
      method: "GET",
      path: "/api/client/portal",
      headers: { "x-argos-organization-id": String(ORG_B) }
    });
    assert.equal(bad.status, 200);
    assert.equal(bad.body.organization.id, ORG_A);
  });

  it("13. legacy user_id ownership does not leak cross-tenant via list", async () => {
    // Even if user A somehow had a B-owned row with user_id=A (shouldn't), queries filter by org.
    pool.state.client_diagnostics.push({
      id: 9999,
      organization_id: ORG_B,
      user_id: USER_A,
      score: 1,
      max_score: 24,
      risk_level: "critical",
      risk_label: "leak",
      summary: "should not appear for A primary org",
      created_at: "2026-01-03",
      source: "x",
      strengths: [],
      risks: [],
      priorities: [],
      answers: []
    });
    const app = buildApp(pool, { id: USER_A, role: "cliente" });
    const res = await request(app, { method: "GET", path: "/api/client/diagnostics" });
    assert.equal(res.status, 200);
    assert.ok(res.body.diagnostics.every((d) => d.id !== 9999));
  });

  it("14. create forces organization_id from session", async () => {
    const app = buildApp(pool, { id: USER_B, role: "cliente" });
    const res = await request(app, {
      method: "POST",
      path: "/api/client/messages",
      body: {
        subject: "Hi",
        message: "Hello",
        organization_id: ORG_A
      }
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.request.organization_id, ORG_B);
  });
});
