const {
  PENDING_DEFINITION,
  BRIEF_SCHEMA_VERSION,
  FORM_SCHEMA_VERSION_V1
} = require("./constants");
const { asList, isFilled, unwrapValue, isNoAplica } = require("./formRuntime");
const { getFormDefinition, isApplicable } = require("./formRegistry");
const { evaluateArchitectureReadiness, fieldCriticality } = require("./architectureReadiness");

function pick(row, snake, camel, fallback = null) {
  if (!row) return fallback;
  if (row[snake] !== undefined && row[snake] !== null) return row[snake];
  if (row[camel] !== undefined && row[camel] !== null) return row[camel];
  return fallback;
}

function textOf(value) {
  if (!isFilled(value) || isNoAplica(value)) return PENDING_DEFINITION;
  const raw = unwrapValue(value);
  if (Array.isArray(raw)) return raw.length ? raw.map((item) => String(item)).join(", ") : PENDING_DEFINITION;
  return String(raw);
}

function sourced(value, sourceType, sourceKey, sourceId = null) {
  return {
    value,
    pending: value === PENDING_DEFINITION,
    sourceType,
    sourceKey: sourceKey || null,
    sourceId: sourceId || null
  };
}

function fieldSource(key, values) {
  return sourced(textOf(values.get(key)), "FORM_FIELD", key);
}

function activeItems(items) {
  return (items || []).filter((item) => !item.archived_at && !item.archivedAt);
}

function itemTypeOf(item) {
  return item.item_type || item.itemType;
}

function itemPayload(item) {
  return item.payload && typeof item.payload === "object" ? item.payload : {};
}

function itemStatusOf(item) {
  return item.status || "draft";
}

function contentReadiness({ applicable, filled, partial }) {
  if (!applicable) return "NOT_APPLICABLE";
  if (filled) return "READY";
  if (partial) return "PARTIAL";
  return "MISSING";
}

function itemContentReadiness(item) {
  const payload = itemPayload(item);
  const keys = Object.keys(payload).filter((key) => isFilled(payload[key]));
  if (keys.length >= 3 && isFilled(item.title)) return "READY";
  if (isFilled(item.title) || keys.length > 0) return "PARTIAL";
  return "MISSING";
}

function reviewStatusFor(reviewStates, predicate) {
  const found = (reviewStates || []).find(predicate);
  return found?.status || "PENDING";
}

function countByType(items, type) {
  return activeItems(items).filter((item) => itemTypeOf(item) === type).length;
}

function storedDocuments(documents) {
  return (documents || []).filter((doc) => {
    if (doc.deleted_at || doc.deletedAt) return false;
    if (doc.status && doc.status !== "AVAILABLE") return false;
    return (doc.upload_status || doc.uploadStatus) === "STORED";
  });
}

function scopeRow(id, label, state, sourceKey) {
  return { id, label, state, sourceType: sourceKey ? "FORM_FIELD" : "PROJECT", sourceKey: sourceKey || null };
}

function deriveScopeMatrix(values) {
  const objectives = asList(values.get("goals_objectives"));
  const salesMode = unwrapValue(values.get("sales_mode"));
  const integrations = asList(values.get("integrations_list"));
  const multilingual = unwrapValue(values.get("languages_multilingual"));
  const ecommerce = unwrapValue(values.get("needs_ecommerce"));
  const has = (list, key) => list.includes(key);

  function fromFlag(yes) {
    if (yes === true) return "required";
    if (yes === false) return "not_required";
    return "pending_decision";
  }

  const rows = [
    scopeRow("PUBLIC_WEBSITE", "Sitio web público", "required", null),
    scopeRow(
      "CLIENT_AREA",
      "Área de cliente",
      fromFlag(has(objectives, "private_area")),
      "goals_objectives"
    ),
    scopeRow(
      "ECOMMERCE",
      "Ecommerce",
      ecommerce === "yes" || salesMode === "online_sales" || salesMode === "online_payment"
        ? "required"
        : ecommerce === "no" || salesMode === "no" || salesMode === "contact_forms" || salesMode === "catalog_only"
          ? "not_required"
          : "pending_decision",
      "needs_ecommerce"
    ),
    scopeRow(
      "BOOKING",
      "Reservas",
      salesMode === "booking_request" ||
        salesMode === "online_booking" ||
        has(objectives, "receive_bookings")
        ? "required"
        : salesMode
          ? "not_required"
          : "pending_decision",
      "sales_mode"
    ),
    scopeRow(
      "LEAD_GENERATION",
      "Captación de leads",
      has(objectives, "generate_leads") ||
        has(objectives, "quote_requests") ||
        has(objectives, "capture_calls") ||
        salesMode === "contact_forms"
        ? "required"
        : salesMode || objectives.length
          ? "not_required"
          : "pending_decision",
      "goals_objectives"
    ),
    scopeRow(
      "CATALOG",
      "Catálogo",
      has(objectives, "present_catalog") || has(asList(values.get("offer_kinds")), "products")
        ? "required"
        : "not_required",
      "offer_kinds"
    ),
    scopeRow(
      "BLOG_NEWS",
      "Blog / noticias",
      fromFlag(has(objectives, "publish_news")),
      "goals_objectives"
    ),
    scopeRow(
      "MULTILINGUAL",
      "Multidioma",
      multilingual === "yes" ? "required" : multilingual === "no" ? "not_required" : "pending_decision",
      "languages_multilingual"
    ),
    scopeRow(
      "SEO",
      "SEO",
      has(objectives, "seo") || isFilled(values.get("seo_keywords")) || isFilled(values.get("seo_markets"))
        ? "required"
        : "not_required",
      "seo_keywords"
    ),
    scopeRow("ANALYTICS", "Analítica", fromFlag(has(integrations, "analytics") || unwrapValue(values.get("seo_analytics")) === "yes"), "integrations_list"),
    scopeRow("CRM", "CRM", fromFlag(has(integrations, "crm")), "integrations_list"),
    scopeRow(
      "NEWSLETTER",
      "Newsletter",
      fromFlag(has(integrations, "newsletter") || has(integrations, "email_marketing") || unwrapValue(values.get("seo_newsletter")) === "yes"),
      "integrations_list"
    ),
    scopeRow("PAYMENTS", "Pagos", fromFlag(has(integrations, "payments") || salesMode === "online_payment"), "sales_mode"),
    scopeRow("MAPS", "Mapas", fromFlag(has(integrations, "google_maps")), "integrations_list"),
    scopeRow("SOCIAL", "Redes sociales", fromFlag(has(integrations, "social") || isFilled(values.get("seo_social"))), "integrations_list"),
    scopeRow("EXTERNAL_API", "API externa", fromFlag(has(integrations, "external_api")), "integrations_list"),
    scopeRow("OTHER", "Otros", fromFlag(has(integrations, "other")), "integrations_list")
  ];
  return rows;
}

function summarizeItems(items, type, fields, reviewStates) {
  return activeItems(items)
    .filter((item) => itemTypeOf(item) === type)
    .map((item) => {
      const payload = itemPayload(item);
      const summary = { id: item.id, title: item.title, status: itemStatusOf(item), contentReadiness: itemContentReadiness(item) };
      for (const field of fields) {
        summary[field] = isFilled(payload[field]) ? textOf(payload[field]) : PENDING_DEFINITION;
      }
      summary.reviewStatus = reviewStatusFor(
        reviewStates,
        (state) => state.targetType === "ITEM" && String(state.targetId) === String(item.id)
      );
      summary.sourceType = "ITEM";
      summary.sourceId = String(item.id);
      return summary;
    });
}

function pageIntent(payload) {
  if (payload.remove === true || payload.remove === "yes") return "remove";
  if (payload.redesign === true || payload.redesign === "yes") return "redesign";
  if (payload.keep === true || payload.keep === "yes") return "keep";
  if (payload.is_new === true || payload.is_new === "yes") return "new";
  return "new";
}

function legalReadiness(values, key) {
  const raw = unwrapValue(values.get(key));
  if (raw === "yes") return "AVAILABLE";
  if (raw === "pending") return "PARTIAL";
  if (raw === "no") return "MISSING";
  if (raw === "NO_APLICA") return "NOT_REQUIRED";
  return "UNKNOWN";
}

function buildProjectBrief({
  project,
  organization = null,
  values,
  responses = [],
  items = [],
  documents = [],
  reviews = [],
  reviewStates = [],
  reviewSummary = null,
  progress = null,
  credential = null,
  notes = [],
  schemaVersion,
  architectureReadiness = null
} = {}) {
  const definition = getFormDefinition(schemaVersion);
  const context = { projectType: project.project_type || project.projectType };
  const readiness =
    architectureReadiness ||
    evaluateArchitectureReadiness({
      project,
      values,
      items,
      notes,
      credential,
      progress,
      reviewStates,
      schemaVersion
    });

  const docs = storedDocuments(documents);
  const mediaDocs = docs.filter((doc) =>
    ["LOGO", "GRAPHIC", "TEAM", "LOCATION", "SERVICE", "PRODUCT", "TOUR", "VIDEO"].includes(
      doc.requirement_key || doc.requirementKey || ""
    )
  );
  const legalDocs = docs.filter((doc) => (doc.requirement_key || doc.requirementKey) === "LEGAL");

  const offerKinds = asList(values.get("offer_kinds"));
  const inventory = {
    pages: countByType(items, "page"),
    services: countByType(items, "service"),
    products: countByType(items, "product"),
    activities: countByType(items, "tour"),
    teamMembers: countByType(items, "team_member"),
    locations: countByType(items, "location"),
    documents: docs.length,
    media: mediaDocs.length
  };

  const currentUrl =
    textOf(values.get("existing_url")) !== PENDING_DEFINITION
      ? textOf(values.get("existing_url"))
      : project.website_hostname || project.websiteHostname || PENDING_DEFINITION;

  const summary = {
    project: project.title,
    organization: organization?.name || PENDING_DEFINITION,
    projectType: project.project_type || project.projectType,
    workflowStatus: project.workflow_status || project.workflowStatus,
    currentWebsite: currentUrl,
    primaryObjective: fieldSource("goals_primary_success", values),
    audience: fieldSource("goals_audience", values),
    businessModel: fieldSource("goals_b2b_b2c", values),
    languages: fieldSource("primary_language", values),
    mainContentTypes: sourced(
      offerKinds.length ? offerKinds.join(", ") : PENDING_DEFINITION,
      "FORM_FIELD",
      "offer_kinds"
    ),
    salesRequirement: fieldSource("sales_mode", values),
    keyIntegrations: fieldSource("integrations_list", values),
    collectionProgress: Number(progress?.percentage ?? 0),
    reviewStatus: reviewSummary,
    architectureReadiness: readiness.state
  };

  const contentGroups = [
    {
      id: "company",
      label: "Descripción de empresa",
      status: contentReadiness({
        applicable: true,
        filled: isFilled(values.get("about_what_you_do")) && isFilled(values.get("company_trade_name")),
        partial: isFilled(values.get("company_trade_name")) || isFilled(values.get("about_what_you_do"))
      })
    },
    {
      id: "brand",
      label: "Activos de marca",
      status: contentReadiness({
        applicable: true,
        filled: unwrapValue(values.get("brand_has_logo")) === "yes" && docs.some((doc) => (doc.requirement_key || doc.requirementKey) === "LOGO"),
        partial: unwrapValue(values.get("brand_has_logo")) === "yes" || isFilled(values.get("brand_colors"))
      })
    },
    {
      id: "services",
      label: "Servicios",
      status: contentReadiness({
        applicable: offerKinds.length === 0 || offerKinds.includes("services"),
        filled: inventory.services > 0,
        partial: false
      })
    },
    {
      id: "products",
      label: "Productos",
      status: contentReadiness({
        applicable: offerKinds.includes("products"),
        filled: inventory.products > 0,
        partial: false
      })
    },
    {
      id: "tours",
      label: "Actividades",
      status: contentReadiness({
        applicable: offerKinds.includes("experiences"),
        filled: inventory.activities > 0,
        partial: false
      })
    },
    {
      id: "team",
      label: "Equipo",
      status: contentReadiness({
        applicable: true,
        filled: inventory.teamMembers > 0,
        partial: isFilled(values.get("about_who"))
      })
    },
    {
      id: "locations",
      label: "Ubicaciones",
      status: contentReadiness({
        applicable: unwrapValue(values.get("company_multiple_locations")) === "yes",
        filled: inventory.locations > 0,
        partial: false
      })
    },
    {
      id: "photos",
      label: "Fotos",
      status: contentReadiness({
        applicable: unwrapValue(values.get("media_has_photos")) !== "no",
        filled: unwrapValue(values.get("media_has_photos")) === "yes" && mediaDocs.length > 0,
        partial: unwrapValue(values.get("media_has_photos")) === "yes"
      })
    },
    {
      id: "legal",
      label: "Textos legales",
      status: contentReadiness({
        applicable: true,
        filled: ["legal_notice", "legal_privacy", "legal_cookies"].every((key) => unwrapValue(values.get(key)) === "yes") || legalDocs.length > 0,
        partial: ["legal_notice", "legal_privacy", "legal_cookies"].some((key) => isFilled(values.get(key)))
      })
    },
    {
      id: "seo",
      label: "Input SEO",
      status: contentReadiness({
        applicable: true,
        filled: isFilled(values.get("seo_keywords")) || isFilled(values.get("seo_markets")),
        partial: isFilled(values.get("seo_audience")) || isFilled(values.get("seo_priority_offer"))
      })
    },
    {
      id: "translations",
      label: "Traducciones",
      status: contentReadiness({
        applicable: unwrapValue(values.get("languages_multilingual")) === "yes",
        filled: isFilled(values.get("languages_list")) && unwrapValue(values.get("languages_who_translates")) && unwrapValue(values.get("languages_who_translates")) !== "pending",
        partial: isFilled(values.get("languages_list"))
      })
    }
  ];

  const pages = activeItems(items)
    .filter((item) => itemTypeOf(item) === "page")
    .map((item) => {
      const payload = itemPayload(item);
      return {
        id: item.id,
        title: item.title,
        purpose: textOf(payload.purpose || payload.summary),
        intent: pageIntent(payload),
        parent: textOf(payload.parent_page),
        cta: textOf(payload.cta),
        seoPriority: textOf(payload.seo_priority),
        contentReadiness: itemContentReadiness(item),
        reviewStatus: reviewStatusFor(
          reviewStates,
          (state) => state.targetType === "ITEM" && String(state.targetId) === String(item.id)
        ),
        sourceType: "ITEM",
        sourceId: String(item.id)
      };
    });

  const openItems = [
    ...readiness.blockers.map((blocker) => ({ kind: "blocker", ...blocker })),
    ...readiness.warnings.map((warning) => ({ kind: "warning", ...warning }))
  ];

  const notesByType = (type) =>
    (notes || []).filter((note) => (note.note_type || note.noteType) === type).map(serializeNotePublic);

  return {
    schemaVersion: BRIEF_SCHEMA_VERSION,
    sourceFormSchema: schemaVersion,
    header: {
      title: project.title,
      organizationName: organization?.name || null,
      organizationId: project.organization_id || project.organizationId,
      projectType: project.project_type || project.projectType,
      workflowStatus: project.workflow_status || project.workflowStatus,
      collectionPercentage: Number(progress?.percentage ?? 0),
      reviewSummary: reviewSummary,
      architectureReadiness: readiness.state,
      archived: Boolean(project.archived_at || project.archivedAt),
      completed: Boolean(project.completed_at || project.completedAt)
    },
    executiveSummary: summary,
    scopeMatrix: deriveScopeMatrix(values),
    contentInventory: inventory,
    pages,
    services: summarizeItems(items, "service", ["audience", "benefits", "cta", "show_price"], reviewStates),
    products: summarizeItems(items, "product", ["category", "price", "stock", "shipping"], reviewStates),
    tours: summarizeItems(
      items,
      "tour",
      ["destination", "price_adult", "availability", "meeting_point", "cancellation"],
      reviewStates
    ),
    team: summarizeItems(items, "team_member", ["role", "specialty"], reviewStates),
    locations: summarizeItems(items, "location", ["city", "address"], reviewStates),
    contentGroups,
    documents: docs.map((doc) => ({
      id: doc.id,
      name: doc.original_filename || doc.originalFilename,
      category: doc.requirement_key || doc.requirementKey || "OTHER",
      uploadStatus: doc.upload_status || doc.uploadStatus,
      replacesDocumentId: doc.replaces_document_id || doc.replacesDocumentId || null,
      reviewStatus: reviewStatusFor(
        reviewStates,
        (state) => state.targetType === "DOCUMENT" && String(state.targetId) === String(doc.id)
      ),
      sourceType: "DOCUMENT",
      sourceId: String(doc.id)
    })),
    currentWebsite: {
      applicable:
        (project.project_type || project.projectType) === "improve" ||
        unwrapValue(values.get("has_existing_site")) === "yes",
      url: sourced(currentUrl === PENDING_DEFINITION ? PENDING_DEFINITION : currentUrl, "FORM_FIELD", "existing_url"),
      keep: fieldSource("current_keep", values),
      remove: fieldSource("current_remove", values),
      migrate: fieldSource("current_migrate", values),
      cms: fieldSource("cms", values)
    },
    languages: {
      primary: fieldSource("primary_language", values),
      multilingual: fieldSource("languages_multilingual", values),
      additional: fieldSource("languages_list", values),
      translationSource: fieldSource("languages_who_translates", values),
      validator: fieldSource("languages_who_validates", values),
      contentDifferences: fieldSource("languages_varies", values)
    },
    sales: {
      mode: fieldSource("sales_mode", values),
      ecommerce: fieldSource("needs_ecommerce", values),
      what: fieldSource("sales_what", values),
      payments: fieldSource("sales_payments", values)
    },
    integrations: {
      list: fieldSource("integrations_list", values),
      details: fieldSource("integrations_details", values)
    },
    legal: {
      notice: legalReadiness(values, "legal_notice"),
      privacy: legalReadiness(values, "legal_privacy"),
      cookies: legalReadiness(values, "legal_cookies"),
      contract: legalReadiness(values, "legal_contract"),
      disclaimer: "ARGOS no certifica cumplimiento legal."
    },
    seo: {
      markets: fieldSource("seo_markets", values),
      locations: fieldSource("seo_geo", values),
      priorityOfferings: fieldSource("seo_priority_offer", values),
      keywords: fieldSource("seo_keywords", values),
      competitors: fieldSource("seo_competitors", values),
      analytics: fieldSource("seo_analytics", values),
      searchConsole: fieldSource("seo_search_console", values),
      campaigns: fieldSource("seo_campaigns", values),
      disclaimer: "Recopilación de contexto. Sin promesas de posicionamiento."
    },
    technicalAccess: {
      needed: asList(values.get("access_needed")),
      statuses: [
        { service: "domain", status: textOf(values.get("access_status_domain")) },
        { service: "hosting", status: textOf(values.get("access_status_hosting")) },
        { service: "cms", status: textOf(values.get("access_status_cms")) },
        { service: "project", status: pick(credential, "status", "status", "NONE") || "NONE" }
      ]
    },
    approved: (reviewStates || []).filter((state) => state.status === "APPROVED" && state.targetType !== "PROJECT").map((state) => ({
      sourceType: state.targetType,
      sourceKey: state.targetKey,
      sourceId: state.targetId
    })),
    corrections: (reviewStates || []).filter((state) => state.status === "CORRECTION_REQUIRED"),
    openItems,
    assumptions: notesByType("ASSUMPTION"),
    exclusions: notesByType("EXCLUSION"),
    risks: notesByType("RISK"),
    decisions: notesByType("DECISION_REQUIRED"),
    architectureNotes: notesByType("ARCHITECTURE_NOTE"),
    architectureReadiness: readiness,
    v1Limited: schemaVersion === FORM_SCHEMA_VERSION_V1,
    applicableFieldCount: (definition.fields || []).filter((field) => isApplicable(field, values, context)).length,
    criticalityExample: fieldCriticality("company_trade_name")
  };
}

function serializeNotePublic(note) {
  return {
    id: note.id,
    noteType: note.note_type || note.noteType,
    content: note.content,
    status: note.status,
    blocking: Boolean(note.blocking),
    severity: note.severity || null,
    resolutionNote: note.resolution_note || note.resolutionNote || null,
    createdBy: note.created_by || note.createdBy || null,
    createdAt: note.created_at || note.createdAt,
    updatedAt: note.updated_at || note.updatedAt,
    resolvedAt: note.resolved_at || note.resolvedAt || null
  };
}

module.exports = {
  PENDING_DEFINITION,
  buildProjectBrief,
  deriveScopeMatrix,
  serializeNotePublic,
  textOf
};
