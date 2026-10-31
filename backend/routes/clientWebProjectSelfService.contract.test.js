const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const createClientWebProjectSelfServiceRouter = require("./clientWebProjectSelfService");
const { createMemoryStore } = require("../lib/webProjects/memoryStore");
const { createWebProjectService } = require("../lib/webProjects/service");
const { createSelfServiceService } = require("../lib/webProjects/selfServiceService");
const { ERROR_CODES } = require("../lib/webProjects/constants");

function httpCall(app, method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          path,
          method,
          headers: { "content-type": "application/json", ...headers }
        },
        (res) => {
          let raw = "";
          res.on("data", (chunk) => {
            raw += chunk;
          });
          res.on("end", () => {
            server.close();
            resolve({ status: res.statusCode, json: raw ? JSON.parse(raw) : null });
          });
        }
      );
      req.on("error", (err) => {
        server.close();
        reject(err);
      });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

function createPool() {
  const state = {
    users: [{ id: 7, name: "Demo Client", company: "Example Studio", email: "demo@example.test" }],
    orgs: [],
    members: [],
    activity: [],
    nextOrgId: 40,
    nextMemberId: 1
  };
  async function query(sql, params = []) {
    const s = String(sql).replace(/\s+/g, " ").trim();
    if (s.includes("FROM users WHERE id")) {
      return { rows: state.users.filter((row) => Number(row.id) === Number(params[0])) };
    }
    if (s.includes("FROM organization_members m")) {
      return {
        rows: state.members
          .filter((row) => Number(row.user_id) === Number(params[0]))
          .map((row) => {
            const org = state.orgs.find((item) => Number(item.id) === Number(row.organization_id));
            return {
              organization_id: row.organization_id,
              org_role: row.org_role,
              slug: org?.slug,
              name: org?.name,
              status: org?.status || "active"
            };
          })
      };
    }
    if (s.includes("FROM organizations WHERE id")) {
      return { rows: state.orgs.filter((row) => Number(row.id) === Number(params[0])) };
    }
    if (s.includes("FROM organizations WHERE slug")) {
      return { rows: state.orgs.filter((row) => row.slug === params[0]) };
    }
    if (s.includes("INSERT INTO organizations")) {
      const org = { id: state.nextOrgId++, slug: params[0], name: params[1], status: "active" };
      state.orgs.push(org);
      return { rows: [org] };
    }
    if (s.includes("INSERT INTO organization_members")) {
      state.members.push({
        id: state.nextMemberId++,
        organization_id: params[0],
        user_id: params[1],
        org_role: params[2] || "org_owner"
      });
      return { rows: [] };
    }
    if (s.includes("FROM activity_logs")) {
      return {
        rows: state.activity
          .filter((row) => Number(row.user_id) === Number(params[0]))
          .sort((a, b) => b.id - a.id)
      };
    }
    if (s.startsWith("INSERT INTO activity_logs")) {
      const details = typeof params[3] === "string" ? JSON.parse(params[3]) : params[3];
      const row = {
        id: state.activity.length + 1,
        user_id: params[0],
        organization_id: params[1],
        action_type: params[2],
        details
      };
      state.activity.push(row);
      return { rows: [row] };
    }
    return { rows: [] };
  }
  return {
    state,
    query,
    connect: async () => ({ query, release() {} })
  };
}

function createApp({ unauthenticated } = {}) {
  const pool = createPool();
  const projectService = createWebProjectService(createMemoryStore());
  const selfService = createSelfServiceService(pool, {
    projectService,
    notifications: { emitWebProject: async () => ({ created: 0 }) }
  });
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    if (unauthenticated) {
      return res.status(401).json({ error: "Token requerido" });
    }
    req.user = { id: 7, role: "cliente" };
    next();
  });
  app.use(
    "/api/client/web-projects/self-service",
    createClientWebProjectSelfServiceRouter(pool, {
      projectService,
      selfService,
      limiter: null
    })
  );
  return { app, pool };
}

describe("client web project self-service API contract", () => {
  it("unauthenticated → 401", async () => {
    const { app } = createApp({ unauthenticated: true });
    const res = await httpCall(app, "POST", "/api/client/web-projects/self-service", {
      projectType: "create",
      idempotencyKey: "contract-anon"
    });
    assert.equal(res.status, 401);
  });

  it("creates INTAKE project and ignores protected fields", async () => {
    const { app } = createApp();
    const res = await httpCall(app, "POST", "/api/client/web-projects/self-service", {
      projectType: "create",
      title: "Web de Example Studio",
      workflowStatus: "COMPLETED",
      createdBy: 99,
      idempotencyKey: "contract-create-01"
    });
    assert.equal(res.status, 201);
    assert.equal(res.json.project.workflowStatus, "INTAKE");
    assert.equal(res.json.project.projectType, "create");
    assert.equal(res.json.policy, "INTAKE_SOLICITUD_ONLY");
    assert.equal(res.json.created, true);
  });

  it("retry returns the same project", async () => {
    const { app } = createApp();
    const first = await httpCall(app, "POST", "/api/client/web-projects/self-service", {
      projectType: "improve",
      idempotencyKey: "contract-retry-01"
    });
    const second = await httpCall(app, "POST", "/api/client/web-projects/self-service", {
      projectType: "improve",
      idempotencyKey: "contract-retry-01"
    });
    assert.equal(first.status, 201);
    assert.equal(second.status, 200);
    assert.equal(second.json.reused, true);
    assert.equal(second.json.project.id, first.json.project.id);
  });

  it("GET context is available after create", async () => {
    const { app } = createApp();
    await httpCall(app, "POST", "/api/client/web-projects/self-service", {
      projectType: "create",
      idempotencyKey: "contract-context-01"
    });
    const res = await httpCall(app, "GET", "/api/client/web-projects/self-service");
    assert.equal(res.status, 200);
    assert.equal(res.json.organizations.length, 1);
    assert.equal(res.json.intakeProjects.length, 1);
    assert.equal(res.json.defaultOrganizationId, res.json.organizations[0].id);
  });

  it("validation error stays client-facing", async () => {
    const { app } = createApp();
    const res = await httpCall(app, "POST", "/api/client/web-projects/self-service", {
      idempotencyKey: "contract-invalid"
    });
    assert.equal(res.status, 400);
    assert.equal(res.json.code, ERROR_CODES.VALIDATION_ERROR);
    assert.doesNotMatch(res.json.error, /SQL|organization_id|JWT/i);
  });
});
