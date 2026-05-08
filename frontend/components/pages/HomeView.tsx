"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/useI18n";
import { useLocalizedServices } from "@/hooks/useLocalizedServices";
import { usePageMeta } from "@/components/seo/usePageMeta";

export default function HomeView() {
  const { t, get } = useI18n();
  const services = useLocalizedServices();
  const trustItems = get<string[]>("home.trustItems", []);

  usePageMeta(t("meta.homeTitle"), t("meta.homeDescription"));

  return (
    <main className="min-h-screen bg-white text-[#07111F]">
      <section className="bg-gradient-to-b from-[#F8FBFF] to-white px-5 pb-16 pt-16 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
          <div className="max-w-4xl">
            <p className="mb-4 text-sm font-black uppercase tracking-wider text-[#2563EB]">{t("home.eyebrow")}</p>
            <h1 className="text-4xl font-black leading-tight text-[#0B1E33] sm:text-5xl lg:text-6xl">
              {t("home.title")}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#374151]">{t("home.subtitle")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contacto"
                className="rounded-md bg-[#2563EB] px-6 py-4 text-center font-bold text-white transition hover:bg-[#1D4ED8]"
              >
                {t("actions.requestConsultation")}
              </Link>
              <Link
                href="/servicios"
                className="rounded-md border border-[#2563EB] px-6 py-4 text-center font-bold text-[#2563EB] transition hover:bg-[#EFF6FF]"
              >
                {t("actions.viewServices")}
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-[#0B1E33]">{t("home.trustTitle")}</h2>
            <div className="mt-4 grid gap-3">
              {trustItems.map((item) => (
                <div key={item} className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-sm font-semibold text-[#111827]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8" id="servicios">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-sm font-black uppercase tracking-wider text-[#2563EB]">{t("home.servicesEyebrow")}</p>
            <h2 className="mt-3 text-3xl font-black text-[#0B1E33] sm:text-4xl">{t("home.servicesTitle")}</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#4B5563]">{t("home.servicesSubtitle")}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article key={service.slug} className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition hover:-translate-y-0.5">
                <h3 className="text-xl font-black text-[#111827]">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#4B5563]">{service.description}</p>
                <Link href={`/servicios/${service.slug}`} className="mt-5 inline-flex text-sm font-bold text-[#2563EB]">
                  {t("actions.viewDetail")} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
