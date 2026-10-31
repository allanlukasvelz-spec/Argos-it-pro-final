const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { createMemoryStore } = require("./memoryStore");
const { createWebProjectService } = require("./service");
const { generatePublicationSteps } = require("./publicationPlanGenerator");
const { deriveProgress, evaluatePublicationReadiness } = require("./publicationReadiness");
const { assertStatusTransition } = require("./publicationOperations");
const { seedServiceBusiness } = require("./phase13.fixtures");
const {
  bootstrapPublicationPhase,
  bootstrapPublicationReady,
  completeRequiredPublicationSteps
} = require("./phase17.fixtures");
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

describe("Phase 17 — publication domain", () => {
  it("generator creates deterministic go-live steps", () => {
    const steps = generatePublicationSteps({
      projectType: "create",
      formValues: new Map([
        ["has_existing_site", "no"],
        ["sales_mode", "contact_forms"],
        ["legal_notice", "yes"]
      ]),
      publicationHandoffPayload: { warnings: [{ code: "X" }] },
      websiteHostname: "demo.example.test"
    });
    assert.ok(steps.some((s) => s.step_type === "PRELAUNCH_REVIEW"));
    assert.ok(steps.some((s) => s.step_type === "DNS_PREP"));
    assert.ok(steps.some((s) => s.step_type === "LEGAL_LAUNCH"));
    assert.ok(steps.some((s) => s.step_type === "INTEGRATIONS"));
    const dns = steps.find((s) => s.step_type === "DNS_PREP");
    assert.match(dns.description, /demo\.example\.test/);
  });

  it("improve project adds redirects step", () => {
    const steps = generatePublicationSteps({
      projectType: "improve",
      formValues: new Map([["has_existing_site", "no"]]),
      publicationHandoffPayload: {}
    });
    assert.ok(steps.some((s) => s.step_type === "REDIRECTS"));
  });

  it("step status transitions", () => {
    assert.doesNotThrow(() => assertStatusTransition("TODO", "READY"));
    assert.doesNotThrow(() => assertStatusTransition("REVIEW", "DONE"));
    assert.throws(() => assertStatusTransition("TODO", "DONE"));
  });

  it("prepare publication plan is idempotent", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Phase 17",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, ACTOR);
    await bootstrapPublicationPhase(svc, ORG_A, project.id, ACTOR);
    const first = await svc.preparePublicationPlan(ORG_A, project.id, ACTOR);
    const second = await svc.preparePublicationPlan(ORG_A, project.id, ACTOR);
    assert.equal(first.plan?.id, second.plan?.id);
    assert.equal(first.steps.length, second.steps.length);
  });

  it("required incomplete blocks completion readiness", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Readiness",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, ACTOR);
    await bootstrapPublicationPhase(svc, ORG_A, project.id, ACTOR);
    await svc.preparePublicationPlan(ORG_A, project.id, ACTOR);
    const payload = await svc.getPublication(ORG_A, project.id);
    assert.equal(payload.readiness.state, "NOT_READY");
    await assert.rejects(
      () => svc.completeProject(ORG_A, project.id, ACTOR),
      (err) => err.code === ERROR_CODES.COMPLETION_NOT_READY
    );
  });

  it("blocker keeps step blocked until resolved", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Blocker",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, ACTOR);
    await bootstrapPublicationPhase(svc, ORG_A, project.id, ACTOR);
    await svc.preparePublicationPlan(ORG_A, project.id, ACTOR);
    const step = (await svc.getPublication(ORG_A, project.id)).steps.find((s) => s.required);
    assert.ok(step);
    await svc.blockPublicationStep(ORG_A, project.id, step.id, ACTOR, {
      blockerType: "DNS_PROVIDER",
      description: "Esperando acceso al panel DNS"
    });
    const blocked = await svc.getPublication(ORG_A, project.id);
    assert.equal(blocked.steps.find((s) => s.id === step.id)?.status, "BLOCKED");
    assert.equal(blocked.readiness.state, "NOT_READY");
    await svc.unblockPublicationStep(ORG_A, project.id, step.id, ACTOR, {
      resolutionNote: "Acceso recibido"
    });
    const unblocked = await svc.getPublication(ORG_A, project.id);
    assert.equal(unblocked.steps.find((s) => s.id === step.id)?.status, "READY");
  });

  it("generic PUBLICATION→COMPLETED blocked without gate", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Gate",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, ACTOR);
    await bootstrapPublicationPhase(svc, ORG_A, project.id, ACTOR);
    await assert.rejects(
      () => svc.transition(ORG_A, project.id, ACTOR, "COMPLETED"),
      (err) => err.code === ERROR_CODES.COMPLETION_NOT_READY
    );
  });

  it("HTTP prepare + complete steps + finish project", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "HTTP complete",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, ACTOR);
    await bootstrapPublicationPhase(svc, ORG_A, project.id, ACTOR);
    const app = nocApp(svc);
    const prepared = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/publication/prepare?organization_id=${ORG_A}`
    );
    assert.equal(prepared.status, 200);
    assert.ok(prepared.json.steps.length > 0);
    for (const step of prepared.json.steps.filter(
      (s) => s.required && s.status !== "NOT_APPLICABLE"
    )) {
      for (const status of ["READY", "IN_PROGRESS", "REVIEW", "DONE"]) {
        const res = await httpCall(
          app,
          "PATCH",
          `/api/noc/web-projects/${project.id}/publication/steps/${step.id}?organization_id=${ORG_A}`,
          { status }
        );
        assert.equal(res.status, 200, `step ${step.id} → ${status}`);
      }
    }
    const done = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/complete?organization_id=${ORG_A}`,
      { acknowledgeWarnings: true }
    );
    assert.equal(done.status, 200);
    assert.ok(done.json.completionHandoff);
    const updated = await svc.getProject(ORG_A, project.id);
    assert.equal(updated.workflowStatus, "COMPLETED");
    assert.ok(updated.completedAt);
  });

  it("completion handoff is immutable on repeat complete", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Immutable",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, ACTOR);
    await bootstrapPublicationReady(svc, ORG_A, project.id, ACTOR);
    const first = await svc.completeProject(ORG_A, project.id, ACTOR, { acknowledgeWarnings: true });
    const handoffId = first.completionHandoff?.id;
    assert.ok(handoffId);
    const second = await svc.completeProject(ORG_A, project.id, ACTOR, { acknowledgeWarnings: true });
    assert.equal(second.completionHandoff?.id, handoffId);
  });

  it("cross-tenant publication read 404 HTTP", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: ACTOR,
      title: "Tenant",
      projectType: "create"
    });
    await seedServiceBusiness(svc, ORG_A, project.id, ACTOR);
    await bootstrapPublicationPhase(svc, ORG_A, project.id, ACTOR);
    const app = nocApp(svc);
    const res = await httpCall(
      app,
      "GET",
      `/api/noc/web-projects/${project.id}/publication?organization_id=${ORG_B}`
    );
    assert.equal(res.status, 404);
  });

  it("progress derived from steps", () => {
    const steps = [
      { status: "DONE", required: true },
      { status: "TODO", required: true },
      { status: "NOT_APPLICABLE", required: false }
    ];
    const progress = deriveProgress(steps);
    assert.equal(progress.total, 2);
    assert.equal(progress.done, 1);
    assert.equal(progress.percent, 50);
    const readiness = evaluatePublicationReadiness({
      project: { workflow_status: "PUBLICATION" },
      publicationHandoff: { id: 1 },
      plan: { id: 1 },
      steps,
      blockers: [],
      openDecisions: []
    });
    assert.equal(readiness.state, "NOT_READY");
  });
});
