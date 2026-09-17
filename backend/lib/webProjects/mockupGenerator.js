const { unwrapValue, isFilled } = require("./formRuntime");
const { PENDING_DEFINITION } = require("./constants");

const HERO_VARIANTS = {
  HERO: "CENTERED",
  SERVICE_GRID: "CARDS",
  PRODUCT_GRID: "CARDS",
  TOUR_GRID: "CARDS",
  CTA: "BANNER",
  CONTACT_FORM: "INLINE",
  FAQ: "LIST",
  GALLERY: "GRID",
  TEAM_GRID: "CARDS",
  DEFAULT: "DEFAULT"
};

function defaultDesignTokens() {
  return {
    colors: {
      primary: "#1a365d",
      secondary: "#2c5282",
      accent: "#ed8936",
      background: "#ffffff",
      surface: "#f7fafc",
      text: "#1a202c",
      muted: "#718096",
      border: "#e2e8f0",
      success: "#38a169",
      warning: "#d69e2e",
      error: "#e53e3e"
    },
    typography: {
      headingFamily: "system-ui, sans-serif",
      bodyFamily: "system-ui, sans-serif",
      scale: "md",
      headingWeight: "600",
      bodyWeight: "400"
    },
    spacing: { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2.5rem" },
    shape: { radius: "0.375rem", borderTreatment: "subtle" },
    layout: { maxContentWidth: "72rem", sectionSpacing: "lg" }
  };
}

function buildVisualDirection(values, documents, { argosProposal = false } = {}) {
  const hasLogo = unwrapValue(values.get("brand_has_logo")) === "yes";
  const logoDoc = (documents || []).find(
    (d) => (d.category || d.document_category) === "LOGO" && (d.upload_status || d.uploadStatus) === "STORED"
  );
  const brandColors = unwrapValue(values.get("brand_colors"));
  const brandFonts = unwrapValue(values.get("brand_fonts"));
  const brandTone = unwrapValue(values.get("brand_tone"));
  const brandAttributes = unwrapValue(values.get("brand_attributes"));
  const stylesPrefer = unwrapValue(values.get("brand_styles_prefer"));
  const stylesAvoid = unwrapValue(values.get("brand_styles_avoid"));
  const visualRefs = unwrapValue(values.get("brand_visual_refs"));

  return {
    source: argosProposal || (!brandColors && !brandFonts) ? "ARGOS_PROPOSAL" : "CLIENT_BRAND",
    logo: {
      status: hasLogo && logoDoc ? "AVAILABLE" : "PENDING",
      documentId: logoDoc?.id || null,
      label: hasLogo && logoDoc ? "Logo del cliente" : "Logo pendiente"
    },
    brandColors: isFilled(brandColors) ? brandColors : PENDING_DEFINITION,
    typography: {
      heading: isFilled(brandFonts) ? brandFonts : "system-ui, sans-serif",
      body: isFilled(brandFonts) ? brandFonts : "system-ui, sans-serif",
      licenseStatus: isFilled(brandFonts) ? "CLIENT_PROVIDED" : "SAFE_FALLBACK"
    },
    tone: isFilled(brandTone) ? brandTone : PENDING_DEFINITION,
    attributes: brandAttributes || [],
    styleReferences: {
      prefer: stylesPrefer || PENDING_DEFINITION,
      avoid: stylesAvoid || PENDING_DEFINITION,
      visualRefs: visualRefs || PENDING_DEFINITION
    },
    imageryDirection: PENDING_DEFINITION,
    iconographyDirection: PENDING_DEFINITION,
    layoutDensity: "NORMAL",
    buttonTreatment: "SOLID",
    cardTreatment: "ELEVATED",
    formTreatment: "OUTLINED",
    imageTreatment: "COVER"
  };
}

function variantForBlock(blockType) {
  return HERO_VARIANTS[blockType] || HERO_VARIANTS.DEFAULT;
}

function placeholderFor(blockType, purpose) {
  if (blockType === "HERO") return "[Título pendiente]";
  if (blockType === "CONTACT_FORM" || blockType === "QUOTE_FORM") return "[Formulario visual — sin envío real]";
  if (blockType === "BOOKING_WIDGET") return "[Reservas — placeholder visual]";
  if (blockType === "ECOMMERCE_ACTION") return "[Compra — placeholder visual]";
  if (blockType === "GALLERY" || blockType === "VIDEO") return "[Imagen pendiente]";
  return purpose ? `[${purpose.slice(0, 80)}]` : "[Contenido pendiente del cliente]";
}

function generateMockupFromArchitecture(input) {
  const { architecture, pages, blocks, values, documents, items } = input;
  const activePages = (pages || []).filter((p) => !p.archived_at && !p.archivedAt);
  const activeBlocks = (blocks || []).filter((b) => !b.archived_at && !b.archivedAt);
  const visualDirection = buildVisualDirection(values || new Map(), documents, {
    argosProposal: !isFilled(values?.get?.("brand_colors"))
  });
  const designTokens = defaultDesignTokens();
  if (visualDirection.source === "CLIENT_BRAND" && visualDirection.brandColors !== PENDING_DEFINITION) {
    designTokens.colors.primary = String(visualDirection.brandColors).split(/[,;]/)[0]?.trim() || designTokens.colors.primary;
  }

  const mockupPages = activePages
    .sort((a, b) => (a.sort_order ?? a.sortOrder ?? 0) - (b.sort_order ?? b.sortOrder ?? 0))
    .map((page, index) => ({
      architecture_page_id: page.id,
      title: page.title,
      route: page.route,
      page_type: page.page_type || page.pageType,
      template_type: page.template_type || page.templateType,
      status: "DRAFT",
      visual_notes: page.purpose || null,
      responsive_settings: { stackMobile: true },
      sort_order: index
    }));

  const sections = [];
  for (const page of activePages) {
    const pageId = page.id;
    const pageBlocks = activeBlocks
      .filter((b) => (b.architecture_page_id ?? b.architecturePageId) === pageId)
      .sort((a, b) => (a.sort_order ?? a.sortOrder ?? 0) - (b.sort_order ?? b.sortOrder ?? 0));

    sections.push({
      _pageArchitectureId: pageId,
      architecture_block_id: null,
      section_type: "HEADER",
      variant: "STANDARD",
      alignment: "CENTER",
      density: "NORMAL",
      visual_props: { sticky: true },
      placeholder_text: null,
      sort_order: 0,
      required: true
    });

    pageBlocks.forEach((block, idx) => {
      const blockType = block.block_type || block.blockType;
      sections.push({
        _pageArchitectureId: pageId,
        architecture_block_id: block.id,
        section_type: blockType,
        variant: variantForBlock(blockType),
        alignment: blockType === "HERO" ? "CENTER" : "LEFT",
        density: "NORMAL",
        visual_props: {
          imagePosition: blockType === "HERO" ? "BACKGROUND" : "NONE",
          ctaStyle: "PRIMARY"
        },
        asset_document_id: null,
        placeholder_text: placeholderFor(blockType, block.purpose),
        sort_order: idx + 1,
        required: Boolean(block.required)
      });
    });

    sections.push({
      _pageArchitectureId: pageId,
      architecture_block_id: null,
      section_type: "FOOTER",
      variant: "STANDARD",
      alignment: "CENTER",
      density: "COMPACT",
      visual_props: {},
      placeholder_text: null,
      sort_order: pageBlocks.length + 1,
      required: true
    });
  }

  let previewItemId = null;
  let previewItemType = null;
  const tourItems = (items || []).filter((i) => (i.item_type || i.itemType) === "tour" && !i.archived_at);
  const serviceItems = (items || []).filter((i) => (i.item_type || i.itemType) === "service" && !i.archived_at);
  const detailPage = activePages.find((p) => (p.template_type || p.templateType) === "DETAIL");
  if (detailPage) {
    const pt = detailPage.page_type || detailPage.pageType;
    if (pt === "TOUR_DETAIL" && tourItems[0]) {
      previewItemId = tourItems[0].id;
      previewItemType = "tour";
    } else if (pt === "SERVICE_DETAIL" && serviceItems[0]) {
      previewItemId = serviceItems[0].id;
      previewItemType = "service";
    }
  }

  return {
    architecture_id: architecture.id,
    architecture_version: architecture.version,
    visual_direction: visualDirection,
    design_tokens: designTokens,
    header_variant: "STANDARD",
    footer_variant: "STANDARD",
    preview_item_id: previewItemId,
    preview_item_type: previewItemType,
    pages: mockupPages,
    sections
  };
}

module.exports = {
  generateMockupFromArchitecture,
  buildVisualDirection,
  defaultDesignTokens,
  variantForBlock
};
