const {
  AUDIT_ACTIONS,
  DEVELOPMENT_BLOCKER_TYPES,
  DEVELOPMENT_HANDOFF_SCHEMA_VERSION,
  DEVELOPMENT_ITEM_PRIORITIES,
  DEVELOPMENT_ITEM_STATUSES,
  DEVELOPMENT_READINESS_STATES,
  ERROR_CODES,
  VALIDATION_HANDOFF_SCHEMA_VERSION
} = require("./constants");
const { WebProjectError } = require("./errors");
const { rejectIfSecret } = require("./secrets");
const { hasOwn } = require("./httpContract");
const { responseMap, resolveSchemaVersion } = require("./formRegistry");
const { buildDevelopmentHandoffSnapshot, buildValidationHandoffSnapshot } = require("./developmentHandoff");
const { generateDevelopmentPlan } = require("./developmentPlanGenerator");
const { deriveProgress, evaluateDevelopmentReadiness } = require("./developmentReadiness");
const { assembleDevelopmentPayload } = require("./developmentAssembler");
const { assertTransition } = require("./workflow");

const STATUS_TRANSITIONS = Object.freeze({
  TODO: new Set(["READY", "NOT_APPLICABLE"]),
  READY: new Set(["TODO", "IN_PROGRESS", "NOT_APPLICABLE"]),
  IN_PROGRESS: new Set(["READY", "BLOCKED", "REVIEW"]),
  BLOCKED: new Set(["READY", "IN_PROGRESS"]),
  REVIEW: new Set(["IN_PROGRESS", "DONE"]),
  DONE: new Set(),
  NOT_APPLICABLE: new Set(["TODO"])
});

const AUTO_READY_TYPES = new Set(["PROJECT_SETUP", "GLOBAL_STYLES", "HEADER", "FOOTER"]);

function pid(value) {
  return Number(value);
}

function assertStatusTransition(from, to) {
  if (!DEVELOPMENT_ITEM_STATUSES.includes(to)) {
    throw new WebProjectError(409, ERROR_CODES.DEVELOPMENT_ITEM_INVALID, "Estado de tarea no válido.");
  }
  if (!STATUS_TRANSITIONS[from]?.has(to)) {
    throw new WebProjectError(
      409,
      ERROR_CODES.DEVELOPMENT_ITEM_INVALID,
      `Transición de tarea no permitida: ${from} → ${to}`
    );
  }
}

function assertBlockerType(type) {
  if (!DEVELOPMENT_BLOCKER_TYPES.includes(type)) {
    throw new WebProjectError(409, ERROR_CODES.DEVELOPMENT_BLOCKER_REQUIRED, "Tipo de bloqueo no válido.");
  }
}

function assertValidHttpUrl(value, context) {
  if (!value) return;
  rejectIfSecret(value, context);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "URL de evidencia no válida.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "Solo se permiten URLs http/https.");
  }
}

function createDevelopmentOperations(deps) {
  const {
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
  } = deps;

  function assertDevelopmentMutable(project) {
    assertNotArchived(project);
    assertNotCompleted(project);
    if (project.workflow_status !== "DEVELOPMENT") {
      throw new WebProjectError(
        409,
        ERROR_CODES.DEVELOPMENT_WORKFLOW_BLOCKED,
        "Esta acción solo está disponible en fase Desarrollo."
      );
    }
  }

  async function loadOpenDecisions(tx, organizationId, projectId) {
    const notes = await tx.listBriefNotes(organizationId, projectId);
    return (notes || []).filter(
      (n) =>
        (n.note_type || n.noteType) === "DECISION_REQUIRED" &&
        (n.status || "OPEN") === "OPEN"
    );
  }

  async function loadBundle(tx, organizationId, projectId) {
    const handoff = await tx.getDevelopmentHandoff(organizationId, projectId);
    const plan = await tx.getActiveDevelopmentPlan(organizationId, projectId);
    if (!plan) {
      return { handoff, plan: null, items: [], checklist: [], blockers: [], dependencies: [], validationHandoff: null };
    }
    const [items, checklist, blockers, dependencies, validationHandoff] = await Promise.all([
      tx.listDevelopmentItems(organizationId, projectId, plan.id),
      tx.listDevelopmentChecklistForPlan(organizationId, projectId, plan.id),
      tx.listDevelopmentBlockers(organizationId, projectId, plan.id),
      tx.listDevelopmentDependencies(organizationId, projectId, plan.id),
      tx.getValidationHandoff(organizationId, projectId, plan.id)
    ]);
    return { handoff, plan, items, checklist, blockers, dependencies, validationHandoff };
  }

  function groupChecklistAndBlockers(checklist, blockers) {
    const checklistByItem = new Map();
    for (const row of checklist || []) {
      const itemId = row.development_item_id;
      if (!checklistByItem.has(itemId)) checklistByItem.set(itemId, []);
      checklistByItem.get(itemId).push(row);
    }
    const blockersByItem = new Map();
    for (const row of blockers || []) {
      const itemId = row.development_item_id;
      if (!blockersByItem.has(itemId)) blockersByItem.set(itemId, []);
      blockersByItem.get(itemId).push(row);
    }
    return { checklistByItem, blockersByItem };
  }

  async function assembleView(tx, organizationId, project, bundle) {
    const openDecisions = await loadOpenDecisions(tx, organizationId, project.id);
    const progress = deriveProgress(bundle.items);
    const workflow = project.workflow_status || project.workflowStatus;
    let readiness;
    if (workflow === "VALIDATION" && bundle.validationHandoff) {
      const payload =
        bundle.validationHandoff.payload && typeof bundle.validationHandoff.payload === "object"
          ? bundle.validationHandoff.payload
          : {};
      readiness = {
        state: bundle.validationHandoff.readiness_state,
        errors: [],
        warnings: (payload.openWarnings || []).map((w) =>
          typeof w === "string" ? { code: "HISTORICAL", message: w } : w
        ),
        metrics: progress
      };
    } else {
      readiness = evaluateDevelopmentReadiness({
        project,
        handoff: bundle.handoff,
        plan: bundle.plan,
        items: bundle.items,
        blockers: bundle.blockers,
        openDecisions
      });
    }
    const { checklistByItem, blockersByItem } = groupChecklistAndBlockers(
      bundle.checklist,
      bundle.blockers
    );
    return assembleDevelopmentPayload({
      handoff: bundle.handoff,
      plan: bundle.plan,
      items: bundle.items,
      checklistByItem,
      blockersByItem,
      dependencies: bundle.dependencies,
      progress,
      readiness,
      validationHandoff: bundle.validationHandoff
    });
  }

  async function getDevelopment(organizationId, projectId) {
    projectId = pid(projectId);
    const project = await requireProject(store, organizationId, projectId);
    const bundle = await loadBundle(store, organizationId, projectId);
    return assembleView(store, organizationId, project, bundle);
  }

  async function createHandoffIfMissing(tx, organizationId, projectId, actorUserId, approvedMockup) {
    const existing = await tx.getDevelopmentHandoff(organizationId, projectId);
    if (existing) return existing;

    const approvedArchitecture =
      (await tx.getCurrentApprovedArchitecture(organizationId, projectId)) ||
      (await tx.getArchitecture(organizationId, projectId, approvedMockup.architecture_id));
    if (!approvedArchitecture) {
      throw new WebProjectError(
        409,
        ERROR_CODES.DEVELOPMENT_NOT_READY,
        "Se requiere arquitectura aprobada."
      );
    }

    const project = await requireProject(tx, organizationId, projectId);
    const [architecturePages, mockupPages, mockupSections] = await Promise.all([
      tx.listArchitecturePages(organizationId, projectId, approvedArchitecture.id),
      tx.listMockupPages(organizationId, projectId, approvedMockup.id),
      tx.listMockupSections(organizationId, projectId, approvedMockup.id)
    ]);

    const payload = buildDevelopmentHandoffSnapshot({
      project,
      approvedMockup,
      approvedArchitecture,
      architecturePages,
      mockupPages,
      mockupSections,
      createdBy: actorUserId
    });

    return tx.insertDevelopmentHandoff({
      organization_id: organizationId,
      web_project_id: pid(projectId),
      architecture_id: approvedArchitecture.id,
      architecture_version: approvedArchitecture.version,
      mockup_id: approvedMockup.id,
      mockup_version: approvedMockup.version,
      mockup_approved_at: approvedMockup.approved_at,
      mockup_approved_by: approvedMockup.approved_by,
      schema_version: DEVELOPMENT_HANDOFF_SCHEMA_VERSION,
      payload,
      created_by: actorUserId
    });
  }

  async function startDevelopment(organizationId, projectId, actorUserId) {
    projectId = pid(projectId);
    const approved = await store.getCurrentApprovedMockup(organizationId, projectId);
    if (!approved) {
      throw new WebProjectError(
        409,
        ERROR_CODES.DEVELOPMENT_NOT_READY,
        "Se requiere maqueta aprobada antes de iniciar desarrollo."
      );
    }
    const project = await requireProject(store, organizationId, projectId);
    if (project.workflow_status !== "MOCKUP") {
      throw new WebProjectError(409, ERROR_CODES.INVALID_TRANSITION, "Solo se puede iniciar desarrollo desde MOCKUP.");
    }

    const assembled = await runTx(async (tx) => {
      const current = await requireProject(tx, organizationId, projectId);
      assertNotArchived(current);
      assertTransition(current.workflow_status, "DEVELOPMENT");
      await createHandoffIfMissing(tx, organizationId, projectId, actorUserId, approved);
      const fromStatus = current.workflow_status;
      const updated = await tx.updateProject(organizationId, projectId, {
        workflow_status: "DEVELOPMENT"
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.TRANSITIONED, {
        projectId: pid(projectId),
        from: fromStatus,
        to: "DEVELOPMENT"
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.DEVELOPMENT_STARTED, {
        projectId: pid(projectId),
        mockupId: approved.id,
        version: approved.version
      });
      return assemble(tx, organizationId, updated);
    });

    await notifySafe(WEB_PROJECT_NOTIFICATION_EVENTS.DEVELOPMENT_STARTED, {
      organizationId,
      actorUserId,
      project: assembled,
      mockupId: approved.id
    });
    return assembled;
  }

  async function prepareDevelopmentPlan(organizationId, projectId, actorUserId) {
    projectId = pid(projectId);
    const project = await requireProject(store, organizationId, projectId);
    assertDevelopmentMutable(project);

    const existingPlan = await store.getActiveDevelopmentPlan(organizationId, projectId);
    if (existingPlan) {
      return getDevelopment(organizationId, projectId);
    }

    await runTx(async (tx) => {
      const handoff = await tx.getDevelopmentHandoff(organizationId, projectId);
      if (!handoff) {
        throw new WebProjectError(
          409,
          ERROR_CODES.DEVELOPMENT_NOT_READY,
          "No hay handoff de desarrollo. Inicia desarrollo desde la maqueta aprobada."
        );
      }

      const approvedArchitecture = await tx.getArchitecture(
        organizationId,
        projectId,
        handoff.architecture_id
      );
      const approvedMockup = await tx.getMockup(organizationId, projectId, handoff.mockup_id);
      const [architecturePages, architectureBlocks, mockupPages, mockupSections, items, documents, formRows] =
        await Promise.all([
          tx.listArchitecturePages(organizationId, projectId, handoff.architecture_id),
          tx.listArchitectureBlocks(organizationId, projectId, handoff.architecture_id),
          tx.listMockupPages(organizationId, projectId, handoff.mockup_id),
          tx.listMockupSections(organizationId, projectId, handoff.mockup_id),
          tx.listItems(organizationId, projectId),
          tx.listDocuments(organizationId, projectId),
          tx.listFormResponses(organizationId, projectId)
        ]);

      const schemaVersion = resolveSchemaVersion(formRows);
      const values = responseMap(formRows, schemaVersion);
      const specs = generateDevelopmentPlan({
        architecturePages,
        architectureBlocks,
        mockupPages,
        mockupSections,
        items,
        documents,
        formValues: values,
        projectType: project.project_type
      });

      const plan = await tx.insertDevelopmentPlan({
        organization_id: organizationId,
        web_project_id: projectId,
        handoff_id: handoff.id,
        version: 1,
        status: "ACTIVE",
        created_by: actorUserId
      });

      const insertedItems = [];
      for (const spec of specs) {
        const initialStatus = AUTO_READY_TYPES.has(spec.item_type) ? "READY" : "TODO";
        const row = await tx.insertDevelopmentItem({
          organization_id: organizationId,
          web_project_id: projectId,
          development_plan_id: plan.id,
          item_type: spec.item_type,
          title: spec.title,
          description: spec.description ?? null,
          architecture_page_id: spec.architecture_page_id ?? null,
          architecture_block_id: spec.architecture_block_id ?? null,
          mockup_page_id: spec.mockup_page_id ?? null,
          mockup_section_id: spec.mockup_section_id ?? null,
          status: initialStatus,
          priority: spec.priority || "MEDIUM",
          content_readiness: spec.content_readiness || "NOT_APPLICABLE",
          sort_order: spec.sort_order ?? 0,
          required: spec.required !== false,
          created_by: actorUserId
        });
        insertedItems.push({ row, spec });
        let sort = 0;
        for (const entry of spec.checklist || []) {
          await tx.insertDevelopmentChecklistEntry({
            organization_id: organizationId,
            web_project_id: projectId,
            development_item_id: row.id,
            label: entry.label,
            required: Boolean(entry.required),
            completed: false,
            sort_order: sort++
          });
        }
        for (const criterion of spec.acceptanceCriteria || []) {
          await tx.insertDevelopmentChecklistEntry({
            organization_id: organizationId,
            web_project_id: projectId,
            development_item_id: row.id,
            label: `[AC] ${criterion}`,
            required: true,
            completed: false,
            sort_order: sort++
          });
        }
      }

      const globalStyles = insertedItems.find((i) => i.row.item_type === "GLOBAL_STYLES");
      if (globalStyles) {
        for (const { row, spec } of insertedItems) {
          if (spec.dependsOnGlobalStyles) {
            await tx.insertDevelopmentDependency({
              organization_id: organizationId,
              web_project_id: projectId,
              development_plan_id: plan.id,
              item_id: row.id,
              depends_on_item_id: globalStyles.row.id
            });
          }
        }
      }

      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.DEVELOPMENT_PLAN_CREATED, {
        projectId,
        planId: plan.id,
        itemCount: insertedItems.length,
        architectureVersion: approvedArchitecture?.version ?? handoff.architecture_version,
        mockupVersion: approvedMockup?.version ?? handoff.mockup_version
      });
    });

    return getDevelopment(organizationId, projectId);
  }

  async function updateDevelopmentItem(organizationId, projectId, itemId, actorUserId, input = {}) {
    projectId = pid(projectId);
    itemId = pid(itemId);
    const project = await requireProject(store, organizationId, projectId);
    assertDevelopmentMutable(project);

    if (hasOwn(input, "description")) rejectIfSecret(input.description, "descripción de tarea");
    if (hasOwn(input, "note")) rejectIfSecret(input.note, "nota de tarea");

    await runTx(async (tx) => {
      const item = await tx.getDevelopmentItem(organizationId, projectId, itemId);
      if (!item) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Tarea no encontrada.");
      const plan = await tx.getActiveDevelopmentPlan(organizationId, projectId);
      if (!plan || item.development_plan_id !== plan.id) {
        throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Tarea no encontrada.");
      }

      const patch = {};
      if (hasOwn(input, "status")) {
        const next = input.status;
        assertStatusTransition(item.status, next);
        patch.status = next;
        if (next === "IN_PROGRESS" && !item.started_at) patch.started_at = new Date().toISOString();
        if (next === "DONE") patch.completed_at = new Date().toISOString();
        if (next !== "DONE" && item.completed_at) patch.completed_at = null;
      }
      if (hasOwn(input, "priority")) {
        if (!DEVELOPMENT_ITEM_PRIORITIES.includes(input.priority)) {
          throw new WebProjectError(409, ERROR_CODES.DEVELOPMENT_ITEM_INVALID, "Prioridad no válida.");
        }
        patch.priority = input.priority;
      }
      if (hasOwn(input, "assignedTo")) patch.assigned_to = input.assignedTo ?? null;
      if (hasOwn(input, "description")) patch.description = input.description;

      const updated = await tx.updateDevelopmentItem(organizationId, projectId, itemId, patch);
      if (patch.status === "IN_PROGRESS") {
        await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.DEVELOPMENT_ITEM_STARTED, {
          projectId,
          itemId,
          title: updated.title
        });
      }
      if (patch.status === "DONE") {
        await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.DEVELOPMENT_ITEM_COMPLETED, {
          projectId,
          itemId,
          title: updated.title
        });
      }
    });

    return getDevelopment(organizationId, projectId);
  }

  async function blockDevelopmentItem(organizationId, projectId, itemId, actorUserId, input = {}) {
    projectId = pid(projectId);
    itemId = pid(itemId);
    const project = await requireProject(store, organizationId, projectId);
    assertDevelopmentMutable(project);

    const blockerType = input.blockerType || input.blocker_type;
    const description = input.description;
    if (!blockerType || !description?.trim()) {
      throw new WebProjectError(400, ERROR_CODES.DEVELOPMENT_BLOCKER_REQUIRED, "Tipo y descripción requeridos.");
    }
    assertBlockerType(blockerType);
    rejectIfSecret(description, "bloqueo");

    await runTx(async (tx) => {
      const item = await tx.getDevelopmentItem(organizationId, projectId, itemId);
      if (!item) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Tarea no encontrada.");
      await tx.insertDevelopmentBlocker({
        organization_id: organizationId,
        web_project_id: projectId,
        development_item_id: itemId,
        blocker_type: blockerType,
        description: description.trim(),
        created_by: actorUserId
      });
      await tx.updateDevelopmentItem(organizationId, projectId, itemId, { status: "BLOCKED" });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.DEVELOPMENT_ITEM_BLOCKED, {
        projectId,
        itemId,
        blockerType
      });
    });

    return getDevelopment(organizationId, projectId);
  }

  async function unblockDevelopmentItem(organizationId, projectId, itemId, actorUserId, input = {}) {
    projectId = pid(projectId);
    itemId = pid(itemId);
    const project = await requireProject(store, organizationId, projectId);
    assertDevelopmentMutable(project);
    if (input.resolutionNote) rejectIfSecret(input.resolutionNote, "resolución de bloqueo");

    await runTx(async (tx) => {
      const item = await tx.getDevelopmentItem(organizationId, projectId, itemId);
      if (!item) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Tarea no encontrada.");
      const blockers = await tx.listDevelopmentBlockers(organizationId, projectId, item.development_plan_id);
      const open = blockers.filter((b) => b.development_item_id === itemId && !b.resolved_at);
      for (const blocker of open) {
        await tx.updateDevelopmentBlocker(organizationId, projectId, blocker.id, {
          resolved_at: new Date().toISOString(),
          resolved_by: actorUserId,
          resolution_note: input.resolutionNote || null
        });
      }
      if (item.status === "BLOCKED") {
        await tx.updateDevelopmentItem(organizationId, projectId, itemId, { status: "READY" });
      }
    });

    return getDevelopment(organizationId, projectId);
  }

  function wouldCreateCycle(dependencies, itemId, dependsOnItemId) {
    const graph = new Map();
    for (const dep of dependencies) {
      const from = dep.depends_on_item_id;
      const to = dep.item_id;
      if (!graph.has(from)) graph.set(from, []);
      graph.get(from).push(to);
    }
    if (!graph.has(dependsOnItemId)) graph.set(dependsOnItemId, []);
    graph.get(dependsOnItemId).push(itemId);

    const stack = [itemId];
    const seen = new Set();
    while (stack.length) {
      const current = stack.pop();
      if (current === dependsOnItemId) return true;
      if (seen.has(current)) continue;
      seen.add(current);
      for (const next of graph.get(current) || []) stack.push(next);
    }
    return false;
  }

  async function addDevelopmentDependency(organizationId, projectId, itemId, actorUserId, input = {}) {
    projectId = pid(projectId);
    itemId = pid(itemId);
    const dependsOnItemId = pid(input.dependsOnItemId || input.depends_on_item_id);
    if (!dependsOnItemId) {
      throw new WebProjectError(400, ERROR_CODES.DEVELOPMENT_DEPENDENCY_INVALID, "dependsOnItemId requerido.");
    }
    if (dependsOnItemId === itemId) {
      throw new WebProjectError(409, ERROR_CODES.DEVELOPMENT_DEPENDENCY_INVALID, "Una tarea no puede depender de sí misma.");
    }

    const project = await requireProject(store, organizationId, projectId);
    assertDevelopmentMutable(project);

    await runTx(async (tx) => {
      const plan = await tx.getActiveDevelopmentPlan(organizationId, projectId);
      if (!plan) throw new WebProjectError(409, ERROR_CODES.DEVELOPMENT_NOT_READY, "No hay plan activo.");
      const item = await tx.getDevelopmentItem(organizationId, projectId, itemId);
      const dependsOn = await tx.getDevelopmentItem(organizationId, projectId, dependsOnItemId);
      if (!item || !dependsOn) {
        throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Tarea no encontrada.");
      }
      if (item.development_plan_id !== plan.id || dependsOn.development_plan_id !== plan.id) {
        throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Tarea no encontrada.");
      }
      const dependencies = await tx.listDevelopmentDependencies(organizationId, projectId, plan.id);
      const duplicate = dependencies.some(
        (d) => d.item_id === itemId && d.depends_on_item_id === dependsOnItemId
      );
      if (duplicate) return;
      if (wouldCreateCycle(dependencies, itemId, dependsOnItemId)) {
        throw new WebProjectError(409, ERROR_CODES.DEVELOPMENT_DEPENDENCY_CYCLE, "Dependencia circular detectada.");
      }
      await tx.insertDevelopmentDependency({
        organization_id: organizationId,
        web_project_id: projectId,
        development_plan_id: plan.id,
        item_id: itemId,
        depends_on_item_id: dependsOnItemId
      });
    });

    return getDevelopment(organizationId, projectId);
  }

  async function startValidation(organizationId, projectId, actorUserId, options = {}) {
    projectId = pid(projectId);
    const project = await requireProject(store, organizationId, projectId);
    assertDevelopmentMutable(project);

    const bundle = await loadBundle(store, organizationId, projectId);
    const openDecisions = await loadOpenDecisions(store, organizationId, projectId);
    const progress = deriveProgress(bundle.items);
    const readiness = evaluateDevelopmentReadiness({
      project,
      handoff: bundle.handoff,
      plan: bundle.plan,
      items: bundle.items,
      blockers: bundle.blockers,
      openDecisions
    });

    if (readiness.state === DEVELOPMENT_READINESS_STATES[0]) {
      throw new WebProjectError(409, ERROR_CODES.VALIDATION_NOT_READY, "Desarrollo no está listo para validación.");
    }
    if (
      readiness.state === DEVELOPMENT_READINESS_STATES[1] &&
      !options.acknowledgeWarnings
    ) {
      throw new WebProjectError(
        409,
        ERROR_CODES.VALIDATION_OVERRIDE_REQUIRED,
        "Hay advertencias abiertas. Confirma para continuar."
      );
    }
    if (options.overrideReason) rejectIfSecret(options.overrideReason, "motivo de validación");

    const existingValidation = bundle.validationHandoff;
    if (existingValidation) {
      return getDevelopment(organizationId, projectId);
    }

    await runTx(async (tx) => {
      const payload = buildValidationHandoffSnapshot({
        project,
        handoff: bundle.handoff,
        plan: bundle.plan,
        items: bundle.items,
        readiness,
        progress,
        createdBy: actorUserId,
        overrideUsed: Boolean(options.acknowledgeWarnings && readiness.warnings.length),
        overrideReason: options.overrideReason || null
      });
      await tx.insertValidationHandoff({
        organization_id: organizationId,
        web_project_id: projectId,
        development_plan_id: bundle.plan.id,
        schema_version: VALIDATION_HANDOFF_SCHEMA_VERSION,
        payload,
        readiness_state: readiness.state,
        override_used: Boolean(options.acknowledgeWarnings && readiness.warnings.length),
        override_reason: options.overrideReason || null,
        created_by: actorUserId
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.VALIDATION_STARTED, {
        projectId,
        planId: bundle.plan.id,
        readinessState: readiness.state,
        progress
      });
    });

    const assembled = await transition(organizationId, projectId, actorUserId, "VALIDATION", {
      validationReady: true,
      skipNotify: true
    });

    await notifySafe(WEB_PROJECT_NOTIFICATION_EVENTS.VALIDATION_STARTED, {
      organizationId,
      actorUserId,
      project: assembled
    });

    return getDevelopment(organizationId, projectId);
  }

  return {
    getDevelopment,
    startDevelopment,
    prepareDevelopmentPlan,
    updateDevelopmentItem,
    blockDevelopmentItem,
    unblockDevelopmentItem,
    addDevelopmentDependency,
    startValidation,
    createHandoffIfMissing
  };
}

module.exports = {
  createDevelopmentOperations,
  STATUS_TRANSITIONS,
  assertStatusTransition,
  assertValidHttpUrl
};
