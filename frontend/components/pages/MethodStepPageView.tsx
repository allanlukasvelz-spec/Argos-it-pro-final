"use client";

import Link from "next/link";
import CorporatePageShell from "@/components/layout/CorporatePageShell";
import MethodArgosJourneyNav from "@/components/method/MethodArgosJourneyNav";
import { useDiagnosticSurveyLauncher } from "@/components/diagnostic/DiagnosticSurveyLauncher";
import { useLocalizedServiceBySlug } from "@/hooks/useLocalizedServices";
import { usePageMeta } from "@/components/seo/usePageMeta";
import { type ServiceSlug } from "@/lib/services";
import { type MethodArgosStep, type MethodStepCta } from "@/lib/methodArgosSteps";

type Props = {
  step: MethodArgosStep;
};

function RelatedServiceCard({ slug }: { slug: ServiceSlug }) {
  const service = useLocalizedServiceBySlug(slug);
  if (!service) return null;
  return (
    <Link href={`/servicios/${slug}`} className="argos-corporate-card argos-corp-service-card">
      <p className="argos-corp-eyebrow">Servicio relacionado</p>
      <h3 className="argos-corp-card-title">{service.title}</h3>
      <p className="argos-corp-card-body">{service.description}</p>
      <span className="argos-corporate-link">Ver ficha</span>
    </Link>
  );
}

function MethodCtaControl({
  cta,
  variant
}: {
  cta: MethodStepCta;
  variant: "primary" | "secondary";
}) {
  const { openDiagnostic } = useDiagnosticSurveyLauncher();

  const className =
    variant === "primary" ? "argos-corporate-cta" : "argos-corporate-link-quiet";

  if (cta.type === "diagnostic") {
    return (
      <button type="button" onClick={openDiagnostic} className={className}>
        {cta.label}
      </button>
    );
  }

  const href =
    cta.type === "contact"
      ? "/contacto"
      : cta.type === "register"
        ? "/auth/register"
        : cta.type === "login"
          ? "/auth/login"
          : cta.type === "services"
            ? cta.href ?? "/servicios"
            : "/servicios";

  return (
    <Link href={href} className={className}>
      {cta.label}
    </Link>
  );
}

export default function MethodStepPageView({ step }: Props) {
  usePageMeta(step.seoTitle, step.description);

  return (
    <CorporatePageShell>
      <section className="argos-corp-section" aria-labelledby="method-step-title">
        <div className="argos-corp-container" style={{ maxWidth: "64rem" }}>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/metodo" className="argos-corp-back">
              ← Volver al método ARGOS
            </Link>
            <Link href="/" className="argos-corporate-link-quiet">
              Inicio
            </Link>
          </div>

          <MethodArgosJourneyNav activeSlug={step.slug} className="mt-6 argos-corp-journey" />

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="argos-corp-eyebrow">
                {step.letter} · {step.name}
              </p>
              <h1 id="method-step-title" className="argos-font-display argos-corp-page-title">
                {step.h1}
              </h1>
              <p className="argos-corp-lead">{step.subtitle}</p>
              <p className="argos-corp-body mt-4 font-semibold text-[var(--text-primary)]">
                {step.valuePhrase}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
              <MethodCtaControl cta={step.primaryCta} variant="primary" />
              <MethodCtaControl cta={step.secondaryCta} variant="secondary" />
            </div>
          </div>

          <article className="argos-corporate-card argos-corp-detail-card mt-8">
            <h2>Qué significa esta fase</h2>
            <p className="argos-corp-body mt-4">{step.meaning}</p>
          </article>

          <div className="argos-corp-detail-grid">
            <article className="argos-corporate-card argos-corp-detail-card">
              <h2>Problemas que abordamos</h2>
              <ul className="argos-corp-detail-list">
                {step.problems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="argos-corporate-card argos-corp-detail-card">
              <h2>Señales de alerta</h2>
              <ul className="argos-corp-detail-list">
                {step.warningSigns.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className="argos-corp-detail-grid">
            <article className="argos-corporate-card argos-corp-detail-card">
              <h2>Qué hace ARGOS-IT</h2>
              <ul className="argos-corp-detail-list">
                {step.argosActions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="argos-corporate-card argos-corp-detail-card">
              <h2>Resultados esperados</h2>
              <ul className="argos-corp-detail-list">
                {step.results.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <article className="argos-corporate-card argos-corp-detail-card mt-4">
            <h2>Relación con el diagnóstico ARGOS</h2>
            <p className="argos-corp-body mt-4">{step.diagnosticRelation}</p>
          </article>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {step.relatedServiceSlugs.map((slug) => (
              <RelatedServiceCard key={slug} slug={slug} />
            ))}
          </div>

          <article className="argos-corporate-card argos-corp-detail-card mt-4">
            <h2>{step.portalCopy.title}</h2>
            <p className="argos-corp-body mt-4">{step.portalCopy.body}</p>
          </article>

          <article className="argos-corporate-card argos-corp-detail-card mt-4">
            <h2>Proceso típico en esta fase</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-[0.9375rem] leading-6 text-[var(--text-secondary)]">
              {step.processSteps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>

          <section className="mt-8" aria-label="Preguntas frecuentes">
            <h2 className="argos-font-display argos-corp-h2">Preguntas frecuentes</h2>
            <div className="mt-5 space-y-3">
              {step.faq.map((item) => (
                <details
                  key={item.question}
                  className="group overflow-hidden rounded-lg border border-[var(--border-default)] bg-white [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold text-[var(--text-primary)]">
                    <span className="flex items-center justify-between gap-4">
                      {item.question}
                      <span className="shrink-0 text-[var(--action-secondary)] transition group-open:rotate-45" aria-hidden>
                        +
                      </span>
                    </span>
                  </summary>
                  <div className="border-t border-[var(--border-default)] px-5 pb-4">
                    <p className="pt-4 text-sm leading-7 text-[var(--text-secondary)]">{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-default)] pt-8">
            <div className="flex flex-wrap gap-3">
              {step.prevSlug ? (
                <Link href={`/metodo/${step.prevSlug}`} className="argos-corporate-link">
                  ← Fase anterior
                </Link>
              ) : (
                <span className="text-sm text-[var(--text-muted)]">Inicio del método</span>
              )}
              {step.nextSlug ? (
                <Link href={`/metodo/${step.nextSlug}`} className="argos-corporate-link">
                  Siguiente fase →
                </Link>
              ) : (
                <Link href="/metodo/analizar" className="argos-corporate-link">
                  Volver a Analizar →
                </Link>
              )}
            </div>
            <Link href="/metodo" className="argos-corporate-link-quiet">
              Ver hub del método
            </Link>
          </div>

          <section className="mt-10 rounded-lg border border-[var(--border-default)] bg-white p-6 md:p-8">
            <h2 className="argos-font-display argos-corp-h2">Siguiente paso</h2>
            <p className="argos-corp-body mt-3">
              Elige cómo quieres continuar. Si aún no tienes una fotografía clara del estado actual, el
              diagnóstico ARGOS ordena prioridades sin comprometer recursos a ciegas.
            </p>
            <div className="argos-corp-cta-row">
              <MethodCtaControl cta={step.primaryCta} variant="primary" />
              <MethodCtaControl cta={step.secondaryCta} variant="secondary" />
            </div>
          </section>
        </div>
      </section>
    </CorporatePageShell>
  );
}
