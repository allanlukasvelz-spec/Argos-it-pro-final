"use client";

import Link from "next/link";
import CorporatePageShell from "@/components/layout/CorporatePageShell";
import HomeDiagnosisCard from "@/components/home/HomeDiagnosisCard";
import ArgosExpandableCard from "@/components/corporate/ArgosExpandableCard";
import ArgosReveal from "@/components/corporate/ArgosReveal";
import MethodArgosBar from "@/components/corporate/MethodArgosBar";
import PublicMovementsGrid from "@/components/corporate/PublicMovementsGrid";
import { useDiagnosticSurveyLauncher } from "@/components/diagnostic/DiagnosticSurveyLauncher";
import { useMascotChat } from "@/components/mascots/MascotChatContext";
import { usePageMeta } from "@/components/seo/usePageMeta";
import { useLocalizedServices } from "@/hooks/useLocalizedServices";
import { useI18n } from "@/i18n/useI18n";
import { METHOD_ARGOS_SLUGS } from "@/lib/methodArgosSteps";

type MethodStepCopy = {
  id: string;
  title: string;
  description: string;
};

type MethodPublicStepCopy = {
  order: string;
  title: string;
  description: string;
};

/**
 * Corporate Home — Quiet Authority + Visual Refinement 05 containers.
 * Content Freeze v1.0: hero strings and diagnostic wiring unchanged.
 */
export default function HomeView() {
  const { t, get } = useI18n();
  const { openDiagnostic } = useDiagnosticSurveyLauncher();
  const { openGuidedReply } = useMascotChat();
  const services = useLocalizedServices();
  const realityItems = get<string[]>("home.realityItems", []);
  const realityExplains = get<string[]>("home.realityExplains", []);
  const principles = get<string[]>("home.trustItems", []);
  const methodSteps = get<MethodStepCopy[]>("method.steps", []);
  const publicMethodSteps = get<MethodPublicStepCopy[]>("method.publicSteps", []);
  const stabilityItems = get<string[]>("home.stabilityItems", []);
  const trustItems = get<string[]>("about.values", []);

  usePageMeta(t("meta.homeTitle"), t("meta.homeDescription"));

  const askDumboAboutReality = (index: number) => {
    const topic = realityItems[index];
    const reply = realityExplains[index];
    if (!topic || !reply) return;
    openGuidedReply("dumbo", topic, reply);
  };

  return (
    <CorporatePageShell className="argos-corp-home">
      {/* 1. Hero — frozen content */}
      <section className="argos-corp-section argos-corp-section--hero" aria-labelledby="home-hero-title">
        <div className="argos-corp-container argos-corp-hero-grid">
          <div className="argos-corp-hero-copy">
            <p className="argos-corp-brand-mark">{t("home.brandMark")}</p>
            <h1 id="home-hero-title" className="argos-font-display argos-corp-display">
              {t("home.title")}
            </h1>
            <p className="argos-corp-lead argos-corp-text-justify">{t("home.subtitle")}</p>
            <div className="argos-corp-cta-row">
              <button type="button" className="argos-corporate-cta" onClick={openDiagnostic}>
                {t("nav.startDiagnostic")}
              </button>
              <Link href="/metodo" className="argos-corporate-cta argos-corporate-cta--outline">
                {t("home.ctaHeroSecondary")}
              </Link>
            </div>
          </div>
          <HomeDiagnosisCard />
        </div>
      </section>

      {/* 2. Client reality — cream container + mint problem cards */}
      <section className="argos-corp-section argos-corp-section--ivory" aria-labelledby="home-problem-title">
        <ArgosReveal className="argos-corp-container">
          <article className="argos-surface-card argos-surface-card--01">
            <p className="argos-corp-section-index">{t("home.realityIndex")}</p>
            <h2 id="home-problem-title" className="argos-font-display argos-corp-h2">
              {t("home.problemTitle")}
            </h2>
            <p className="argos-corp-body argos-corp-text-justify">{t("home.problemLead")}</p>
            <ul className="argos-mint-card-grid">
              {realityItems.map((item, index) => (
                <li key={item}>
                  <button
                    type="button"
                    className="argos-mint-card argos-mint-card--interactive"
                    onClick={() => askDumboAboutReality(index)}
                    aria-label={`${t("home.realityAskDumbo")}: ${item}`}
                  >
                    <p className="argos-mint-card__title">{item}</p>
                    <span className="argos-mint-card__hint">{t("home.realityAskDumbo")}</span>
                  </button>
                </li>
              ))}
            </ul>
          </article>
        </ArgosReveal>
      </section>

      {/* 3. Philosophy — cream elevated card */}
      <section
        className="argos-corp-section argos-corp-section--sand"
        aria-labelledby="home-philosophy-title"
      >
        <ArgosReveal className="argos-corp-container">
          <article className="argos-surface-card argos-surface-card--02 argos-surface-card--philosophy">
            <p className="argos-corp-section-index" id="home-philosophy-title">
              {t("home.philosophyIndex")}
            </p>
            <blockquote className="argos-font-display argos-corp-quote argos-corp-quote--xl">
              {t("home.philosophyQuote")}
            </blockquote>
          </article>
        </ArgosReveal>
      </section>

      {/* 4. Principles */}
      <section className="argos-corp-section argos-corp-section--mist" aria-labelledby="home-principles-title">
        <ArgosReveal className="argos-corp-container argos-corp-container--editorial">
          <p className="argos-corp-section-index">{t("home.principlesIndex")}</p>
          <h2 id="home-principles-title" className="argos-font-display argos-corp-h2">
            {t("home.principlesTitle")}
          </h2>
          <ul className="argos-corp-principle-cards">
            {principles.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ArgosReveal>
      </section>

      {/* 5. Method — single primary bar + public philosophy layer */}
      <section className="argos-corp-section argos-corp-section--muted" aria-labelledby="home-method-title">
        <ArgosReveal className="argos-corp-container">
          <MethodArgosBar
            title={t("nav.methodArgos")}
            titleId="home-method-title"
            steps={methodSteps}
            slugs={METHOD_ARGOS_SLUGS}
          />
          <p className="argos-corp-body argos-corp-text-justify mt-6">{t("method.subtitle")}</p>
          <div className="argos-card argos-card--method argos-card--bridge mt-6">
            <p className="argos-corp-body argos-corp-text-justify">{t("method.dualBridge")}</p>
          </div>
          <p className="argos-corp-section-index mt-10">{t("home.publicPhasesIndex")}</p>
          <h3 className="argos-font-display argos-corp-h2 argos-corp-h2--subsection">
            {t("method.publicPhasesTitle")}
          </h3>
          <PublicMovementsGrid steps={publicMethodSteps} titleAs="h4" />
          <Link href="/metodo" className="argos-corporate-link mt-5 inline-block">
            {t("home.ctaHeroSecondary")}
          </Link>
        </ArgosReveal>
      </section>

      {/* 6. Six services — summary + Detail Mode */}
      <section className="argos-corp-section argos-corp-section--mist" aria-labelledby="home-services-title">
        <ArgosReveal className="argos-corp-container">
          <p className="argos-corp-section-index">{t("home.servicesIndex")}</p>
          <h2 id="home-services-title" className="argos-font-display argos-corp-h2">
            {t("home.servicesTitle")}
          </h2>
          <p className="argos-corp-body argos-corp-text-justify">{t("home.servicesSubtitle")}</p>
          <ul className="argos-card-grid argos-card-grid--services">
            {services.map((service) => (
              <li key={service.slug}>
                <ArgosExpandableCard
                  variant="service"
                  title={service.title}
                  summary={<p className="argos-corp-card-body argos-corp-text-justify">{service.description}</p>}
                  expandLabel={t("actions.viewDetail")}
                  detail={
                    <div className="argos-detail-section">
                      <p className="argos-corp-card-body argos-corp-text-justify">{service.problem}</p>
                      <ul className="argos-corp-detail-list mt-4">
                        {service.includes.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <Link href={`/servicios/${service.slug}`} className="argos-corporate-link mt-4 inline-block">
                        {t("actions.viewService")}
                      </Link>
                    </div>
                  }
                />
              </li>
            ))}
          </ul>
        </ArgosReveal>
      </section>

      {/* 7. Stability */}
      <section className="argos-corp-section argos-corp-section--ivory" aria-labelledby="home-stability-title">
        <ArgosReveal className="argos-corp-container argos-corp-container--editorial">
          <p className="argos-corp-section-index">{t("home.stabilityIndex")}</p>
          <h2 id="home-stability-title" className="argos-font-display argos-corp-h2">
            {t("home.stabilityTitle")}
          </h2>
          <ul className="argos-corp-rule-list">
            {stabilityItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ArgosReveal>
      </section>

      {/* 8. Human trust — fondo/tarjetas invertidos vs 06 Servicios */}
      <section className="argos-corp-section argos-corp-section--trust" aria-labelledby="home-trust-title">
        <ArgosReveal className="argos-corp-container">
          <p className="argos-corp-section-index">{t("home.trustIndex")}</p>
          <h2 id="home-trust-title" className="argos-font-display argos-corp-h2">
            {t("home.trustTitle")}
          </h2>
          <p className="argos-corp-body argos-corp-text-justify">{t("home.trustLead")}</p>
          <ul className="argos-card-grid argos-card-grid--trust">
            {trustItems.map((item) => (
              <li key={item}>
                <article className="argos-card argos-card--trust">
                  <p className="argos-corp-card-body">{item}</p>
                </article>
              </li>
            ))}
          </ul>
        </ArgosReveal>
      </section>

      {/* 9. Final CTA */}
      <section className="argos-corp-section argos-corp-section--cta" aria-labelledby="home-final-cta-title">
        <ArgosReveal className="argos-corp-container argos-corp-container--editorial">
          <h2 id="home-final-cta-title" className="argos-font-display argos-corp-h2">
            {t("home.finalCtaTitle")}
          </h2>
          <p className="argos-corp-body argos-corp-text-justify">{t("home.finalCtaSubtitle")}</p>
          <div className="argos-corp-cta-row">
            <Link href="/contacto" className="argos-corporate-cta">
              {t("nav.contact")}
            </Link>
            <Link href="/portal" className="argos-corporate-link-quiet">
              {t("nav.portal")}
            </Link>
          </div>
        </ArgosReveal>
      </section>
    </CorporatePageShell>
  );
}
