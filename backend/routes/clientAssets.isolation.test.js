/**
 * Phase 2 — assets / domains / TLS tenant isolation + SSRF guards.
 * Run: node --test backend/routes/clientAssets.isolation.test.js
 */
const { describe, it, before, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const createClientRouter = require("./client");
const hostnameSecurity = require("../lib/hostnameSecurity");
const { resolveTenantContext, requireTenant } = require("../middleware/tenantContext");

const ORG_A = 10;
const ORG_B = 20;
const USER_A = 1;
const USER_B = 2;
const USER_ADMIN = 99;

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
      },
      {
        id: USER_ADMIN,
        email: "admin@argos.test",
        name: "Admin",
        company: "Argos",
        created_at: new Date().toISOString(),
        role: "admin",
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
      [USER_ADMIN]: [
        {
          organization_id: ORG_A,
          org_role: "org_member",
          slug: "tenant-a",
          name: "Tenant A",
          status: "active"
        }
      ]
    },
    assets: [
      {
        id: 501,
        organization_id: ORG_A,
        parent_asset_id: null,
        type: "DOMAIN",
        name: "a.example",
        hostname: "a.example",
        address: null,
        environment: "production",
        status: "active",
        kind: "apex",
        is_primary: true,
        metadata: {},
        last_observed_at: "2026-08-01T00:00:00.000Z",
        created_by: USER_A,
        created_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-08-01T00:00:00.000Z"
      },
      {
        id: 502,
        organization_id: ORG_B,
        parent_asset_id: null,
        type: "DOMAIN",
        name: "b.example",
        hostname: "b.example",
        address: null,
        environment: "production",
        status: "active",
        kind: "apex",
        is_primary: true,
        metadata: { secret: "tenant-b-only" },
        last_observed_at: "2026-08-01T00:00:00.000Z",
        created_by: USER_B,
        created_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-08-01T00:00:00.000Z"
      }
    ],
    tls_certificates: [
      {
        id: 801,
        organization_id: ORG_A,
        asset_id: 501,
        provider: "Let's Encrypt",
        serial: "aa",
        fingerprint_sha256: "aaa",
        issuer: "O=Let's Encrypt",
        subject: "CN=a.example",
        not_before: "2026-01-01T00:00:00.000Z",
        not_after: "2026-12-01T00:00:00.000Z",
        sans: ["a.example", "www.a.example"],
        is_wildcard: false,
        auto_renew: true,
        renewal_method: "acme",
        last_observed_at: "2026-08-01T00:00:00.000Z",
        observation_status: "VALID",
        hostname_match: true,
        metadata: {},
        created_by: USER_A,
        created_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-08-01T00:00:00.000Z",
        private_key: "SHOULD_NEVER_LEAVE_DB"
      },
      {
        id: 802,
        organization_id: ORG_B,
        asset_id: 502,
        provider: "DigiCert",
        serial: "bb",
        fingerprint_sha256: "bbb",
        issuer: "O=DigiCert",
        subject: "CN=b.example",
        not_before: "2026-01-01T00:00:00.000Z",
        not_after: "2026-12-01T00:00:00.000Z",
        sans: ["b.example"],
        is_wildcard: false,
        auto_renew: false,
        renewal_method: null,
        last_observed_at: "2026-08-01T00:00:00.000Z",
        observation_status: "VALID",
        hostname_match: true,
        metadata: {},
        created_by: USER_B,
        created_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-08-01T00:00:00.000Z"
      }
    ],
    form_submissions: [],
    activity_logs: [],
    client_services: [],
    website_audits: [],
    client_improvements: [],
    client_diagnostics: [],
    inserts: []
  };

  let nextAssetId = 1000;
  let nextTlsId = 2000;

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

    if (
      s.includes("FROM form_submissions") ||
      s.includes("FROM activity_logs") ||
      s.includes("FROM client_services") ||
      s.includes("FROM website_audits") ||
      s.includes("FROM client_improvements") ||
      s.includes("FROM client_diagnostics")
    ) {
      return { rows: [], rowCount: 0 };
    }

    if (
      s.includes("FROM assets WHERE organization_id = $1 AND status <> 'archived'") &&
      s.includes("ORDER BY type")
    ) {
      const orgId = params[0];
      let rows = state.assets.filter((a) => a.organization_id === orgId && a.status !== "archived");
      if (params[1]) rows = rows.filter((a) => a.type === params[1]);
      return { rows, rowCount: rows.length };
    }

    if (s.includes("FROM assets") && s.includes("type IN ('DOMAIN', 'HOSTNAME', 'WEBSITE')")) {
      const orgId = params[0];
      const rows = state.assets.filter(
        (a) =>
          a.organization_id === orgId &&
          a.status !== "archived" &&
          ["DOMAIN", "HOSTNAME", "WEBSITE"].includes(a.type)
      );
      return { rows, rowCount: rows.length };
    }

    if (s.includes("FROM assets WHERE id = $1 AND organization_id = $2")) {
      const id = params[0];
      const orgId = params[1];
      const rows = state.assets.filter((a) => a.id === id && a.organization_id === orgId);
      return { rows, rowCount: rows.length };
    }

    if (
      s.includes("FROM assets") &&
      s.includes("lower(hostname)") &&
      s.includes("status <> 'archived'")
    ) {
      const orgId = params[0];
      const hostname = String(params[1]).toLowerCase();
      const type = params[2];
      const rows = state.assets.filter(
        (a) =>
          a.organization_id === orgId &&
          String(a.hostname || "").toLowerCase() === hostname &&
          a.type === type &&
          a.status !== "archived"
      );
      return { rows, rowCount: rows.length };
    }

    if (s.includes("INSERT INTO assets")) {
      const row = {
        id: nextAssetId++,
        organization_id: params[0],
        parent_asset_id: null,
        type: params[1],
        name: params[2],
        hostname: params[3],
        address: null,
        environment: "production",
        status: "active",
        kind: null,
        is_primary: false,
        metadata: {},
        last_observed_at: null,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (s.includes("last_observed_at, created_by") && params.length === 8) {
        row.kind = params[4];
        row.is_primary = Boolean(params[5]);
        row.metadata = typeof params[6] === "string" ? JSON.parse(params[6]) : params[6];
        row.last_observed_at = new Date().toISOString();
        row.created_by = params[7];
      } else {
        row.address = params[4] ?? null;
        row.environment = params[5] || "production";
        row.kind = params[6] ?? null;
        row.is_primary = Boolean(params[7]);
        row.metadata =
          typeof params[8] === "string" ? JSON.parse(params[8] || "{}") : params[8] || {};
        row.created_by = params[9];
      }

      state.assets.push(row);
      state.inserts.push({ table: "assets", row, params });
      return { rows: [row], rowCount: 1 };
    }

    if (s.includes("UPDATE assets SET") && s.includes("status = 'archived'")) {
      const id = params[0];
      const orgId = params[1];
      const row = state.assets.find(
        (a) => a.id === id && a.organization_id === orgId && a.status !== "archived"
      );
      if (!row) return { rows: [], rowCount: 0 };
      row.status = "archived";
      row.updated_at = new Date().toISOString();
      return { rows: [{ id: row.id }], rowCount: 1 };
    }

    if (s.includes("UPDATE assets SET")) {
      const id = params[params.length - 2];
      const orgId = params[params.length - 1];
      const row = state.assets.find((a) => a.id === id && a.organization_id === orgId);
      if (!row) return { rows: [], rowCount: 0 };
      if (s.includes("name = $1")) {
        row.name = params[0];
        row.hostname = params[1];
        row.address = params[2];
        row.environment = params[3];
        row.status = params[4];
        row.kind = params[5];
        row.is_primary = params[6];
        row.metadata = typeof params[7] === "string" ? JSON.parse(params[7]) : params[7];
      } else if (s.includes("metadata = $1")) {
        row.metadata = typeof params[0] === "string" ? JSON.parse(params[0]) : params[0];
        row.kind = params[1];
        row.is_primary = params[2];
        row.last_observed_at = new Date().toISOString();
      }
      row.updated_at = new Date().toISOString();
      return { rows: [row], rowCount: 1 };
    }

    if (s.includes("FROM tls_certificates c") && s.includes("WHERE c.organization_id = $1")) {
      const orgId = params[0];
      const rows = state.tls_certificates
        .filter((c) => c.organization_id === orgId)
        .map((c) => {
          const asset = state.assets.find((a) => a.id === c.asset_id);
          return {
            ...c,
            asset_hostname: asset?.hostname || null,
            asset_name: asset?.name || null,
            asset_type: asset?.type || null
          };
        });
      return { rows, rowCount: rows.length };
    }

    if (
      s.includes("FROM tls_certificates c") &&
      s.includes("WHERE c.id = $1 AND c.organization_id = $2")
    ) {
      const id = params[0];
      const orgId = params[1];
      const c = state.tls_certificates.find((x) => x.id === id && x.organization_id === orgId);
      if (!c) return { rows: [], rowCount: 0 };
      const asset = state.assets.find((a) => a.id === c.asset_id);
      return {
        rows: [
          {
            ...c,
            asset_hostname: asset?.hostname || null,
            asset_name: asset?.name || null
          }
        ],
        rowCount: 1
      };
    }

    if (s.includes("INSERT INTO tls_certificates")) {
      const row = {
        id: nextTlsId++,
        organization_id: params[0],
        asset_id: params[1],
        provider: params[2],
        serial: params[3],
        fingerprint_sha256: params[4],
        issuer: params[5],
        subject: params[6],
        not_before: params[7],
        not_after: params[8],
        sans: typeof params[9] === "string" ? JSON.parse(params[9]) : params[9],
        is_wildcard: Boolean(params[10]),
        auto_renew: params[11],
        renewal_method: params[12],
        last_observed_at: new Date().toISOString(),
        observation_status: params[13],
        hostname_match: params[14],
        metadata: typeof params[15] === "string" ? JSON.parse(params[15]) : params[15],
        created_by: params[16],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      state.tls_certificates.push(row);
      state.inserts.push({ table: "tls_certificates", row, params });
      return { rows: [row], rowCount: 1 };
    }

    // Phase 3 provisionMonitorsForAsset (no-op stubs — isolation is asset-scoped)
    if (s.includes("FROM monitors") && s.includes("organization_id") && s.includes("asset_id") && s.includes("type")) {
      return { rows: [], rowCount: 0 };
    }
    if (s.includes("INSERT INTO monitors")) {
      return { rows: [{ id: 1 }], rowCount: 1 };
    }

    throw new Error(`Unhandled SQL in fake pool: ${s.slice(0, 200)}`);
  }

  return { query, state };
}

function buildApp(pool, user) {
  const app = express();
  app.use(express.json({ limit: "512kb" }));
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

describe("Phase 2 — assets/TLS tenant isolation", () => {
  let pool;

  before(() => {
    pool = createFakePool();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it("1. Tenant A lists only assets A", async () => {
    const app = buildApp(pool, { id: USER_A, role: "cliente", email: "a@argos.test" });
    const res = await request(app, { method: "GET", path: "/api/client/assets" });
    assert.equal(res.status, 200);
    assert.equal(res.body.assets.length, 1);
    assert.equal(res.body.assets[0].hostname, "a.example");
    assert.ok(!JSON.stringify(res.body).includes("b.example"));
  });

  it("2. Tenant B does not see assets A", async () => {
    const app = buildApp(pool, { id: USER_B, role: "cliente", email: "b@argos.test" });
    const res = await request(app, { method: "GET", path: "/api/client/assets" });
    assert.equal(res.status, 200);
    assert.equal(res.body.assets.length, 1);
    assert.equal(res.body.assets[0].hostname, "b.example");
    assert.ok(!JSON.stringify(res.body).includes("a.example"));
  });

  it("3. A requests asset B by ID → 404", async () => {
    const app = buildApp(pool, { id: USER_A, role: "cliente" });
    const res = await request(app, { method: "GET", path: "/api/client/assets/502" });
    assert.equal(res.status, 404);
    assert.ok(!JSON.stringify(res.body).includes("tenant-b-only"));
  });

  it("4/5. create forces session organization_id; body org tampering ignored", async () => {
    const app = buildApp(pool, { id: USER_A, role: "cliente" });
    const res = await request(app, {
      method: "POST",
      path: "/api/client/assets",
      body: {
        type: "HOSTNAME",
        name: "www.a.example",
        hostname: "www.a.example",
        organization_id: ORG_B,
        organizationId: ORG_B
      }
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.asset.organizationId, ORG_A);
    assert.equal(res.body.asset.hostname, "www.a.example");
    const inserted = pool.state.inserts.filter((i) => i.table === "assets").at(-1);
    assert.equal(inserted.row.organization_id, ORG_A);
  });

  it("6. update cross-tenant → 404", async () => {
    const app = buildApp(pool, { id: USER_A, role: "cliente" });
    const res = await request(app, {
      method: "PATCH",
      path: "/api/client/assets/502",
      body: { name: "hacked" }
    });
    assert.equal(res.status, 404);
    const b = pool.state.assets.find((a) => a.id === 502);
    assert.equal(b.name, "b.example");
  });

  it("7. delete cross-tenant → 404", async () => {
    const app = buildApp(pool, { id: USER_A, role: "cliente" });
    const res = await request(app, { method: "DELETE", path: "/api/client/assets/502" });
    assert.equal(res.status, 404);
    assert.equal(pool.state.assets.find((a) => a.id === 502).status, "active");
  });

  it("8. domain discovery associates to session tenant", async () => {
    mock.method(hostnameSecurity, "discoverHostname", async () => ({
      ok: true,
      hostname: "pilot.example.com",
      dns: { a: ["93.184.216.34"], aaaa: [], cname: [], ns: [], mx: [] },
      tls: {
        ok: true,
        provider: "Let's Encrypt",
        serial: "1",
        fingerprintSha256: "abc",
        issuer: "O=Let's Encrypt",
        subject: "CN=pilot.example.com",
        notBefore: new Date("2026-01-01"),
        notAfter: new Date("2026-12-01"),
        sans: ["pilot.example.com", "*.pilot.example.com"],
        isWildcard: true,
        hostnameMatch: true,
        chainError: false,
        observationStatus: "VALID",
        daysRemaining: 90,
        riskHint: null,
        autoRenew: true,
        renewalMethod: "acme"
      },
      observedAt: new Date().toISOString()
    }));

    const app = buildApp(pool, { id: USER_A, role: "cliente" });
    const res = await request(app, {
      method: "POST",
      path: "/api/client/domains/discover",
      body: { hostname: "pilot.example.com", organization_id: ORG_B }
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.asset.organizationId, ORG_A);
    assert.equal(res.body.asset.hostname, "pilot.example.com");
    assert.equal(res.body.certificate.organizationId, ORG_A);
    assert.ok(res.body.certificate.isWildcard);
  });

  it("9. TLS certificate of B not visible to A", async () => {
    const app = buildApp(pool, { id: USER_A, role: "cliente" });
    const list = await request(app, { method: "GET", path: "/api/client/tls" });
    assert.equal(list.status, 200);
    assert.ok(list.body.certificates.every((c) => c.organizationId === ORG_A));
    assert.ok(!JSON.stringify(list.body).includes("DigiCert"));

    const get = await request(app, { method: "GET", path: "/api/client/tls/802" });
    assert.equal(get.status, 404);
  });

  it("15. private key never serialized on TLS list", async () => {
    const app = buildApp(pool, { id: USER_A, role: "cliente" });
    const res = await request(app, { method: "GET", path: "/api/client/tls" });
    assert.equal(res.status, 200);
    const json = JSON.stringify(res.body);
    assert.ok(!json.includes("SHOULD_NEVER_LEAVE_DB"));
    assert.ok(!json.includes("private_key"));
  });

  it("16. customer role can access own assets", async () => {
    const app = buildApp(pool, { id: USER_A, role: "cliente" });
    const res = await request(app, { method: "GET", path: "/api/client/domains" });
    assert.equal(res.status, 200);
    assert.ok(res.body.domains.length >= 1);
  });

  it("17. internal/admin membership still scoped to session org (no cross-tenant)", async () => {
    const app = buildApp(pool, { id: USER_ADMIN, role: "admin", email: "admin@argos.test" });
    const res = await request(app, { method: "GET", path: "/api/client/assets" });
    assert.equal(res.status, 200);
    assert.ok(res.body.assets.every((a) => a.organizationId === ORG_A));
    const cross = await request(app, { method: "GET", path: "/api/client/assets/502" });
    assert.equal(cross.status, 404);
  });

  it("SSRF: discovery rejects localhost / private hostnames", async () => {
    const app = buildApp(pool, { id: USER_A, role: "cliente" });
    for (const hostname of ["localhost", "127.0.0.1", "169.254.169.254", "http://10.0.0.1"]) {
      const res = await request(app, {
        method: "POST",
        path: "/api/client/domains/discover",
        body: { hostname }
      });
      assert.equal(res.status, 400, `expected 400 for ${hostname}`);
      assert.ok(
        res.body.code === "INVALID_HOSTNAME" ||
          res.body.code === "SSRF_BLOCKED" ||
          res.body.code === "DISCOVERY_FAILED"
      );
    }
  });
});
