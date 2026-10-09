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
  app.use((req, res, next) => {
    if (!user) return res.status(401).json({ error: "Token requerido" });
    req.user = user;
    next();
  });
  app.use("/api/noc", requireNocAccess, createNocWebProjectsRouter(null, { service }));
  return app;
}

async function walkTo(service, organizationId, projectId, actorUserId, target) {
  const path = ["REVIEW", "ARCHITECTURE", "MOCKUP", "DEVELOPMENT", "VALIDATION", "PUBLICATION", "COMPLETED"];
  let current = await service.getProject(organizationId, projectId);
  for (const next of path) {
    if (current.workflowStatus === target) return current;
    if (current.workflowStatus === next) continue;
    if (next === "DEVELOPMENT" && current.workflowStatus === "MOCKUP") {
      current = await service.transition(organizationId, projectId, actorUserId, "DEVELOPMENT", {
        approvedMockupDevelopment: true
      });
      continue;
    }
    if (next === "VALIDATION" && current.workflowStatus === "DEVELOPMENT") {
      current = await service.transition(organizationId, projectId, actorUserId, "VALIDATION", {
        validationReady: true
      });
      continue;
    }
    if (next === "PUBLICATION" && current.workflowStatus === "VALIDATION") {
      current = await service.transition(organizationId, projectId, actorUserId, "PUBLICATION", {
        publicationReady: true
      });
      continue;
    }
    if (next === "COMPLETED" && current.workflowStatus === "PUBLICATION") {
      current = await service.transition(organizationId, projectId, actorUserId, "COMPLETED", {
        completionReady: true
      });
      continue;
    }
    current = await service.transition(organizationId, projectId, actorUserId, next);
  }
  return current;
}

describe("NOC web projects API contract", () => {
  it("unauthenticated 401; cliente and org_admin forbidden; admin allowed", async () => {
    const service = createWebProjectService(createMemoryStore());
    const anon = createNocApp(service, null);
    const cliente = createNocApp(service, { id: 1, role: "cliente" });
    const orgAdmin = createNocApp(service, { id: 2, role: "org_admin" });
    const admin = createNocApp(service, { id: 99, role: "admin" });
    assert.equal((await httpCall(anon, "GET", `/api/noc/web-projects?organization_id=${ORG_A}`)).status, 401);
    assert.equal((await httpCall(cliente, "GET", `/api/noc/web-projects?organization_id=${ORG_A}`)).json.code, "NOC_FORBIDDEN");
    assert.equal((await httpCall(orgAdmin, "GET", `/api/noc/web-projects?organization_id=${ORG_A}`)).json.code, "NOC_FORBIDDEN");
    const ok = await httpCall(admin, "GET", `/api/noc/web-projects?organization_id=${ORG_A}`);
    assert.equal(ok.status, 200);
  });

  it("missing organization_id → 400; wrong org + valid id → 404", async () => {
    const service = createWebProjectService(createMemoryStore());
    const created = await service.createProject({
      organizationId: ORG_A,
      actorUserId: 99,
      title: "A",
      projectType: "create"
    });
    const app = createNocApp(service, { id: 99, role: "admin" });
    const missing = await httpCall(app, "GET", "/api/noc/web-projects");
    assert.equal(missing.status, 400);
    assert.equal(missing.json.code, "TENANT_REQUIRED");
    const wrong = await httpCall(app, "GET", `/api/noc/web-projects/${created.id}?organization_id=${ORG_B}`);
    assert.equal(wrong.status, 404);
  });

  it("creates scoped project, transitions, rejects invalid and post-COMPLETED", async () => {
    const store = createMemoryStore();
    const service = createWebProjectService(store);
    const app = createNocApp(service, { id: 99, role: "super_admin" });
    const created = await httpCall(app, "POST", `/api/noc/web-projects?organization_id=${ORG_A}`, {
      title: "NOC",
      projectType: "improve"
    });
    assert.equal(created.status, 201);
    assert.equal(created.json.organizationId, ORG_A);
    assert.equal(created.json.project.organizationId, ORG_A);
    const { seedArchitectureMinimum } = require("../lib/webProjects/phase12.fixtures");
    await seedArchitectureMinimum(service, ORG_A, created.json.project.id, 99);
    const invalid = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${created.json.project.id}/transition?organization_id=${ORG_A}`,
      { toStatus: "COMPLETED" }
    );
    assert.equal(invalid.status, 409);
    assert.equal(invalid.json.code, "INVALID_TRANSITION");
    const review = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${created.json.project.id}/transition?organization_id=${ORG_A}`,
      { toStatus: "REVIEW" }
    );
    assert.equal(review.status, 200);
    const finished = await walkTo(service, ORG_A, created.json.project.id, 99, "COMPLETED");
    assert.ok(finished.completedAt);
    const after = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${created.json.project.id}/transition?organization_id=${ORG_A}`,
      { toStatus: "PUBLICATION" }
    );
    assert.equal(after.status, 409);
  });

  it("archive does not delete; review and audit stay scoped", async () => {
    const store = createMemoryStore();
    const service = createWebProjectService(store);
    const created = await service.createProject({
      organizationId: ORG_A,
      actorUserId: 99,
      title: "A",
      projectType: "create"
    });
    const { forceProjectCompleted } = require("../lib/webProjects/phase18.fixtures");
    await forceProjectCompleted(store, ORG_A, created.id);
    const app = createNocApp(service, { id: 99, role: "admin" });
    const archived = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${created.id}/archive?organization_id=${ORG_A}`
    );
    assert.equal(archived.status, 200);
    assert.ok(archived.json.project.archivedAt);
    assert.equal(store.state.projects.length, 1);
    assert.equal(store.state.projects[0].title, "A");
    const readable = await httpCall(
      app,
      "GET",
      `/api/noc/web-projects/${created.id}?organization_id=${ORG_A}`
    );
    assert.equal(readable.status, 200);
    const wrongOrg = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${created.id}/reviews?organization_id=${ORG_B}`,
      { verdict: "APPROVED", summary: "ok" }
    );
    assert.equal(wrongOrg.status, 404);
    const archivedMut = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${created.id}/reviews?organization_id=${ORG_A}`,
      { verdict: "APPROVED", summary: "ok" }
    );
    assert.equal(archivedMut.status, 409);
    assert.equal(archivedMut.json.code, "PROJECT_ARCHIVED");
    const logs = store.state.activity.filter((row) => row.organization_id === ORG_A);
    assert.ok(logs.some((row) => row.action_type === "WEB_PROJECT_ARCHIVED"));
    assert.equal(
      store.state.activity.some((row) => row.action_type === "WEB_PROJECT_REVIEW_CREATED"),
      false
    );
  });

  it("GET project returns formDefinition and correction creates REVIEW history", async () => {
    const store = createMemoryStore();
    const service = createWebProjectService(store);
    const created = await service.createProject({
      organizationId: ORG_A,
      actorUserId: 99,
      title: "Example Studio",
      projectType: "create"
    });
    await service.upsertForm(ORG_A, created.id, 1, [
      { fieldKey: "company_trade_name", value: "Example Studio" },
      { fieldKey: "about_what_you_do", value: "Diseño" },
      { fieldKey: "goals_primary_success", value: "Una web clara" },
      { fieldKey: "confirm_reviewed", value: "yes" },
      { fieldKey: "confirm_use_material", value: "yes" },
      { fieldKey: "confirm_authorization", value: "yes" }
    ]);
    await service.submitForReview(ORG_A, created.id, 1);
    const app = createNocApp(service, { id: 99, role: "admin" });
    const got = await httpCall(app, "GET", `/api/noc/web-projects/${created.id}?organization_id=${ORG_A}`);
    assert.equal(got.status, 200);
    assert.equal(got.json.formDefinition.version, "web-project-intake.v2");
    assert.equal(got.json.formDefinition.sections.length, 16);
    const correction = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${created.id}/reviews?organization_id=${ORG_A}`,
      {
        verdict: "CORRECTION_REQUESTED",
        targetType: "FORM_FIELD",
        targetKey: "company_trade_name",
        correctionMessage: "Usa el nombre comercial público."
      }
    );
    assert.equal(correction.status, 201);
    assert.equal(correction.json.project.workflowStatus, "REVIEW");
    const forbidden = createNocApp(service, { id: 1, role: "cliente" });
    const denied = await httpCall(
      forbidden,
      "POST",
      `/api/noc/web-projects/${created.id}/reviews?organization_id=${ORG_A}`,
      { verdict: "APPROVED", summary: "no" }
    );
    assert.equal(denied.status, 403);
  });
});
