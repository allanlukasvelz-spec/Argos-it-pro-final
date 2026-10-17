const COMMON_KEYS = Object.freeze(["notes", "note", "sort_order", "order", "active", "image_url", "video_url"]);

const ITEM_PAYLOAD_SCHEMAS = Object.freeze({
  service: Object.freeze({
    keys: Object.freeze([
      ...COMMON_KEYS,
      "category",
      "summary",
      "description",
      "audience",
      "problem",
      "benefits",
      "features",
      "process",
      "price_from",
      "show_price",
      "cta",
      "gallery_notes",
      "publishable"
    ])
  }),
  product: Object.freeze({
    keys: Object.freeze([
      ...COMMON_KEYS,
      "category",
      "sku",
      "summary",
      "description",
      "features",
      "variants",
      "price",
      "tax",
      "show_price",
      "stock",
      "shipping",
      "spec_sheet",
      "cta"
    ])
  }),
  tour: Object.freeze({
    keys: Object.freeze([
      ...COMMON_KEYS,
      "category",
      "destination",
      "location",
      "summary",
      "description",
      "duration",
      "schedule",
      "season",
      "availability",
      "available_days",
      "languages",
      "difficulty",
      "min_age",
      "accessibility",
      "min_group",
      "max_group",
      "price_adult",
      "price_child",
      "price_senior",
      "price_group",
      "currency",
      "tax_included",
      "meeting_point",
      "start_point",
      "end_point",
      "coordinates",
      "itinerary",
      "stops",
      "includes",
      "excludes",
      "what_to_bring",
      "requirements",
      "conditions",
      "cancellation",
      "changes",
      "no_show",
      "weather",
      "transport_included",
      "meals_included",
      "guide_included",
      "tickets_included",
      "advance_booking",
      "confirmation",
      "realtime_availability",
      "internal_code",
      "operator"
    ])
  }),
  team_member: Object.freeze({
    keys: Object.freeze([
      ...COMMON_KEYS,
      "role",
      "specialty",
      "bio_short",
      "bio_full",
      "public_email",
      "public_phone",
      "linkedin",
      "photo_notes"
    ])
  }),
  location: Object.freeze({
    keys: Object.freeze([
      ...COMMON_KEYS,
      "address",
      "city",
      "postal_code",
      "country",
      "phone",
      "hours",
      "map_url"
    ])
  }),
  page: Object.freeze({
    keys: Object.freeze([
      ...COMMON_KEYS,
      "slug",
      "page_type",
      "purpose",
      "summary",
      "contents",
      "cta",
      "seo_priority",
      "parent_page",
      "keep",
      "remove",
      "redesign",
      "is_new"
    ])
  }),
  deliverable: Object.freeze({
    keys: Object.freeze([...COMMON_KEYS, "description", "due_notes"])
  }),
  custom: Object.freeze({
    keys: Object.freeze([...COMMON_KEYS, "description"])
  })
});

function sanitizeItemPayload(itemType, payload) {
  const schema = ITEM_PAYLOAD_SCHEMAS[itemType];
  const source = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  if (!schema) {
    return { ok: false, error: "item_type no soportado", sanitized: null };
  }
  const extra = Object.keys(source).filter((key) => !schema.keys.includes(key));
  if (extra.length > 0) {
    return {
      ok: false,
      error: `payload de item contiene claves no permitidas: ${extra.join(", ")}`,
      sanitized: null
    };
  }
  const sanitized = {};
  for (const key of schema.keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      sanitized[key] = source[key];
    }
  }
  return { ok: true, sanitized, error: null };
}

module.exports = {
  ITEM_PAYLOAD_SCHEMAS,
  sanitizeItemPayload
};
