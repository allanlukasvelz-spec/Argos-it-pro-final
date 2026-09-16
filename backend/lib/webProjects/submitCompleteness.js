const { ERROR_CODES } = require("./constants");
const { WebProjectError } = require("./errors");
const { asList, isFilled, unwrapValue } = require("./formRuntime");

const CONTENT_ITEM_TYPES = new Set(["service", "product", "tour", "page"]);

function evaluateSubmissionMinimum({ project, responses, items, values }) {
  const errors = [];
  const projectType = project.project_type || project.projectType;

  if (!isFilled(values.get("company_trade_name"))) {
    errors.push({
      fieldKey: "company_trade_name",
      section: "company",
      message: "Indica el nombre comercial."
    });
  }
  if (!isFilled(values.get("goals_primary_success")) && asList(values.get("goals_objectives")).length === 0) {
    errors.push({
      fieldKey: "goals_primary_success",
      section: "goals",
      message: "Cuéntanos el principal éxito que buscas o marca al menos un objetivo."
    });
  }

  const visibleItems = (items || []).filter((item) => !item.archived_at && !item.archivedAt);
  const hasOfferItem = visibleItems.some((item) => CONTENT_ITEM_TYPES.has(item.item_type || item.itemType));
  const hasAbout = isFilled(values.get("about_what_you_do"));
  if (!hasOfferItem && !hasAbout) {
    errors.push({
      fieldKey: "about_what_you_do",
      section: "about",
      message: "Describe qué hacéis o añade al menos un servicio, producto, actividad o página."
    });
  }

  if (projectType === "improve" || unwrapValue(values.get("has_existing_site")) === "yes") {
    if (!isFilled(values.get("existing_url"))) {
      errors.push({
        fieldKey: "existing_url",
        section: "current_site",
        message: "Indica la dirección de la web actual."
      });
    }
  }

  for (const fieldKey of ["confirm_reviewed", "confirm_use_material", "confirm_authorization"]) {
    if (unwrapValue(values.get(fieldKey)) !== "yes") {
      errors.push({
        fieldKey,
        section: "review",
        message: "Confirma las casillas de la revisión final antes de enviar."
      });
    }
  }

  void responses;
  return {
    ok: errors.length === 0,
    errors
  };
}

function assertSubmissionMinimum(input) {
  const result = evaluateSubmissionMinimum(input);
  if (!result.ok) {
    const first = result.errors[0];
    throw new WebProjectError(
      409,
      ERROR_CODES.INCOMPLETE_SUBMISSION,
      first?.message || "Falta información mínima para enviar a revisión"
    );
  }
  return result;
}

module.exports = {
  evaluateSubmissionMinimum,
  assertSubmissionMinimum,
  CONTENT_ITEM_TYPES
};
