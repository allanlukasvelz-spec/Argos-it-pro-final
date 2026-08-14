"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { supportedLocales, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/useI18n";
import { corporatePrimaryNav, isCorporateNavActive } from "@/lib/corporateNav";

const quickLocales: Locale[] = ["es", "en", "ca"];

export default function CorporateHeader() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="argos-corporate-header">
      <div className="argos-corporate-lang notranslate" aria-label={t("language.label")}>
        <div className="argos-corporate-lang__tools">
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
                className={`argos-corporate-lang__extra ${locale === code ? "is-active" : ""}`}
                aria-pressed={locale === code}
                onClick={() => setLocale(code)}
              >
                {t(`language.${code}`)}
              </button>
            ))}
        </div>
      </div>

      <div className="argos-corporate-nav-row">
        <Link
          href="/"
          className="argos-corporate-logo"
          aria-label="ARGOS-IT home"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/logo-argos-it-header.png"
            alt="Logo ARGOS-IT"
            width={360}
            height={138}
            className="argos-corporate-logo__img"
            priority
          />
        </Link>

        <nav className="argos-corporate-nav" aria-label={t("nav.menu")}>
          {corporatePrimaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isCorporateNavActive(pathname, item.href) ? "is-active" : undefined}
              aria-current={isCorporateNavActive(pathname, item.href) ? "page" : undefined}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="argos-corporate-header-actions">
          <Link href="/auth/login" className="argos-corporate-link-quiet">
            {t("nav.portal")}
          </Link>
          <Link
            href="/contacto"
            className="argos-corporate-cta"
            aria-current={pathname === "/contacto" ? "page" : undefined}
          >
            {t("actions.requestConsultation")}
          </Link>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="argos-corporate-menu-toggle"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={t("nav.menu")}
          aria-controls={menuId}
          aria-expanded={open}
        >
          <span className="sr-only">{t("nav.menu")}</span>
          <span className="argos-corporate-menu-toggle__bars" aria-hidden="true">
            <span className={open ? "is-open" : undefined} />
            <span className={open ? "is-open" : undefined} />
            <span className={open ? "is-open" : undefined} />
          </span>
        </button>
      </div>

      {open && (
        <>
          <button
            type="button"
            className="argos-corporate-menu-backdrop"
            aria-label={t("nav.menu")}
            onClick={() => setOpen(false)}
          />
          <div
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.menu")}
            className="argos-corporate-menu"
          >
            <nav className="argos-corporate-menu__nav" aria-label={t("nav.menu")}>
              {corporatePrimaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={isCorporateNavActive(pathname, item.href) ? "is-active" : undefined}
                  aria-current={isCorporateNavActive(pathname, item.href) ? "page" : undefined}
                >
                  {t(item.key)}
                </Link>
              ))}
            </nav>
            <div className="argos-corporate-menu__meta">
              <label htmlFor="corporate-lang-select" className="argos-corporate-menu__lang-label">
                {t("language.label")}
              </label>
              <select
                id="corporate-lang-select"
                className="argos-corporate-menu__lang"
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
              <Link href="/auth/login" className="argos-corporate-link-quiet" onClick={() => setOpen(false)}>
                {t("nav.portal")}
              </Link>
              <Link
                href="/contacto"
                className="argos-corporate-cta argos-corporate-cta--block"
                onClick={() => setOpen(false)}
              >
                {t("actions.requestConsultation")}
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
