const DETAIL_PAGE_ITEM_TYPES = Object.freeze({
  SERVICE_DETAIL: "service",
  PRODUCT_DETAIL: "product",
  TOUR_DETAIL: "tour",
  LOCATION_DETAIL: "location"
});

function isDetailTemplatePage(page) {
  if (!page) return false;
  const pageType = page.page_type || page.pageType;
  const templateType = page.template_type || page.templateType;
  if (templateType === "DETAIL") return true;
  return Boolean(DETAIL_PAGE_ITEM_TYPES[pageType]);
}

function itemTypeForDetailPage(page) {
  if (!page) return null;
  const pageType = page.page_type || page.pageType;
  if (DETAIL_PAGE_ITEM_TYPES[pageType]) return DETAIL_PAGE_ITEM_TYPES[pageType];
  const templateType = page.template_type || page.templateType;
  if (templateType !== "DETAIL") return null;
  if (String(pageType || "").includes("SERVICE")) return "service";
  if (String(pageType || "").includes("PRODUCT")) return "product";
  if (String(pageType || "").includes("TOUR")) return "tour";
  if (String(pageType || "").includes("LOCATION")) return "location";
  return null;
}

function listCompatiblePreviewItems(items, page) {
  const expectedType = itemTypeForDetailPage(page);
  if (!expectedType) return [];
  return (items || [])
    .filter((item) => !item.archived_at && !item.archivedAt)
    .filter((item) => (item.item_type || item.itemType) === expectedType)
    .map((item) => ({
      id: item.id,
      itemType: item.item_type || item.itemType,
      title: item.title
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "es"));
}

function resolvePreviewItem(items, previewItemId) {
  if (previewItemId == null) return null;
  const id = Number(previewItemId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return (items || []).find((item) => item.id === id && !item.archived_at && !item.archivedAt) || null;
}

function assertCompatiblePreviewItem(item, page) {
  const expectedType = itemTypeForDetailPage(page);
  if (!expectedType) {
    return { ok: false, code: "PREVIEW_NOT_APPLICABLE", message: "Esta página no admite preview de item." };
  }
  if (!item) {
    return { ok: false, code: "PREVIEW_ITEM_NOT_FOUND", message: "Item de preview no encontrado." };
  }
  const itemType = item.item_type || item.itemType;
  if (itemType !== expectedType) {
    return {
      ok: false,
      code: "PREVIEW_ITEM_INCOMPATIBLE",
      message: `El item no es compatible con la plantilla (${expectedType} requerido).`
    };
  }
  return { ok: true, expectedType };
}

module.exports = {
  DETAIL_PAGE_ITEM_TYPES,
  isDetailTemplatePage,
  itemTypeForDetailPage,
  listCompatiblePreviewItems,
  resolvePreviewItem,
  assertCompatiblePreviewItem
};
