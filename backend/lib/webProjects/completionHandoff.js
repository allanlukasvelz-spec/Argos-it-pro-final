const { COMPLETION_HANDOFF_SCHEMA_VERSION } = require("./constants");
const { sanitizeValue } = require("./architectureHandoff");

function buildCompletionHandoffSnapshot({
  project,
  publicationHandoff,
  plan,
  readiness,
  steps,
  blockers,
  createdBy,
  overrideUsed,
  overrideReason
}) {
  const applicable = (steps || []).filter((s) => s.status !== "NOT_APPLICABLE");
  return {
    schemaVersion: COMPLETION_HANDOFF_SCHEMA_VERSION,
    project: sanitizeValue({ id: project.id, title: project.title }),
    publicationHandoffId: publicationHandoff.id,
    publicationPlanId: plan.id,
    validationPlanId: plan.validation_plan_id ?? plan.validationPlanId,
    targetHostname: plan.target_hostname ?? plan.targetHostname ?? project.website_hostname ?? null,
    readiness: sanitizeValue(readiness),
    stepSummary: {
      total: applicable.length,
      done: applicable.filter((s) => s.status === "DONE").length,
      blocked: applicable.filter((s) => s.status === "BLOCKED").length,
      openBlockers: (blockers || []).filter((b) => !b.resolved_at && !b.resolvedAt).length
    },
    warnings: (readiness.warnings || []).map((w) => sanitizeValue(w)),
    overrideUsed: Boolean(overrideUsed),
    overrideReason: overrideReason || null,
    createdBy: createdBy || null
  };
}

module.exports = {
  buildCompletionHandoffSnapshot
};
