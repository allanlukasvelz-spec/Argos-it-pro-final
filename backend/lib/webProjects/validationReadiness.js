const { VALIDATION_READINESS_STATES, VALIDATION_CHECK_STATUSES, VALIDATION_DEFECT_STATUSES } = require("./constants");

const EVALUATED_STATUSES = new Set([
  "PASS",
  "FAIL",
  "BLOCKED",
  "NOT_TESTABLE",
  "NOT_APPLICABLE"
]);

const BLOCKING_CHECK_STATUSES = new Set(["PENDING", "IN_PROGRESS", "FAIL", "BLOCKED", "NOT_TESTABLE"]);

const BLOCKING_DEFECT_STATUSES = new Set(["OPEN", "IN_PROGRESS", "FIXED", "RETEST_REQUIRED"]);

function deriveExecutionProgress(checks) {
  const applicable = (checks || []).filter((c) => c.status !== "NOT_APPLICABLE");
  if (!applicable.length) {
    return { percent: 0, evaluated: 0, total: 0 };
  }
  const evaluated = applicable.filter((c) => EVALUATED_STATUSES.has(c.status)).length;
  return {
    percent: Math.round((evaluated / applicable.length) * 100),
    evaluated,
    total: applicable.length
  };
}

function derivePassRate(checks) {
  const applicable = (checks || []).filter(
    (c) => c.status !== "NOT_APPLICABLE" && EVALUATED_STATUSES.has(c.status)
  );
  if (!applicable.length) return { percent: 0, passed: 0, evaluated: 0 };
  const passed = applicable.filter((c) => c.status === "PASS").length;
  return {
    percent: Math.round((passed / applicable.length) * 100),
    passed,
    evaluated: applicable.length
  };
}

function evaluateValidationReadiness(input) {
  const {
    project,
    validationHandoff,
    plan,
    checks,
    defects,
    openDecisions
  } = input;
  const errors = [];
  const warnings = [];

  if (!validationHandoff) {
    errors.push({ code: "NO_HANDOFF", message: "No hay handoff de validación." });
  }
  if (!plan) {
    errors.push({ code: "NO_PLAN", message: "No hay plan de validación preparado." });
  }
  if (project?.archived_at || project?.archivedAt) {
    errors.push({ code: "ARCHIVED", message: "Proyecto archivado." });
  }
  const workflow = project?.workflow_status || project?.workflowStatus;
  if (workflow !== "VALIDATION" && workflow !== "PUBLICATION") {
    errors.push({ code: "WRONG_WORKFLOW", message: "El proyecto no está en fase Validación." });
  }

  const required = (checks || []).filter((c) => c.required);
  for (const check of required) {
    if (BLOCKING_CHECK_STATUSES.has(check.status)) {
      errors.push({
        code: "CHECK_BLOCKING",
        message: `Check requerido: ${check.title} (${check.status})`,
        checkId: check.id
      });
    }
  }

  const openDefects = (defects || []).filter((d) => BLOCKING_DEFECT_STATUSES.has(d.status));
  const critical = openDefects.filter((d) => d.severity === "CRITICAL");
  const high = openDefects.filter((d) => d.severity === "HIGH");
  if (critical.length) {
    errors.push({
      code: "CRITICAL_DEFECTS",
      message: `${critical.length} defecto(s) crítico(s) sin verificar.`
    });
  }
  if (high.length) {
    errors.push({
      code: "HIGH_DEFECTS",
      message: `${high.length} defecto(s) HIGH sin verificar.`
    });
  }

  if ((openDecisions || []).length) {
    errors.push({ code: "OPEN_DECISIONS", message: "Hay decisiones pendientes del brief." });
  }

  const optionalPending = (checks || []).filter(
    (c) => !c.required && !EVALUATED_STATUSES.has(c.status) && c.status !== "NOT_APPLICABLE"
  );
  for (const check of optionalPending) {
    warnings.push({
      code: "OPTIONAL_PENDING",
      message: `Check opcional pendiente: ${check.title}`,
      checkId: check.id
    });
  }

  const wontFix = (defects || []).filter((d) => d.status === "WONT_FIX" && d.severity !== "CRITICAL");
  for (const d of wontFix) {
    warnings.push({
      code: "WONT_FIX",
      message: `Defecto aceptado: ${d.title}`,
      defectId: d.id
    });
  }

  let state = VALIDATION_READINESS_STATES[2];
  if (errors.length) state = VALIDATION_READINESS_STATES[0];
  else if (warnings.length) state = VALIDATION_READINESS_STATES[1];

  return {
    state,
    errors,
    warnings,
    executionProgress: deriveExecutionProgress(checks),
    passRate: derivePassRate(checks)
  };
}

module.exports = {
  deriveExecutionProgress,
  derivePassRate,
  evaluateValidationReadiness,
  EVALUATED_STATUSES,
  BLOCKING_CHECK_STATUSES
};
