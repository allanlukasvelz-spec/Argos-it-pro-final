const { DEVELOPMENT_HANDOFF_SCHEMA_VERSION, VALIDATION_HANDOFF_SCHEMA_VERSION } = require("./constants");
const { sanitizeValue } = require("./architectureHandoff");

function buildDevelopmentHandoffSnapshot({
  project,
  approvedMockup,
  approvedArchitecture,
  architecturePages,
  mockupPages,
  mockupSections,
  createdBy
}) {
  return {
    schemaVersion: DEVELOPMENT_HANDOFF_SCHEMA_VERSION,
    project: sanitizeValue({
      id: project.id,
      title: project.title,
      projectType: project.project_type || project.projectType
    }),
    architecture: sanitizeValue({
      id: approvedArchitecture.id,
      version: approvedArchitecture.version,
      primaryLanguage: approvedArchitecture.primary_language,
      additionalLanguages: approvedArchitecture.additional_languages
    }),
    mockup: sanitizeValue({
      id: approvedMockup.id,
      version: approvedMockup.version,
      approvedAt: approvedMockup.approved_at,
      approvedBy: approvedMockup.approved_by,
      headerVariant: approvedMockup.header_variant,
      footerVariant: approvedMockup.footer_variant
    }),
    pageCount: (architecturePages || []).filter((p) => !p.archived_at).length,
    mockupPageCount: (mockupPages || []).filter((p) => !p.archived_at).length,
    sectionCount: (mockupSections || []).filter((s) => !s.archived_at).length,
    createdBy: createdBy || null
  };
}

function buildValidationHandoffSnapshot({
  project,
  handoff,
  plan,
  items,
  readiness,
  progress,
  createdBy,
  overrideUsed,
  overrideReason
}) {
  const applicable = (items || []).filter((i) => i.status !== "NOT_APPLICABLE");
  return {
    schemaVersion: VALIDATION_HANDOFF_SCHEMA_VERSION,
    project: sanitizeValue({ id: project.id, title: project.title }),
    architectureVersion: handoff.architecture_version,
    mockupVersion: handoff.mockup_version,
    developmentPlanId: plan.id,
    developmentPlanVersion: plan.version,
    progress,
    readiness: sanitizeValue(readiness),
    workItemSummary: {
      total: applicable.length,
      done: applicable.filter((i) => i.status === "DONE").length,
      blocked: applicable.filter((i) => i.status === "BLOCKED").length,
      inProgress: applicable.filter((i) => i.status === "IN_PROGRESS").length
    },
    openWarnings: (readiness.warnings || []).map((w) => sanitizeValue(w)),
    overrideUsed: Boolean(overrideUsed),
    overrideReason: overrideReason || null,
    createdBy: createdBy || null
  };
}

module.exports = {
  buildDevelopmentHandoffSnapshot,
  buildValidationHandoffSnapshot
};
