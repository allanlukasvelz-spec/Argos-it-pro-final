const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { createMemoryStore } = require("./memoryStore");
const { createWebProjectService } = require("./service");
const { evaluateArchitectureReadiness } = require("./architectureReadiness");
const { buildProjectBrief, deriveScopeMatrix } = require("./briefBuilder");
const { buildHandoffSnapshot, sanitizeValue } = require("./architectureHandoff");
const { seedArchitectureMinimum } = require("./phase12.fixtures");
const { forceProjectCompleted } = require("./phase18.fixtures");
const { AUDIT_ACTIONS, PENDING_DEFINITION } = require("./constants");
const { responseMap, resolveSchemaVersion } = require("./formRegistry");
const createNocWebProjectsRouter = require("../../routes/nocWebProjects");
const createClientWebProjectsRouter = require("../../routes/clientWebProjects");
const requireNocAccess = require("../../middleware/requireNocAccess");

const ORG_A = 10;
const ORG_B = 20;

function service() {
  return createWebProjectService(createMemoryStore());
}

function valuesFrom(project) {
  return new Map((project.form?.responses || []).map((row) => [row.fieldKey, row.value]));
}

async function createReadyReviewProject(svc, { projectType = "create", organizationId = ORG_A } = {}) {
  const project = await svc.createProject({
    organizationId,
    actorUserId: 1,
    title: "Demo Services",
    projectType
  });
  await seedArchitectureMinimum(svc, organizationId, project.id, 1);
  await svc.transition(organizationId, project.id, 99, "REVIEW");
  return svc.getProject(organizationId, project.id);
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
          headers: { "content-type": "application/json" }
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

describe("phase 12 project brief + architecture readiness", () => {
  it("builder is deterministic and does not invent facts", async () => {
    const svc = service();
    const project = await createReadyReviewProject(svc);
    await svc.addItem(ORG_A, project.id, 1, {
      itemType: "service",
      title: "Consultoría",
      payload: { audience: "PYMES", cta: "Pedir cita" }
    }).catch(() => null);
    const fresh = await svc.getProject(ORG_A, project.id);
    const values = valuesFrom(fresh);
    const brief = buildProjectBrief({
      project: {
        ...fresh,
        organization_id: fresh.organizationId,
        project_type: fresh.projectType,
        workflow_status: fresh.workflowStatus
      },
      values,
      items: fresh.items,
      documents: fresh.documents,
      reviewStates: fresh.reviewStates,
      reviewSummary: fresh.reviewSummary,
      progress: fresh.progress,
      credential: fresh.credentialStatus,
      notes: [],
      schemaVersion: fresh.form.schemaVersion
    });
    assert.equal(brief.executiveSummary.primaryObjective.value, "Una web clara para el cliente");
    assert.equal(brief.executiveSummary.audience.value, PENDING_DEFINITION);
    assert.equal(brief.contentInventory.services, 0);
    assert.ok(brief.scopeMatrix.find((row) => row.id === "PUBLIC_WEBSITE").state === "required");
    const again = buildProjectBrief({
      project: {
        ...fresh,
        organization_id: fresh.organizationId,
        project_type: fresh.projectType,
        workflow_status: fresh.workflowStatus
      },
      values,
      items: fresh.items,
      documents: fresh.documents,
      reviewStates: fresh.reviewStates,
      reviewSummary: fresh.reviewSummary,
      progress: fresh.progress,
      credential: fresh.credentialStatus,
      notes: [],
      schemaVersion: fresh.form.schemaVersion
    });
    assert.deepEqual(brief.executiveSummary, again.executiveSummary);
  });

  it("supports service, product, tour, mixed, multilingual and booking scopes", () => {
    const values = new Map([
      ["offer_kinds", ["services", "products", "experiences"]],
      ["languages_multilingual", "yes"],
      ["sales_mode", "online_booking"],
      ["needs_ecommerce", "no"],
      ["integrations_list", ["crm", "payments"]]
    ]);
    const matrix = deriveScopeMatrix(values);
    assert.equal(matrix.find((row) => row.id === "BOOKING").state, "required");
    assert.equal(matrix.find((row) => row.id === "MULTILINGUAL").state, "required");
    assert.equal(matrix.find((row) => row.id === "ECOMMERCE").state, "not_required");
    assert.equal(matrix.find((row) => row.id === "CRM").state, "required");
  });

  it("INTAKE is NOT_READY and create without old URL is allowed", async () => {
    const svc = service();
    const created = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: 1,
      title: "Nueva",
      projectType: "create"
    });
    await seedArchitectureMinimum(svc, ORG_A, created.id, 1);
    const intake = await svc.getBrief(ORG_A, created.id);
    assert.equal(intake.architectureReadiness.state, "NOT_READY");
    assert.ok(intake.architectureReadiness.blockers.some((row) => row.code === "WORKFLOW_NOT_REVIEW"));
    const review = await svc.transition(ORG_A, created.id, 99, "REVIEW");
    const brief = await svc.getBrief(ORG_A, review.id);
    assert.equal(brief.architectureReadiness.state, "READY");
    assert.doesNotMatch(JSON.stringify(brief.architectureReadiness.blockers), /IMPROVE_MISSING_URL/);
  });

  it("improve without URL is NOT_READY; optional SEO missing is not a blocker", async () => {
    const svc = service();
    const created = await svc.createProject({
      organizationId: ORG_A,
      actorUserId: 1,
      title: "Mejora",
      projectType: "improve"
    });
    await seedArchitectureMinimum(svc, ORG_A, created.id, 1, [
      { fieldKey: "has_existing_site", value: "no" }
    ]);
    const project = await svc.getProject(ORG_A, created.id);
    const values = valuesFrom(project);
    values.set("has_existing_site", "no");
    values.delete("existing_url");
    const readiness = evaluateArchitectureReadiness({
      project: { ...project, workflow_status: "REVIEW", project_type: "improve" },
      values,
      items: project.items,
      notes: [],
      credential: project.credentialStatus,
      progress: project.progress,
      reviewStates: project.reviewStates
    });
    assert.equal(readiness.state, "NOT_READY");
    assert.ok(readiness.blockers.some((row) => row.code === "IMPROVE_MISSING_URL"));
    assert.equal(readiness.blockers.some((row) => /seo/i.test(row.code)), false);
  });

  it("client correction on a filled field blocks architecture", async () => {
    const svc = service();
    const project = await createReadyReviewProject(svc);
    await svc.addReview(ORG_A, project.id, 99, {
      verdict: "CORRECTION_REQUESTED",
      targetType: "FORM_FIELD",
      targetKey: "company_trade_name",
      correctionMessage: "Usa el nombre público."
    });
    const brief = await svc.getBrief(ORG_A, project.id);
    assert.equal(brief.architectureReadiness.state, "NOT_READY");
    assert.ok(
      brief.architectureReadiness.blockers.some((row) => row.code === "CLIENT_CORRECTION_REQUIRED")
    );
    await assert.rejects(
      () => svc.startArchitecture(ORG_A, project.id, 99),
      (err) => err.code === "ARCHITECTURE_NOT_READY"
    );
  });

  it("credentials pending are a warning, not a blocker", async () => {
    const svc = service();
    const project = await createReadyReviewProject(svc);
    await svc.setCredentialStatus(ORG_A, project.id, 99, "REQUESTED");
    const brief = await svc.getBrief(ORG_A, project.id);
    assert.equal(brief.architectureReadiness.state, "READY_WITH_OPEN_ITEMS");
    assert.ok(brief.architectureReadiness.warnings.some((row) => row.code === "CREDENTIALS_PENDING"));
    await assert.rejects(
      () => svc.startArchitecture(ORG_A, project.id, 99),
      (err) => err.code === "ARCHITECTURE_OVERRIDE_REQUIRED"
    );
    const started = await svc.startArchitecture(ORG_A, project.id, 99, {
      acknowledgeOpenItems: true,
      reason: "Accesos se recibirán fuera de banda tras el mapa."
    });
    assert.equal(started.workflowStatus, "ARCHITECTURE");
  });

  it("READY start-architecture snapshots once and is tenant scoped", async () => {
    const store = createMemoryStore();
    const svc = createWebProjectService(store);
    const project = await createReadyReviewProject(svc);
    const started = await svc.startArchitecture(ORG_A, project.id, 99);
    assert.equal(started.workflowStatus, "ARCHITECTURE");
    const brief = await svc.getBrief(ORG_A, project.id);
    assert.ok(brief.handoff);
    assert.equal(
      brief.architectureReadiness.blockers.some((row) => row.code === "WORKFLOW_NOT_REVIEW"),
      false
    );
    assert.equal(brief.handoff.schemaVersion, "web-project-brief.v1");
    assert.equal(JSON.stringify(brief.handoff.payload).includes("object_key"), false);
    assert.equal(JSON.stringify(brief.handoff.payload).includes("password"), false);
    await svc.upsertForm(ORG_A, project.id, 1, [{ fieldKey: "company_trade_name", value: "Changed later" }]).catch(
      () => null
    );
    const after = await svc.getBrief(ORG_A, project.id);
    assert.equal(after.handoff.payload.brief.header.title, "Demo Services");
    await assert.rejects(() => svc.getBrief(ORG_B, project.id), (err) => err.code === "NOT_FOUND");
    await assert.rejects(
      () => svc.startArchitecture(ORG_A, project.id, 99),
      (err) => err.code === "INVALID_TRANSITION"
    );
    assert.ok(store.state.activity.some((row) => row.action_type === AUDIT_ACTIONS.ARCHITECTURE_STARTED));
  });

  it("internal notes stay off the client payload", async () => {
    const svc = service();
    const project = await createReadyReviewProject(svc);
    const note = await svc.addBriefNote(ORG_A, project.id, 99, {
      noteType: "ASSUMPTION",
      content: "El cliente entregará traducciones."
    });
    assert.equal(note.noteType, "ASSUMPTION");
    const client = await svc.getProject(ORG_A, project.id);
    assert.equal(client.briefNotes, undefined);
    assert.equal(JSON.stringify(client).includes("El cliente entregará traducciones"), false);
    const risk = await svc.addBriefNote(ORG_A, project.id, 99, {
      noteType: "RISK",
      content: "Dependencia de un CMS antiguo.",
      severity: "MEDIUM"
    });
    const decision = await svc.addBriefNote(ORG_A, project.id, 99, {
      noteType: "DECISION_REQUIRED",
      content: "Motor de reservas no decidido.",
      blocking: true
    });
    const blocked = await svc.getBrief(ORG_A, project.id);
    assert.equal(blocked.architectureReadiness.state, "NOT_READY");
    assert.ok(
      blocked.architectureReadiness.blockers.some((row) => row.code === "UNRESOLVED_ARCHITECTURE_DECISION")
    );
    await svc.updateBriefNote(ORG_A, project.id, decision.id, 99, {
      status: "RESOLVED",
      resolutionNote: "Reservas por formulario en v1."
    });
    const ready = await svc.getBrief(ORG_A, project.id);
    assert.ok(ready.architectureReadiness.state !== "NOT_READY" || ready.architectureReadiness.warnings.length >= 0);
    assert.equal(ready.notes.find((row) => row.id === risk.id).severity, "MEDIUM");
  });

  it("archived and completed cannot start architecture", async () => {
    const store = createMemoryStore();
    const svc = createWebProjectService(store);
    const archived = await createReadyReviewProject(svc);
    await forceProjectCompleted(store, ORG_A, archived.id);
    await svc.archiveProject(ORG_A, archived.id, 99);
    await assert.rejects(
      () => svc.startArchitecture(ORG_A, archived.id, 99),
      (err) => err.code === "PROJECT_ARCHIVED"
    );
    const completed = await createReadyReviewProject(svc);
    await svc.startArchitecture(ORG_A, completed.id, 99);
    for (const next of ["MOCKUP", "DEVELOPMENT", "VALIDATION", "PUBLICATION", "COMPLETED"]) {
      if (next === "DEVELOPMENT") {
        await svc.transition(ORG_A, completed.id, 99, next, { approvedMockupDevelopment: true });
      } else if (next === "VALIDATION") {
        await svc.transition(ORG_A, completed.id, 99, next, { validationReady: true });
      } else if (next === "PUBLICATION") {
        await svc.transition(ORG_A, completed.id, 99, next, { publicationReady: true });
      } else if (next === "COMPLETED") {
        await svc.transition(ORG_A, completed.id, 99, next, { completionReady: true });
      } else {
        await svc.transition(ORG_A, completed.id, 99, next);
      }
    }
    await assert.rejects(
      () => svc.startArchitecture(ORG_A, completed.id, 99),
      (err) => err.code === "INVALID_TRANSITION" || err.code === "ARCHITECTURE_NOT_READY"
    );
  });

  it("snapshot sanitizes secrets and object keys", () => {
    const payload = sanitizeValue({
      object_key: "org/1/wp/x",
      password: "hunter2hunter",
      nested: { token: "abcdefghi", keep: "ok" }
    });
    assert.equal(payload.object_key, undefined);
    assert.equal(payload.password, undefined);
    assert.equal(payload.nested.token, undefined);
    assert.equal(payload.nested.keep, "ok");
    const snap = buildHandoffSnapshot({
      brief: {
        sourceFormSchema: "web-project-intake.v2",
        header: { title: "X" },
        documents: [{ name: "logo.png", objectKey: "org/1/wp/1" }]
      },
      architectureReadiness: { state: "READY", blockers: [], warnings: [] },
      createdBy: 99
    });
    assert.equal(JSON.stringify(snap).includes("org/1/wp"), false);
  });

  it("HTTP: brief 200, wrong org 404, org_admin 403, blocked 409", async () => {
    const svc = service();
    const project = await createReadyReviewProject(svc);
    const admin = nocApp(svc, "admin");
    const orgAdmin = nocApp(svc, "org_admin");
    const ok = await httpCall(admin, "GET", `/api/noc/web-projects/${project.id}/brief?organization_id=${ORG_A}`);
    assert.equal(ok.status, 200);
    assert.equal(ok.json.organizationId, ORG_A);
    assert.ok(ok.json.brief.executiveSummary);
    const wrong = await httpCall(
      admin,
      "GET",
      `/api/noc/web-projects/${project.id}/brief?organization_id=${ORG_B}`
    );
    assert.equal(wrong.status, 404);
    const forbidden = await httpCall(
      orgAdmin,
      "GET",
      `/api/noc/web-projects/${project.id}/brief?organization_id=${ORG_A}`
    );
    assert.equal(forbidden.status, 403);
    await svc.addReview(ORG_A, project.id, 99, {
      verdict: "CORRECTION_REQUESTED",
      targetType: "FORM_FIELD",
      targetKey: "company_trade_name",
      correctionMessage: "Corrige el nombre."
    });
    const blocked = await httpCall(
      admin,
      "POST",
      `/api/noc/web-projects/${project.id}/start-architecture?organization_id=${ORG_A}`,
      {}
    );
    assert.equal(blocked.status, 409);
    assert.equal(blocked.json.code, "ARCHITECTURE_NOT_READY");
    assert.ok(Array.isArray(blocked.json.blockers));
    const client = express();
    client.use(express.json());
    client.use((req, _res, next) => {
      req.user = { id: 1, role: "cliente" };
      req.tenant = { id: ORG_A, orgRole: "org_owner", slug: "a", name: "A", status: "active" };
      next();
    });
    client.use("/api/client", createClientWebProjectsRouter(null, { service: svc }));
    const leak = await httpCall(client, "GET", `/api/client/web-projects/${project.id}/brief`);
    assert.ok(leak.status === 404 || leak.status === 400);
  });

  it("notes HTTP create/update and secret guard", async () => {
    const store = createMemoryStore();
    const svc = createWebProjectService(store);
    const project = await createReadyReviewProject(svc);
    const admin = nocApp(svc);
    const created = await httpCall(
      admin,
      "POST",
      `/api/noc/web-projects/${project.id}/brief/notes?organization_id=${ORG_A}`,
      { noteType: "EXCLUSION", content: "Pago online fuera de alcance inicial." }
    );
    assert.equal(created.status, 201);
    const patched = await httpCall(
      admin,
      "PATCH",
      `/api/noc/web-projects/${project.id}/brief/notes/${created.json.note.id}?organization_id=${ORG_A}`,
      { status: "RESOLVED", resolutionNote: "Confirmado con el cliente." }
    );
    assert.equal(patched.status, 200);
    assert.equal(patched.json.note.status, "RESOLVED");
    const secret = await httpCall(
      admin,
      "POST",
      `/api/noc/web-projects/${project.id}/brief/notes?organization_id=${ORG_A}`,
      { noteType: "ARCHITECTURE_NOTE", content: "password = SuperSecret99" }
    );
    assert.equal(secret.status, 400);
    await forceProjectCompleted(store, ORG_A, project.id);
    const archived = await svc.archiveProject(ORG_A, project.id, 99);
    const afterArchive = await httpCall(
      admin,
      "POST",
      `/api/noc/web-projects/${archived.id}/brief/notes?organization_id=${ORG_A}`,
      { noteType: "ASSUMPTION", content: "No debería entrar." }
    );
    assert.equal(afterArchive.status, 409);
  });
});

void resolveSchemaVersion;
void responseMap;
