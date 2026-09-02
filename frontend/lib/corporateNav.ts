export type CorporateNavItem = {
  href: string;
  key: string;
};

/**
 * Primary IA for Quiet Authority chrome — Framer Corporate Visual Lab composition.
 * Logo = home. Contacto lives as header CTA (outline), not a nav duplicate.
 */
export const corporatePrimaryNav: CorporateNavItem[] = [
  { href: "/servicios", key: "nav.services" },
  { href: "/metodo", key: "nav.method" },
  { href: "/sobre-argos-it", key: "nav.about" }
];

/** Footer site links — sistema cerrado de páginas públicas. */
export const corporateFooterNav: CorporateNavItem[] = [
  { href: "/", key: "nav.home" },
  { href: "/servicios", key: "nav.services" },
  { href: "/metodo", key: "nav.methodArgos" },
  { href: "/sobre-argos-it", key: "nav.about" },
  { href: "/contacto", key: "nav.contact" },
  { href: "/portal", key: "nav.portalShort" }
];

export const corporateLegalNav: CorporateNavItem[] = [
  { href: "/aviso-legal", key: "legal.aviso.title" },
  { href: "/privacidad", key: "legal.privacy.title" },
  { href: "/cookies", key: "legal.cookies.title" }
];

export function isCorporateNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
