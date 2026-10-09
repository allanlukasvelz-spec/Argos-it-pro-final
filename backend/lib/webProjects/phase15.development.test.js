const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { createMemoryStore } = require("./memoryStore");
const { createWebProjectService } = require("./service");
const { generateDevelopmentPlan } = require("./developmentPlanGenerator");
const { deriveProgress, evaluateDevelopmentReadiness } = require("./developmentReadiness");
const { assertStatusTransition } = require("./developmentOperations");
const { seedServiceBusiness, seedTourBusiness } = require("./phase13.fixtures");
const { bootstrapDevelopmentFromMockup } = require("./phase14.fixtures");
const { bootstrapDevelopmentReady } = require("./phase15.fixtures");
const { AUDIT_ACTIONS, ERROR_CODES } = require("./constants");
const createNocWebProjectsRouter = require("../../routes/nocWebProjects");
const requireNocAccess = require("../../middleware/requireNocAccess");

const ORG_A = 10;
const ORG_B = 20;
const ACTOR = 1;

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
    req.user = { id: ACTOR, role };
    next();
  });
  app.use("/api/noc", requireNocAccess, createNocWebProjectsRouter(null, { service: svc }));
  return app;
}

async function createDevProject(svc, org = ORG_A) {
  const project = await svc.createProject({
    organizationId: org,
    actorUserId: ACTOR,
    title: "Phase 15 Dev",
    projectType: "create"
  });
  await seedServiceBusiness(svc, org, project.id, ACTOR);
  await bootstrapDevelopmentFromMockup(svc, org, project.id, ACTOR);
  return project;
}

describe("Phase 15 — development domain", () => {
  it("generator creates global items and one SERVICE_DETAIL template", () => {
    const specs = generateDevelopmentPlan({
      architecturePages: [
        { id: 1, page_type: "HOME", title: "Inicio", archived_at: null },
        { id: 2, page_type: "SERVICE_DETAIL", title: "Servicio", template_type: "DETAIL", archived_at: null },
        { id: 3, page_type: "SERVICE_DETAIL", title: "Otro servicio", template_type: "DETAIL", archived_at: null }
      ],
      architectureBlocks: [{ block_type: "CONTACT_FORM", archived_at: null }],
      mockupPages: [{ id: 10, architecture_page_id: 1, archived_at: null }],
      mockupSections: [],
      items: [{ item_type: "service", archived_at: null }],
      formValues: new Map(),
      projectType: "create"
    });
    const templates = specs.filter((s) => s.item_type === "TEMPLATE");
    assert.equal(templates.length, 1);
    assert.ok(specs.some((s) => s.item_type === "GLOBAL_STYLES"));
    assert.ok(specs.some((s) => s.item_type === "FORM"));
  });

  it("template reuse: 10 tours → one TOUR_DETAIL template item", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Tour reuse",
      projectType: "create"
    });
    await seedTourBusiness(svc, ORG_A, project.id, ACTOR);
    for (let i = 0; i < 8; i += 1) {
      await svc.addItem(ORG_A, project.id, ACTOR, {
        title: `Demo Activity ${i + 3}`,
        itemType: "tour",
        payload: { summary: "Actividad demo" }
      });
    }
    await bootstrapDevelopmentReady(svc, ORG_A, project.id, ACTOR);
    const dev = await svc.getDevelopment(ORG_A, project.id);
    const tourTemplates = dev.items.filter(
      (i) => i.itemType === "TEMPLATE" && i.title.includes("Actividad")
    );
    assert.equal(tourTemplates.length, 1);
  });

  it("prepare development is idempotent", async () => {
    const svc = service();
    const project = await createDevProject(svc);
    const first = await svc.prepareDevelopmentPlan(ORG_A, project.id, ACTOR);
    const second = await svc.prepareDevelopmentPlan(ORG_A, project.id, ACTOR);
    assert.equal(first.items.length, second.items.length);
    assert.equal(first.plan?.id, second.plan?.id);
  });

  it("status transitions matrix", () => {
    assert.doesNotThrow(() => assertStatusTransition("TODO", "READY"));
    assert.doesNotThrow(() => assertStatusTransition("READY", "IN_PROGRESS"));
    assert.doesNotThrow(() => assertStatusTransition("IN_PROGRESS", "REVIEW"));
    assert.doesNotThrow(() => assertStatusTransition("REVIEW", "DONE"));
    assert.throws(() => assertStatusTransition("TODO", "DONE"));
  });

  it("block and unblock retains history", async () => {
    const svc = service();
    const project = await createDevProject(svc);
    await svc.prepareDevelopmentPlan(ORG_A, project.id, ACTOR);
    const dev = await svc.getDevelopment(ORG_A, project.id);
    const item = dev.items.find((i) => i.itemType === "GLOBAL_STYLES");
    assert.ok(item);
    if (item.status !== "READY") {
      await svc.updateDevelopmentItem(ORG_A, project.id, item.id, ACTOR, { status: "READY" });
    }
    await svc.updateDevelopmentItem(ORG_A, project.id, item.id, ACTOR, { status: "IN_PROGRESS" });
    await svc.blockDevelopmentItem(ORG_A, project.id, item.id, ACTOR, {
      blockerType: "CLIENT_CONTENT",
      description: "Falta copy del hero"
    });
    const blocked = await svc.getDevelopment(ORG_A, project.id);
    const blockedItem = blocked.items.find((i) => i.id === item.id);
    assert.equal(blockedItem.status, "BLOCKED");
    assert.equal(blocked.readiness.state, "NOT_READY");
    await svc.unblockDevelopmentItem(ORG_A, project.id, item.id, ACTOR, {
      resolutionNote: "Cliente envió copy"
    });
    const resolved = await svc.getDevelopment(ORG_A, project.id);
    const row = resolved.items.find((i) => i.id === item.id);
    assert.equal(row.status, "READY");
    assert.ok(row.blockers.some((b) => b.resolvedAt));
  });

  it("dependency cycle blocked", async () => {
    const svc = service();
    const project = await createDevProject(svc);
    await svc.prepareDevelopmentPlan(ORG_A, project.id, ACTOR);
    const dev = await svc.getDevelopment(ORG_A, project.id);
    const a = dev.items.find((i) => i.itemType === "GLOBAL_STYLES");
    const b = dev.items.find((i) => i.itemType === "HEADER");
    await svc.addDevelopmentDependency(ORG_A, project.id, b.id, ACTOR, { dependsOnItemId: a.id });
    await assert.rejects(
      () => svc.addDevelopmentDependency(ORG_A, project.id, a.id, ACTOR, { dependsOnItemId: b.id }),
      (err) => err.code === ERROR_CODES.DEVELOPMENT_DEPENDENCY_CYCLE
    );
  });

  it("derived progress excludes NOT_APPLICABLE", () => {
    const progress = deriveProgress([
      { status: "DONE" },
      { status: "DONE" },
      { status: "NOT_APPLICABLE" },
      { status: "TODO" }
    ]);
    assert.equal(progress.total, 3);
    assert.equal(progress.done, 2);
    assert.equal(progress.percent, 67);
  });

  it("readiness NOT_READY when required items incomplete", () => {
    const readiness = evaluateDevelopmentReadiness({
      project: { workflow_status: "DEVELOPMENT" },
      handoff: { id: 1 },
      plan: { id: 1 },
      items: [
        { id: 1, title: "Setup", required: true, status: "DONE" },
        { id: 2, title: "Home", required: true, status: "TODO" }
      ],
      blockers: [],
      openDecisions: []
    });
    assert.equal(readiness.state, "NOT_READY");
  });

  it("prepare blocked outside DEVELOPMENT workflow", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Mockup only",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, ACTOR);
    await assert.rejects(
      () => svc.prepareDevelopmentPlan(ORG_A, project.id, ACTOR),
      (err) => err.code === ERROR_CODES.DEVELOPMENT_WORKFLOW_BLOCKED
    );
  });

  it("secret guard on blocker description", async () => {
    const svc = service();
    const project = await createDevProject(svc);
    await svc.prepareDevelopmentPlan(ORG_A, project.id, ACTOR);
    const item = (await svc.getDevelopment(ORG_A, project.id)).items[0];
    await assert.rejects(
      () =>
        svc.blockDevelopmentItem(ORG_A, project.id, item.id, ACTOR, {
          blockerType: "OTHER",
          description: "password=secret123456"
        }),
      (err) => err.code === "SECRET_REJECTED"
    );
  });

  it("cross-tenant development read returns 404 HTTP", async () => {
    const svc = service();
    const project = await createDevProject(svc);
    await svc.prepareDevelopmentPlan(ORG_A, project.id, ACTOR);
    const app = nocApp(svc);
    const res = await httpCall(
      app,
      "GET",
      `/api/noc/web-projects/${project.id}/development?organization_id=${ORG_B}`
    );
    assert.equal(res.status, 404);
  });

  it("HTTP prepare + update + start validation flow", async () => {
    const svc = service();
    const project = await createDevProject(svc);
    const app = nocApp(svc);
    const prepared = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/development/prepare?organization_id=${ORG_A}`
    );
    assert.equal(prepared.status, 200);
    assert.ok(prepared.json.items.length > 0);
    async function completeItem(item) {
      const steps =
        item.status === "TODO"
          ? ["READY", "IN_PROGRESS", "REVIEW", "DONE"]
          : item.status === "READY"
            ? ["IN_PROGRESS", "REVIEW", "DONE"]
            : item.status === "IN_PROGRESS"
              ? ["REVIEW", "DONE"]
              : item.status === "REVIEW"
                ? ["DONE"]
                : [];
      for (const status of steps) {
        const res = await httpCall(
          app,
          "PATCH",
          `/api/noc/web-projects/${project.id}/development/items/${item.id}?organization_id=${ORG_A}`,
          { status }
        );
        assert.equal(res.status, 200, `item ${item.id} → ${status}`);
      }
    }
    for (const item of prepared.json.items.filter((i) => i.required)) {
      await completeItem(item);
    }
    const validation = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/start-validation?organization_id=${ORG_A}`,
      { acknowledgeWarnings: true }
    );
    assert.equal(validation.status, 200);
    assert.ok(["READY", "READY_WITH_WARNINGS"].includes(validation.json.readiness.state));
    const updated = await svc.getProject(ORG_A, project.id);
    assert.equal(updated.workflowStatus, "VALIDATION");
  });

  it("start validation NOT_READY returns 409", async () => {
    const svc = service();
    const project = await createDevProject(svc);
    await svc.prepareDevelopmentPlan(ORG_A, project.id, ACTOR);
    await assert.rejects(
      () => svc.startValidation(ORG_A, project.id, ACTOR),
      (err) => err.status === 409 && err.code === ERROR_CODES.VALIDATION_NOT_READY
    );
  });
});

void AUDIT_ACTIONS;
