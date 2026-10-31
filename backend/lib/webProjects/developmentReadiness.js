const { DEVELOPMENT_READINESS_STATES } = require("./constants");

function deriveProgress(items) {
  const applicable = (items || []).filter((i) => i.status !== "NOT_APPLICABLE");
  if (!applicable.length) return { percent: 0, done: 0, total: 0 };
  const done = applicable.filter((i) => i.status === "DONE").length;
  return {
    percent: Math.round((done / applicable.length) * 100),
    done,
    total: applicable.length
  };
}

function evaluateDevelopmentReadiness(input) {
  const {
    project,
    handoff,
    plan,
    items,
    blockers,
    openDecisions
  } = input;
  const errors = [];
  const warnings = [];

  if (!handoff) {
    errors.push({ code: "NO_HANDOFF", message: "No hay handoff de desarrollo registrado." });
  }
  if (!plan) {
    errors.push({ code: "NO_PLAN", message: "No hay plan de desarrollo preparado." });
  }
  if (project?.archived_at || project?.archivedAt) {
    errors.push({ code: "ARCHIVED", message: "Proyecto archivado." });
  }
  if (project?.workflow_status !== "DEVELOPMENT" && project?.workflowStatus !== "DEVELOPMENT") {
    errors.push({ code: "WRONG_WORKFLOW", message: "El proyecto no está en fase Desarrollo." });
  }

  const required = (items || []).filter((i) => i.required && i.status !== "NOT_APPLICABLE");
  const blocked = required.filter((i) => i.status === "BLOCKED");
  const incomplete = required.filter((i) => !["DONE", "NOT_APPLICABLE"].includes(i.status));

  if (blocked.length) {
    errors.push({
      code: "BLOCKED_ITEMS",
      message: `${blocked.length} tarea(s) requerida(s) bloqueada(s).`
    });
  }
  if (incomplete.length) {
    for (const item of incomplete) {
      if (item.status === "BLOCKED") continue;
      if (["TODO", "READY", "IN_PROGRESS", "REVIEW"].includes(item.status)) {
        errors.push({
          code: "ITEM_INCOMPLETE",
          message: `Pendiente: ${item.title}`,
          itemId: item.id
        });
      }
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

  const optionalPending = (items || []).filter(
    (i) => !i.required && i.status !== "DONE" && i.status !== "NOT_APPLICABLE"
  );
  for (const item of optionalPending) {
    warnings.push({
      code: "OPTIONAL_PENDING",
      message: `Opcional pendiente: ${item.title}`,
      itemId: item.id
    });
  }

  const partialContent = (items || []).filter(
    (i) => i.required && (i.content_readiness || i.contentReadiness) === "PARTIAL"
  );
  for (const item of partialContent) {
    warnings.push({
      code: "CONTENT_PARTIAL",
      message: `Contenido parcial: ${item.title}`,
      itemId: item.id
    });
  }

  let state = DEVELOPMENT_READINESS_STATES[2]; // READY
  if (errors.length) state = DEVELOPMENT_READINESS_STATES[0]; // NOT_READY
  else if (warnings.length) state = DEVELOPMENT_READINESS_STATES[1]; // READY_WITH_WARNINGS

  return {
    state,
    errors,
    warnings,
    metrics: deriveProgress(items)
  };
}

module.exports = {
  deriveProgress,
  evaluateDevelopmentReadiness
};
