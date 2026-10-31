const { PUBLICATION_READINESS_STATES } = require("./constants");

function deriveProgress(steps) {
  const applicable = (steps || []).filter((s) => s.status !== "NOT_APPLICABLE");
  if (!applicable.length) return { percent: 0, done: 0, total: 0 };
  const done = applicable.filter((s) => s.status === "DONE").length;
  return {
    percent: Math.round((done / applicable.length) * 100),
    done,
    total: applicable.length
  };
}

function evaluatePublicationReadiness(input) {
  const { project, publicationHandoff, plan, steps, blockers, openDecisions } = input;
  const errors = [];
  const warnings = [];

  if (!publicationHandoff) {
    errors.push({ code: "NO_HANDOFF", message: "No hay handoff de publicación registrado." });
  }
  if (!plan) {
    errors.push({ code: "NO_PLAN", message: "No hay plan de publicación preparado." });
  }
  if (project?.archived_at || project?.archivedAt) {
    errors.push({ code: "ARCHIVED", message: "Proyecto archivado." });
  }
  const workflow = project?.workflow_status || project?.workflowStatus;
  if (workflow !== "PUBLICATION" && workflow !== "COMPLETED") {
    errors.push({ code: "WRONG_WORKFLOW", message: "El proyecto no está en fase Publicación." });
  }

  const required = (steps || []).filter((s) => s.required && s.status !== "NOT_APPLICABLE");
  const blocked = required.filter((s) => s.status === "BLOCKED");
  const incomplete = required.filter((s) => !["DONE", "NOT_APPLICABLE"].includes(s.status));

  if (blocked.length) {
    errors.push({
      code: "BLOCKED_STEPS",
      message: `${blocked.length} paso(s) requerido(s) bloqueado(s).`
    });
  }
  for (const step of incomplete) {
    if (step.status === "BLOCKED") continue;
    if (["TODO", "READY", "IN_PROGRESS", "REVIEW"].includes(step.status)) {
      errors.push({
        code: "STEP_INCOMPLETE",
        message: `Pendiente: ${step.title}`,
        stepId: step.id
      });
    }
  }

  const openBlockers = (blockers || []).filter((b) => !b.resolved_at && !b.resolvedAt);
  if (openBlockers.length) {
    errors.push({
      code: "OPEN_BLOCKERS",
      message: `${openBlockers.length} bloqueo(s) sin resolver.`
    });
  }

  if ((openDecisions || []).length) {
    errors.push({
      code: "OPEN_DECISIONS",
      message: "Hay decisiones pendientes del brief."
    });
  }

  const optionalPending = (steps || []).filter(
    (s) => !s.required && s.status !== "DONE" && s.status !== "NOT_APPLICABLE"
  );
  for (const step of optionalPending) {
    warnings.push({
      code: "OPTIONAL_PENDING",
      message: `Opcional pendiente: ${step.title}`,
      stepId: step.id
    });
  }

  let state = PUBLICATION_READINESS_STATES[2];
  if (errors.length) state = PUBLICATION_READINESS_STATES[0];
  else if (warnings.length) state = PUBLICATION_READINESS_STATES[1];

  return {
    state,
    errors,
    warnings,
    metrics: deriveProgress(steps)
  };
}

module.exports = {
  deriveProgress,
  evaluatePublicationReadiness
};
