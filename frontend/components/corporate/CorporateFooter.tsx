"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/i18n/useI18n";
import { corporateFooterNav, corporateLegalNav } from "@/lib/corporateNav";

/**
 * Cierre institucional. La marca es el archivo oficial.
 * Chico y Dumbo no forman parte del footer.
 */
export default function CorporateFooter() {
  const { t } = useI18n();

  return (
    <footer className="argos-corporate-footer">
      <div className="argos-corporate-footer__grid">
        <div className="argos-corporate-footer__brand">
          <Link
            href="/"
            className="argos-corporate-footer__brand-mark"
            aria-label="ARGOS-IT home"
          >
            <Image
              src="/logo-argos-it-footer.png"
              alt="Logo ARGOS-IT"
              width={514}
              height={469}
              className="argos-corporate-footer__logo"
              loading="lazy"
            />
          </Link>
          <p className="argos-corporate-footer__tagline">{t("footer.tagline")}</p>
        </div>

        <div className="argos-corporate-footer__nav">
          <p className="argos-corporate-footer__heading">{t("nav.menu")}</p>
          <nav className="argos-corporate-footer__links" aria-label={t("nav.menu")}>
            {corporateFooterNav.map((item) => (
              <Link key={item.href} href={item.href}>
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="argos-corporate-footer__legal-col">
          <p className="argos-corporate-footer__heading">Legal</p>
          <nav className="argos-corporate-footer__links" aria-label="Legal">
            {corporateLegalNav.map((item) => (
              <Link key={item.href} href={item.href}>
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="argos-corporate-footer__legal">{t("footer.rights")}</div>
    </footer>
  );
}
