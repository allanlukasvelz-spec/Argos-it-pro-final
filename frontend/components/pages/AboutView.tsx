"use client";

import Image from "next/image";
import Link from "next/link";
import ArgosPageShell from "@/components/layout/ArgosPageShell";
import { useI18n } from "@/i18n/useI18n";
import { usePageMeta } from "@/components/seo/usePageMeta";

export default function AboutView() {
  const { t, get } = useI18n();
  const paragraphs = get<string[]>("about.paragraphs", []);
  const values = get<string[]>("about.values", []);

  usePageMeta(t("meta.aboutTitle"), t("meta.aboutDescription"));

  return (
    <ArgosPageShell variant="about">
      <section className="px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_280px]">
          <div>
            <Link href="/" className="text-sm font-bold text-[#39F4FF]">
              ← {t("actions.backHome")}
            </Link>
            <h1 className="mt-4 text-4xl font-black text-white">{t("about.title")}</h1>
            <div className="mt-4 space-y-4">
              {paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-lg leading-8 text-[#D7E8F6]">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <Image
              src="/argos-history-emblem.png"
              alt="Emblema de Chico y Dumbo en la historia de ARGOS-IT"
              width={260}
              height={260}
              className="h-auto w-56 max-w-full object-contain opacity-90 sm:w-64"
              priority={false}
            />
          </div>
        </div>

        <section className="argos-hologram-card mt-10 p-6">
          <h2 className="text-2xl font-black text-white">{t("about.valuesTitle")}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[#D7E8F6]">
            {values.map((value) => (
              <li key={value}>{value}</li>
            ))}
          </ul>
        </section>
      </div>
      </section>
    </ArgosPageShell>
  );
}
