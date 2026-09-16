const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { createMemoryStore } = require("./memoryStore");
const { createWebProjectService } = require("./service");
const { generateValidationChecks } = require("./validationPlanGenerator");
const { deriveExecutionProgress, derivePassRate, evaluateValidationReadiness } = require("./validationReadiness");
const { assertCheckTransition, assertDefectTransition } = require("./validationOperations");
const { seedServiceBusiness, seedTourBusiness } = require("./phase13.fixtures");
const { bootstrapValidationPhase, bootstrapValidationReady } = require("./phase16.fixtures");
const { ERROR_CODES } = require("./constants");
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

describe("Phase 16 — validation domain", () => {
  it("generator creates global and page checks", () => {
    const checks = generateValidationChecks({
      architecturePages: [
        { id: 1, page_type: "HOME", title: "Inicio", archived_at: null },
        { id: 2, page_type: "SERVICE_DETAIL", title: "Servicio", template_type: "DETAIL", archived_at: null }
      ],
      architectureBlocks: [{ block_type: "CONTACT_FORM", archived_at: null }],
      mockupPages: [{ id: 10, architecture_page_id: 1, archived_at: null }],
      mockupSections: [],
      developmentItems: [],
      items: [],
      formValues: new Map([["sales_mode", { value: "contact_forms" }]]),
      projectType: "create"
    });
    assert.ok(checks.some((c) => c.category === "STRUCTURE"));
    assert.ok(checks.some((c) => c.category === "FORM"));
    const templates = checks.filter((c) => c.template_group_key === "SERVICE_DETAIL");
    assert.equal(templates.length, 3);
  });

  it("template reuse: 10 tours → one TOUR_DETAIL template group", () => {
    const checks = generateValidationChecks({
      architecturePages: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        page_type: "TOUR_DETAIL",
        title: `Tour ${i + 1}`,
        template_type: "DETAIL",
        archived_at: null
      })),
      architectureBlocks: [],
      mockupPages: [],
      mockupSections: [],
      developmentItems: [],
      items: [{ id: 100, item_type: "tour", title: "Demo Activity A", archived_at: null }],
      formValues: new Map(),
      projectType: "create"
    });
    const groups = new Set(checks.filter((c) => c.template_group_key === "TOUR_DETAIL").map((c) => c.title));
    assert.equal(groups.size, 3);
  });

  it("check status transitions", () => {
    assert.doesNotThrow(() => assertCheckTransition("PENDING", "IN_PROGRESS"));
    assert.doesNotThrow(() => assertCheckTransition("IN_PROGRESS", "PASS"));
    assert.doesNotThrow(() => assertCheckTransition("IN_PROGRESS", "FAIL"));
    assert.throws(() => assertCheckTransition("PENDING", "PASS"));
  });

  it("defect transitions require WONT_FIX reason policy via operations", () => {
    assert.doesNotThrow(() => assertDefectTransition("OPEN", "IN_PROGRESS"));
    assert.doesNotThrow(() => assertDefectTransition("FIXED", "RETEST_REQUIRED"));
    assert.throws(() => assertDefectTransition("VERIFIED", "OPEN"));
  });

  it("prepare validation is idempotent", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Phase 16",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, ACTOR);
    await bootstrapValidationPhase(svc, ORG_A, project.id, ACTOR);
    const first = await svc.prepareValidationPlan(ORG_A, project.id, ACTOR);
    const second = await svc.prepareValidationPlan(ORG_A, project.id, ACTOR);
    assert.equal(first.plan?.id, second.plan?.id);
    assert.equal(first.checks.length, second.checks.length);
  });

  it("required PENDING blocks publication readiness", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Readiness",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, ACTOR);
    await bootstrapValidationReady(svc, ORG_A, project.id, ACTOR);
    const payload = await svc.getValidation(ORG_A, project.id);
    assert.equal(payload.readiness.state, "NOT_READY");
    await assert.rejects(
      () => svc.startPublication(ORG_A, project.id, ACTOR),
      (err) => err.code === ERROR_CODES.PUBLICATION_NOT_READY
    );
  });

  it("FAIL + defect blocks; retest PASS verifies", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Defect loop",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, ACTOR);
    await bootstrapValidationReady(svc, ORG_A, project.id, ACTOR);
    const initial = await svc.getValidation(ORG_A, project.id);
    const required = initial.checks.find((c) => c.required);
    assert.ok(required);
    await svc.updateValidationCheck(ORG_A, project.id, required.id, ACTOR, { status: "IN_PROGRESS" });
    await svc.updateValidationCheck(ORG_A, project.id, required.id, ACTOR, {
      status: "FAIL",
      actualResult: "No coincide con maqueta"
    });
    await svc.createValidationDefect(ORG_A, project.id, required.id, ACTOR, {
      title: "Visual incorrecto",
      severity: "HIGH",
      description: "Hero desalineado"
    });
    const blocked = await svc.getValidation(ORG_A, project.id);
    assert.equal(blocked.readiness.state, "NOT_READY");
    const defect = blocked.defects[0];
    await svc.updateValidationDefect(ORG_A, project.id, defect.id, ACTOR, { status: "IN_PROGRESS" });
    await svc.updateValidationDefect(ORG_A, project.id, defect.id, ACTOR, { status: "FIXED" });
    assert.equal(
      (await svc.getValidation(ORG_A, project.id)).defects[0].status,
      "RETEST_REQUIRED"
    );
    await svc.retestValidationDefect(ORG_A, project.id, defect.id, ACTOR, {
      checkStatus: "PASS",
      note: "Corregido"
    });
    const after = await svc.getValidation(ORG_A, project.id);
    assert.equal(after.defects[0].status, "VERIFIED");
    assert.ok(after.checks.find((c) => c.id === required.id)?.history?.length >= 2);
  });

  it("NOT_TESTABLE required blocks publication", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Booking NT",
      projectType: "create"
    });
    await seedTourBusiness(svc, ORG_A, project.id, ACTOR);
    await bootstrapValidationReady(svc, ORG_A, project.id, ACTOR);
    const payload = await svc.getValidation(ORG_A, project.id);
    const booking = payload.checks.find((c) => c.category === "BOOKING" && c.required);
    assert.ok(booking);
    await svc.updateValidationCheck(ORG_A, project.id, booking.id, ACTOR, {
      status: "NOT_TESTABLE",
      statusReason: "Sin implementación verificable"
    });
    const after = await svc.getValidation(ORG_A, project.id);
    assert.equal(after.readiness.state, "NOT_READY");
  });

  it("execution progress and pass rate derived", () => {
    const checks = [
      { status: "PASS", required: true },
      { status: "FAIL", required: true },
      { status: "PENDING", required: true },
      { status: "NOT_APPLICABLE", required: false }
    ];
    const exec = deriveExecutionProgress(checks);
    assert.equal(exec.total, 3);
    assert.equal(exec.evaluated, 2);
    const pass = derivePassRate(checks);
    assert.equal(pass.evaluated, 2);
    assert.equal(pass.passed, 1);
  });

  it("secret guard on evidence URL", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Secrets",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, ACTOR);
    await bootstrapValidationReady(svc, ORG_A, project.id, ACTOR);
    const check = (await svc.getValidation(ORG_A, project.id)).checks[0];
    await assert.rejects(
      () =>
        svc.attachValidationEvidence(ORG_A, project.id, check.id, ACTOR, {
          evidenceType: "URL",
          url: "javascript:alert(1)"
        }),
      (err) => err.status === 400
    );
  });

  it("cross-tenant validation read 404 HTTP", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Tenant",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, ACTOR);
    await bootstrapValidationReady(svc, ORG_A, project.id, ACTOR);
    const app = nocApp(svc);
    const res = await httpCall(
      app,
      "GET",
      `/api/noc/web-projects/${project.id}/validation?organization_id=${ORG_B}`
    );
    assert.equal(res.status, 404);
  });

  it("generic VALIDATION→PUBLICATION blocked without gate", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Gate",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, ACTOR);
    await bootstrapValidationPhase(svc, ORG_A, project.id, ACTOR);
    await assert.rejects(
      () => svc.transition(ORG_A, project.id, ACTOR, "PUBLICATION"),
      (err) => err.code === ERROR_CODES.PUBLICATION_NOT_READY
    );
  });

  it("HTTP prepare + pass all required + start publication", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "HTTP pub",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, ACTOR);
    await bootstrapValidationPhase(svc, ORG_A, project.id, ACTOR);
    const app = nocApp(svc);
    const prepared = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/validation/prepare?organization_id=${ORG_A}`
    );
    assert.equal(prepared.status, 200);
    assert.ok(prepared.json.checks.length > 0);
    for (const check of prepared.json.checks.filter((c) => c.required)) {
      if (check.status === "NOT_APPLICABLE") continue;
      await httpCall(
        app,
        "PATCH",
        `/api/noc/web-projects/${project.id}/validation/checks/${check.id}?organization_id=${ORG_A}`,
        { status: "IN_PROGRESS" }
      );
      const passBody =
        check.category === "BOOKING" || check.category === "ECOMMERCE"
          ? { status: "NOT_APPLICABLE", statusReason: "Fuera de alcance en entorno de prueba" }
          : { status: "PASS" };
      const res = await httpCall(
        app,
        "PATCH",
        `/api/noc/web-projects/${project.id}/validation/checks/${check.id}?organization_id=${ORG_A}`,
        passBody
      );
      assert.equal(res.status, 200, `check ${check.id} ${check.category}`);
    }
    const pub = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/start-publication?organization_id=${ORG_A}`,
      { acknowledgeWarnings: true }
    );
    assert.equal(pub.status, 200);
    assert.ok(pub.json.publicationHandoff);
    const updated = await svc.getProject(ORG_A, project.id);
    assert.equal(updated.workflowStatus, "PUBLICATION");
  });
});
