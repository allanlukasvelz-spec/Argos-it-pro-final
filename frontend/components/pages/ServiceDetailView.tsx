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

export default function ServiceDetailView({ slug }: Props) {
  const { t } = useI18n();
  const service = useLocalizedServiceBySlug(slug);

  usePageMeta(
    `${service?.title ?? "ARGOS-IT"} | ARGOS-IT`,
    service?.description ?? t("meta.defaultDescription")
  );

  if (!service) return null;

  return (
    <ArgosPageShell variant="services">
      <section className="px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/servicios" className="text-sm font-bold text-[#39F4FF]">
          ← {t("actions.backServices")}
        </Link>
        <h1 className="mt-4 text-4xl font-black text-white">{service.title}</h1>
        <p className="mt-4 text-lg leading-8 text-[#D7E8F6]">{service.description}</p>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="argos-hologram-card p-6">
            <h2 className="text-xl font-black text-white">{t("serviceDetail.problemTitle")}</h2>
            <p className="mt-3 text-sm leading-7 text-[#C9DDEC]">{service.problem}</p>
          </article>
          <article className="argos-hologram-card p-6">
            <h2 className="text-xl font-black text-white">{t("serviceDetail.audienceTitle")}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#D7E8F6]">
              {service.audience.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="argos-hologram-card mt-6 p-6">
          <h2 className="text-xl font-black text-white">{t("serviceDetail.includesTitle")}</h2>
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {service.includes.map((item) => (
              <li key={item} className="rounded-md border border-white/10 bg-white/[.08] px-3 py-2 text-sm text-[#D7E8F6]">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <article className="argos-hologram-card p-6">
            <h2 className="text-xl font-black text-white">{t("serviceDetail.benefitsTitle")}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#D7E8F6]">
              {service.benefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="argos-hologram-card p-6">
            <h2 className="text-xl font-black text-white">{t("serviceDetail.processTitle")}</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[#D7E8F6]">
              {service.process.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>
        </section>

        <section className="argos-tech-frame mt-10 p-6">
          <h2 className="text-2xl font-black text-white">{t("serviceDetail.ctaTitle")}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#C9DDEC]">{t("serviceDetail.ctaSubtitle")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/contacto?service=${slug}`}
              className="rounded-md bg-[#18D4F7] px-5 py-3 font-black text-[#030812] transition hover:bg-[#39F4FF]"
            >
              {t("actions.requestConsultation")}
            </Link>
            <Link
              href="/metodo"
              className="rounded-md border border-white/20 bg-white/5 px-5 py-3 font-bold text-white transition hover:border-[#18D4F7] hover:bg-white/10"
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
