"use client";

import Link from "next/link";
import CorporatePageShell from "@/components/layout/CorporatePageShell";
import { useI18n } from "@/i18n/useI18n";
import { usePageMeta } from "@/components/seo/usePageMeta";

/**
 * Página pública Portal — acceso autenticado + soporte.
 * No duplica el formulario de login (/auth/login).
 */
export default function PortalView() {
  const { t } = useI18n();

  usePageMeta(t("meta.portalTitle"), t("meta.portalDescription"));

  return (
    <CorporatePageShell>
      <section className="argos-corp-section" aria-labelledby="portal-title">
        <div className="argos-corp-container argos-corp-container--narrow">
          <h1 id="portal-title" className="argos-font-display argos-corp-page-title">
            {t("portalPage.title")}
          </h1>
          <p className="argos-corp-lead">{t("portalPage.lead")}</p>

          <div className="argos-corp-link-cards" style={{ marginTop: "2rem" }}>
            <article className="argos-corporate-card argos-corp-detail-card">
              <h2 className="argos-corp-card-title">{t("portalPage.accessTitle")}</h2>
              <p className="argos-corp-card-body">{t("portalPage.accessBody")}</p>
              <Link href="/auth/login" className="argos-corporate-cta argos-corp-link-card__cta">
                {t("drawer.clientAccess")} →
              </Link>
            </article>

            <article className="argos-corporate-card argos-corp-detail-card">
              <h2 className="argos-corp-card-title">{t("portalPage.supportTitle")}</h2>
              <p className="argos-corp-card-body">{t("portalPage.supportBody")}</p>
              <Link href="/contacto" className="argos-corporate-link">
                {t("nav.contact")} →
              </Link>
            </article>
          </div>

          <div className="argos-corp-related" style={{ marginTop: "2.5rem" }}>
            <p className="argos-corp-related__label">{t("related.label")}</p>
            <div className="argos-corp-related__links">
              <Link href="/servicios" className="argos-corporate-link-quiet">
                {t("nav.services")}
              </Link>
              <Link href="/metodo" className="argos-corporate-link-quiet">
                {t("nav.methodArgos")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </CorporatePageShell>
  );
}
