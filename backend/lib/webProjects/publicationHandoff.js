const { PUBLICATION_HANDOFF_SCHEMA_VERSION } = require("./constants");
const { sanitizeValue } = require("./architectureHandoff");

function buildPublicationHandoffSnapshot({
  project,
  validationHandoff,
  plan,
  run,
  readiness,
  checks,
  defects,
  createdBy,
  overrideUsed,
  overrideReason
}) {
  const applicable = (checks || []).filter((c) => c.status !== "NOT_APPLICABLE");
  return {
    schemaVersion: PUBLICATION_HANDOFF_SCHEMA_VERSION,
    project: sanitizeValue({ id: project.id, title: project.title }),
    validationHandoffId: validationHandoff.id,
    validationPlanId: plan.id,
    validationRunId: run?.id || null,
    architectureVersion: plan.architecture_version,
    mockupVersion: plan.mockup_version,
    developmentPlanId: plan.development_plan_id,
    readiness: sanitizeValue(readiness),
    checkSummary: {
      total: applicable.length,
      pass: applicable.filter((c) => c.status === "PASS").length,
      fail: applicable.filter((c) => c.status === "FAIL").length,
      notTestable: applicable.filter((c) => c.status === "NOT_TESTABLE").length,
      notApplicable: (checks || []).filter((c) => c.status === "NOT_APPLICABLE").length
    },
    openDefects: (defects || [])
      .filter((d) => !["VERIFIED", "WONT_FIX"].includes(d.status))
      .map((d) => sanitizeValue({ id: d.id, title: d.title, severity: d.severity, status: d.status })),
    acceptedDefects: (defects || [])
      .filter((d) => d.status === "WONT_FIX")
      .map((d) => sanitizeValue({ id: d.id, title: d.title, reason: d.wont_fix_reason })),
    warnings: (readiness.warnings || []).map((w) => sanitizeValue(w)),
    overrideUsed: Boolean(overrideUsed),
    overrideReason: overrideReason || null,
    createdBy: createdBy || null
  };
}

module.exports = {
  buildPublicationHandoffSnapshot
};
