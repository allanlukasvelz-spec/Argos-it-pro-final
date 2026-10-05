"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/useI18n";

/**
 * Barra azul D+ — variante editorial (MASTER v2).
 * Onda oficial: ASSET_REQUIRED (pendiente asset en repo); fondo #102C54.
 */
export default function CorporateBlueBand() {
  const { t } = useI18n();

  return (
    <section className="argos-dplus-blue-band" aria-labelledby="argos-blue-band-title">
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
