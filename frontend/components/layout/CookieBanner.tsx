"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/useI18n";

const COOKIE_KEY = "argos_cookie_preferences_v1";

export default function CookieBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(COOKIE_KEY);
    setVisible(!saved);
  }, []);

  const save = (value: "accepted" | "rejected") => {
    window.localStorage.setItem(COOKIE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      className="fixed bottom-4 left-4 right-4 z-50 rounded-xl border border-[#BFDBFE] bg-white p-4 shadow-xl shadow-[#0B1E33]/10 md:left-auto md:max-w-md"
      aria-live="polite"
    >
      <p className="text-sm leading-6 text-[#1F2937]">{t("cookiesBanner.message")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-md bg-[#2563EB] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#1D4ED8]"
          onClick={() => save("accepted")}
        >
          {t("cookiesBanner.accept")}
        </button>
        <button
          type="button"
          className="rounded-md border border-[#E5E7EB] px-3 py-2 text-xs font-bold text-[#1F2937]"
          onClick={() => save("rejected")}
        >
          {t("cookiesBanner.reject")}
        </button>
        <Link href="/cookies" className="text-xs font-bold text-[#2563EB] hover:underline">
          {t("cookiesBanner.policy")}
        </Link>
      </div>
    </aside>
  );
}
