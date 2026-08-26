export type ChromeOwner = "none" | "legacy" | "corporate";

/**
 * Public legal routes that should keep legacy navigation/chrome
 * but must not inherit conversion UI such as the diagnostic promo.
 */
export function isLegalPublicRoute(pathname: string): boolean {
  return (
    pathname === "/privacidad" ||
    pathname === "/cookies" ||
    pathname === "/aviso-legal" ||
    pathname.startsWith("/legal/")
  );
}

/**
 * Private product apps own their chrome via ClientShell / NocShell.
 * Public marketing chrome must never wrap these routes.
 */
export function isProductAppRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/noc") ||
    pathname.startsWith("/auth")
  );
}

export function isLabOrRecordingPath(pathname: string): boolean {
  return (
    pathname === "/explainer" ||
    pathname === "/mascot-motion-lab" ||
    pathname.startsWith("/mascot-motion-lab/")
  );
}

/**
 * Diagnostic promo eligibility is intentionally separate from chrome ownership.
 * Legal pages keep the legacy header/navigation but do not mount the promo.
 */
export function shouldShowDiagnosticPromo(pathname: string): boolean {
  return !isLegalPublicRoute(pathname) && !isProductAppRoute(pathname);
}

/**
 * Public mascot assistants (CHICO/DUMBO docks) — never on product apps or labs.
 */
export function shouldHideAssistants(pathname: string): boolean {
  return (
    isProductAppRoute(pathname) ||
    isLabOrRecordingPath(pathname) ||
    isLegalPublicRoute(pathname)
  );
}

/**
 * Cookie / marketing consent chrome — never on Client or NOC product shells.
 */
export function shouldHideCookieBanner(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/noc") ||
    isLabOrRecordingPath(pathname)
  );
}

/**
 * Single chrome-ownership registry (FASE 21.5 + visual reconciliation).
 * SiteShell is the only consumer — do not scatter pathname checks in Header/Footer.
 *
 * 21.6: add Corporate routes here and swap the page canvas to CorporatePageShell.
 */
export function getChromeOwner(pathname: string): ChromeOwner {
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/noc") ||
    isLabOrRecordingPath(pathname)
  ) {
    return "none";
  }

  if (pathname === "/contacto" || pathname.startsWith("/contacto/")) {
    return "corporate";
  }

  return "legacy";
}
