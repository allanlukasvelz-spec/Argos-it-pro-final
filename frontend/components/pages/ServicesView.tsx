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
      <section className="px-5 py-12 text-left lg:px-8 lg:py-14">
        <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm font-bold text-[#39F4FF] hover:text-[#67E8F9]">
          ← {t("actions.backHome")}
        </Link>
        <h1 className="mt-6 text-4xl font-black leading-tight text-white">{t("servicesPage.title")}</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#BFD7E8]">{t("servicesPage.subtitle")}</p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <article key={service.slug} className="argos-hologram-card rounded-xl border border-white/[0.08] p-7 text-left transition hover:border-[#67E8F9]/22">
              <h2 className="text-xl font-black tracking-tight text-white">{service.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#D7E8F6]">{service.description}</p>
              <ul className="mt-5 list-none space-y-2 text-sm leading-7 text-[#C9DDEC]">
                {service.includes.slice(0, 4).map((item) => (
                  <li key={item} className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-1 before:w-1 before:rounded-full before:bg-[#67E8F9]/75">
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={`/servicios/${service.slug}`} className="mt-6 inline-flex text-sm font-bold text-[#39F4FF] hover:text-[#67E8F9]">
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
