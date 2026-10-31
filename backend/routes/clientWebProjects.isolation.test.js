const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const createClientWebProjectsRouter = require("./clientWebProjects");
const { createMemoryStore } = require("../lib/webProjects/memoryStore");
const { createWebProjectService } = require("../lib/webProjects/service");
const requireOrgRole = require("../middleware/requireOrgRole");

const ORG_A = 10;
const ORG_B = 20;

function createApp(service, { user, tenant }) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = user;
    req.tenant = tenant;
    next();
  });
  app.use("/api/client", createClientWebProjectsRouter(null, { service }));
  return app;
}

describe("client web projects isolation + RBAC", () => {
  it("org B cannot list, fetch or mutate org A", async () => {
    const store = createMemoryStore();
    const service = createWebProjectService(store);
    const created = await service.createProject({
      organizationId: ORG_A,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });

    const appB = createApp(service, {
      user: { id: 2, role: "cliente" },
      tenant: { id: ORG_B, orgRole: "org_owner", slug: "b", name: "B", status: "active" }
    });

    const list = await httpCall(appB, "GET", "/api/client/web-projects");
    assert.equal(list.status, 200);
    assert.equal(list.json.items.length, 0);

    const get = await httpCall(appB, "GET", `/api/client/web-projects/${created.id}`);
    assert.equal(get.status, 404);

    const patch = await httpCall(appB, "PATCH", `/api/client/web-projects/${created.id}`, {
      title: "Hacked"
    });
    assert.equal(patch.status, 404);
  });

  it("org_viewer cannot mutate", async () => {
    const store = createMemoryStore();
    const service = createWebProjectService(store);
    const created = await service.createProject({
      organizationId: ORG_A,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });
    const app = createApp(service, {
      user: { id: 3, role: "cliente" },
      tenant: { id: ORG_A, orgRole: "org_viewer", slug: "a", name: "A", status: "active" }
    });
    const list = await httpCall(app, "GET", "/api/client/web-projects");
    assert.equal(list.status, 200);
    assert.equal(list.json.items.length, 1);
    const post = await httpCall(app, "POST", "/api/client/web-projects", {
      title: "Otro",
      projectType: "create"
    });
    assert.equal(post.status, 403);
    assert.equal(post.json.code, "FORBIDDEN");
    const form = await httpCall(app, "POST", `/api/client/web-projects/${created.id}/form`, {
      responses: [{ fieldKey: "site_kind", value: "corporate" }]
    });
    assert.equal(form.status, 403);
  });

  it("org_member can contribute but not create", async () => {
    const store = createMemoryStore();
    const service = createWebProjectService(store);
    const created = await service.createProject({
      organizationId: ORG_A,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });
    const app = createApp(service, {
      user: { id: 4, role: "cliente" },
      tenant: { id: ORG_A, orgRole: "org_member", slug: "a", name: "A", status: "active" }
    });
    const create = await httpCall(app, "POST", "/api/client/web-projects", {
      title: "Libre",
      projectType: "create"
    });
    assert.equal(create.status, 403);
    const form = await httpCall(app, "POST", `/api/client/web-projects/${created.id}/form`, {
      responses: [{ fieldKey: "site_kind", value: "landing" }]
    });
    assert.equal(form.status, 200);
  });

  it("requireOrgRole is reusable and denies missing tenant role", () => {
    const mw = requireOrgRole(["org_owner"]);
    let status = 0;
    let body = null;
    mw(
      { tenant: { orgRole: "org_viewer" } },
      {
        status(code) {
          status = code;
          return this;
        },
        json(payload) {
          body = payload;
        }
      },
      () => {
        throw new Error("should not pass");
      }
    );
    assert.equal(status, 403);
    assert.equal(body.code, "FORBIDDEN");
  });
});

function httpCall(app, method, path, body) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          path,
          method,
          headers: { "content-type": "application/json" }
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
