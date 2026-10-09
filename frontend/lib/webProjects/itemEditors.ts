export const ITEM_EDITOR_FIELDS: Record<string, string[]> = {
  service: [
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
    "publishable"
  ],
  product: [
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
    "cta"
  ],
  tour: [
    "category",
    "destination",
    "location",
    "summary",
    "description",
    "duration",
    "schedule",
    "season",
    "availability",
    "languages",
    "difficulty",
    "min_group",
    "max_group",
    "price_adult",
    "price_child",
    "currency",
    "meeting_point",
    "itinerary",
    "includes",
    "excludes",
    "what_to_bring",
    "cancellation",
    "video_url"
  ],
  team_member: ["role", "specialty", "bio_short", "bio_full", "public_email", "linkedin"],
  location: ["address", "city", "postal_code", "country", "phone", "hours", "map_url"],
  page: ["slug", "page_type", "purpose", "summary", "contents", "cta", "seo_priority", "keep", "redesign", "is_new"]
};

export const ITEM_ADD_LABEL: Record<string, string> = {
  service: "Añadir servicio",
  product: "Añadir producto",
  tour: "Añadir actividad",
  team_member: "Añadir persona",
  location: "Añadir sede",
  page: "Añadir página"
};

export const ITEM_EMPTY_COPY: Record<string, string> = {
  service: "Aún no has añadido ningún servicio. Puedes añadirlo ahora o volver más tarde.",
  product: "Aún no has añadido ningún producto. Puedes añadirlo ahora o volver más tarde.",
  tour: "Aún no has añadido ninguna actividad. Puedes añadirla ahora o volver más tarde.",
  team_member: "Aún no has añadido a nadie del equipo. Puedes hacerlo ahora o más tarde.",
  location: "Aún no has añadido ninguna sede. Puedes hacerlo ahora o más tarde.",
  page: "Aún no has añadido páginas. Puedes añadir la estructura ahora o más tarde."
};

export function sectionNavStatusLabel(status: string, correction: boolean): string {
  if (correction || status === "correction") return "Necesita revisión";
  if (status === "complete") return "Completa";
  if (status === "partial") return "Pendiente";
  if (status === "optional") return "Opcional";
  if (status === "hidden") return "No aplica";
  return "Sin iniciar";
}

export function questionnaireOverviewCopy(input: {
  percentage: number;
  sectionsComplete: number;
  sectionsTotal: number;
  pending: number;
  corrections: number;
}): string {
  return `Información completada: ${input.percentage}%. Secciones completas: ${input.sectionsComplete}/${input.sectionsTotal}. Pendientes: ${input.pending}. Correcciones ARGOS: ${input.corrections}.`;
}
