/**
 * Tenant isolation unit tests (Phase 0).
 * Run: node --test backend/lib/ensureOrganizations.test.js backend/middleware/tenantContext.test.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  resolveActiveOrganization,
  assertResourceInTenant,
  isGlobalArgosAdmin,
  slugifyBase
} = require("./ensureOrganizations");

describe("resolveActiveOrganization — never trust foreign org ids", () => {
  const memberships = [
    {
      organization_id: 10,
      org_role: "org_owner",
      slug: "udic-1",
      name: "UDIC",
      status: "active"
    },
    {
      organization_id: 20,
      org_role: "org_member",
      slug: "flores-2",
      name: "Flores Gali",
      status: "active"
    }
  ];

  it("defaults to primary membership when no request", () => {
    const t = resolveActiveOrganization(memberships, null);
    assert.equal(t.id, 10);
    assert.equal(t.orgRole, "org_owner");
  });

  it("allows switching only to a membership org", () => {
    const t = resolveActiveOrganization(memberships, 20);
    assert.equal(t.id, 20);
  });

  it("ignores manipulated org id from another tenant", () => {
    const t = resolveActiveOrganization(memberships, 999);
    assert.equal(t.id, 10, "falls back to primary; does not adopt foreign id");
  });

  it("returns null when user has no membership", () => {
    assert.equal(resolveActiveOrganization([], 10), null);
    assert.equal(resolveActiveOrganization(null, 10), null);
  });

  it("ignores inactive / suspended memberships", () => {
    const mixed = [
      {
        organization_id: 10,
        org_role: "org_owner",
        slug: "dead",
        name: "Dead",
        status: "suspended"
      },
      {
        organization_id: 20,
        org_role: "org_member",
        slug: "live",
        name: "Live",
        status: "active"
      }
    ];
    const t = resolveActiveOrganization(mixed, 10);
    assert.equal(t.id, 20, "requested inactive id must not win");
    assert.equal(resolveActiveOrganization([mixed[0]], null), null);
  });
});

describe("assertResourceInTenant — IDOR protection", () => {
  it("Tenant A cannot read Tenant B resource", () => {
    const r = assertResourceInTenant(20, 10);
    assert.equal(r.ok, false);
    assert.equal(r.status, 404);
  });

  it("Tenant A can read own resource", () => {
    const r = assertResourceInTenant(10, 10);
    assert.equal(r.ok, true);
  });

  it("missing tenant context fails closed", () => {
    const r = assertResourceInTenant(10, null);
    assert.equal(r.ok, false);
    assert.equal(r.status, 403);
  });

  it("null resource org fails closed", () => {
    const r = assertResourceInTenant(null, 10);
    assert.equal(r.ok, false);
    assert.equal(r.status, 404);
  });
});

describe("role separation — org admin ≠ ARGOS admin", () => {
  it("cliente / org roles are not global admins", () => {
    assert.equal(isGlobalArgosAdmin("cliente"), false);
    assert.equal(isGlobalArgosAdmin("cliente_verificado"), false);
    assert.equal(isGlobalArgosAdmin("org_admin"), false);
  });

  it("admin and super_admin are global ARGOS roles", () => {
    assert.equal(isGlobalArgosAdmin("admin"), true);
    assert.equal(isGlobalArgosAdmin("super_admin"), true);
  });
});

describe("slugifyBase", () => {
  it("normalizes company names", () => {
    assert.equal(slugifyBase("Flores Galí"), "flores-gali");
    assert.equal(slugifyBase(""), "org");
  });
});
