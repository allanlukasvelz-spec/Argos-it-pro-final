const { validateMockup } = require("./mockupValidator");

function serializeMockup(row) {
  if (!row) return null;
  const vd = row.visual_direction && typeof row.visual_direction === "object" ? row.visual_direction : {};
  const dt = row.design_tokens && typeof row.design_tokens === "object" ? row.design_tokens : {};
  return {
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.web_project_id,
    version: row.version,
    status: row.status,
    architectureId: row.architecture_id,
    architectureVersion: row.architecture_version,
    visualDirection: vd,
    designTokens: dt,
    headerVariant: row.header_variant,
    footerVariant: row.footer_variant,
    previewItemId: row.preview_item_id,
    previewItemType: row.preview_item_type,
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    internalNotes: row.internal_notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    sentToClientAt: row.sent_to_client_at,
    sentToClientBy: row.sent_to_client_by,
    supersedesMockupId: row.supersedes_mockup_id
  };
}

function serializeMockupPage(row) {
  return {
    id: row.id,
    mockupId: row.mockup_id,
    architecturePageId: row.architecture_page_id,
    title: row.title,
    route: row.route,
    pageType: row.page_type,
    templateType: row.template_type,
    status: row.status,
    visualNotes: row.visual_notes,
    responsiveSettings:
      row.responsive_settings && typeof row.responsive_settings === "object" ? row.responsive_settings : {},
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function serializeMockupSection(row) {
  const props = row.visual_props && typeof row.visual_props === "object" ? row.visual_props : {};
  return {
    id: row.id,
    mockupId: row.mockup_id,
    mockupPageId: row.mockup_page_id,
    architectureBlockId: row.architecture_block_id,
    sectionType: row.section_type,
    variant: row.variant,
    alignment: row.alignment,
    density: row.density,
    visualProps: props,
    assetDocumentId: row.asset_document_id,
    placeholderText: row.placeholder_text,
    sortOrder: row.sort_order,
    required: Boolean(row.required),
    visualNotes: row.visual_notes,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function assembleMockupPayload(input) {
  const {
    mockup,
    versions,
    pages,
    sections,
    approvedArchitecture,
    architecturePages,
    architectureBlocks,
    validDocumentIds,
    previewItem,
    items,
    clientSafe = false
  } = input;

  const serializedPages = (pages || []).map(serializeMockupPage);
  const serializedSections = (sections || []).map(serializeMockupSection);
  const validation = validateMockup({
    mockup,
    pages: serializedPages,
    sections: serializedSections,
    architecturePages: architecturePages || [],
    architectureBlocks: architectureBlocks || [],
    approvedArchitecture,
    validDocumentIds
  });

  const payload = {
    mockup: serializeMockup(mockup),
    versions: (versions || []).map(serializeMockup),
    pages: serializedPages,
    sections: serializedSections,
    validation,
    architectureReference: approvedArchitecture
      ? {
          id: approvedArchitecture.id,
          version: approvedArchitecture.version,
          status: approvedArchitecture.status
        }
      : null,
    previewItem: previewItem
      ? {
          id: previewItem.id,
          itemType: previewItem.item_type || previewItem.itemType,
          title: previewItem.title
        }
      : null,
    contentPreviewItems: clientSafe
      ? undefined
      : (items || [])
          .filter((item) => !item.archived_at && !item.archivedAt)
          .map((item) => ({
            id: item.id,
            itemType: item.item_type || item.itemType,
            title: item.title
          }))
          .sort((a, b) => a.title.localeCompare(b.title, "es"))
  };

  if (clientSafe && payload.mockup) {
    delete payload.mockup.internalNotes;
    payload.mockup = {
      id: payload.mockup.id,
      version: payload.mockup.version,
      status: payload.mockup.status,
      visualDirection: sanitizeClientVisualDirection(payload.mockup.visualDirection),
      designTokens: payload.mockup.designTokens,
      headerVariant: payload.mockup.headerVariant,
      footerVariant: payload.mockup.footerVariant,
      approvedAt: payload.mockup.approvedAt
    };
    delete payload.validation;
    delete payload.architectureReference;
    delete payload.versions;
    delete payload.contentPreviewItems;
    payload.sections = payload.sections.map((s) => ({
      id: s.id,
      mockupPageId: s.mockupPageId,
      sectionType: s.sectionType,
      variant: s.variant,
      alignment: s.alignment,
      density: s.density,
      visualProps: s.visualProps,
      placeholderText: s.placeholderText,
      sortOrder: s.sortOrder,
      required: s.required
    }));
  }

  return payload;
}

function sanitizeClientVisualDirection(vd) {
  if (!vd || typeof vd !== "object") return {};
  const { internalNotes, ...safe } = vd;
  return safe;
}

module.exports = {
  serializeMockup,
  serializeMockupPage,
  serializeMockupSection,
  assembleMockupPayload
};
