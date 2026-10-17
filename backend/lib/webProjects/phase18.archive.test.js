const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { createMemoryStore } = require("./memoryStore");
const { createWebProjectService } = require("./service");
const { WebProjectError } = require("./errors");
const { canTransition } = require("./workflow");
const { archiveEligibleProject, forceProjectCompleted } = require("./phase18.fixtures");
const createNocWebProjectsRouter = require("../../routes/nocWebProjects");
const requireNocAccess = require("../../middleware/requireNocAccess");

const ORG_A = 10;
const ORG_B = 20;
const ACTOR = 99;

function serviceWithStore() {
  const store = createMemoryStore();
  return { store, svc: createWebProjectService(store) };
}

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
          headers: { "content-type": "application/json", origin: "http://127.0.0.1:3020" }
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

async function seedProject(svc, organizationId = ORG_A) {
  const project = await svc.createProject({
    organizationId,
    actorUserId: 1,
    title: "Acme site",
    projectType: "improve"
  });
  await svc.upsertForm(organizationId, project.id, 1, [
    { fieldKey: "site_kind", value: "corporate" },
    { fieldKey: "has_existing_site", value: "no" }
  ]);
  return { project: await svc.getProject(organizationId, project.id) };
}

function nocApp(service, role = "admin") {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: ACTOR, role };
    next();
  });
  app.use("/api/noc", requireNocAccess, createNocWebProjectsRouter(null, { service }));
  return app;
}

describe("phase18 archive & post-completion lifecycle", () => {
  it("ARCHIVED is not a workflow status", () => {
    assert.throws(
      () => canTransition("COMPLETED", "ARCHIVED"),
      (err) => err instanceof WebProjectError && err.code === "VALIDATION_ERROR"
    );
  });

  for (const status of [
    "INTAKE",
    "REVIEW",
    "ARCHITECTURE",
    "MOCKUP",
    "DEVELOPMENT",
    "VALIDATION",
    "PUBLICATION"
  ]) {
    it(`archive rejects ${status}`, async () => {
      const { store, svc } = serviceWithStore();
      const project = await svc.createProject({
        organizationId: ORG_A,
        actorUserId: ACTOR,
        title: status,
        projectType: "create"
      });
      if (status !== "INTAKE") {
        await store.updateProject(ORG_A, project.id, { workflow_status: status });
      }
      await assert.rejects(
        () => svc.archiveProject(ORG_A, project.id, ACTOR),
        (err) => err instanceof WebProjectError && err.code === "ARCHIVE_NOT_ELIGIBLE" && err.status === 409
      );
    });
  }

  it("COMPLETED archive succeeds with metadata", async () => {
    const { store, svc } = serviceWithStore();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Done",
      projectType: "create"
    });
    await forceProjectCompleted(store, ORG_A, project.id);
    const archived = await svc.archiveProject(ORG_A, project.id, ACTOR, { reason: "Cierre operativo" });
    assert.ok(archived.archivedAt);
    assert.equal(archived.archivedBy, ACTOR);
    assert.equal(archived.archiveReason, "Cierre operativo");
    assert.equal(archived.workflowStatus, "COMPLETED");
  });

  it("archive idempotency preserves first snapshot", async () => {
    const { store, svc } = serviceWithStore();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Idem",
      projectType: "create"
    });
    await forceProjectCompleted(store, ORG_A, project.id);
    const first = await svc.archiveProject(ORG_A, project.id, ACTOR, { reason: "Primera" });
    const second = await svc.archiveProject(ORG_A, project.id, 777, { reason: "Segunda" });
    assert.equal(second.archivedAt, first.archivedAt);
    assert.equal(second.archivedBy, first.archivedBy);
    assert.equal(second.archiveReason, first.archiveReason);
    const audits = store.state.activity.filter((row) => row.action_type === "WEB_PROJECT_ARCHIVED");
    assert.equal(audits.length, 1);
  });

  it("completed mutations are rejected", async () => {
    const { store, svc } = serviceWithStore();
    const { project } = await seedProject(svc);
    await forceProjectCompleted(store, ORG_A, project.id);
    await assert.rejects(
      () => svc.updateProject(ORG_A, project.id, ACTOR, { title: "Nuevo" }),
      (err) => err.code === "PROJECT_COMPLETED"
    );
    await assert.rejects(
      () => svc.addComment(ORG_A, project.id, ACTOR, "Hola"),
      (err) => err.code === "PROJECT_COMPLETED"
    );
    await assert.rejects(
      () => svc.setCredentialStatus(ORG_A, project.id, ACTOR, "REQUESTED"),
      (err) => err.code === "PROJECT_COMPLETED"
    );
    await assert.rejects(
      () =>
        svc.addReview(ORG_A, project.id, ACTOR, {
          verdict: "APPROVED",
          targetType: "FORM_FIELD",
          targetKey: "site_kind"
        }),
      (err) => err.code === "PROJECT_COMPLETED"
    );
  });

  it("reads stay available after completed and archived", async () => {
    const { store, svc } = serviceWithStore();
    const { project } = await seedProject(svc);
    await forceProjectCompleted(store, ORG_A, project.id);
    const completed = await svc.getProject(ORG_A, project.id);
    assert.equal(completed.workflowStatus, "COMPLETED");
    await archiveEligibleProject(store, svc, ORG_A, project.id, ACTOR);
    const archived = await svc.getProject(ORG_A, project.id);
    assert.ok(archived.archivedAt);
    assert.ok(Array.isArray(archived.reviews));
  });

  it("HTTP archive non-COMPLETED 409 and COMPLETED 200", async () => {
    const { store, svc } = serviceWithStore();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "HTTP",
      projectType: "create"
    });
    const app = nocApp(svc);
    const blocked = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/archive?organization_id=${ORG_A}`,
      { reason: "No" }
    );
    assert.equal(blocked.status, 409);
    assert.equal(blocked.json.code, "ARCHIVE_NOT_ELIGIBLE");
    await forceProjectCompleted(store, ORG_A, project.id);
    const ok = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/archive?organization_id=${ORG_A}`,
      { reason: "OK" }
    );
    assert.equal(ok.status, 200);
    assert.equal(ok.json.project.archiveReason, "OK");
    const retry = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/archive?organization_id=${ORG_A}`,
      { reason: "Retry" }
    );
    assert.equal(retry.status, 200);
    assert.equal(retry.json.project.archiveReason, "OK");
  });

  it("cross-tenant archive returns 404", async () => {
    const { store, svc } = serviceWithStore();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Tenant",
      projectType: "create"
    });
    await forceProjectCompleted(store, ORG_A, project.id);
    const app = nocApp(svc);
    const wrong = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/archive?organization_id=${ORG_B}`
    );
    assert.equal(wrong.status, 404);
  });

  it("org_admin cannot archive", async () => {
    const { store, svc } = serviceWithStore();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "RBAC",
      projectType: "create"
    });
    await forceProjectCompleted(store, ORG_A, project.id);
    const app = nocApp(svc, "org_admin");
    const res = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/archive?organization_id=${ORG_A}`
    );
    assert.equal(res.status, 403);
  });
});
