const { FORM_SCHEMA_VERSION, REVIEW_TARGET_TYPES } = require("./constants");
const { fieldByKey, isApplicable, isFilled, responseMap, resolveSchemaVersion } = require("./formRegistry");

function pick(row, snake, camel, fallback = null) {
  if (!row) return fallback;
  if (row[snake] !== undefined && row[snake] !== null) return row[snake];
  if (row[camel] !== undefined && row[camel] !== null) return row[camel];
  return fallback;
}

function reviewTargetType(review) {
  return pick(review, "target_type", "targetType", "PROJECT") || "PROJECT";
}

function reviewIdentity(review) {
  const type = reviewTargetType(review);
  if (type === "FORM_FIELD") {
    const schema = pick(review, "schema_version", "schemaVersion", FORM_SCHEMA_VERSION);
    const key = pick(review, "target_key", "targetKey", "");
    return `${type}:${schema}:${key}`;
  }
  if (type === "ITEM" || type === "DOCUMENT") {
    return `${type}:${String(pick(review, "target_id", "targetId", ""))}`;
  }
  return "PROJECT";
}

function laterDate(left, right) {
  if (!left) return false;
  if (!right) return true;
  return new Date(left).getTime() > new Date(right).getTime();
}

function latestReviewsByTarget(reviews) {
  const map = new Map();
  for (const review of reviews || []) {
    const key = reviewIdentity(review);
    const current = map.get(key);
    if (!current || Number(review.id) > Number(current.id)) {
      map.set(key, review);
    }
  }
  return map;
}

function effectiveStatus(latestReview, targetUpdatedAt) {
  if (!latestReview) return "PENDING";
  if (laterDate(targetUpdatedAt, pick(latestReview, "created_at", "createdAt"))) {
    return "PENDING";
  }
  if (latestReview.verdict === "CORRECTION_REQUESTED") return "CORRECTION_REQUIRED";
  if (latestReview.verdict === "APPROVED") return "APPROVED";
  if (latestReview.verdict === "REJECTED") return "REJECTED";
  return "PENDING";
}

function isSupersededDocument(doc, documents) {
  const id = doc?.id;
  if (!id) return false;
  return (documents || []).some(
    (other) => pick(other, "replaces_document_id", "replacesDocumentId") === id
  );
}

function contentTargets({ responses = [], items = [], documents = [], projectId, projectType = null } = {}) {
  const schemaVersion = resolveSchemaVersion(responses);
  const values = responseMap(responses, schemaVersion);
  const context = { projectType };
  const targets = [];
  targets.push({
    targetType: "PROJECT",
    targetId: projectId != null ? String(projectId) : null,
    targetKey: null,
    schemaVersion: null,
    updatedAt: null
  });
  for (const row of responses) {
    const rowVersion = row.schema_version || row.schemaVersion || schemaVersion;
    const field = fieldByKey(row.field_key || row.fieldKey, rowVersion);
    if (!field) continue;
    if (!isApplicable(field, values, context)) continue;
    const value = row.value;
    if (!isFilled(value)) continue;
    targets.push({
      targetType: "FORM_FIELD",
      targetId: null,
      targetKey: field.key,
      schemaVersion: row.schema_version || row.schemaVersion || FORM_SCHEMA_VERSION,
      updatedAt: row.updated_at || row.updatedAt || null
    });
  }
  for (const item of items) {
    if (item.archived_at || item.archivedAt) continue;
    targets.push({
      targetType: "ITEM",
      targetId: String(item.id),
      targetKey: null,
      schemaVersion: null,
      updatedAt: item.updated_at || item.updatedAt || null
    });
  }
  for (const doc of documents) {
    if ((doc.status && doc.status !== "AVAILABLE") || doc.deleted_at || doc.deletedAt) continue;
    if (isSupersededDocument(doc, documents)) continue;
    targets.push({
      targetType: "DOCUMENT",
      targetId: String(doc.id),
      targetKey: doc.requirement_key || doc.requirementKey || null,
      schemaVersion: null,
      updatedAt: doc.stored_at || doc.storedAt || doc.created_at || doc.createdAt || null
    });
  }
  return targets;
}

function targetIdentity(target) {
  if (target.targetType === "FORM_FIELD") {
    return `FORM_FIELD:${target.schemaVersion || FORM_SCHEMA_VERSION}:${target.targetKey || ""}`;
  }
  if (target.targetType === "ITEM" || target.targetType === "DOCUMENT") {
    return `${target.targetType}:${String(target.targetId || "")}`;
  }
  return "PROJECT";
}

function buildReviewStates({
  reviews = [],
  responses = [],
  items = [],
  documents = [],
  projectId,
  projectType = null
} = {}) {
  const latest = latestReviewsByTarget(reviews);
  const targets = contentTargets({ responses, items, documents, projectId, projectType });
  return targets.map((target) => {
    const review = latest.get(targetIdentity(target)) || null;
    const status = effectiveStatus(review, target.updatedAt);
    return {
      targetType: target.targetType,
      targetId: target.targetId,
      targetKey: target.targetKey,
      schemaVersion: target.schemaVersion,
      status,
      latestReviewId: review ? review.id : null,
      verdict: review ? review.verdict : null,
      correctionMessage: review ? pick(review, "correction_message", "correctionMessage") : null,
      summary: review ? review.summary : null,
      reviewedBy: review ? pick(review, "created_by", "createdBy") : null,
      reviewedAt: review ? pick(review, "created_at", "createdAt") : null
    };
  });
}

function calculateReviewSummary(states) {
  const summary = {
    approved: 0,
    pending: 0,
    correctionRequired: 0,
    rejected: 0,
    openCorrections: 0
  };
  for (const state of states || []) {
    if (state.targetType === "PROJECT") continue;
    if (state.status === "APPROVED") summary.approved += 1;
    else if (state.status === "CORRECTION_REQUIRED") {
      summary.correctionRequired += 1;
      summary.openCorrections += 1;
    } else if (state.status === "REJECTED") summary.rejected += 1;
    else summary.pending += 1;
  }
  const project = (states || []).find((state) => state.targetType === "PROJECT");
  if (project?.status === "CORRECTION_REQUIRED") {
    summary.openCorrections += 1;
  }
  return summary;
}

function calculateReadiness({ progress, reviewSummary }) {
  const requiredPending = Number(progress?.pending || 0);
  const openCorrections = Number(reviewSummary?.openCorrections || 0);
  if (openCorrections > 0) {
    return {
      status: "CORRECTIONS_OPEN",
      label: "Correcciones pendientes",
      requiredPending,
      openCorrections,
      readyToAdvance: false
    };
  }
  if (requiredPending > 0) {
    return {
      status: "AWAITING_INFORMATION",
      label: "Pendiente de información",
      requiredPending,
      openCorrections,
      readyToAdvance: false
    };
  }
  return {
    status: "READY_FOR_REVIEW",
    label: "Listo para revisión",
    requiredPending,
    openCorrections,
    readyToAdvance: true
  };
}

function hasOpenCorrectionForTarget(states, predicate) {
  return (states || []).some((state) => state.status === "CORRECTION_REQUIRED" && predicate(state));
}

function normalizeTargetInput(input = {}) {
  const targetType = String(input.targetType || input.target_type || "PROJECT").toUpperCase();
  if (!REVIEW_TARGET_TYPES.includes(targetType)) {
    return { error: "REVIEW_TARGET_INVALID" };
  }
  return {
    targetType,
    targetId:
      input.targetId != null
        ? String(input.targetId)
        : input.target_id != null
          ? String(input.target_id)
          : null,
    targetKey: input.targetKey || input.target_key || null,
    schemaVersion: input.schemaVersion || input.schema_version || FORM_SCHEMA_VERSION
  };
}

module.exports = {
  reviewIdentity,
  latestReviewsByTarget,
  effectiveStatus,
  isSupersededDocument,
  contentTargets,
  buildReviewStates,
  calculateReviewSummary,
  calculateReadiness,
  hasOpenCorrectionForTarget,
  normalizeTargetInput,
  REVIEW_TARGET_TYPES
};
