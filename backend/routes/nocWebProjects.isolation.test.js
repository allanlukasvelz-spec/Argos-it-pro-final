const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const createNocWebProjectsRouter = require("./nocWebProjects");
const requireNocAccess = require("../middleware/requireNocAccess");
const { createMemoryStore } = require("../lib/webProjects/memoryStore");
const { createWebProjectService } = require("../lib/webProjects/service");

const ORG_A = 10;
const ORG_B = 20;

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

function createNocApp(service, user) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = user;
    next();
  });
  app.use("/api/noc", requireNocAccess, createNocWebProjectsRouter(null, { service }));
  return app;
}

describe("NOC web projects tenant + access", () => {
  it("rejects missing organization_id", async () => {
    const service = createWebProjectService(createMemoryStore());
    const app = createNocApp(service, { id: 99, role: "admin" });
    const res = await httpCall(app, "GET", "/api/noc/web-projects");
    assert.equal(res.status, 400);
    assert.equal(res.json.code, "TENANT_REQUIRED");
  });

  it("cannot fetch or mutate org A using org B context", async () => {
    const service = createWebProjectService(createMemoryStore());
    const created = await service.createProject({
      organizationId: ORG_A,
      actorUserId: 99,
      title: "A",
      projectType: "create"
    });
    const app = createNocApp(service, { id: 99, role: "admin" });
    const get = await httpCall(app, "GET", `/api/noc/web-projects/${created.id}?organization_id=${ORG_B}`);
    assert.equal(get.status, 404);
    const patch = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${created.id}/transition?organization_id=${ORG_B}`,
      { toStatus: "REVIEW" }
    );
    assert.equal(patch.status, 404);
    const ok = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${created.id}/transition?organization_id=${ORG_A}`,
      { toStatus: "REVIEW" }
    );
    assert.equal(ok.status, 200);
    assert.equal(ok.json.project.workflowStatus, "REVIEW");
    assert.equal(ok.json.organizationId, ORG_A);
  });

  it("org_admin never obtains NOC access", async () => {
    const service = createWebProjectService(createMemoryStore());
    const app = createNocApp(service, { id: 7, role: "org_admin" });
    const res = await httpCall(app, "GET", `/api/noc/web-projects?organization_id=${ORG_A}`);
    assert.equal(res.status, 403);
    assert.equal(res.json.code, "NOC_FORBIDDEN");
  });
});
