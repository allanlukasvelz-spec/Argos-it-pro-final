const { asList, unwrapValue, isFilled } = require("./formRuntime");
const { DYNAMIC_SLUG, normalizePageSlug } = require("./architectureRouteUtils");

let tempSeq = 1;

function nextTempId() {
  tempSeq += 1;
  return `tmp-${tempSeq}`;
}

function resetTempSeq() {
  tempSeq = 1;
}

function activeItems(items) {
  return (items || []).filter((item) => !item.archived_at && !item.archivedAt);
}

function countType(items, type) {
  return activeItems(items).filter((item) => (item.item_type || item.itemType) === type).length;
}

function pageItems(items) {
  return activeItems(items).filter((item) => (item.item_type || item.itemType) === "page");
}

function hasAboutSignal(values) {
  return (
    isFilled(values.get("about_who")) ||
    isFilled(values.get("about_what_you_do")) ||
    isFilled(values.get("about_history")) ||
    isFilled(values.get("about_mission")) ||
    isFilled(values.get("about_values")) ||
    isFilled(values.get("about_differentiation"))
  );
}

function legalRequirements(values) {
  const reqs = [];
  if (unwrapValue(values.get("legal_notice")) === "yes") reqs.push({ key: "notice", title: "Aviso legal", slug: "aviso-legal" });
  if (unwrapValue(values.get("legal_privacy")) === "yes") reqs.push({ key: "privacy", title: "Política de privacidad", slug: "privacidad" });
  if (unwrapValue(values.get("legal_cookies")) === "yes") reqs.push({ key: "cookies", title: "Política de cookies", slug: "cookies" });
  if (unwrapValue(values.get("legal_contract")) === "yes") reqs.push({ key: "terms", title: "Términos y condiciones", slug: "terminos" });
  if (unwrapValue(values.get("legal_booking_terms")) === "yes") reqs.push({ key: "booking", title: "Condiciones de reserva", slug: "condiciones-reserva" });
  if (unwrapValue(values.get("legal_ecommerce_terms")) === "yes") reqs.push({ key: "ecommerce", title: "Condiciones de compra", slug: "condiciones-compra" });
  return reqs;
}

function conversionFromSalesMode(salesMode) {
  if (salesMode === "online_sales" || salesMode === "online_payment") return "PURCHASE";
  if (salesMode === "booking_request" || salesMode === "online_booking") return "BOOKING";
  if (salesMode === "quote_request") return "QUOTE";
  if (salesMode === "phone_call") return "CALL";
  return "CONTACT";
}

function defaultBlocksForPage(pageType, context) {
  const blocks = [];
  const push = (block_type, purpose, extra = {}) => {
    blocks.push({ block_type, purpose, sort_order: blocks.length, required: false, ...extra });
  };
  if (pageType === "HOME") {
    push("HERO", "Presentar la propuesta principal y orientar la conversión.");
    if (context.serviceCount > 0) push("SERVICE_GRID", "Mostrar servicios destacados.", { content_source_type: "service" });
    if (context.productCount > 0) push("PRODUCT_GRID", "Mostrar productos destacados.", { content_source_type: "product" });
    if (context.tourCount > 0) push("TOUR_GRID", "Mostrar actividades destacadas.", { content_source_type: "tour" });
    if (context.about) push("INTRO", "Resumir quién es la organización.");
    push("CTA", "Impulsar la acción principal de conversión.");
    push("CONTACT_FORM", "Facilitar contacto directo.", { required: context.leadRequired });
  } else if (pageType === "SERVICE_INDEX") {
    push("HERO", "Introducir el catálogo de servicios.");
    push("SERVICE_GRID", "Listar servicios.", { content_source_type: "service", required: true });
  } else if (pageType === "SERVICE_DETAIL") {
    push("HERO", "Presentar el servicio.");
    push("SERVICE_DETAIL", "Detalle del servicio.", { content_source_type: "service", required: true });
    push("BENEFITS", "Explicar beneficios si el contenido lo permite.");
    push("PROCESS", "Describir el proceso si aplica.");
    push("CTA", "Llevar a solicitud o contacto.");
  } else if (pageType === "PRODUCT_INDEX") {
    push("HERO", "Introducir el catálogo de productos.");
    push("PRODUCT_GRID", "Listar productos.", { content_source_type: "product", required: true });
  } else if (pageType === "PRODUCT_DETAIL") {
    push("HERO", "Presentar el producto.");
    push("PRODUCT_DETAIL", "Detalle del producto.", { content_source_type: "product", required: true });
    push("FEATURES", "Destacar características si existen.");
    if (context.ecommerce) push("ECOMMERCE_ACTION", "Acción de compra.", { required: true });
    else push("CTA", "Solicitar información o compra asistida.");
  } else if (pageType === "TOUR_INDEX") {
    push("HERO", "Introducir actividades o tours.");
    push("TOUR_GRID", "Listar actividades.", { content_source_type: "tour", required: true });
  } else if (pageType === "TOUR_DETAIL") {
    push("HERO", "Presentar la actividad.");
    push("TOUR_DETAIL", "Detalle de la actividad.", { content_source_type: "tour", required: true });
    push("FEATURES", "Incluir información clave del tour.");
    push("GALLERY", "Mostrar material visual si existe.");
    push("MAP", "Ubicación o punto de encuentro si aplica.");
    if (context.bookingRequired) push("BOOKING_WIDGET", "Canal de reserva.", { required: true });
    else push("CTA", "Canal de contacto o solicitud.");
  } else if (pageType === "ABOUT") {
    push("HERO", "Presentar la organización.");
    push("INTRO", "Quiénes somos y qué hacemos.");
    if (context.teamCount >= 3) push("TEAM_GRID", "Mostrar equipo.", { content_source_type: "team_member" });
  } else if (pageType === "CONTACT") {
    push("HERO", "Facilitar contacto.");
    push("CONTACT_FORM", "Formulario de contacto.", { required: context.leadRequired });
    if (context.locationCount > 0) push("LOCATIONS", "Datos de sedes.", { content_source_type: "location" });
    push("MAP", "Mapa si hay ubicaciones.");
  } else if (pageType === "FAQ") {
    push("HERO", "Resolver dudas frecuentes.");
    push("FAQ", "Preguntas frecuentes.", { required: true });
  } else if (pageType === "LEGAL") {
    push("LEGAL_TEXT", "Texto legal pendiente de redacción/aprobación.", { required: true });
  } else if (pageType === "LOCATIONS") {
    push("HERO", "Presentar sedes.");
    push("LOCATIONS", "Listado de ubicaciones.", { content_source_type: "location", required: true });
  }
  return blocks;
}

function makePage(spec, sortBase) {
  return {
    tempId: nextTempId(),
    title: spec.title,
    slug: spec.slug,
    route: spec.route || null,
    page_type: spec.pageType,
    template_type: spec.templateType,
    parent_temp_id: spec.parentTempId || null,
    parent_page_id: spec.parentPageId || null,
    sort_order: sortBase + (spec.sortOffset || 0),
    navigation_placement: spec.navigation || "NONE",
    navigation_label: spec.navLabel || null,
    purpose: spec.purpose || null,
    summary: spec.summary || null,
    primary_cta: spec.primaryCta || null,
    secondary_cta: spec.secondaryCta || null,
    seo_priority: spec.seo || "MEDIUM",
    content_readiness: spec.contentReadiness || "PARTIAL",
    content_binding_type: spec.bindingType || null,
    content_binding_mode: spec.bindingMode || null,
    source_page_item_id: spec.sourcePageItemId || null,
    migration_disposition: spec.disposition || null,
    entity_count: spec.entityCount ?? null,
    archived_at: null
  };
}

function generateStarterArchitecture(input) {
  resetTempSeq();
  const { project, values, items, brief } = input;
  const offerKinds = asList(values.get("offer_kinds"));
  const salesMode = unwrapValue(values.get("sales_mode"));
  const ecommerce =
    unwrapValue(values.get("needs_ecommerce")) === "yes" ||
    salesMode === "online_sales" ||
    salesMode === "online_payment";
  const multilingual = unwrapValue(values.get("languages_multilingual")) === "yes";
  const primaryLanguage = unwrapValue(values.get("primary_language")) || "es";
  const additionalLanguages = multilingual && isFilled(values.get("languages_list"))
    ? asList(values.get("languages_list"))
    : [];

  const serviceCount = countType(items, "service");
  const productCount = countType(items, "product");
  const tourCount = countType(items, "tour");
  const teamCount = countType(items, "team_member");
  const locationCount = countType(items, "location");
  const hasServices = offerKinds.includes("services") || serviceCount > 0;
  const hasProducts = offerKinds.includes("products") || productCount > 0;
  const hasTours = offerKinds.includes("experiences") || tourCount > 0;
  const leadRequired = ["contact_forms", "quote_request", "catalog_only"].includes(salesMode) || !ecommerce;
  const bookingRequired = salesMode === "booking_request" || salesMode === "online_booking";
  const conversionType = conversionFromSalesMode(salesMode);

  const pages = [];
  const blocks = [];
  const warnings = [];
  let sort = 0;

  const home = makePage(
    {
      title: "Inicio",
      slug: "",
      pageType: "HOME",
      templateType: "SYSTEM",
      navigation: "PRIMARY",
      navLabel: "Inicio",
      purpose: "Página principal y punto de entrada.",
      seo: "HIGH",
      primaryCta: leadRequired ? "Contactar" : ecommerce ? "Comprar" : bookingRequired ? "Reservar" : "Contactar"
    },
    sort++
  );
  pages.push(home);

  const ctx = {
    serviceCount,
    productCount,
    tourCount,
    teamCount,
    locationCount,
    about: hasAboutSignal(values),
    ecommerce,
    bookingRequired,
    leadRequired
  };

  if (hasAboutSignal(values) || teamCount > 0) {
    pages.push(
      makePage(
        {
          title: "Nosotros",
          slug: "nosotros",
          pageType: "ABOUT",
          templateType: "UNIQUE",
          navigation: "PRIMARY",
          navLabel: "Nosotros",
          purpose: "Presentar la organización, historia y equipo.",
          seo: "MEDIUM"
        },
        sort++
      )
    );
  }

  if (hasServices) {
    if (serviceCount === 1) {
      pages.push(
        makePage(
          {
            title: "Servicios",
            slug: "servicios",
            pageType: "SERVICE_INDEX",
            templateType: "UNIQUE",
            navigation: "PRIMARY",
            navLabel: "Servicios",
            purpose: "Presentar el servicio principal.",
            bindingType: "service",
            bindingMode: "single",
            entityCount: 1,
            seo: "HIGH"
          },
          sort++
        )
      );
    } else {
      const idx = makePage(
        {
          title: "Servicios",
          slug: "servicios",
          pageType: "SERVICE_INDEX",
          templateType: "INDEX",
          navigation: "PRIMARY",
          navLabel: "Servicios",
          purpose: "Índice de servicios.",
          bindingType: "service",
          bindingMode: "collection",
          entityCount: serviceCount,
          seo: "HIGH"
        },
        sort++
      );
      pages.push(idx);
      pages.push(
        makePage(
          {
            title: "Servicio",
            slug: DYNAMIC_SLUG,
            pageType: "SERVICE_DETAIL",
            templateType: "DETAIL",
            parentTempId: idx.tempId,
            navigation: "HIDDEN",
            purpose: "Plantilla de detalle por servicio.",
            bindingType: "service",
            bindingMode: "detail",
            entityCount: serviceCount,
            seo: "MEDIUM"
          },
          sort++
        )
      );
    }
  }

  if (hasProducts) {
    const idx = makePage(
      {
        title: "Productos",
        slug: "productos",
        pageType: "PRODUCT_INDEX",
        templateType: productCount === 1 ? "UNIQUE" : "INDEX",
        navigation: "PRIMARY",
        navLabel: "Productos",
        purpose: productCount === 1 ? "Presentar el producto." : "Índice de productos.",
        bindingType: "product",
        bindingMode: productCount === 1 ? "single" : "collection",
        entityCount: productCount,
        seo: "HIGH"
      },
      sort++
    );
    pages.push(idx);
    if (productCount > 1) {
      pages.push(
        makePage(
          {
            title: "Producto",
            slug: DYNAMIC_SLUG,
            pageType: "PRODUCT_DETAIL",
            templateType: "DETAIL",
            parentTempId: idx.tempId,
            navigation: "HIDDEN",
            purpose: "Plantilla de detalle por producto.",
            bindingType: "product",
            bindingMode: "detail",
            entityCount: productCount,
            seo: "MEDIUM"
          },
          sort++
        )
      );
    }
  }

  if (hasTours) {
    const idx = makePage(
      {
        title: tourCount === 1 ? "Actividad" : "Actividades",
        slug: "actividades",
        pageType: "TOUR_INDEX",
        templateType: tourCount === 1 ? "UNIQUE" : "INDEX",
        navigation: "PRIMARY",
        navLabel: "Actividades",
        purpose: tourCount === 1 ? "Presentar la actividad." : "Índice de actividades o tours.",
        bindingType: "tour",
        bindingMode: tourCount === 1 ? "single" : "collection",
        entityCount: tourCount,
        seo: "HIGH",
        primaryCta: bookingRequired ? "Reservar" : "Contactar"
      },
      sort++
    );
    pages.push(idx);
    if (tourCount > 1) {
      pages.push(
        makePage(
          {
            title: "Actividad",
            slug: DYNAMIC_SLUG,
            pageType: "TOUR_DETAIL",
            templateType: "DETAIL",
            parentTempId: idx.tempId,
            navigation: "HIDDEN",
            purpose: "Plantilla de detalle por actividad.",
            bindingType: "tour",
            bindingMode: "detail",
            entityCount: tourCount,
            seo: "MEDIUM",
            primaryCta: bookingRequired ? "Reservar" : "Solicitar información"
          },
          sort++
        )
      );
    }
  }

  if (teamCount >= 3 && !hasAboutSignal(values)) {
    pages.push(
      makePage(
        {
          title: "Equipo",
          slug: "equipo",
          pageType: "TEAM",
          templateType: "UNIQUE",
          navigation: "SECONDARY",
          purpose: "Presentar al equipo.",
          bindingType: "team_member",
          bindingMode: "collection",
          entityCount: teamCount,
          seo: "LOW"
        },
        sort++
      )
    );
  }

  if (locationCount > 1) {
    pages.push(
      makePage(
        {
          title: "Sedes",
          slug: "sedes",
          pageType: "LOCATIONS",
          templateType: "UNIQUE",
          navigation: "FOOTER",
          purpose: "Listar ubicaciones.",
          bindingType: "location",
          bindingMode: "collection",
          entityCount: locationCount,
          seo: "LOW"
        },
        sort++
      )
    );
  }

  const faqAvailable =
    unwrapValue(values.get("content_has_faq")) === "yes" ||
    activeItems(items).some((item) => (item.payload?.category || "") === "faq");
  if (faqAvailable) {
    pages.push(
      makePage(
        {
          title: "Preguntas frecuentes",
          slug: "faq",
          pageType: "FAQ",
          templateType: "UNIQUE",
          navigation: "FOOTER",
          navLabel: "FAQ",
          purpose: "Resolver dudas frecuentes.",
          seo: "MEDIUM"
        },
        sort++
      )
    );
  }

  pages.push(
    makePage(
      {
        title: "Contacto",
        slug: "contacto",
        pageType: "CONTACT",
        templateType: "UNIQUE",
        navigation: "PRIMARY",
        navLabel: "Contacto",
        purpose: "Canal principal de contacto y conversión.",
        seo: "HIGH",
        primaryCta: conversionType === "QUOTE" ? "Solicitar presupuesto" : "Contactar"
      },
      sort++
    )
  );

  const legal = legalRequirements(values);
  if (legal.length > 0) {
    const legalParent = makePage(
      {
        title: "Legal",
        slug: "legal",
        pageType: "LEGAL",
        templateType: "INDEX",
        navigation: "FOOTER",
        navLabel: "Legal",
        purpose: "Agrupar páginas legales.",
        seo: "LOW"
      },
      sort++
    );
    pages.push(legalParent);
    legal.forEach((row, index) => {
      pages.push(
        makePage(
          {
            title: row.title,
            slug: row.slug,
            pageType: "LEGAL",
            templateType: "LEGAL",
            parentTempId: legalParent.tempId,
            navigation: "FOOTER",
            navLabel: row.title,
            purpose: `Página legal: ${row.title}.`,
            seo: "LOW"
          },
          sort + index + 1
        )
      );
    });
    sort += legal.length + 1;
  }

  for (const item of pageItems(items)) {
    const payload = item.payload || {};
    const slug = normalizePageSlug(payload.slug || item.title);
    if (!slug) {
      warnings.push({ code: "PAGE_ITEM_INVALID_SLUG", itemId: item.id, title: item.title });
      continue;
    }
    const duplicate = pages.some((p) => p.slug === slug && p.page_type !== "HOME");
    if (duplicate) {
      warnings.push({ code: "PAGE_ITEM_DUPLICATE", itemId: item.id, slug });
      continue;
    }
    pages.push(
      makePage(
        {
          title: item.title || "Página personalizada",
          slug,
          pageType: "CUSTOM",
          templateType: "UNIQUE",
          navigation: "SECONDARY",
          purpose: payload.purpose || "Página solicitada por el cliente.",
          sourcePageItemId: item.id,
          bindingType: "page",
          bindingMode: "single",
          disposition: payload.keep ? "KEEP" : payload.redesign ? "REDESIGN" : payload.remove ? "REMOVE" : payload.is_new ? "REDESIGN" : null,
          seo: payload.seo_priority || "MEDIUM"
        },
        sort++
      )
    );
  }

  const tempToReal = new Map();
  for (const page of pages) {
    if (page.parent_temp_id) {
      page._pendingParentTemp = page.parent_temp_id;
    }
  }

  for (const page of pages) {
    const pageBlocks = defaultBlocksForPage(page.page_type, ctx);
    page._blocks = pageBlocks.map((block, index) => ({
      ...block,
      sort_order: index,
      tempPageId: page.tempId
    }));
  }

  const conversionPaths = [];
  if (leadRequired || bookingRequired || ecommerce) {
    conversionPaths.push({
      type: conversionType,
      originPageType: bookingRequired && hasTours ? "TOUR_DETAIL" : "CONTACT",
      cta: bookingRequired ? "Reservar" : conversionType === "QUOTE" ? "Solicitar presupuesto" : "Contactar",
      destination: bookingRequired ? "booking_provider" : "contact_form"
    });
  }

  const contentCoverage = {
    services: { count: serviceCount, index: hasServices, detailTemplate: hasServices && serviceCount > 1 },
    products: { count: productCount, index: hasProducts, detailTemplate: hasProducts && productCount > 1 },
    tours: { count: tourCount, index: hasTours, detailTemplate: hasTours && tourCount > 1 },
    team: { count: teamCount, usedInAbout: hasAboutSignal(values) || teamCount >= 3 },
    locations: { count: locationCount, locationsPage: locationCount > 1, inContact: locationCount <= 1 }
  };

  return {
    architecture: {
      version: 1,
      status: "DRAFT",
      primary_language: primaryLanguage,
      additional_languages: additionalLanguages,
      language_selector_required: multilingual,
      metadata: {
        conversionPaths,
        contentCoverage,
        generationWarnings: warnings
      }
    },
    pages,
    blocks: pages.flatMap((p) => p._blocks || []),
    warnings
  };
}

module.exports = {
  generateStarterArchitecture,
  resetTempSeq,
  legalRequirements,
  conversionFromSalesMode
};
