"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supportedLocales, type Locale } from "@/i18n/config";
import DiagnosticPromoBanner from "@/components/diagnostic/DiagnosticPromoBanner";
import { useDiagnosticSurveyLauncher } from "@/components/diagnostic/DiagnosticSurveyLauncher";
import { useI18n } from "@/i18n/useI18n";

type NavItem = {
  href: string;
  key: string;
};

const menuItems: NavItem[] = [
  { href: "/", key: "nav.home" },
  { href: "/servicios", key: "nav.services" },
  { href: "/metodo", key: "nav.method" },
  { href: "/sobre-argos-it", key: "nav.about" },
  { href: "/contacto", key: "nav.contact" }
];

const pillItems: NavItem[] = [
  { href: "/servicios", key: "nav.services" },
  { href: "/metodo", key: "nav.methodArgos" },
  { href: "/#planes", key: "nav.plans" },
  { href: "/auth/login", key: "nav.portal" },
  { href: "/contacto", key: "nav.contact" }
];

const quickLocales: Locale[] = ["es", "en", "ca"];

export default function SiteHeader() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
  const { openDiagnostic } = useDiagnosticSurveyLauncher();
  const [open, setOpen] = useState(false);
  const menuId = "site-navigation-menu";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return pathname === "/";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
      <div className="argos-topbar-lang notranslate" aria-label={t("language.label")}>
        <div className="argos-language-tools">
          {quickLocales.map((code) => (
            <button
              key={code}
              type="button"
              className={locale === code ? "is-active" : undefined}
              aria-pressed={locale === code}
              onClick={() => setLocale(code)}
            >
              {t(`language.${code}`)}
            </button>
          ))}
          {supportedLocales
            .filter((code) => !quickLocales.includes(code))
            .map((code) => (
              <button
                key={code}
                type="button"
                className={`hidden min-[900px]:inline-flex ${locale === code ? "is-active" : ""}`}
                aria-pressed={locale === code}
                onClick={() => setLocale(code)}
              >
                {t(`language.${code}`)}
              </button>
            ))}
        </div>
      </div>

      {/* Barra única del logo: Chico/Dumbo y hamburguesa viven SOLO dentro de estos márgenes */}
      <div className="argos-topbar-nav-shell relative">
        <div className="argos-topbar-nav-row mx-auto flex w-full max-w-[100rem] items-center gap-2 px-[var(--header-px)] xl:gap-3">
          <Link
            href="/"
            className="relative z-[46] flex h-full min-w-0 shrink-0 items-center self-stretch"
            aria-label="ARGOS-IT home"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/logo-argos-it-header.png"
              alt="Logo ARGOS-IT"
              width={360}
              height={138}
              className="h-auto w-auto max-h-[calc(var(--argos-topbar-nav-h)-12px)] max-w-[120px] object-contain object-left min-[480px]:max-w-[150px] md:max-w-[170px] lg:max-w-[190px] xl:max-w-[210px]"
              priority
            />
          </Link>

          <nav
            className="argos-nav-pills hidden min-w-0 shrink-0 2xl:flex"
            aria-label={t("nav.menu")}
          >
            {pillItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`argos-nav-pill ${isActive(item.href) ? "is-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          {/* Slot Chico/Dumbo: recortado a la altura exacta de la barra del logo */}
          <div
            className={`argos-topbar-mascot-slot relative z-[40] hidden min-h-0 min-w-0 flex-1 self-stretch md:block ${
              open ? "pointer-events-none invisible opacity-0" : "opacity-100"
            }`}
            aria-hidden={open}
          >
            <DiagnosticPromoBanner embeddedInHeader />
          </div>

          <button
            type="button"
            className="relative z-[46] ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-lg border border-[#D9E2EF] bg-white text-[#0B1E33] shadow-sm transition hover:border-[#22d3ee] hover:bg-[#ecfeff] min-[480px]:h-11 min-[480px]:w-11"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={t("nav.menu")}
            aria-controls={menuId}
            aria-expanded={open}
          >
            <span className="sr-only">{t("nav.menu")}</span>
            <span className="flex w-5 flex-col gap-[5px]" aria-hidden="true">
              <span
                className={`h-[2.5px] rounded-full bg-current transition ${open ? "translate-y-[7.5px] rotate-45" : ""}`}
              />
              <span className={`h-[2.5px] rounded-full bg-current transition ${open ? "opacity-0" : ""}`} />
              <span
                className={`h-[2.5px] rounded-full bg-current transition ${open ? "-translate-y-[7.5px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>

        {/* Menú: desplegable compacto anclado a la barra del logo (derecha) */}
        {open && (
          <div
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.menu")}
            className="argos-topbar-menu absolute right-[var(--header-px)] top-full z-[55] mt-1 w-[min(320px,calc(100vw-2rem))] rounded-xl border border-[#E5E7EB] bg-white/98 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur"
          >
            <nav className="grid gap-2" aria-label={t("nav.menu")}>
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-bold transition ${
                    isActive(item.href)
                      ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                      : "border-[#E5E7EB] text-[#1F2937] hover:border-[#22d3ee] hover:bg-[#ecfeff]"
                  }`}
                >
                  {t(item.key)}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              className="mt-2 w-full rounded-lg border border-[#22d3ee]/80 bg-[#ECFEFF] px-3 py-2.5 text-center text-sm font-black text-[#082f49] shadow-sm transition hover:bg-[#cffafe] md:hidden"
              onClick={() => {
                setOpen(false);
                openDiagnostic();
              }}
            >
              {t("nav.startDiagnostic")}
            </button>

            <div className="mt-2 grid gap-2 border-t border-[#E5E7EB] pt-2">
              <div className="flex items-center gap-2">
                <label htmlFor="lang-select" className="text-xs font-bold text-[#4B5563]">
                  {t("language.label")}
                </label>
                <select
                  id="lang-select"
                  className="min-w-0 flex-1 rounded-md border border-[#D9E2EF] bg-white px-2 py-2 text-xs font-bold text-[#0B1E33]"
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
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="inline-flex justify-center rounded-lg border border-[#D9E2EF] bg-white px-3 py-2.5 text-sm font-bold text-[#0B1E33] transition hover:border-[#2563EB] hover:text-[#2563EB]"
              >
                {t("nav.portal")}
              </Link>

              <Link
                href="/contacto"
                onClick={() => setOpen(false)}
                className="inline-flex justify-center rounded-lg bg-[#2563EB] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
              >
                {t("actions.requestConsultation")}
              </Link>
            </div>
          </div>
        )}
      </div>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-[54] cursor-default bg-slate-950/20"
          aria-label={t("nav.menu")}
          onClick={() => setOpen(false)}
        />
      )}
    </header>
  );
}
