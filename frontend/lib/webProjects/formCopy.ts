import type { WebProjectFormFieldDef } from "./types.ts";

const FIELD_COPY: Record<string, { title: string; help?: string }> = {
  site_kind: {
    title: "¿Qué tipo de web necesitas?",
    help: "Elige la opción que mejor describe el resultado que buscas."
  },
  has_existing_site: {
    title: "¿Tienes ya una web?",
    help: "Si existe un sitio actual, nos ayuda a planificar la mejora."
  },
  existing_url: {
    title: "Dirección de tu web actual",
    help: "Puedes pegar la URL completa, por ejemplo https://www.ejemplo.com"
  },
  cms: {
    title: "¿Con qué herramienta está hecha tu web?",
    help: "Si no lo sabes, elige «No lo sé»."
  },
  primary_language: {
    title: "Idioma principal de la web",
    help: "El idioma en el que se publicará el contenido principal."
  },
  needs_ecommerce: {
    title: "¿Necesitas vender online?",
    help: "Indica si la web debe incluir tienda o pagos."
  },
  notes: {
    title: "Notas adicionales",
    help: "Cuéntanos contexto útil. No escribas contraseñas ni claves."
  },
  company_trade_name: { title: "Nombre comercial" },
  company_legal_name: { title: "Razón social", help: "Si no tienes sociedad, déjalo en blanco." },
  company_tax_id: { title: "NIF / CIF / NIE", help: "Solo si aplica." },
  company_entity_type: { title: "Tipo de entidad" },
  company_address: { title: "Dirección" },
  company_postal_code: { title: "Código postal" },
  company_city: { title: "Localidad" },
  company_province: { title: "Provincia" },
  company_country: { title: "País" },
  company_phone: { title: "Teléfono principal" },
  company_email: { title: "Email general" },
  company_email_sales: { title: "Email comercial" },
  company_contact_name: { title: "Persona de contacto" },
  company_contact_role: { title: "Cargo" },
  company_contact_phone: { title: "Teléfono de contacto" },
  company_contact_email: { title: "Email de contacto" },
  company_founded_year: { title: "Año de inicio" },
  company_geo_scope: { title: "Ámbito geográfico" },
  company_multiple_locations: {
    title: "¿Tenéis más de una sede?",
    help: "Si es así, podrás añadir cada ubicación."
  },
  brand_has_logo: { title: "¿Ya tienes logotipo?" },
  brand_has_manual: { title: "¿Tienes manual de marca?" },
  brand_colors: { title: "Colores corporativos" },
  brand_fonts: { title: "Tipografías conocidas" },
  brand_claim: { title: "Claim o eslogan" },
  brand_tone: { title: "Tono de comunicación" },
  brand_attributes: { title: "Atributos de marca" },
  brand_styles_prefer: { title: "Estilos visuales preferidos" },
  brand_styles_avoid: { title: "Estilos a evitar" },
  brand_visual_refs: { title: "Referencias visuales que te gustan" },
  about_history: { title: "Historia del proyecto" },
  about_who: { title: "Quiénes sois" },
  about_what_you_do: { title: "Qué hacéis" },
  about_mission: { title: "Misión" },
  about_vision: { title: "Visión" },
  about_values: { title: "Valores" },
  about_differentiation: { title: "Qué os diferencia" },
  about_why_choose: { title: "Por qué os eligen" },
  about_strengths: { title: "Fortalezas" },
  about_specialty: { title: "Especialización" },
  about_certifications: { title: "Certificaciones" },
  about_milestones: { title: "Hitos" },
  about_awards: { title: "Premios o reconocimientos" },
  goals_objectives: { title: "Qué quieres conseguir" },
  goals_primary_success: {
    title: "¿Cuál sería para ti el principal éxito de este proyecto?",
    help: "Una fecha u objetivo interno no es un compromiso de ARGOS."
  },
  goals_audience: { title: "Público objetivo" },
  goals_current_clients: { title: "Clientes actuales" },
  goals_desired_clients: { title: "Clientes deseados" },
  goals_markets: { title: "Mercados objetivo" },
  goals_b2b_b2c: { title: "¿Os dirigís a empresas, a particulares o a ambos?" },
  goals_problems: { title: "Principales problemas actuales" },
  goals_priority: { title: "Prioridad" },
  goals_target_date: {
    title: "Fecha objetivo, si existe",
    help: "Es orientativa. No se convierte en un compromiso de entrega."
  },
  offer_kinds: {
    title: "¿Qué ofreces?",
    help: "Marca lo que aplica. Así te mostramos solo las fichas que necesitas."
  },
  content_has_texts: { title: "¿Ya tienes textos preparados?" },
  content_reuse_current: { title: "¿Quieres reutilizar textos de la web actual?" },
  content_needs_copy: { title: "¿Necesitas ayuda de redacción?" },
  content_has_catalogs: { title: "¿Dispones de catálogos?" },
  content_has_prices: { title: "¿Dispones de tarifas?" },
  content_has_dossiers: { title: "¿Dispones de dosieres?" },
  content_has_presentations: { title: "¿Dispones de presentaciones?" },
  content_has_faqs: { title: "¿Dispones de preguntas frecuentes?" },
  content_has_testimonials: { title: "¿Dispones de testimonios?" },
  content_has_cases: { title: "¿Dispones de casos de éxito?" },
  media_has_photos: { title: "¿Dispones de fotografías propias?" },
  media_has_videos: { title: "¿Dispones de vídeos?" },
  media_needs_production: { title: "¿Necesitas producción fotográfica?" },
  media_commercial_rights: { title: "¿Se pueden usar las imágenes comercialmente?" },
  media_people_consent: { title: "¿Tienes autorización de las personas que aparecen?" },
  media_video_url: {
    title: "Enlace de vídeo",
    help: "YouTube, Vimeo o Google Drive. No subas un archivo de vídeo aquí."
  },
  current_works: { title: "Qué funciona bien" },
  current_fails: { title: "Qué no funciona" },
  current_keep: { title: "Qué quieres conservar" },
  current_remove: { title: "Qué quieres eliminar" },
  current_must_pages: { title: "Páginas imprescindibles" },
  current_migrate: { title: "Contenidos a migrar" },
  current_features: { title: "Funcionalidades actuales" },
  current_hosting: { title: "Proveedor de hosting, si lo sabes" },
  current_domain: { title: "Dominio, si lo sabes" },
  current_problems: { title: "Problemas actuales" },
  current_analytics: { title: "Analítica existente" },
  current_seo: { title: "SEO existente" },
  current_redirects: { title: "Redirecciones importantes" },
  refs_liked_sites: { title: "Webs que te gustan" },
  refs_liked_why: { title: "Qué te gusta de cada una" },
  refs_disliked: { title: "Webs que no te gustan" },
  refs_competitors: { title: "Competidores" },
  refs_sector: { title: "Referentes del sector" },
  refs_visual: { title: "Referencias visuales" },
  refs_inspiration: { title: "Otra inspiración" },
  languages_multilingual: { title: "¿La web tendrá más de un idioma?" },
  languages_list: { title: "Qué idiomas" },
  languages_who_translates: { title: "Quién aporta las traducciones" },
  languages_who_validates: { title: "Quién valida las traducciones" },
  languages_varies: { title: "¿El contenido varía según el idioma?" },
  languages_future: { title: "Idiomas futuros previstos" },
  sales_mode: { title: "¿La web debe permitir reservas, compras o pagos?" },
  sales_what: { title: "Qué se reserva o se vende" },
  sales_availability: { title: "Disponibilidad" },
  sales_calendar: { title: "Calendarios" },
  sales_capacity: { title: "Plazas o capacidad" },
  sales_confirmation: { title: "Confirmación" },
  sales_cancellation: { title: "Cancelación" },
  sales_current_software: { title: "Software actual" },
  sales_payments: { title: "Métodos de pago" },
  sales_currency: { title: "Moneda" },
  sales_tax: { title: "Impuestos" },
  sales_shipping: { title: "Envío" },
  sales_returns: { title: "Devoluciones" },
  integrations_list: {
    title: "¿Con qué sistemas debería conectar la web?",
    help: "No escribas tokens, claves ni contraseñas."
  },
  integrations_details: {
    title: "Detalle de cada integración",
    help: "Nombre del sistema, para qué lo usáis y si ya está en marcha. Sin claves."
  },
  legal_notice: { title: "¿Tenéis aviso legal?" },
  legal_privacy: { title: "¿Tenéis política de privacidad?" },
  legal_cookies: { title: "¿Tenéis política de cookies?" },
  legal_contract: { title: "¿Tenéis condiciones de contratación?" },
  legal_booking: { title: "¿Tenéis condiciones de reservas?" },
  legal_returns: { title: "¿Tenéis política de devoluciones?" },
  legal_cancel: { title: "¿Tenéis política de cancelación?" },
  legal_registry: { title: "Datos registrales" },
  legal_responsible: { title: "Responsable legal" },
  legal_dpo: { title: "DPO, si existe" },
  legal_professional_texts: { title: "¿Los textos legales los ha preparado un profesional?" },
  legal_licenses: { title: "Licencias o autorizaciones sectoriales" },
  legal_image_rights: { title: "Derechos de imagen y contenidos" },
  seo_markets: { title: "Mercados" },
  seo_geo: { title: "Zonas geográficas" },
  seo_audience: { title: "Público objetivo" },
  seo_priority_offer: { title: "Servicios o productos prioritarios" },
  seo_keywords: { title: "Palabras que crees importantes" },
  seo_competitors: { title: "Competidores" },
  seo_campaigns: { title: "Campañas actuales" },
  seo_google_ads: { title: "¿Usáis Google Ads?" },
  seo_meta_ads: { title: "¿Usáis Meta Ads?" },
  seo_newsletter: { title: "¿Tenéis newsletter?" },
  seo_social: { title: "Redes" },
  seo_gbp: { title: "¿Tenéis Google Business Profile?" },
  seo_analytics: { title: "¿Tenéis Analytics?" },
  seo_search_console: { title: "¿Tenéis Search Console?" },
  seo_current_position: { title: "Posicionamiento actual conocido" },
  seo_goals: { title: "Objetivos de visibilidad" },
  seo_queries: { title: "Búsquedas prioritarias" },
  seo_seasonality: { title: "Estacionalidad" },
  access_needed: {
    title: "¿Qué accesos hará falta recibir?",
    help: "No escribas contraseñas aquí. ARGOS te indicará un canal seguro cuando haga falta."
  },
  access_status_domain: { title: "Estado del acceso al dominio" },
  access_status_hosting: { title: "Estado del acceso al hosting" },
  access_status_cms: { title: "Estado del acceso al CMS" },
  access_ack_no_secrets: {
    title: "Confirmo que no escribiré contraseñas ni claves en este cuestionario",
    help: "ARGOS te indicará un canal seguro cuando necesitemos recibir un acceso."
  },
  confirm_reviewed: { title: "He revisado la información" },
  confirm_use_material: { title: "Confirmo que ARGOS puede utilizar este material para preparar el proyecto" },
  confirm_authorization: { title: "Confirmo que tengo autorización sobre los materiales entregados" }
};

const OPTION_COPY: Record<string, string> = {
  corporate: "Web corporativa",
  landing: "Landing",
  microsite: "Microsite",
  ecommerce: "Tienda online",
  other: "Otro",
  yes: "Sí",
  no: "No",
  NO_APLICA: "No aplica",
  wordpress: "WordPress",
  unknown: "No lo sé",
  pending: "Pendiente",
  company: "Empresa",
  freelance: "Autónomo",
  association: "Asociación",
  foundation: "Fundación",
  professional: "Profesional",
  professional_presence: "Tener presencia profesional",
  renew_existing: "Renovar la web existente",
  generate_leads: "Generar contactos",
  sell_online: "Vender online",
  receive_bookings: "Recibir reservas",
  quote_requests: "Captar solicitudes de presupuesto",
  capture_calls: "Captar llamadas",
  brand_image: "Mejorar la imagen de marca",
  seo: "Posicionamiento en buscadores",
  present_services: "Presentar servicios",
  present_catalog: "Presentar catálogo",
  hire_talent: "Captar candidatos",
  publish_news: "Publicar noticias",
  private_area: "Ofrecer un área privada",
  b2b: "Empresas (B2B)",
  b2c: "Particulares (B2C)",
  both: "Ambos",
  urgent: "Urgente",
  high: "Alta",
  normal: "Normal",
  flexible: "Flexible",
  services: "Servicios",
  products: "Productos",
  experiences: "Actividades o experiencias",
  contact_forms: "Solo formularios o contacto",
  booking_request: "Solicitud de reserva",
  online_booking: "Reserva online",
  online_sales: "Venta online",
  online_payment: "Pago online",
  catalog_only: "Catálogo sin compra",
  client: "El cliente",
  argos: "ARGOS",
  external: "Un proveedor externo",
  crm: "CRM",
  erp: "ERP",
  billing: "Facturación",
  booking: "Reservas",
  calendar: "Calendario",
  newsletter: "Newsletter",
  email_marketing: "Email marketing",
  whatsapp: "WhatsApp",
  social: "Redes sociales",
  google_maps: "Google Maps",
  analytics: "Analytics",
  search_console: "Search Console",
  meta_pixel: "Meta Pixel",
  payments: "Pagos",
  chat: "Chat",
  external_api: "API externa",
  domain: "Dominio",
  dns: "DNS",
  hosting: "Hosting",
  cms: "WordPress u otro CMS",
  gbp: "Google Business Profile",
  NONE: "No solicitados",
  REQUESTED: "Solicitados",
  RECEIVED_OUT_OF_BAND: "Recibidos por canal seguro",
  VERIFIED: "Verificados",
  REVOKED: "Revocados",
  LOGO: "Logotipo",
  BRAND_MANUAL: "Manual de marca",
  GRAPHIC: "Recurso gráfico",
  TEXT: "Texto",
  CATALOG: "Catálogo",
  PRICE_LIST: "Tarifas",
  BROCHURE: "Dosier",
  PRESENTATION: "Presentación",
  FAQ: "Preguntas frecuentes",
  CASE_STUDY: "Caso de éxito",
  OTHER_CONTENT: "Otro contenido",
  TEAM: "Equipo",
  LOCATION: "Sede",
  SERVICE: "Servicio",
  PRODUCT: "Producto",
  TOUR: "Actividad",
  CORPORATE: "Corporativo",
  VIDEO: "Vídeo (documento)",
  LEGAL: "Legal",
  OTHER: "Otro"
};

const ITEM_FIELD_COPY: Record<string, string> = {
  notes: "Notas",
  note: "Notas",
  summary: "Resumen",
  description: "Descripción",
  category: "Categoría",
  audience: "Público objetivo",
  problem: "Problema que resuelve",
  benefits: "Beneficios",
  features: "Características",
  process: "Proceso o metodología",
  price_from: "Precio desde",
  show_price: "¿Mostrar precio?",
  cta: "Llamada a la acción",
  gallery_notes: "Galería (notas)",
  publishable: "¿Se puede publicar?",
  sku: "Referencia / SKU",
  variants: "Variantes",
  price: "Precio",
  tax: "IVA u otros impuestos",
  stock: "Stock",
  shipping: "Envío",
  spec_sheet: "Ficha técnica",
  destination: "Destino",
  location: "Localización",
  duration: "Duración",
  schedule: "Horario",
  season: "Temporada",
  availability: "Disponibilidad",
  available_days: "Días disponibles",
  languages: "Idiomas",
  difficulty: "Dificultad",
  min_age: "Edad mínima",
  accessibility: "Accesibilidad",
  min_group: "Grupo mínimo",
  max_group: "Grupo máximo",
  price_adult: "Precio adulto",
  price_child: "Precio niño",
  price_senior: "Precio senior",
  price_group: "Precio grupo",
  currency: "Moneda",
  tax_included: "¿Impuestos incluidos?",
  meeting_point: "Punto de encuentro",
  start_point: "Punto de salida",
  end_point: "Punto de llegada",
  coordinates: "Coordenadas (opcional)",
  itinerary: "Itinerario",
  stops: "Paradas",
  includes: "Incluye",
  excludes: "No incluye",
  what_to_bring: "Qué llevar",
  requirements: "Requisitos",
  conditions: "Condiciones",
  cancellation: "Cancelación",
  changes: "Cambios",
  no_show: "Política de no-show",
  weather: "Meteorología",
  transport_included: "Transporte incluido",
  meals_included: "Comidas incluidas",
  guide_included: "Guía incluido",
  tickets_included: "Entradas incluidas",
  advance_booking: "Reserva previa",
  confirmation: "Confirmación",
  realtime_availability: "¿Disponibilidad en tiempo real?",
  internal_code: "Código interno",
  operator: "Operador o proveedor",
  video_url: "Enlace de vídeo",
  image_url: "Enlace de imagen principal",
  role: "Cargo",
  specialty: "Especialidad",
  bio_short: "Bio breve",
  bio_full: "Bio completa",
  public_email: "Email público (opcional)",
  public_phone: "Teléfono público (opcional)",
  linkedin: "LinkedIn (opcional)",
  photo_notes: "Foto",
  address: "Dirección",
  city: "Localidad",
  postal_code: "Código postal",
  country: "País",
  phone: "Teléfono",
  hours: "Horario",
  map_url: "Enlace de mapa",
  slug: "Slug deseado (opcional)",
  page_type: "Tipo de página",
  purpose: "Propósito",
  contents: "Contenidos disponibles",
  seo_priority: "Prioridad SEO",
  parent_page: "Página padre (opcional)",
  keep: "Conservar",
  remove: "Eliminar",
  redesign: "Rediseñar",
  is_new: "Nueva"
};

export const DOCUMENT_CATEGORY_LABELS = OPTION_COPY;

export function fieldTitle(key: string): string {
  return FIELD_COPY[key]?.title || key;
}

export function fieldHelp(key: string): string | undefined {
  return FIELD_COPY[key]?.help;
}

export function optionLabel(value: string): string {
  return OPTION_COPY[value] || value;
}

export function itemPayloadLabel(key: string): string {
  return ITEM_FIELD_COPY[key] || key;
}

export function unwrapFormValue(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value) && "text" in value) {
    return String((value as { text: unknown }).text ?? "");
  }
  if (Array.isArray(value)) return value.map((item) => String(item)).join(",");
  if (value === undefined || value === null) return "";
  return String(value);
}

export function unwrapFormList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  const text = unwrapFormValue(value).trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item));
    } catch {
      /* ignore */
    }
  }
  return text.split(",").map((item) => item.trim()).filter(Boolean);
}

type ApplicabilityRule = WebProjectFormFieldDef["applicableIf"];

function matchRule(
  rule: ApplicabilityRule,
  values: Map<string, unknown>,
  context: { projectType?: string | null } = {}
): boolean {
  if (!rule) return true;
  if (Array.isArray(rule.all)) return rule.all.every((part) => matchRule(part, values, context));
  if (Array.isArray(rule.any)) return rule.any.some((part) => matchRule(part, values, context));
  if (rule.projectType) {
    const pt = context.projectType || "";
    if (rule.projectType.equals !== undefined) return pt === rule.projectType.equals;
    if (Array.isArray(rule.projectType.in)) return rule.projectType.in.includes(pt);
  }
  if (rule.field) {
    const current = unwrapFormValue(values.get(rule.field));
    const list = unwrapFormList(values.get(rule.field));
    if (rule.equals !== undefined) return current === rule.equals;
    if (Array.isArray(rule.in)) return list.some((item) => rule.in?.includes(item)) || rule.in.includes(current);
    if (rule.contains !== undefined) return list.includes(rule.contains);
    if (rule.minLength) return list.length >= rule.minLength;
  }
  return true;
}

export function isFieldApplicableFromDefinition(
  field: {
    applicableIf?: ApplicabilityRule;
    requiredIf?: ApplicabilityRule;
  },
  values: Map<string, unknown>,
  context: { projectType?: string | null } = {}
): boolean {
  return matchRule(field.applicableIf || field.requiredIf, values, context);
}
