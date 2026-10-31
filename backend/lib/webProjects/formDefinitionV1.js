const { FORM_SCHEMA_VERSION_V1, NO_APLICA } = require("./constants");
const {
  unwrapValue,
  isApplicable,
  isNoAplica,
  isFilled,
  isValidUrlValue,
  responseMap: responseMapForVersion
} = require("./formRuntime");

/**
 * Versioned FORM DEFINITION v1 (not responses).
 * Conditional applicability lives here — not in React.
 * Product-generic: no client-specific entity names.
 */
const WEB_PROJECT_FORM_V1 = Object.freeze({
  version: FORM_SCHEMA_VERSION_V1,
  sections: [],
  fields: [
    {
      key: "site_kind",
      section: "goals",
      type: "enum",
      required: true,
      options: ["corporate", "landing", "microsite", "ecommerce", "other"]
    },
    {
      key: "has_existing_site",
      section: "company",
      type: "enum",
      required: true,
      options: ["yes", "no", NO_APLICA]
    },
    {
      key: "existing_url",
      section: "current_site",
      type: "url",
      required: true,
      applicableIf: { field: "has_existing_site", equals: "yes" }
    },
    {
      key: "cms",
      section: "current_site",
      type: "enum",
      required: true,
      options: ["wordpress", "other", "unknown", NO_APLICA]
    },
    {
      key: "primary_language",
      section: "languages",
      type: "text",
      required: true
    },
    {
      key: "needs_ecommerce",
      section: "sales",
      type: "enum",
      required: true,
      options: ["yes", "no", NO_APLICA]
    },
    {
      key: "notes",
      section: "review",
      type: "text",
      required: false
    }
  ],
  requiredDocuments: [
    {
      key: "brief",
      requiredIf: { field: "has_existing_site", equals: "yes" }
    }
  ],
  itemBindings: []
});

function fieldByKey(key) {
  return WEB_PROJECT_FORM_V1.fields.find((field) => field.key === key);
}

function responseMap(responses) {
  return responseMapForVersion(responses, FORM_SCHEMA_VERSION_V1);
}

module.exports = {
  WEB_PROJECT_FORM_V1,
  fieldByKey,
  responseMap,
  unwrapValue,
  isApplicable,
  isNoAplica,
  isFilled,
  isValidUrlValue
};
