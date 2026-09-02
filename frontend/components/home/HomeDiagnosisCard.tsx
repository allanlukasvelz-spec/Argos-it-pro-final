"use client";

import { diagnosticQuestions } from "@/components/diagnostic/diagnosticQuestions";
import { useDiagnosticSurveyLauncher } from "@/components/diagnostic/DiagnosticSurveyLauncher";
import { useI18n } from "@/i18n/useI18n";

/**
 * Tarjeta de conversión del hero — sustituye el panel oscuro Perimeter.
 * CTA → DiagnosticSurveyModal existente (12 preguntas, sin cambios de scoring).
 */
export default function HomeDiagnosisCard() {
  const { t } = useI18n();
  const { openDiagnostic } = useDiagnosticSurveyLauncher();
  const n = diagnosticQuestions.length;

  return (
    <aside className="argos-diag-card argos-diag-card--executive" aria-labelledby="home-diag-title">
      <p className="argos-diag-card__eyebrow">{t("home.diagEyebrow")}</p>
      <h2 id="home-diag-title" className="argos-font-display argos-diag-card__title">
        {t("home.diagTitle")}
      </h2>
      <p className="argos-diag-card__body argos-corp-text-justify">{t("home.diagBody")}</p>
      <ul className="argos-diag-card__points">
        <li>{t("home.diagPointQuestions").replace("{n}", String(n))}</li>
        <li>{t("home.diagPointResult")}</li>
        <li>{t("home.diagPointPriorities")}</li>
      </ul>
      <button type="button" className="argos-corporate-cta argos-diag-card__cta" onClick={openDiagnostic}>
        {t("nav.startDiagnostic")} →
      </button>
    </aside>
  );
}
