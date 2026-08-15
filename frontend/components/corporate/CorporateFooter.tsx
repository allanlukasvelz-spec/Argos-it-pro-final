"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/i18n/useI18n";
import { corporateFooterNav, corporateLegalNav } from "@/lib/corporateNav";

export default function CorporateFooter() {
  const { t } = useI18n();

  return (
    <footer className="argos-corporate-footer">
      <div className="argos-corporate-footer__grid">
        <div>
          <Image
            src="/logo-argos-it.png"
            alt="Logo ARGOS-IT"
            width={210}
            height={54}
            className="argos-corporate-footer__logo"
            loading="lazy"
          />
          <p className="argos-corporate-footer__tagline">{t("footer.tagline")}</p>
        </div>

        <div>
          <p className="argos-corporate-footer__heading">{t("nav.services")}</p>
          <nav className="argos-corporate-footer__links" aria-label={t("nav.services")}>
            {corporateFooterNav.map((item) => (
              <Link key={item.href} href={item.href}>
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div>
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
