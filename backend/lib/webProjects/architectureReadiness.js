const { PENDING_DEFINITION } = require("./constants");
const { asList, isFilled, unwrapValue, isNoAplica } = require("./formRuntime");
const { evaluateSubmissionMinimum } = require("./submitCompleteness");
const { calculateReviewSummary } = require("./reviewState");

const ARCHITECTURE_BLOCKING_FIELDS = Object.freeze([
  "company_trade_name",
  "goals_primary_success",
  "goals_objectives",
  "about_what_you_do",
  "existing_url"
]);

const IMPORTANT_FIELDS = Object.freeze([
  "primary_language",
  "sales_mode",
  "offer_kinds",
  "goals_audience",
  "brand_has_logo",
  "languages_who_translates"
]);

function pick(row, snake, camel, fallback = null) {
  if (!row) return fallback;
  if (row[snake] !== undefined && row[snake] !== null) return row[snake];
  if (row[camel] !== undefined && row[camel] !== null) return row[camel];
  return fallback;
}

function activeItems(items) {
  return (items || []).filter((item) => !item.archived_at && !item.archivedAt);
}

function itemType(item) {
  return item.item_type || item.itemType;
}

function hasOffering(items, values) {
  const visible = activeItems(items);
  const hasItem = visible.some((item) =>
    ["service", "product", "tour", "page"].includes(itemType(item))
  );
  return hasItem || isFilled(values.get("about_what_you_do"));
}

function hasObjective(values) {
  return isFilled(values.get("goals_primary_success")) || asList(values.get("goals_objectives")).length > 0;
}

function fieldCriticality(fieldKey) {
  if (ARCHITECTURE_BLOCKING_FIELDS.includes(fieldKey)) return "ARCHITECTURE_BLOCKING";
  if (IMPORTANT_FIELDS.includes(fieldKey)) return "IMPORTANT";
  return "OPTIONAL";
}

function correctionCriticality(state) {
  if (state.targetType === "FORM_FIELD") return fieldCriticality(state.targetKey);
  if (state.targetType === "ITEM") return "IMPORTANT";
  if (state.targetType === "DOCUMENT") return "OPTIONAL";
  if (state.targetType === "PROJECT") return "ARCHITECTURE_BLOCKING";
  return "OPTIONAL";
}

function displayPending(value) {
  if (!isFilled(value) || isNoAplica(value)) return PENDING_DEFINITION;
  return unwrapValue(value);
}

function openNotes(notes) {
  return (notes || []).filter((note) => (note.status || "OPEN") === "OPEN");
}

function evaluateArchitectureReadiness({
  project,
  values,
  items = [],
  notes = [],
  credential = null,
  progress = null,
  reviewStates = [],
  schemaVersion = null
} = {}) {
  const blockers = [];
  const warnings = [];
  const workflow = project.workflow_status || project.workflowStatus;
  const projectType = project.project_type || project.projectType;
  const archivedAt = project.archived_at || project.archivedAt;
  const completedAt = project.completed_at || project.completedAt;
  const reviewSummary = calculateReviewSummary(reviewStates);
  const collectionProgress = Number(progress?.percentage ?? 0);

  function addBlocker(code, label, extra = {}) {
    blockers.push({
      code,
      label,
      sourceType: extra.sourceType || "PROJECT",
      sourceKey: extra.sourceKey || null,
      sourceId: extra.sourceId || null,
      action: extra.action || null,
      criticality: extra.criticality || "ARCHITECTURE_BLOCKING"
    });
  }

  function addWarning(code, label, extra = {}) {
    warnings.push({
      code,
      label,
      sourceType: extra.sourceType || "PROJECT",
      sourceKey: extra.sourceKey || null,
      sourceId: extra.sourceId || null,
      action: extra.action || null
    });
  }

  if (archivedAt) {
    addBlocker("PROJECT_ARCHIVED", "El expediente está archivado.", {
      action: "No se puede iniciar arquitectura."
    });
  }
  if (completedAt || workflow === "COMPLETED") {
    addBlocker("PROJECT_COMPLETED", "El expediente está finalizado.", {
      action: "COMPLETED es terminal."
    });
  }
  const architectureAlreadyStarted = [
    "ARCHITECTURE",
    "MOCKUP",
    "DEVELOPMENT",
    "VALIDATION",
    "PUBLICATION"
  ].includes(workflow);
  if (workflow !== "REVIEW" && !architectureAlreadyStarted) {
    addBlocker("WORKFLOW_NOT_REVIEW", "La arquitectura se inicia desde revisión ARGOS.", {
      action: "El cliente debe enviar el cuestionario, o el NOC debe estar en REVIEW."
    });
  }

  const minimum = evaluateSubmissionMinimum({
    project,
    responses: [],
    items,
    values
  });
  if (!minimum.ok) {
    for (const error of minimum.errors) {
      addBlocker("MINIMUM_NOT_SATISFIED", error.message, {
        sourceType: "FORM_FIELD",
        sourceKey: error.fieldKey,
        action: "Completar el mínimo operativo o pedir corrección al cliente."
      });
    }
  }

  if (!hasObjective(values)) {
    addBlocker("NO_PROJECT_OBJECTIVE", "Falta el objetivo principal del proyecto.", {
      sourceType: "FORM_FIELD",
      sourceKey: "goals_primary_success",
      action: "Pedir al cliente el éxito esperado o al menos un objetivo."
    });
  }
  if (!hasOffering(items, values)) {
    addBlocker("NO_MEANINGFUL_OFFERING", "No hay oferta ni descripción operativa de qué se construye.", {
      sourceType: "FORM_FIELD",
      sourceKey: "about_what_you_do",
      action: "Añadir servicio, producto, actividad o página, o describir la actividad."
    });
  }

  const existingUrl = values.get("existing_url");
  const saysExisting = unwrapValue(values.get("has_existing_site")) === "yes";
  if (projectType === "improve" && !isFilled(existingUrl) && !project.website_hostname && !project.websiteHostname) {
    addBlocker("IMPROVE_MISSING_URL", "Un proyecto de mejora necesita la URL de la web actual.", {
      sourceType: "FORM_FIELD",
      sourceKey: "existing_url",
      action: "Pedir la dirección actual al cliente."
    });
  } else if (saysExisting && !isFilled(existingUrl)) {
    addBlocker("EXISTING_SITE_MISSING_URL", "El cliente indica que hay web actual pero no ha dado la URL.", {
      sourceType: "FORM_FIELD",
      sourceKey: "existing_url",
      action: "Pedir la dirección actual al cliente."
    });
  }

  for (const state of reviewStates || []) {
    if (state.status !== "CORRECTION_REQUIRED" && state.status !== "REJECTED") continue;
    const criticality = correctionCriticality(state);
    const label =
      state.status === "REJECTED"
        ? "Hay un elemento rechazado que debe resolverse antes de arquitectura."
        : "Hay una corrección abierta del cliente.";
    const payload = {
      sourceType: state.targetType,
      sourceKey: state.targetKey || null,
      sourceId: state.targetId || null,
      action: "Usar el mecanismo de corrección existente. No crear un segundo canal.",
      criticality
    };
    if (criticality === "ARCHITECTURE_BLOCKING" || state.status === "CORRECTION_REQUIRED") {
      addBlocker("CLIENT_CORRECTION_REQUIRED", label, payload);
    } else {
      addWarning("NON_CRITICAL_REJECTION", label, payload);
    }
  }

  for (const note of openNotes(notes)) {
    const type = note.note_type || note.noteType;
    const blocking = note.blocking === true;
    if (type === "DECISION_REQUIRED" && blocking) {
      addBlocker("UNRESOLVED_ARCHITECTURE_DECISION", "Hay una decisión interna pendiente que bloquea arquitectura.", {
        sourceType: "NOTE",
        sourceId: String(note.id),
        action: "Resolver la decisión en el brief o marcarla como no bloqueante."
      });
    } else if (type === "DECISION_REQUIRED") {
      addWarning("OPEN_DECISION", "Hay una decisión interna abierta (no bloqueante).", {
        sourceType: "NOTE",
        sourceId: String(note.id)
      });
    } else if (type === "RISK") {
      addWarning("OPEN_RISK", "Hay un riesgo interno abierto. No bloquea por sí mismo.", {
        sourceType: "NOTE",
        sourceId: String(note.id)
      });
    } else if (type === "ASSUMPTION") {
      addWarning("OPEN_ASSUMPTION", "Hay una asunción interna abierta.", {
        sourceType: "NOTE",
        sourceId: String(note.id)
      });
    }
  }

  const credStatus = pick(credential, "status", "status", "NONE") || "NONE";
  if (credStatus === "REQUESTED" || credStatus === "RECEIVED_OUT_OF_BAND") {
    addWarning("CREDENTIALS_PENDING", "Hay accesos técnicos pendientes. No bloquean la arquitectura inicial.", {
      sourceType: "CREDENTIAL"
    });
  }

  if (unwrapValue(values.get("languages_who_translates")) === "pending") {
    addWarning("TRANSLATION_OWNERSHIP_PENDING", "No está cerrado quién traduce los idiomas adicionales.", {
      sourceType: "FORM_FIELD",
      sourceKey: "languages_who_translates"
    });
  }

  void schemaVersion;
  void displayPending;

  const uniqueBlockers = dedupeIssues(blockers);
  const uniqueWarnings = dedupeIssues(warnings).filter(
    (warning) => !uniqueBlockers.some((blocker) => blocker.code === warning.code && blocker.sourceId === warning.sourceId)
  );

  let state = "READY";
  if (uniqueBlockers.length > 0) state = "NOT_READY";
  else if (uniqueWarnings.length > 0) state = "READY_WITH_OPEN_ITEMS";

  return {
    state,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    metrics: {
      collectionProgress,
      correctionRequired: reviewSummary.correctionRequired,
      pendingReview: reviewSummary.pending,
      approved: reviewSummary.approved,
      rejected: reviewSummary.rejected,
      openDecisions: openNotes(notes).filter((note) => (note.note_type || note.noteType) === "DECISION_REQUIRED")
        .length,
      openRisks: openNotes(notes).filter((note) => (note.note_type || note.noteType) === "RISK").length
    }
  };
}

function dedupeIssues(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key = `${item.code}:${item.sourceType}:${item.sourceKey || ""}:${item.sourceId || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function canStartArchitecture(readiness) {
  return readiness?.state === "READY" || readiness?.state === "READY_WITH_OPEN_ITEMS";
}

module.exports = {
  ARCHITECTURE_BLOCKING_FIELDS,
  IMPORTANT_FIELDS,
  fieldCriticality,
  evaluateArchitectureReadiness,
  canStartArchitecture,
  hasOffering,
  hasObjective
};
