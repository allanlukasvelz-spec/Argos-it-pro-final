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
 * Corporate Quiet Authority public marketing routes (Relume IA + 21.7C.1).
 */
export function isCorporatePublicRoute(pathname: string): boolean {
  if (pathname === "/" || pathname === "") return true;
  if (pathname === "/contacto" || pathname.startsWith("/contacto/")) return true;
  if (pathname === "/servicios" || pathname.startsWith("/servicios/")) return true;
  if (pathname === "/metodo" || pathname.startsWith("/metodo/")) return true;
  if (pathname === "/sobre-argos-it" || pathname.startsWith("/sobre-argos-it/")) {
    return true;
  }
  if (pathname === "/portal" || pathname.startsWith("/portal/")) return true;
  return false;
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
 * Diagnostic promo is legacy conversion chrome — not on Corporate Quiet Authority,
 * legal, product apps, or labs.
 */
export function shouldShowDiagnosticPromo(pathname: string): boolean {
  return (
    !isLegalPublicRoute(pathname) &&
    !isProductAppRoute(pathname) &&
    !isCorporatePublicRoute(pathname) &&
    !isLabOrRecordingPath(pathname)
  );
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
 * Single chrome-ownership registry (FASE 21.5 + Quiet Authority public migration).
 * SiteShell is the only consumer — do not scatter pathname checks in Header/Footer.
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

  if (isCorporatePublicRoute(pathname)) {
    return "corporate";
  }

  // Legal and any residual public routes keep legacy chrome without promo.
  return "legacy";
}
