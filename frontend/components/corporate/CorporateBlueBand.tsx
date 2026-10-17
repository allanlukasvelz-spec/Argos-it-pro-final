"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/useI18n";

/**
 * Barra azul D+ — variante editorial (MASTER v2).
 * Fondo #102C54 y onda oficial subordinada al cierre. No usa la onda de interior.
 */
export default function CorporateBlueBand() {
  const { t } = useI18n();

  return (
    <section className="argos-dplus-blue-band" aria-labelledby="argos-blue-band-title">
      <img
        className="argos-dplus-blue-band__wave"
        src="/brand/onda-dplus.png"
        alt=""
        width={610}
        height={250}
      />
      <div className="argos-corp-container argos-dplus-blue-band__inner">
        <div>
          <h2 id="argos-blue-band-title" className="argos-dplus-blue-band__title">
            {t("home.finalCtaTitle")}
          </h2>
          <p className="argos-dplus-blue-band__lead">{t("home.finalCtaSubtitle")}</p>
        </div>
        <Link href="/contacto" className="argos-corporate-cta">
          {t("nav.contact")}
        </Link>
      </div>
    </section>
  );
}
