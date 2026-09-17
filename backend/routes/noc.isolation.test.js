/**
 * Phase 5 — NOC API pagination + cross-tenant visibility for authorized staff.
 */
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const requireNocAccess = require("../middleware/requireNocAccess");
const createNocRouter = require("./noc");

const ORG_A = 10;
const ORG_B = 20;

function createFakePool() {
  const state = {
    orgs: [
      { id: ORG_A, slug: "tenant-a", name: "Tenant A", status: "active", created_at: "2026-01-01", updated_at: "2026-01-01" },
      { id: ORG_B, slug: "tenant-b", name: "Tenant B", status: "active", created_at: "2026-01-01", updated_at: "2026-01-01" }
    ],
    assets: [
      { id: 1, organization_id: ORG_A, type: "DOMAIN", name: "a.example", hostname: "a.example", status: "active", environment: "production", last_observed_at: null, created_at: "2026-01-01" },
      { id: 2, organization_id: ORG_B, type: "DOMAIN", name: "b.example", hostname: "b.example", status: "active", environment: "production", last_observed_at: null, created_at: "2026-01-01" }
    ],
    monitors: [
      { id: 1, organization_id: ORG_A, asset_id: 1, type: "HTTP", name: "HTTP · a", status: "ACTIVE", enabled: true, interval_seconds: 60, last_check_at: null, next_check_at: null },
      { id: 2, organization_id: ORG_B, asset_id: 2, type: "HTTP", name: "HTTP · b", status: "ACTIVE", enabled: true, interval_seconds: 60, last_check_at: null, next_check_at: null }
    ],
    alerts: [
      {
        id: 1,
        organization_id: ORG_A,
        asset_id: 1,
        monitor_id: 1,
        severity: "WARNING",
        state: "OPEN",
        fingerprint: "fp-a",
        title: "Alert A",
        reason: "TLS_EXPIRING",
        count: 1,
        opened_at: "2026-01-01",
        last_seen_at: "2026-01-01",
        evidence: { token: "secret-should-strip", statusCode: 200 }
      },
      {
        id: 2,
        organization_id: ORG_B,
        asset_id: 2,
        monitor_id: 2,
        severity: "CRITICAL",
        state: "OPEN",
        fingerprint: "fp-b",
        title: "Alert B",
        reason: "HTTP_5XX",
        count: 2,
        opened_at: "2026-01-01",
        last_seen_at: "2026-01-01",
        evidence: {}
      }
    ],
    tls: [
      {
        id: 1,
        organization_id: ORG_A,
        asset_id: 1,
        provider: "LE",
        serial: "1",
        fingerprint_sha256: "abc",
        issuer: "LE",
        subject: "CN=a.example",
        not_before: "2026-01-01",
        not_after: "2027-01-01",
        sans: ["a.example"],
        is_wildcard: false,
        auto_renew: true,
        renewal_method: null,
        last_observed_at: "2026-01-01",
        observation_status: "VALID",
        hostname_match: true,
        metadata: {},
        private_key: "SHOULD_NEVER_APPEAR",
        created_at: "2026-01-01",
        updated_at: "2026-01-01"
      }
    ]
  };

  async function query(sql, params = []) {
    const s = String(sql).replace(/\s+/g, " ");

    if (s.includes("SELECT 1") && !s.includes("FROM")) {
      return { rows: [{ "?column?": 1 }] };
    }
    if (s.includes("SELECT COUNT(*)::int AS n FROM organizations WHERE status = 'active'")) {
      return { rows: [{ n: state.orgs.filter((o) => o.status === "active").length }] };
    }
    if (s.includes("SELECT COUNT(*)::int AS n FROM organizations") && !s.includes("organization_members")) {
      return { rows: [{ n: state.orgs.length }] };
    }
    if (s.includes("SELECT COUNT(*)::int AS n FROM assets")) {
      return { rows: [{ n: state.assets.filter((a) => a.status === "active").length }] };
    }
    if (s.includes("SELECT COUNT(*)::int AS n FROM monitors")) {
      return { rows: [{ n: state.monitors.filter((m) => m.enabled).length }] };
    }
    if (s.includes("SELECT COUNT(*)::int AS n FROM alerts")) {
      if (s.includes("CRITICAL")) {
        return {
          rows: [
            {
              n: state.alerts.filter(
                (a) => a.severity === "CRITICAL" && ["OPEN", "ACKNOWLEDGED"].includes(a.state)
              ).length
            }
          ]
        };
      }
      if (s.includes("WARNING")) {
        return {
          rows: [
            {
              n: state.alerts.filter(
                (a) => a.severity === "WARNING" && ["OPEN", "ACKNOWLEDGED"].includes(a.state)
              ).length
            }
          ]
        };
      }
      return {
        rows: [
          { n: state.alerts.filter((a) => ["OPEN", "ACKNOWLEDGED"].includes(a.state)).length }
        ]
      };
    }
    if (s.includes("SELECT COUNT(*)::int AS n FROM incidents")) {
      return { rows: [{ n: 0 }] };
    }
    if (s.includes("FROM organizations o") && (s.includes("member_count") || s.includes("asset_count"))) {
      const limit = params[0] ?? 50;
      const offset = params[1] ?? 0;
      return {
        rows: state.orgs.slice(offset, offset + limit).map((o) => ({
          ...o,
          member_count: 1,
          asset_count: state.assets.filter((a) => a.organization_id === o.id).length,
          monitor_count: state.monitors.filter((m) => m.organization_id === o.id).length,
          open_alerts: state.alerts.filter(
            (a) => a.organization_id === o.id && a.state === "OPEN"
          ).length,
          open_incidents: 0
        }))
      };
    }
    if (s.includes("FROM assets a") && s.includes("status = 'active'") && s.includes("LIMIT") && !s.includes("member_count")) {
      // summary sample or health
      if (s.includes("JOIN organizations")) {
        return {
          rows: state.assets
            .filter((a) => a.status === "active")
            .map((a) => ({
              ...a,
              organization_name: state.orgs.find((o) => o.id === a.organization_id)?.name
            }))
        };
      }
      return { rows: state.assets.filter((a) => a.status === "active") };
    }
    if (s.includes("FROM monitors") && s.includes("enabled = true") && s.includes("asset_id")) {
      return {
        rows: state.monitors.filter(
          (m) => m.organization_id === params[0] && m.asset_id === params[1] && m.enabled
        )
      };
    }
    if (s.includes("FROM observations")) {
      return { rows: [] };
    }
    if (s.includes("FROM alerts") && s.includes("severity = 'CRITICAL'") && s.includes("LIMIT 1")) {
      return { rows: [] };
    }
    if (s.includes("FROM alerts a") && s.includes("JOIN organizations")) {
      let rows = state.alerts.slice();
      // detect org filter as first param when present
      if (s.includes("a.organization_id = $1") && params[0] != null && Number.isInteger(params[0])) {
        rows = rows.filter((a) => a.organization_id === params[0]);
      }
      if (s.includes("OPEN") && s.includes("ACKNOWLEDGED") && !s.includes("a.state = $")) {
        rows = rows.filter((a) => ["OPEN", "ACKNOWLEDGED"].includes(a.state));
      }
      const limit = typeof params[params.length - 2] === "number" ? params[params.length - 2] : 50;
      const offset = typeof params[params.length - 1] === "number" ? params[params.length - 1] : 0;
      rows = rows.slice(offset, offset + limit);
      return {
        rows: rows.map((a) => ({
          ...a,
          organization_name: state.orgs.find((o) => o.id === a.organization_id)?.name,
          organization_slug: state.orgs.find((o) => o.id === a.organization_id)?.slug,
          asset_hostname: state.assets.find((x) => x.id === a.asset_id)?.hostname
        }))
      };
    }
    if (s.includes("FROM organizations WHERE id")) {
      return { rows: state.orgs.filter((o) => o.id === params[0]) };
    }
    if (s.includes("FROM assets WHERE organization_id")) {
      return {
        rows: state.assets.filter((a) => a.organization_id === params[0]).slice(0, 100)
      };
    }
    if (s.includes("FROM assets a") && s.includes("JOIN organizations o")) {
      const limit = params[params.length - 2];
      const offset = params[params.length - 1];
      let rows = state.assets.filter((a) => a.status === "active");
      if (params.length >= 3) {
        rows = rows.filter((a) => a.organization_id === params[0]);
      }
      return {
        rows: rows.slice(offset, offset + limit).map((a) => ({
          ...a,
          organization_name: state.orgs.find((o) => o.id === a.organization_id)?.name,
          organization_slug: state.orgs.find((o) => o.id === a.organization_id)?.slug
        }))
      };
    }
    if (s.includes("FROM monitors m")) {
      const limit = params[params.length - 2];
      const offset = params[params.length - 1];
      return {
        rows: state.monitors.slice(offset, offset + limit).map((m) => ({
          ...m,
          organization_name: state.orgs.find((o) => o.id === m.organization_id)?.name,
          organization_slug: state.orgs.find((o) => o.id === m.organization_id)?.slug,
          asset_hostname: state.assets.find((a) => a.id === m.asset_id)?.hostname,
          asset_name: state.assets.find((a) => a.id === m.asset_id)?.name
        }))
      };
    }
    if (s.includes("FROM tls_certificates")) {
      return {
        rows: state.tls.map((t) => ({
          ...t,
          organization_name: "Tenant A",
          organization_slug: "tenant-a",
          asset_hostname: "a.example",
          asset_name: "a.example",
          asset_type: "DOMAIN"
        }))
      };
    }
    if (s.includes("FROM activity_logs") || s.includes("FROM security_logs")) {
      return { rows: [] };
    }
    if (s.includes("FROM form_submissions")) {
      return { rows: [] };
    }
    if (s.includes("FROM incidents")) {
      return { rows: [] };
    }

    throw new Error(`Unhandled SQL: ${s.slice(0, 160)}`);
  }

  return { query, _state: state };
}

function startServer(pool) {
  const app = express();
  app.use((req, _res, next) => {
    req.user = { id: 99, role: "admin", email: "admin@argos.test" };
    next();
  });
  app.use("/api/noc", requireNocAccess, createNocRouter(pool));
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
  });
}

async function get(port, path) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

describe("NOC API cross-tenant + pagination", () => {
  let server;
  let port;
  let pool;

  before(async () => {
    pool = createFakePool();
    ({ server, port } = await startServer(pool));
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("authorized admin sees orgs from both tenants", async () => {
    const r = await get(port, "/api/noc/organizations?limit=50&offset=0");
    assert.equal(r.status, 200);
    assert.equal(r.body.organizations.length, 2);
    const ids = r.body.organizations.map((o) => o.id).sort();
    assert.deepEqual(ids, [ORG_A, ORG_B]);
  });

  it("pagination caps at MAX_LIMIT 100", async () => {
    const r = await get(port, "/api/noc/assets?limit=500");
    assert.equal(r.status, 200);
    assert.equal(r.body.pagination.limit, 100);
  });

  it("alerts include both tenants; evidence token redacted", async () => {
    const r = await get(port, "/api/noc/alerts?limit=50");
    assert.equal(r.status, 200);
    assert.ok(r.body.alerts.length >= 2);
    const a = r.body.alerts.find((x) => x.id === 1);
    assert.ok(a);
    assert.equal(a.evidenceSummary?.token, undefined);
    assert.equal(a.evidenceSummary?.statusCode, 200);
  });

  it("TLS never exposes private_key", async () => {
    const r = await get(port, "/api/noc/tls");
    assert.equal(r.status, 200);
    const json = JSON.stringify(r.body);
    assert.equal(json.includes("SHOULD_NEVER_APPEAR"), false);
    assert.equal(json.includes("private_key"), false);
    assert.equal(json.includes("privateKey"), false);
  });

  it("/me returns allowed for admin", async () => {
    const r = await get(port, "/api/noc/me");
    assert.equal(r.status, 200);
    assert.equal(r.body.allowed, true);
    assert.equal(r.body.role, "admin");
  });

  it("summary disclaimer forbids false healthy claims", async () => {
    const r = await get(port, "/api/noc/summary");
    assert.equal(r.status, 200);
    assert.match(r.body.disclaimer, /UNKNOWN/);
  });
});
