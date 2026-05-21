"use client";

import Link from "next/link";
import ArgosPageShell from "@/components/layout/ArgosPageShell";
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
    <div className="space-y-4 text-left text-sm leading-7 text-[#D7E8F6]">
      {paragraphs.map((para, index) => (
        <p key={`${index}-${para.slice(0, 32)}`}>{para}</p>
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

  const stackedIntro = slug === "mantenimiento-informatico";

  return (
    <ArgosPageShell variant="services">
      <section className="px-5 py-12 text-left lg:px-8 lg:py-14">
        <div className="mx-auto max-w-5xl">
          <Link href="/servicios" className="text-sm font-bold text-[#39F4FF] hover:text-[#67E8F9]">
            ← {t("actions.backServices")}
          </Link>
          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white">{service.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#D7E8F6]">{service.description}</p>

          <div
            className={`mt-10 grid gap-8 ${stackedIntro ? "grid-cols-1" : "md:grid-cols-2"}`}
          >
            <article className="argos-hologram-card rounded-xl border border-white/[0.09] bg-white/[0.03] p-7 md:p-8">
              <h2 className="text-xl font-black tracking-tight text-white">{t("serviceDetail.problemTitle")}</h2>
              <div className="mt-5">
                <ProblemBody text={service.problem} />
              </div>
            </article>
            <article className="argos-hologram-card rounded-xl border border-white/[0.09] bg-white/[0.03] p-7 md:p-8">
              <h2 className="text-xl font-black tracking-tight text-white">{t("serviceDetail.audienceTitle")}</h2>
              <ul className="mt-5 list-none space-y-3 text-sm leading-7 text-[#D7E8F6]">
                {service.audience.map((item) => (
                  <li key={item} className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#67E8F9]/85">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <section className="argos-hologram-card mt-8 rounded-xl border border-white/[0.09] bg-white/[0.03] p-7 md:p-8">
            <h2 className="text-xl font-black tracking-tight text-white">{t("serviceDetail.includesTitle")}</h2>
            <ul className="mt-6 grid gap-3 text-left md:grid-cols-2 md:gap-x-8 md:gap-y-3">
              {service.includes.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-[#67E8F9]/15 bg-[#030812]/35 px-4 py-3 text-sm leading-7 text-[#EAF7FF]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <article className="argos-hologram-card rounded-xl border border-white/[0.09] bg-white/[0.03] p-7 md:p-8">
              <h2 className="text-xl font-black tracking-tight text-white">{t("serviceDetail.benefitsTitle")}</h2>
              <ul className="mt-5 list-none space-y-3 text-sm leading-7 text-[#D7E8F6]">
                {service.benefits.map((item) => (
                  <li key={item} className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#39F4FF]/90">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
            <article className="argos-hologram-card rounded-xl border border-white/[0.09] bg-white/[0.03] p-7 md:p-8">
              <h2 className="text-xl font-black tracking-tight text-white">{t("serviceDetail.processTitle")}</h2>
              <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-7 text-[#D7E8F6] marker:text-[#67E8F9]/90">
                {service.process.map((item) => (
                  <li key={item} className="pl-1">
                    {item}
                  </li>
                ))}
              </ol>
            </article>
          </div>

          <section className="argos-tech-frame mt-10 rounded-xl border border-[#67E8F9]/18 bg-[#061424]/55 p-8 md:p-9">
            <h2 className="text-2xl font-black tracking-tight text-white">{t("serviceDetail.ctaTitle")}</h2>
            <p className="mt-4 max-w-3xl text-left text-sm leading-7 text-[#C9DDEC]">{t("serviceDetail.ctaSubtitle")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/contacto?service=${slug}`}
                className="rounded-md bg-[#18D4F7] px-6 py-3 font-black text-[#030812] shadow-md shadow-cyan-500/15 transition hover:bg-[#39F4FF]"
              >
                {t("actions.requestConsultation")}
              </Link>
              <Link
                href="/metodo"
                className="rounded-md border border-white/18 bg-white/[0.06] px-6 py-3 font-bold text-white transition hover:border-[#67E8F9]/45 hover:bg-white/[0.1]"
              >
                {t("actions.viewMethod")}
              </Link>
            </div>
          </section>
        </div>
      </section>
    </ArgosPageShell>
  );
}
