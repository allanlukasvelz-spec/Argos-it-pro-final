const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DYNAMIC_SLUG = "[slug]";

function normalizePageSlug(input, { home = false } = {}) {
  if (home) return "";
  const raw = String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  if (!raw) return null;
  return raw;
}

function isValidSlug(slug, { home = false, dynamic = false } = {}) {
  if (home) return slug === "";
  if (dynamic) return slug === DYNAMIC_SLUG;
  return Boolean(slug && SLUG_PATTERN.test(slug));
}

function pageIdOf(page) {
  return page.id ?? page.tempId;
}

function parentIdOf(page) {
  return page.parent_page_id ?? page.parentPageId ?? null;
}

function slugOf(page) {
  return page.slug ?? "";
}

function pageTypeOf(page) {
  return page.page_type || page.pageType;
}

function templateTypeOf(page) {
  return page.template_type || page.templateType;
}

function isDynamicDetail(page) {
  return templateTypeOf(page) === "DETAIL" || slugOf(page) === DYNAMIC_SLUG;
}

function computeRouteForPage(page, pagesById) {
  if (pageTypeOf(page) === "HOME") return "/";
  const segments = [];
  let current = page;
  const guard = new Set();
  while (current) {
    const id = pageIdOf(current);
    if (guard.has(id)) break;
    guard.add(id);
    const slug = slugOf(current);
    if (slug && slug !== DYNAMIC_SLUG) segments.unshift(slug);
    else if (slug === DYNAMIC_SLUG) segments.unshift(DYNAMIC_SLUG);
    const parentId = parentIdOf(current);
    if (!parentId) break;
    current = pagesById.get(parentId);
  }
  if (segments.length === 0) return "/";
  return `/${segments.join("/")}`;
}

function recalculateRoutes(pages) {
  const active = pages.filter((p) => !p.archived_at && !p.archivedAt);
  const pagesById = new Map(active.map((p) => [pageIdOf(p), p]));
  return active.map((page) => ({
    ...page,
    route: computeRouteForPage(page, pagesById)
  }));
}

function buildTree(pages) {
  const active = pages
    .filter((p) => !p.archived_at && !p.archivedAt)
    .sort((a, b) => (a.sort_order ?? a.sortOrder ?? 0) - (b.sort_order ?? b.sortOrder ?? 0));
  const byParent = new Map();
  for (const page of active) {
    const parentId = parentIdOf(page) ?? 0;
    if (!byParent.has(parentId)) byParent.set(parentId, []);
    byParent.get(parentId).push(page);
  }
  function walk(parentId) {
    return (byParent.get(parentId) || []).map((page) => ({
      page,
      children: walk(pageIdOf(page))
    }));
  }
  return walk(0);
}

function detectCycle(pageId, parentId, pagesById) {
  if (!parentId) return false;
  if (Number(parentId) === Number(pageId)) return true;
  const visited = new Set([Number(pageId)]);
  let current = pagesById.get(Number(parentId));
  while (current) {
    const id = pageIdOf(current);
    if (visited.has(Number(id))) return true;
    visited.add(Number(id));
    const nextParent = parentIdOf(current);
    if (!nextParent) break;
    current = pagesById.get(Number(nextParent));
  }
  return false;
}

function findDuplicateRoutes(pages) {
  const active = pages.filter((p) => !p.archived_at && !p.archivedAt);
  const routes = new Map();
  const duplicates = [];
  for (const page of active) {
    const route = page.route || computeRouteForPage(page, new Map(active.map((p) => [pageIdOf(p), p])));
    if (routes.has(route)) {
      duplicates.push({ route, pageIds: [routes.get(route), pageIdOf(page)] });
    } else {
      routes.set(route, pageIdOf(page));
    }
  }
  return duplicates;
}

function countHomes(pages) {
  return pages.filter(
    (p) => !p.archived_at && !p.archivedAt && pageTypeOf(p) === "HOME"
  ).length;
}

module.exports = {
  DYNAMIC_SLUG,
  normalizePageSlug,
  isValidSlug,
  pageIdOf,
  parentIdOf,
  slugOf,
  pageTypeOf,
  templateTypeOf,
  isDynamicDetail,
  computeRouteForPage,
  recalculateRoutes,
  buildTree,
  detectCycle,
  findDuplicateRoutes,
  countHomes
};
