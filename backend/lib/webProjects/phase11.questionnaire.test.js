const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createMemoryStore } = require("./memoryStore");
const { createWebProjectService } = require("./service");
const {
  FORM_SCHEMA_VERSION,
  FORM_SCHEMA_VERSION_V1,
  FORM_SCHEMA_VERSION_V2,
  AUDIT_ACTIONS
} = require("./constants");
const { WEB_PROJECT_FORM_V2 } = require("./formDefinitionV2");
const { getFormDefinition, resolveSchemaVersion, fieldByKey, isApplicable, responseMap } = require("./formRegistry");
const { calculateProgress, calculateSectionProgress } = require("./progress");
const { sanitizeItemPayload } = require("./itemSchemas");
const { evaluateSubmissionMinimum } = require("./submitCompleteness");
const { looksLikeSecret } = require("./secrets");

function service() {
  return createWebProjectService(createMemoryStore());
}

async function fillMinimum(svc, orgId, projectId) {
  await svc.upsertForm(orgId, projectId, 1, [
    { fieldKey: "company_trade_name", value: "Example Studio" },
    { fieldKey: "company_city", value: "Valencia" },
    { fieldKey: "company_country", value: "España" },
    { fieldKey: "company_phone", value: "+34 600 000 000" },
    { fieldKey: "company_email", value: "hola@example-studio.test" },
    { fieldKey: "company_contact_name", value: "Ana Pérez" },
    { fieldKey: "company_entity_type", value: "company" },
    { fieldKey: "company_multiple_locations", value: "no" },
    { fieldKey: "has_existing_site", value: "no" },
    { fieldKey: "about_who", value: "Un equipo de diseño" },
    { fieldKey: "about_what_you_do", value: "Diseñamos espacios y experiencias" },
    { fieldKey: "goals_objectives", value: ["professional_presence", "present_services"] },
    { fieldKey: "goals_primary_success", value: "Una web clara que explique el estudio" },
    { fieldKey: "goals_b2b_b2c", value: "both" },
    { fieldKey: "goals_priority", value: "normal" },
    { fieldKey: "offer_kinds", value: ["services"] },
    { fieldKey: "content_has_texts", value: "no" },
    { fieldKey: "content_needs_copy", value: "yes" },
    { fieldKey: "media_has_photos", value: "no" },
    { fieldKey: "media_has_videos", value: "no" },
    { fieldKey: "media_needs_production", value: "yes" },
    { fieldKey: "media_commercial_rights", value: "pending" },
    { fieldKey: "primary_language", value: "es" },
    { fieldKey: "languages_multilingual", value: "no" },
    { fieldKey: "sales_mode", value: "contact_forms" },
    { fieldKey: "access_ack_no_secrets", value: "yes" },
    { fieldKey: "confirm_reviewed", value: "yes" },
    { fieldKey: "confirm_use_material", value: "yes" },
    { fieldKey: "confirm_authorization", value: "yes" }
  ]);
}

describe("phase 11 questionnaire schema", () => {
  it("01 schema v2 loads", () => {
    const definition = getFormDefinition(FORM_SCHEMA_VERSION_V2);
    assert.equal(definition.version, "web-project-intake.v2");
    assert.equal(FORM_SCHEMA_VERSION, FORM_SCHEMA_VERSION_V2);
  });

  it("02 has 16 sections", () => {
    assert.equal(WEB_PROJECT_FORM_V2.sections.length, 16);
    assert.deepEqual(
      WEB_PROJECT_FORM_V2.sections.map((section) => section.id),
      [
        "company",
        "brand",
        "about",
        "goals",
        "offer",
        "content",
        "media",
        "current_site",
        "references",
        "languages",
        "sales",
        "integrations",
        "legal",
        "seo",
        "access",
        "review"
      ]
    );
  });

  it("03 field keys are stable and unique", () => {
    const keys = WEB_PROJECT_FORM_V2.fields.map((field) => field.key);
    assert.equal(new Set(keys).size, keys.length);
    assert.ok(keys.includes("company_trade_name"));
    assert.ok(keys.includes("confirm_authorization"));
  });

  it("04-08 conditions hide current site, multilingual and sales details", () => {
    const values = responseMap(
      [
        { schema_version: FORM_SCHEMA_VERSION_V2, field_key: "has_existing_site", value: "no" },
        { schema_version: FORM_SCHEMA_VERSION_V2, field_key: "languages_multilingual", value: "no" },
        { schema_version: FORM_SCHEMA_VERSION_V2, field_key: "sales_mode", value: "no" },
        { schema_version: FORM_SCHEMA_VERSION_V2, field_key: "offer_kinds", value: ["services"] }
      ],
      FORM_SCHEMA_VERSION_V2
    );
    const ctx = { projectType: "create" };
    const current = WEB_PROJECT_FORM_V2.sections.find((section) => section.id === "current_site");
    assert.equal(isApplicable(current, values, ctx), false);
    assert.equal(isApplicable(fieldByKey("languages_list", FORM_SCHEMA_VERSION_V2), values, ctx), false);
    assert.equal(isApplicable(fieldByKey("sales_what", FORM_SCHEMA_VERSION_V2), values, ctx), false);
    const tourBind = WEB_PROJECT_FORM_V2.itemBindings.find((bind) => bind.itemType === "tour");
    assert.equal(isApplicable(tourBind, values, ctx), false);
    const serviceBind = WEB_PROJECT_FORM_V2.itemBindings.find((bind) => bind.itemType === "service");
    assert.equal(isApplicable(serviceBind, values, ctx), true);
  });

  it("05 hidden fields are excluded from progress", () => {
    const progress = calculateProgress({
      schemaVersion: FORM_SCHEMA_VERSION_V2,
      projectType: "create",
      responses: [
        { schema_version: FORM_SCHEMA_VERSION_V2, field_key: "has_existing_site", value: "no" },
        { schema_version: FORM_SCHEMA_VERSION_V2, field_key: "languages_multilingual", value: "no" },
        { schema_version: FORM_SCHEMA_VERSION_V2, field_key: "sales_mode", value: "no" }
      ]
    });
    assert.equal(progress.units.some((unit) => unit.key === "existing_url"), false);
    assert.equal(progress.units.some((unit) => unit.key === "languages_list"), false);
    assert.equal(progress.units.some((unit) => unit.key === "sales_what"), false);
  });

  it("06-08 required recommended optional", () => {
    const trade = fieldByKey("company_trade_name", FORM_SCHEMA_VERSION_V2);
    const colors = fieldByKey("brand_colors", FORM_SCHEMA_VERSION_V2);
    const awards = fieldByKey("about_awards", FORM_SCHEMA_VERSION_V2);
    assert.equal(trade.required, true);
    assert.equal(colors.importance, "recommended");
    assert.equal(awards.required, false);
    assert.equal(awards.importance, "optional");
  });

  it("09-11 invalid email, url and text limits", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Example Studio",
      projectType: "create"
    });
    await assert.rejects(
      () => svc.upsertForm(10, project.id, 1, [{ fieldKey: "company_email", value: "no-es-un-email" }]),
      (err) => err.code === "INVALID_FORM_VALUE"
    );
    await assert.rejects(
      () => svc.upsertForm(10, project.id, 1, [{ fieldKey: "media_video_url", value: "https://example.com/video.mp4" }]),
      (err) => err.code === "INVALID_FORM_VALUE"
    );
    await assert.rejects(
      () => svc.upsertForm(10, project.id, 1, [{ fieldKey: "about_history", value: "x".repeat(4001) }]),
      (err) => err.code === "VALIDATION_ERROR"
    );
  });

  it("12 secret field guard on new keys", () => {
    assert.equal(looksLikeSecret("password=SuperSecretValue99"), true);
    assert.equal(looksLikeSecret("Nuestra contraseña de WordPress se olvidó"), false);
  });

  it("13 v1 remains readable on historical rows", async () => {
    const store = createMemoryStore();
    const svc = createWebProjectService(store);
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Legacy",
      projectType: "create"
    });
    await store.upsertFormResponse({
      web_project_id: project.id,
      organization_id: 10,
      schema_version: FORM_SCHEMA_VERSION_V1,
      field_key: "site_kind",
      value: "corporate",
      updated_by: 1
    });
    const loaded = await svc.getProject(10, project.id);
    assert.equal(loaded.form.schemaVersion, FORM_SCHEMA_VERSION_V1);
    assert.equal(loaded.form.responses[0].fieldKey, "site_kind");
    assert.equal(resolveSchemaVersion(loaded.form.responses.map((row) => ({
      schema_version: row.schemaVersion,
      field_key: row.fieldKey
    }))), FORM_SCHEMA_VERSION_V1);
  });

  it("14 new projects use v2", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Nuevo",
      projectType: "create"
    });
    assert.equal(project.form.schemaVersion, FORM_SCHEMA_VERSION_V2);
    await svc.upsertForm(10, project.id, 1, [{ fieldKey: "company_trade_name", value: "Demo Client" }]);
    const loaded = await svc.getProject(10, project.id);
    assert.equal(loaded.form.schemaVersion, FORM_SCHEMA_VERSION_V2);
  });

  it("15 no BonaBarcelona in questionnaire sources", () => {
    const root = path.join(__dirname);
    const files = ["formDefinitionV2.js", "itemSchemas.js", "submitCompleteness.js", "formCopy.ts"].map((name) =>
      path.join(root, name)
    );
    files.push(path.join(__dirname, "../../../frontend/lib/webProjects/formCopy.ts"));
    for (const file of files) {
      if (!fs.existsSync(file)) continue;
      const text = fs.readFileSync(file, "utf8");
      assert.doesNotMatch(text, /BonaBarcelona/i);
    }
  });

  it("16 translations keys stay on field_key not locale suffix", () => {
    for (const field of WEB_PROJECT_FORM_V2.fields) {
      assert.equal(field.key.endsWith("_es") || field.key.endsWith("_en") || field.key.endsWith("_ca"), false);
    }
  });
});

describe("phase 11 items", () => {
  it("validates allowlists by type and rejects extra keys", () => {
    const ok = sanitizeItemPayload("service", { summary: "Consultoría", notes: "ok" });
    assert.equal(ok.ok, true);
    const bad = sanitizeItemPayload("service", { api_token: "x" });
    assert.equal(bad.ok, false);
    const tour = sanitizeItemPayload("tour", { itinerary: "Salida a las 09:00", price_adult: "45" });
    assert.equal(tour.ok, true);
  });

  it("create update archive for typed items and blocks other org", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Catalog",
      projectType: "create"
    });
    const serviceItem = await svc.addItem(10, project.id, 1, {
      itemType: "service",
      title: "Consultoría",
      payload: { summary: "Acompañamiento" }
    });
    const product = await svc.addItem(10, project.id, 1, { itemType: "product", title: "Pack" });
    const tour = await svc.addItem(10, project.id, 1, {
      itemType: "tour",
      title: "Ruta costera",
      payload: { duration: "4h", itinerary: "Paseo y mirador" }
    });
    const team = await svc.addItem(10, project.id, 1, { itemType: "team_member", title: "Marta" });
    const location = await svc.addItem(10, project.id, 1, { itemType: "location", title: "Estudio" });
    const page = await svc.addItem(10, project.id, 1, { itemType: "page", title: "Inicio" });
    await svc.updateItem(10, project.id, 1, serviceItem.id, { payload: { summary: "Actualizado" } });
    await svc.archiveItem(10, project.id, 1, product.id);
    assert.equal((await svc.getProject(10, project.id)).items.filter((item) => !item.archivedAt).length, 5);
    await assert.rejects(() => svc.updateItem(20, project.id, 2, tour.id, { title: "Hack" }), (err) => err.code === "NOT_FOUND");
    void team;
    void location;
    void page;
  });
});

describe("phase 11 submit and progress", () => {
  it("blocks insufficient minimum and accepts a reasonable complete set", async () => {
    const store = createMemoryStore();
    const svc = createWebProjectService(store);
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Example Studio",
      projectType: "create"
    });
    await assert.rejects(() => svc.submitForReview(10, project.id, 1), (err) => err.code === "INCOMPLETE_SUBMISSION");
    await fillMinimum(svc, 10, project.id);
    const submitted = await svc.submitForReview(10, project.id, 1);
    assert.equal(submitted.workflowStatus, "REVIEW");
    assert.ok(submitted.submittedForReviewAt);
    assert.ok(store.state.activity.some((row) => row.action_type === AUDIT_ACTIONS.SUBMITTED_FOR_REVIEW));
    const again = await svc.submitForReview(10, project.id, 1);
    assert.equal(again.workflowStatus, "REVIEW");
  });

  it("optional omission does not block send when minimum is met", () => {
    const values = new Map([
      ["company_trade_name", "Demo Client"],
      ["about_what_you_do", "Formación"],
      ["goals_primary_success", "Captar alumnos"],
      ["confirm_reviewed", "yes"],
      ["confirm_use_material", "yes"],
      ["confirm_authorization", "yes"]
    ]);
    const result = evaluateSubmissionMinimum({
      project: { project_type: "create" },
      items: [],
      values
    });
    assert.equal(result.ok, true);
  });

  it("review status does not change collection percentage", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Example Studio",
      projectType: "create"
    });
    await fillMinimum(svc, 10, project.id);
    const before = await svc.getProject(10, project.id);
    await svc.addReview(10, project.id, 99, {
      verdict: "CORRECTION_REQUESTED",
      targetType: "FORM_FIELD",
      targetKey: "company_trade_name",
      schemaVersion: FORM_SCHEMA_VERSION_V2,
      correctionMessage: "Usa el nombre comercial público."
    });
    const after = await svc.getProject(10, project.id);
    assert.equal(after.progress.percentage, before.progress.percentage);
    assert.equal(after.reviewSummary.openCorrections >= 1, true);
  });

  it("section progress is derived", async () => {
    const svc = service();
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Example Studio",
      projectType: "create"
    });
    await svc.upsertForm(10, project.id, 1, [{ fieldKey: "company_trade_name", value: "Example Studio" }]);
    const loaded = await svc.getProject(10, project.id);
    assert.equal(loaded.sectionProgress.length, 16);
    const company = loaded.sectionProgress.find((section) => section.id === "company");
    assert.equal(company.status === "partial" || company.status === "complete", true);
    const current = loaded.sectionProgress.find((section) => section.id === "current_site");
    assert.equal(current.hidden, true);
  });

  it("client submit then correction stays in REVIEW", async () => {
    const store = createMemoryStore();
    const svc = createWebProjectService(store);
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "Example Studio",
      projectType: "create"
    });
    await fillMinimum(svc, 10, project.id);
    await svc.submitForReview(10, project.id, 1);
    const asked = await svc.addReview(10, project.id, 99, {
      verdict: "CORRECTION_REQUESTED",
      targetType: "FORM_FIELD",
      targetKey: "company_trade_name",
      correctionMessage: "Usa el nombre comercial público."
    });
    assert.equal(asked.workflowStatus, "REVIEW");
    const fixed = await svc.upsertForm(10, project.id, 1, [
      { fieldKey: "company_trade_name", value: "Example Studio Public" }
    ]);
    assert.equal(fixed.workflowStatus, "REVIEW");
    assert.equal(
      fixed.reviewStates.find((row) => row.targetKey === "company_trade_name")?.status,
      "PENDING"
    );
    await assert.rejects(
      () => svc.upsertForm(10, project.id, 1, [{ fieldKey: "about_who", value: "cambio no pedido" }]),
      (err) => err.code === "FORM_LOCKED"
    );
  });

  it("improve shows current website section", () => {
    const sections = calculateSectionProgress({
      schemaVersion: FORM_SCHEMA_VERSION_V2,
      projectType: "improve",
      responses: []
    });
    assert.equal(sections.find((section) => section.id === "current_site").hidden, false);
  });
});
