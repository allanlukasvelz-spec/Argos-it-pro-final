const { unwrapValue } = require("./formRuntime");
const { DETAIL_TEMPLATE_PAGE_TYPES } = require("./constants");
const { DETAIL_LABELS } = require("./developmentPlanGenerator");

function activeRows(rows) {
  return (rows || []).filter((r) => !r.archived_at && !r.archivedAt);
}

function sampleItemForPage(page, items) {
  const binding = page.content_binding_type || page.contentBindingType;
  const typeMap = { service: "service", product: "product", tour: "tour", location: "location" };
  const itemType = typeMap[binding];
  if (!itemType) return null;
  const candidates = activeRows(items).filter((i) => (i.item_type || i.itemType) === itemType);
  return candidates[0] || null;
}

function generateValidationChecks(input) {
  const {
    architecturePages,
    architectureBlocks,
    mockupPages,
    mockupSections,
    developmentItems,
    items,
    formValues,
    projectType,
    navigationEntries
  } = input;
  const values = formValues || new Map();
  const salesMode = unwrapValue(values.get("sales_mode"));
  const pages = activeRows(architecturePages);
  const mPages = activeRows(mockupPages);
  const sections = activeRows(mockupSections);
  const devItems = activeRows(developmentItems);
  const checks = [];
  let sort = 0;
  const push = (spec) => {
    checks.push({ ...spec, sort_order: sort++ });
  };

  if (mPages.length) {
    push({
      category: "STRUCTURE",
      title: "Estructura global coherente",
      description: "Header, footer y layout base según maqueta aprobada.",
      required: true,
      severity_if_failed: "HIGH",
      expected_result: "Estructura global implementada o evidencia documentada."
    });
    push({
      category: "VISUAL",
      title: "Dirección visual global",
      description: "Tipografía, colores y espaciado según maqueta aprobada.",
      required: true,
      severity_if_failed: "MEDIUM",
      expected_result: "Coherencia visual con maqueta aprobada."
    });
    push({
      category: "NAVIGATION",
      title: "Navegación principal",
      description: "Menú PRIMARY según arquitectura: presencia, etiquetas y destinos.",
      required: true,
      severity_if_failed: "HIGH",
      expected_result: "Enlaces de navegación principal correctos."
    });
    push({
      category: "NAVIGATION",
      title: "Navegación secundaria y pie",
      description: "SECONDARY, UTILITY y FOOTER según arquitectura.",
      required: false,
      severity_if_failed: "MEDIUM",
      expected_result: "Enlaces secundarios y de pie correctos."
    });
  }

  push({
    category: "RESPONSIVE",
    title: "Responsive desktop (1440px)",
    description: "Sin overflow horizontal; layout principal usable.",
    required: true,
    severity_if_failed: "HIGH",
    expected_result: "Layout usable en 1440px."
  });
  push({
    category: "RESPONSIVE",
    title: "Responsive tablet (768px)",
    description: "Navegación, header/footer y layouts principales.",
    required: true,
    severity_if_failed: "HIGH",
    expected_result: "Layout usable en 768px."
  });
  push({
    category: "RESPONSIVE",
    title: "Responsive mobile (390px)",
    description: "Navegación, CTAs y formularios en mobile.",
    required: true,
    severity_if_failed: "HIGH",
    expected_result: "Layout usable en 390px."
  });
  push({
    category: "ACCESSIBILITY",
    title: "Accesibilidad base",
    description: "Landmarks, headings, teclado, labels y foco visible.",
    required: true,
    severity_if_failed: "HIGH",
    expected_result: "Criterios básicos de accesibilidad cumplidos."
  });
  push({
    category: "SEO",
    title: "SEO técnico base",
    description: "Title, meta description, headings e indexación según arquitectura.",
    required: true,
    severity_if_failed: "MEDIUM",
    expected_result: "Metadatos y estructura SEO presentes."
  });
  push({
    category: "SECURITY",
    title: "Sin secretos expuestos",
    description: "No passwords, tokens ni credenciales en implementación/evidencia.",
    required: true,
    severity_if_failed: "CRITICAL",
    expected_result: "Sin secretos visibles."
  });

  const templateTypesSeen = new Set();
  for (const page of pages) {
    const pageType = page.page_type || page.pageType;
    const templateType = page.template_type || page.templateType;
    const isDetailTemplate =
      templateType === "DETAIL" || DETAIL_TEMPLATE_PAGE_TYPES.includes(pageType);
    const mockPage = mPages.find((mp) => mp.architecture_page_id === page.id);
    const devItem = devItems.find((di) => di.architecture_page_id === page.id);

    if (isDetailTemplate) {
      if (templateTypesSeen.has(pageType)) continue;
      templateTypesSeen.add(pageType);
      const sample = sampleItemForPage(page, items);
      push({
        category: "ROUTING",
        title: `Ruta plantilla ${DETAIL_LABELS[pageType] || pageType}`,
        description: `Ruta dinámica para ${pageType}.`,
        architecture_page_id: page.id,
        mockup_page_id: mockPage?.id || null,
        development_item_id: devItem?.id || null,
        template_group_key: pageType,
        required: true,
        severity_if_failed: "HIGH",
        expected_result: `Ruta de plantilla ${pageType} operativa.`,
        representative_sample_item_id: sample?.id || null
      });
      push({
        category: "CONTENT",
        title: `Contenido plantilla ${DETAIL_LABELS[pageType] || pageType}`,
        description: "Representación con item de muestra; sin duplicar suite por cada item.",
        architecture_page_id: page.id,
        mockup_page_id: mockPage?.id || null,
        development_item_id: devItem?.id || null,
        template_group_key: pageType,
        required: true,
        severity_if_failed: "HIGH",
        expected_result: "Plantilla renderiza datos de muestra correctamente.",
        representative_sample_item_id: sample?.id || null
      });
      push({
        category: "VISUAL",
        title: `Visual plantilla ${DETAIL_LABELS[pageType] || pageType}`,
        description: "Comparación con maqueta aprobada para la plantilla.",
        architecture_page_id: page.id,
        mockup_page_id: mockPage?.id || null,
        template_group_key: pageType,
        required: true,
        severity_if_failed: "MEDIUM",
        expected_result: "Estructura visual coherente con maqueta.",
        representative_sample_item_id: sample?.id || null
      });
      continue;
    }

    push({
      category: "ROUTING",
      title: `Ruta: ${page.title}`,
      description: `Verificar ruta ${page.route || page.slug || "/"}.`,
      architecture_page_id: page.id,
      mockup_page_id: mockPage?.id || null,
      development_item_id: devItem?.id || null,
      required: true,
      severity_if_failed: "HIGH",
      expected_result: `Ruta ${page.route || page.slug} accesible.`
    });
    push({
      category: "CONTENT",
      title: `Contenido: ${page.title}`,
      description: "Contenido requerido presente; placeholders identificados.",
      architecture_page_id: page.id,
      mockup_page_id: mockPage?.id || null,
      required: true,
      severity_if_failed: "MEDIUM",
      expected_result: "Contenido requerido representado o placeholder documentado."
    });
    if (pageType === "HOME") {
      push({
        category: "FUNCTIONAL",
        title: "CTA principal HOME",
        description: "CTA principal presente y enlazado según arquitectura.",
        architecture_page_id: page.id,
        required: true,
        severity_if_failed: "HIGH",
        expected_result: "CTA principal operativo."
      });
    }
  }

  const blocks = activeRows(architectureBlocks);
  if (blocks.some((b) => (b.block_type || b.blockType) === "CONTACT_FORM")) {
    push({
      category: "FORM",
      title: "Formulario de contacto",
      description: "Campos, validación, estados éxito/error y privacidad.",
      required: true,
      severity_if_failed: "HIGH",
      expected_result: "Formulario presente con campos esperados."
    });
  }
  if (
    salesMode === "online_booking" ||
    salesMode === "booking_request" ||
    blocks.some((b) => (b.block_type || b.blockType) === "BOOKING_WIDGET")
  ) {
    push({
      category: "BOOKING",
      title: "Flujo de reservas",
      description: "Punto de entrada, CTA e integración esperada.",
      required: true,
      severity_if_failed: "HIGH",
      expected_result: "Flujo de reservas verificable o NOT_TESTABLE documentado."
    });
  }
  if (salesMode === "online_sales" || salesMode === "online_payment") {
    push({
      category: "ECOMMERCE",
      title: "Catálogo y checkout",
      description: "Catálogo, detalle, carrito y checkout según arquitectura.",
      required: true,
      severity_if_failed: "CRITICAL",
      expected_result: "Flujo ecommerce verificable o NOT_TESTABLE documentado."
    });
  }
  if (unwrapValue(values.get("crm_required")) === "yes") {
    push({
      category: "INTEGRATION",
      title: "Integración CRM",
      description: "Touchpoint y flujo de datos desde formularios.",
      required: false,
      severity_if_failed: "MEDIUM",
      expected_result: "Integración documentada o NOT_TESTABLE."
    });
  }
  if (unwrapValue(values.get("analytics_required")) === "yes") {
    push({
      category: "ANALYTICS",
      title: "Analítica web",
      description: "Configuración y consentimiento según brief.",
      required: false,
      severity_if_failed: "LOW",
      expected_result: "Tracking configurado o NOT_TESTABLE."
    });
  }

  for (const lp of pages.filter((p) => (p.page_type || p.pageType) === "LEGAL")) {
    push({
      category: "LEGAL",
      title: `Página legal: ${lp.title}`,
      description: "Documento/página requerida presente (no validación jurídica).",
      architecture_page_id: lp.id,
      required: true,
      severity_if_failed: "HIGH",
      expected_result: "Página legal presente."
    });
  }

  if (unwrapValue(values.get("languages_multilingual")) === "yes") {
    push({
      category: "CONTENT",
      title: "Multilingüe",
      description: "Selector de idioma, rutas y traducciones obligatorias.",
      required: true,
      severity_if_failed: "HIGH",
      expected_result: "Idiomas configurados según arquitectura."
    });
  }

  push({
    category: "PERFORMANCE",
    title: "Rendimiento base",
    description: "Medios optimizados y carga razonable.",
    required: false,
    severity_if_failed: "LOW",
    expected_result: "Sin problemas obvios de rendimiento."
  });

  if (projectType === "improve") {
    for (const rp of pages.filter(
      (p) => (p.migration_disposition || p.migrationDisposition) === "REDIRECT"
    )) {
      push({
        category: "REDIRECT",
        title: `Redirección: ${rp.title}`,
        description: `Disposición REDIRECT para ${rp.route || rp.slug}.`,
        architecture_page_id: rp.id,
        required: true,
        severity_if_failed: "HIGH",
        expected_result: "Redirección planificada/implementada según arquitectura."
      });
    }
  }

  if (navigationEntries?.length) {
    for (const nav of navigationEntries.filter((n) => !n.archived_at)) {
      if ((nav.placement || nav.nav_placement) === "HIDDEN") continue;
      push({
        category: "NAVIGATION",
        title: `Nav: ${nav.label || nav.title}`,
        description: `Destino ${nav.target_route || nav.route || "—"}.`,
        source_type: "navigation",
        source_id: nav.id,
        required: false,
        severity_if_failed: "MEDIUM",
        expected_result: "Enlace de navegación correcto."
      });
    }
  }

  return checks;
}

module.exports = {
  generateValidationChecks,
  sampleItemForPage,
  activeRows
};
