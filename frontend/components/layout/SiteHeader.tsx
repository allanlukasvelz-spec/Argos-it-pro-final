"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supportedLocales, type Locale } from "@/i18n/config";
import DiagnosticPromoBanner from "@/components/diagnostic/DiagnosticPromoBanner";
import { useI18n } from "@/i18n/useI18n";

type NavItem = {
  href: string;
  key: string;
};

const navItems: NavItem[] = [
  { href: "/", key: "nav.home" },
  { href: "/servicios", key: "nav.services" },
  { href: "/metodo", key: "nav.method" },
  { href: "/sobre-argos-it", key: "nav.about" },
  { href: "/contacto", key: "nav.contact" }
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [diagPromoSlotClosed, setDiagPromoSlotClosed] = useState(false);
  const menuId = "site-navigation-menu";

  useEffect(() => {
    if (pathname !== "/") {
      setDiagPromoSlotClosed(false);
    }
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-5 py-3 md:gap-4 lg:px-8">
        <Link
          href="/"
          className="relative z-[46] flex shrink-0 items-center"
          aria-label="ARGOS-IT home"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/logo-argos-it-header.png"
            alt="Logo ARGOS-IT"
            width={360}
            height={138}
            className="h-16 w-auto object-contain sm:h-20"
            priority
          />
        </Link>

        {pathname === "/" && !diagPromoSlotClosed && (
          <div className="relative z-10 hidden min-h-[4.25rem] min-w-0 max-w-none flex-1 overflow-hidden md:block" aria-hidden={false}>
            <DiagnosticPromoBanner onSlotRelease={() => setDiagPromoSlotClosed(true)} />
          </div>
        )}

        <button
          type="button"
          className="relative z-[46] inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#D9E2EF] bg-white text-[#0B1E33] shadow-sm transition hover:border-[#2563EB] hover:text-[#2563EB]"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={t("nav.menu")}
          aria-controls={menuId}
          aria-expanded={open}
        >
          <span className="sr-only">{t("nav.menu")}</span>
          <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
            <span className={`h-0.5 rounded-full bg-current transition ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 rounded-full bg-current transition ${open ? "opacity-0" : ""}`} />
            <span className={`h-0.5 rounded-full bg-current transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </span>
        </button>
      </div>

      {open && (
        <div id={menuId} className="relative z-[55] border-t border-[#E5E7EB] bg-white/95 px-5 py-5 shadow-lg">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_auto] lg:px-3">
            <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label={t("nav.menu")}>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md border px-4 py-3 text-sm font-bold transition ${
                    isActive(item.href)
                      ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                      : "border-[#E5E7EB] text-[#1F2937] hover:border-[#2563EB] hover:text-[#2563EB]"
                  }`}
                >
                  {t(item.key)}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
              <div className="flex items-center gap-2">
                <label htmlFor="lang-select" className="text-xs font-bold text-[#4B5563]">
                  {t("language.label")}
                </label>
                <select
                  id="lang-select"
                  className="rounded-md border border-[#D9E2EF] bg-white px-2 py-2 text-xs font-bold text-[#0B1E33]"
                  value={locale}
                  onChange={(event) => setLocale(event.target.value as Locale)}
                  aria-label={t("language.label")}
                >
                  {supportedLocales.map((code) => (
                    <option key={code} value={code}>
                      {t(`language.${code}`)}
                    </option>
                  ))}
                </select>
              </div>

              <Link
                href="/contacto"
                onClick={() => setOpen(false)}
                className="inline-flex justify-center rounded-md bg-[#2563EB] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
              >
                {t("actions.requestConsultation")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
