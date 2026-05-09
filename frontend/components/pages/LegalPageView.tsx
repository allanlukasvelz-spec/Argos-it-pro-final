"use client";

import Link from "next/link";
import ArgosPageShell from "@/components/layout/ArgosPageShell";
import { useI18n } from "@/i18n/useI18n";
import { usePageMeta } from "@/components/seo/usePageMeta";

type LegalType = "aviso" | "privacy" | "cookies";

type LegalSection = {
  title: string;
  body: string;
};

type Props = {
  type: LegalType;
};

export default function LegalPageView({ type }: Props) {
  const { t, get } = useI18n();
  const title = t(`legal.${type}.title`);
  const intro = t(`legal.${type}.intro`);
  const sections = get<LegalSection[]>(`legal.${type}.sections`, []);

  usePageMeta(`${title} | ARGOS-IT`, intro);

  return (
    <ArgosPageShell variant="legal">
      <header className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="mb-6 inline-block text-[#39F4FF] hover:underline">
            ← {t("actions.backHome")}
          </Link>
          <h1 className="text-4xl font-bold text-white">{title}</h1>
          <p className="mt-4 max-w-3xl text-[#D7E8F6]">{intro}</p>
        </div>
      </header>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-4xl space-y-6 text-[#4B5563]">
          {sections.map((section) => (
            <article key={section.title} className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-[#111827]">{section.title}</h2>
              <p className="mt-3 text-sm leading-7">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </ArgosPageShell>
  );
}
