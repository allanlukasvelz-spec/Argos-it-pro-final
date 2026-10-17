const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const createClientWebProjectsRouter = require("./clientWebProjects");
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

function createClientApp(service, { user, tenant, unauthenticated, noTenant } = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    if (unauthenticated || !user) {
      return res.status(401).json({ error: "Token requerido" });
    }
    req.user = user;
    if (noTenant) {
      return res.status(403).json({
        error: "Contexto de organización requerido",
        code: "TENANT_REQUIRED"
      });
    }
    req.tenant = tenant;
    next();
  });
  app.use("/api/client", createClientWebProjectsRouter(null, { service }));
  return app;
}

function ownerApp(service, orgId = ORG_A) {
  return createClientApp(service, {
    user: { id: 1, role: "cliente" },
    tenant: { id: orgId, orgRole: "org_owner", slug: "a", name: "A", status: "active" }
  });
}

describe("client web projects API contract", () => {
  it("unauthenticated → 401 and missing tenant → 403", async () => {
    const service = createWebProjectService(createMemoryStore());
    const anon = createClientApp(service, { unauthenticated: true });
    const noTenant = createClientApp(service, {
      user: { id: 1, role: "cliente" },
      noTenant: true
    });
    assert.equal((await httpCall(anon, "GET", "/api/client/web-projects")).status, 401);
    const missing = await httpCall(noTenant, "GET", "/api/client/web-projects");
    assert.equal(missing.status, 403);
    assert.equal(missing.json.code, "TENANT_REQUIRED");
  });

  it("lists and gets org A, org B get is 404", async () => {
    const service = createWebProjectService(createMemoryStore());
    const created = await service.createProject({
      organizationId: ORG_A,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });
    const appA = ownerApp(service);
    const appB = ownerApp(service, ORG_B);
    const list = await httpCall(appA, "GET", "/api/client/web-projects");
    assert.equal(list.status, 200);
    assert.equal(list.json.items.length, 1);
    const get = await httpCall(appA, "GET", `/api/client/web-projects/${created.id}`);
    assert.equal(get.status, 200);
    assert.equal(get.json.project.id, created.id);
    const foreign = await httpCall(appB, "GET", `/api/client/web-projects/${created.id}`);
    assert.equal(foreign.status, 404);
    assert.equal(foreign.json.code, "NOT_FOUND");
  });

  it("viewer GET 200 and POST/PATCH 403", async () => {
    const service = createWebProjectService(createMemoryStore());
    const created = await service.createProject({
      organizationId: ORG_A,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });
    const app = createClientApp(service, {
      user: { id: 3, role: "cliente" },
      tenant: { id: ORG_A, orgRole: "org_viewer", slug: "a", name: "A", status: "active" }
    });
    assert.equal((await httpCall(app, "GET", "/api/client/web-projects")).status, 200);
    const post = await httpCall(app, "POST", "/api/client/web-projects", {
      title: "X",
      projectType: "create"
    });
    assert.equal(post.status, 403);
    assert.equal(post.json.code, "FORBIDDEN");
    const patch = await httpCall(app, "PATCH", `/api/client/web-projects/${created.id}`, {
      title: "No"
    });
    assert.equal(patch.status, 403);
  });

  it("member cannot create; owner creates INTAKE; invalid body is 400", async () => {
    const service = createWebProjectService(createMemoryStore());
    const member = createClientApp(service, {
      user: { id: 4, role: "cliente" },
      tenant: { id: ORG_A, orgRole: "org_member", slug: "a", name: "A", status: "active" }
    });
    const owner = ownerApp(service);
    const denied = await httpCall(member, "POST", "/api/client/web-projects", {
      title: "Libre",
      projectType: "create"
    });
    assert.equal(denied.status, 403);
    const invalid = await httpCall(owner, "POST", "/api/client/web-projects", { title: "X" });
    assert.equal(invalid.status, 400);
    const created = await httpCall(owner, "POST", "/api/client/web-projects", {
      title: "Solicitud",
      projectType: "create"
    });
    assert.equal(created.status, 201);
    assert.equal(created.json.project.workflowStatus, "INTAKE");
    assert.equal(created.json.policy, "INTAKE_SOLICITUD_ONLY");
  });

  it("PATCH omit/null/protected/archived", async () => {
    const store = createMemoryStore();
    const service = createWebProjectService(store);
    const created = await service.createProject({
      organizationId: ORG_A,
      actorUserId: 1,
      title: "A",
      projectType: "create",
      websiteHostname: "www.example.com"
    });
    const owner = ownerApp(service);
    const omitted = await httpCall(owner, "PATCH", `/api/client/web-projects/${created.id}`, {
      title: "Renombrado"
    });
    assert.equal(omitted.status, 200);
    assert.equal(omitted.json.project.websiteHostname, "www.example.com");
    const cleared = await httpCall(owner, "PATCH", `/api/client/web-projects/${created.id}`, {
      websiteHostname: null
    });
    assert.equal(cleared.status, 200);
    assert.equal(cleared.json.project.websiteHostname, null);
    const protectedField = await httpCall(owner, "PATCH", `/api/client/web-projects/${created.id}`, {
      workflowStatus: "COMPLETED"
    });
    assert.equal(protectedField.status, 400);
    assert.equal(protectedField.json.code, "VALIDATION_ERROR");
    await store.updateProject(ORG_A, created.id, {
      workflow_status: "COMPLETED",
      completed_at: new Date().toISOString()
    });
    await service.archiveProject(ORG_A, created.id, 1);
    const archived = await httpCall(owner, "PATCH", `/api/client/web-projects/${created.id}`, {
      title: "Después"
    });
    assert.equal(archived.status, 409);
    assert.equal(archived.json.code, "PROJECT_ARCHIVED");
  });

  it("form validation, secrets and GET slices", async () => {
    const service = createWebProjectService(createMemoryStore());
    const created = await service.createProject({
      organizationId: ORG_A,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });
    const owner = ownerApp(service);
    const unknown = await httpCall(owner, "POST", `/api/client/web-projects/${created.id}/form`, {
      responses: [{ fieldKey: "no_existe", value: "x" }]
    });
    assert.equal(unknown.status, 400);
    assert.equal(unknown.json.code, "INVALID_FORM_FIELD");
    const badEnum = await httpCall(owner, "POST", `/api/client/web-projects/${created.id}/form`, {
      responses: [{ fieldKey: "site_kind", value: "spaceship" }]
    });
    assert.equal(badEnum.status, 400);
    assert.equal(badEnum.json.code, "INVALID_FORM_VALUE");
    const secret = await httpCall(owner, "POST", `/api/client/web-projects/${created.id}/form`, {
      responses: [{ fieldKey: "notes", value: "password=SuperSecretValue99" }]
    });
    assert.equal(secret.status, 400);
    assert.equal(secret.json.code, "SECRET_REJECTED");
    const comment = await httpCall(owner, "POST", `/api/client/web-projects/${created.id}/comments`, {
      body: "-----BEGIN PRIVATE KEY-----\nMIIB"
    });
    assert.equal(comment.status, 400);
    const ok = await httpCall(owner, "POST", `/api/client/web-projects/${created.id}/form`, {
      responses: [
        { fieldKey: "site_kind", value: "corporate" },
        { fieldKey: "has_existing_site", value: "no" }
      ]
    });
    assert.equal(ok.status, 200);
    const form = await httpCall(owner, "GET", `/api/client/web-projects/${created.id}/form`);
    assert.equal(form.status, 200);
    assert.ok(form.json.progress);
    assert.ok(form.json.formDefinition);
    const reviews = await httpCall(owner, "GET", `/api/client/web-projects/${created.id}/reviews`);
    assert.equal(reviews.status, 200);
    assert.ok(Array.isArray(reviews.json.reviews));
  });

  it("submit-review requires minimum then is idempotent in REVIEW", async () => {
    const service = createWebProjectService(createMemoryStore());
    const created = await service.createProject({
      organizationId: ORG_A,
      actorUserId: 1,
      title: "Example Studio",
      projectType: "create"
    });
    const owner = ownerApp(service);
    const blocked = await httpCall(owner, "POST", `/api/client/web-projects/${created.id}/submit-review`, {});
    assert.equal(blocked.status, 409);
    assert.equal(blocked.json.code, "INCOMPLETE_SUBMISSION");
    const filled = await httpCall(owner, "POST", `/api/client/web-projects/${created.id}/form`, {
      responses: [
        { fieldKey: "company_trade_name", value: "Example Studio" },
        { fieldKey: "about_what_you_do", value: "Diseño" },
        { fieldKey: "goals_primary_success", value: "Una web clara" },
        { fieldKey: "has_existing_site", value: "no" },
        { fieldKey: "confirm_reviewed", value: "yes" },
        { fieldKey: "confirm_use_material", value: "yes" },
        { fieldKey: "confirm_authorization", value: "yes" }
      ]
    });
    assert.equal(filled.status, 200);
    const submitted = await httpCall(owner, "POST", `/api/client/web-projects/${created.id}/submit-review`, {});
    assert.equal(submitted.status, 200);
    assert.equal(submitted.json.project.workflowStatus, "REVIEW");
    const again = await httpCall(owner, "POST", `/api/client/web-projects/${created.id}/submit-review`, {});
    assert.equal(again.status, 200);
    assert.equal(again.json.project.workflowStatus, "REVIEW");
    const items = await httpCall(owner, "GET", `/api/client/web-projects/${created.id}/items`);
    assert.equal(items.status, 200);
    const createdItem = await httpCall(owner, "POST", `/api/client/web-projects/${created.id}/items`, {
      itemType: "service",
      title: "Consultoría",
      payload: { summary: "Acompañamiento" }
    });
    assert.equal(createdItem.status, 409);
  });
});
