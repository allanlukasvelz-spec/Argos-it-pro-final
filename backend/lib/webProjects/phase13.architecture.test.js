const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { createMemoryStore } = require("./memoryStore");
const { createWebProjectService } = require("./service");
const { validateArchitecture } = require("./architectureValidator");
const { generateStarterArchitecture } = require("./architectureGenerator");
const { recalculateRoutes, countHomes } = require("./architectureRouteUtils");
const {
  seedServiceBusiness,
  seedTourBusiness,
  moveProjectToArchitecture
} = require("./phase13.fixtures");
const { AUDIT_ACTIONS, ERROR_CODES } = require("./constants");
const { responseMap, resolveSchemaVersion } = require("./formRegistry");
const createNocWebProjectsRouter = require("../../routes/nocWebProjects");
const requireNocAccess = require("../../middleware/requireNocAccess");

const ORG_A = 10;
const ORG_B = 20;

function service() {
  return createWebProjectService(createMemoryStore());
}

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
            resolve({
              status: res.statusCode,
              json: raw && raw.trim().startsWith("{") ? JSON.parse(raw) : null
            });
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

function nocApp(svc, role = "admin") {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: 99, role };
    next();
  });
  app.use("/api/noc", requireNocAccess, createNocWebProjectsRouter(null, { service: svc }));
  return app;
}

async function architectureProject(svc, seedFn = seedServiceBusiness) {
  const project = await svc.createProject({
    organizationId: ORG_A,
    actorUserId: 1,
    title: "Phase 13 Demo",
    projectType: "create"
  });
  await seedFn(svc, ORG_A, project.id, 1);
  await moveProjectToArchitecture(svc, ORG_A, project.id, 99);
  return project;
}

describe("Phase 13 — architecture domain", () => {
  it("generates service business starter with home and services", async () => {
    const svc = service();
    const project = await architectureProject(svc);
    const responses = (await svc.getProject(ORG_A, project.id)).form.responses;
    const values = responseMap(responses, resolveSchemaVersion(responses));
    const items = (await svc.getProject(ORG_A, project.id)).items;
    const generated = generateStarterArchitecture({ project, values, items, brief: {} });
    assert.ok(generated.pages.some((p) => p.page_type === "HOME"));
    assert.ok(generated.pages.some((p) => p.page_type === "SERVICE_INDEX"));
    assert.ok(generated.pages.some((p) => p.page_type === "SERVICE_DETAIL"));
  });

  it("generates tour business with activities index and detail template", async () => {
    const svc = service();
    const project = await architectureProject(svc, seedTourBusiness);
    const responses = (await svc.getProject(ORG_A, project.id)).form.responses;
    const values = responseMap(responses, resolveSchemaVersion(responses));
    const items = (await svc.getProject(ORG_A, project.id)).items;
    const generated = generateStarterArchitecture({ project, values, items, brief: {} });
    assert.ok(generated.pages.some((p) => p.page_type === "TOUR_INDEX"));
    assert.ok(generated.pages.some((p) => p.page_type === "TOUR_DETAIL"));
  });

  it("detects duplicate routes as INVALID", () => {
    const pages = [
      { id: 1, slug: "servicios", page_type: "SERVICE_INDEX", template_type: "INDEX", parent_page_id: null, sort_order: 1 },
      { id: 2, slug: "servicios", page_type: "CUSTOM", template_type: "UNIQUE", parent_page_id: null, sort_order: 2 }
    ];
    const routed = recalculateRoutes(pages);
    const result = validateArchitecture({ architecture: {}, pages: routed, blocks: [], values: new Map(), notes: [] });
    assert.equal(result.state, "INVALID");
    assert.ok(result.errors.some((e) => e.code === "DUPLICATE_ROUTE"));
  });

  it("requires exactly one home", () => {
    const result = validateArchitecture({
      architecture: {},
      pages: [],
      blocks: [],
      values: new Map(),
      notes: []
    });
    assert.equal(result.state, "INVALID");
    assert.ok(result.errors.some((e) => e.code === "NO_HOME"));
    assert.equal(countHomes([{ page_type: "HOME" }, { page_type: "HOME" }]), 2);
  });
});

describe("Phase 13 — architecture HTTP", () => {
  it("blocks generate outside ARCHITECTURE workflow", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: 1,
      title: "Review only",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, 1);
    await svc.transition(ORG_A, project.id, 99, "REVIEW");
    const app = nocApp(svc);
    const res = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/architecture/generate?organization_id=${ORG_A}`
    );
    assert.equal(res.status, 409);
    assert.equal(res.json.code, ERROR_CODES.ARCHITECTURE_WORKFLOW_BLOCKED);
  });

  it("generate, validate, approve, revision, start mockup", async () => {
    const svc = service();
    const project = await architectureProject(svc);
    const app = nocApp(svc);
    const generated = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/architecture/generate?organization_id=${ORG_A}`
    );
    assert.equal(generated.status, 201);
    assert.ok(generated.json.pages.length >= 4);
    assert.equal(generated.json.architecture.status, "DRAFT");

    const validate = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/architecture/validate?organization_id=${ORG_A}`
    );
    assert.equal(validate.status, 200);
    assert.notEqual(validate.json.validation.state, "INVALID");

    const approved = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/architecture/approve?organization_id=${ORG_A}`,
      { acknowledgeWarnings: true }
    );
    assert.equal(approved.status, 200);
    assert.equal(approved.json.architecture.status, "APPROVED");

    const immutable = await httpCall(
      app,
      "PATCH",
      `/api/noc/web-projects/${project.id}/architecture/pages/${approved.json.pages[0].id}?organization_id=${ORG_A}`,
      { title: "Changed" }
    );
    assert.equal(immutable.status, 409);
    assert.equal(immutable.json.code, ERROR_CODES.ARCHITECTURE_NOT_EDITABLE);

    const revision = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/architecture/revisions?organization_id=${ORG_A}`
    );
    assert.equal(revision.status, 201);
    assert.equal(revision.json.architecture.status, "DRAFT");
    assert.equal(revision.json.architecture.version, 2);

    const approveV2 = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/architecture/approve?organization_id=${ORG_A}`,
      { acknowledgeWarnings: true }
    );
    assert.equal(approveV2.status, 200);

    const mockup = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/start-mockup?organization_id=${ORG_A}`
    );
    assert.equal(mockup.status, 200);
    assert.equal(mockup.json.project.workflowStatus, "MOCKUP");
  });

  it("returns 404 for cross-tenant architecture access", async () => {
    const svc = service();
    const project = await architectureProject(svc);
    const app = nocApp(svc);
    await httpCall(app, "POST", `/api/noc/web-projects/${project.id}/architecture/generate?organization_id=${ORG_A}`);
    const res = await httpCall(
      app,
      "GET",
      `/api/noc/web-projects/${project.id}/architecture?organization_id=${ORG_B}`
    );
    assert.equal(res.status, 404);
  });

  it("rejects secrets in architecture page purpose", async () => {
    const svc = service();
    const project = await architectureProject(svc);
    const app = nocApp(svc);
    const generated = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/architecture/generate?organization_id=${ORG_A}`
    );
    const pageId = generated.json.pages.find((p) => p.pageType === "CONTACT").id;
    const res = await httpCall(
      app,
      "PATCH",
      `/api/noc/web-projects/${project.id}/architecture/pages/${pageId}?organization_id=${ORG_A}`,
      { purpose: "password=secret123" }
    );
    assert.equal(res.status, 400);
    assert.equal(res.json.code, ERROR_CODES.SECRET_REJECTED);
  });
});

describe("Phase 13 — audit events", () => {
  it("records architecture generated and approved", async () => {
    const store = createMemoryStore();
    const svc = createWebProjectService(store);
    const project = await architectureProject(svc);
    await svc.generateArchitecture(ORG_A, project.id, 99);
    await svc.approveArchitecture(ORG_A, project.id, 99, { acknowledgeWarnings: true });
    const actions = store.state.activity.map((row) => row.action_type);
    assert.ok(actions.includes(AUDIT_ACTIONS.ARCHITECTURE_GENERATED));
    assert.ok(actions.includes(AUDIT_ACTIONS.ARCHITECTURE_APPROVED));
  });
});
