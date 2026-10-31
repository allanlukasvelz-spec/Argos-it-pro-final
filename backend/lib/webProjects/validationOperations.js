const {
  AUDIT_ACTIONS,
  ERROR_CODES,
  VALIDATION_CHECK_STATUSES,
  VALIDATION_DEFECT_SEVERITIES,
  VALIDATION_DEFECT_STATUSES,
  VALIDATION_EVIDENCE_TYPES,
  VALIDATION_READINESS_STATES,
  PUBLICATION_HANDOFF_SCHEMA_VERSION
} = require("./constants");
const { WebProjectError } = require("./errors");
const { rejectIfSecret } = require("./secrets");
const { hasOwn } = require("./httpContract");
const { responseMap, resolveSchemaVersion } = require("./formRegistry");
const { generateValidationChecks } = require("./validationPlanGenerator");
const { evaluateValidationReadiness } = require("./validationReadiness");
const { assembleValidationPayload } = require("./validationAssembler");
const { buildPublicationHandoffSnapshot } = require("./publicationHandoff");
const { assertValidHttpUrl } = require("./developmentOperations");

const CHECK_TRANSITIONS = Object.freeze({
  PENDING: new Set(["IN_PROGRESS", "BLOCKED", "NOT_TESTABLE", "NOT_APPLICABLE"]),
  IN_PROGRESS: new Set(["PASS", "FAIL", "BLOCKED", "NOT_TESTABLE", "NOT_APPLICABLE"]),
  BLOCKED: new Set(["IN_PROGRESS"]),
  FAIL: new Set(["IN_PROGRESS"]),
  PASS: new Set([]),
  NOT_TESTABLE: new Set(["IN_PROGRESS"]),
  NOT_APPLICABLE: new Set(["IN_PROGRESS"])
});

const DEFECT_TRANSITIONS = Object.freeze({
  OPEN: new Set(["IN_PROGRESS", "WONT_FIX"]),
  IN_PROGRESS: new Set(["FIXED", "WONT_FIX"]),
  FIXED: new Set(["RETEST_REQUIRED"]),
  RETEST_REQUIRED: new Set(["VERIFIED", "OPEN"]),
  VERIFIED: new Set([]),
  WONT_FIX: new Set([])
});

function pid(value) {
  return Number(value);
}

function assertCheckTransition(from, to) {
  if (!VALIDATION_CHECK_STATUSES.includes(to)) {
    throw new WebProjectError(409, ERROR_CODES.VALIDATION_CHECK_INVALID, "Estado de check no válido.");
  }
  if (!CHECK_TRANSITIONS[from]?.has(to)) {
    throw new WebProjectError(
      409,
      ERROR_CODES.VALIDATION_CHECK_INVALID,
      `Transición de check no permitida: ${from} → ${to}`
    );
  }
}

function assertDefectTransition(from, to) {
  if (!VALIDATION_DEFECT_STATUSES.includes(to)) {
    throw new WebProjectError(409, ERROR_CODES.VALIDATION_DEFECT_INVALID, "Estado de defecto no válido.");
  }
  if (!DEFECT_TRANSITIONS[from]?.has(to)) {
    throw new WebProjectError(
      409,
      ERROR_CODES.VALIDATION_DEFECT_INVALID,
      `Transición de defecto no permitida: ${from} → ${to}`
    );
  }
}

function createValidationOperations(deps) {
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

  function assertValidationMutable(project) {
    assertNotArchived(project);
    assertNotCompleted(project);
    if (project.workflow_status !== "VALIDATION") {
      throw new WebProjectError(
        409,
        ERROR_CODES.VALIDATION_WORKFLOW_BLOCKED,
        "Esta acción solo está disponible en fase Validación."
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
    const validationHandoff = await tx.getValidationHandoffForProject(organizationId, projectId);
    const plan = await tx.getActiveValidationPlan(organizationId, projectId);
    if (!plan) {
      return {
        validationHandoff,
        plan: null,
        run: null,
        checks: [],
        defects: [],
        publicationHandoff: null
      };
    }
    const [run, checks, defects, publicationHandoff] = await Promise.all([
      tx.getOpenValidationRun(organizationId, projectId, plan.id),
      tx.listValidationChecks(organizationId, projectId, plan.id),
      tx.listValidationDefects(organizationId, projectId, plan.id),
      tx.getPublicationHandoff(organizationId, projectId, plan.id)
    ]);
    return { validationHandoff, plan, run, checks, defects, publicationHandoff };
  }

  async function loadEvidenceAndHistory(tx, organizationId, projectId, checks) {
    const evidenceByCheck = new Map();
    const historyByCheck = new Map();
    for (const check of checks || []) {
      evidenceByCheck.set(check.id, await tx.listValidationEvidence(organizationId, projectId, check.id));
      historyByCheck.set(
        check.id,
        await tx.listValidationCheckResults(organizationId, projectId, check.id)
      );
    }
    return { evidenceByCheck, historyByCheck };
  }

  async function assembleView(tx, organizationId, project, bundle) {
    const openDecisions = await loadOpenDecisions(tx, organizationId, project.id);
    const { evidenceByCheck, historyByCheck } = await loadEvidenceAndHistory(
      tx,
      organizationId,
      project.id,
      bundle.checks
    );
    const readiness = evaluateValidationReadiness({
      project,
      validationHandoff: bundle.validationHandoff,
      plan: bundle.plan,
      checks: bundle.checks,
      defects: bundle.defects,
      openDecisions
    });
    return assembleValidationPayload({
      validationHandoff: bundle.validationHandoff,
      plan: bundle.plan,
      run: bundle.run,
      checks: bundle.checks,
      defects: bundle.defects,
      evidenceByCheck,
      historyByCheck,
      readiness,
      publicationHandoff: bundle.publicationHandoff
    });
  }

  async function getValidation(organizationId, projectId) {
    projectId = pid(projectId);
    const project = await requireProject(store, organizationId, projectId);
    const bundle = await loadBundle(store, organizationId, projectId);
    return assembleView(store, organizationId, project, bundle);
  }

  async function prepareValidationPlan(organizationId, projectId, actorUserId) {
    projectId = pid(projectId);
    const project = await requireProject(store, organizationId, projectId);
    assertValidationMutable(project);

    const existing = await store.getActiveValidationPlan(organizationId, projectId);
    if (existing) {
      const bundle = await loadBundle(store, organizationId, projectId);
      return assembleView(store, organizationId, project, bundle);
    }

    const validationHandoff = await store.getValidationHandoffForProject(organizationId, projectId);
    if (!validationHandoff) {
      throw new WebProjectError(
        409,
        ERROR_CODES.VALIDATION_NOT_READY,
        "No hay handoff de validación. Usa «Pasar a validación» desde Desarrollo."
      );
    }

    await runTx(async (tx) => {
      const devHandoff = await tx.getDevelopmentHandoff(organizationId, projectId);
      const devPlan = await tx.getActiveDevelopmentPlan(organizationId, projectId);
      const arch = devHandoff
        ? await tx.getArchitecture(organizationId, projectId, devHandoff.architecture_id)
        : null;
      const mockup = devHandoff
        ? await tx.getMockup(organizationId, projectId, devHandoff.mockup_id)
        : null;
      const [archPages, archBlocks, mockPages, mockSections, devItems, items, formRows] =
        await Promise.all([
          arch ? tx.listArchitecturePages(organizationId, projectId, arch.id) : [],
          arch ? tx.listArchitectureBlocks(organizationId, projectId, arch.id) : [],
          mockup ? tx.listMockupPages(organizationId, projectId, mockup.id) : [],
          mockup ? tx.listMockupSections(organizationId, projectId, mockup.id) : [],
          devPlan ? tx.listDevelopmentItems(organizationId, projectId, devPlan.id) : [],
          tx.listItems(organizationId, projectId),
          tx.listFormResponses(organizationId, projectId)
        ]);
      const formValues = responseMap(formRows, resolveSchemaVersion(formRows));

      const representativeSamples = {};
      const specs = generateValidationChecks({
        architecturePages: archPages,
        architectureBlocks: archBlocks,
        mockupPages: mockPages,
        mockupSections: mockSections,
        developmentItems: devItems,
        items,
        formValues,
        projectType: project.project_type,
        navigationEntries: []
      });
      for (const spec of specs) {
        if (spec.template_group_key && spec.representative_sample_item_id) {
          representativeSamples[spec.template_group_key] = spec.representative_sample_item_id;
        }
      }

      const plan = await tx.insertValidationPlan({
        organization_id: organizationId,
        web_project_id: projectId,
        validation_handoff_id: validationHandoff.id,
        architecture_id: devHandoff?.architecture_id || null,
        architecture_version: devHandoff?.architecture_version || null,
        mockup_id: devHandoff?.mockup_id || null,
        mockup_version: devHandoff?.mockup_version || null,
        development_plan_id: validationHandoff.development_plan_id,
        representative_samples: representativeSamples,
        created_by: actorUserId
      });

      const run = await tx.insertValidationRun({
        organization_id: organizationId,
        web_project_id: projectId,
        validation_plan_id: plan.id,
        run_number: 1,
        started_by: actorUserId
      });

      for (const spec of specs) {
        const { representative_sample_item_id: _sample, ...checkRow } = spec;
        await tx.insertValidationCheck({
          organization_id: organizationId,
          web_project_id: projectId,
          validation_plan_id: plan.id,
          validation_run_id: run.id,
          ...checkRow
        });
      }

      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.VALIDATION_PLAN_CREATED, {
        projectId,
        planId: plan.id,
        checkCount: specs.length
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.VALIDATION_RUN_STARTED, {
        projectId,
        planId: plan.id,
        runId: run.id
      });
    });

    return getValidation(organizationId, projectId);
  }

  async function updateValidationCheck(organizationId, projectId, checkId, actorUserId, input = {}) {
    projectId = pid(projectId);
    checkId = pid(checkId);
    const project = await requireProject(store, organizationId, projectId);
    assertValidationMutable(project);

    const status = input.status;

    if (input.actualResult) rejectIfSecret(input.actualResult, "resultado actual");
    if (input.statusReason) rejectIfSecret(input.statusReason, "motivo de estado");

    if (status === "FAIL" && !input.actualResult && !input.actual_result) {
      throw new WebProjectError(
        400,
        ERROR_CODES.VALIDATION_CHECK_INVALID,
        "FAIL requiere actualResult."
      );
    }
    if ((status === "NOT_TESTABLE" || status === "NOT_APPLICABLE") && !input.statusReason && !input.reason) {
      throw new WebProjectError(
        400,
        ERROR_CODES.VALIDATION_CHECK_INVALID,
        `${status} requiere motivo.`
      );
    }

    await runTx(async (tx) => {
      const check = await tx.getValidationCheck(organizationId, projectId, checkId);
      if (!check) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Check no encontrado.");
      if (status) assertCheckTransition(check.status, status);

      const patch = {};
      if (status) {
        patch.status = status;
        patch.tested_by = actorUserId;
        patch.tested_at = new Date().toISOString();
      }
      if (hasOwn(input, "actualResult") || hasOwn(input, "actual_result")) {
        patch.actual_result = input.actualResult ?? input.actual_result ?? null;
      }
      if (hasOwn(input, "statusReason") || hasOwn(input, "reason")) {
        patch.status_reason = input.statusReason ?? input.reason ?? null;
      }

      const previousStatus = check.status;
      const updated = await tx.updateValidationCheck(organizationId, projectId, checkId, patch);
      if (previousStatus !== updated.status) {
        await tx.insertValidationCheckResult({
          organization_id: organizationId,
          web_project_id: projectId,
          validation_check_id: checkId,
          previous_status: previousStatus,
          new_status: updated.status,
          actual_result: updated.actual_result,
          note: updated.status_reason,
          tested_by: actorUserId
        });
      }
      if (updated.status === "FAIL") {
        await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.VALIDATION_CHECK_FAILED, {
          projectId,
          checkId,
          title: updated.title
        });
      }
    });

    return getValidation(organizationId, projectId);
  }

  async function attachValidationEvidence(organizationId, projectId, checkId, actorUserId, input = {}) {
    projectId = pid(projectId);
    checkId = pid(checkId);
    const project = await requireProject(store, organizationId, projectId);
    assertValidationMutable(project);

    const evidenceType = input.evidenceType || input.evidence_type;
    if (!VALIDATION_EVIDENCE_TYPES.includes(evidenceType)) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "Tipo de evidencia no válido.");
    }
    if (input.textNote) rejectIfSecret(input.textNote, "nota de evidencia");
    if (input.url) assertValidHttpUrl(input.url, "URL de evidencia");

    await runTx(async (tx) => {
      const check = await tx.getValidationCheck(organizationId, projectId, checkId);
      if (!check) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Check no encontrado.");
      await tx.insertValidationEvidence({
        organization_id: organizationId,
        web_project_id: projectId,
        validation_check_id: checkId,
        evidence_type: evidenceType,
        label: input.label || null,
        url: input.url || null,
        text_note: input.textNote || input.text_note || null,
        document_id: input.documentId || input.document_id || null,
        automated_result: input.automatedResult || input.automated_result || null,
        captured_at: input.capturedAt || input.captured_at || new Date().toISOString(),
        uploaded_by: actorUserId
      });
    });

    return getValidation(organizationId, projectId);
  }

  async function createValidationDefect(organizationId, projectId, checkId, actorUserId, input = {}) {
    projectId = pid(projectId);
    checkId = pid(checkId);
    const project = await requireProject(store, organizationId, projectId);
    assertValidationMutable(project);

    const severity = input.severity;
    if (!VALIDATION_DEFECT_SEVERITIES.includes(severity)) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_DEFECT_INVALID, "Severidad no válida.");
    }
    if (input.description) rejectIfSecret(input.description, "descripción de defecto");
    if (!input.title) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_DEFECT_INVALID, "Título requerido.");
    }

    await runTx(async (tx) => {
      const check = await tx.getValidationCheck(organizationId, projectId, checkId);
      if (!check) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Check no encontrado.");
      const plan = await tx.getActiveValidationPlan(organizationId, projectId);
      const run = plan ? await tx.getOpenValidationRun(organizationId, projectId, plan.id) : null;
      await tx.insertValidationDefect({
        organization_id: organizationId,
        web_project_id: projectId,
        validation_plan_id: check.validation_plan_id,
        validation_run_id: run?.id || check.validation_run_id,
        check_id: checkId,
        title: input.title,
        description: input.description || null,
        severity,
        assigned_to: input.assignedTo || input.assigned_to || null,
        development_item_id: input.developmentItemId || input.development_item_id || null,
        created_by: actorUserId
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.VALIDATION_DEFECT_CREATED, {
        projectId,
        checkId,
        severity
      });
    });

    return getValidation(organizationId, projectId);
  }

  async function updateValidationDefect(organizationId, projectId, defectId, actorUserId, input = {}) {
    projectId = pid(projectId);
    defectId = pid(defectId);
    const project = await requireProject(store, organizationId, projectId);
    assertValidationMutable(project);

    const status = input.status;
    if (input.resolutionNote) rejectIfSecret(input.resolutionNote, "nota de resolución");
    if (input.wontFixReason) rejectIfSecret(input.wontFixReason, "motivo wont fix");

    await runTx(async (tx) => {
      const defect = await tx.getValidationDefect(organizationId, projectId, defectId);
      if (!defect) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Defecto no encontrado.");
      if (status) {
        assertDefectTransition(defect.status, status);
        if (status === "WONT_FIX" && !input.wontFixReason && !input.wont_fix_reason) {
          throw new WebProjectError(400, ERROR_CODES.VALIDATION_DEFECT_INVALID, "WONT_FIX requiere motivo.");
        }
      }

      const patch = {};
      if (status) patch.status = status;
      if (hasOwn(input, "assignedTo") || hasOwn(input, "assigned_to")) {
        patch.assigned_to = input.assignedTo ?? input.assigned_to ?? null;
      }
      if (hasOwn(input, "resolutionNote") || hasOwn(input, "resolution_note")) {
        patch.resolution_note = input.resolutionNote ?? input.resolution_note ?? null;
      }
      if (hasOwn(input, "wontFixReason") || hasOwn(input, "wont_fix_reason")) {
        patch.wont_fix_reason = input.wontFixReason ?? input.wont_fix_reason ?? null;
      }
      if (status === "FIXED" || status === "VERIFIED") {
        patch.resolved_at = new Date().toISOString();
        patch.resolved_by = actorUserId;
      }
      let updated = await tx.updateValidationDefect(organizationId, projectId, defectId, patch);

      if (status === "FIXED") {
        await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.VALIDATION_DEFECT_FIXED, {
          projectId,
          defectId
        });
        updated = await tx.updateValidationDefect(organizationId, projectId, defectId, {
          status: "RETEST_REQUIRED"
        });
      }
      if (status === "VERIFIED") {
        await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.VALIDATION_DEFECT_VERIFIED, {
          projectId,
          defectId
        });
      }
    });

    return getValidation(organizationId, projectId);
  }

  async function retestValidationDefect(organizationId, projectId, defectId, actorUserId, input = {}) {
    projectId = pid(projectId);
    defectId = pid(defectId);
    const project = await requireProject(store, organizationId, projectId);
    assertValidationMutable(project);

    const newStatus = input.checkStatus || input.check_status;
    if (!["PASS", "FAIL"].includes(newStatus)) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_CHECK_INVALID, "Retest requiere PASS o FAIL.");
    }
    if (input.note) rejectIfSecret(input.note, "nota de retest");

    await runTx(async (tx) => {
      const defect = await tx.getValidationDefect(organizationId, projectId, defectId);
      if (!defect) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Defecto no encontrado.");
      if (defect.status !== "RETEST_REQUIRED" && defect.status !== "FIXED") {
        throw new WebProjectError(
          409,
          ERROR_CODES.VALIDATION_DEFECT_INVALID,
          "El defecto no está listo para retest."
        );
      }

      const checkId = defect.check_id;
      if (!checkId) throw new WebProjectError(409, ERROR_CODES.VALIDATION_DEFECT_INVALID, "Sin check asociado.");
      const check = await tx.getValidationCheck(organizationId, projectId, checkId);
      if (!check) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Check no encontrado.");

      const previousStatus = check.status;
      await tx.updateValidationCheck(organizationId, projectId, checkId, {
        status: newStatus,
        actual_result: input.actualResult || input.actual_result || check.actual_result,
        tested_by: actorUserId,
        tested_at: new Date().toISOString()
      });
      await tx.insertValidationCheckResult({
        organization_id: organizationId,
        web_project_id: projectId,
        validation_check_id: checkId,
        defect_id: defectId,
        previous_status: previousStatus,
        new_status: newStatus,
        actual_result: input.actualResult || input.actual_result || null,
        note: input.note || "Retest",
        tested_by: actorUserId
      });

      if (newStatus === "PASS") {
        await tx.updateValidationDefect(organizationId, projectId, defectId, {
          status: "VERIFIED",
          resolved_at: new Date().toISOString(),
          resolved_by: actorUserId
        });
        await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.VALIDATION_DEFECT_VERIFIED, {
          projectId,
          defectId
        });
      } else {
        await tx.updateValidationDefect(organizationId, projectId, defectId, {
          status: "OPEN",
          resolved_at: null,
          resolved_by: null
        });
      }
    });

    return getValidation(organizationId, projectId);
  }

  async function setRepresentativeSample(organizationId, projectId, actorUserId, input = {}) {
    projectId = pid(projectId);
    const project = await requireProject(store, organizationId, projectId);
    assertValidationMutable(project);

    const templateGroupKey = input.templateGroupKey || input.template_group_key;
    const itemId = pid(input.itemId || input.item_id);
    if (!templateGroupKey || !itemId) {
      throw new WebProjectError(400, ERROR_CODES.VALIDATION_ERROR, "templateGroupKey e itemId requeridos.");
    }

    await runTx(async (tx) => {
      const plan = await tx.getActiveValidationPlan(organizationId, projectId);
      if (!plan) throw new WebProjectError(409, ERROR_CODES.VALIDATION_NOT_READY, "No hay plan activo.");
      const item = await tx.getItem(organizationId, projectId, itemId);
      if (!item) throw new WebProjectError(404, ERROR_CODES.NOT_FOUND, "Item no encontrado.");
      const samples =
        typeof plan.representative_samples === "object"
          ? { ...plan.representative_samples }
          : plan.representative_samples
            ? JSON.parse(plan.representative_samples)
            : {};
      samples[templateGroupKey] = itemId;
      await tx.updateValidationPlan(organizationId, projectId, plan.id, {
        representative_samples: samples
      });
    });

    return getValidation(organizationId, projectId);
  }

  async function startPublication(organizationId, projectId, actorUserId, options = {}) {
    projectId = pid(projectId);
    const project = await requireProject(store, organizationId, projectId);
    assertValidationMutable(project);

    const bundle = await loadBundle(store, organizationId, projectId);
    const openDecisions = await loadOpenDecisions(store, organizationId, projectId);
    const readiness = evaluateValidationReadiness({
      project,
      validationHandoff: bundle.validationHandoff,
      plan: bundle.plan,
      checks: bundle.checks,
      defects: bundle.defects,
      openDecisions
    });

    if (readiness.state === VALIDATION_READINESS_STATES[0]) {
      throw new WebProjectError(409, ERROR_CODES.PUBLICATION_NOT_READY, "Validación no está lista para publicación.");
    }
    if (
      readiness.state === VALIDATION_READINESS_STATES[1] &&
      !options.acknowledgeWarnings
    ) {
      throw new WebProjectError(
        409,
        ERROR_CODES.PUBLICATION_OVERRIDE_REQUIRED,
        "Hay advertencias. Confirma para continuar."
      );
    }
    if (options.overrideReason) rejectIfSecret(options.overrideReason, "motivo de publicación");

    const existingPub = bundle.publicationHandoff;
    if (existingPub) {
      return getValidation(organizationId, projectId);
    }

    await runTx(async (tx) => {
      const payload = buildPublicationHandoffSnapshot({
        project,
        validationHandoff: bundle.validationHandoff,
        plan: bundle.plan,
        run: bundle.run,
        readiness,
        checks: bundle.checks,
        defects: bundle.defects,
        createdBy: actorUserId,
        overrideUsed: Boolean(options.acknowledgeWarnings && readiness.warnings.length),
        overrideReason: options.overrideReason || null
      });
      await tx.insertPublicationHandoff({
        organization_id: organizationId,
        web_project_id: projectId,
        validation_handoff_id: bundle.validationHandoff.id,
        validation_plan_id: bundle.plan.id,
        validation_run_id: bundle.run?.id || null,
        schema_version: PUBLICATION_HANDOFF_SCHEMA_VERSION,
        payload,
        readiness_state: readiness.state,
        override_used: Boolean(options.acknowledgeWarnings && readiness.warnings.length),
        override_reason: options.overrideReason || null,
        created_by: actorUserId
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.VALIDATION_READY, {
        projectId,
        readinessState: readiness.state
      });
      await audit(tx, organizationId, actorUserId, AUDIT_ACTIONS.PUBLICATION_STARTED, {
        projectId,
        planId: bundle.plan.id
      });
    });

    const assembled = await transition(organizationId, projectId, actorUserId, "PUBLICATION", {
      publicationReady: true,
      skipNotify: true
    });

    await notifySafe(WEB_PROJECT_NOTIFICATION_EVENTS.PUBLICATION_STARTED, {
      organizationId,
      actorUserId,
      project: assembled
    });

    return getValidation(organizationId, projectId);
  }

  return {
    getValidation,
    prepareValidationPlan,
    updateValidationCheck,
    attachValidationEvidence,
    createValidationDefect,
    updateValidationDefect,
    retestValidationDefect,
    setRepresentativeSample,
    startPublication
  };
}

module.exports = {
  createValidationOperations,
  CHECK_TRANSITIONS,
  DEFECT_TRANSITIONS,
  assertCheckTransition,
  assertDefectTransition
};
