const { asList, unwrapValue } = require("./formRuntime");
const {
  pageIdOf,
  parentIdOf,
  pageTypeOf,
  templateTypeOf,
  slugOf,
  isValidSlug,
  isDynamicDetail,
  detectCycle,
  findDuplicateRoutes,
  countHomes,
  recalculateRoutes
} = require("./architectureRouteUtils");

function validateArchitecture(input) {
  const errors = [];
  const warnings = [];
  const { architecture, pages, blocks, values, notes, brief } = input;
  const activePages = (pages || []).filter((p) => !p.archived_at && !p.archivedAt);
  const activeBlocks = (blocks || []).filter((b) => !b.archived_at && !b.archivedAt);
  const pagesById = new Map(activePages.map((p) => [pageIdOf(p), p]));

  const homeCount = countHomes(activePages);
  if (homeCount === 0) errors.push({ code: "NO_HOME", message: "La arquitectura debe incluir exactamente una página de inicio." });
  if (homeCount > 1) errors.push({ code: "MULTIPLE_HOME", message: "Solo puede existir una página de inicio." });

  for (const page of activePages) {
    const id = pageIdOf(page);
    const home = pageTypeOf(page) === "HOME";
    const dynamic = isDynamicDetail(page);
    const slug = slugOf(page);
    if (!isValidSlug(slug, { home, dynamic })) {
      errors.push({ code: "INVALID_SLUG", pageId: id, message: `Slug no válido en «${page.title}».` });
    }
    const parentId = parentIdOf(page);
    if (parentId && Number(parentId) === Number(id)) {
      errors.push({ code: "SELF_PARENT", pageId: id, message: "Una página no puede ser su propio superior." });
    }
    if (parentId && detectCycle(id, parentId, pagesById)) {
      errors.push({ code: "CYCLE", pageId: id, message: "Jerarquía circular detectada." });
    }
    if (parentId) {
      const parent = pagesById.get(Number(parentId));
      if (!parent) {
        errors.push({ code: "INVALID_PARENT", pageId: id, message: "Página superior no válida." });
      } else if ((parent.architecture_id || parent.architectureId) !== (page.architecture_id || page.architectureId)) {
        errors.push({ code: "CROSS_ARCHITECTURE_PARENT", pageId: id, message: "El superior pertenece a otra arquitectura." });
      }
    }
    if (!page.purpose || !String(page.purpose).trim()) {
      warnings.push({ code: "MISSING_PURPOSE", pageId: id, message: `Falta objetivo en «${page.title}».` });
    }
    if (!page.seo_priority && !page.seoPriority) {
      warnings.push({ code: "MISSING_SEO", pageId: id, message: `Prioridad SEO no definida en «${page.title}».` });
    }
  }

  const routed = recalculateRoutes(activePages);
  for (const dup of findDuplicateRoutes(routed)) {
    errors.push({
      code: "DUPLICATE_ROUTE",
      route: dup.route,
      pageIds: dup.pageIds,
      message: `Ruta duplicada: ${dup.route}`
    });
  }

  const salesMode = unwrapValue(values?.get?.("sales_mode"));
  const ecommerce =
    unwrapValue(values?.get?.("needs_ecommerce")) === "yes" ||
    salesMode === "online_sales" ||
    salesMode === "online_payment";
  const bookingRequired = salesMode === "booking_request" || salesMode === "online_booking";
  const leadRequired = ["contact_forms", "quote_request", "catalog_only", "phone_call"].includes(salesMode);

  const metadata = architecture?.metadata || {};
  const conversionPaths = metadata.conversionPaths || [];
  const hasBookingPath = conversionPaths.some((p) => p.type === "BOOKING") ||
    activePages.some((p) => pageTypeOf(p) === "TOUR_DETAIL" && (p.primary_cta || p.primaryCta));
  const hasPurchasePath = conversionPaths.some((p) => p.type === "PURCHASE") ||
    activePages.some((p) => pageTypeOf(p) === "PRODUCT_DETAIL" && activeBlocks.some((b) => b.block_type === "ECOMMERCE_ACTION" || b.blockType === "ECOMMERCE_ACTION"));
  const hasLeadPath = conversionPaths.some((p) => ["CONTACT", "QUOTE", "CALL"].includes(p.type)) ||
    activePages.some((p) => pageTypeOf(p) === "CONTACT") ||
    activeBlocks.some((b) => ["CONTACT_FORM", "QUOTE_FORM"].includes(b.block_type || b.blockType));

  if (bookingRequired && !hasBookingPath) {
    errors.push({ code: "BOOKING_PATH_MISSING", message: "Se requiere reserva pero no hay ruta de conversión de booking." });
  }
  if (ecommerce && !hasPurchasePath) {
    errors.push({ code: "PURCHASE_PATH_MISSING", message: "Se requiere ecommerce pero no hay ruta de compra." });
  }
  if (leadRequired && !hasLeadPath) {
    errors.push({ code: "LEAD_PATH_MISSING", message: "Se requiere generación de leads pero no hay contacto o presupuesto." });
  }

  const multilingual = unwrapValue(values?.get?.("languages_multilingual")) === "yes";
  if (multilingual && !architecture?.language_selector_required && !architecture?.languageSelectorRequired) {
    errors.push({ code: "MULTILINGUAL_STRATEGY", message: "Proyecto multilingüe sin estrategia de idiomas en arquitectura." });
  }

  const legalNeeded = ["legal_notice", "legal_privacy", "legal_cookies"].some(
    (key) => unwrapValue(values?.get?.(key)) === "yes"
  );
  if (legalNeeded) {
    const legalPages = activePages.filter((p) => pageTypeOf(p) === "LEGAL");
    if (legalPages.length === 0) {
      errors.push({ code: "LEGAL_MISSING", message: "Faltan páginas legales requeridas." });
    }
  }

  const openBlocking = (notes || []).filter(
    (n) =>
      (n.note_type || n.noteType) === "DECISION_REQUIRED" &&
      (n.status || "OPEN") === "OPEN" &&
      Boolean(n.blocking)
  );
  if (openBlocking.length > 0) {
    errors.push({
      code: "BLOCKING_DECISION",
      message: "Hay decisiones bloqueantes abiertas.",
      noteIds: openBlocking.map((n) => n.id)
    });
  }

  for (const block of activeBlocks) {
    const pageId = block.architecture_page_id || block.architecturePageId;
    if (!pagesById.has(Number(pageId))) {
      errors.push({ code: "ORPHAN_BLOCK", blockId: block.id, message: "Bloque sin página válida." });
    }
  }

  const templateCount = activePages.filter((p) => templateTypeOf(p) === "DETAIL").length;
  const pageCount = activePages.length;
  const blockCount = activeBlocks.length;

  let state = "READY";
  if (errors.length > 0) state = "INVALID";
  else if (warnings.length > 0) state = "READY_WITH_WARNINGS";

  return {
    state,
    errors,
    warnings,
    metrics: {
      pages: pageCount,
      templates: templateCount,
      blocks: blockCount,
      homeCount
    }
  };
}

module.exports = { validateArchitecture };
