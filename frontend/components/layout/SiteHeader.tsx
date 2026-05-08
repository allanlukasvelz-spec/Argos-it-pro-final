"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { supportedLocales, type Locale } from "@/i18n/config";
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

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Link
          href="/"
          className="flex items-center"
          aria-label="ARGOS-IT home"
        >
          <Image
            src="/logo-argos-it.png"
            alt="Logo ARGOS-IT"
            width={220}
            height={56}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-semibold transition ${
                isActive(item.href) ? "text-[#2563EB]" : "text-[#1F2937] hover:text-[#2563EB]"
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <label htmlFor="lang-select" className="text-xs font-bold text-[#4B5563]">
            {t("language.label")}
          </label>
          <select
            id="lang-select"
            className="rounded-md border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-bold text-[#0B1E33]"
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

          <Link
            href="/contacto"
            className="rounded-md bg-[#2563EB] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
          >
            {t("actions.requestConsultation")}
          </Link>
        </div>

        <button
          type="button"
          className="rounded-md border border-[#E5E7EB] px-3 py-2 text-sm font-bold text-[#0B1E33] md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={t("nav.menu")}
        >
          {t("nav.menu")}
        </button>
      </div>

      {open && (
        <div className="border-t border-[#E5E7EB] bg-white px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`text-sm font-semibold ${isActive(item.href) ? "text-[#2563EB]" : "text-[#1F2937]"}`}
              >
                {t(item.key)}
              </Link>
            ))}

            <div className="mt-2 flex items-center gap-2">
              <label htmlFor="lang-select-mobile" className="text-xs font-bold text-[#4B5563]">
                {t("language.label")}
              </label>
              <select
                id="lang-select-mobile"
                className="rounded-md border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-bold text-[#0B1E33]"
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
              className="mt-2 inline-flex justify-center rounded-md bg-[#2563EB] px-4 py-2 text-sm font-bold text-white"
            >
              {t("actions.requestConsultation")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
