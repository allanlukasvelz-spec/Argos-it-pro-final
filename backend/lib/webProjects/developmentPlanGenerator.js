const { unwrapValue } = require("./formRuntime");
const { DETAIL_TEMPLATE_PAGE_TYPES, CONTENT_READINESS_STATES } = require("./constants");

const DETAIL_LABELS = {
  SERVICE_DETAIL: "Servicio (plantilla)",
  PRODUCT_DETAIL: "Producto (plantilla)",
  TOUR_DETAIL: "Actividad (plantilla)",
  LOCATION_DETAIL: "Ubicación (plantilla)"
};

function activeRows(rows) {
  return (rows || []).filter((r) => !r.archived_at && !r.archivedAt);
}

function contentReadinessForPage(page, items) {
  const binding = page.content_binding_type || page.contentBindingType;
  if (!binding || binding === "none") return "NOT_APPLICABLE";
  const typeMap = { service: "service", product: "product", tour: "tour", location: "location", page: "page" };
  const itemType = typeMap[binding];
  if (!itemType) return "PARTIAL";
  const count = activeRows(items).filter((i) => (i.item_type || i.itemType) === itemType).length;
  if (count === 0) return "MISSING";
  if (page.content_readiness === "READY" || page.contentReadiness === "READY") return "READY";
  return "PARTIAL";
}

function checklistForMockupPage(mockPage, sections) {
  return activeRows(sections)
    .filter((s) => s.mockup_page_id === mockPage.id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((s, idx) => ({
      label: s.section_type || s.sectionType,
      required: Boolean(s.required),
      completed: false,
      sort_order: idx
    }));
}

function acceptanceForPage(page) {
  const pageType = page.page_type || page.pageType;
  const criteria = [
    "La ruta coincide con la arquitectura aprobada",
    "Las secciones requeridas están representadas en la maqueta",
    "CTA principal presente si aplica",
    "Revisión responsive (desktop/tablet/mobile)",
    "Revisión de accesibilidad básica",
    "Estado de contenido documentado"
  ];
  if (pageType.includes("DETAIL")) {
    criteria.push("Plantilla dinámica implementada una sola vez");
  }
  return criteria;
}

function generateDevelopmentPlan(input) {
  const {
    architecturePages,
    architectureBlocks,
    mockupPages,
    mockupSections,
    items,
    documents,
    formValues,
    projectType
  } = input;
  const values = formValues || new Map();
  const salesMode = unwrapValue(values.get("sales_mode"));
  const pages = activeRows(architecturePages);
  const mPages = activeRows(mockupPages);
  const sections = activeRows(mockupSections);
  const workItems = [];
  let sort = 0;
  const push = (spec) => {
    workItems.push({ ...spec, sort_order: sort++ });
  };

  push({
    item_type: "PROJECT_SETUP",
    title: "Configuración inicial del proyecto",
    description: "Entorno, repositorio y convenciones de implementación.",
    priority: "HIGH",
    required: true,
    content_readiness: "NOT_APPLICABLE"
  });
  if (mPages.length) {
    push({
      item_type: "GLOBAL_STYLES",
      title: "Estilos globales y tokens",
      description: "Implementar dirección visual y design tokens aprobados.",
      priority: "HIGH",
      required: true,
      content_readiness: "PARTIAL"
    });
    push({
      item_type: "HEADER",
      title: "Cabecera global",
      description: "Implementar variante de header aprobada en maqueta.",
      priority: "HIGH",
      required: true,
      content_readiness: "NOT_APPLICABLE"
    });
    push({
      item_type: "FOOTER",
      title: "Pie global",
      description: "Implementar variante de footer aprobada en maqueta.",
      priority: "MEDIUM",
      required: true,
      content_readiness: "NOT_APPLICABLE"
    });
  }

  const templateTypesSeen = new Set();
  for (const page of pages) {
    const pageType = page.page_type || page.pageType;
    const templateType = page.template_type || page.templateType;
    const isDetailTemplate =
      templateType === "DETAIL" || DETAIL_TEMPLATE_PAGE_TYPES.includes(pageType);
    if (isDetailTemplate) {
      const key = pageType;
      if (templateTypesSeen.has(key)) continue;
      templateTypesSeen.add(key);
      const mockPage = mPages.find((mp) => mp.architecture_page_id === page.id);
      push({
        item_type: "TEMPLATE",
        title: `Plantilla: ${DETAIL_LABELS[pageType] || page.title}`,
        description: `Implementar UNA plantilla para ${pageType}. Los items de contenido son datos, no tareas duplicadas.`,
        architecture_page_id: page.id,
        mockup_page_id: mockPage?.id || null,
        priority: "HIGH",
        required: true,
        content_readiness: contentReadinessForPage(page, items),
        checklist: mockPage ? checklistForMockupPage(mockPage, sections) : [],
        acceptanceCriteria: acceptanceForPage(page)
      });
      continue;
    }
    const mockPage = mPages.find((mp) => mp.architecture_page_id === page.id);
    push({
      item_type: "PAGE",
      title: `Página: ${page.title}`,
      description: page.purpose || page.summary || `Implementar ${page.route || page.slug}`,
      architecture_page_id: page.id,
      mockup_page_id: mockPage?.id || null,
      priority: page.seo_priority === "HIGH" ? "HIGH" : "MEDIUM",
      required: true,
      content_readiness: contentReadinessForPage(page, items),
      checklist: mockPage ? checklistForMockupPage(mockPage, sections) : [],
      acceptanceCriteria: acceptanceForPage(page)
    });
  }

  const blocks = activeRows(architectureBlocks);
  if (blocks.some((b) => (b.block_type || b.blockType) === "CONTACT_FORM")) {
    push({
      item_type: "FORM",
      title: "Formulario de contacto",
      description: "Implementar formulario visual; destino y privacidad según brief.",
      priority: "HIGH",
      required: true,
      content_readiness: "PARTIAL"
    });
  }
  if (
    salesMode === "online_booking" ||
    salesMode === "booking_request" ||
    blocks.some((b) => (b.block_type || b.blockType) === "BOOKING_WIDGET")
  ) {
    push({
      item_type: "INTEGRATION",
      title: "Integración de reservas (planificación)",
      description: "Registrar proveedor, páginas afectadas y requisitos de credenciales. Sin implementación real.",
      priority: "HIGH",
      required: true,
      content_readiness: "MISSING"
    });
  }
  if (salesMode === "online_sales" || salesMode === "online_payment") {
    push({
      item_type: "INTEGRATION",
      title: "Integración ecommerce (planificación)",
      description: "Catálogo, detalle, carrito y checkout según arquitectura. Sin implementación real.",
      priority: "HIGH",
      required: true,
      content_readiness: "MISSING"
    });
  }
  if (unwrapValue(values.get("crm_required")) === "yes") {
    push({
      item_type: "INTEGRATION",
      title: "Integración CRM (planificación)",
      description: "Flujo de datos desde formularios. Sin conexión real.",
      priority: "MEDIUM",
      required: false,
      content_readiness: "MISSING"
    });
  }
  if (unwrapValue(values.get("analytics_required")) === "yes") {
    push({
      item_type: "ANALYTICS",
      title: "Analítica web",
      description: "Proveedor y requisitos de consentimiento según brief.",
      priority: "MEDIUM",
      required: false,
      content_readiness: "PARTIAL"
    });
  }

  const legalPages = pages.filter((p) => (p.page_type || p.pageType) === "LEGAL");
  for (const lp of legalPages) {
    push({
      item_type: "LEGAL",
      title: `Legal: ${lp.title}`,
      description: "Implementar página legal; contenido puede estar pendiente.",
      architecture_page_id: lp.id,
      priority: "MEDIUM",
      required: true,
      content_readiness: "MISSING"
    });
  }

  push({
    item_type: "SEO",
    title: "Implementación SEO técnica",
    description: "Metadatos, estructura de headings, canonical e indexación según arquitectura.",
    priority: "MEDIUM",
    required: true,
    content_readiness: "NOT_APPLICABLE"
  });
  push({
    item_type: "RESPONSIVE",
    title: "Validación responsive",
    description: "Desktop, tablet y mobile según maqueta aprobada.",
    priority: "HIGH",
    required: true,
    content_readiness: "NOT_APPLICABLE"
  });
  push({
    item_type: "ACCESSIBILITY",
    title: "Validación de accesibilidad",
    description: "Estructura semántica, teclado, labels, foco y contraste.",
    priority: "HIGH",
    required: true,
    content_readiness: "NOT_APPLICABLE"
  });
  push({
    item_type: "PERFORMANCE",
    title: "Preparación de rendimiento",
    description: "Optimización básica de imágenes y carga.",
    priority: "LOW",
    required: false,
    content_readiness: "NOT_APPLICABLE"
  });

  if (projectType === "improve") {
    const redirects = pages.filter(
      (p) => (p.migration_disposition || p.migrationDisposition) === "REDIRECT"
    );
    for (const rp of redirects) {
      push({
        item_type: "REDIRECT",
        title: `Redirección: ${rp.title}`,
        description: `Planificar ${rp.route || rp.slug} → destino acordado.`,
        architecture_page_id: rp.id,
        priority: "MEDIUM",
        required: true,
        content_readiness: "NOT_APPLICABLE"
      });
    }
  }

  const globalStylesIdx = workItems.findIndex((w) => w.item_type === "GLOBAL_STYLES");
  if (globalStylesIdx >= 0) {
    for (const item of workItems) {
      if (item.item_type === "PAGE" || item.item_type === "TEMPLATE") {
        item.dependsOnGlobalStyles = true;
      }
    }
  }

  return workItems;
}

module.exports = {
  generateDevelopmentPlan,
  contentReadinessForPage,
  checklistForMockupPage,
  DETAIL_LABELS
};
