const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createMemoryStore } = require("./memoryStore");
const { createWebProjectService } = require("./service");
const { ERROR_CODES } = require("./constants");
const { WebProjectError } = require("./errors");
const {
  provisionWebProject,
  readProvisionInput,
  databaseUrlLooksLocal
} = require("./provision");

function createOrgPool({ orgs = [], members = [], users = [1, 2, 99] } = {}) {
  const state = {
    orgs: orgs.map((row) => ({ ...row })),
    members: members.map((row) => ({ ...row })),
    nextOrgId: orgs.reduce((max, row) => Math.max(max, row.id), 0) + 1
  };
  return {
    state,
    query: async (sql, params = []) => {
      const s = String(sql).replace(/\s+/g, " ").trim();
      if (s.includes("FROM users WHERE id")) {
        return { rows: users.includes(params[0]) ? [{ id: params[0] }] : [] };
      }
      if (s.includes("FROM organizations WHERE slug")) {
        return { rows: state.orgs.filter((row) => row.slug === params[0]) };
      }
      if (s.includes("FROM organization_members WHERE organization_id") && s.includes("count")) {
        const n = state.members.filter((row) => row.organization_id === params[0]).length;
        return { rows: [{ n }] };
      }
      if (s.startsWith("INSERT INTO organizations")) {
        const org = {
          id: state.nextOrgId++,
          slug: params[0],
          name: params[1],
          status: "active"
        };
        state.orgs.push(org);
        return { rows: [org] };
      }
      if (s.startsWith("INSERT INTO organization_members")) {
        const exists = state.members.find(
          (row) => row.organization_id === params[0] && row.user_id === params[1]
        );
        if (!exists) {
          state.members.push({
            organization_id: params[0],
            user_id: params[1],
            org_role: "org_owner"
          });
        }
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
}

const baseInput = {
  ORG_SLUG: "acme",
  PROJECT_TITLE: "Renovación web Acme",
  WEBSITE_HOSTNAME: "www.example.com",
  PROJECT_TYPE: "improve",
  ACTOR_USER_ID: 99
};

describe("phase 8 generic provision", () => {
  it("reads env-style input without product tenant names", () => {
    const input = readProvisionInput(baseInput);
    assert.equal(input.orgSlug, "acme");
    assert.equal(input.title, "Renovación web Acme");
    assert.equal(input.projectType, "improve");
    assert.doesNotMatch(JSON.stringify(input), /bonabarcelona/i);
  });

  it("keeps title when input was already parsed", () => {
    const once = readProvisionInput(baseInput);
    const twice = readProvisionInput(once);
    assert.equal(twice.title, "Renovación web Acme");
    assert.equal(twice.orgSlug, "acme");
  });

  it("fails closed when the organization does not exist", async () => {
    const pool = createOrgPool();
    const svc = createWebProjectService(createMemoryStore());
    await assert.rejects(
      () => provisionWebProject(pool, svc, baseInput),
      (err) => err instanceof WebProjectError && err.code === ERROR_CODES.ORGANIZATION_NOT_FOUND
    );
    assert.equal((await svc.listProjects(10)).length, 0);
  });

  it("fails closed when the org has no membership", async () => {
    const pool = createOrgPool({
      orgs: [{ id: 10, slug: "acme", name: "Acme", status: "active" }]
    });
    const svc = createWebProjectService(createMemoryStore());
    await assert.rejects(
      () => provisionWebProject(pool, svc, baseInput),
      (err) => err instanceof WebProjectError && err.code === ERROR_CODES.MEMBERSHIP_REQUIRED
    );
  });

  it("rejects spoofed organization_id that does not match the slug", async () => {
    const pool = createOrgPool({
      orgs: [{ id: 10, slug: "acme", name: "Acme", status: "active" }],
      members: [{ organization_id: 10, user_id: 1 }]
    });
    const svc = createWebProjectService(createMemoryStore());
    await assert.rejects(
      () => provisionWebProject(pool, svc, { ...baseInput, ORGANIZATION_ID: 99 }),
      (err) => err instanceof WebProjectError && err.code === ERROR_CODES.VALIDATION_ERROR
    );
  });

  it("creates the project through the same service as NOC", async () => {
    const pool = createOrgPool({
      orgs: [{ id: 10, slug: "acme", name: "Acme", status: "active" }],
      members: [{ organization_id: 10, user_id: 1 }]
    });
    const store = createMemoryStore();
    const svc = createWebProjectService(store);
    const result = await provisionWebProject(pool, svc, baseInput);
    assert.equal(result.created, true);
    assert.equal(result.project.organizationId, 10);
    assert.equal(result.project.websiteHostname, "www.example.com");
    assert.equal(result.project.workflowStatus, "INTAKE");
    const listed = await svc.listProjects(10);
    assert.equal(listed.length, 1);
    const foreign = await svc.listProjects(20);
    assert.equal(foreign.length, 0);
  });

  it("creates org + owner membership only when CREATE_ORG is explicit", async () => {
    const pool = createOrgPool();
    const svc = createWebProjectService(createMemoryStore());
    const result = await provisionWebProject(pool, svc, {
      ...baseInput,
      CREATE_ORG: "1",
      ORG_NAME: "Acme",
      OWNER_USER_ID: 1
    });
    assert.equal(result.created, true);
    assert.equal(result.organization.slug, "acme");
    assert.equal(pool.state.members[0].org_role, "org_owner");
  });

  it("reuses an existing matching project instead of duplicating", async () => {
    const pool = createOrgPool({
      orgs: [{ id: 10, slug: "acme", name: "Acme", status: "active" }],
      members: [{ organization_id: 10, user_id: 1 }]
    });
    const svc = createWebProjectService(createMemoryStore());
    const first = await provisionWebProject(pool, svc, baseInput);
    const second = await provisionWebProject(pool, svc, baseInput);
    assert.equal(first.created, true);
    assert.equal(second.reused, true);
    assert.equal(second.project.id, first.project.id);
    assert.equal((await svc.listProjects(10)).length, 1);
  });

  it("unknown actor user fails", async () => {
    const pool = createOrgPool({
      orgs: [{ id: 10, slug: "acme", name: "Acme", status: "active" }],
      members: [{ organization_id: 10, user_id: 1 }]
    });
    const svc = createWebProjectService(createMemoryStore());
    await assert.rejects(
      () => provisionWebProject(pool, svc, { ...baseInput, ACTOR_USER_ID: 404 }),
      (err) => err.code === ERROR_CODES.USER_NOT_FOUND
    );
  });

  it("local DATABASE_URL guard", () => {
    assert.equal(databaseUrlLooksLocal("postgres://u:p@127.0.0.1:5432/argos"), true);
    assert.equal(databaseUrlLooksLocal("postgres://u:p@db.example.com:5432/argos"), false);
  });

  it("product sources do not hardcode a client tenant", () => {
    const roots = [
      path.join(__dirname, "..", "..", "routes"),
      __dirname,
      path.join(__dirname, "..", "..", "..", "frontend", "lib", "webProjects"),
      path.join(__dirname, "..", "..", "..", "frontend", "components", "web-projects"),
      path.join(__dirname, "..", "..", "..", "frontend", "app", "dashboard", "proyectos"),
      path.join(__dirname, "..", "..", "..", "frontend", "app", "noc", "projects")
    ];
    const forbidden = /bonabarcelona/i;
    const hits = [];
    function walk(dir) {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(js|ts|tsx)$/.test(entry.name) || /\.test\.(js|ts)$/.test(entry.name)) continue;
        const text = fs.readFileSync(full, "utf8");
        if (forbidden.test(text)) hits.push(full);
      }
    }
    roots.forEach(walk);
    assert.deepEqual(hits, []);
  });
});
