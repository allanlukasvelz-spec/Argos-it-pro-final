const crypto = require("crypto");
const { validatePublicHostname } = require("../hostnameSecurity");
const {
  PROJECT_TYPES,
  ITEM_TYPES,
  ITEM_STATUSES,
  CREDENTIAL_STATUSES,
  REVIEW_VERDICTS,
  AUDIT_ACTIONS,
  FORM_SCHEMA_VERSION,
  DOCUMENT_CATEGORIES,
  ALLOWED_DOCUMENT_MIME,
  MIME_EXTENSION,
  MAX_DOCUMENT_BYTES,
  MAX_TITLE_LENGTH,
  MAX_COMMENT_LENGTH,
  MAX_ARCHIVE_REASON_LENGTH,
  MAX_FORM_TEXT_LENGTH,
  MAX_REVIEW_SUMMARY_LENGTH,
  MAX_FILENAME_LENGTH,
  MAX_ITEM_PAYLOAD_BYTES,
  ERROR_CODES,
  BRIEF_NOTE_TYPES,
  BRIEF_NOTE_STATUSES,
  BRIEF_NOTE_SEVERITIES,
  BRIEF_SCHEMA_VERSION
} = require("./constants");
const { WebProjectError } = require("./errors");
const {
  fieldByKey,
  unwrapValue,
  asList,
  isApplicable,
  isFilled,
  isValidUrlValue,
  isValidEmailValue,
  isValidPhoneValue,
  isValidDateValue,
  isValidNumberValue,
  responseMap,
  resolveSchemaVersion,
  getFormDefinition,
  publicFormDefinition,
  isKnownSchemaVersion
} = require("./formRegistry");
const { calculateProgress, calculateSectionProgress } = require("./progress");
const { sanitizeItemPayload } = require("./itemSchemas");
const { assertSubmissionMinimum } = require("./submitCompleteness");
const {
  buildReviewStates,
  calculateReadiness,
  calculateReviewSummary,
  hasOpenCorrectionForTarget,
  normalizeTargetInput
} = require("./reviewState");
const { assertTransition, rewindStatusForCorrection } = require("./workflow");
const { rejectIfSecret } = require("./secrets");
const { buildWebProjectObjectKey, assertWebProjectObjectKey } = require("./objectKey");
const { hasOwn } = require("./httpContract");
const { sanitizeOriginalFilename } = require("./filename");
const { assertMimeAndExtension } = require("./mimePolicy");
const { getEvidenceStore, isEvidenceStoreConfigured, EvidenceStoreNotConfiguredError } = require("../platform/evidenceStore");
const { ObjectStoreError } = require("../platform/objectKey");
const { evaluateArchitectureReadiness } = require("./architectureReadiness");
const { buildProjectBrief, serializeNotePublic } = require("./briefBuilder");
const { buildHandoffSnapshot } = require("./architectureHandoff");
const { WEB_PROJECT_NOTIFICATION_EVENTS } = require("./notificationCopy");
const { createArchitectureOperations } = require("./architectureOperations");
const { createMockupOperations } = require("./mockupOperations");
const { createDevelopmentOperations } = require("./developmentOperations");
const { createValidationOperations } = require("./validationOperations");
const { createPublicationOperations } = require("./publicationOperations");

function mapStorageError(err) {
  if (err instanceof WebProjectError) return err;
  if (err instanceof EvidenceStoreNotConfiguredError) {
    return new WebProjectError(503, ERROR_CODES.STORAGE_UNAVAILABLE, "Almacén de objetos no disponible");
  }
  if (err instanceof ObjectStoreError) {
    if (err.code === "NOT_FOUND") {
      return new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Documento no disponible");
    }
    return new WebProjectError(503, ERROR_CODES.STORAGE_UNAVAILABLE, "Almacén de objetos no disponible");
  }
  return err;
}

function sha256Hex(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function rejectClientStorageControls(input) {
  const forbidden = [
    "objectKey",
    "object_key",
    "storageKey",
    "path",
    "bucket",
    "scanStatus",
    "scan_status",
    "sha256",
    "id"
  ];
  for (const key of forbidden) {
    if (hasOwn(input, key)) {
      throw new WebProjectError(
        400,
        ERROR_CODES.DOCUMENT_INVALID,
        "object_key, scan_status, sha256 e id los establece el backend"
      );
    }
  }
}

function createWebProjectService(store, options = {}) {
  async function notifySafe(kind, payload) {
    const notifier = options.notifications;
    if (!notifier || typeof notifier.emitWebProject !== "function") return;
    try {
      await notifier.emitWebProject({ kind, ...payload });
    } catch (err) {
      console.error("[WP NOTIFY]", err.message);
    }
  }

  function resolveObjectStore() {
    if (options.objectStore) return options.objectStore;
    if (!isEvidenceStoreConfigured()) {
      throw new WebProjectError(503, ERROR_CODES.STORAGE_UNAVAILABLE, "Almacén de objetos no disponible");
    }
    return getEvidenceStore();
  }
  async function runTx(work) {
    if (typeof store.withTransaction === "function") {
      return store.withTransaction(work);
    }
    return work(store);
  }

  async function requireProject(tx, organizationId, projectId) {
    const project = await tx.getProject(organizationId, projectId);
    if (!project) {
      throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Proyecto no encontrado");
    }
    return project;
  }

  function assertNotArchived(project) {
    if (project.archived_at) {
      throw new WebProjectError(409, ERROR_CODES.PROJECT_ARCHIVED, "El expediente está archivado");
    }
  }

  function assertNotCompleted(project) {
    if (project.workflow_status === "COMPLETED") {
      throw new WebProjectError(
        409,
        ERROR_CODES.PROJECT_COMPLETED,
        "El proyecto completado no admite cambios operativos"
      );
    }
  }

  function assertProjectMutable(project) {
    assertNotArchived(project);
    assertNotCompleted(project);
  }

  function normalizeArchiveReason(raw) {
    if (raw === undefined || raw === null || raw === "") return null;
    const text = String(raw).trim().slice(0, MAX_ARCHIVE_REASON_LENGTH);
    if (!text) return null;
    rejectIfSecret(text, "archive.reason");
    return text;
  }

  async function resolveReviewTarget(tx, organizationId, project, input) {
    const normalized = normalizeTargetInput(input);
    if (normalized.error) {
      throw new WebProjectError(400, ERROR_CODES.REVIEW_TARGET_INVALID, "target de revisión no válido");
    }
    const { targetType, targetId, targetKey, schemaVersion } = normalized;
    if (targetType === "PROJECT") {
      if (targetId && String(targetId) !== String(project.id)) {
        throw new WebProjectError(
          400,
          ERROR_CODES.REVIEW_TARGET_INVALID,
          "El target no pertenece a este expediente"
        );
      }
      return {
        targetType,
        targetId: String(project.id),
        targetKey: null,
        schemaVersion: null
      };
    }
    if (targetType === "FORM_FIELD") {
      const responses = await tx.listFormResponses(organizationId, project.id);
      const found = responses.find((row) => row.field_key === targetKey);
      if (!found) {
        throw new WebProjectError(
          400,
          ERROR_CODES.REVIEW_TARGET_INVALID,
          "El campo no pertenece a este expediente"
        );
      }
      const version = found.schema_version || resolveSchemaVersion(responses);
      const field = fieldByKey(targetKey, version);
      if (!field) {
        throw new WebProjectError(400, ERROR_CODES.REVIEW_TARGET_INVALID, "Campo de formulario no válido");
      }
      void schemaVersion;
      return { targetType, targetId: null, targetKey, schemaVersion: version };
    }
    if (targetType === "ITEM") {
      const itemId = Number(targetId);
      if (!Number.isInteger(itemId) || itemId <= 0) {
        throw new WebProjectError(400, ERROR_CODES.REVIEW_TARGET_INVALID, "Item no válido");
      }
      const item = await tx.getItem(organizationId, project.id, itemId);
      if (!item) {
        throw new WebProjectError(
          400,
          ERROR_CODES.REVIEW_TARGET_INVALID,
          "El item no pertenece a este expediente"
        );
      }
      return {
        targetType,
        targetId: String(item.id),
        targetKey: null,
        schemaVersion: null
      };
    }
    if (targetType === "DOCUMENT") {
      if (!targetId) {
        throw new WebProjectError(400, ERROR_CODES.REVIEW_TARGET_INVALID, "Documento no válido");
      }
      const doc = await tx.getDocument(organizationId, project.id, targetId);
      if (!doc || doc.status === "DELETED") {
        throw new WebProjectError(
          400,
          ERROR_CODES.REVIEW_TARGET_INVALID,
          "El documento no pertenece a este expediente"
        );
      }
      return {
        targetType,
        targetId: String(doc.id),
        targetKey: null,
        schemaVersion: null
      };
    }
    if (targetType === "MOCKUP") {
      const mockupId = Number(targetId);
      if (!Number.isInteger(mockupId) || mockupId <= 0) {
        throw new WebProjectError(400, ERROR_CODES.REVIEW_TARGET_INVALID, "Maqueta no válida");
      }
      const mockup = await tx.getMockup(organizationId, project.id, mockupId);
      if (!mockup) {
        throw new WebProjectError(
          400,
          ERROR_CODES.REVIEW_TARGET_INVALID,
          "La maqueta no pertenece a este expediente"
        );
      }
      return { targetType, targetId: String(mockup.id), targetKey: null, schemaVersion: null };
    }
    if (targetType === "MOCKUP_PAGE") {
      const pageId = Number(targetId);
      if (!Number.isInteger(pageId) || pageId <= 0) {
        throw new WebProjectError(400, ERROR_CODES.REVIEW_TARGET_INVALID, "Página de maqueta no válida");
      }
      const page = await tx.getMockupPage(organizationId, project.id, pageId);
      if (!page) {
        throw new WebProjectError(
          400,
          ERROR_CODES.REVIEW_TARGET_INVALID,
          "La página no pertenece a este expediente"
        );
      }
      return { targetType, targetId: String(page.id), targetKey: null, schemaVersion: null };
    }
    if (targetType === "MOCKUP_SECTION") {
      const sectionId = Number(targetId);
      if (!Number.isInteger(sectionId) || sectionId <= 0) {
        throw new WebProjectError(400, ERROR_CODES.REVIEW_TARGET_INVALID, "Sección no válida");
      }
      const section = await tx.getMockupSection(organizationId, project.id, sectionId);
      if (!section) {
        throw new WebProjectError(
          400,
          ERROR_CODES.REVIEW_TARGET_INVALID,
          "La sección no pertenece a este expediente"
        );
      }
      return { targetType, targetId: String(section.id), targetKey: null, schemaVersion: null };
    }
    throw new WebProjectError(400, ERROR_CODES.REVIEW_TARGET_INVALID, "target de revisión no válido");
  }

  async function audit(tx, organizationId, userId, actionType, details) {
    await tx.insertActivityLog({
      user_id: userId || null,
      organization_id: organizationId,
      action_type: actionType,
      details
    });
  }

  async function assemble(tx, organizationId, project) {
    const [responses, documents, reviews, items, comments, credential] = await Promise.all([
      tx.listFormResponses(organizationId, project.id),
      tx.listDocuments(organizationId, project.id),
      tx.listReviews(organizationId, project.id),
      tx.listItems(organizationId, project.id),
      tx.listComments(organizationId, project.id),
      tx.getCredentialStatus(organizationId, project.id)
    ]);
    const schemaVersion = resolveSchemaVersion(responses);
    const values = responseMap(responses, schemaVersion);
    const context = { projectType: project.project_type };
    const progress = calculateProgress({
      responses,
      documents,
      reviews,
      items,
      workflowStatus: project.workflow_status,
      projectType: project.project_type,
      schemaVersion
    });
    const reviewStates = buildReviewStates({
      reviews,
      responses,
      items,
      documents,
      projectId: project.id,
      projectType: project.project_type
    });
    const reviewSummary = calculateReviewSummary(reviewStates);
    const readiness = calculateReadiness({ progress, reviewSummary });
    const sectionProgress = calculateSectionProgress({
      responses,
      documents,
      items,
      reviews,
      projectType: project.project_type,
      schemaVersion,
      reviewStates
    });
    return {
      ...serializeProject(project),
      form: {
        schemaVersion,
        responses: responses.map((row) => serializeFormResponse(row, values, schemaVersion, context))
      },
      items: items.map(serializeItem),
      documents: documents.map(serializeDocument),
      reviews: reviews.map(serializeReview),
      comments: comments.map(serializeComment),
      credentialStatus: serializeCredential(credential),
      progress,
      sectionProgress,
      reviewSummary,
      reviewStates,
      readiness
    };
  }

  function normalizeHostname(value) {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== "string") {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "website_hostname inválido");
    }
    const trimmed = value.trim();
    if (!trimmed) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "website_hostname vacío");
    }
    const result = validatePublicHostname(trimmed);
    if (!result.ok) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, result.error);
    }
    return result.hostname;
  }

  function normalizeAssetId(value) {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "website_asset_id inválido");
    }
    return id;
  }

  function normalizeTitle(value, required) {
    if (value === undefined) return undefined;
    if (value === null || !String(value).trim()) {
      if (required) {
        throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "Título requerido");
      }
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "Título no puede ser vacío");
    }
    const title = String(value).trim().slice(0, MAX_TITLE_LENGTH);
    rejectIfSecret(title, "title");
    return title;
  }

  function normalizeRequirementKey(value) {
    if (value === undefined || value === null || String(value).trim() === "") return null;
    const key = String(value).trim();
    if (key === "brief" || DOCUMENT_CATEGORIES.includes(key)) return key;
    throw new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "Categoría de documento no válida");
  }

  function assertContentWritable(project, previousStates, kind, matcher) {
    if (project.workflow_status === "INTAKE") return;
    if (project.workflow_status === "REVIEW") {
      const allowed = hasOpenCorrectionForTarget(previousStates, matcher);
      if (!allowed) {
        throw new WebProjectError(
          409,
          ERROR_CODES.FORM_LOCKED,
          "En revisión solo puedes corregir lo que ARGOS ha pedido."
        );
      }
      return;
    }
    throw new WebProjectError(
      409,
      ERROR_CODES.FORM_LOCKED,
      "El cuestionario no admite cambios en esta fase."
    );
  }

  function validateFormEntries(entries, schemaVersion) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "Se requieren respuestas");
    }
    const version = schemaVersion || FORM_SCHEMA_VERSION;
    if (!isKnownSchemaVersion(version)) {
      throw new WebProjectError(400, ERROR_CODES.INVALID_FORM_FIELD, "schema_version no soportada");
    }
    const prepared = [];
    for (const entry of entries) {
      if (entry?.schemaVersion && entry.schemaVersion !== version) {
        throw new WebProjectError(400, ERROR_CODES.INVALID_FORM_FIELD, "schema_version no soportada");
      }
      const field = fieldByKey(entry.fieldKey, version);
      if (!field) {
        throw new WebProjectError(
          400,
          ERROR_CODES.INVALID_FORM_FIELD,
          `Campo no pertenece al schema ${version}`
        );
      }
      const rawValue = unwrapValue(entry.value);
      const filled = isFilled(rawValue);
      if (filled && field.type === "enum" && Array.isArray(field.options) && !field.options.includes(rawValue)) {
        throw new WebProjectError(400, ERROR_CODES.INVALID_FORM_VALUE, `Valor no válido para ${entry.fieldKey}`);
      }
      if (filled && field.type === "multi_enum") {
        const selected = asList(rawValue);
        if (!selected.length) {
          throw new WebProjectError(400, ERROR_CODES.INVALID_FORM_VALUE, `Valor no válido para ${entry.fieldKey}`);
        }
        if (Array.isArray(field.options) && selected.some((item) => !field.options.includes(item))) {
          throw new WebProjectError(400, ERROR_CODES.INVALID_FORM_VALUE, `Valor no válido para ${entry.fieldKey}`);
        }
      }
      if (field.type === "text" || field.type === "textarea") {
        if (rawValue !== undefined && rawValue !== null && typeof rawValue !== "string") {
          throw new WebProjectError(400, ERROR_CODES.INVALID_FORM_VALUE, `Valor de texto inválido para ${entry.fieldKey}`);
        }
        if (typeof rawValue === "string" && rawValue.length > MAX_FORM_TEXT_LENGTH) {
          throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, `Texto demasiado largo en ${entry.fieldKey}`);
        }
      }
      if (filled && (field.type === "url" || field.type === "video_url")) {
        if (!isValidUrlValue(rawValue, { video: field.type === "video_url" })) {
          throw new WebProjectError(400, ERROR_CODES.INVALID_FORM_VALUE, `URL inválida para ${entry.fieldKey}`);
        }
      }
      if (filled && field.type === "email" && !isValidEmailValue(rawValue)) {
        throw new WebProjectError(400, ERROR_CODES.INVALID_FORM_VALUE, `Email inválido para ${entry.fieldKey}`);
      }
      if (filled && field.type === "phone" && !isValidPhoneValue(rawValue)) {
        throw new WebProjectError(400, ERROR_CODES.INVALID_FORM_VALUE, `Teléfono inválido para ${entry.fieldKey}`);
      }
      if (filled && field.type === "date" && !isValidDateValue(rawValue)) {
        throw new WebProjectError(400, ERROR_CODES.INVALID_FORM_VALUE, `Fecha inválida para ${entry.fieldKey}`);
      }
      if (filled && field.type === "number" && !isValidNumberValue(rawValue)) {
        throw new WebProjectError(400, ERROR_CODES.INVALID_FORM_VALUE, `Número inválido para ${entry.fieldKey}`);
      }
      rejectIfSecret(entry.value, `form.${entry.fieldKey}`);
      prepared.push({
        fieldKey: entry.fieldKey,
        value: field.type === "multi_enum" && filled ? asList(rawValue) : entry.value
      });
    }
    return prepared;
  }

  async function createProject({
    organizationId,
    actorUserId,
    title,
    projectType,
    websiteHostname,
    websiteAssetId,
    source
  }) {
    if (!organizationId) {
      throw new WebProjectError(400, ERROR_CODES.TENANT_REQUIRED, "organization_id requerido");
    }
    const normalizedTitle = normalizeTitle(title, true);
    if (!PROJECT_TYPES.includes(projectType)) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "project_type debe ser create o improve");
    }
    const hostname = websiteHostname ? normalizeHostname(websiteHostname) : null;
    const assetId = websiteAssetId != null ? normalizeAssetId(websiteAssetId) : null;

    return runTx(async (tx) => {
      const project = await tx.insertProject({
        organization_id: organizationId,
        title: normalizedTitle,
        project_type: projectType,
        workflow_status: "INTAKE",
        website_hostname: hostname || null,
        website_asset_id: assetId,
        created_by: actorUserId || null
      });
      await tx.upsertCredentialStatus({
        web_project_id: project.id,
        organization_id: organizationId,
        status: "NONE",
        updated_by: actorUserId || null
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.CREATED, {
        projectId: project.id,
        projectType,
        source: source || "unknown"
      });
      return assemble(tx, organizationId, project);
    });
  }

  async function listProjects(organizationId, options) {
    if (!organizationId) {
      throw new WebProjectError(400, ERROR_CODES.TENANT_REQUIRED, "organization_id requerido");
    }
    const rows = await store.listProjects(organizationId, options);
    return Promise.all(rows.map((project) => assemble(store, organizationId, project)));
  }

  async function getProject(organizationId, projectId) {
    const project = await requireProject(store, organizationId, projectId);
    return assemble(store, organizationId, project);
  }

  async function updateProject(organizationId, projectId, actorUserId, patch) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertProjectMutable(project);
      const storePatch = {};
      if (hasOwn(patch, "title")) storePatch.title = normalizeTitle(patch.title, true);
      if (hasOwn(patch, "websiteHostname")) {
        storePatch.website_hostname = normalizeHostname(patch.websiteHostname);
      }
      if (hasOwn(patch, "websiteAssetId")) {
        storePatch.website_asset_id = normalizeAssetId(patch.websiteAssetId);
      }
      if (Object.keys(storePatch).length === 0) {
        return assemble(tx, organizationId, project);
      }
      const updated = await tx.updateProject(organizationId, projectId, storePatch);
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.UPDATED, {
        projectId: Number(projectId),
        fields: Object.keys(storePatch)
      });
      return assemble(tx, organizationId, updated);
    });
  }

  async function transition(organizationId, projectId, actorUserId, toStatus, options = {}) {
    let fromStatus = null;
    let architectureMeta = null;
    const assembled = await runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      fromStatus = project.workflow_status;
      assertNotArchived(project);
      assertTransition(project.workflow_status, toStatus);
      if (project.workflow_status === "REVIEW" && toStatus === "ARCHITECTURE") {
        architectureMeta = await assertArchitectureHandoff(tx, organizationId, project, actorUserId, options);
      }
      if (project.workflow_status === "MOCKUP" && toStatus === "DEVELOPMENT" && !options.approvedMockupDevelopment) {
        throw new WebProjectError(
          409,
          ERROR_CODES.DEVELOPMENT_NOT_READY,
          "Usa «Iniciar desarrollo» con maqueta aprobada."
        );
      }
      if (project.workflow_status === "DEVELOPMENT" && toStatus === "VALIDATION" && !options.validationReady) {
        throw new WebProjectError(
          409,
          ERROR_CODES.VALIDATION_NOT_READY,
          "Usa «Pasar a validación» cuando el desarrollo esté listo."
        );
      }
      if (project.workflow_status === "VALIDATION" && toStatus === "PUBLICATION" && !options.publicationReady) {
        throw new WebProjectError(
          409,
          ERROR_CODES.PUBLICATION_NOT_READY,
          "Usa «Pasar a publicación» cuando la validación esté lista."
        );
      }
      if (project.workflow_status === "PUBLICATION" && toStatus === "COMPLETED" && !options.completionReady) {
        throw new WebProjectError(
          409,
          ERROR_CODES.COMPLETION_NOT_READY,
          "Usa «Finalizar proyecto» cuando la publicación esté lista."
        );
      }
      const patch = { workflow_status: toStatus };
      if (toStatus === "REVIEW" && !project.submitted_for_review_at) {
        patch.submitted_for_review_at = new Date().toISOString();
      }
      if (toStatus === "COMPLETED") {
        patch.completed_at = new Date().toISOString();
      }
      const updated = await tx.updateProject(organizationId, projectId, patch);
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.TRANSITIONED, {
        projectId: Number(projectId),
        from: project.workflow_status,
        to: toStatus
      });
      if (architectureMeta) {
        await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.ARCHITECTURE_STARTED, {
          projectId: Number(projectId),
          readinessState: architectureMeta.readiness.state,
          openItemCounts: {
            blockers: architectureMeta.readiness.blockers.length,
            warnings: architectureMeta.readiness.warnings.length
          },
          override: Boolean(architectureMeta.overrideUsed)
        });
      }
      return assemble(tx, organizationId, updated);
    });
    await notifySafe(WEB_PROJECT_NOTIFICATION_EVENTS.TRANSITIONED, {
      organizationId,
      actorUserId,
      project: assembled,
      fromStatus,
      toStatus
    });
    return assembled;
  }

  async function archiveProject(organizationId, projectId, actorUserId, options = {}) {
    const archiveReason = normalizeArchiveReason(options.reason);
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      if (project.archived_at) return assemble(tx, organizationId, project);
      if (project.workflow_status !== "COMPLETED") {
        throw new WebProjectError(
          409,
          ERROR_CODES.ARCHIVE_NOT_ELIGIBLE,
          "Solo se puede archivar un proyecto completado"
        );
      }
      const archivedAt = new Date().toISOString();
      const updated = await tx.archiveProjectFirst(organizationId, projectId, {
        archived_at: archivedAt,
        archived_by: actorUserId || null,
        archive_reason: archiveReason
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.ARCHIVED, {
        projectId: project.id,
        workflowStatus: project.workflow_status,
        archivedAt,
        archivedBy: actorUserId || null,
        archiveReason
      });
      return assemble(tx, organizationId, updated);
    });
  }

  async function upsertForm(organizationId, projectId, actorUserId, entries) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      assertNotCompleted(project);
      const existingResponses = await tx.listFormResponses(organizationId, project.id);
      const schemaVersion = resolveSchemaVersion(existingResponses);
      const prepared = validateFormEntries(entries, schemaVersion);
      const previousStates = buildReviewStates({
        reviews: await tx.listReviews(organizationId, project.id),
        responses: existingResponses,
        items: await tx.listItems(organizationId, project.id),
        documents: await tx.listDocuments(organizationId, project.id),
        projectId: project.id,
        projectType: project.project_type
      });
      if (project.workflow_status !== "INTAKE") {
        for (const entry of prepared) {
          assertContentWritable(
            project,
            previousStates,
            "FORM_FIELD",
            (state) => state.targetType === "FORM_FIELD" && state.targetKey === entry.fieldKey
          );
        }
      }
      for (const entry of prepared) {
        await tx.upsertFormResponse({
          web_project_id: project.id,
          organization_id: organizationId,
          schema_version: schemaVersion,
          field_key: entry.fieldKey,
          value: entry.value,
          updated_by: actorUserId || null
        });
      }
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.FORM_UPDATED, {
        projectId: project.id,
        schemaVersion,
        fieldKeys: prepared.map((entry) => entry.fieldKey)
      });
      const resubmitted = prepared
        .map((entry) => entry.fieldKey)
        .filter((fieldKey) =>
          hasOpenCorrectionForTarget(
            previousStates,
            (state) => state.targetType === "FORM_FIELD" && state.targetKey === fieldKey
          )
        );
      if (resubmitted.length > 0) {
        await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.CORRECTION_RESUBMITTED, {
          projectId: project.id,
          targetType: "FORM_FIELD",
          fieldKeys: resubmitted
        });
      }
      return assemble(tx, organizationId, project);
    });
  }

  async function addItem(organizationId, projectId, actorUserId, input) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      assertNotCompleted(project);
      if (!ITEM_TYPES.includes(input.itemType)) {
        throw new WebProjectError(400, ERROR_CODES.UNSUPPORTED_ITEM_TYPE, "item_type no soportado");
      }
      const title = normalizeTitle(input.title, true);
      if (input.status && !ITEM_STATUSES.includes(input.status)) {
        throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "status de item no válido");
      }
      if (project.workflow_status !== "INTAKE") {
        throw new WebProjectError(
          409,
          ERROR_CODES.FORM_LOCKED,
          "En esta fase no se pueden añadir contenidos nuevos."
        );
      }
      const sanitized = sanitizeItemPayload(input.itemType, input.payload || {});
      if (!sanitized.ok) {
        throw new WebProjectError(400, ERROR_CODES.INVALID_ITEM_PAYLOAD, sanitized.error);
      }
      const payload = sanitized.sanitized;
      rejectIfSecret(payload, "item.payload");
      if (Buffer.byteLength(JSON.stringify(payload), "utf8") > MAX_ITEM_PAYLOAD_BYTES) {
        throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "payload de item demasiado grande");
      }
      const item = await tx.insertItem({
        web_project_id: project.id,
        organization_id: organizationId,
        item_type: input.itemType,
        title,
        status: input.status || "draft",
        sort_order: Number(input.sortOrder || 0),
        payload,
        created_by: actorUserId || null
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.ITEM_CREATED, {
        projectId: project.id,
        itemId: item.id,
        itemType: item.item_type
      });
      return serializeItem(item);
    });
  }

  async function updateItem(organizationId, projectId, actorUserId, itemId, patch) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      assertNotCompleted(project);
      const existing = await tx.getItem(organizationId, projectId, itemId);
      if (!existing) {
        throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Item no encontrado");
      }
      const previousStates = buildReviewStates({
        reviews: await tx.listReviews(organizationId, project.id),
        items: [existing],
        projectId: project.id
      });
      if (project.workflow_status !== "INTAKE") {
        assertContentWritable(
          project,
          previousStates,
          "ITEM",
          (state) => state.targetType === "ITEM" && String(state.targetId) === String(itemId)
        );
      }
      const storePatch = {};
      if (hasOwn(patch, "title")) storePatch.title = normalizeTitle(patch.title, true);
      if (hasOwn(patch, "status")) {
        if (!ITEM_STATUSES.includes(patch.status)) {
          throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "status de item no válido");
        }
        storePatch.status = patch.status;
      }
      if (hasOwn(patch, "sortOrder")) storePatch.sort_order = Number(patch.sortOrder || 0);
      if (hasOwn(patch, "payload")) {
        const sanitized = sanitizeItemPayload(existing.item_type, patch.payload || {});
        if (!sanitized.ok) {
          throw new WebProjectError(400, ERROR_CODES.INVALID_ITEM_PAYLOAD, sanitized.error);
        }
        rejectIfSecret(sanitized.sanitized, "item.payload");
        if (Buffer.byteLength(JSON.stringify(sanitized.sanitized || {}), "utf8") > MAX_ITEM_PAYLOAD_BYTES) {
          throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "payload de item demasiado grande");
        }
        storePatch.payload = sanitized.sanitized;
      }
      if (Object.keys(storePatch).length === 0) return serializeItem(existing);
      const updated = await tx.updateItem(organizationId, projectId, itemId, storePatch);
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.UPDATED, {
        projectId: project.id,
        itemId: Number(itemId),
        fields: Object.keys(storePatch)
      });
      const itemStates = buildReviewStates({
        reviews: await tx.listReviews(organizationId, project.id),
        items: [existing],
        projectId: project.id
      });
      if (
        hasOpenCorrectionForTarget(
          itemStates,
          (state) => state.targetType === "ITEM" && String(state.targetId) === String(itemId)
        )
      ) {
        await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.CORRECTION_RESUBMITTED, {
          projectId: project.id,
          targetType: "ITEM",
          itemId: Number(itemId)
        });
      }
      return serializeItem(updated);
    });
  }

  async function archiveItem(organizationId, projectId, actorUserId, itemId) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      const existing = await tx.getItem(organizationId, projectId, itemId);
      if (!existing) {
        throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Item no encontrado");
      }
      if (existing.archived_at) return serializeItem(existing);
      if (project.workflow_status !== "INTAKE") {
        throw new WebProjectError(
          409,
          ERROR_CODES.FORM_LOCKED,
          "En esta fase no se pueden archivar contenidos."
        );
      }
      const updated = await tx.updateItem(organizationId, projectId, itemId, {
        archived_at: new Date().toISOString()
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.UPDATED, {
        projectId: project.id,
        itemId: Number(itemId),
        fields: ["archived_at"]
      });
      return serializeItem(updated);
    });
  }

  async function addDocumentMetadata(organizationId, projectId, actorUserId, input) {
    rejectClientStorageControls(input);
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      assertNotCompleted(project);
      const documentId = crypto.randomUUID();
      const objectKey = buildWebProjectObjectKey(organizationId, documentId);
      assertWebProjectObjectKey(objectKey, organizationId);
      if (!ALLOWED_DOCUMENT_MIME.includes(input.mimeType)) {
        throw new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "Tipo de archivo no permitido");
      }
      const ext = String(input.declaredExtension || "").toLowerCase();
      const allowedExt = MIME_EXTENSION[input.mimeType] || [];
      if (ext && !allowedExt.includes(ext)) {
        throw new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "La extensión no coincide con el MIME declarado");
      }
      const bytes = Number(input.byteLength || 0);
      if (!Number.isFinite(bytes) || bytes < 0 || bytes > MAX_DOCUMENT_BYTES) {
        throw new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "Tamaño de archivo no permitido");
      }
      rejectIfSecret(input.originalFilename, "filename");
      const requirementKey = normalizeRequirementKey(input.requirementKey);
      const doc = await tx.insertDocument({
        id: documentId,
        web_project_id: project.id,
        organization_id: organizationId,
        object_key: objectKey,
        original_filename: String(input.originalFilename || "file").slice(0, MAX_FILENAME_LENGTH),
        requirement_key: requirementKey,
        declared_extension: ext || null,
        mime_type: input.mimeType,
        byte_length: bytes,
        sha256: null,
        scan_status: "SCAN_NOT_AVAILABLE",
        status: "AVAILABLE",
        upload_status: "PENDING",
        created_by: actorUserId || null
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.DOCUMENT_REGISTERED, {
        projectId: project.id,
        documentId,
        mimeType: input.mimeType,
        byteLength: bytes
      });
      return serializeDocument(doc);
    });
  }

  async function uploadDocument(organizationId, projectId, actorUserId, input) {
    rejectClientStorageControls(input);
    const project = await requireProject(store, organizationId, projectId);
    assertNotArchived(project);
    assertNotCompleted(project);
    const replacesDocumentId = input.replacesDocumentId || input.replaces_document_id || null;
    let previousDocument = null;
    if (replacesDocumentId) {
      previousDocument = await store.getDocument(organizationId, project.id, replacesDocumentId);
      if (!previousDocument || previousDocument.status === "DELETED") {
        throw new WebProjectError(
          400,
          ERROR_CODES.REPLACEMENT_INVALID,
          "El documento a reemplazar no pertenece a este expediente"
        );
      }
    }
    if (!Buffer.isBuffer(input.buffer)) {
      throw new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "Archivo requerido");
    }
    if (input.buffer.length === 0) {
      throw new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "Archivo vacío");
    }
    if (input.buffer.length > MAX_DOCUMENT_BYTES) {
      throw new WebProjectError(400, ERROR_CODES.DOCUMENT_INVALID, "Archivo demasiado grande");
    }
    const originalFilename = sanitizeOriginalFilename(input.originalFilename);
    rejectIfSecret(originalFilename, "filename");
    const validated = assertMimeAndExtension({
      declaredMime: input.mimeType,
      filename: originalFilename,
      buffer: input.buffer
    });
    const documentId = crypto.randomUUID();
    const objectKey = buildWebProjectObjectKey(organizationId, documentId);
    assertWebProjectObjectKey(objectKey, organizationId);
    const digest = sha256Hex(input.buffer);
    const objectStore = resolveObjectStore();
    let written = false;
    try {
      await objectStore.put(objectKey, input.buffer);
      written = true;
      if (typeof objectStore.exists === "function") {
        const exists = await objectStore.exists(objectKey);
        if (!exists) {
          throw new WebProjectError(503, ERROR_CODES.STORAGE_UNAVAILABLE, "Almacén de objetos no disponible");
        }
      }
      const storedAt = new Date().toISOString();
      const document = await runTx(async (tx) => {
        const latest = await requireProject(tx, organizationId, projectId);
        assertNotArchived(latest);
        const doc = await tx.insertDocument({
          id: documentId,
          web_project_id: latest.id,
          organization_id: organizationId,
          object_key: objectKey,
          original_filename: originalFilename,
          requirement_key:
            normalizeRequirementKey(input.requirementKey) || previousDocument?.requirement_key || null,
          declared_extension: validated.extension,
          mime_type: validated.mimeType,
          byte_length: input.buffer.length,
          sha256: digest,
          scan_status: "SCAN_NOT_AVAILABLE",
          status: "AVAILABLE",
          upload_status: "STORED",
          stored_at: storedAt,
          replaces_document_id: previousDocument ? previousDocument.id : null,
          created_by: actorUserId || null
        });
        await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.DOCUMENT_UPLOADED, {
          projectId: latest.id,
          documentId,
          mimeType: validated.mimeType,
          byteLength: input.buffer.length
        });
        if (previousDocument) {
          await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.DOCUMENT_REPLACED, {
            projectId: latest.id,
            documentId,
            replacesDocumentId: previousDocument.id
          });
          const docStates = buildReviewStates({
            reviews: await tx.listReviews(organizationId, latest.id),
            documents: [previousDocument],
            projectId: latest.id
          });
          if (
            hasOpenCorrectionForTarget(
              docStates,
              (state) =>
                state.targetType === "DOCUMENT" && String(state.targetId) === String(previousDocument.id)
            )
          ) {
            await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.CORRECTION_RESUBMITTED, {
              projectId: latest.id,
              targetType: "DOCUMENT",
              documentId,
              replacesDocumentId: previousDocument.id
            });
          }
        }
        return doc;
      });
      return serializeDocument(document);
    } catch (err) {
      if (written) {
        try {
          await objectStore.delete(objectKey);
        } catch (compensateErr) {
          console.error("[WEB PROJECTS STORAGE] compensation failed", compensateErr.message);
        }
      }
      throw mapStorageError(err);
    }
  }

  async function getDocumentContent(organizationId, projectId, documentId) {
    const project = await requireProject(store, organizationId, projectId);
    const row = await store.getDocument(organizationId, project.id, documentId);
    if (!row || row.status === "DELETED") {
      throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Documento no encontrado");
    }
    if (row.upload_status !== "STORED") {
      throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Documento no disponible");
    }
    try {
      const objectStore = resolveObjectStore();
      const buffer = await objectStore.get(row.object_key);
      if (row.sha256) {
        const digest = sha256Hex(buffer);
        if (digest !== row.sha256) {
          throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Documento no disponible");
        }
      }
      return { document: serializeDocument(row), buffer };
    } catch (err) {
      throw mapStorageError(err);
    }
  }

  async function addComment(organizationId, projectId, actorUserId, body) {
    if (!body || !String(body).trim()) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "Comentario vacío");
    }
    const text = String(body).trim().slice(0, MAX_COMMENT_LENGTH);
    rejectIfSecret(text, "comment");
    const packed = await runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertProjectMutable(project);
      const comment = await tx.insertComment({
        web_project_id: project.id,
        organization_id: organizationId,
        body: text,
        created_by: actorUserId || null
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.COMMENT_CREATED, {
        projectId: project.id,
        commentId: comment.id
      });
      return { comment: serializeComment(comment), project: await assemble(tx, organizationId, project) };
    });
    await notifySafe(WEB_PROJECT_NOTIFICATION_EVENTS.COMMENT_CREATED, {
      organizationId,
      actorUserId,
      project: packed.project,
      commentId: packed.comment.id
    });
    return packed.comment;
  }

  async function addReview(organizationId, projectId, actorUserId, input) {
    if (!REVIEW_VERDICTS.includes(input.verdict)) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "verdict no válido");
    }
    const correctionMessage = String(input.correctionMessage || input.correction_message || "").trim();
    if (input.verdict === "CORRECTION_REQUESTED" && !correctionMessage) {
      throw new WebProjectError(
        400,
        ERROR_CODES.CORRECTION_MESSAGE_REQUIRED,
        "El motivo de corrección es obligatorio"
      );
    }
    rejectIfSecret(input.summary, "review");
    rejectIfSecret(correctionMessage, "review.correction");
    const assembled = await runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      assertNotCompleted(project);
      const target = await resolveReviewTarget(tx, organizationId, project, input);
      const summary = String(input.summary || correctionMessage || "").slice(0, MAX_REVIEW_SUMMARY_LENGTH);
      const review = await tx.insertReview({
        web_project_id: project.id,
        organization_id: organizationId,
        verdict: input.verdict,
        summary,
        target_type: target.targetType,
        target_id: target.targetId,
        target_key: target.targetKey,
        correction_message: correctionMessage || null,
        schema_version: target.schemaVersion,
        created_by: actorUserId || null
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.REVIEW_CREATED, {
        projectId: project.id,
        reviewId: review.id,
        verdict: input.verdict,
        targetType: target.targetType
      });
      if (input.verdict === "APPROVED") {
        await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.REVIEW_APPROVED, {
          projectId: project.id,
          reviewId: review.id,
          targetType: target.targetType
        });
      }
      if (input.verdict === "CORRECTION_REQUESTED") {
        const rewind = rewindStatusForCorrection(project.workflow_status);
        if (rewind) {
          assertTransition(project.workflow_status, rewind);
          await tx.updateProject(organizationId, projectId, { workflow_status: rewind });
        }
        await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.CORRECTION_REQUESTED, {
          projectId: project.id,
          reviewId: review.id,
          targetType: target.targetType
        });
      }
      const latest = await tx.getProject(organizationId, projectId);
      return assemble(tx, organizationId, latest);
    });
    const latestReview = (assembled.reviews || []).at(-1);
    const target = {
      targetType: latestReview?.targetType,
      targetId: latestReview?.targetId,
      targetKey: latestReview?.targetKey
    };
    if (input.verdict === "CORRECTION_REQUESTED") {
      await notifySafe(WEB_PROJECT_NOTIFICATION_EVENTS.CORRECTION_REQUESTED, {
        organizationId,
        actorUserId,
        project: assembled,
        reviewId: latestReview?.id,
        correctionMessage,
        target
      });
    } else if (input.verdict === "APPROVED") {
      await notifySafe(WEB_PROJECT_NOTIFICATION_EVENTS.REVIEW_APPROVED, {
        organizationId,
        actorUserId,
        project: assembled,
        reviewId: latestReview?.id,
        target
      });
    } else if (input.verdict === "REJECTED") {
      await notifySafe(WEB_PROJECT_NOTIFICATION_EVENTS.REVIEW_REJECTED, {
        organizationId,
        actorUserId,
        project: assembled,
        reviewId: latestReview?.id,
        target
      });
    }
    return assembled;
  }

  async function setCredentialStatus(organizationId, projectId, actorUserId, status) {
    if (!CREDENTIAL_STATUSES.includes(status)) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "Estado de credencial no válido");
    }
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertProjectMutable(project);
      const row = await tx.upsertCredentialStatus({
        web_project_id: project.id,
        organization_id: organizationId,
        status,
        updated_by: actorUserId || null
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.CREDENTIAL_STATUS_UPDATED, {
        projectId: project.id,
        status
      });
      return serializeCredential(row);
    });
  }

  async function submitForReview(organizationId, projectId, actorUserId) {
    const current = await getProject(organizationId, projectId);
    if (current.archivedAt) {
      throw new WebProjectError(409, ERROR_CODES.PROJECT_ARCHIVED, "El expediente está archivado");
    }
    if (current.workflowStatus === "REVIEW") {
      return current;
    }
    if (current.workflowStatus !== "INTAKE") {
      throw new WebProjectError(
        409,
        ERROR_CODES.INVALID_TRANSITION,
        "Solo se puede enviar a revisión desde recopilación"
      );
    }
    const values = new Map((current.form?.responses || []).map((row) => [row.fieldKey, row.value]));
    assertSubmissionMinimum({
      project: {
        project_type: current.projectType,
        projectType: current.projectType
      },
      responses: current.form?.responses || [],
      items: current.items || [],
      values
    });
    const assembled = await transition(organizationId, projectId, actorUserId, "REVIEW");
    await runTx(async (tx) => {
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.SUBMITTED_FOR_REVIEW, {
        projectId: Number(projectId)
      });
    });
    return assembled;
  }

  async function loadBriefSlices(tx, organizationId, project) {
    const [responses, documents, reviews, items, credential, notes, handoff] = await Promise.all([
      tx.listFormResponses(organizationId, project.id),
      tx.listDocuments(organizationId, project.id),
      tx.listReviews(organizationId, project.id),
      tx.listItems(organizationId, project.id),
      tx.getCredentialStatus(organizationId, project.id),
      typeof tx.listBriefNotes === "function" ? tx.listBriefNotes(organizationId, project.id) : [],
      typeof tx.getArchitectureHandoff === "function"
        ? tx.getArchitectureHandoff(organizationId, project.id)
        : null
    ]);
    const schemaVersion = resolveSchemaVersion(responses);
    const values = responseMap(responses, schemaVersion);
    const progress = calculateProgress({
      responses,
      documents,
      reviews,
      items,
      workflowStatus: project.workflow_status,
      projectType: project.project_type,
      schemaVersion
    });
    const reviewStates = buildReviewStates({
      reviews,
      responses,
      items,
      documents,
      projectId: project.id,
      projectType: project.project_type
    });
    const reviewSummary = calculateReviewSummary(reviewStates);
    const architectureReadiness = evaluateArchitectureReadiness({
      project,
      values,
      items,
      notes,
      credential,
      progress,
      reviewStates,
      schemaVersion
    });
    const brief = buildProjectBrief({
      project,
      values,
      responses,
      items,
      documents,
      reviews,
      reviewStates,
      reviewSummary,
      progress,
      credential,
      notes,
      schemaVersion,
      architectureReadiness
    });
    return {
      responses,
      documents,
      reviews,
      items,
      credential,
      notes,
      handoff,
      schemaVersion,
      values,
      progress,
      reviewStates,
      reviewSummary,
      architectureReadiness,
      brief
    };
  }

  function throwArchitectureNotReady(readiness) {
    throw new WebProjectError(
      409,
      ERROR_CODES.ARCHITECTURE_NOT_READY,
      "No se puede iniciar arquitectura con el estado actual.",
      {
        architectureReadiness: readiness,
        blockers: readiness.blockers
      }
    );
  }

  async function assertArchitectureHandoff(tx, organizationId, project, actorUserId, options = {}) {
    const slices = await loadBriefSlices(tx, organizationId, project);
    const readiness = slices.architectureReadiness;
    if (readiness.state === "NOT_READY") {
      throwArchitectureNotReady(readiness);
    }
    const overrideUsed = Boolean(options.acknowledgeOpenItems);
    const reason = typeof options.reason === "string" ? options.reason.trim() : "";
    if (readiness.state === "READY_WITH_OPEN_ITEMS") {
      if (!overrideUsed) {
        throw new WebProjectError(
          409,
          ERROR_CODES.ARCHITECTURE_OVERRIDE_REQUIRED,
          "Hay avisos abiertos. Confirma explícitamente para iniciar arquitectura.",
          {
            architectureReadiness: readiness,
            blockers: readiness.blockers,
            warnings: readiness.warnings
          }
        );
      }
      if (!reason) {
        throw new WebProjectError(
          400,
          ERROR_CODES.VALIDATION_ERROR,
          "Indica el motivo para iniciar arquitectura con avisos abiertos."
        );
      }
      rejectIfSecret(reason, "override reason");
    }
    const payload = buildHandoffSnapshot({
      brief: slices.brief,
      architectureReadiness: readiness,
      createdBy: actorUserId,
      overrideUsed: readiness.state === "READY_WITH_OPEN_ITEMS" && overrideUsed,
      overrideReason: readiness.state === "READY_WITH_OPEN_ITEMS" ? reason : null
    });
    if (typeof tx.insertArchitectureHandoff === "function") {
      await tx.insertArchitectureHandoff({
        organization_id: organizationId,
        web_project_id: project.id,
        schema_version: BRIEF_SCHEMA_VERSION,
        payload,
        readiness_state: readiness.state,
        override_used: payload.overrideUsed,
        override_reason: payload.overrideReason,
        created_by: actorUserId || null
      });
    }
    return { readiness, overrideUsed: payload.overrideUsed };
  }

  async function getBrief(organizationId, projectId) {
    const project = await requireProject(store, organizationId, projectId);
    const slices = await loadBriefSlices(store, organizationId, project);
    return {
      brief: slices.brief,
      architectureReadiness: slices.architectureReadiness,
      notes: (slices.notes || []).map(serializeNotePublic),
      handoff: serializeHandoff(slices.handoff),
      organizationId
    };
  }

  function normalizeNoteInput(input, { partial } = {}) {
    const noteType = input.noteType || input.note_type;
    if (!partial || hasOwn(input, "noteType") || hasOwn(input, "note_type")) {
      if (!BRIEF_NOTE_TYPES.includes(noteType)) {
        throw new WebProjectError(400, ERROR_CODES.BRIEF_NOTE_INVALID, "Tipo de nota no válido");
      }
    }
    const content = hasOwn(input, "content") ? String(input.content || "").trim() : undefined;
    if (!partial && !content) {
      throw new WebProjectError(400, ERROR_CODES.BRIEF_NOTE_INVALID, "El contenido de la nota es obligatorio");
    }
    if (content !== undefined) {
      if (!content) {
        throw new WebProjectError(400, ERROR_CODES.BRIEF_NOTE_INVALID, "El contenido de la nota es obligatorio");
      }
      if (content.length > MAX_COMMENT_LENGTH) {
        throw new WebProjectError(400, ERROR_CODES.BRIEF_NOTE_INVALID, "La nota es demasiado larga");
      }
      rejectIfSecret(content, "brief note");
    }
    const status = input.status;
    if (status && !BRIEF_NOTE_STATUSES.includes(status)) {
      throw new WebProjectError(400, ERROR_CODES.BRIEF_NOTE_INVALID, "Estado de nota no válido");
    }
    const severity = input.severity || null;
    if (severity && !BRIEF_NOTE_SEVERITIES.includes(severity)) {
      throw new WebProjectError(400, ERROR_CODES.BRIEF_NOTE_INVALID, "Severidad no válida");
    }
    const resolutionNote =
      input.resolutionNote !== undefined
        ? String(input.resolutionNote || "").trim()
        : input.resolution_note !== undefined
          ? String(input.resolution_note || "").trim()
          : undefined;
    if (resolutionNote) rejectIfSecret(resolutionNote, "resolution note");
    const blocking =
      input.blocking === undefined
        ? noteType === "DECISION_REQUIRED"
        : Boolean(input.blocking);
    return { noteType, content, status, severity, resolutionNote, blocking };
  }

  async function addBriefNote(organizationId, projectId, actorUserId, input) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      if (project.workflow_status === "COMPLETED") {
        throw new WebProjectError(409, ERROR_CODES.INVALID_TRANSITION, "COMPLETED no admite notas nuevas");
      }
      const parsed = normalizeNoteInput(input);
      const row = await tx.insertBriefNote({
        organization_id: organizationId,
        web_project_id: project.id,
        note_type: parsed.noteType,
        content: parsed.content,
        status: "OPEN",
        blocking: parsed.blocking,
        severity: parsed.noteType === "RISK" ? parsed.severity : null,
        created_by: actorUserId || null
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.BRIEF_NOTE_CREATED, {
        projectId: project.id,
        noteId: row.id,
        noteType: parsed.noteType,
        blocking: parsed.blocking
      });
      return serializeNotePublic(row);
    });
  }

  async function updateBriefNote(organizationId, projectId, noteId, actorUserId, input) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      if (project.workflow_status === "COMPLETED") {
        throw new WebProjectError(409, ERROR_CODES.INVALID_TRANSITION, "COMPLETED no admite cambios de notas");
      }
      const existing = await tx.getBriefNote(organizationId, project.id, noteId);
      if (!existing) {
        throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Nota no encontrada");
      }
      const parsed = normalizeNoteInput({ ...existing, ...input, noteType: input.noteType || existing.note_type }, { partial: true });
      const patch = {};
      if (parsed.content !== undefined) patch.content = parsed.content;
      if (input.blocking !== undefined) patch.blocking = Boolean(input.blocking);
      if (parsed.severity !== undefined && (existing.note_type === "RISK" || parsed.noteType === "RISK")) {
        patch.severity = parsed.severity;
      }
      if (parsed.status === "RESOLVED" && existing.status !== "RESOLVED") {
        patch.status = "RESOLVED";
        patch.resolved_at = new Date().toISOString();
        patch.resolution_note = parsed.resolutionNote || null;
      }
      if (parsed.status === "OPEN" && existing.status === "RESOLVED") {
        patch.status = "OPEN";
        patch.resolved_at = null;
      }
      if (Object.keys(patch).length === 0) return serializeNotePublic(existing);
      const updated = await tx.updateBriefNote(organizationId, project.id, noteId, patch);
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.BRIEF_NOTE_UPDATED, {
        projectId: project.id,
        noteId: Number(noteId),
        fields: Object.keys(patch)
      });
      return serializeNotePublic(updated);
    });
  }

  async function startArchitecture(organizationId, projectId, actorUserId, options = {}) {
    return transition(organizationId, projectId, actorUserId, "ARCHITECTURE", options);
  }

  const architectureOps = createArchitectureOperations({
    store,
    runTx,
    audit,
    requireProject,
    assertNotArchived,
    assertNotCompleted,
    transition,
    notifySafe,
    WEB_PROJECT_NOTIFICATION_EVENTS
  });

  const mockupOps = createMockupOperations({
    store,
    runTx,
    audit,
    requireProject,
    assertNotArchived,
    transition,
    notifySafe,
    WEB_PROJECT_NOTIFICATION_EVENTS,
    addReview
  });

  const developmentOps = createDevelopmentOperations({
    store,
    runTx,
    audit,
    requireProject,
    assertNotArchived,
    assertNotCompleted,
    transition,
    notifySafe,
    WEB_PROJECT_NOTIFICATION_EVENTS,
    assemble
  });

  const validationOps = createValidationOperations({
    store,
    runTx,
    audit,
    requireProject,
    assertNotArchived,
    assertNotCompleted,
    transition,
    notifySafe,
    WEB_PROJECT_NOTIFICATION_EVENTS,
    assemble
  });

  const publicationOps = createPublicationOperations({
    store,
    runTx,
    audit,
    requireProject,
    assertNotArchived,
    assertNotCompleted,
    transition,
    notifySafe,
    WEB_PROJECT_NOTIFICATION_EVENTS,
    assemble
  });

  return {
    createProject,
    listProjects,
    getProject,
    updateProject,
    transition,
    submitForReview,
    archiveProject,
    upsertForm,
    addItem,
    updateItem,
    archiveItem,
    addDocumentMetadata,
    uploadDocument,
    getDocumentContent,
    addComment,
    addReview,
    setCredentialStatus,
    getBrief,
    addBriefNote,
    updateBriefNote,
    startArchitecture,
    getArchitecture: architectureOps.getArchitecture,
    generateArchitecture: architectureOps.generateArchitecture,
    createArchitecturePage: architectureOps.createArchitecturePage,
    updateArchitecturePage: architectureOps.updateArchitecturePage,
    archiveArchitecturePage: architectureOps.archiveArchitecturePage,
    createArchitectureBlock: architectureOps.createArchitectureBlock,
    updateArchitectureBlock: architectureOps.updateArchitectureBlock,
    validateArchitectureState: architectureOps.validateArchitectureState,
    approveArchitecture: architectureOps.approveArchitecture,
    createArchitectureRevision: architectureOps.createArchitectureRevision,
    startMockup: architectureOps.startMockup,
    getMockup: mockupOps.getMockup,
    generateMockup: mockupOps.generateMockup,
    updateMockup: mockupOps.updateMockup,
    updateMockupPage: mockupOps.updateMockupPage,
    updateMockupSection: mockupOps.updateMockupSection,
    validateMockupState: mockupOps.validateMockupState,
    startMockupInternalReview: mockupOps.startInternalReview,
    sendMockupToClient: mockupOps.sendMockupToClient,
    createMockupRevision: mockupOps.createMockupRevision,
    clientApproveMockup: mockupOps.clientApproveMockup,
    clientRequestMockupChanges: mockupOps.clientRequestMockupChanges,
    startDevelopment: developmentOps.startDevelopment,
    getDevelopment: developmentOps.getDevelopment,
    prepareDevelopmentPlan: developmentOps.prepareDevelopmentPlan,
    updateDevelopmentItem: developmentOps.updateDevelopmentItem,
    blockDevelopmentItem: developmentOps.blockDevelopmentItem,
    unblockDevelopmentItem: developmentOps.unblockDevelopmentItem,
    addDevelopmentDependency: developmentOps.addDevelopmentDependency,
    startValidation: developmentOps.startValidation,
    getValidation: validationOps.getValidation,
    prepareValidationPlan: validationOps.prepareValidationPlan,
    updateValidationCheck: validationOps.updateValidationCheck,
    attachValidationEvidence: validationOps.attachValidationEvidence,
    createValidationDefect: validationOps.createValidationDefect,
    updateValidationDefect: validationOps.updateValidationDefect,
    retestValidationDefect: validationOps.retestValidationDefect,
    setRepresentativeSample: validationOps.setRepresentativeSample,
    startPublication: validationOps.startPublication,
    getPublication: publicationOps.getPublication,
    preparePublicationPlan: publicationOps.preparePublicationPlan,
    updatePublicationStep: publicationOps.updatePublicationStep,
    blockPublicationStep: publicationOps.blockPublicationStep,
    unblockPublicationStep: publicationOps.unblockPublicationStep,
    completeProject: publicationOps.completeProject,
    formDefinition: publicFormDefinition(FORM_SCHEMA_VERSION),
    getFormDefinition: publicFormDefinition
  };
}

function serializeProject(project) {
  return {
    id: project.id,
    organizationId: project.organization_id,
    title: project.title,
    projectType: project.project_type,
    workflowStatus: project.workflow_status,
    websiteAssetId: project.website_asset_id,
    websiteHostname: project.website_hostname,
    createdBy: project.created_by,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    archivedAt: project.archived_at,
    archivedBy: project.archived_by ?? null,
    archiveReason: project.archive_reason ?? null,
    completedAt: project.completed_at,
    submittedForReviewAt: project.submitted_for_review_at
  };
}

function serializeFormResponse(row, values, schemaVersion, context) {
  const field = fieldByKey(row.field_key, schemaVersion);
  return {
    fieldKey: row.field_key,
    schemaVersion: row.schema_version,
    value: row.value,
    applicable: field ? isApplicable(field, values, context) : false,
    section: field?.section || null,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at
  };
}

function serializeItem(row) {
  return {
    id: row.id,
    itemType: row.item_type,
    title: row.title,
    status: row.status,
    sortOrder: row.sort_order,
    payload: row.payload,
    archivedAt: row.archived_at
  };
}

function serializeDocument(row) {
  return {
    id: row.id,
    objectKey: row.object_key,
    originalFilename: row.original_filename,
    requirementKey: row.requirement_key,
    mimeType: row.mime_type,
    byteLength: row.byte_length,
    sha256: row.sha256,
    scanStatus: row.scan_status,
    status: row.status,
    uploadStatus: row.upload_status || "PENDING",
    storedAt: row.stored_at || null,
    replacesDocumentId: row.replaces_document_id || null
  };
}

function serializeReview(row) {
  return {
    id: row.id,
    verdict: row.verdict,
    summary: row.summary,
    targetType: row.target_type || "PROJECT",
    targetId: row.target_id || null,
    targetKey: row.target_key || null,
    schemaVersion: row.schema_version || null,
    correctionMessage: row.correction_message || null,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

function serializeComment(row) {
  return {
    id: row.id,
    body: row.body,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

function serializeCredential(row) {
  if (!row) return { status: "NONE" };
  return {
    status: row.status,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at
  };
}

function serializeHandoff(row) {
  if (!row) return null;
  const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
  return {
    id: row.id,
    schemaVersion: row.schema_version,
    createdAt: row.created_at,
    createdBy: row.created_by,
    readinessState: row.readiness_state,
    overrideUsed: Boolean(row.override_used),
    payload
  };
}

module.exports = { createWebProjectService, serializeCredential };
