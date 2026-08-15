export type CorporateNavItem = {
  href: string;
  key: string;
};

/** Primary IA — same destinations as legacy SiteHeader `menuItems`. */
export const corporatePrimaryNav: CorporateNavItem[] = [
  { href: "/", key: "nav.home" },
  { href: "/servicios", key: "nav.services" },
  { href: "/metodo", key: "nav.method" },
  { href: "/sobre-argos-it", key: "nav.about" },
  { href: "/contacto", key: "nav.contact" }
];

/** Footer site links — same as SiteFooter, without invented items. */
export const corporateFooterNav: CorporateNavItem[] = [
  { href: "/servicios", key: "nav.services" },
  { href: "/metodo", key: "nav.method" },
  { href: "/sobre-argos-it", key: "nav.about" },
  { href: "/contacto", key: "nav.contact" }
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
