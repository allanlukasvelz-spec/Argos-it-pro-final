"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/useI18n";

const COOKIE_KEY = "argos_cookie_preferences_v1";

type Props = {
  /** Contact-only: render in document flow so it never overlays the form. */
  placement?: "fixed" | "contact-inline";
};

export default function CookieBanner({ placement = "fixed" }: Props) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(COOKIE_KEY);
    setVisible(!saved);
  }, []);

  useEffect(() => {
    if (visible) {
      document.documentElement.dataset.argosCookies = "open";
    } else {
      delete document.documentElement.dataset.argosCookies;
    }
    return () => {
      delete document.documentElement.dataset.argosCookies;
    };
  }, [visible]);

  const save = (value: "accepted" | "rejected") => {
    window.localStorage.setItem(COOKIE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  const inline = placement === "contact-inline";

  return (
    <aside
      className={
        inline
          ? "relative z-[5] w-full border-b border-[#BFDBFE] bg-white px-4 py-3.5 md:flex md:flex-wrap md:items-center md:justify-between md:gap-x-5 md:gap-y-3"
          : "fixed bottom-4 left-4 right-4 z-[85] rounded-xl border border-[#BFDBFE] bg-white p-4 shadow-xl shadow-[#0B1E33]/10 md:left-auto md:max-w-md"
      }
      role="dialog"
      aria-label={t("cookiesBanner.message")}
      aria-live="polite"
      data-cookie-banner="true"
      data-cookie-placement={inline ? "contact-inline" : "fixed"}
    >
      <p
        className={
          inline
            ? "text-sm leading-6 text-[#1F2937] md:max-w-2xl md:flex-1"
            : "text-sm leading-6 text-[#1F2937]"
        }
      >
        {t("cookiesBanner.message")}
      </p>
      <div
        className={
          inline
            ? "mt-3 flex flex-wrap items-center gap-2 md:mt-0"
            : "mt-3 flex flex-wrap items-center gap-2"
        }
      >
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
