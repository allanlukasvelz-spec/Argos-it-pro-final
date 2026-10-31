const { FORM_SCHEMA_VERSION, FORM_SCHEMA_VERSION_V1, FORM_SCHEMA_VERSION_V2 } = require("./constants");
const { WEB_PROJECT_FORM_V1 } = require("./formDefinitionV1");
const { WEB_PROJECT_FORM_V2 } = require("./formDefinitionV2");
const runtime = require("./formRuntime");

const DEFINITIONS = Object.freeze({
  [FORM_SCHEMA_VERSION_V1]: WEB_PROJECT_FORM_V1,
  [FORM_SCHEMA_VERSION_V2]: WEB_PROJECT_FORM_V2
});

function isKnownSchemaVersion(version) {
  return Boolean(DEFINITIONS[version]);
}

function getFormDefinition(version) {
  return DEFINITIONS[version] || DEFINITIONS[FORM_SCHEMA_VERSION];
}

function resolveSchemaVersion(responses, fallback = FORM_SCHEMA_VERSION) {
  const versions = new Set();
  for (const row of responses || []) {
    const version = row.schema_version || row.schemaVersion;
    if (version) versions.add(version);
  }
  if (versions.has(FORM_SCHEMA_VERSION_V1) && !versions.has(FORM_SCHEMA_VERSION_V2)) {
    return FORM_SCHEMA_VERSION_V1;
  }
  if (versions.has(FORM_SCHEMA_VERSION_V2)) return FORM_SCHEMA_VERSION_V2;
  if (versions.size === 1) {
    const only = [...versions][0];
    if (DEFINITIONS[only]) return only;
  }
  return fallback;
}

function fieldByKey(key, version) {
  const definition = getFormDefinition(version);
  return (definition.fields || []).find((field) => field.key === key);
}

function responseMap(responses, version) {
  const schemaVersion = version || resolveSchemaVersion(responses);
  return runtime.responseMap(responses, schemaVersion);
}

function publicFormDefinition(version) {
  const definition = getFormDefinition(version);
  return {
    version: definition.version,
    sections: definition.sections || [],
    fields: definition.fields,
    requiredDocuments: definition.requiredDocuments || [],
    documentCategories: definition.documentCategories || [],
    itemBindings: definition.itemBindings || []
  };
}

module.exports = {
  DEFINITIONS,
  isKnownSchemaVersion,
  getFormDefinition,
  resolveSchemaVersion,
  fieldByKey,
  responseMap,
  publicFormDefinition,
  unwrapValue: runtime.unwrapValue,
  asList: runtime.asList,
  isApplicable: runtime.isApplicable,
  isNoAplica: runtime.isNoAplica,
  isFilled: runtime.isFilled,
  isValidUrlValue: runtime.isValidUrlValue,
  isValidEmailValue: runtime.isValidEmailValue,
  isValidPhoneValue: runtime.isValidPhoneValue,
  isValidDateValue: runtime.isValidDateValue,
  isValidNumberValue: runtime.isValidNumberValue
};
