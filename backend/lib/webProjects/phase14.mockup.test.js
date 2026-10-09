const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { createMemoryStore } = require("./memoryStore");
const { createWebProjectService } = require("./service");
const { generateMockupFromArchitecture } = require("./mockupGenerator");
const { validateMockup } = require("./mockupValidator");
const { seedServiceBusiness, moveProjectToArchitecture } = require("./phase13.fixtures");
const { generateApprovedMockup, moveProjectToMockup } = require("./phase14.fixtures");
const { AUDIT_ACTIONS, ERROR_CODES } = require("./constants");
const { responseMap, resolveSchemaVersion } = require("./formRegistry");
const createNocWebProjectsRouter = require("../../routes/nocWebProjects");
const createClientWebProjectsRouter = require("../../routes/clientWebProjects");
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

function clientApp(svc, orgId = ORG_A, orgRole = "org_owner") {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: 42, role: "cliente" };
    req.tenant = { id: orgId, orgRole, slug: "demo", name: "Demo", status: "active" };
    next();
  });
  app.use("/api/client", createClientWebProjectsRouter(null, { service: svc }));
  return app;
}

async function mockupProject(svc) {
  const project = await svc.createProject({
    organizationId: ORG_A,
    actorUserId: 1,
    title: "Phase 14 Demo",
    projectType: "create"
  });
  await seedServiceBusiness(svc, ORG_A, project.id, 1);
  await moveProjectToMockup(svc, ORG_A, project.id, 99);
  return project;
}

describe("Phase 14 — mockup domain", () => {
  it("generates mockup deterministically from approved architecture", async () => {
    const svc = service();
    const project = await mockupProject(svc);
    const payload = await svc.generateMockup(ORG_A, project.id, 99);
    assert.ok(payload.mockup);
    assert.equal(payload.mockup.status, "DRAFT");
    assert.ok(payload.pages.length >= 4);
    assert.ok(payload.sections.length >= payload.pages.length);
    assert.ok(payload.mockup.visualDirection);
    assert.ok(payload.mockup.designTokens?.colors?.primary);
    assert.notEqual(payload.validation.state, "INVALID");
  });

  it("blocks generate without approved architecture", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: 1,
      title: "No arch",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, 1);
    await moveProjectToArchitecture(svc, ORG_A, project.id, 99);
    await svc.generateArchitecture(ORG_A, project.id, 99);
    await assert.rejects(
      () => svc.startMockup(ORG_A, project.id, 99),
      (err) => err.code === ERROR_CODES.MOCKUP_NOT_READY
    );
  });

  it("blocks generate outside MOCKUP workflow", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: 1,
      title: "Arch only",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, 1);
    await moveProjectToArchitecture(svc, ORG_A, project.id, 99);
    await svc.generateArchitecture(ORG_A, project.id, 99);
    await svc.approveArchitecture(ORG_A, project.id, 99, { acknowledgeWarnings: true });
    await assert.rejects(
      () => svc.generateMockup(ORG_A, project.id, 99),
      (err) => err.code === ERROR_CODES.MOCKUP_WORKFLOW_BLOCKED
    );
  });

  it("validator flags missing architecture", () => {
    const result = validateMockup({
      mockup: { visual_direction: {} },
      pages: [],
      sections: [],
      architecturePages: [],
      architectureBlocks: [],
      approvedArchitecture: null
    });
    assert.equal(result.state, "INVALID");
    assert.ok(result.errors.some((e) => e.code === "NO_APPROVED_ARCHITECTURE"));
  });
});

describe("Phase 14 — mockup versioning", () => {
  it("v1 client review → changes → v2 → approve keeps v1 history", async () => {
    const svc = service();
    const project = await mockupProject(svc);
    const v1 = await svc.generateMockup(ORG_A, project.id, 99);
    const mockupId = v1.mockup.id;
    await svc.sendMockupToClient(ORG_A, project.id, mockupId, 99, { acknowledgeWarnings: true });
    await svc.clientRequestMockupChanges(ORG_A, project.id, 42, { message: "Cambiar hero" });
    const v1After = await svc.getMockup(ORG_A, project.id, { mockupId });
    assert.equal(v1After.mockup.status, "CHANGES_REQUESTED");
    const v2 = await svc.createMockupRevision(ORG_A, project.id, 99);
    assert.equal(v2.mockup.version, 2);
    assert.equal(v2.mockup.status, "DRAFT");
    await svc.sendMockupToClient(ORG_A, project.id, v2.mockup.id, 99, { acknowledgeWarnings: true });
    await svc.clientApproveMockup(ORG_A, project.id, 42);
    const approved = await svc.getMockup(ORG_A, project.id, { mockupId: v2.mockup.id });
    assert.equal(approved.mockup.status, "APPROVED");
    const all = await svc.getMockup(ORG_A, project.id);
    assert.equal(all.versions.length, 2);
    assert.ok(all.versions.some((v) => v.status === "CHANGES_REQUESTED"));
  });

  it("NOC getMockup prefers v2 client review over v1 changes requested", async () => {
    const svc = service();
    const project = await mockupProject(svc);
    const v1 = await svc.generateMockup(ORG_A, project.id, 99);
    await svc.sendMockupToClient(ORG_A, project.id, v1.mockup.id, 99, { acknowledgeWarnings: true });
    await svc.clientRequestMockupChanges(ORG_A, project.id, 42, { message: "Cambiar hero" });
    const v2 = await svc.createMockupRevision(ORG_A, project.id, 99);
    await svc.sendMockupToClient(ORG_A, project.id, v2.mockup.id, 99, { acknowledgeWarnings: true });
    const active = await svc.getMockup(ORG_A, project.id);
    assert.equal(active.mockup.version, 2);
    assert.equal(active.mockup.status, "CLIENT_REVIEW");
  });

  it("approved mockup is immutable", async () => {
    const svc = service();
    const project = await mockupProject(svc);
    const generated = await svc.generateMockup(ORG_A, project.id, 99);
    await svc.sendMockupToClient(ORG_A, project.id, generated.mockup.id, 99, {
      acknowledgeWarnings: true
    });
    await svc.clientApproveMockup(ORG_A, project.id, 42);
    await assert.rejects(
      () =>
        svc.updateMockup(ORG_A, project.id, generated.mockup.id, 99, {
          headerVariant: "MINIMAL"
        }),
      (err) => err.code === ERROR_CODES.MOCKUP_NOT_EDITABLE
    );
  });
});

describe("Phase 14 — mockup HTTP", () => {
  it("NOC generate, validate, send-client, start-development", async () => {
    const svc = service();
    const project = await mockupProject(svc);
    const app = nocApp(svc);
    const generated = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/mockup/generate?organization_id=${ORG_A}`
    );
    assert.equal(generated.status, 201);
    const mockupId = generated.json.mockup.id;

    const validate = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/mockup/validate?organization_id=${ORG_A}`,
      { mockupId }
    );
    assert.equal(validate.status, 200);
    assert.notEqual(validate.json.validation.state, "INVALID");

    const sent = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/mockup/send-client?organization_id=${ORG_A}`,
      { mockupId, acknowledgeWarnings: true }
    );
    assert.equal(sent.status, 200);
    assert.equal(sent.json.mockup.status, "CLIENT_REVIEW");

    const clientAppInst = clientApp(svc);
    const approve = await httpCall(
      clientAppInst,
      "POST",
      `/api/client/web-projects/${project.id}/mockup/approve`
    );
    assert.equal(approve.status, 200);
    assert.equal(approve.json.mockup.status, "APPROVED");

    const devBlocked = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/transition?organization_id=${ORG_A}`,
      { toStatus: "DEVELOPMENT" }
    );
    assert.equal(devBlocked.status, 409);
    assert.equal(devBlocked.json.code, ERROR_CODES.DEVELOPMENT_NOT_READY);

    const dev = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/start-development?organization_id=${ORG_A}`
    );
    assert.equal(dev.status, 200);
    assert.equal(dev.json.project.workflowStatus, "DEVELOPMENT");
  });

  it("client safe mockup excludes internal fields", async () => {
    const svc = service();
    const project = await mockupProject(svc);
    const generated = await generateApprovedMockup(svc, ORG_A, project.id, 99);
    await svc.updateMockup(ORG_A, project.id, generated.mockup.id, 99, {
      internalNotes: "Nota interna staff"
    });
    await svc.sendMockupToClient(ORG_A, project.id, generated.mockup.id, 99, {
      acknowledgeWarnings: true
    });
    const app = clientApp(svc);
    const res = await httpCall(app, "GET", `/api/client/web-projects/${project.id}/mockup`);
    assert.equal(res.status, 200);
    assert.equal(res.json.mockup.internalNotes, undefined);
    assert.equal(res.json.validation, undefined);
    assert.equal(res.json.architectureReference, undefined);
  });

  it("request changes requires comment", async () => {
    const svc = service();
    const project = await mockupProject(svc);
    const generated = await generateApprovedMockup(svc, ORG_A, project.id, 99);
    await svc.sendMockupToClient(ORG_A, project.id, generated.mockup.id, 99, {
      acknowledgeWarnings: true
    });
    const app = clientApp(svc);
    const res = await httpCall(app, "POST", `/api/client/web-projects/${project.id}/mockup/request-changes`, {});
    assert.equal(res.status, 400);
    assert.equal(res.json.code, ERROR_CODES.CORRECTION_MESSAGE_REQUIRED);
  });

  it("returns 404 for cross-tenant mockup", async () => {
    const svc = service();
    const project = await mockupProject(svc);
    const app = nocApp(svc);
    await httpCall(app, "POST", `/api/noc/web-projects/${project.id}/mockup/generate?organization_id=${ORG_A}`);
    const res = await httpCall(
      app,
      "GET",
      `/api/noc/web-projects/${project.id}/mockup?organization_id=${ORG_B}`
    );
    assert.equal(res.status, 404);
  });

  it("NOC revision after client changes creates v2 draft and keeps v1 history", async () => {
    const svc = service();
    const project = await mockupProject(svc);
    const noc = nocApp(svc);
    const client = clientApp(svc);
    const generated = await httpCall(
      noc,
      "POST",
      `/api/noc/web-projects/${project.id}/mockup/generate?organization_id=${ORG_A}`
    );
    assert.equal(generated.status, 201);
    const mockupId = generated.json.mockup.id;
    await httpCall(
      noc,
      "POST",
      `/api/noc/web-projects/${project.id}/mockup/send-client?organization_id=${ORG_A}`,
      { mockupId, acknowledgeWarnings: true }
    );
    const changes = await httpCall(
      client,
      "POST",
      `/api/client/web-projects/${project.id}/mockup/request-changes`,
      { message: "Ajustar hero" }
    );
    assert.equal(changes.status, 200);
    const revision = await httpCall(
      noc,
      "POST",
      `/api/noc/web-projects/${project.id}/mockup/revisions?organization_id=${ORG_A}`
    );
    assert.equal(revision.status, 201);
    assert.equal(revision.json.mockup.version, 2);
    assert.equal(revision.json.mockup.status, "DRAFT");
    const all = await httpCall(noc, "GET", `/api/noc/web-projects/${project.id}/mockup?organization_id=${ORG_A}`);
    assert.equal(all.status, 200);
    assert.ok(all.json.versions.some((row) => row.status === "CHANGES_REQUESTED" && row.version === 1));
    assert.equal(all.json.pages.filter((p) => p.pageType === "SERVICE_DETAIL").length, 1);
  });
});

describe("Phase 14 — preview item selector", () => {
  it("lists compatible preview items and updates sample without duplicating templates", async () => {
    const svc = service();
    const project = await mockupProject(svc);
    const generated = await svc.generateMockup(ORG_A, project.id, 99);
    const detailPages = generated.pages.filter((p) => p.pageType === "SERVICE_DETAIL");
    assert.equal(detailPages.length, 1);
    const items = generated.contentPreviewItems.filter((i) => i.itemType === "service");
    assert.ok(items.length >= 2);
    const detailPageId = detailPages[0].id;

    const first = await svc.updateMockup(ORG_A, project.id, generated.mockup.id, 99, {
      previewItemId: items[0].id,
      previewPageId: detailPageId
    });
    assert.equal(first.previewItem.title, items[0].title);
    assert.equal(first.pages.filter((p) => p.pageType === "SERVICE_DETAIL").length, 1);

    const second = await svc.updateMockup(ORG_A, project.id, generated.mockup.id, 99, {
      previewItemId: items[1].id,
      previewPageId: detailPageId
    });
    assert.equal(second.previewItem.title, items[1].title);
    assert.equal(second.pages.filter((p) => p.pageType === "SERVICE_DETAIL").length, 1);
    assert.equal(second.sections.length, generated.sections.length);
  });

  it("rejects incompatible preview item type", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: 1,
      title: "Preview mismatch",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, 1);
    const tourItem = await svc.addItem(ORG_A, project.id, 99, {
      itemType: "tour",
      title: "Tour incompatible",
      payload: { summary: "No encaja" }
    });
    await moveProjectToMockup(svc, ORG_A, project.id, 99);
    const generated = await svc.generateMockup(ORG_A, project.id, 99);
    const detailPage = generated.pages.find((p) => p.pageType === "SERVICE_DETAIL");
    await assert.rejects(
      () =>
        svc.updateMockup(ORG_A, project.id, generated.mockup.id, 99, {
          previewItemId: tourItem.id,
          previewPageId: detailPage.id
        }),
      (err) => err.code === ERROR_CODES.PREVIEW_ITEM_INCOMPATIBLE
    );
  });

  it("returns 404 for unknown preview item", async () => {
    const svc = service();
    const project = await mockupProject(svc);
    const generated = await svc.generateMockup(ORG_A, project.id, 99);
    const detailPage = generated.pages.find((p) => p.pageType === "SERVICE_DETAIL");
    await assert.rejects(
      () =>
        svc.updateMockup(ORG_A, project.id, generated.mockup.id, 99, {
          previewItemId: 999999,
          previewPageId: detailPage.id
        }),
      (err) => err.code === ERROR_CODES.PREVIEW_ITEM_NOT_FOUND
    );
  });

  it("returns 404 for cross-tenant preview item", async () => {
    const svc = service();
    const projectA = await mockupProject(svc);
    const generatedA = await svc.generateMockup(ORG_A, projectA.id, 99);
    const detailPageA = generatedA.pages.find((p) => p.pageType === "SERVICE_DETAIL");

    const projectB = await svc.createProject({
      organizationId: ORG_B,
      actorUserId: 1,
      title: "Org B",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_B, projectB.id, 1);
    const foreignItem = await svc.addItem(ORG_B, projectB.id, 99, {
      itemType: "service",
      title: "Servicio ajeno",
      payload: { summary: "Otro tenant" }
    });

    await assert.rejects(
      () =>
        svc.updateMockup(ORG_A, projectA.id, generatedA.mockup.id, 99, {
          previewItemId: foreignItem.id,
          previewPageId: detailPageA.id
        }),
      (err) => err.code === ERROR_CODES.PREVIEW_ITEM_NOT_FOUND
    );
  });

  it("blocks preview update on approved mockup", async () => {
    const svc = service();
    const project = await mockupProject(svc);
    const generated = await svc.generateMockup(ORG_A, project.id, 99);
    await svc.sendMockupToClient(ORG_A, project.id, generated.mockup.id, 99, {
      acknowledgeWarnings: true
    });
    await svc.clientApproveMockup(ORG_A, project.id, 42);
    const detailPage = generated.pages.find((p) => p.pageType === "SERVICE_DETAIL");
    const item = generated.contentPreviewItems.find((i) => i.itemType === "service");
    await assert.rejects(
      () =>
        svc.updateMockup(ORG_A, project.id, generated.mockup.id, 99, {
          previewItemId: item.id,
          previewPageId: detailPage.id
        }),
      (err) => err.code === ERROR_CODES.MOCKUP_NOT_EDITABLE
    );
  });

  it("HTTP preview selection accepts compatible item and rejects incompatible", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: 1,
      title: "Preview HTTP",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, 1);
    const tourItem = await svc.addItem(ORG_A, project.id, 99, {
      itemType: "tour",
      title: "Tour HTTP",
      payload: { summary: "Incompatible" }
    });
    await moveProjectToMockup(svc, ORG_A, project.id, 99);
    const app = nocApp(svc);
    const generated = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/mockup/generate?organization_id=${ORG_A}`
    );
    const mockupId = generated.json.mockup.id;
    const detailPage = generated.json.pages.find((p) => p.pageType === "SERVICE_DETAIL");
    const serviceItem = generated.json.contentPreviewItems.find((i) => i.itemType === "service");

    const ok = await httpCall(
      app,
      "PATCH",
      `/api/noc/web-projects/${project.id}/mockup?organization_id=${ORG_A}`,
      { mockupId, previewItemId: serviceItem.id, previewPageId: detailPage.id }
    );
    assert.equal(ok.status, 200);
    assert.equal(ok.json.previewItem.id, serviceItem.id);

    const bad = await httpCall(
      app,
      "PATCH",
      `/api/noc/web-projects/${project.id}/mockup?organization_id=${ORG_A}`,
      { mockupId, previewItemId: tourItem.id, previewPageId: detailPage.id }
    );
    assert.equal(bad.status, 409);
    assert.equal(bad.json.code, ERROR_CODES.PREVIEW_ITEM_INCOMPATIBLE);
  });
});

describe("Phase 14 — audit events", () => {
  it("records mockup generated and approved", async () => {
    const store = createMemoryStore();
    const svc = createWebProjectService(store);
    const project = await mockupProject(svc);
    const generated = await svc.generateMockup(ORG_A, project.id, 99);
    await svc.sendMockupToClient(ORG_A, project.id, generated.mockup.id, 99, {
      acknowledgeWarnings: true
    });
    await svc.clientApproveMockup(ORG_A, project.id, 42);
    const actions = store.state.activity.map((row) => row.action_type);
    assert.ok(actions.includes(AUDIT_ACTIONS.MOCKUP_GENERATED));
    assert.ok(actions.includes(AUDIT_ACTIONS.MOCKUP_SENT_TO_CLIENT));
    assert.ok(actions.includes(AUDIT_ACTIONS.MOCKUP_APPROVED));
  });
});
