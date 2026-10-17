const {
  AUDIT_ACTIONS,
  ERROR_CODES,
  MOCKUP_STATUSES,
  MOCKUP_EDITABLE_STATUSES
} = require("./constants");
const { WebProjectError } = require("./errors");
const { rejectIfSecret } = require("./secrets");
const { hasOwn } = require("./httpContract");
const { responseMap, resolveSchemaVersion } = require("./formRegistry");
const { generateMockupFromArchitecture } = require("./mockupGenerator");
const { validateMockup } = require("./mockupValidator");
const { assembleMockupPayload, serializeMockupSection } = require("./mockupAssembler");
const {
  resolvePreviewItem,
  assertCompatiblePreviewItem
} = require("./mockupPreviewUtils");

function createMockupOperations(deps) {
  const {
    store,
    runTx,
    audit,
    requireProject,
    assertNotArchived,
    transition,
    notifySafe,
    WEB_PROJECT_NOTIFICATION_EVENTS,
    addReview
  } = deps;

  function assertMockupWorkflow(project) {
    if (project.workflow_status !== "MOCKUP") {
      throw new WebProjectError(
        409,
        ERROR_CODES.MOCKUP_WORKFLOW_BLOCKED,
        "La maqueta solo se puede editar en fase MOCKUP."
      );
    }
  }

  async function requireMockup(tx, organizationId, projectId, mockupId) {
    const row = await tx.getMockup(organizationId, projectId, mockupId);
    if (!row) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Maqueta no encontrada");
    return row;
  }

  async function requireEditableMockup(tx, organizationId, projectId, mockupId) {
    const row = await requireMockup(tx, organizationId, projectId, mockupId);
    if (!MOCKUP_EDITABLE_STATUSES.includes(row.status)) {
      throw new WebProjectError(
        409,
        ERROR_CODES.MOCKUP_NOT_EDITABLE,
        "La maqueta aprobada o en revisión cliente es de solo lectura. Crea una revisión."
      );
    }
    return row;
  }

  async function loadMockupBundle(tx, organizationId, projectId, mockupId, { clientSafe = false } = {}) {
    const mockup = await requireMockup(tx, organizationId, projectId, mockupId);
    const [pages, sections, versions, approvedArchitecture, archPages, archBlocks, documents, items] =
      await Promise.all([
        tx.listMockupPages(organizationId, projectId, mockupId),
        tx.listMockupSections(organizationId, projectId, mockupId),
        tx.listMockups(organizationId, projectId),
        tx.getArchitecture(organizationId, projectId, mockup.architecture_id),
        tx.listArchitecturePages(organizationId, projectId, mockup.architecture_id),
        tx.listArchitectureBlocks(organizationId, projectId, mockup.architecture_id),
        tx.listDocuments(organizationId, projectId),
        tx.listItems(organizationId, projectId)
      ]);
    const validDocumentIds = new Set((documents || []).map((d) => String(d.id)));
    let previewItem = null;
    if (mockup.preview_item_id) {
      previewItem = (items || []).find((i) => i.id === mockup.preview_item_id) || null;
    }
    return assembleMockupPayload({
      mockup,
      versions,
      pages,
      sections,
      approvedArchitecture,
      architecturePages: archPages,
      architectureBlocks: archBlocks,
      validDocumentIds,
      previewItem,
      items,
      clientSafe
    });
  }

  function pid(projectId) {
    return Number(projectId);
  }

  async function getMockup(organizationId, projectId, { mockupId, clientSafe = false } = {}) {
    projectId = pid(projectId);
    const project = await requireProject(store, organizationId, projectId);
    let targetId = mockupId;
    if (!targetId) {
      if (clientSafe) {
        const clientVisible = await store.getClientVisibleMockup(organizationId, projectId);
        targetId = clientVisible?.id || null;
      } else {
        const draft = await store.getActiveMockup(organizationId, projectId);
        const clientVisible = await store.getClientVisibleMockup(organizationId, projectId);
        const approved = await store.getCurrentApprovedMockup(organizationId, projectId);
        const changesRequested = await store.getChangesRequestedMockup(organizationId, projectId);
        targetId =
          draft?.id || clientVisible?.id || approved?.id || changesRequested?.id || null;
      }
    }
    if (!targetId) {
      return {
        mockup: null,
        versions: [],
        pages: [],
        sections: [],
        validation: { state: "INVALID", errors: [], warnings: [], metrics: { pages: 0, sections: 0 } },
        organizationId,
        projectId: Number(projectId),
        workflowStatus: project.workflow_status
      };
    }
    const bundle = await loadMockupBundle(store, organizationId, projectId, targetId, { clientSafe });
    return { ...bundle, organizationId, projectId: Number(projectId), workflowStatus: project.workflow_status };
  }

  async function generateMockup(organizationId, projectId, actorUserId) {
    projectId = pid(projectId);
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      assertMockupWorkflow(project);
      const approved = await tx.getCurrentApprovedArchitecture(organizationId, projectId);
      if (!approved) {
        throw new WebProjectError(
          409,
          ERROR_CODES.MOCKUP_NOT_READY,
          "Se requiere arquitectura aprobada para generar la maqueta."
        );
      }
      const existingDraft = await tx.getActiveMockup(organizationId, projectId);
      if (existingDraft) {
        throw new WebProjectError(
          409,
          ERROR_CODES.MOCKUP_DRAFT_EXISTS,
          "Ya existe una maqueta editable. Usa revisión o continúa el borrador."
        );
      }
      const versions = await tx.listMockups(organizationId, projectId);
      const version = versions.length ? Math.max(...versions.map((v) => v.version)) + 1 : 1;
      const [archPages, archBlocks, responses, documents, items] = await Promise.all([
        tx.listArchitecturePages(organizationId, projectId, approved.id),
        tx.listArchitectureBlocks(organizationId, projectId, approved.id),
        tx.listFormResponses(organizationId, projectId),
        tx.listDocuments(organizationId, projectId),
        tx.listItems(organizationId, projectId)
      ]);
      const values = responseMap(responses, resolveSchemaVersion(responses));
      const generated = generateMockupFromArchitecture({
        architecture: approved,
        pages: archPages,
        blocks: archBlocks,
        values,
        documents,
        items
      });
      const mockupRow = await tx.insertMockup({
        organization_id: organizationId,
        web_project_id: projectId,
        version,
        status: "DRAFT",
        architecture_id: approved.id,
        architecture_version: approved.version,
        visual_direction: generated.visual_direction,
        design_tokens: generated.design_tokens,
        header_variant: generated.header_variant,
        footer_variant: generated.footer_variant,
        preview_item_id: generated.preview_item_id,
        preview_item_type: generated.preview_item_type,
        metadata: {},
        created_by: actorUserId
      });
      const insertedPages = [];
      for (const page of generated.pages) {
        const row = await tx.insertMockupPage({
          organization_id: organizationId,
          web_project_id: projectId,
          mockup_id: mockupRow.id,
          architecture_page_id: page.architecture_page_id,
          title: page.title,
          route: page.route,
          page_type: page.page_type,
          template_type: page.template_type,
          status: page.status,
          visual_notes: page.visual_notes,
          responsive_settings: page.responsive_settings,
          sort_order: page.sort_order
        });
        insertedPages.push(row);
      }
      const pageByArchId = new Map(insertedPages.map((p) => [p.architecture_page_id, p]));
      for (const section of generated.sections) {
        const mockPage = pageByArchId.get(section._pageArchitectureId);
        if (!mockPage) continue;
        await tx.insertMockupSection({
          organization_id: organizationId,
          web_project_id: projectId,
          mockup_id: mockupRow.id,
          mockup_page_id: mockPage.id,
          architecture_block_id: section.architecture_block_id,
          section_type: section.section_type,
          variant: section.variant,
          alignment: section.alignment,
          density: section.density,
          visual_props: section.visual_props,
          asset_document_id: section.asset_document_id,
          placeholder_text: section.placeholder_text,
          sort_order: section.sort_order,
          required: section.required,
          visual_notes: section.visual_notes
        });
      }
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.MOCKUP_GENERATED, {
        projectId: Number(projectId),
        mockupId: mockupRow.id,
        version: mockupRow.version,
        architectureId: approved.id
      });
      return loadMockupBundle(tx, organizationId, projectId, mockupRow.id);
    });
  }

  async function validateMockupState(organizationId, projectId, mockupId) {
    const bundle = await loadMockupBundle(store, organizationId, projectId, mockupId);
    return { validation: bundle.validation, mockupId: Number(mockupId) };
  }

  async function updateMockup(organizationId, projectId, mockupId, actorUserId, input) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      assertMockupWorkflow(project);
      await requireEditableMockup(tx, organizationId, projectId, mockupId);
      const patch = {};
      if (hasOwn(input, "visualDirection") || hasOwn(input, "visual_direction")) {
        patch.visual_direction = input.visualDirection || input.visual_direction;
      }
      if (hasOwn(input, "designTokens") || hasOwn(input, "design_tokens")) {
        patch.design_tokens = input.designTokens || input.design_tokens;
      }
      if (hasOwn(input, "headerVariant") || hasOwn(input, "header_variant")) {
        patch.header_variant = input.headerVariant || input.header_variant;
      }
      if (hasOwn(input, "footerVariant") || hasOwn(input, "footer_variant")) {
        patch.footer_variant = input.footerVariant || input.footer_variant;
      }
      if (hasOwn(input, "previewItemId") || hasOwn(input, "preview_item_id")) {
        const rawPreviewId = input.previewItemId ?? input.preview_item_id ?? null;
        if (rawPreviewId == null) {
          patch.preview_item_id = null;
          patch.preview_item_type = null;
        } else {
          const items = await tx.listItems(organizationId, projectId);
          const item = resolvePreviewItem(items, rawPreviewId);
          if (!item) {
            throw new WebProjectError(
              404,
              ERROR_CODES.PREVIEW_ITEM_NOT_FOUND,
              "Item de preview no encontrado."
            );
          }
          const previewPageId = input.previewPageId ?? input.preview_page_id;
          if (previewPageId) {
            const page = await tx.getMockupPage(organizationId, projectId, previewPageId);
            if (!page || Number(page.mockup_id) !== Number(mockupId)) {
              throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Página de maqueta no encontrada.");
            }
            const check = assertCompatiblePreviewItem(item, page);
            if (!check.ok) {
              throw new WebProjectError(
                check.code === "PREVIEW_ITEM_INCOMPATIBLE" ? 409 : 400,
                check.code || ERROR_CODES.VALIDATION_ERROR,
                check.message
              );
            }
            patch.preview_item_id = item.id;
            patch.preview_item_type = check.expectedType;
          } else {
            const expectedType = input.previewItemType ?? input.preview_item_type;
            const itemType = item.item_type || item.itemType;
            if (expectedType && itemType !== expectedType) {
              throw new WebProjectError(
                409,
                ERROR_CODES.PREVIEW_ITEM_INCOMPATIBLE,
                `El item no es compatible con el tipo de preview (${expectedType} requerido).`
              );
            }
            patch.preview_item_id = item.id;
            patch.preview_item_type = itemType;
          }
        }
      } else if (hasOwn(input, "previewItemType") || hasOwn(input, "preview_item_type")) {
        patch.preview_item_type = input.previewItemType ?? input.preview_item_type ?? null;
      }
      if (hasOwn(input, "internalNotes") || hasOwn(input, "internal_notes")) {
        const notes = String(input.internalNotes ?? input.internal_notes ?? "").trim();
        if (notes) rejectIfSecret(notes, "internal notes");
        patch.internal_notes = notes || null;
      }
      if (Object.keys(patch).length) {
        await tx.updateMockup(organizationId, projectId, mockupId, patch);
      }
      return loadMockupBundle(tx, organizationId, projectId, mockupId);
    });
  }

  async function updateMockupPage(organizationId, projectId, pageId, actorUserId, input) {
    return runTx(async (tx) => {
      const page = await tx.getMockupPage(organizationId, projectId, pageId);
      if (!page) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Página de maqueta no encontrada");
      const project = await requireProject(tx, organizationId, projectId);
      assertMockupWorkflow(project);
      await requireEditableMockup(tx, organizationId, projectId, page.mockup_id);
      const patch = {};
      if (hasOwn(input, "visualNotes") || hasOwn(input, "visual_notes")) {
        const val = String(input.visualNotes ?? input.visual_notes ?? "").trim();
        if (val) rejectIfSecret(val, "visual notes");
        patch.visual_notes = val || null;
      }
      if (hasOwn(input, "responsiveSettings") || hasOwn(input, "responsive_settings")) {
        patch.responsive_settings = input.responsiveSettings || input.responsive_settings;
      }
      if (hasOwn(input, "status")) patch.status = input.status;
      await tx.updateMockupPage(organizationId, projectId, pageId, patch);
      return loadMockupBundle(tx, organizationId, projectId, page.mockup_id);
    });
  }

  async function updateMockupSection(organizationId, projectId, sectionId, actorUserId, input) {
    return runTx(async (tx) => {
      const section = await tx.getMockupSection(organizationId, projectId, sectionId);
      if (!section) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Sección no encontrada");
      const project = await requireProject(tx, organizationId, projectId);
      assertMockupWorkflow(project);
      await requireEditableMockup(tx, organizationId, projectId, section.mockup_id);
      const patch = {};
      for (const [camel, snake] of [
        ["variant", "variant"],
        ["alignment", "alignment"],
        ["density", "density"],
        ["visualProps", "visual_props"],
        ["assetDocumentId", "asset_document_id"],
        ["placeholderText", "placeholder_text"],
        ["sortOrder", "sort_order"],
        ["visualNotes", "visual_notes"]
      ]) {
        if (hasOwn(input, camel) || hasOwn(input, snake)) {
          let val = input[camel] ?? input[snake];
          if (typeof val === "string" && val.trim()) rejectIfSecret(val, snake);
          patch[snake] = val;
        }
      }
      await tx.updateMockupSection(organizationId, projectId, sectionId, patch);
      const mockupId = section.mockup_id;
      return loadMockupBundle(tx, organizationId, projectId, mockupId);
    });
  }

  async function startInternalReview(organizationId, projectId, mockupId, actorUserId) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertMockupWorkflow(project);
      const mockup = await requireEditableMockup(tx, organizationId, projectId, mockupId);
      if (mockup.status !== "DRAFT") {
        throw new WebProjectError(409, ERROR_CODES.INVALID_TRANSITION, "Estado no válido para revisión interna.");
      }
      const bundle = await loadMockupBundle(tx, organizationId, projectId, mockupId);
      if (bundle.validation.state === "INVALID") {
        throw new WebProjectError(409, ERROR_CODES.MOCKUP_INVALID, "La maqueta necesita correcciones.", {
          validation: bundle.validation
        });
      }
      await tx.updateMockup(organizationId, projectId, mockupId, { status: "INTERNAL_REVIEW" });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.MOCKUP_INTERNAL_REVIEW_STARTED, {
        projectId: Number(projectId),
        mockupId: Number(mockupId)
      });
      return loadMockupBundle(tx, organizationId, projectId, mockupId);
    });
  }

  async function sendMockupToClient(organizationId, projectId, mockupId, actorUserId, options = {}) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertMockupWorkflow(project);
      const mockup = await requireMockup(tx, organizationId, projectId, mockupId);
      if (!["DRAFT", "INTERNAL_REVIEW"].includes(mockup.status)) {
        throw new WebProjectError(409, ERROR_CODES.INVALID_TRANSITION, "No se puede enviar al cliente en este estado.");
      }
      const bundle = await loadMockupBundle(tx, organizationId, projectId, mockupId);
      if (bundle.validation.state === "INVALID") {
        throw new WebProjectError(409, ERROR_CODES.MOCKUP_INVALID, "La maqueta no está lista.", {
          validation: bundle.validation
        });
      }
      if (bundle.validation.state === "READY_WITH_WARNINGS" && !options.acknowledgeWarnings) {
        throw new WebProjectError(409, ERROR_CODES.MOCKUP_OVERRIDE_REQUIRED, "Confirma los avisos antes de enviar.", {
          validation: bundle.validation
        });
      }
      await tx.updateMockup(organizationId, projectId, mockupId, {
        status: "CLIENT_REVIEW",
        sent_to_client_at: new Date().toISOString(),
        sent_to_client_by: actorUserId
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.MOCKUP_SENT_TO_CLIENT, {
        projectId: Number(projectId),
        mockupId: Number(mockupId),
        version: mockup.version
      });
      const updated = await loadMockupBundle(tx, organizationId, projectId, mockupId);
      await notifySafe(WEB_PROJECT_NOTIFICATION_EVENTS.MOCKUP_SENT_TO_CLIENT, {
        organizationId,
        actorUserId,
        project,
        mockupId: Number(mockupId)
      });
      return updated;
    });
  }

  async function createMockupRevision(organizationId, projectId, actorUserId) {
    projectId = pid(projectId);
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertMockupWorkflow(project);
      const changesRequested = (await tx.listMockups(organizationId, projectId))
        .filter((row) => row.status === "CHANGES_REQUESTED")
        .sort((a, b) => b.version - a.version)[0];
      const clientVisible = await tx.getClientVisibleMockup(organizationId, projectId);
      const base =
        changesRequested ||
        clientVisible ||
        (await tx.getCurrentApprovedMockup(organizationId, projectId));
      if (!base) {
        throw new WebProjectError(409, ERROR_CODES.MOCKUP_NOT_READY, "No hay maqueta base para revisión.");
      }
      const existingDraft = await tx.getActiveMockup(organizationId, projectId);
      if (existingDraft) {
        throw new WebProjectError(409, ERROR_CODES.MOCKUP_DRAFT_EXISTS, "Ya existe un borrador editable.");
      }
      const versions = await tx.listMockups(organizationId, projectId);
      const version = Math.max(...versions.map((v) => v.version)) + 1;
      if (base.status === "APPROVED") {
        await tx.updateMockup(organizationId, projectId, base.id, { status: "SUPERSEDED" });
      }
      const copy = await tx.insertMockup({
        organization_id: organizationId,
        web_project_id: projectId,
        version,
        status: "DRAFT",
        architecture_id: base.architecture_id,
        architecture_version: base.architecture_version,
        visual_direction: base.visual_direction,
        design_tokens: base.design_tokens,
        header_variant: base.header_variant,
        footer_variant: base.footer_variant,
        preview_item_id: base.preview_item_id,
        preview_item_type: base.preview_item_type,
        metadata: base.metadata,
        internal_notes: base.internal_notes,
        supersedes_mockup_id: base.id,
        created_by: actorUserId
      });
      const [pages, sections] = await Promise.all([
        tx.listMockupPages(organizationId, projectId, base.id),
        tx.listMockupSections(organizationId, projectId, base.id)
      ]);
      const pageIdMap = new Map();
      for (const page of pages.filter((p) => !p.archived_at)) {
        const inserted = await tx.insertMockupPage({
          organization_id: organizationId,
          web_project_id: projectId,
          mockup_id: copy.id,
          architecture_page_id: page.architecture_page_id,
          title: page.title,
          route: page.route,
          page_type: page.page_type,
          template_type: page.template_type,
          status: page.status,
          visual_notes: page.visual_notes,
          responsive_settings: page.responsive_settings,
          sort_order: page.sort_order
        });
        pageIdMap.set(page.id, inserted.id);
      }
      for (const section of sections.filter((s) => !s.archived_at)) {
        await tx.insertMockupSection({
          organization_id: organizationId,
          web_project_id: projectId,
          mockup_id: copy.id,
          mockup_page_id: pageIdMap.get(section.mockup_page_id),
          architecture_block_id: section.architecture_block_id,
          section_type: section.section_type,
          variant: section.variant,
          alignment: section.alignment,
          density: section.density,
          visual_props: section.visual_props,
          asset_document_id: section.asset_document_id,
          placeholder_text: section.placeholder_text,
          sort_order: section.sort_order,
          required: section.required,
          visual_notes: section.visual_notes
        });
      }
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.MOCKUP_REVISION_CREATED, {
        projectId: Number(projectId),
        mockupId: copy.id,
        version: copy.version,
        supersedes: base.id
      });
      return loadMockupBundle(tx, organizationId, projectId, copy.id);
    });
  }

  async function clientApproveMockup(organizationId, projectId, actorUserId) {
    projectId = pid(projectId);
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      const mockup = await tx.getClientVisibleMockup(organizationId, projectId);
      if (!mockup || mockup.status !== "CLIENT_REVIEW") {
        throw new WebProjectError(409, ERROR_CODES.MOCKUP_NOT_READY, "No hay maqueta pendiente de aprobación.");
      }
      await tx.updateMockup(organizationId, projectId, mockup.id, {
        status: "APPROVED",
        approved_by: actorUserId,
        approved_at: new Date().toISOString()
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.MOCKUP_APPROVED, {
        projectId: Number(projectId),
        mockupId: mockup.id,
        version: mockup.version
      });
      await notifySafe(WEB_PROJECT_NOTIFICATION_EVENTS.MOCKUP_APPROVED, {
        organizationId,
        actorUserId,
        project,
        mockupId: mockup.id
      });
      return loadMockupBundle(tx, organizationId, projectId, mockup.id, { clientSafe: true });
    });
  }

  async function clientRequestMockupChanges(organizationId, projectId, actorUserId, input) {
    projectId = pid(projectId);
    const message = String(input?.message || input?.correctionMessage || "").trim();
    if (!message) {
      throw new WebProjectError(400, ERROR_CODES.CORRECTION_MESSAGE_REQUIRED, "El comentario es obligatorio.");
    }
    rejectIfSecret(message, "correction message");
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      const mockup = await tx.getClientVisibleMockup(organizationId, projectId);
      if (!mockup || mockup.status !== "CLIENT_REVIEW") {
        throw new WebProjectError(409, ERROR_CODES.MOCKUP_NOT_READY, "No hay maqueta en revisión cliente.");
      }
      await tx.updateMockup(organizationId, projectId, mockup.id, { status: "CHANGES_REQUESTED" });
      await addReview(organizationId, projectId, actorUserId, {
        targetType: "MOCKUP",
        targetId: String(mockup.id),
        verdict: "CORRECTION_REQUESTED",
        correctionMessage: message,
        summary: "Cambios solicitados en maqueta"
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.MOCKUP_CHANGES_REQUESTED, {
        projectId: Number(projectId),
        mockupId: mockup.id
      });
      await notifySafe(WEB_PROJECT_NOTIFICATION_EVENTS.MOCKUP_CHANGES_REQUESTED, {
        organizationId,
        actorUserId,
        project,
        mockupId: mockup.id
      });
      return loadMockupBundle(tx, organizationId, projectId, mockup.id, { clientSafe: true });
    });
  }

  return {
    getMockup,
    generateMockup,
    updateMockup,
    updateMockupPage,
    updateMockupSection,
    validateMockupState,
    startInternalReview,
    sendMockupToClient,
    createMockupRevision,
    clientApproveMockup,
    clientRequestMockupChanges
  };
}

module.exports = { createMockupOperations };
