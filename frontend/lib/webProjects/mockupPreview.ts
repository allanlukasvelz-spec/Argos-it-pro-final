import type { WebProjectMockupPage } from "./types";

const DETAIL_PAGE_ITEM_TYPES: Record<string, string> = {
  SERVICE_DETAIL: "service",
  PRODUCT_DETAIL: "product",
  TOUR_DETAIL: "tour",
  LOCATION_DETAIL: "location"
};

export function isDetailTemplatePage(page: WebProjectMockupPage | null | undefined): boolean {
  if (!page) return false;
  if (page.templateType === "DETAIL") return true;
  return Boolean(DETAIL_PAGE_ITEM_TYPES[page.pageType]);
}

export function itemTypeForDetailPage(page: WebProjectMockupPage | null | undefined): string | null {
  if (!page) return null;
  if (DETAIL_PAGE_ITEM_TYPES[page.pageType]) return DETAIL_PAGE_ITEM_TYPES[page.pageType];
  if (page.templateType !== "DETAIL") return null;
  const pageType = page.pageType || "";
  if (pageType.includes("SERVICE")) return "service";
  if (pageType.includes("PRODUCT")) return "product";
  if (pageType.includes("TOUR")) return "tour";
  if (pageType.includes("LOCATION")) return "location";
  return null;
}

export type ContentPreviewItem = {
  id: number;
  itemType: string;
  title: string;
};

export function listCompatiblePreviewItems(
  items: ContentPreviewItem[] | undefined,
  page: WebProjectMockupPage | null | undefined
): ContentPreviewItem[] {
  const expectedType = itemTypeForDetailPage(page);
  if (!expectedType) return [];
  return (items || [])
    .filter((item) => item.itemType === expectedType)
    .sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export function effectivePreviewItem(
  page: WebProjectMockupPage | null | undefined,
  previewItem: ContentPreviewItem | null | undefined
): ContentPreviewItem | null {
  if (!page || !previewItem) return null;
  const expectedType = itemTypeForDetailPage(page);
  if (!expectedType || previewItem.itemType !== expectedType) return null;
  return previewItem;
}
