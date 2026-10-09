const { BRIEF_SCHEMA_VERSION } = require("./constants");
const { looksLikeSecret } = require("./secrets");

const STRIP_KEY = /^(object_key|objectKey|sha256|password|passwd|token|secret|apiKey|api_key|private_key|signedUrl|signed_url|buffer|bytes)$/i;

function sanitizeValue(value, seen = new WeakSet()) {
  if (value == null) return value;
  if (typeof value === "string") {
    if (looksLikeSecret(value)) return "[redacted]";
    return value;
  }
  if (typeof value !== "object") return value;
  if (seen.has(value)) return null;
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, seen));
  const out = {};
  for (const [key, nested] of Object.entries(value)) {
    if (STRIP_KEY.test(key)) continue;
    out[key] = sanitizeValue(nested, seen);
  }
  return out;
}

function buildHandoffSnapshot({
  brief,
  architectureReadiness,
  createdBy,
  overrideUsed,
  overrideReason
}) {
  const safeBrief = sanitizeValue({
    header: brief.header,
    executiveSummary: brief.executiveSummary,
    scopeMatrix: brief.scopeMatrix,
    contentInventory: brief.contentInventory,
    pages: brief.pages,
    services: brief.services,
    products: brief.products,
    tours: brief.tours,
    team: brief.team,
    locations: brief.locations,
    contentGroups: brief.contentGroups,
    documents: brief.documents,
    currentWebsite: brief.currentWebsite,
    languages: brief.languages,
    sales: brief.sales,
    integrations: brief.integrations,
    legal: brief.legal,
    seo: brief.seo,
    technicalAccess: brief.technicalAccess,
    openItems: brief.openItems,
    assumptions: brief.assumptions,
    exclusions: brief.exclusions,
    risks: brief.risks,
    decisions: brief.decisions
  });
  return {
    schemaVersion: BRIEF_SCHEMA_VERSION,
    sourceFormSchema: brief.sourceFormSchema,
    createdBy: createdBy || null,
    overrideUsed: Boolean(overrideUsed),
    overrideReason: overrideReason || null,
    architectureReadiness: sanitizeValue(architectureReadiness),
    brief: safeBrief
  };
}

module.exports = { sanitizeValue, buildHandoffSnapshot };
