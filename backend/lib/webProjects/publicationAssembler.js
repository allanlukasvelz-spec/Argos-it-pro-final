function serializePublicationHandoff(row) {
  if (!row) return null;
  return {
    id: row.id,
    validationPlanId: row.validation_plan_id,
    validationRunId: row.validation_run_id,
    readinessState: row.readiness_state,
    overrideUsed: Boolean(row.override_used),
    createdAt: row.created_at,
    payload:
      row.payload && typeof row.payload === "object"
        ? row.payload
        : row.payload
          ? JSON.parse(row.payload)
          : {}
  };
}

function serializePlan(row) {
  if (!row) return null;
  return {
    id: row.id,
    publicationHandoffId: row.publication_handoff_id,
    validationPlanId: row.validation_plan_id,
    status: row.status,
    targetHostname: row.target_hostname,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function serializeBlocker(row) {
  return {
    id: row.id,
    stepId: row.publication_step_id,
    blockerType: row.blocker_type,
    description: row.description,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    resolutionNote: row.resolution_note
  };
}

function serializeStep(row, { blockers = [] } = {}) {
  return {
    id: row.id,
    planId: row.publication_plan_id,
    stepType: row.step_type,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    required: Boolean(row.required),
    sortOrder: row.sort_order,
    notes: row.notes,
    evidenceUrl: row.evidence_url,
    assignedTo: row.assigned_to,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    blockers: blockers.map(serializeBlocker)
  };
}

function serializeCompletionHandoff(row) {
  if (!row) return null;
  return {
    id: row.id,
    publicationHandoffId: row.publication_handoff_id,
    publicationPlanId: row.publication_plan_id,
    readinessState: row.readiness_state,
    overrideUsed: Boolean(row.override_used),
    createdAt: row.created_at
  };
}

function countSteps(steps) {
  const counts = {
    TODO: 0,
    READY: 0,
    IN_PROGRESS: 0,
    BLOCKED: 0,
    REVIEW: 0,
    DONE: 0,
    NOT_APPLICABLE: 0
  };
  for (const step of steps || []) {
    if (counts[step.status] !== undefined) counts[step.status] += 1;
  }
  return counts;
}

function assemblePublicationPayload({
  publicationHandoff,
  plan,
  steps,
  blockers,
  readiness,
  completionHandoff
}) {
  const blockersByStep = new Map();
  for (const blocker of blockers || []) {
    const stepId = blocker.publication_step_id;
    if (!blockersByStep.has(stepId)) blockersByStep.set(stepId, []);
    blockersByStep.get(stepId).push(blocker);
  }

  const serializedSteps = (steps || []).map((row) =>
    serializeStep(row, { blockers: blockersByStep.get(row.id) || [] })
  );

  const openBlockers = (blockers || []).filter((b) => !b.resolved_at).length;

  return {
    publicationHandoff: serializePublicationHandoff(publicationHandoff),
    plan: serializePlan(plan),
    steps: serializedSteps,
    progress: readiness.metrics,
    counts: {
      steps: countSteps(steps),
      blockersOpen: openBlockers
    },
    readiness: {
      state: readiness.state,
      errors: readiness.errors,
      warnings: readiness.warnings
    },
    completionReadiness: readiness.state,
    completionHandoff: serializeCompletionHandoff(completionHandoff)
  };
}

module.exports = {
  assemblePublicationPayload,
  serializePublicationHandoff,
  serializePlan,
  serializeStep,
  serializeCompletionHandoff
};
