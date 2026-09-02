"use client";

import Link from "next/link";
import { useEffect } from "react";
import ArgosExpandableCard from "@/components/corporate/ArgosExpandableCard";
import ArgosReveal from "@/components/corporate/ArgosReveal";
import MethodArgosBar from "@/components/corporate/MethodArgosBar";
import PublicMovementsGrid from "@/components/corporate/PublicMovementsGrid";
import CorporatePageShell from "@/components/layout/CorporatePageShell";
import { useDiagnosticSurveyLauncher } from "@/components/diagnostic/DiagnosticSurveyLauncher";
import { useI18n } from "@/i18n/useI18n";
import { usePageMeta } from "@/components/seo/usePageMeta";
import { getAllMethodArgosSteps, METHOD_ARGOS_SLUGS } from "@/lib/methodArgosSteps";

export default function MethodView() {
  const { t, get } = useI18n();
  const steps = getAllMethodArgosSteps();
  const publicMethodSteps = get<Array<{ order: string; title: string; description: string }>>(
    "method.publicSteps",
    []
  );
  const methodStepsForBar = steps.map((s) => ({ id: s.letter, title: s.name }));
  const { openDiagnostic } = useDiagnosticSurveyLauncher();

  usePageMeta(t("meta.methodTitle"), t("meta.methodDescription"));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.location.hash.slice(1);
    if (raw === "gestionar") {
      document.getElementById("guiar")?.scrollIntoView({ behavior: "smooth", block: "start" });
      const prev = (window.history.state || {}) as Record<string, unknown>;
      window.history.replaceState({ ...prev }, "", `${window.location.pathname}#guiar`);
    } else if (raw === "sostener") {
      document.getElementById("supervisar")?.scrollIntoView({ behavior: "smooth", block: "start" });
      const prev = (window.history.state || {}) as Record<string, unknown>;
      window.history.replaceState({ ...prev }, "", `${window.location.pathname}#supervisar`);
    }
  }, []);

  return (
    <CorporatePageShell>
      <section className="argos-corp-section" aria-labelledby="method-title">
        <div className="argos-corp-container">
          <ArgosReveal>
            <MethodArgosBar
              as="h1"
              title={t("nav.methodArgos")}
              titleId="method-title"
              steps={methodStepsForBar}
              slugs={METHOD_ARGOS_SLUGS}
            />
            <p className="argos-corp-lead argos-corp-text-justify mt-6">{t("method.subtitle")}</p>
          </ArgosReveal>

          <ArgosReveal as="div" className="mt-8">
            <div className="argos-card argos-card--method argos-card--bridge">
              <p className="argos-corp-body argos-corp-text-justify">{t("method.dualBridge")}</p>
            </div>
          </ArgosReveal>

          <ArgosReveal as="div" className="mt-10">
            <h2 className="argos-font-display argos-corp-h2">{t("method.publicPhasesTitle")}</h2>
            <PublicMovementsGrid steps={publicMethodSteps} titleAs="h3" />
          </ArgosReveal>

          <ArgosReveal as="div" className="mt-10">
            <h2 className="argos-font-display argos-corp-h2">{t("method.operationalPhasesTitle")}</h2>
          </ArgosReveal>

          <ol className="argos-corp-phase-system mt-4">
            {steps.map((step) => (
              <li key={step.slug} id={step.slug}>
                <ArgosReveal as="div">
                  <Link href={step.path} className="argos-corp-phase-card argos-interactive-card">
                    <span className="argos-corp-phase-letter" aria-hidden="true">
                      {step.letter}
                    </span>
                    <span className="argos-corp-phase-title">{step.name}</span>
                    <span className="argos-corp-phase-desc">{step.valuePhrase}</span>
                  </Link>
                </ArgosReveal>
              </li>
            ))}
          </ol>

          <ul className="argos-card-grid mt-10">
            {steps.map((step) => (
              <li key={`detail-${step.slug}`}>
                <ArgosExpandableCard
                  variant="method"
                  title={`${step.letter} · ${step.name}`}
                  summary={<p className="argos-corp-card-body">{step.valuePhrase}</p>}
                  expandLabel={t("actions.viewDetail")}
                  detail={
                    <div className="argos-detail-section">
                      <p className="argos-corp-card-body argos-corp-text-justify">{step.meaning}</p>
                      <p className="argos-corp-card-body argos-corp-text-justify mt-4">{step.subtitle}</p>
                      <ul className="argos-corp-detail-list mt-4">
                        {step.argosActions.slice(0, 6).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <Link href={step.path} className="argos-corporate-link mt-6 inline-block argos-cta-arrow">
                        {t("actions.viewDetail")}
                      </Link>
                    </div>
                  }
                />
              </li>
            ))}
          </ul>

          <div className="argos-corp-related mt-10">
            <p className="argos-corp-related__label">{t("related.label")}</p>
            <div className="argos-corp-related__links">
              <button type="button" className="argos-corporate-cta" onClick={openDiagnostic}>
                {t("nav.startDiagnostic")} →
              </button>
              <Link href="/servicios" className="argos-corporate-link-quiet">
                {t("actions.viewServices")}
              </Link>
              <Link href="/contacto" className="argos-corporate-link-quiet">
                {t("nav.contact")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </CorporatePageShell>
  );
}
