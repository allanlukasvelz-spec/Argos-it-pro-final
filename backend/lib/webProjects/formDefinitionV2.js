const { FORM_SCHEMA_VERSION_V2, NO_APLICA, CREDENTIAL_STATUSES, DOCUMENT_CATEGORIES } = require("./constants");

const YES_NO = Object.freeze(["yes", "no"]);
const YES_NO_NA = Object.freeze(["yes", "no", NO_APLICA]);
const YES_NO_PENDING = Object.freeze(["yes", "no", "pending"]);
const EXISTING_SITE = { any: [{ projectType: { equals: "improve" } }, { field: "has_existing_site", equals: "yes" }] };

function f(partial) {
  return Object.freeze({
    required: false,
    importance: partial.required ? "required" : partial.importance || "optional",
    reviewable: true,
    sensitive: false,
    ...partial
  });
}

const WEB_PROJECT_FORM_SECTIONS_V2 = Object.freeze([
  Object.freeze({
    id: "company",
    order: 1,
    label: "Tu empresa",
    description: "Identidad administrativa y comercial. No hace falta tener sociedad."
  }),
  Object.freeze({
    id: "brand",
    order: 2,
    label: "Tu marca",
    description: "Identidad visual y verbal. Los archivos van como documentos, no en el texto."
  }),
  Object.freeze({
    id: "about",
    order: 3,
    label: "Sobre vosotros",
    description: "Historia, equipo y lo que os diferencia."
  }),
  Object.freeze({
    id: "goals",
    order: 4,
    label: "Objetivos",
    description: "Qué quieres conseguir con este proyecto. Una fecha objetivo no es un compromiso de ARGOS."
  }),
  Object.freeze({
    id: "offer",
    order: 5,
    label: "Servicios y productos",
    description: "Añade fichas repetibles. No intentes meter el catálogo entero en un recuadro."
  }),
  Object.freeze({
    id: "content",
    order: 6,
    label: "Contenido",
    description: "Textos, catálogos y materiales que ya tienes o que habrá que preparar."
  }),
  Object.freeze({
    id: "media",
    order: 7,
    label: "Fotos y vídeos",
    description: "Fotografías y enlaces de vídeo. No subas archivos MP4; usa un enlace de YouTube, Vimeo o Drive."
  }),
  Object.freeze({
    id: "current_site",
    order: 8,
    label: "Web actual",
    description: "Qué conservar, qué mejorar y qué dejar atrás.",
    applicableIf: EXISTING_SITE
  }),
  Object.freeze({
    id: "references",
    order: 9,
    label: "Referencias",
    description: "Webs que te gustan, las que no, y referentes del sector."
  }),
  Object.freeze({
    id: "languages",
    order: 10,
    label: "Idiomas",
    description: "Idioma principal y, si hay más, quién traduce y quién valida."
  }),
  Object.freeze({
    id: "sales",
    order: 11,
    label: "Reservas y ventas",
    description: "Solo requisitos. ARGOS no construye aquí el motor de reservas ni la tienda."
  }),
  Object.freeze({
    id: "integrations",
    order: 12,
    label: "Integraciones",
    description: "Sistemas que la web debería conectar. No escribas tokens ni claves."
  }),
  Object.freeze({
    id: "legal",
    order: 13,
    label: "Información legal",
    description:
      "Si no dispones de estos textos, indícalo. ARGOS podrá señalar qué piezas son necesarias, pero la validación jurídica corresponde al cliente o a su asesor."
  }),
  Object.freeze({
    id: "seo",
    order: 14,
    label: "SEO y marketing",
    description: "Recopilamos contexto. No prometemos posiciones en buscadores."
  }),
  Object.freeze({
    id: "access",
    order: 15,
    label: "Accesos técnicos",
    description:
      "No escribas contraseñas aquí. ARGOS te indicará un canal seguro cuando necesitemos recibir un acceso."
  }),
  Object.freeze({
    id: "review",
    order: 16,
    label: "Revisión final",
    description: "Revisa el resumen y envía la información a ARGOS para revisión."
  })
]);

const WEB_PROJECT_FORM_FIELDS_V2 = Object.freeze([
  f({ key: "company_trade_name", section: "company", type: "text", required: true }),
  f({ key: "company_legal_name", section: "company", type: "text", importance: "recommended" }),
  f({ key: "company_tax_id", section: "company", type: "text" }),
  f({
    key: "company_entity_type",
    section: "company",
    type: "enum",
    required: true,
    options: ["company", "freelance", "association", "foundation", "professional", "other"]
  }),
  f({ key: "company_address", section: "company", type: "text" }),
  f({ key: "company_postal_code", section: "company", type: "text" }),
  f({ key: "company_city", section: "company", type: "text", required: true }),
  f({ key: "company_province", section: "company", type: "text" }),
  f({ key: "company_country", section: "company", type: "text", required: true }),
  f({ key: "company_phone", section: "company", type: "phone", required: true }),
  f({ key: "company_email", section: "company", type: "email", required: true }),
  f({ key: "company_email_sales", section: "company", type: "email" }),
  f({ key: "company_contact_name", section: "company", type: "text", required: true }),
  f({ key: "company_contact_role", section: "company", type: "text" }),
  f({ key: "company_contact_phone", section: "company", type: "phone" }),
  f({ key: "company_contact_email", section: "company", type: "email" }),
  f({ key: "company_founded_year", section: "company", type: "text" }),
  f({ key: "company_geo_scope", section: "company", type: "text" }),
  f({
    key: "company_multiple_locations",
    section: "company",
    type: "enum",
    required: true,
    options: YES_NO
  }),
  f({
    key: "has_existing_site",
    section: "company",
    type: "enum",
    required: true,
    options: YES_NO_NA
  }),

  f({ key: "brand_has_logo", section: "brand", type: "enum", required: true, options: YES_NO }),
  f({ key: "brand_has_manual", section: "brand", type: "enum", required: true, options: YES_NO }),
  f({ key: "brand_colors", section: "brand", type: "text", importance: "recommended" }),
  f({ key: "brand_fonts", section: "brand", type: "text" }),
  f({ key: "brand_claim", section: "brand", type: "text" }),
  f({ key: "brand_tone", section: "brand", type: "text", importance: "recommended" }),
  f({ key: "brand_attributes", section: "brand", type: "text" }),
  f({ key: "brand_styles_prefer", section: "brand", type: "text" }),
  f({ key: "brand_styles_avoid", section: "brand", type: "text" }),
  f({ key: "brand_visual_refs", section: "brand", type: "text" }),

  f({ key: "about_history", section: "about", type: "text", importance: "recommended" }),
  f({ key: "about_who", section: "about", type: "text", required: true }),
  f({ key: "about_what_you_do", section: "about", type: "text", required: true }),
  f({ key: "about_mission", section: "about", type: "text" }),
  f({ key: "about_vision", section: "about", type: "text" }),
  f({ key: "about_values", section: "about", type: "text" }),
  f({ key: "about_differentiation", section: "about", type: "text", importance: "recommended" }),
  f({ key: "about_why_choose", section: "about", type: "text" }),
  f({ key: "about_strengths", section: "about", type: "text" }),
  f({ key: "about_specialty", section: "about", type: "text" }),
  f({ key: "about_certifications", section: "about", type: "text" }),
  f({ key: "about_milestones", section: "about", type: "text" }),
  f({ key: "about_awards", section: "about", type: "text" }),

  f({
    key: "goals_objectives",
    section: "goals",
    type: "multi_enum",
    required: true,
    options: [
      "professional_presence",
      "renew_existing",
      "generate_leads",
      "sell_online",
      "receive_bookings",
      "quote_requests",
      "capture_calls",
      "brand_image",
      "seo",
      "present_services",
      "present_catalog",
      "hire_talent",
      "publish_news",
      "private_area",
      "other"
    ]
  }),
  f({ key: "goals_primary_success", section: "goals", type: "text", required: true }),
  f({ key: "goals_audience", section: "goals", type: "text", importance: "recommended" }),
  f({ key: "goals_current_clients", section: "goals", type: "text" }),
  f({ key: "goals_desired_clients", section: "goals", type: "text" }),
  f({ key: "goals_markets", section: "goals", type: "text" }),
  f({
    key: "goals_b2b_b2c",
    section: "goals",
    type: "enum",
    required: true,
    options: ["b2b", "b2c", "both"]
  }),
  f({ key: "goals_problems", section: "goals", type: "text", importance: "recommended" }),
  f({
    key: "goals_priority",
    section: "goals",
    type: "enum",
    required: true,
    options: ["urgent", "high", "normal", "flexible"]
  }),
  f({ key: "goals_target_date", section: "goals", type: "date" }),
  f({
    key: "site_kind",
    section: "goals",
    type: "enum",
    importance: "recommended",
    options: ["corporate", "landing", "microsite", "ecommerce", "other"]
  }),

  f({
    key: "offer_kinds",
    section: "offer",
    type: "multi_enum",
    required: true,
    options: ["services", "products", "experiences", "other"]
  }),

  f({ key: "content_has_texts", section: "content", type: "enum", required: true, options: YES_NO }),
  f({
    key: "content_reuse_current",
    section: "content",
    type: "enum",
    options: YES_NO_NA,
    applicableIf: EXISTING_SITE
  }),
  f({ key: "content_needs_copy", section: "content", type: "enum", required: true, options: YES_NO }),
  f({ key: "content_has_catalogs", section: "content", type: "enum", options: YES_NO_NA }),
  f({ key: "content_has_prices", section: "content", type: "enum", options: YES_NO_NA }),
  f({ key: "content_has_dossiers", section: "content", type: "enum", options: YES_NO_NA }),
  f({ key: "content_has_presentations", section: "content", type: "enum", options: YES_NO_NA }),
  f({ key: "content_has_faqs", section: "content", type: "enum", options: YES_NO_NA }),
  f({ key: "content_has_testimonials", section: "content", type: "enum", options: YES_NO_NA }),
  f({ key: "content_has_cases", section: "content", type: "enum", options: YES_NO_NA }),

  f({ key: "media_has_photos", section: "media", type: "enum", required: true, options: YES_NO }),
  f({ key: "media_has_videos", section: "media", type: "enum", required: true, options: YES_NO }),
  f({ key: "media_needs_production", section: "media", type: "enum", required: true, options: YES_NO }),
  f({ key: "media_commercial_rights", section: "media", type: "enum", required: true, options: YES_NO_PENDING }),
  f({
    key: "media_people_consent",
    section: "media",
    type: "enum",
    options: YES_NO_NA,
    applicableIf: { field: "media_has_photos", equals: "yes" }
  }),
  f({
    key: "media_video_url",
    section: "media",
    type: "video_url",
    applicableIf: { field: "media_has_videos", equals: "yes" }
  }),

  f({
    key: "existing_url",
    section: "current_site",
    type: "url",
    required: true,
    applicableIf: { field: "has_existing_site", equals: "yes" }
  }),
  f({
    key: "current_works",
    section: "current_site",
    type: "text",
    importance: "recommended",
    applicableIf: EXISTING_SITE
  }),
  f({
    key: "current_fails",
    section: "current_site",
    type: "text",
    importance: "recommended",
    applicableIf: EXISTING_SITE
  }),
  f({ key: "current_keep", section: "current_site", type: "text", applicableIf: EXISTING_SITE }),
  f({ key: "current_remove", section: "current_site", type: "text", applicableIf: EXISTING_SITE }),
  f({ key: "current_must_pages", section: "current_site", type: "text", applicableIf: EXISTING_SITE }),
  f({ key: "current_migrate", section: "current_site", type: "text", applicableIf: EXISTING_SITE }),
  f({ key: "current_features", section: "current_site", type: "text", applicableIf: EXISTING_SITE }),
  f({
    key: "cms",
    section: "current_site",
    type: "enum",
    options: ["wordpress", "other", "unknown", NO_APLICA],
    applicableIf: EXISTING_SITE
  }),
  f({ key: "current_hosting", section: "current_site", type: "text", applicableIf: EXISTING_SITE }),
  f({ key: "current_domain", section: "current_site", type: "text", applicableIf: EXISTING_SITE }),
  f({ key: "current_problems", section: "current_site", type: "text", applicableIf: EXISTING_SITE }),
  f({ key: "current_analytics", section: "current_site", type: "text", applicableIf: EXISTING_SITE }),
  f({ key: "current_seo", section: "current_site", type: "text", applicableIf: EXISTING_SITE }),
  f({ key: "current_redirects", section: "current_site", type: "text", applicableIf: EXISTING_SITE }),

  f({ key: "refs_liked_sites", section: "references", type: "text", importance: "recommended" }),
  f({ key: "refs_liked_why", section: "references", type: "text" }),
  f({ key: "refs_disliked", section: "references", type: "text" }),
  f({ key: "refs_competitors", section: "references", type: "text" }),
  f({ key: "refs_sector", section: "references", type: "text" }),
  f({ key: "refs_visual", section: "references", type: "text" }),
  f({ key: "refs_inspiration", section: "references", type: "text" }),

  f({ key: "primary_language", section: "languages", type: "text", required: true }),
  f({
    key: "languages_multilingual",
    section: "languages",
    type: "enum",
    required: true,
    options: YES_NO
  }),
  f({
    key: "languages_list",
    section: "languages",
    type: "text",
    required: true,
    applicableIf: { field: "languages_multilingual", equals: "yes" }
  }),
  f({
    key: "languages_who_translates",
    section: "languages",
    type: "enum",
    required: true,
    options: ["client", "argos", "external", "pending"],
    applicableIf: { field: "languages_multilingual", equals: "yes" }
  }),
  f({
    key: "languages_who_validates",
    section: "languages",
    type: "text",
    applicableIf: { field: "languages_multilingual", equals: "yes" }
  }),
  f({
    key: "languages_varies",
    section: "languages",
    type: "enum",
    options: YES_NO,
    applicableIf: { field: "languages_multilingual", equals: "yes" }
  }),
  f({ key: "languages_future", section: "languages", type: "text" }),

  f({
    key: "sales_mode",
    section: "sales",
    type: "enum",
    required: true,
    options: [
      "no",
      "contact_forms",
      "booking_request",
      "online_booking",
      "online_sales",
      "online_payment",
      "catalog_only"
    ]
  }),
  f({
    key: "needs_ecommerce",
    section: "sales",
    type: "enum",
    options: YES_NO_NA
  }),
  f({
    key: "sales_what",
    section: "sales",
    type: "text",
    required: true,
    applicableIf: {
      field: "sales_mode",
      in: ["booking_request", "online_booking", "online_sales", "online_payment"]
    }
  }),
  f({
    key: "sales_availability",
    section: "sales",
    type: "text",
    applicableIf: { field: "sales_mode", in: ["booking_request", "online_booking"] }
  }),
  f({
    key: "sales_calendar",
    section: "sales",
    type: "text",
    applicableIf: { field: "sales_mode", in: ["booking_request", "online_booking"] }
  }),
  f({
    key: "sales_capacity",
    section: "sales",
    type: "text",
    applicableIf: { field: "sales_mode", in: ["booking_request", "online_booking"] }
  }),
  f({
    key: "sales_confirmation",
    section: "sales",
    type: "text",
    applicableIf: { field: "sales_mode", in: ["booking_request", "online_booking"] }
  }),
  f({
    key: "sales_cancellation",
    section: "sales",
    type: "text",
    applicableIf: { field: "sales_mode", in: ["booking_request", "online_booking"] }
  }),
  f({
    key: "sales_current_software",
    section: "sales",
    type: "text",
    applicableIf: {
      field: "sales_mode",
      in: ["booking_request", "online_booking", "online_sales", "online_payment"]
    }
  }),
  f({
    key: "sales_payments",
    section: "sales",
    type: "text",
    applicableIf: { field: "sales_mode", in: ["online_sales", "online_payment", "online_booking"] }
  }),
  f({
    key: "sales_currency",
    section: "sales",
    type: "text",
    applicableIf: { field: "sales_mode", in: ["online_sales", "online_payment"] }
  }),
  f({
    key: "sales_tax",
    section: "sales",
    type: "text",
    applicableIf: { field: "sales_mode", in: ["online_sales", "online_payment"] }
  }),
  f({
    key: "sales_shipping",
    section: "sales",
    type: "text",
    applicableIf: { field: "sales_mode", in: ["online_sales"] }
  }),
  f({
    key: "sales_returns",
    section: "sales",
    type: "text",
    applicableIf: { field: "sales_mode", in: ["online_sales"] }
  }),

  f({
    key: "integrations_list",
    section: "integrations",
    type: "multi_enum",
    options: [
      "crm",
      "erp",
      "billing",
      "booking",
      "calendar",
      "newsletter",
      "email_marketing",
      "whatsapp",
      "social",
      "google_maps",
      "analytics",
      "search_console",
      "meta_pixel",
      "payments",
      "chat",
      "external_api",
      "other"
    ]
  }),
  f({
    key: "integrations_details",
    section: "integrations",
    type: "text",
    applicableIf: { field: "integrations_list", minLength: 1 }
  }),

  f({ key: "legal_notice", section: "legal", type: "enum", options: YES_NO_PENDING }),
  f({ key: "legal_privacy", section: "legal", type: "enum", options: YES_NO_PENDING }),
  f({ key: "legal_cookies", section: "legal", type: "enum", options: YES_NO_PENDING }),
  f({ key: "legal_contract", section: "legal", type: "enum", options: YES_NO_NA }),
  f({ key: "legal_booking", section: "legal", type: "enum", options: YES_NO_NA }),
  f({ key: "legal_returns", section: "legal", type: "enum", options: YES_NO_NA }),
  f({ key: "legal_cancel", section: "legal", type: "enum", options: YES_NO_NA }),
  f({ key: "legal_registry", section: "legal", type: "text" }),
  f({ key: "legal_responsible", section: "legal", type: "text" }),
  f({ key: "legal_dpo", section: "legal", type: "text" }),
  f({
    key: "legal_professional_texts",
    section: "legal",
    type: "enum",
    importance: "recommended",
    options: YES_NO_PENDING
  }),
  f({ key: "legal_licenses", section: "legal", type: "text" }),
  f({ key: "legal_image_rights", section: "legal", type: "enum", options: YES_NO_PENDING }),

  f({ key: "seo_markets", section: "seo", type: "text" }),
  f({ key: "seo_geo", section: "seo", type: "text" }),
  f({ key: "seo_audience", section: "seo", type: "text" }),
  f({ key: "seo_priority_offer", section: "seo", type: "text" }),
  f({ key: "seo_keywords", section: "seo", type: "text" }),
  f({ key: "seo_competitors", section: "seo", type: "text" }),
  f({ key: "seo_campaigns", section: "seo", type: "text" }),
  f({ key: "seo_google_ads", section: "seo", type: "enum", options: YES_NO_NA }),
  f({ key: "seo_meta_ads", section: "seo", type: "enum", options: YES_NO_NA }),
  f({ key: "seo_newsletter", section: "seo", type: "enum", options: YES_NO_NA }),
  f({ key: "seo_social", section: "seo", type: "text" }),
  f({ key: "seo_gbp", section: "seo", type: "enum", options: YES_NO_NA }),
  f({ key: "seo_analytics", section: "seo", type: "enum", options: YES_NO_NA }),
  f({ key: "seo_search_console", section: "seo", type: "enum", options: YES_NO_NA }),
  f({ key: "seo_current_position", section: "seo", type: "text" }),
  f({ key: "seo_goals", section: "seo", type: "text" }),
  f({ key: "seo_queries", section: "seo", type: "text" }),
  f({ key: "seo_seasonality", section: "seo", type: "text" }),

  f({
    key: "access_needed",
    section: "access",
    type: "multi_enum",
    options: [
      "domain",
      "dns",
      "hosting",
      "cms",
      "analytics",
      "search_console",
      "gbp",
      "crm",
      "booking",
      "email_marketing",
      "ecommerce",
      "other"
    ]
  }),
  f({
    key: "access_status_domain",
    section: "access",
    type: "enum",
    options: CREDENTIAL_STATUSES,
    applicableIf: { field: "access_needed", contains: "domain" }
  }),
  f({
    key: "access_status_hosting",
    section: "access",
    type: "enum",
    options: CREDENTIAL_STATUSES,
    applicableIf: { field: "access_needed", contains: "hosting" }
  }),
  f({
    key: "access_status_cms",
    section: "access",
    type: "enum",
    options: CREDENTIAL_STATUSES,
    applicableIf: { field: "access_needed", contains: "cms" }
  }),
  f({
    key: "access_ack_no_secrets",
    section: "access",
    type: "enum",
    required: true,
    options: ["yes"]
  }),

  f({ key: "confirm_reviewed", section: "review", type: "enum", required: true, options: ["yes"] }),
  f({ key: "confirm_use_material", section: "review", type: "enum", required: true, options: ["yes"] }),
  f({ key: "confirm_authorization", section: "review", type: "enum", required: true, options: ["yes"] }),
  f({ key: "notes", section: "review", type: "text" })
]);

const WEB_PROJECT_FORM_V2 = Object.freeze({
  version: FORM_SCHEMA_VERSION_V2,
  sections: WEB_PROJECT_FORM_SECTIONS_V2,
  fields: WEB_PROJECT_FORM_FIELDS_V2,
  requiredDocuments: [],
  documentCategories: DOCUMENT_CATEGORIES,
  itemBindings: Object.freeze([
    Object.freeze({
      itemType: "location",
      section: "company",
      applicableIf: { field: "company_multiple_locations", equals: "yes" }
    }),
    Object.freeze({
      itemType: "team_member",
      section: "about"
    }),
    Object.freeze({
      itemType: "service",
      section: "offer",
      applicableIf: { field: "offer_kinds", contains: "services" }
    }),
    Object.freeze({
      itemType: "product",
      section: "offer",
      applicableIf: { field: "offer_kinds", contains: "products" }
    }),
    Object.freeze({
      itemType: "tour",
      section: "offer",
      applicableIf: { field: "offer_kinds", contains: "experiences" }
    }),
    Object.freeze({
      itemType: "page",
      section: "content"
    })
  ])
});

function fieldByKeyV2(key) {
  return WEB_PROJECT_FORM_FIELDS_V2.find((field) => field.key === key);
}

module.exports = {
  WEB_PROJECT_FORM_V2,
  WEB_PROJECT_FORM_SECTIONS_V2,
  fieldByKeyV2
};
