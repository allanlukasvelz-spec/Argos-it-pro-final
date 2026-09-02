"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/i18n/useI18n";
import { corporateFooterNav, corporateLegalNav } from "@/lib/corporateNav";

/**
 * Footer brand: rectangular navy ARGOS-IT mark (white art on dark field).
 * Seated mascots: Dumbo (guía) left, Chico (protege) right — real assets only.
 */
export default function CorporateFooter() {
  const { t } = useI18n();

  return (
    <footer className="argos-corporate-footer">
      <div className="argos-corporate-footer__mascot argos-corporate-footer__mascot--dumbo" aria-hidden="true">
        <Image
          src="/mascots/dumbo/dumbo_sentado_atento.png"
          alt=""
          width={120}
          height={120}
          className="argos-corporate-footer__mascot-img"
          loading="lazy"
        />
      </div>
      <div className="argos-corporate-footer__mascot argos-corporate-footer__mascot--chico" aria-hidden="true">
        <Image
          src="/mascots/chico/chico_sit.png"
          alt=""
          width={120}
          height={120}
          className="argos-corporate-footer__mascot-img"
          loading="lazy"
        />
      </div>

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
              width={1024}
              height={452}
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
