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
  const { openDiagnostic } = useDiagnosticSurveyLauncher();
  const [open, setOpen] = useState(false);
  const menuId = "site-navigation-menu";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
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
    <header className="sticky top-0 z-50 overflow-visible border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
      {/* Una sola barra: móvil 88–96px | tablet 190px | desktop 200px; overflow-x-clip evita scroll horizontal en tablet estrecha */}
      <div
        className={`mx-auto grid w-full max-w-[100rem] grid-cols-[1fr_auto] items-center overflow-x-clip overflow-y-visible md:overflow-x-clip
          h-[88px] min-h-[88px] max-h-[88px] px-4
          min-[480px]:h-[96px] min-[480px]:min-h-[96px] min-[480px]:max-h-[96px] min-[480px]:px-5
          md:grid-cols-[minmax(0,min(210px,28vw))_minmax(0,1fr)_minmax(0,min(96px,14vw))] md:h-[190px] md:min-h-[190px] md:max-h-[190px] md:px-8 md:items-center
          lg:grid-cols-[240px_minmax(0,1fr)_120px] lg:h-[200px] lg:min-h-[200px] lg:max-h-[200px] lg:px-10
          xl:grid-cols-[260px_minmax(0,1fr)_140px] xl:px-[var(--header-px)]`}
      >
        <Link
          href="/"
          className="relative z-[46] col-start-1 row-start-1 flex min-w-0 shrink-0 items-center justify-self-start overflow-visible"
          aria-label="ARGOS-IT home"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/logo-argos-it-header.png"
            alt="Logo ARGOS-IT"
            width={360}
            height={138}
            className="h-auto w-auto max-h-14 max-w-[150px] object-contain object-left min-[480px]:max-h-[3.75rem] min-[480px]:max-w-[170px] md:max-h-[4.5rem] md:max-w-[190px] lg:max-h-[5.125rem] lg:max-w-[220px] xl:max-h-[5.375rem] xl:max-w-[230px]"
            priority
          />
        </Link>

        {/* Slot central: oculto en móvil; tablet+ con alturas fijas */}
        <div
          className={`relative col-start-1 row-start-1 hidden min-w-0 overflow-visible transition-opacity duration-300 ease-out
            md:col-start-2 md:flex md:h-[154px] md:min-h-[154px] md:max-h-[154px] md:w-full md:max-w-[min(100%,620px)] md:justify-self-center
            lg:h-[164px] lg:min-h-[164px] lg:max-h-[164px] lg:max-w-[820px]
            xl:max-w-[920px]
            ${open ? "pointer-events-none invisible opacity-0" : "opacity-100"}`}
          aria-hidden={open}
        >
          <DiagnosticPromoBanner embeddedInHeader />
        </div>

        <button
          type="button"
          className="relative z-[46] col-start-2 row-start-1 inline-flex h-11 w-11 shrink-0 items-center justify-center justify-self-end rounded-lg border border-[#D9E2EF] bg-white text-[#0B1E33] shadow-sm transition hover:border-[#2563EB] hover:text-[#2563EB] min-[480px]:h-[46px] min-[480px]:w-[46px] md:col-start-3 md:h-[52px] md:w-[52px] lg:h-14 lg:w-14"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={t("nav.menu")}
          aria-controls={menuId}
          aria-expanded={open}
        >
          <span className="sr-only">{t("nav.menu")}</span>
          <span className="flex w-[1.375rem] flex-col gap-[6px]" aria-hidden="true">
            <span
              className={`h-[3px] rounded-full bg-current transition ${open ? "translate-y-[10px] rotate-45" : ""}`}
            />
            <span className={`h-[3px] rounded-full bg-current transition ${open ? "opacity-0" : ""}`} />
            <span
              className={`h-[3px] rounded-full bg-current transition ${open ? "-translate-y-[10px] -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      {open && (
        <div
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.menu")}
          className="relative z-[55] border-t border-[#E5E7EB] bg-white/95 px-5 py-5 shadow-lg"
        >
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

            <button
              type="button"
              className="md:hidden rounded-md border border-[#22d3ee]/80 bg-[#ECFEFF] px-4 py-3 text-center text-sm font-black text-[#082f49] shadow-sm transition hover:bg-[#cffafe]"
              onClick={() => {
                setOpen(false);
                openDiagnostic();
              }}
            >
              {t("nav.startDiagnostic")}
            </button>

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
