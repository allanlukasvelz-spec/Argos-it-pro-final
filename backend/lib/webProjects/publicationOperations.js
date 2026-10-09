const {
  AUDIT_ACTIONS,
  COMPLETION_HANDOFF_SCHEMA_VERSION,
  ERROR_CODES,
  PUBLICATION_BLOCKER_TYPES,
  PUBLICATION_READINESS_STATES,
  PUBLICATION_STEP_STATUSES
} = require("./constants");
const { WebProjectError } = require("./errors");
const { rejectIfSecret } = require("./secrets");
const { hasOwn } = require("./httpContract");
const { responseMap, resolveSchemaVersion } = require("./formRegistry");
const { generatePublicationSteps } = require("./publicationPlanGenerator");
const { evaluatePublicationReadiness } = require("./publicationReadiness");
const { assemblePublicationPayload } = require("./publicationAssembler");
const { buildCompletionHandoffSnapshot } = require("./completionHandoff");
const { assertValidHttpUrl } = require("./developmentOperations");

const STATUS_TRANSITIONS = Object.freeze({
  TODO: new Set(["READY", "NOT_APPLICABLE"]),
  READY: new Set(["TODO", "IN_PROGRESS", "NOT_APPLICABLE"]),
  IN_PROGRESS: new Set(["READY", "BLOCKED", "REVIEW"]),
  BLOCKED: new Set(["READY", "IN_PROGRESS"]),
  REVIEW: new Set(["IN_PROGRESS", "DONE"]),
  DONE: new Set(),
  NOT_APPLICABLE: new Set(["TODO"])
});

function pid(value) {
  return Number(value);
}

function assertStatusTransition(from, to) {
  if (!PUBLICATION_STEP_STATUSES.includes(to)) {
    throw new WebProjectError(409, ERROR_CODES.PUBLICATION_STEP_INVALID, "Estado de paso no válido.");
  }
  if (!STATUS_TRANSITIONS[from]?.has(to)) {
    throw new WebProjectError(
      409,
      ERROR_CODES.PUBLICATION_STEP_INVALID,
      `Transición de paso no permitida: ${from} → ${to}`
    );
  }
}

function assertBlockerType(type) {
  if (!PUBLICATION_BLOCKER_TYPES.includes(type)) {
    throw new WebProjectError(409, ERROR_CODES.PUBLICATION_BLOCKER_REQUIRED, "Tipo de bloqueo no válido.");
  }
}

function createPublicationOperations(deps) {
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

  function assertPublicationMutable(project) {
    assertNotArchived(project);
    assertNotCompleted(project);
    if (project.workflow_status !== "PUBLICATION") {
      throw new WebProjectError(
        409,
        ERROR_CODES.PUBLICATION_WORKFLOW_BLOCKED,
        "Esta acción solo está disponible en fase Publicación."
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
    const publicationHandoff = await tx.getPublicationHandoffForProject(organizationId, projectId);
    const plan = await tx.getActivePublicationPlan(organizationId, projectId);
    if (!plan) {
      return { publicationHandoff, plan: null, steps: [], blockers: [], completionHandoff: null };
    }
    const [steps, blockers, completionHandoff] = await Promise.all([
      tx.listPublicationSteps(organizationId, projectId, plan.id),
      tx.listPublicationBlockers(organizationId, projectId, plan.id),
      tx.getCompletionHandoff(organizationId, projectId, plan.id)
    ]);
    return { publicationHandoff, plan, steps, blockers, completionHandoff };
  }

  async function assembleView(tx, organizationId, project, bundle) {
    const openDecisions = await loadOpenDecisions(tx, organizationId, project.id);
    const readiness = evaluatePublicationReadiness({
      project,
      publicationHandoff: bundle.publicationHandoff,
      plan: bundle.plan,
      steps: bundle.steps,
      blockers: bundle.blockers,
      openDecisions
    });
    return assemblePublicationPayload({
      publicationHandoff: bundle.publicationHandoff,
      plan: bundle.plan,
      steps: bundle.steps,
      blockers: bundle.blockers,
      readiness,
      completionHandoff: bundle.completionHandoff
    });
  }

  async function getPublication(organizationId, projectId) {
    projectId = pid(projectId);
    const project = await requireProject(store, organizationId, projectId);
    const bundle = await loadBundle(store, organizationId, projectId);
    return assembleView(store, organizationId, project, bundle);
  }

  async function preparePublicationPlan(organizationId, projectId, actorUserId) {
    projectId = pid(projectId);
    const project = await requireProject(store, organizationId, projectId);
    assertPublicationMutable(project);

    const existing = await store.getActivePublicationPlan(organizationId, projectId);
    if (existing) {
      const bundle = await loadBundle(store, organizationId, projectId);
      return assembleView(store, organizationId, project, bundle);
    }

    const publicationHandoff = await store.getPublicationHandoffForProject(organizationId, projectId);
    if (!publicationHandoff) {
      throw new WebProjectError(
        409,
        ERROR_CODES.PUBLICATION_NOT_READY,
        "No hay handoff de publicación. Usa «Pasar a publicación» desde Validación."
      );
    }

    const formRows = await store.listFormResponses(organizationId, projectId);
    const formValues = responseMap(formRows, resolveSchemaVersion(formRows));
    const payload =
      publicationHandoff.payload && typeof publicationHandoff.payload === "object"
        ? publicationHandoff.payload
        : publicationHandoff.payload
          ? JSON.parse(publicationHandoff.payload)
          : {};

    const stepSpecs = generatePublicationSteps({
      projectType: project.project_type || project.projectType,
      formValues,
      publicationHandoffPayload: payload,
      websiteHostname: project.website_hostname || project.websiteHostname
    });

    await runTx(async (tx) => {
      const plan = await tx.insertPublicationPlan({
        organization_id: organizationId,
        web_project_id: projectId,
        publication_handoff_id: publicationHandoff.id,
        validation_plan_id: publicationHandoff.validation_plan_id,
        target_hostname: project.website_hostname || null,
        created_by: actorUserId
      });

      for (const spec of stepSpecs) {
        await tx.insertPublicationStep({
          organization_id: organizationId,
          web_project_id: projectId,
          publication_plan_id: plan.id,
          step_type: spec.step_type,
          title: spec.title,
          description: spec.description ?? null,
          status: "TODO",
          priority: spec.priority || "MEDIUM",
          required: spec.required !== false,
          sort_order: spec.sort_order ?? 0,
          created_by: actorUserId
        });
      }

      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.PUBLICATION_PLAN_CREATED, {
        projectId,
        planId: plan.id,
        stepCount: stepSpecs.length
      });
    });

    return getPublication(organizationId, projectId);
  }

  async function updatePublicationStep(organizationId, projectId, stepId, actorUserId, input = {}) {
    projectId = pid(projectId);
    stepId = pid(stepId);
    const project = await requireProject(store, organizationId, projectId);
    assertPublicationMutable(project);

    if (hasOwn(input, "description")) rejectIfSecret(input.description, "descripción de paso");
    if (hasOwn(input, "notes")) rejectIfSecret(input.notes, "notas de paso");
    if (hasOwn(input, "evidenceUrl")) assertValidHttpUrl(input.evidenceUrl, "evidencia de paso");

    await runTx(async (tx) => {
      const step = await tx.getPublicationStep(organizationId, projectId, stepId);
      if (!step) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Paso no encontrado.");
      const plan = await tx.getActivePublicationPlan(organizationId, projectId);
      if (!plan || step.publication_plan_id !== plan.id) {
        throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Paso no encontrado.");
      }

      const patch = {};
      if (hasOwn(input, "status")) {
        const next = input.status;
        assertStatusTransition(step.status, next);
        patch.status = next;
        if (next === "IN_PROGRESS" && !step.started_at) patch.started_at = new Date().toISOString();
        if (next === "DONE") patch.completed_at = new Date().toISOString();
        if (next !== "DONE" && step.completed_at) patch.completed_at = null;
      }
      if (hasOwn(input, "priority")) patch.priority = input.priority;
      if (hasOwn(input, "notes")) patch.notes = input.notes;
      if (hasOwn(input, "evidenceUrl")) patch.evidence_url = input.evidenceUrl || null;
      if (hasOwn(input, "assignedTo")) patch.assigned_to = input.assignedTo ?? null;

      const updated = await tx.updatePublicationStep(organizationId, projectId, stepId, patch);
      if (patch.status === "IN_PROGRESS") {
        await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.PUBLICATION_STEP_STARTED, {
          projectId,
          stepId,
          title: updated.title
        });
      }
      if (patch.status === "DONE") {
        await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.PUBLICATION_STEP_COMPLETED, {
          projectId,
          stepId,
          title: updated.title
        });
      }
    });

    return getPublication(organizationId, projectId);
  }

  async function blockPublicationStep(organizationId, projectId, stepId, actorUserId, input = {}) {
    projectId = pid(projectId);
    stepId = pid(stepId);
    const project = await requireProject(store, organizationId, projectId);
    assertPublicationMutable(project);

    const blockerType = input.blockerType || input.blocker_type || "OTHER";
    const description = input.description || input.reason;
    if (!description?.trim()) {
      throw new WebProjectError(409, ERROR_CODES.PUBLICATION_BLOCKER_REQUIRED, "Descripción de bloqueo requerida.");
    }
    rejectIfSecret(description, "bloqueo de publicación");
    assertBlockerType(blockerType);

    await runTx(async (tx) => {
      const plan = await tx.getActivePublicationPlan(organizationId, projectId);
      if (!plan) throw new WebProjectError(409, ERROR_CODES.PUBLICATION_NOT_READY, "No hay plan activo.");
      const step = await tx.getPublicationStep(organizationId, projectId, stepId);
      if (!step || step.publication_plan_id !== plan.id) {
        throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Paso no encontrado.");
      }
      await tx.insertPublicationBlocker({
        organization_id: organizationId,
        web_project_id: projectId,
        publication_plan_id: plan.id,
        publication_step_id: stepId,
        blocker_type: blockerType,
        description: description.trim(),
        created_by: actorUserId
      });
      if (step.status !== "BLOCKED") {
        await tx.updatePublicationStep(organizationId, projectId, stepId, { status: "BLOCKED" });
      }
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.PUBLICATION_STEP_BLOCKED, {
        projectId,
        stepId,
        blockerType
      });
    });

    return getPublication(organizationId, projectId);
  }

  async function unblockPublicationStep(organizationId, projectId, stepId, actorUserId, input = {}) {
    projectId = pid(projectId);
    stepId = pid(stepId);
    const project = await requireProject(store, organizationId, projectId);
    assertPublicationMutable(project);

    await runTx(async (tx) => {
      const plan = await tx.getActivePublicationPlan(organizationId, projectId);
      if (!plan) throw new WebProjectError(409, ERROR_CODES.PUBLICATION_NOT_READY, "No hay plan activo.");
      const step = await tx.getPublicationStep(organizationId, projectId, stepId);
      if (!step || step.publication_plan_id !== plan.id) {
        throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Paso no encontrado.");
      }
      const blockers = await tx.listPublicationBlockers(organizationId, projectId, plan.id);
      const open = blockers.filter((b) => b.publication_step_id === stepId && !b.resolved_at);
      for (const blocker of open) {
        await tx.updatePublicationBlocker(organizationId, projectId, blocker.id, {
          resolved_at: new Date().toISOString(),
          resolved_by: actorUserId,
          resolution_note: input.resolutionNote || input.resolution_note || null
        });
      }
      if (step.status === "BLOCKED") {
        await tx.updatePublicationStep(organizationId, projectId, stepId, { status: "READY" });
      }
    });

    return getPublication(organizationId, projectId);
  }

  async function completeProject(organizationId, projectId, actorUserId, options = {}) {
    projectId = pid(projectId);
    const project = await requireProject(store, organizationId, projectId);
    if (project.workflow_status === "COMPLETED" || project.workflowStatus === "COMPLETED") {
      return getPublication(organizationId, projectId);
    }
    assertPublicationMutable(project);

    const bundle = await loadBundle(store, organizationId, projectId);
    const openDecisions = await loadOpenDecisions(store, organizationId, projectId);
    const readiness = evaluatePublicationReadiness({
      project,
      publicationHandoff: bundle.publicationHandoff,
      plan: bundle.plan,
      steps: bundle.steps,
      blockers: bundle.blockers,
      openDecisions
    });

    if (readiness.state === PUBLICATION_READINESS_STATES[0]) {
      throw new WebProjectError(409, ERROR_CODES.COMPLETION_NOT_READY, "Publicación no está lista para finalizar.");
    }
    if (readiness.state === PUBLICATION_READINESS_STATES[1] && !options.acknowledgeWarnings) {
      throw new WebProjectError(
        409,
        ERROR_CODES.COMPLETION_OVERRIDE_REQUIRED,
        "Hay advertencias. Confirma para finalizar."
      );
    }
    if (options.overrideReason) rejectIfSecret(options.overrideReason, "motivo de finalización");

    if (bundle.completionHandoff) {
      return getPublication(organizationId, projectId);
    }

    await runTx(async (tx) => {
      const payload = buildCompletionHandoffSnapshot({
        project,
        publicationHandoff: bundle.publicationHandoff,
        plan: bundle.plan,
        readiness,
        steps: bundle.steps,
        blockers: bundle.blockers,
        createdBy: actorUserId,
        overrideUsed: Boolean(options.acknowledgeWarnings && readiness.warnings.length),
        overrideReason: options.overrideReason || null
      });
      await tx.insertCompletionHandoff({
        organization_id: organizationId,
        web_project_id: projectId,
        publication_handoff_id: bundle.publicationHandoff.id,
        publication_plan_id: bundle.plan.id,
        schema_version: COMPLETION_HANDOFF_SCHEMA_VERSION,
        payload,
        readiness_state: readiness.state,
        override_used: Boolean(options.acknowledgeWarnings && readiness.warnings.length),
        override_reason: options.overrideReason || null,
        created_by: actorUserId
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.PUBLICATION_READY, {
        projectId,
        planId: bundle.plan.id,
        readinessState: readiness.state
      });
    });

    const assembled = await transition(organizationId, projectId, actorUserId, "COMPLETED", {
      completionReady: true,
      skipNotify: true
    });

    await notifySafe(WEB_PROJECT_NOTIFICATION_EVENTS.PROJECT_COMPLETED, {
      organizationId,
      actorUserId,
      project: assembled
    });

    return getPublication(organizationId, projectId);
  }

  return {
    getPublication,
    preparePublicationPlan,
    updatePublicationStep,
    blockPublicationStep,
    unblockPublicationStep,
    completeProject
  };
}

module.exports = {
  createPublicationOperations,
  STATUS_TRANSITIONS,
  assertStatusTransition
};
