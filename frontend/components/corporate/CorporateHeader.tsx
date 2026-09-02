"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import CorporateHeaderBanner from "@/components/corporate/CorporateHeaderBanner";
import CorporateNavDrawer from "@/components/corporate/CorporateNavDrawer";
import { useI18n } from "@/i18n/useI18n";
import type { Locale } from "@/i18n/config";

const headerLocales: Locale[] = ["es", "en", "ca"];

/**
 * Header quirúrgico Quiet Authority:
 * [Logo] [Banner Dumbo/Chico] [ES EN CAT + ☰]
 * Sin navegación horizontal permanente.
 */
export default function CorporateHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("argos-drawer-open", open);
    return () => document.body.classList.remove("argos-drawer-open");
  }, [open]);

  const goHome = () => {
    setOpen(false);
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push("/");
  };

  return (
    <header className="argos-corporate-header argos-corporate-header--surgical">
      <div className="argos-corporate-header__row">
        <Link
          href="/"
          className="argos-corporate-logo"
          aria-label="ARGOS-IT home"
          onClick={(event) => {
            event.preventDefault();
            goHome();
          }}
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

        <CorporateHeaderBanner className="argos-corporate-header__banner" />

        <div className="argos-corporate-header__controls">
          <div className="argos-corporate-header__langs notranslate" aria-label={t("language.label")}>
            {headerLocales.map((code) => (
              <button
                key={code}
                type="button"
                className={locale === code ? "is-active" : undefined}
                aria-pressed={locale === code}
                onClick={() => setLocale(code)}
              >
                {code === "ca" ? "CAT" : t(`language.${code}`)}
              </button>
            ))}
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
      </div>

      <CorporateNavDrawer
        open={open}
        onClose={() => {
          setOpen(false);
          toggleRef.current?.focus();
        }}
        menuId={menuId}
        pathname={pathname}
      />
    </header>
  );
}
