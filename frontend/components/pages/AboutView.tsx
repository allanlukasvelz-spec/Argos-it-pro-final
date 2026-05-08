"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/useI18n";
import { usePageMeta } from "@/components/seo/usePageMeta";

export default function AboutView() {
  const { t, get } = useI18n();
  const paragraphs = get<string[]>("about.paragraphs", []);
  const values = get<string[]>("about.values", []);

  usePageMeta(t("meta.aboutTitle"), t("meta.aboutDescription"));

  return (
    <main className="min-h-screen bg-white px-5 py-12 text-[#07111F] lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-bold text-[#2563EB]">
          ← {t("actions.backHome")}
        </Link>
        <h1 className="mt-4 text-4xl font-black text-[#0B1E33]">{t("about.title")}</h1>
        <div className="mt-4 space-y-4">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-lg leading-8 text-[#374151]">
              {paragraph}
            </p>
          ))}
        </div>

        <section className="mt-10 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6">
          <h2 className="text-2xl font-black text-[#111827]">{t("about.valuesTitle")}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[#374151]">
            {values.map((value) => (
              <li key={value}>{value}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
