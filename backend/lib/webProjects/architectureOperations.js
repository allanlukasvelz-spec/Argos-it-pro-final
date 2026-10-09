const {
  AUDIT_ACTIONS,
  ERROR_CODES,
  ARCHITECTURE_STATUSES,
  ARCHITECTURE_PAGE_TYPES,
  ARCHITECTURE_TEMPLATE_TYPES,
  ARCHITECTURE_NAV_PLACEMENTS,
  ARCHITECTURE_SEO_PRIORITIES,
  ARCHITECTURE_BLOCK_TYPES,
  ARCHITECTURE_CONTENT_BINDING_TYPES,
  ARCHITECTURE_CONTENT_BINDING_MODES,
  ARCHITECTURE_MIGRATION_DISPOSITIONS,
  MAX_COMMENT_LENGTH
} = require("./constants");
const { WebProjectError } = require("./errors");
const { rejectIfSecret } = require("./secrets");
const { hasOwn } = require("./httpContract");
const { responseMap, resolveSchemaVersion } = require("./formRegistry");
const { generateStarterArchitecture } = require("./architectureGenerator");
const { validateArchitecture } = require("./architectureValidator");
const { assembleArchitecturePayload, serializePage, serializeBlock } = require("./architectureAssembler");
const {
  normalizePageSlug,
  recalculateRoutes,
  detectCycle,
  pageIdOf,
  parentIdOf,
  DYNAMIC_SLUG
} = require("./architectureRouteUtils");
const { buildProjectBrief } = require("./briefBuilder");
const { evaluateArchitectureReadiness } = require("./architectureReadiness");

function createArchitectureOperations(deps) {
  const {
    store,
    runTx,
    audit,
    requireProject,
    assertNotArchived,
    assertNotCompleted,
    transition,
    notifySafe,
    WEB_PROJECT_NOTIFICATION_EVENTS
  } = deps;

  function assertArchitectureWorkflow(project) {
    if (project.workflow_status !== "ARCHITECTURE") {
      throw new WebProjectError(
        409,
        ERROR_CODES.ARCHITECTURE_WORKFLOW_BLOCKED,
        "La arquitectura solo se puede editar en fase ARCHITECTURE."
      );
    }
  }

  async function requireArchitecture(tx, organizationId, projectId, architectureId) {
    const row = await tx.getArchitecture(organizationId, projectId, architectureId);
    if (!row) {
      throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Arquitectura no encontrada");
    }
    return row;
  }

  async function requireMutableArchitecture(tx, organizationId, projectId, architectureId) {
    const row = await requireArchitecture(tx, organizationId, projectId, architectureId);
    if (row.status !== "DRAFT") {
      throw new WebProjectError(
        409,
        ERROR_CODES.ARCHITECTURE_NOT_EDITABLE,
        "La arquitectura aprobada es de solo lectura. Crea una revisión."
      );
    }
    return row;
  }

  async function loadArchitectureBundle(tx, organizationId, projectId, architectureId) {
    const architecture = await requireArchitecture(tx, organizationId, projectId, architectureId);
    const [pages, blocks, versions, notes, responses] = await Promise.all([
      tx.listArchitecturePages(organizationId, projectId, architectureId),
      tx.listArchitectureBlocks(organizationId, projectId, architectureId),
      tx.listArchitectures(organizationId, projectId),
      tx.listBriefNotes(organizationId, projectId),
      tx.listFormResponses(organizationId, projectId)
    ]);
    const schemaVersion = resolveSchemaVersion(responses);
    const values = responseMap(responses, schemaVersion);
    return assembleArchitecturePayload({
      architecture,
      versions,
      pages,
      blocks,
      values,
      notes
    });
  }

  async function getArchitecture(organizationId, projectId, { architectureId } = {}) {
    const project = await requireProject(store, organizationId, projectId);
    let targetId = architectureId;
    if (!targetId) {
      const draft = await store.getDraftArchitecture(organizationId, projectId);
      const approved = await store.getCurrentApprovedArchitecture(organizationId, projectId);
      targetId = draft?.id || approved?.id || null;
    }
    if (!targetId) {
      return {
        architecture: null,
        versions: [],
        pages: [],
        blocks: [],
        tree: [],
        validation: { state: "INVALID", errors: [], warnings: [], metrics: { pages: 0, templates: 0, blocks: 0, homeCount: 0 } },
        organizationId,
        projectId: Number(projectId),
        workflowStatus: project.workflow_status
      };
    }
    const bundle = await loadArchitectureBundle(store, organizationId, projectId, targetId);
    return { ...bundle, organizationId, projectId: Number(projectId), workflowStatus: project.workflow_status };
  }

  async function resolveParentIds(tx, pages, insertedPages) {
    const tempMap = new Map();
    insertedPages.forEach((page, index) => {
      if (pages[index]?.tempId) tempMap.set(pages[index].tempId, page.id);
    });
    for (let i = 0; i < pages.length; i += 1) {
      const source = pages[i];
      const inserted = insertedPages[i];
      const parentTemp = source.parent_temp_id || source._pendingParentTemp;
      if (parentTemp && tempMap.has(parentTemp)) {
        await tx.updateArchitecturePage(
          inserted.organization_id,
          inserted.web_project_id,
          inserted.id,
          { parent_page_id: tempMap.get(parentTemp) }
        );
      }
    }
  }

  async function generateArchitecture(organizationId, projectId, actorUserId) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      assertArchitectureWorkflow(project);
      const existingDraft = await tx.getDraftArchitecture(organizationId, projectId);
      if (existingDraft) {
        throw new WebProjectError(
          409,
          ERROR_CODES.ARCHITECTURE_DRAFT_EXISTS,
          "Ya existe un borrador de arquitectura. Edítalo o aprueba antes de generar otro.",
          { architectureId: existingDraft.id, version: existingDraft.version }
        );
      }
      const versions = await tx.listArchitectures(organizationId, projectId);
      const nextVersion = versions.length ? Math.max(...versions.map((v) => v.version)) + 1 : 1;
      const [responses, items, documents, reviews, notes, credential] = await Promise.all([
        tx.listFormResponses(organizationId, project.id),
        tx.listItems(organizationId, project.id),
        tx.listDocuments(organizationId, project.id),
        tx.listReviews(organizationId, project.id),
        tx.listBriefNotes(organizationId, project.id),
        tx.getCredentialStatus(organizationId, project.id)
      ]);
      const schemaVersion = resolveSchemaVersion(responses);
      const values = responseMap(responses, schemaVersion);
      const brief = buildProjectBrief({
        project,
        values,
        responses,
        items,
        documents,
        reviews,
        reviewStates: [],
        reviewSummary: {},
        progress: {},
        credential,
        notes,
        schemaVersion,
        architectureReadiness: evaluateArchitectureReadiness({
          project,
          values,
          items,
          notes,
          credential,
          progress: {},
          reviewStates: [],
          schemaVersion
        })
      });
      const generated = generateStarterArchitecture({ project, values, items, brief });
      const archRow = await tx.insertArchitecture({
        organization_id: organizationId,
        web_project_id: project.id,
        version: nextVersion,
        status: "DRAFT",
        primary_language: generated.architecture.primary_language,
        additional_languages: generated.architecture.additional_languages,
        language_selector_required: generated.architecture.language_selector_required,
        metadata: generated.architecture.metadata,
        created_by: actorUserId || null
      });
      const insertedPages = [];
      for (const page of generated.pages) {
        const parentId = page.parent_page_id || null;
        const inserted = await tx.insertArchitecturePage({
          organization_id: organizationId,
          web_project_id: project.id,
          architecture_id: archRow.id,
          title: page.title,
          slug: page.slug,
          route: page.route || "/",
          page_type: page.page_type,
          template_type: page.template_type,
          parent_page_id: parentId,
          sort_order: page.sort_order,
          navigation_placement: page.navigation_placement,
          navigation_label: page.navigation_label,
          purpose: page.purpose,
          summary: page.summary,
          primary_cta: page.primary_cta,
          secondary_cta: page.secondary_cta,
          seo_priority: page.seo_priority,
          content_readiness: page.content_readiness,
          content_binding_type: page.content_binding_type,
          content_binding_mode: page.content_binding_mode,
          source_page_item_id: page.source_page_item_id,
          migration_disposition: page.migration_disposition,
          entity_count: page.entity_count
        });
        insertedPages.push(inserted);
      }
      await resolveParentIds(tx, generated.pages, insertedPages);
      const allPages = await tx.listArchitecturePages(organizationId, project.id, archRow.id);
      const routed = recalculateRoutes(allPages);
      for (const page of routed) {
        await tx.updateArchitecturePage(organizationId, project.id, page.id, { route: page.route });
      }
      const pageIdByTemp = new Map();
      generated.pages.forEach((p, i) => {
        if (p.tempId) pageIdByTemp.set(p.tempId, insertedPages[i].id);
      });
      for (const page of generated.pages) {
        const pageId = pageIdByTemp.get(page.tempId);
        for (const block of page._blocks || []) {
          await tx.insertArchitectureBlock({
            organization_id: organizationId,
            web_project_id: project.id,
            architecture_id: archRow.id,
            architecture_page_id: pageId,
            block_type: block.block_type,
            sort_order: block.sort_order,
            title: block.title || null,
            purpose: block.purpose || null,
            notes: block.notes || null,
            content_source_type: block.content_source_type || null,
            content_source_id: block.content_source_id || null,
            required: Boolean(block.required)
          });
        }
      }
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.ARCHITECTURE_GENERATED, {
        projectId: project.id,
        architectureId: archRow.id,
        version: archRow.version
      });
      return loadArchitectureBundle(tx, organizationId, project.id, archRow.id);
    });
  }

  function normalizePageInput(input, { partial } = {}) {
    const patch = {};
    if (hasOwn(input, "title")) {
      const title = String(input.title || "").trim();
      if (!partial && !title) throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_PAGE_INVALID, "Título obligatorio");
      if (title) {
        rejectIfSecret(title, "page title");
        patch.title = title.slice(0, 200);
      }
    } else if (!partial) {
      throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_PAGE_INVALID, "Título obligatorio");
    }
    if (hasOwn(input, "slug") || hasOwn(input, "pageType")) {
      const home = (input.pageType || input.page_type) === "HOME";
      const dynamic = (input.templateType || input.template_type) === "DETAIL";
      const slug = home ? "" : normalizePageSlug(input.slug);
      if (!home && !dynamic && !slug) {
        throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_PAGE_INVALID, "Slug no válido");
      }
      patch.slug = home ? "" : dynamic ? DYNAMIC_SLUG : slug;
    }
    const pageType = input.pageType || input.page_type;
    if (pageType) {
      if (!ARCHITECTURE_PAGE_TYPES.includes(pageType)) {
        throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_PAGE_INVALID, "Tipo de página no válido");
      }
      patch.page_type = pageType;
    } else if (!partial) {
      throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_PAGE_INVALID, "Tipo de página obligatorio");
    }
    const templateType = input.templateType || input.template_type;
    if (templateType) {
      if (!ARCHITECTURE_TEMPLATE_TYPES.includes(templateType)) {
        throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_PAGE_INVALID, "Tipo de plantilla no válido");
      }
      patch.template_type = templateType;
    } else if (!partial) {
      throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_PAGE_INVALID, "Tipo de plantilla obligatorio");
    }
    if (hasOwn(input, "parentPageId") || hasOwn(input, "parent_page_id")) {
      patch.parent_page_id = input.parentPageId ?? input.parent_page_id ?? null;
    }
    if (hasOwn(input, "sortOrder") || hasOwn(input, "sort_order")) {
      patch.sort_order = Number(input.sortOrder ?? input.sort_order ?? 0);
    }
    if (hasOwn(input, "navigationPlacement") || hasOwn(input, "navigation_placement")) {
      const nav = input.navigationPlacement || input.navigation_placement;
      if (!ARCHITECTURE_NAV_PLACEMENTS.includes(nav)) {
        throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_PAGE_INVALID, "Ubicación de navegación no válida");
      }
      patch.navigation_placement = nav;
    }
    for (const [camel, snake] of [
      ["navigationLabel", "navigation_label"],
      ["purpose", "purpose"],
      ["summary", "summary"],
      ["primaryCta", "primary_cta"],
      ["secondaryCta", "secondary_cta"]
    ]) {
      if (hasOwn(input, camel) || hasOwn(input, snake)) {
        const val = String(input[camel] ?? input[snake] ?? "").trim();
        if (val) rejectIfSecret(val, snake);
        patch[snake] = val || null;
      }
    }
    if (hasOwn(input, "seoPriority") || hasOwn(input, "seo_priority")) {
      const seo = input.seoPriority || input.seo_priority;
      if (!ARCHITECTURE_SEO_PRIORITIES.includes(seo)) {
        throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_PAGE_INVALID, "Prioridad SEO no válida");
      }
      patch.seo_priority = seo;
    }
    if (hasOwn(input, "contentBindingType") || hasOwn(input, "content_binding_type")) {
      const val = input.contentBindingType ?? input.content_binding_type ?? null;
      if (val && !ARCHITECTURE_CONTENT_BINDING_TYPES.includes(val)) {
        throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_PAGE_INVALID, "Content binding no válido");
      }
      patch.content_binding_type = val;
    }
    if (hasOwn(input, "contentBindingMode") || hasOwn(input, "content_binding_mode")) {
      const val = input.contentBindingMode ?? input.content_binding_mode ?? null;
      if (val && !ARCHITECTURE_CONTENT_BINDING_MODES.includes(val)) {
        throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_PAGE_INVALID, "Modo de binding no válido");
      }
      patch.content_binding_mode = val;
    }
    if (hasOwn(input, "migrationDisposition") || hasOwn(input, "migration_disposition")) {
      const val = input.migrationDisposition ?? input.migration_disposition ?? null;
      if (val && !ARCHITECTURE_MIGRATION_DISPOSITIONS.includes(val)) {
        throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_PAGE_INVALID, "Disposición no válida");
      }
      patch.migration_disposition = val;
    }
    return patch;
  }

  async function recalcRoutesForArchitecture(tx, organizationId, projectId, architectureId) {
    const pages = await tx.listArchitecturePages(organizationId, projectId, architectureId);
    const routed = recalculateRoutes(pages);
    for (const page of routed) {
      await tx.updateArchitecturePage(organizationId, projectId, page.id, { route: page.route });
    }
  }

  async function createArchitecturePage(organizationId, projectId, actorUserId, input) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      assertArchitectureWorkflow(project);
      const architectureId = input.architectureId || input.architecture_id;
      const architecture = await requireMutableArchitecture(tx, organizationId, projectId, architectureId);
      const patch = normalizePageInput(input);
      const home = patch.page_type === "HOME";
      const dynamic = patch.template_type === "DETAIL";
      const slug =
        patch.slug !== undefined
          ? patch.slug
          : home
            ? ""
            : dynamic
              ? DYNAMIC_SLUG
              : normalizePageSlug(input.slug);
      if (!home && !dynamic && !slug) {
        throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_PAGE_INVALID, "Slug obligatorio");
      }
      const inserted = await tx.insertArchitecturePage({
        organization_id: organizationId,
        web_project_id: project.id,
        architecture_id: architecture.id,
        title: patch.title,
        slug,
        route: "/",
        page_type: patch.page_type,
        template_type: patch.template_type,
        parent_page_id: patch.parent_page_id ?? null,
        sort_order: patch.sort_order ?? 999,
        navigation_placement: patch.navigation_placement || "NONE",
        navigation_label: patch.navigation_label || null,
        purpose: patch.purpose || null,
        summary: patch.summary || null,
        primary_cta: patch.primary_cta || null,
        secondary_cta: patch.secondary_cta || null,
        seo_priority: patch.seo_priority || "MEDIUM",
        content_readiness: "PARTIAL",
        content_binding_type: patch.content_binding_type || null,
        content_binding_mode: patch.content_binding_mode || null,
        migration_disposition: patch.migration_disposition || null
      });
      if (patch.parent_page_id) {
        const pages = await tx.listArchitecturePages(organizationId, project.id, architecture.id);
        const pagesById = new Map(pages.map((p) => [p.id, p]));
        if (detectCycle(inserted.id, patch.parent_page_id, pagesById)) {
          throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_PAGE_INVALID, "Jerarquía no válida");
        }
      }
      await recalcRoutesForArchitecture(tx, organizationId, project.id, architecture.id);
      return serializePage(await tx.getArchitecturePage(organizationId, project.id, inserted.id));
    });
  }

  async function updateArchitecturePage(organizationId, projectId, pageId, actorUserId, input) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      assertArchitectureWorkflow(project);
      const page = await tx.getArchitecturePage(organizationId, project.id, pageId);
      if (!page) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Página no encontrada");
      await requireMutableArchitecture(tx, organizationId, projectId, page.architecture_id);
      const patch = normalizePageInput({ ...page, ...input }, { partial: true });
      if (patch.parent_page_id !== undefined) {
        const pages = await tx.listArchitecturePages(organizationId, project.id, page.architecture_id);
        const pagesById = new Map(pages.map((p) => [p.id, p]));
        if (patch.parent_page_id && detectCycle(page.id, patch.parent_page_id, pagesById)) {
          throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_PAGE_INVALID, "Jerarquía no válida");
        }
      }
      const updated = await tx.updateArchitecturePage(organizationId, project.id, pageId, patch);
      await recalcRoutesForArchitecture(tx, organizationId, project.id, page.architecture_id);
      return serializePage(updated);
    });
  }

  async function archiveArchitecturePage(organizationId, projectId, pageId, actorUserId) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      assertArchitectureWorkflow(project);
      const page = await tx.getArchitecturePage(organizationId, project.id, pageId);
      if (!page) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Página no encontrada");
      await requireMutableArchitecture(tx, organizationId, projectId, page.architecture_id);
      const updated = await tx.updateArchitecturePage(organizationId, project.id, pageId, {
        archived_at: new Date().toISOString()
      });
      await recalcRoutesForArchitecture(tx, organizationId, project.id, page.architecture_id);
      return serializePage(updated);
    });
  }

  function normalizeBlockInput(input, { partial } = {}) {
    const patch = {};
    if (hasOwn(input, "blockType") || hasOwn(input, "block_type")) {
      const blockType = input.blockType || input.block_type;
      if (!ARCHITECTURE_BLOCK_TYPES.includes(blockType)) {
        throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_BLOCK_INVALID, "Tipo de bloque no válido");
      }
      patch.block_type = blockType;
    }
    if (hasOwn(input, "sortOrder") || hasOwn(input, "sort_order")) {
      patch.sort_order = Number(input.sortOrder ?? input.sort_order ?? 0);
    }
    for (const [camel, snake] of [
      ["title", "title"],
      ["purpose", "purpose"],
      ["notes", "notes"]
    ]) {
      if (hasOwn(input, camel) || hasOwn(input, snake)) {
        const val = String(input[camel] ?? input[snake] ?? "").trim();
        if (val.length > MAX_COMMENT_LENGTH) {
          throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_BLOCK_INVALID, "Texto demasiado largo");
        }
        if (val) rejectIfSecret(val, snake);
        patch[snake] = val || null;
      }
    }
    if (hasOwn(input, "required")) patch.required = Boolean(input.required);
    if (hasOwn(input, "contentSourceType") || hasOwn(input, "content_source_type")) {
      const val = input.contentSourceType ?? input.content_source_type ?? null;
      if (val && !ARCHITECTURE_CONTENT_BINDING_TYPES.includes(val)) {
        throw new WebProjectError(400, ERROR_CODES.ARCHITECTURE_BLOCK_INVALID, "Fuente no válida");
      }
      patch.content_source_type = val;
    }
    if (hasOwn(input, "contentSourceId") || hasOwn(input, "content_source_id")) {
      patch.content_source_id = input.contentSourceId ?? input.content_source_id ?? null;
    }
    return patch;
  }

  async function createArchitectureBlock(organizationId, projectId, pageId, actorUserId, input) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      assertArchitectureWorkflow(project);
      const page = await tx.getArchitecturePage(organizationId, project.id, pageId);
      if (!page) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Página no encontrada");
      await requireMutableArchitecture(tx, organizationId, projectId, page.architecture_id);
      const patch = normalizeBlockInput(input);
      const row = await tx.insertArchitectureBlock({
        organization_id: organizationId,
        web_project_id: project.id,
        architecture_id: page.architecture_id,
        architecture_page_id: page.id,
        block_type: patch.block_type,
        sort_order: patch.sort_order ?? 999,
        title: patch.title || null,
        purpose: patch.purpose || null,
        notes: patch.notes || null,
        content_source_type: patch.content_source_type || null,
        content_source_id: patch.content_source_id || null,
        required: Boolean(patch.required)
      });
      return serializeBlock(row);
    });
  }

  async function updateArchitectureBlock(organizationId, projectId, blockId, actorUserId, input) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      assertArchitectureWorkflow(project);
      const block = await tx.getArchitectureBlock(organizationId, project.id, blockId);
      if (!block) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Bloque no encontrado");
      await requireMutableArchitecture(tx, organizationId, projectId, block.architecture_id);
      const patch = normalizeBlockInput({ ...block, ...input }, { partial: true });
      return serializeBlock(await tx.updateArchitectureBlock(organizationId, project.id, blockId, patch));
    });
  }

  async function validateArchitectureState(organizationId, projectId) {
    const bundle = await getArchitecture(organizationId, projectId);
    if (!bundle.architecture) {
      throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "No hay arquitectura para validar");
    }
    return bundle.validation;
  }

  async function approveArchitecture(organizationId, projectId, actorUserId, options = {}) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      assertArchitectureWorkflow(project);
      const draft = await tx.getDraftArchitecture(organizationId, projectId);
      if (!draft) {
        throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "No hay borrador para aprobar");
      }
      const bundle = await loadArchitectureBundle(tx, organizationId, projectId, draft.id);
      if (bundle.validation.state === "INVALID") {
        throw new WebProjectError(409, ERROR_CODES.ARCHITECTURE_INVALID, "La arquitectura no es válida", {
          validation: bundle.validation
        });
      }
      if (bundle.validation.state === "READY_WITH_WARNINGS" && !options.acknowledgeWarnings) {
        throw new WebProjectError(409, ERROR_CODES.MOCKUP_OVERRIDE_REQUIRED, "Confirma los avisos antes de aprobar", {
          validation: bundle.validation
        });
      }
      const approvedAt = new Date().toISOString();
      await tx.updateArchitecture(organizationId, projectId, draft.id, {
        status: "APPROVED",
        approved_by: actorUserId || null,
        approved_at: approvedAt
      });
      const previous = (await tx.listArchitectures(organizationId, projectId)).filter(
        (row) => row.status === "APPROVED" && row.id !== draft.id
      );
      for (const row of previous) {
        await tx.updateArchitecture(organizationId, projectId, row.id, { status: "SUPERSEDED" });
      }
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.ARCHITECTURE_APPROVED, {
        projectId: project.id,
        architectureId: draft.id,
        version: draft.version
      });
      return loadArchitectureBundle(tx, organizationId, projectId, draft.id);
    });
  }

  async function createArchitectureRevision(organizationId, projectId, actorUserId) {
    return runTx(async (tx) => {
      const project = await requireProject(tx, organizationId, projectId);
      assertNotArchived(project);
      assertArchitectureWorkflow(project);
      const existingDraft = await tx.getDraftArchitecture(organizationId, projectId);
      if (existingDraft) {
        throw new WebProjectError(
          409,
          ERROR_CODES.ARCHITECTURE_DRAFT_EXISTS,
          "Ya existe un borrador. Aprueba o edítalo antes de crear otra revisión."
        );
      }
      const current =
        (await tx.getCurrentApprovedArchitecture(organizationId, projectId)) ||
        (await tx.listArchitectures(organizationId, projectId)).sort((a, b) => b.version - a.version)[0];
      if (!current) {
        throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "No hay arquitectura base para revisar");
      }
      const nextVersion = current.version + 1;
      const copy = await tx.insertArchitecture({
        organization_id: organizationId,
        web_project_id: project.id,
        version: nextVersion,
        status: "DRAFT",
        primary_language: current.primary_language,
        additional_languages: current.additional_languages,
        language_selector_required: current.language_selector_required,
        metadata: current.metadata,
        supersedes_architecture_id: current.id,
        created_by: actorUserId || null
      });
      const [pages, blocks] = await Promise.all([
        tx.listArchitecturePages(organizationId, project.id, current.id),
        tx.listArchitectureBlocks(organizationId, project.id, current.id)
      ]);
      const idMap = new Map();
      const activePages = pages.filter((p) => !p.archived_at);
      for (const page of activePages) {
        const inserted = await tx.insertArchitecturePage({
          ...page,
          id: undefined,
          architecture_id: copy.id,
          parent_page_id: null,
          created_at: undefined,
          updated_at: undefined
        });
        idMap.set(page.id, inserted.id);
      }
      for (const page of activePages) {
        const newParent = page.parent_page_id ? idMap.get(page.parent_page_id) : null;
        if (newParent) {
          await tx.updateArchitecturePage(organizationId, project.id, idMap.get(page.id), {
            parent_page_id: newParent
          });
        }
      }
      await recalcRoutesForArchitecture(tx, organizationId, project.id, copy.id);
      for (const block of blocks.filter((b) => !b.archived_at)) {
        await tx.insertArchitectureBlock({
          ...block,
          id: undefined,
          architecture_id: copy.id,
          architecture_page_id: idMap.get(block.architecture_page_id),
          created_at: undefined,
          updated_at: undefined
        });
      }
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.ARCHITECTURE_REVISION_CREATED, {
        projectId: project.id,
        architectureId: copy.id,
        version: copy.version,
        supersedes: current.id
      });
      return loadArchitectureBundle(tx, organizationId, projectId, copy.id);
    });
  }

  async function startMockup(organizationId, projectId, actorUserId, options = {}) {
    const approved = await store.getCurrentApprovedArchitecture(organizationId, projectId);
    if (!approved) {
      throw new WebProjectError(
        409,
        ERROR_CODES.MOCKUP_NOT_READY,
        "Se requiere una arquitectura aprobada antes de pasar a maqueta."
      );
    }
    const project = await requireProject(store, organizationId, projectId);
    if (project.workflow_status !== "ARCHITECTURE") {
      throw new WebProjectError(409, ERROR_CODES.INVALID_TRANSITION, "Solo se puede pasar a maqueta desde ARCHITECTURE");
    }
    const assembled = await transition(organizationId, projectId, actorUserId, "MOCKUP");
    await runTx(async (tx) => {
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.MOCKUP_STARTED, {
        projectId: Number(projectId),
        architectureId: approved.id,
        version: approved.version
      });
    });
    await notifySafe(WEB_PROJECT_NOTIFICATION_EVENTS.MOCKUP_STARTED, {
      organizationId,
      actorUserId,
      project: assembled
    });
    return assembled;
  }

  return {
    getArchitecture,
    generateArchitecture,
    createArchitecturePage,
    updateArchitecturePage,
    archiveArchitecturePage,
    createArchitectureBlock,
    updateArchitectureBlock,
    validateArchitectureState,
    approveArchitecture,
    createArchitectureRevision,
    startMockup
  };
}

module.exports = { createArchitectureOperations };
