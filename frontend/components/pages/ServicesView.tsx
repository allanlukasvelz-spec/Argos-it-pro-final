"use client";

import Link from "next/link";
import ArgosCard from "@/components/corporate/ArgosCard";
import ArgosExpandableCard from "@/components/corporate/ArgosExpandableCard";
import ArgosReveal from "@/components/corporate/ArgosReveal";
import CorporatePageShell from "@/components/layout/CorporatePageShell";
import { useI18n } from "@/i18n/useI18n";
import { useLocalizedServices } from "@/hooks/useLocalizedServices";
import { usePageMeta } from "@/components/seo/usePageMeta";

export default function ServicesView() {
  const { t, get } = useI18n();
  const services = useLocalizedServices();
  const strategicPillars = get<string[]>("servicesPage.strategicPillars", []);

  usePageMeta(t("meta.servicesTitle"), t("meta.servicesDescription"));

  return (
    <CorporatePageShell>
      <section className="argos-corp-section" aria-labelledby="services-title">
        <div className="argos-corp-container">
          <ArgosReveal>
            <p className="argos-corp-section-index">02 / {t("nav.services")}</p>
            <h1 id="services-title" className="argos-font-display argos-corp-page-title">
              {t("servicesPage.title")}
            </h1>
            <p className="argos-corp-lead">{t("servicesPage.subtitle")}</p>
          </ArgosReveal>

          {strategicPillars.length > 0 ? (
            <ArgosReveal as="div" className="mt-8">
              <ul className="argos-card-grid argos-card-grid--pillars" aria-label={strategicPillars.join(", ")}>
                {strategicPillars.map((pillar) => (
                  <li key={pillar}>
                    <ArgosCard variant="pillar">
                      <p className="argos-corp-card-title">{pillar}</p>
                    </ArgosCard>
                  </li>
                ))}
              </ul>
            </ArgosReveal>
          ) : null}

          <ul className="argos-card-grid argos-card-grid--services mt-10">
            {services.map((service) => (
              <li key={service.slug}>
                <ArgosReveal as="div">
                  <ArgosExpandableCard
                    variant="service"
                    title={service.title}
                    summary={<p className="argos-corp-card-body">{service.description}</p>}
                    expandLabel={t("actions.viewDetail")}
                    detail={
                      <div className="argos-detail-section">
                        <p className="argos-corp-card-body">{service.problem}</p>
                        <h3 className="argos-corp-card-title mt-6">{t("servicesPage.includesTitle")}</h3>
                        <ul className="argos-corp-detail-list mt-3">
                          {service.includes.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <h3 className="argos-corp-card-title mt-6">{t("servicesPage.benefitsTitle")}</h3>
                        <ul className="argos-corp-detail-list mt-3">
                          {service.benefits.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <Link
                          href={`/servicios/${service.slug}`}
                          className="argos-corporate-link mt-6 inline-block argos-cta-arrow"
                        >
                          {t("actions.viewService")}
                        </Link>
                      </div>
                    }
                  />
                </ArgosReveal>
              </li>
            ))}
          </ul>

          <div className="argos-corp-related mt-10">
            <p className="argos-corp-related__label">{t("related.label")}</p>
            <div className="argos-corp-related__links">
              <Link href="/metodo" className="argos-corporate-link-quiet">
                {t("nav.methodArgos")}
              </Link>
              <Link href="/contacto" className="argos-corporate-cta">
                {t("actions.requestConsultation")}
              </Link>
              <Link href="/portal" className="argos-corporate-link-quiet">
                {t("nav.portalShort")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </CorporatePageShell>
  );
}
