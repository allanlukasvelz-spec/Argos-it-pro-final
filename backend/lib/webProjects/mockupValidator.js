const { PENDING_DEFINITION } = require("./constants");

function pageIdOf(page) {
  return page.architecture_page_id ?? page.architecturePageId ?? page.id;
}

function blockIdOf(block) {
  return block.architecture_block_id ?? block.architectureBlockId;
}

function validateMockup(input) {
  const {
    mockup,
    pages = [],
    sections = [],
    architecturePages = [],
    architectureBlocks = [],
    approvedArchitecture
  } = input;

  const errors = [];
  const warnings = [];

  if (!approvedArchitecture || approvedArchitecture.status !== "APPROVED") {
    errors.push({ code: "NO_APPROVED_ARCHITECTURE", message: "Se requiere arquitectura aprobada." });
  }
  if (mockup && approvedArchitecture) {
    if (mockup.architecture_id !== approvedArchitecture.id) {
      errors.push({ code: "WRONG_ARCHITECTURE", message: "La maqueta referencia una arquitectura distinta." });
    }
    if (Number(mockup.architecture_version) !== Number(approvedArchitecture.version)) {
      warnings.push({
        code: "ARCHITECTURE_VERSION_DRIFT",
        message: "La versión de arquitectura referenciada difiere de la aprobada actual."
      });
    }
  }

  const activeArchPages = architecturePages.filter((p) => !p.archived_at && !p.archivedAt);
  const activeArchBlocks = architectureBlocks.filter((b) => !b.archived_at && !b.archivedAt);
  const activeMockPages = pages.filter((p) => !p.archived_at && !p.archivedAt);
  const activeSections = sections.filter((s) => !s.archived_at && !s.archivedAt);

  const mockPageByArchId = new Map(
    activeMockPages.map((p) => [p.architecture_page_id ?? p.architecturePageId, p])
  );

  for (const archPage of activeArchPages) {
    if (!mockPageByArchId.has(archPage.id)) {
      errors.push({
        code: "MISSING_MOCKUP_PAGE",
        message: `Falta maqueta para la página «${archPage.title}».`,
        pageId: archPage.id
      });
    }
  }

  for (const archBlock of activeArchBlocks.filter((b) => b.required)) {
    const pageId = archBlock.architecture_page_id ?? archBlock.architecturePageId;
    const mockPage = mockPageByArchId.get(pageId);
    if (!mockPage) continue;
    const represented = activeSections.some(
      (s) =>
        (s.mockup_page_id === mockPage.id ||
          s.mockupPageId === mockPage.id ||
          s._mockupPageId === mockPage.id) &&
        (s.architecture_block_id ?? s.architectureBlockId) === archBlock.id
    );
    if (!represented) {
      errors.push({
        code: "MISSING_REQUIRED_BLOCK",
        message: `Falta representación del bloque obligatorio «${archBlock.block_type || archBlock.blockType}».`,
        blockId: archBlock.id
      });
    }
  }

  const ctaBlocks = activeArchBlocks.filter((b) => {
    const t = b.block_type || b.blockType;
    return t === "CTA" || t === "CONTACT_FORM" || t === "BOOKING_WIDGET" || t === "ECOMMERCE_ACTION";
  });
  for (const cta of ctaBlocks) {
    const pageId = cta.architecture_page_id ?? cta.architecturePageId;
    const mockPage = mockPageByArchId.get(pageId);
    if (!mockPage) continue;
    const hasVisual = activeSections.some(
      (s) =>
        (s.mockup_page_id === mockPage.id ||
          s.mockupPageId === mockPage.id ||
          s._mockupPageId === mockPage.id) &&
        (s.architecture_block_id ?? s.architectureBlockId) === cta.id
    );
    if (!hasVisual) {
      errors.push({
        code: "CONVERSION_PATH_MISSING",
        message: "Falta representación visual de la ruta de conversión.",
        blockId: cta.id
      });
    }
  }

  const vd = mockup?.visual_direction || mockup?.visualDirection || {};
  if (!vd || Object.keys(vd).length === 0) {
    errors.push({ code: "MISSING_VISUAL_DIRECTION", message: "Falta dirección visual." });
  } else if (vd.logo?.status === "PENDING" && vd.source === "CLIENT_BRAND") {
    warnings.push({ code: "LOGO_PENDING", message: "Logo pendiente del cliente." });
  }
  if (vd.typography?.licenseStatus === "CLIENT_PROVIDED" && vd.typography?.heading === PENDING_DEFINITION) {
    warnings.push({ code: "FONT_LICENSING_PENDING", message: "Tipografía/licencia pendiente de confirmar." });
  }

  for (const section of activeSections) {
    if (section.asset_document_id || section.assetDocumentId) {
      const docId = section.asset_document_id || section.assetDocumentId;
      if (!input.validDocumentIds || !input.validDocumentIds.has(String(docId))) {
        errors.push({
          code: "INVALID_ASSET_REFERENCE",
          message: "Referencia de asset no válida.",
          sectionId: section.id
        });
      }
    }
    if (section.placeholder_text && !String(section.placeholder_text).includes("[")) {
      warnings.push({ code: "COPY_PENDING", message: "Contenido pendiente en sección.", sectionId: section.id });
    }
  }

  const tokens = mockup?.design_tokens || mockup?.designTokens;
  if (!tokens?.colors?.primary) {
    warnings.push({ code: "TOKENS_INCOMPLETE", message: "Tokens de color incompletos." });
  }

  const state = errors.length > 0 ? "INVALID" : warnings.length > 0 ? "READY_WITH_WARNINGS" : "READY";
  return {
    state,
    errors,
    warnings,
    metrics: {
      pages: activeMockPages.length,
      sections: activeSections.length,
      architecturePages: activeArchPages.length,
      architectureBlocks: activeArchBlocks.length
    }
  };
}

module.exports = { validateMockup, pageIdOf, blockIdOf };
