"use client";

import Link from "next/link";
import CorporatePageShell from "@/components/layout/CorporatePageShell";
import { type ServiceSlug } from "@/lib/services";
import { useI18n } from "@/i18n/useI18n";
import { useLocalizedServiceBySlug } from "@/hooks/useLocalizedServices";
import { usePageMeta } from "@/components/seo/usePageMeta";

type Props = {
  slug: ServiceSlug;
};

function ProblemBody({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="space-y-4 text-left">
      {paragraphs.map((para, index) => (
        <p key={`${index}-${para.slice(0, 32)}`} className="argos-corp-body">
          {para}
        </p>
      ))}
    </div>
  );
}

export default function ServiceDetailView({ slug }: Props) {
  const { t } = useI18n();
  const service = useLocalizedServiceBySlug(slug);

  usePageMeta(
    `${service?.title ?? "ARGOS-IT"} | ARGOS-IT`,
    service?.description ?? t("meta.defaultDescription")
  );

  if (!service) return null;

  return (
    <CorporatePageShell>
      <section className="argos-corp-section" aria-labelledby="service-detail-title">
        <div className="argos-corp-container" style={{ maxWidth: "64rem" }}>
          <Link href="/servicios" className="argos-corp-back">
            ← {t("actions.backServices")}
          </Link>
          <h1 id="service-detail-title" className="argos-font-display argos-corp-page-title">
            {service.title}
          </h1>
          <p className="argos-corp-lead">{service.description}</p>

          <div className="argos-corp-detail-grid">
            <article className="argos-corporate-card argos-corp-detail-card">
              <h2>{t("serviceDetail.problemTitle")}</h2>
              <div className="mt-4">
                <ProblemBody text={service.problem} />
              </div>
            </article>
            <article className="argos-corporate-card argos-corp-detail-card">
              <h2>{t("serviceDetail.audienceTitle")}</h2>
              <ul className="argos-corp-detail-list">
                {service.audience.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <section className="argos-corporate-card argos-corp-detail-card mt-4">
            <h2>{t("serviceDetail.includesTitle")}</h2>
            <ul className="argos-corp-detail-list" style={{ display: "grid", gap: "0.25rem" }}>
              {service.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <div className="argos-corp-detail-grid">
            <article className="argos-corporate-card argos-corp-detail-card">
              <h2>{t("serviceDetail.benefitsTitle")}</h2>
              <ul className="argos-corp-detail-list">
                {service.benefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="argos-corporate-card argos-corp-detail-card">
              <h2>{t("serviceDetail.processTitle")}</h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-[0.9375rem] leading-6 text-[var(--text-secondary)]">
                {service.process.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </article>
          </div>

          <section className="argos-corp-section--cta mt-10 rounded-lg border border-[var(--border-default)] bg-white p-6 md:p-8">
            <h2 className="argos-font-display argos-corp-h2">{t("serviceDetail.ctaTitle")}</h2>
            <p className="argos-corp-body mt-3">{t("serviceDetail.ctaSubtitle")}</p>
            <div className="argos-corp-cta-row">
              <Link href={`/contacto?service=${slug}`} className="argos-corporate-cta">
                {t("actions.requestConsultation")}
              </Link>
              <Link href="/metodo" className="argos-corporate-link-quiet">
                {t("actions.viewMethod")}
              </Link>
            </div>
          </section>
        </div>
      </section>
    </CorporatePageShell>
  );
}
