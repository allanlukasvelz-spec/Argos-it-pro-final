const { getFormDefinition, resolveSchemaVersion, responseMap, isApplicable, isNoAplica, isFilled } =
  require("./formRegistry");
const { latestReviewsByTarget, effectiveStatus } = require("./reviewState");

function fieldUnitsForDefinition(definition, values, context, units, notApplicableRef) {
  for (const field of definition.fields || []) {
    if (!field.required) continue;
    const value = values.get(field.key);
    if (!isApplicable(field, values, context) || isNoAplica(value)) {
      notApplicableRef.count += 1;
      continue;
    }
    units.push({
      kind: "field",
      key: field.key,
      section: field.section || null,
      done: isFilled(value)
    });
  }
}

function documentUnitsForDefinition(definition, values, documents, context, units, notApplicableRef) {
  for (const docReq of definition.requiredDocuments || []) {
    if (docReq.requiredIf && !isApplicable({ requiredIf: docReq.requiredIf }, values, context)) {
      notApplicableRef.count += 1;
      continue;
    }
    const present = (documents || []).some((doc) => {
      const available = doc.status === "AVAILABLE";
      const stored = (doc.upload_status || doc.uploadStatus) === "STORED";
      const key = doc.requirement_key || doc.requirementKey;
      return available && stored && key === docReq.key;
    });
    units.push({
      kind: "document",
      key: docReq.key,
      section: docReq.section || null,
      done: Boolean(present)
    });
  }
}

/**
 * Derived progress. Never persisted as a mutable percentage.
 * Hidden/NO_APLICA fields are excluded from the denominator.
 * Recommended/optional fields never block this collection %.
 */
function calculateProgress({
  responses = [],
  documents = [],
  reviews = [],
  items = [],
  workflowStatus = "INTAKE",
  projectType = null,
  schemaVersion = null
} = {}) {
  const version = schemaVersion || resolveSchemaVersion(responses);
  const definition = getFormDefinition(version);
  const values = responseMap(responses, version);
  const context = { projectType };
  const units = [];
  const notApplicableRef = { count: 0 };

  fieldUnitsForDefinition(definition, values, context, units, notApplicableRef);
  documentUnitsForDefinition(definition, values, documents, context, units, notApplicableRef);

  const reviewRequired = ["VALIDATION", "PUBLICATION", "COMPLETED"].includes(workflowStatus);
  if (reviewRequired) {
    const latest = latestReviewsByTarget(reviews).get("PROJECT");
    const status = effectiveStatus(latest, null);
    units.push({
      kind: "review",
      key: "delivery_review",
      section: null,
      done: status === "APPROVED"
    });
  }

  const itemSections = (items || []).filter((item) => !item.archived_at && !item.archivedAt);
  if (itemSections.length > 0) {
    const ready = itemSections.filter((item) => item.status === "ready" || item.status === "done");
    units.push({
      kind: "items",
      key: "repeatable_items",
      section: "offer",
      done: ready.length === itemSections.length
    });
  }

  const required = units.length;
  const completed = units.filter((unit) => unit.done).length;
  const pending = required - completed;
  const ratio = required === 0 ? 0 : completed / required;
  return {
    required,
    completed,
    notApplicable: notApplicableRef.count,
    pending,
    percentage: required === 0 ? 0 : Math.round(ratio * 100),
    ratio,
    total: required,
    units
  };
}

function sectionStatus({ required, completed, correction }) {
  if (correction) return "correction";
  if (required === 0) return "optional";
  if (completed === 0) return "empty";
  if (completed >= required) return "complete";
  return "partial";
}

function calculateSectionProgress({
  responses = [],
  documents = [],
  items = [],
  reviews = [],
  projectType = null,
  schemaVersion = null,
  reviewStates = []
} = {}) {
  const version = schemaVersion || resolveSchemaVersion(responses);
  const definition = getFormDefinition(version);
  const values = responseMap(responses, version);
  const context = { projectType };
  const visibleItems = (items || []).filter((item) => !item.archived_at && !item.archivedAt);

  const sections = (definition.sections || []).map((section) => {
    const hidden = !isApplicable(section, values, context);
    const fields = (definition.fields || []).filter((field) => field.section === section.id);
    const requiredFields = fields.filter((field) => field.required);
    let required = 0;
    let completed = 0;
    let notApplicable = 0;
    if (!hidden) {
      for (const field of requiredFields) {
        const value = values.get(field.key);
        if (!isApplicable(field, values, context) || isNoAplica(value)) {
          notApplicable += 1;
          continue;
        }
        required += 1;
        if (isFilled(value)) completed += 1;
      }
      for (const docReq of definition.requiredDocuments || []) {
        if ((docReq.section || null) !== section.id) continue;
        if (docReq.requiredIf && !isApplicable({ requiredIf: docReq.requiredIf }, values, context)) {
          notApplicable += 1;
          continue;
        }
        required += 1;
        const present = (documents || []).some((doc) => {
          const available = doc.status === "AVAILABLE";
          const stored = (doc.upload_status || doc.uploadStatus) === "STORED";
          const key = doc.requirement_key || doc.requirementKey;
          return available && stored && key === docReq.key;
        });
        if (present) completed += 1;
      }
    }
    const fieldKeys = new Set(fields.map((field) => field.key));
    const bindings = (definition.itemBindings || []).filter((bind) => bind.section === section.id);
    const itemTypes = new Set(bindings.map((bind) => bind.itemType));
    const correction = (reviewStates || []).some((state) => {
      if (state.status !== "CORRECTION_REQUIRED") return false;
      if (state.targetType === "FORM_FIELD" && fieldKeys.has(state.targetKey)) return true;
      if (state.targetType === "ITEM") {
        const item = visibleItems.find((row) => String(row.id) === String(state.targetId));
        return item && itemTypes.has(item.item_type || item.itemType);
      }
      return false;
    });
    const percentage = hidden || required === 0 ? 0 : Math.round((completed / required) * 100);
    return {
      id: section.id,
      order: section.order,
      label: section.label,
      hidden,
      required,
      completed,
      notApplicable,
      pending: Math.max(0, required - completed),
      percentage: hidden ? 0 : percentage,
      status: hidden ? "hidden" : sectionStatus({ required, completed, correction }),
      correction
    };
  });

  void reviews;
  return sections;
}

module.exports = { calculateProgress, calculateSectionProgress };
