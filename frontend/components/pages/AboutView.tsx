"use client";

import Image from "next/image";
import Link from "next/link";
import CorporatePageShell from "@/components/layout/CorporatePageShell";
import { useI18n } from "@/i18n/useI18n";
import { usePageMeta } from "@/components/seo/usePageMeta";

export default function AboutView() {
  const { t, get } = useI18n();
  const paragraphs = get<string[]>("about.paragraphs", []);
  const values = get<string[]>("about.values", []);

  usePageMeta(t("meta.aboutTitle"), t("meta.aboutDescription"));

  return (
    <CorporatePageShell>
      <section className="argos-corp-section" aria-labelledby="about-title">
        <div className="argos-corp-container">
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_240px]">
            <div>
              <Link href="/" className="argos-corp-back">
                ← {t("actions.backHome")}
              </Link>
              <p className="argos-corp-section-index">04 / {t("nav.about")}</p>
              <h1 id="about-title" className="argos-font-display argos-corp-page-title">
                {t("about.title")}
              </h1>
              <div className="mt-5 space-y-4">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph} className="argos-corp-body">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <Image
                src="/argos-history-emblem.png"
                alt="Emblema de Chico y Dumbo en la historia de ARGOS-IT"
                width={220}
                height={220}
                className="h-auto w-48 max-w-full object-contain opacity-90 sm:w-56"
                priority={false}
              />
            </div>
          </div>

          <section className="argos-corporate-card argos-corp-detail-card mt-10" aria-labelledby="about-values-title">
            <h2 id="about-values-title" className="argos-font-display argos-corp-h2">
              {t("about.valuesTitle")}
            </h2>
            <ul className="argos-corp-principle-list">
              {values.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ul>
          </section>

          <div className="argos-corp-cta-row" style={{ marginTop: "2rem" }}>
            <Link href="/contacto" className="argos-corporate-cta">
              {t("actions.requestConsultation")}
            </Link>
            <Link href="/metodo" className="argos-corporate-link-quiet">
              {t("nav.methodArgos")}
            </Link>
            <Link href="/servicios" className="argos-corporate-link-quiet">
              {t("nav.services")}
            </Link>
          </div>
        </div>
      </section>
    </CorporatePageShell>
  );
}
