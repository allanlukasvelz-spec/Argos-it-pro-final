"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/useI18n";
import { usePageMeta } from "@/components/seo/usePageMeta";

type Step = {
  id: string;
  title: string;
  description: string;
};

export default function MethodView() {
  const { t, get } = useI18n();
  const steps = get<Step[]>("method.steps", []);

  usePageMeta(t("meta.methodTitle"), t("meta.methodDescription"));

  return (
    <main className="min-h-screen bg-white px-5 py-12 text-[#07111F] lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-bold text-[#2563EB]">
          ← {t("actions.backHome")}
        </Link>
        <h1 className="mt-4 text-4xl font-black text-[#0B1E33]">{t("method.title")}</h1>
        <p className="mt-4 max-w-3xl text-[#4B5563]">{t("method.subtitle")}</p>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => (
            <article key={step.id} className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6">
              <p className="text-sm font-black text-[#2563EB]">{step.id}</p>
              <h2 className="mt-2 text-xl font-black text-[#111827]">{step.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#4B5563]">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
