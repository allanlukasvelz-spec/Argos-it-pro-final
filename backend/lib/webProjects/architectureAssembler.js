const { buildTree, recalculateRoutes, pageIdOf, pageTypeOf, templateTypeOf } = require("./architectureRouteUtils");
const { validateArchitecture } = require("./architectureValidator");

function serializeArchitecture(row) {
  if (!row) return null;
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  return {
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.web_project_id,
    version: row.version,
    status: row.status,
    primaryLanguage: row.primary_language,
    additionalLanguages: row.additional_languages || [],
    languageSelectorRequired: Boolean(row.language_selector_required),
    metadata,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    supersedesArchitectureId: row.supersedes_architecture_id
  };
}

function serializePage(row) {
  return {
    id: row.id,
    architectureId: row.architecture_id,
    title: row.title,
    slug: row.slug,
    route: row.route,
    pageType: row.page_type,
    templateType: row.template_type,
    parentPageId: row.parent_page_id,
    sortOrder: row.sort_order,
    navigationPlacement: row.navigation_placement,
    navigationLabel: row.navigation_label,
    purpose: row.purpose,
    summary: row.summary,
    primaryCta: row.primary_cta,
    secondaryCta: row.secondary_cta,
    seoPriority: row.seo_priority,
    contentReadiness: row.content_readiness,
    contentBindingType: row.content_binding_type,
    contentBindingMode: row.content_binding_mode,
    sourcePageItemId: row.source_page_item_id,
    migrationDisposition: row.migration_disposition,
    entityCount: row.entity_count,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function serializeBlock(row) {
  return {
    id: row.id,
    architectureId: row.architecture_id,
    architecturePageId: row.architecture_page_id,
    blockType: row.block_type,
    sortOrder: row.sort_order,
    title: row.title,
    purpose: row.purpose,
    notes: row.notes,
    contentSourceType: row.content_source_type,
    contentSourceId: row.content_source_id,
    required: Boolean(row.required),
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function buildNavigation(pages) {
  const active = pages.filter((p) => !p.archivedAt && !p.archived_at);
  const primary = active
    .filter((p) => (p.navigation_placement || p.navigationPlacement) === "PRIMARY")
    .sort((a, b) => (a.sort_order ?? a.sortOrder) - (b.sort_order ?? b.sortOrder))
    .map((p) => ({
      label: p.navigation_label || p.navigationLabel || p.title,
      route: p.route,
      pageId: pageIdOf(p),
      children: active
        .filter((c) => (c.parent_page_id ?? c.parentPageId) === pageIdOf(p))
        .map((c) => ({
          label: c.navigation_label || c.navigationLabel || c.title,
          route: c.route,
          pageId: pageIdOf(c),
          template: templateTypeOf(c) === "DETAIL"
        }))
    }));
  return { primary };
}

function assembleArchitecturePayload(input) {
  const { architecture, versions, pages, blocks, values, notes } = input;
  const routed = recalculateRoutes(pages || []);
  const tree = buildTree(routed);
  const serializedPages = routed.map(serializePage);
  const serializedBlocks = (blocks || []).map(serializeBlock);
  const validation = validateArchitecture({
    architecture,
    pages: routed,
    blocks: blocks || [],
    values,
    notes
  });
  const metadata = architecture?.metadata || {};
  return {
    architecture: serializeArchitecture(architecture),
    versions: (versions || []).map(serializeArchitecture),
    pages: serializedPages,
    blocks: serializedBlocks,
    tree,
    navigation: buildNavigation(routed),
    metrics: validation.metrics,
    validation,
    conversionPaths: metadata.conversionPaths || [],
    contentCoverage: metadata.contentCoverage || null,
    languageStrategy: {
      primaryLanguage: architecture?.primary_language || architecture?.primaryLanguage || null,
      additionalLanguages: architecture?.additional_languages || architecture?.additionalLanguages || [],
      languageSelectorRequired: Boolean(
        architecture?.language_selector_required ?? architecture?.languageSelectorRequired
      )
    },
    headerArchitecture: {
      logoTarget: "HOME",
      primaryNavigation: true,
      utilityNavigation: routed.some((p) => (p.navigation_placement || p.navigationPlacement) === "UTILITY"),
      primaryCta: routed.find((p) => pageTypeOf(p) === "HOME")?.primary_cta || null,
      languageSelector: Boolean(architecture?.language_selector_required ?? architecture?.languageSelectorRequired)
    },
    footerArchitecture: {
      navigation: routed.filter((p) => (p.navigation_placement || p.navigationPlacement) === "FOOTER"),
      legal: routed.filter((p) => pageTypeOf(p) === "LEGAL"),
      newsletter: (blocks || []).some((b) => (b.block_type || b.blockType) === "NEWSLETTER")
    }
  };
}

module.exports = {
  serializeArchitecture,
  serializePage,
  serializeBlock,
  assembleArchitecturePayload,
  buildNavigation
};
