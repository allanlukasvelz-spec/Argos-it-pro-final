"use client";

import Link from "next/link";
import ArgosPageShell from "@/components/layout/ArgosPageShell";
import { useI18n } from "@/i18n/useI18n";
import { useLocalizedServices } from "@/hooks/useLocalizedServices";
import { usePageMeta } from "@/components/seo/usePageMeta";

export default function ServicesView() {
  const { t } = useI18n();
  const services = useLocalizedServices();

  usePageMeta(t("meta.servicesTitle"), t("meta.servicesDescription"));

  return (
    <ArgosPageShell variant="services">
      <section className="px-5 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm font-bold text-[#39F4FF]">
          ← {t("actions.backHome")}
        </Link>
        <h1 className="mt-4 text-4xl font-black text-white">{t("servicesPage.title")}</h1>
        <p className="mt-4 max-w-3xl text-[#BFD7E8]">{t("servicesPage.subtitle")}</p>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <article key={service.slug} className="argos-hologram-card p-6">
              <h2 className="text-xl font-black text-white">{service.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#C9DDEC]">{service.description}</p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[#D7E8F6]">
                {service.includes.slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link href={`/servicios/${service.slug}`} className="mt-5 inline-flex text-sm font-bold text-[#39F4FF]">
                {t("actions.viewService")} →
              </Link>
            </article>
          ))}
        </div>
      </div>
      </section>
    </ArgosPageShell>
  );
}
