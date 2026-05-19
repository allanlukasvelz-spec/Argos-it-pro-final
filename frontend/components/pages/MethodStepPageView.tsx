"use client";

import Link from "next/link";
import { useMemo } from "react";
import ArgosPageShell from "@/components/layout/ArgosPageShell";
import { useDiagnosticSurveyLauncher } from "@/components/diagnostic/DiagnosticSurveyLauncher";
import { useLocalizedServiceBySlug } from "@/hooks/useLocalizedServices";
import { usePageMeta } from "@/components/seo/usePageMeta";
import { type ServiceSlug } from "@/lib/services";
import { getAllMethodArgosSteps, type MethodArgosStep, type MethodStepCta } from "@/lib/methodArgosSteps";

type Props = {
  step: MethodArgosStep;
};

function RelatedServiceCard({ slug }: { slug: ServiceSlug }) {
  const service = useLocalizedServiceBySlug(slug);
  if (!service) return null;
  return (
    <Link
      href={`/servicios/${slug}`}
      className="argos-hologram-card flex flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:border-[#18D4F7]/45"
    >
      <div>
        <p className="text-xs font-black uppercase text-[#39F4FF]">Servicio relacionado</p>
        <h3 className="mt-2 text-lg font-black text-white">{service.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#C9DDEC]">{service.description}</p>
      </div>
      <span className="mt-4 text-sm font-bold text-[#39F4FF]">Ver ficha →</span>
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

  const primaryClass =
    "inline-flex justify-center rounded-md bg-[#18D4F7] px-5 py-3 text-center text-sm font-black text-[#030812] transition hover:bg-[#39F4FF]";
  const secondaryClass =
    "inline-flex justify-center rounded-md border border-white/20 bg-white/5 px-5 py-3 text-center text-sm font-bold text-white backdrop-blur transition hover:border-[#18D4F7] hover:bg-white/10";

  const className = variant === "primary" ? primaryClass : secondaryClass;

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
  const steps = useMemo(() => getAllMethodArgosSteps(), []);

  usePageMeta(step.seoTitle, step.description);

  return (
    <ArgosPageShell variant="method">
      <section className="px-5 py-12 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/metodo" className="text-sm font-bold text-[#39F4FF]">
              ← Volver al método ARGOS
            </Link>
            <span className="hidden text-[#5a7a92] sm:inline" aria-hidden>
              ·
            </span>
            <Link href="/" className="text-sm font-bold text-[#39F4FF]/90">
              Inicio
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase text-[#18D4F7]">
                {step.letter} · {step.name}
              </p>
              <h1 className="mt-2 text-4xl font-black text-white lg:text-5xl">{step.h1}</h1>
              <p className="mt-4 text-lg leading-8 text-[#D7E8F6]">{step.subtitle}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
              <MethodCtaControl cta={step.primaryCta} variant="primary" />
              <MethodCtaControl cta={step.secondaryCta} variant="secondary" />
            </div>
          </div>

          <p className="mt-8 max-w-4xl rounded-lg border border-[#18D4F7]/25 bg-white/[.06] p-4 text-sm font-bold leading-7 text-[#EAF7FF]">
            {step.valuePhrase}
          </p>

          <nav
            className="mt-10 flex flex-wrap gap-2 border-b border-white/10 pb-6"
            aria-label="Fases del método ARGOS"
          >
            {steps.map((s) => (
              <Link
                key={s.slug}
                href={s.path}
                className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${
                  s.slug === step.slug
                    ? "border-[#18D4F7] bg-[#18D4F7]/15 text-white"
                    : "border-white/15 bg-white/[.04] text-[#BFD7E8] hover:border-[#18D4F7]/40"
                }`}
              >
                <span className="text-[#39F4FF]">{s.letter}</span> {s.name}
              </Link>
            ))}
          </nav>

          <article className="argos-hologram-card mt-8 scroll-mt-[calc(var(--header-h)+1rem)] p-6 md:p-8">
            <h2 className="text-xl font-black text-white">Qué significa esta fase</h2>
            <p className="mt-4 text-sm leading-7 text-[#D7E8F6]">{step.meaning}</p>
          </article>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <article className="argos-hologram-card p-6">
              <h2 className="text-xl font-black text-white">Problemas que abordamos</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[#C9DDEC]">
                {step.problems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="argos-hologram-card p-6">
              <h2 className="text-xl font-black text-white">Señales de alerta</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[#C9DDEC]">
                {step.warningSigns.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <article className="argos-hologram-card p-6">
              <h2 className="text-xl font-black text-white">Qué hace ARGOS-IT</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[#C9DDEC]">
                {step.argosActions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="argos-hologram-card p-6">
              <h2 className="text-xl font-black text-white">Resultados esperados</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[#C9DDEC]">
                {step.results.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <article className="argos-hologram-card mt-6 p-6">
            <h2 className="text-xl font-black text-white">Relación con el diagnóstico ARGOS</h2>
            <p className="mt-4 text-sm leading-7 text-[#D7E8F6]">{step.diagnosticRelation}</p>
          </article>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {step.relatedServiceSlugs.map((slug) => (
              <RelatedServiceCard key={slug} slug={slug} />
            ))}
          </div>

          <article className="argos-hologram-card mt-6 p-6">
            <h2 className="text-xl font-black text-white">{step.portalCopy.title}</h2>
            <p className="mt-4 text-sm leading-7 text-[#D7E8F6]">{step.portalCopy.body}</p>
          </article>

          <article className="argos-hologram-card mt-6 p-6">
            <h2 className="text-xl font-black text-white">Proceso típico en esta fase</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-[#D7E8F6]">
              {step.processSteps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>

          <section className="mt-8" aria-label="Preguntas frecuentes">
            <h2 className="text-2xl font-black text-white">Preguntas frecuentes</h2>
            <div className="mt-5 space-y-3">
              {step.faq.map((item) => (
                <details
                  key={item.question}
                  className="group argos-hologram-card overflow-hidden border-white/10 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="cursor-pointer list-none px-5 py-4 text-sm font-black text-white transition group-open:bg-white/[.08]">
                    <span className="flex items-center justify-between gap-4">
                      {item.question}
                      <span className="shrink-0 text-[#39F4FF] transition group-open:rotate-45" aria-hidden>
                        +
                      </span>
                    </span>
                  </summary>
                  <div className="border-t border-white/10 px-5 pb-4 pt-0">
                    <p className="pt-4 text-sm leading-7 text-[#C9DDEC]">{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
            <div className="flex flex-wrap gap-3">
              {step.prevSlug ? (
                <Link
                  href={`/metodo/${step.prevSlug}`}
                  className="text-sm font-bold text-[#39F4FF] transition hover:text-[#18D4F7]"
                >
                  ← Fase anterior
                </Link>
              ) : (
                <span className="text-sm text-[#5a7a92]">Inicio del método</span>
              )}
              {step.nextSlug ? (
                <Link
                  href={`/metodo/${step.nextSlug}`}
                  className="text-sm font-bold text-[#39F4FF] transition hover:text-[#18D4F7]"
                >
                  Siguiente fase →
                </Link>
              ) : (
                <Link href="/metodo/analizar" className="text-sm font-bold text-[#39F4FF] transition hover:text-[#18D4F7]">
                  Volver a Analizar →
                </Link>
              )}
            </div>
            <Link
              href="/metodo"
              className="rounded-md border border-[#18D4F7]/35 bg-white/[.06] px-4 py-2 text-sm font-black text-[#39F4FF] transition hover:bg-white/[.1]"
            >
              Ver hub del método
            </Link>
          </div>

          <section className="argos-tech-frame mt-10 p-6 md:p-8">
            <h2 className="text-2xl font-black text-white">Siguiente paso</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#C9DDEC]">
              Elige cómo quieres continuar. Si aún no tienes una fotografía clara del estado actual, el diagnóstico ARGOS
              ordena prioridades sin comprometer recursos a ciegas.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <MethodCtaControl cta={step.primaryCta} variant="primary" />
              <MethodCtaControl cta={step.secondaryCta} variant="secondary" />
            </div>
          </section>
        </div>
      </section>
    </ArgosPageShell>
  );
}
