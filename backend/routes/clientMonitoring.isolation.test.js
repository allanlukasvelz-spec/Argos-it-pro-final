/**
 * Phase 3 — monitoring tenant isolation + IDOR.
 * Run: node --test backend/routes/clientMonitoring.isolation.test.js
 */
const { describe, it, before, after } = require("node:test");
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
      ]
    },
    assets: [
      {
        id: 501,
        organization_id: ORG_A,
        type: "DOMAIN",
        name: "a.example",
        hostname: "a.example",
        status: "active"
      },
      {
        id: 502,
        organization_id: ORG_B,
        type: "DOMAIN",
        name: "b.example",
        hostname: "b.example",
        status: "active"
      }
    ],
    monitors: [
      {
        id: 701,
        organization_id: ORG_A,
        asset_id: 501,
        type: "HTTP",
        name: "HTTP · a.example",
        status: "ACTIVE",
        enabled: true,
        interval_seconds: 60,
        timeout_ms: 8000,
        config: {},
        last_check_at: null,
        next_check_at: null,
        created_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-08-01T00:00:00.000Z"
      },
      {
        id: 702,
        organization_id: ORG_B,
        asset_id: 502,
        type: "HTTP",
        name: "HTTP · b.example",
        status: "ACTIVE",
        enabled: true,
        interval_seconds: 60,
        timeout_ms: 8000,
        config: {},
        last_check_at: null,
        next_check_at: null,
        created_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-08-01T00:00:00.000Z"
      }
    ],
    observations: [],
    alerts: [
      {
        id: 801,
        organization_id: ORG_A,
        asset_id: 501,
        monitor_id: 701,
        severity: "WARNING",
        state: "OPEN",
        fingerprint: "org:10|mon:701|ec:TLS_EXPIRING",
        title: "TLS por caducar: a.example",
        reason: "TLS_EXPIRING",
        evidence: {},
        observation_id: null,
        count: 1,
        opened_at: "2026-08-01T00:00:00.000Z",
        last_seen_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-08-01T00:00:00.000Z",
        resolved_at: null
      },
      {
        id: 802,
        organization_id: ORG_B,
        asset_id: 502,
        monitor_id: 702,
        severity: "CRITICAL",
        state: "OPEN",
        fingerprint: "org:20|mon:702|ec:HTTP_5XX",
        title: "HTTP 5xx: b.example",
        reason: "HTTP_5XX",
        evidence: { secret: "tenant-b-only" },
        observation_id: null,
        count: 3,
        opened_at: "2026-08-01T00:00:00.000Z",
        last_seen_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-08-01T00:00:00.000Z",
        resolved_at: null
      }
    ],
    incidents: [
      {
        id: 901,
        organization_id: ORG_A,
        asset_id: 501,
        title: "Incidente A",
        summary: "demo",
        severity: "CRITICAL",
        state: "OPEN",
        correlation_key: "asset:501|ec:HTTP_5XX",
        owner_user_id: null,
        opened_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-08-01T00:00:00.000Z",
        resolved_at: null
      },
      {
        id: 902,
        organization_id: ORG_B,
        asset_id: 502,
        title: "Incidente B",
        summary: "secret-b",
        severity: "CRITICAL",
        state: "OPEN",
        correlation_key: "asset:502|ec:HTTP_5XX",
        owner_user_id: null,
        opened_at: "2026-08-01T00:00:00.000Z",
        updated_at: "2026-08-01T00:00:00.000Z",
        resolved_at: null
      }
    ],
    incident_events: [
      {
        id: 1,
        incident_id: 902,
        organization_id: ORG_B,
        kind: "ALERT_LINKED",
        payload: { alertId: 802 },
        actor_user_id: null,
        created_at: "2026-08-01T00:00:00.000Z"
      }
    ]
  };

  async function query(sql, params = []) {
    const s = String(sql).replace(/\s+/g, " ");

    if (s.includes("FROM organization_members") || s.includes("JOIN organizations")) {
      const userId = params[0];
      const rows = (state.memberships[userId] || []).map((m) => ({
        organization_id: m.organization_id,
        org_role: m.org_role,
        slug: m.slug,
        name: m.name,
        status: m.status
      }));
      return { rows };
    }

    if (s.includes("FROM users WHERE id")) {
      return { rows: state.users.filter((u) => u.id === params[0]) };
    }

    if (s.includes("FROM assets") && s.includes("status = 'active'")) {
      const orgId = params[0];
      return { rows: state.assets.filter((a) => a.organization_id === orgId && a.status === "active") };
    }

    if (s.includes("FROM assets WHERE id") && s.includes("organization_id")) {
      return {
        rows: state.assets.filter((a) => a.id === params[0] && a.organization_id === params[1])
      };
    }

    if (s.includes("FROM monitors") && s.includes("WHERE id") && s.includes("organization_id")) {
      return {
        rows: state.monitors.filter((m) => m.id === params[0] && m.organization_id === params[1])
      };
    }

    if (s.includes("FROM monitors") && s.includes("organization_id = $1") && s.includes("asset_id")) {
      // loadAssetHealth or list with asset filter
      if (params.length >= 2 && s.includes("asset_id = $2") && s.includes("enabled = true")) {
        return {
          rows: state.monitors.filter(
            (m) => m.organization_id === params[0] && m.asset_id === params[1] && m.enabled
          )
        };
      }
      if (params.length >= 2 && s.includes("asset_id = $2")) {
        return {
          rows: state.monitors.filter(
            (m) => m.organization_id === params[0] && m.asset_id === params[1]
          )
        };
      }
    }

    if (s.includes("COUNT(*)") && s.includes("FROM monitors")) {
      const orgId = params[0];
      return {
        rows: [{ n: state.monitors.filter((m) => m.organization_id === orgId && m.enabled).length }]
      };
    }

    if (s.includes("FROM monitors WHERE organization_id")) {
      return { rows: state.monitors.filter((m) => m.organization_id === params[0]) };
    }

    if (s.includes("FROM observations")) {
      return { rows: [] };
    }

    if (s.includes("FROM alerts") && s.includes("WHERE id")) {
      return {
        rows: state.alerts.filter((a) => a.id === params[0] && a.organization_id === params[1])
      };
    }

    if (s.includes("COUNT(*)") && s.includes("FROM alerts")) {
      const orgId = params[0];
      return {
        rows: [
          {
            n: state.alerts.filter(
              (a) => a.organization_id === orgId && ["OPEN", "ACKNOWLEDGED"].includes(a.state)
            ).length
          }
        ]
      };
    }

    if (s.includes("FROM alerts") && s.includes("severity = 'CRITICAL'")) {
      return {
        rows: state.alerts.filter(
          (a) =>
            a.organization_id === params[0] &&
            a.asset_id === params[1] &&
            a.severity === "CRITICAL" &&
            ["OPEN", "ACKNOWLEDGED"].includes(a.state)
        ).slice(0, 1)
      };
    }

    if (s.includes("FROM alerts WHERE organization_id")) {
      return { rows: state.alerts.filter((a) => a.organization_id === params[0]) };
    }

    if (s.includes("FROM incidents") && s.includes("WHERE id")) {
      return {
        rows: state.incidents.filter((i) => i.id === params[0] && i.organization_id === params[1])
      };
    }

    if (s.includes("FROM incident_events")) {
      return {
        rows: state.incident_events.filter(
          (e) => e.incident_id === params[0] && e.organization_id === params[1]
        )
      };
    }

    if (s.includes("COUNT(*)") && s.includes("FROM incidents")) {
      const orgId = params[0];
      return {
        rows: [
          {
            n: state.incidents.filter(
              (i) =>
                i.organization_id === orgId &&
                ["OPEN", "INVESTIGATING", "MITIGATED"].includes(i.state)
            ).length
          }
        ]
      };
    }

    if (s.includes("FROM incidents WHERE organization_id")) {
      return { rows: state.incidents.filter((i) => i.organization_id === params[0]) };
    }

    // portal extras used by createClientRouter
    if (s.includes("FROM form_submissions") || s.includes("FROM activity_logs") || s.includes("FROM client_services") || s.includes("FROM website_audits") || s.includes("FROM client_improvements") || s.includes("FROM client_messages") || s.includes("FROM client_diagnostics")) {
      return { rows: [] };
    }

    throw new Error(`Unhandled SQL in fake pool: ${s.slice(0, 160)}`);
  }

  return { query, _state: state };
}

function startServer(pool, userId) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: userId, role: "cliente", email: "t@argos.test" };
    next();
  });
  app.use("/api/client", resolveTenantContext(pool), requireTenant(), createClientRouter(pool));
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

async function request(port, path, headers = {}) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, { headers });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

describe("Phase 3 monitoring isolation", () => {
  /** @type {{ server: import('http').Server, port: number }} */
  let a;
  /** @type {{ server: import('http').Server, port: number }} */
  let b;
  let pool;

  before(async () => {
    pool = createFakePool();
    a = await startServer(pool, USER_A);
    b = await startServer(pool, USER_B);
  });

  after(async () => {
    await new Promise((resolve) => a.server.close(resolve));
    await new Promise((resolve) => b.server.close(resolve));
  });

  it("lists only tenant monitors", async () => {
    const ra = await request(a.port, "/api/client/monitors");
    assert.equal(ra.status, 200);
    assert.equal(ra.body.monitors.length, 1);
    assert.equal(ra.body.monitors[0].id, 701);

    const rb = await request(b.port, "/api/client/monitors");
    assert.equal(rb.status, 200);
    assert.equal(rb.body.monitors[0].id, 702);
  });

  it("cross-tenant monitor id → 404", async () => {
    const r = await request(a.port, "/api/client/monitors/702");
    assert.equal(r.status, 404);
  });

  it("cross-tenant alert id → 404", async () => {
    const r = await request(a.port, "/api/client/alerts/802");
    assert.equal(r.status, 404);
  });

  it("cross-tenant incident id → 404", async () => {
    const r = await request(a.port, "/api/client/incidents/902");
    assert.equal(r.status, 404);
  });

  it("header org spoof to other tenant is ignored (membership)", async () => {
    const r = await request(a.port, "/api/client/alerts", {
      "X-Argos-Organization-Id": String(ORG_B)
    });
    assert.equal(r.status, 200);
    assert.equal(r.body.alerts.length, 1);
    assert.equal(r.body.alerts[0].id, 801);
  });

  it("query organization_id tampering does not leak", async () => {
    const r = await request(a.port, `/api/client/incidents?organization_id=${ORG_B}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.incidents.length, 1);
    assert.equal(r.body.incidents[0].id, 901);
  });

  it("monitoring summary stays UNKNOWN without fresh observations", async () => {
    const r = await request(a.port, "/api/client/monitoring");
    assert.equal(r.status, 200);
    assert.equal(r.body.overall, "UNKNOWN");
    assert.ok(r.body.disclaimer.includes("UNKNOWN"));
  });

  it("own alert readable", async () => {
    const r = await request(a.port, "/api/client/alerts/801");
    assert.equal(r.status, 200);
    assert.equal(r.body.alert.id, 801);
  });
});
