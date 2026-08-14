export type ChromeOwner = "none" | "legacy" | "corporate";

/**
 * Single chrome-ownership registry (FASE 21.5).
 * SiteShell is the only consumer — do not scatter pathname checks in Header/Footer.
 *
 * 21.6: add Corporate routes here and swap the page canvas to CorporatePageShell.
 */
export function getChromeOwner(pathname: string): ChromeOwner {
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/dashboard") ||
    pathname === "/explainer"
  ) {
    return "none";
  }

  if (pathname === "/contacto" || pathname.startsWith("/contacto/")) {
    return "corporate";
  }

  return "legacy";
}
