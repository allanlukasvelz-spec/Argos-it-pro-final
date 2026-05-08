"use client";

import Link from "next/link";
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
    <main className="min-h-screen bg-white px-5 py-12 text-[#07111F] lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/servicios" className="text-sm font-bold text-[#2563EB]">
          ← {t("actions.backServices")}
        </Link>
        <h1 className="mt-4 text-4xl font-black text-[#0B1E33]">{service.title}</h1>
        <p className="mt-4 text-lg leading-8 text-[#4B5563]">{service.description}</p>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6">
            <h2 className="text-xl font-black text-[#111827]">{t("serviceDetail.problemTitle")}</h2>
            <p className="mt-3 text-sm leading-7 text-[#4B5563]">{service.problem}</p>
          </article>
          <article className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6">
            <h2 className="text-xl font-black text-[#111827]">{t("serviceDetail.audienceTitle")}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#374151]">
              {service.audience.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-6 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6">
          <h2 className="text-xl font-black text-[#111827]">{t("serviceDetail.includesTitle")}</h2>
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {service.includes.map((item) => (
              <li key={item} className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#374151]">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-[#E5E7EB] bg-white p-6">
            <h2 className="text-xl font-black text-[#111827]">{t("serviceDetail.benefitsTitle")}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#374151]">
              {service.benefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-xl border border-[#E5E7EB] bg-white p-6">
            <h2 className="text-xl font-black text-[#111827]">{t("serviceDetail.processTitle")}</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[#374151]">
              {service.process.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>
        </section>

        <section className="mt-10 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-6">
          <h2 className="text-2xl font-black text-[#0B1E33]">{t("serviceDetail.ctaTitle")}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#334155]">{t("serviceDetail.ctaSubtitle")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/contacto?service=${slug}`}
              className="rounded-md bg-[#2563EB] px-5 py-3 font-bold text-white transition hover:bg-[#1D4ED8]"
            >
              {t("actions.requestConsultation")}
            </Link>
            <Link
              href="/metodo"
              className="rounded-md border border-[#2563EB] px-5 py-3 font-bold text-[#2563EB] transition hover:bg-white"
            >
              {t("actions.viewMethod")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
