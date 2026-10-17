"use client";

import Link from "next/link";
import CorporatePageShell from "@/components/layout/CorporatePageShell";
import HomeDiagnosisCard from "@/components/home/HomeDiagnosisCard";
import HomeFaq from "@/components/home/HomeFaq";
import HomeStrategicPillars from "@/components/home/HomeStrategicPillars";
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
import {
  SELF_SERVICE_HOME_CTA,
  SELF_SERVICE_HOME_LEAD,
  SELF_SERVICE_HOME_TITLE
} from "@/lib/webProjects/selfServiceUi";

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
  const methodSteps = get<MethodStepCopy[]>("method.steps", []);
  const publicMethodSteps = get<MethodPublicStepCopy[]>("method.publicSteps", []);
  const stabilityItems = get<string[]>("home.stabilityItems", []);
  const confidenceItems = get<string[]>("home.trustItems", []);

  usePageMeta(t("meta.homeTitle"), t("meta.homeDescription"));

  const askDumboAboutReality = (index: number) => {
    const topic = realityItems[index];
    const reply = realityExplains[index];
    if (!topic || !reply) return;
    openGuidedReply("dumbo", topic, reply);
  };

  return (
    <CorporatePageShell className="argos-corp-home">
      {/* 02 Hero — copy congelado. Foto A+B subordinada al texto. Onda oficial debajo del copy. */}
      <section className="argos-corp-section argos-corp-section--hero argos-corp-section--dplus-hero" aria-labelledby="home-hero-title">
        <picture className="argos-hero-photo">
          <source media="(max-width: 480px)" srcSet="/hero/hero-argos-ab-390.webp" />
          <source media="(max-width: 1024px)" srcSet="/hero/hero-argos-ab-768.webp" />
          <img
            className="argos-hero-photo__img"
            src="/hero/hero-argos-ab.webp"
            alt=""
            width={2560}
            height={1440}
            decoding="async"
          />
        </picture>
        <div className="argos-hero-veil" aria-hidden="true" />
        <div className="argos-corp-container">
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
        </div>
        <img
          className="argos-dplus-wave argos-dplus-wave--hero"
          src="/brand/onda-dplus.png"
          alt=""
          width={610}
          height={250}
        />
      </section>

      {/* 03 Confianza — cuatro argumentos ya escritos. Sin métricas ni logos. */}
      <section className="argos-corp-section argos-corp-section--dplus-trust" aria-labelledby="home-trust-title">
        <div className="argos-corp-container">
          <p className="argos-corp-section-index">{t("home.trustIndex")}</p>
          <h2 id="home-trust-title" className="argos-font-display argos-corp-h2">
            {t("home.trustTitle")}
          </h2>
          <p className="argos-corp-body argos-corp-text-justify">{t("home.trustLead")}</p>
          <ul className="argos-corp-rule-list">
            {confidenceItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 04 Problema */}
      <section className="argos-corp-section argos-corp-section--dplus-problem" aria-labelledby="home-problem-title">
        <ArgosReveal className="argos-corp-container">
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
        </ArgosReveal>
      </section>

      <HomeStrategicPillars />

      {/* 06 Servicios */}
      <section className="argos-corp-section argos-corp-section--dplus-services" aria-labelledby="home-services-title">
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

      {/* 07 Método ARGOS. Independencia y casos reales: sin copy ni evidencia aprobada. */}
      <section className="argos-corp-section argos-corp-section--dplus-method" aria-labelledby="home-method-title">
        <ArgosReveal className="argos-corp-container">
          <p className="argos-corp-section-index">{t("home.methodIndex")}</p>
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

      {/* 08 Diagnóstico — la tarjeta sale del hero y ocupa su lugar en la narrativa. */}
      <section className="argos-corp-section argos-corp-section--dplus-diagnosis" aria-labelledby="home-diag-title">
        <div className="argos-corp-container">
          <HomeDiagnosisCard />
        </div>
      </section>

      {/* 09 Tres modalidades: diagnóstico, proyecto y continuidad. Copy existente. */}
      <section
        className="argos-corp-section argos-corp-section--dplus-modes"
        aria-labelledby="home-mode-diag home-web-project-title home-stability-title"
      >
        <div className="argos-corp-container">
          <ul className="argos-home-modes">
            <li>
              <h2 id="home-mode-diag" className="argos-font-display argos-corp-h2">
                {t("home.ctaDiagnostic")}
              </h2>
              <p className="argos-corp-body argos-corp-text-justify">{t("home.diagBody")}</p>
              <button type="button" className="argos-corporate-cta" onClick={openDiagnostic}>
                {t("nav.startDiagnostic")}
              </button>
            </li>
            <li>
              <h2 id="home-web-project-title" className="argos-font-display argos-corp-h2">
                {SELF_SERVICE_HOME_TITLE}
              </h2>
              <p className="argos-corp-body argos-corp-text-justify">{SELF_SERVICE_HOME_LEAD}</p>
              <Link href="/proyecto-web" className="argos-corporate-cta">
                {SELF_SERVICE_HOME_CTA}
              </Link>
            </li>
            <li>
              <h2 id="home-stability-title" className="argos-font-display argos-corp-h2">
                {t("home.stabilityTitle")}
              </h2>
              <ul className="argos-corp-rule-list">
                {stabilityItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          </ul>
        </div>
      </section>

      {/* 10 Tecnología comprensible — cita editorial ya aprobada. */}
      <section className="argos-corp-section argos-corp-section--dplus-philosophy" aria-labelledby="home-philosophy-title">
        <div className="argos-corp-container argos-corp-container--editorial">
          <p className="argos-corp-section-index" id="home-philosophy-title">
            {t("home.philosophyIndex")}
          </p>
          <blockquote className="argos-font-display argos-corp-quote argos-corp-quote--xl">
            {t("home.philosophyQuote")}
          </blockquote>
        </div>
      </section>

      <HomeFaq />
    </CorporatePageShell>
  );
}
