import type {
  WebProjectCredentialStatusValue,
  WebProjectItemStatus,
  WebProjectItemType,
  WebProjectType,
  WebProjectUploadStatus,
  WebProjectWorkflowStatus
} from "./types.ts";

const WORKFLOW_LABELS: Record<WebProjectWorkflowStatus, string> = {
  INTAKE: "Recopilación",
  REVIEW: "Revisión ARGOS",
  ARCHITECTURE: "Arquitectura",
  MOCKUP: "Maqueta",
  DEVELOPMENT: "Desarrollo",
  VALIDATION: "Validación",
  PUBLICATION: "Publicación",
  COMPLETED: "Finalizado"
};

const TYPE_LABELS: Record<WebProjectType, string> = {
  create: "Crear nueva web",
  improve: "Mejorar web existente"
};

const ITEM_TYPE_LABELS: Record<WebProjectItemType, string> = {
  page: "Página",
  service: "Servicio",
  product: "Producto",
  tour: "Tour",
  team_member: "Equipo",
  location: "Ubicación",
  deliverable: "Entregable",
  custom: "Personalizado"
};

const ITEM_STATUS_LABELS: Record<WebProjectItemStatus, string> = {
  draft: "Borrador",
  ready: "Listo",
  done: "Hecho"
};

const CREDENTIAL_LABELS: Record<WebProjectCredentialStatusValue, string> = {
  NONE: "No solicitados",
  REQUESTED: "Solicitados",
  RECEIVED_OUT_OF_BAND: "Recibidos por canal seguro",
  VERIFIED: "Verificados",
  REVOKED: "Revocados"
};

const UPLOAD_STATUS_LABELS: Record<WebProjectUploadStatus, string> = {
  PENDING: "Pendiente de archivo",
  STORED: "Guardado",
  FAILED: "No se pudo guardar"
};

const REVIEW_VERDICT_LABELS: Record<string, string> = {
  APPROVED: "Aprobado",
  CORRECTION_REQUESTED: "Necesita corrección",
  REJECTED: "No aceptado"
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente de revisión",
  IN_REVIEW: "En revisión por ARGOS",
  APPROVED: "Aprobado",
  CORRECTION_REQUIRED: "Necesita corrección",
  REJECTED: "No aceptado"
};

const READINESS_LABELS: Record<string, string> = {
  NOT_READY: "No listo",
  READY_WITH_OPEN_ITEMS: "Listo con avisos",
  READY: "Listo para arquitectura"
};

const SCOPE_STATE_LABELS: Record<string, string> = {
  required: "Necesario",
  not_required: "No necesario",
  pending_decision: "Pendiente de decisión"
};

const CONTENT_READY_LABELS: Record<string, string> = {
  READY: "Listo",
  PARTIAL: "Parcial",
  MISSING: "Falta",
  NOT_APPLICABLE: "No aplica"
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  ARCHITECTURE_NOTE: "Nota de arquitectura",
  ASSUMPTION: "Asunción",
  EXCLUSION: "Exclusión",
  RISK: "Riesgo",
  DECISION_REQUIRED: "Decisión requerida"
};

export function workflowLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return WORKFLOW_LABELS[status as WebProjectWorkflowStatus] || status;
}

export function projectTypeLabel(type: string | null | undefined): string {
  if (!type) return "—";
  return TYPE_LABELS[type as WebProjectType] || type;
}

export function itemTypeLabel(type: string | null | undefined): string {
  if (!type) return "Elemento";
  return ITEM_TYPE_LABELS[type as WebProjectItemType] || type;
}

export function itemStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return ITEM_STATUS_LABELS[status as WebProjectItemStatus] || status;
}

export function credentialStatusLabel(status: string | null | undefined): string {
  if (!status) return CREDENTIAL_LABELS.NONE;
  return CREDENTIAL_LABELS[status as WebProjectCredentialStatusValue] || status;
}

export function uploadStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return UPLOAD_STATUS_LABELS[status as WebProjectUploadStatus] || status;
}

export function reviewVerdictLabel(verdict: string | null | undefined): string {
  if (!verdict) return "—";
  return REVIEW_VERDICT_LABELS[verdict] || verdict;
}

export function reviewStatusLabel(status: string | null | undefined): string {
  if (!status) return REVIEW_STATUS_LABELS.PENDING;
  return REVIEW_STATUS_LABELS[status] || status;
}

export function reviewStatusIcon(status: string | null | undefined): string {
  if (status === "APPROVED") return "✓";
  if (status === "CORRECTION_REQUIRED") return "⚠";
  if (status === "REJECTED") return "✕";
  return "●";
}

const NOTE_STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierta",
  RESOLVED: "Resuelta"
};

export function architectureReadinessLabel(state: string | null | undefined): string {
  if (!state) return "—";
  return READINESS_LABELS[state] || state;
}

export function scopeStateLabel(state: string | null | undefined): string {
  if (!state) return "—";
  return SCOPE_STATE_LABELS[state] || state;
}

export function contentReadinessLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return CONTENT_READY_LABELS[status] || status;
}

export function briefNoteTypeLabel(type: string | null | undefined): string {
  if (!type) return "Nota";
  return NOTE_TYPE_LABELS[type] || type;
}

export function briefNoteStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return NOTE_STATUS_LABELS[status] || status;
}

const ARCH_PAGE_TYPE_LABELS: Record<string, string> = {
  HOME: "Inicio",
  ABOUT: "Nosotros",
  SERVICE_INDEX: "Índice de servicios",
  SERVICE_DETAIL: "Detalle de servicio",
  PRODUCT_INDEX: "Índice de productos",
  PRODUCT_DETAIL: "Detalle de producto",
  TOUR_INDEX: "Índice de actividades",
  TOUR_DETAIL: "Detalle de actividad",
  TEAM: "Equipo",
  LOCATIONS: "Sedes",
  LOCATION_DETAIL: "Detalle de sede",
  CONTACT: "Contacto",
  FAQ: "Preguntas frecuentes",
  BLOG_INDEX: "Blog",
  ARTICLE: "Artículo",
  LEGAL: "Legal",
  BOOKING: "Reserva",
  ECOMMERCE: "Ecommerce",
  LANDING: "Landing",
  CUSTOM: "Personalizada"
};

const ARCH_TEMPLATE_LABELS: Record<string, string> = {
  UNIQUE: "Página única",
  INDEX: "Índice",
  DETAIL: "Plantilla",
  LEGAL: "Legal",
  SYSTEM: "Sistema",
  LANDING: "Landing"
};

const ARCH_NAV_LABELS: Record<string, string> = {
  PRIMARY: "Principal",
  SECONDARY: "Secundaria",
  UTILITY: "Utilidad",
  FOOTER: "Pie",
  HIDDEN: "Oculta",
  NONE: "Sin navegación"
};

const ARCH_VALIDATION_LABELS: Record<string, string> = {
  INVALID: "Necesita correcciones",
  READY_WITH_WARNINGS: "Lista con avisos",
  READY: "Lista"
};

const ARCH_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  APPROVED: "Aprobada",
  SUPERSEDED: "Sustituida"
};

const ARCH_BLOCK_LABELS: Record<string, string> = {
  HERO: "Hero",
  INTRO: "Introducción",
  RICH_TEXT: "Texto enriquecido",
  SERVICE_GRID: "Cuadrícula de servicios",
  SERVICE_DETAIL: "Detalle de servicio",
  PRODUCT_GRID: "Cuadrícula de productos",
  PRODUCT_DETAIL: "Detalle de producto",
  TOUR_GRID: "Cuadrícula de actividades",
  TOUR_DETAIL: "Detalle de actividad",
  TEAM_GRID: "Equipo",
  LOCATIONS: "Ubicaciones",
  FEATURES: "Características",
  BENEFITS: "Beneficios",
  PROCESS: "Proceso",
  FAQ: "FAQ",
  TESTIMONIALS: "Testimonios",
  GALLERY: "Galería",
  VIDEO: "Vídeo",
  MAP: "Mapa",
  CONTACT_FORM: "Formulario de contacto",
  QUOTE_FORM: "Formulario de presupuesto",
  BOOKING_WIDGET: "Widget de reserva",
  ECOMMERCE_ACTION: "Acción de compra",
  CTA: "Llamada a la acción",
  RELATED_CONTENT: "Contenido relacionado",
  NEWS: "Noticias",
  NEWSLETTER: "Newsletter",
  LEGAL_TEXT: "Texto legal",
  CUSTOM: "Personalizado"
};

const SALES_MODE_LABELS: Record<string, string> = {
  contact_forms: "Formularios de contacto",
  quote_request: "Solicitud de presupuesto",
  catalog_only: "Solo catálogo",
  online_sales: "Venta online",
  online_payment: "Pago online",
  booking: "Reserva",
  external_booking: "Reserva externa",
  phone_call: "Llamada telefónica",
  no: "Sin venta online"
};

export function architecturePageTypeLabel(type: string | null | undefined): string {
  if (!type) return "Pendiente de definir";
  return ARCH_PAGE_TYPE_LABELS[type] || type;
}

export function architectureTemplateLabel(type: string | null | undefined): string {
  if (!type) return "—";
  return ARCH_TEMPLATE_LABELS[type] || type;
}

export function architectureNavLabel(placement: string | null | undefined): string {
  if (!placement) return "—";
  return ARCH_NAV_LABELS[placement] || placement;
}

export function architectureValidationLabel(state: string | null | undefined): string {
  if (!state) return "—";
  return ARCH_VALIDATION_LABELS[state] || state;
}

export function architectureStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return ARCH_STATUS_LABELS[status] || status;
}

export function architectureBlockLabel(type: string | null | undefined): string {
  if (!type) return "—";
  return ARCH_BLOCK_LABELS[type] || type;
}

export function salesModeLabel(mode: string | null | undefined): string {
  if (!mode) return "Pendiente de definir";
  return SALES_MODE_LABELS[mode] || mode.replace(/_/g, " ");
}

const MOCKUP_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  INTERNAL_REVIEW: "Revisión interna",
  CLIENT_REVIEW: "Revisión cliente",
  CHANGES_REQUESTED: "Cambios solicitados",
  APPROVED: "Aprobada",
  SUPERSEDED: "Sustituida"
};

const MOCKUP_VALIDATION_LABELS: Record<string, string> = {
  INVALID: "Necesita correcciones",
  READY_WITH_WARNINGS: "Lista con avisos",
  READY: "Lista"
};

const MOCKUP_SECTION_LABELS: Record<string, string> = {
  HEADER: "Cabecera",
  FOOTER: "Pie",
  NAVIGATION: "Navegación",
  HERO: "Hero",
  INTRO: "Introducción",
  RICH_TEXT: "Texto enriquecido",
  SERVICE_GRID: "Cuadrícula de servicios",
  SERVICE_DETAIL: "Detalle de servicio",
  PRODUCT_GRID: "Cuadrícula de productos",
  PRODUCT_DETAIL: "Detalle de producto",
  TOUR_GRID: "Cuadrícula de actividades",
  TOUR_DETAIL: "Detalle de actividad",
  TEAM_GRID: "Equipo",
  LOCATIONS: "Ubicaciones",
  FEATURES: "Características",
  BENEFITS: "Beneficios",
  PROCESS: "Proceso",
  FAQ: "FAQ",
  TESTIMONIALS: "Testimonios",
  GALLERY: "Galería",
  VIDEO: "Vídeo",
  MAP: "Mapa",
  CONTACT_FORM: "Formulario de contacto",
  QUOTE_FORM: "Formulario de presupuesto",
  BOOKING_WIDGET: "Widget de reserva",
  ECOMMERCE_ACTION: "Acción de compra",
  CTA: "Llamada a la acción",
  RELATED_CONTENT: "Contenido relacionado",
  NEWS: "Noticias",
  NEWSLETTER: "Newsletter",
  LEGAL_TEXT: "Texto legal",
  CUSTOM: "Personalizado"
};

const MOCKUP_VARIANT_LABELS: Record<string, string> = {
  STANDARD: "Estándar",
  DEFAULT: "Por defecto",
  CENTERED: "Centrado",
  CARDS: "Tarjetas",
  BANNER: "Banner",
  INLINE: "En línea",
  LIST: "Lista",
  GRID: "Cuadrícula",
  SPLIT: "Dividido",
  MINIMAL: "Minimal",
  EXPANDED: "Ampliado"
};

const MOCKUP_ALIGNMENT_LABELS: Record<string, string> = {
  LEFT: "Izquierda",
  CENTER: "Centro",
  RIGHT: "Derecha"
};

const MOCKUP_DENSITY_LABELS: Record<string, string> = {
  COMPACT: "Compacta",
  NORMAL: "Normal",
  SPACIOUS: "Amplia"
};

export function mockupStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return MOCKUP_STATUS_LABELS[status] || status;
}

export function mockupValidationLabel(state: string | null | undefined): string {
  if (!state) return "—";
  return MOCKUP_VALIDATION_LABELS[state] || state;
}

export function mockupSectionLabel(type: string | null | undefined): string {
  if (!type) return "—";
  return MOCKUP_SECTION_LABELS[type] || architectureBlockLabel(type);
}

export function mockupVariantLabel(variant: string | null | undefined): string {
  if (!variant) return "—";
  return MOCKUP_VARIANT_LABELS[variant] || variant;
}

export function mockupAlignmentLabel(alignment: string | null | undefined): string {
  if (!alignment) return "—";
  return MOCKUP_ALIGNMENT_LABELS[alignment] || alignment;
}

export function mockupDensityLabel(density: string | null | undefined): string {
  if (!density) return "—";
  return MOCKUP_DENSITY_LABELS[density] || density;
}

const DEVELOPMENT_ITEM_STATUS_LABELS: Record<string, string> = {
  TODO: "Pendiente",
  READY: "Preparado",
  IN_PROGRESS: "En curso",
  BLOCKED: "Bloqueado",
  REVIEW: "Revisión",
  DONE: "Terminado",
  NOT_APPLICABLE: "No aplica"
};

const DEVELOPMENT_READINESS_LABELS: Record<string, string> = {
  NOT_READY: "No listo",
  READY_WITH_WARNINGS: "Listo con avisos",
  READY: "Listo"
};

export function developmentItemStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return DEVELOPMENT_ITEM_STATUS_LABELS[status] || status;
}

export function developmentReadinessLabel(state: string | null | undefined): string {
  if (!state) return "—";
  return DEVELOPMENT_READINESS_LABELS[state] || state;
}

const VALIDATION_CHECK_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En curso",
  PASS: "Aprobado",
  FAIL: "Fallo",
  BLOCKED: "Bloqueado",
  NOT_TESTABLE: "No comprobable",
  NOT_APPLICABLE: "No aplica"
};

export function validationCheckStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return VALIDATION_CHECK_STATUS_LABELS[status] || status;
}

export function validationReadinessLabel(state: string | null | undefined): string {
  if (!state) return "—";
  return DEVELOPMENT_READINESS_LABELS[state] || state;
}

export function validationCategoryLabel(category: string | null | undefined): string {
  if (!category) return "—";
  return category.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function developmentItemTypeLabel(type: string | null | undefined): string {
  if (!type) return "—";
  return type.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function publicationStepStatusLabel(status: string | null | undefined): string {
  return developmentItemStatusLabel(status);
}

export function publicationReadinessLabel(state: string | null | undefined): string {
  return developmentReadinessLabel(state);
}

export function publicationStepTypeLabel(type: string | null | undefined): string {
  return developmentItemTypeLabel(type);
}

export const ITEM_TYPES: WebProjectItemType[] = [
  "page",
  "service",
  "product",
  "tour",
  "team_member",
  "location",
  "deliverable",
  "custom"
];
