/**
 * Tenant middleware isolation tests (Phase 0).
 * Run: node --test backend/middleware/tenantContext.test.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { resolveTenantContext, requireTenant } = require("./tenantContext");

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

function mockPool(membershipsByUser) {
  return {
    async query(sql, params) {
      if (String(sql).includes("FROM organization_members")) {
        const userId = params[0];
        return { rows: membershipsByUser[userId] || [], rowCount: (membershipsByUser[userId] || []).length };
      }
      return { rows: [], rowCount: 0 };
    }
  };
}

describe("resolveTenantContext", () => {
  it("rejects unauthenticated request", async () => {
    const mw = await resolveTenantContext(mockPool({}));
    const req = { user: null, headers: {}, query: {} };
    const res = mockRes();
    let next = false;
    await mw(req, res, () => {
      next = true;
    });
    assert.equal(next, false);
    assert.equal(res.statusCode, 401);
  });

  it("blocks user without membership (no accidental access)", async () => {
    const mw = await resolveTenantContext(mockPool({}));
    const req = { user: { id: 1, role: "cliente" }, headers: {}, query: {} };
    const res = mockRes();
    let next = false;
    await mw(req, res, () => {
      next = true;
    });
    assert.equal(next, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, "NO_ORGANIZATION_MEMBERSHIP");
  });

  it("Tenant A header cannot become Tenant B", async () => {
    const mw = await resolveTenantContext(
      mockPool({
        1: [
          {
            organization_id: 10,
            org_role: "org_owner",
            slug: "tenant-a",
            name: "A",
            status: "active"
          }
        ]
      })
    );
    const req = {
      user: { id: 1, role: "cliente" },
      headers: { "x-argos-organization-id": "99" },
      query: {}
    };
    const res = mockRes();
    let next = false;
    await mw(req, res, () => {
      next = true;
    });
    assert.equal(next, true);
    assert.equal(req.tenant.id, 10);
  });

  it("org admin is not treated as global ARGOS admin", async () => {
    const mw = await resolveTenantContext(
      mockPool({
        2: [
          {
            organization_id: 20,
            org_role: "org_admin",
            slug: "tenant-b",
            name: "B",
            status: "active"
          }
        ]
      })
    );
    const req = { user: { id: 2, role: "cliente" }, headers: {}, query: {} };
    const res = mockRes();
    await mw(req, res, () => {});
    assert.equal(req.isGlobalArgosAdmin, false);
    assert.equal(req.tenant.orgRole, "org_admin");
  });

  it("global ARGOS admin without membership may proceed (tenant null)", async () => {
    const mw = await resolveTenantContext(mockPool({}));
    const req = { user: { id: 9, role: "admin" }, headers: {}, query: {} };
    const res = mockRes();
    let next = false;
    await mw(req, res, () => {
      next = true;
    });
    assert.equal(next, true);
    assert.equal(req.isGlobalArgosAdmin, true);
    assert.equal(req.tenant, null);
  });
});

describe("requireTenant", () => {
  it("requires tenant for client routes", () => {
    const mw = requireTenant();
    const req = { tenant: null, isGlobalArgosAdmin: false };
    const res = mockRes();
    let next = false;
    mw(req, res, () => {
      next = true;
    });
    assert.equal(next, false);
    assert.equal(res.statusCode, 403);
  });

  it("allows tenant when present", () => {
    const mw = requireTenant();
    const req = { tenant: { id: 1 }, isGlobalArgosAdmin: false };
    const res = mockRes();
    let next = false;
    mw(req, res, () => {
      next = true;
    });
    assert.equal(next, true);
  });

  it("optional allowGlobalWithoutTenant for ARGOS admin ops", () => {
    const mw = requireTenant({ allowGlobalWithoutTenant: true });
    const req = { tenant: null, isGlobalArgosAdmin: true };
    const res = mockRes();
    let next = false;
    mw(req, res, () => {
      next = true;
    });
    assert.equal(next, true);
  });
});
