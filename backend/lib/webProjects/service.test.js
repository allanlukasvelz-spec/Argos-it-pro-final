const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createMemoryStore } = require("./memoryStore");
const { createWebProjectService, serializeCredential } = require("./service");
const { calculateProgress } = require("./progress");
const { canTransition } = require("./workflow");
const { looksLikeSecret } = require("./secrets");
const { assertWebProjectObjectKey } = require("./objectKey");
const { CREDENTIAL_STATUSES, FORM_SCHEMA_VERSION, FORM_SCHEMA_VERSION_V1 } = require("./constants");
const { WebProjectError } = require("./errors");

function service() {
  return createWebProjectService(createMemoryStore());
}

describe("webProjects domain", () => {
  it("creates and lists only the given organization", async () => {
    const svc = service();
    const a = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Sitio A",
      projectType: "create",
      source: "test"
    });
    await svc.createProject({
      organizationId: 20,
      actorUserId: 2,
      title: "Sitio B",
      projectType: "improve",
      source: "test"
    });
    const listA = await svc.listProjects(10);
    assert.equal(listA.length, 1);
    assert.equal(listA[0].id, a.id);
    assert.equal(listA[0].workflowStatus, "INTAKE");
  });

  it("rejects org B fetch and mutate of org A", async () => {
    const svc = service();
    const a = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Sitio A",
      projectType: "create"
    });
    await assert.rejects(() => svc.getProject(20, a.id), (err) => err.code === "NOT_FOUND");
    await assert.rejects(
      () => svc.updateProject(20, a.id, 2, { title: "Hack" }),
      (err) => err.code === "NOT_FOUND"
    );
  });

  it("accepts valid transitions and rejects invalid ones", async () => {
    const svc = service();
    const a = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Sitio A",
      projectType: "create"
    });
    assert.equal(canTransition("INTAKE", "REVIEW"), true);
    assert.equal(canTransition("INTAKE", "COMPLETED"), false);
    const next = await svc.transition(10, a.id, 1, "REVIEW");
    assert.equal(next.workflowStatus, "REVIEW");
    await assert.rejects(() => svc.transition(10, a.id, 1, "COMPLETED"), (err) => {
      return err instanceof WebProjectError && err.code === "INVALID_TRANSITION";
    });
  });

  it("archives without destroying the project", async () => {
    const svc = service();
    const storeRef = createMemoryStore();
    const scoped = createWebProjectService(storeRef);
    const a = await scoped.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Sitio A",
      projectType: "create"
    });
    await storeRef.updateProject(10, a.id, {
      workflow_status: "COMPLETED",
      completed_at: new Date().toISOString()
    });
    const archived = await scoped.archiveProject(10, a.id, 1);
    assert.ok(archived.archivedAt);
    assert.equal(storeRef.state.projects.length, 1);
    assert.equal(storeRef.state.projects[0].title, "Sitio A");
    const active = await scoped.listProjects(10);
    assert.equal(active.length, 0);
    const all = await scoped.listProjects(10, { includeArchived: true });
    assert.equal(all.length, 1);
  });

  it("scopes form responses and items to the project organization", async () => {
    const svc = service();
    const a = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Sitio A",
      projectType: "create"
    });
    await svc.upsertForm(10, a.id, 1, [
      { fieldKey: "site_kind", value: "corporate" },
      { fieldKey: "has_existing_site", value: "no" }
    ]);
    await svc.addItem(10, a.id, 1, { itemType: "tour", title: "Ruta demo" });
    await assert.rejects(
      () => svc.upsertForm(20, a.id, 2, [{ fieldKey: "site_kind", value: "landing" }]),
      (err) => err.code === "NOT_FOUND"
    );
    await assert.rejects(
      () => svc.addItem(20, a.id, 2, { itemType: "page", title: "X" }),
      (err) => err.code === "NOT_FOUND"
    );
    const loaded = await svc.getProject(10, a.id);
    assert.equal(loaded.form.schemaVersion, FORM_SCHEMA_VERSION);
    assert.equal(loaded.items[0].itemType, "tour");
  });

  it("scopes document metadata and never claims CLEAN scan", async () => {
    const svc = service();
    const a = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Sitio A",
      projectType: "create"
    });
    const doc = await svc.addDocumentMetadata(10, a.id, 1, {
      originalFilename: "brief.pdf",
      requirementKey: "brief",
      declaredExtension: ".pdf",
      mimeType: "application/pdf",
      byteLength: 1200
    });
    assert.equal(doc.scanStatus, "SCAN_NOT_AVAILABLE");
    assert.equal(doc.uploadStatus, "PENDING");
    assert.match(doc.objectKey, /^org\/10\/wp\//);
    await assert.rejects(
      () => svc.addDocumentMetadata(20, a.id, 2, {
        originalFilename: "x.pdf",
        declaredExtension: ".pdf",
        mimeType: "application/pdf",
        byteLength: 10
      }),
      (err) => err.code === "NOT_FOUND"
    );
  });

  it("credential model has no secret field", async () => {
    const svc = service();
    const a = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Sitio A",
      projectType: "create"
    });
    const cred = await svc.setCredentialStatus(10, a.id, 1, "REQUESTED");
    assert.deepEqual(Object.keys(cred).sort(), ["status", "updatedAt", "updatedBy"].sort());
    assert.equal(CREDENTIAL_STATUSES.includes(cred.status), true);
    assert.equal("secret" in cred, false);
    assert.equal("password" in cred, false);
    assert.equal("token" in cred, false);
    const serialized = serializeCredential({ status: "NONE", updated_by: 1, updated_at: "t" });
    assert.equal("secret" in serialized, false);
  });

  it("writes activity logs without storing form values", async () => {
    const store = createMemoryStore();
    const svc = createWebProjectService(store);
    const a = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Sitio A",
      projectType: "create"
    });
    await svc.upsertForm(10, a.id, 1, [{ fieldKey: "notes", value: "texto visible" }]);
    const formLog = store.state.activity.find((row) => row.action_type === "WEB_PROJECT_FORM_UPDATED");
    assert.ok(formLog);
    assert.deepEqual(formLog.details.fieldKeys, ["notes"]);
    assert.equal(formLog.details.value, undefined);
    assert.ok(store.state.activity.some((row) => row.action_type === "WEB_PROJECT_CREATED"));
  });

  it("calculates progress and excludes NO_APLICA from the denominator", () => {
    const withSkip = calculateProgress({
      responses: [
        { schema_version: FORM_SCHEMA_VERSION_V1, field_key: "site_kind", value: "corporate" },
        { schema_version: FORM_SCHEMA_VERSION_V1, field_key: "has_existing_site", value: "NO_APLICA" },
        { schema_version: FORM_SCHEMA_VERSION_V1, field_key: "cms", value: "NO_APLICA" },
        { schema_version: FORM_SCHEMA_VERSION_V1, field_key: "primary_language", value: "es" },
        { schema_version: FORM_SCHEMA_VERSION_V1, field_key: "needs_ecommerce", value: "NO_APLICA" }
      ]
    });
    const fieldUnits = withSkip.units.filter((unit) => unit.kind === "field");
    assert.equal(fieldUnits.some((unit) => unit.key === "cms"), false);
    assert.equal(fieldUnits.some((unit) => unit.key === "existing_url"), false);
    assert.ok(fieldUnits.find((unit) => unit.key === "site_kind").done);
    assert.equal(withSkip.total, fieldUnits.length);
    assert.equal(withSkip.required, fieldUnits.length);
    assert.ok(withSkip.notApplicable >= 3);
    assert.ok(withSkip.ratio > 0);

    const missing = calculateProgress({
      responses: [
        { schema_version: FORM_SCHEMA_VERSION_V1, field_key: "has_existing_site", value: "yes" }
      ]
    });
    assert.equal(missing.units.some((unit) => unit.key === "existing_url"), true);
    assert.equal(missing.units.some((unit) => unit.key === "brief"), true);
    assert.equal(missing.units.find((unit) => unit.key === "brief").done, false);
  });

  it("rejects traversal and cross-org object keys", () => {
    assert.throws(
      () => assertWebProjectObjectKey("org/10/wp/../etc/passwd", 10),
      (err) => err.code === "PATH_TRAVERSAL" || err.code === "INVALID_OBJECT_KEY"
    );
    assert.throws(
      () => assertWebProjectObjectKey("org/20/wp/00000000-0000-4000-8000-000000000001", 10),
      (err) => err.code === "OBJECT_KEY_ORG_MISMATCH"
    );
  });

  it("does not treat archive as a workflow status", () => {
    assert.throws(
      () => canTransition("INTAKE", "ARCHIVED"),
      (err) => err.code === "VALIDATION_ERROR"
    );
  });

  it("uses conservative secret detection", () => {
    assert.equal(looksLikeSecret("El cliente olvidó la contraseña de WordPress"), false);
    assert.equal(looksLikeSecret("password=SuperSecretValue99"), true);
    assert.equal(looksLikeSecret("-----BEGIN PRIVATE KEY-----\nMIIB"), true);
  });

  it("accepts legitimate copy that mentions passwords without storing a secret", async () => {
    const svc = service();
    const a = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Sitio A",
      projectType: "create"
    });
    const updated = await svc.upsertForm(10, a.id, 1, [
      { fieldKey: "notes", value: "El cliente olvidó la contraseña de WordPress" }
    ]);
    assert.equal(updated.form.responses[0].value, "El cliente olvidó la contraseña de WordPress");
  });

  it("rejects path traversal, MIME spoofing and oversized document metadata", async () => {
    const svc = service();
    const a = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Sitio A",
      projectType: "create"
    });
    await assert.rejects(
      () =>
        svc.addDocumentMetadata(10, a.id, 1, {
          originalFilename: "x.exe",
          declaredExtension: ".exe",
          mimeType: "application/pdf",
          byteLength: 10
        }),
      (err) => err.code === "DOCUMENT_INVALID"
    );
    await assert.rejects(
      () =>
        svc.addDocumentMetadata(10, a.id, 1, {
          originalFilename: "huge.pdf",
          declaredExtension: ".pdf",
          mimeType: "application/pdf",
          byteLength: 21 * 1024 * 1024
        }),
      (err) => err.code === "DOCUMENT_INVALID"
    );
  });

  it("allows multiple active projects in the same organization", async () => {
    const svc = service();
    await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Corporativa",
      projectType: "create"
    });
    await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Landing",
      projectType: "create"
    });
    const list = await svc.listProjects(10);
    assert.equal(list.length, 2);
  });

  it("PATCH omitted field stays and explicit null clears nullable hostname", async () => {
    const svc = service();
    const created = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Sitio A",
      projectType: "create",
      websiteHostname: "https://www.example.com/path?x=1"
    });
    assert.equal(created.websiteHostname, "www.example.com");
    const renamed = await svc.updateProject(10, created.id, 1, { title: "Nuevo" });
    assert.equal(renamed.title, "Nuevo");
    assert.equal(renamed.websiteHostname, "www.example.com");
    const cleared = await svc.updateProject(10, created.id, 1, { websiteHostname: null });
    assert.equal(cleared.websiteHostname, null);
    assert.equal(cleared.title, "Nuevo");
  });

  it("COMPLETED sets completed_at and is terminal", async () => {
    const svc = service();
    const created = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Sitio A",
      projectType: "create"
    });
    const { seedArchitectureMinimum } = require("./phase12.fixtures");
    await seedArchitectureMinimum(svc, 10, created.id, 1);
    let current = created;
    for (const next of ["REVIEW", "ARCHITECTURE", "MOCKUP", "DEVELOPMENT", "VALIDATION", "PUBLICATION", "COMPLETED"]) {
      if (next === "DEVELOPMENT" && current.workflowStatus === "MOCKUP") {
        current = await svc.transition(10, current.id, 1, "DEVELOPMENT", { approvedMockupDevelopment: true });
        continue;
      }
      if (next === "VALIDATION" && current.workflowStatus === "DEVELOPMENT") {
        current = await svc.transition(10, current.id, 1, "VALIDATION", { validationReady: true });
        continue;
      }
      if (next === "PUBLICATION" && current.workflowStatus === "VALIDATION") {
        current = await svc.transition(10, current.id, 1, "PUBLICATION", { publicationReady: true });
        continue;
      }
      if (next === "COMPLETED" && current.workflowStatus === "PUBLICATION") {
        current = await svc.transition(10, current.id, 1, "COMPLETED", { completionReady: true });
        continue;
      }
      current = await svc.transition(10, current.id, 1, next);
    }
    assert.equal(current.workflowStatus, "COMPLETED");
    assert.ok(current.completedAt);
    await assert.rejects(() => svc.transition(10, current.id, 1, "PUBLICATION"), (err) => {
      return err.code === "INVALID_TRANSITION";
    });
    assert.equal((await svc.getProject(10, current.id)).completedAt, current.completedAt);
  });

  it("rejects secrets without leaving a partial form write", async () => {
    const store = createMemoryStore();
    const svc = createWebProjectService(store);
    const created = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Sitio A",
      projectType: "create"
    });
    await svc.upsertForm(10, created.id, 1, [{ fieldKey: "site_kind", value: "corporate" }]);
    await assert.rejects(
      () =>
        svc.upsertForm(10, created.id, 1, [
          { fieldKey: "cms", value: "wordpress" },
          { fieldKey: "notes", value: "password=SuperSecretValue99" }
        ]),
      (err) => err.code === "SECRET_REJECTED"
    );
    const loaded = await svc.getProject(10, created.id);
    assert.equal(loaded.form.responses.some((row) => row.fieldKey === "notes"), false);
    assert.equal(loaded.form.responses.find((row) => row.fieldKey === "site_kind").value, "corporate");
    assert.equal(store.state.formResponses.length, 1);
  });

  it("rejects comment secrets without inserting a row", async () => {
    const store = createMemoryStore();
    const svc = createWebProjectService(store);
    const created = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Sitio A",
      projectType: "create"
    });
    await assert.rejects(
      () => svc.addComment(10, created.id, 1, "-----BEGIN PRIVATE KEY-----\nMIIB"),
      (err) => err.code === "SECRET_REJECTED"
    );
    assert.equal(store.state.comments.length, 0);
  });

  it("keeps historical inapplicable form answers but excludes them from progress", async () => {
    const svc = service();
    const created = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Sitio A",
      projectType: "create"
    });
    await svc.upsertForm(10, created.id, 1, [
      { fieldKey: "has_existing_site", value: "yes" },
      { fieldKey: "existing_url", value: "https://old.example.com" }
    ]);
    await svc.upsertForm(10, created.id, 1, [{ fieldKey: "has_existing_site", value: "no" }]);
    const loaded = await svc.getProject(10, created.id);
    const existingUrl = loaded.form.responses.find((row) => row.fieldKey === "existing_url");
    assert.ok(existingUrl);
    assert.equal(existingUrl.applicable, false);
    assert.equal(loaded.progress.units.some((unit) => unit.key === "existing_url"), false);
    assert.equal(loaded.progress.units.some((unit) => unit.key === "brief"), false);
  });

  it("cannot attach project A item or document to organization B", async () => {
    const svc = service();
    const a = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });
    const item = await svc.addItem(10, a.id, 1, { itemType: "page", title: "Home" });
    await assert.rejects(
      () => svc.updateItem(20, a.id, 2, item.id, { title: "Hack" }),
      (err) => err.code === "NOT_FOUND"
    );
    await assert.rejects(
      () =>
        svc.addDocumentMetadata(10, a.id, 1, {
          originalFilename: "x.pdf",
          mimeType: "application/pdf",
          declaredExtension: ".pdf",
          byteLength: 10,
          objectKey: "org/20/wp/00000000-0000-4000-8000-000000000001"
        }),
      (err) => err.code === "DOCUMENT_INVALID"
    );
  });

  it("upserts form fields and keeps a single credential row", async () => {
    const store = createMemoryStore();
    const svc = createWebProjectService(store);
    const created = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });
    await svc.upsertForm(10, created.id, 1, [{ fieldKey: "site_kind", value: "corporate" }]);
    await svc.upsertForm(10, created.id, 1, [{ fieldKey: "site_kind", value: "landing" }]);
    assert.equal(store.state.formResponses.length, 1);
    assert.equal(store.state.formResponses[0].value, "landing");
    await svc.setCredentialStatus(10, created.id, 1, "REQUESTED");
    await svc.setCredentialStatus(10, created.id, 1, "VERIFIED");
    assert.equal(store.state.credentials.length, 1);
    assert.equal(store.state.credentials[0].status, "VERIFIED");
  });
});
