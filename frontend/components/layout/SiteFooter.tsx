"use client";

import Link from "next/link";
import Image from "next/image";
import { useDiagnosticSurveyLauncher } from "@/components/diagnostic/DiagnosticSurveyLauncher";
import { useI18n } from "@/i18n/useI18n";

export default function SiteFooter() {
  const { t } = useI18n();
  const { openDiagnostic } = useDiagnosticSurveyLauncher();

  return (
    <footer className="border-t border-[#E5E7EB] bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-[2fr_1fr_1fr] md:px-5 md:py-10 lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center" aria-label="ARGOS-IT home">
            <Image
              src="/logo-argos-it.png"
              alt="Logo ARGOS-IT"
              width={210}
              height={54}
              className="h-10 w-auto object-contain"
              loading="lazy"
            />
          </Link>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#4B5563]">{t("footer.tagline")}</p>
        </div>

        <div className="text-sm">
          <p className="font-black text-[#0B1E33]">{t("nav.services")}</p>
          <div className="mt-3 flex flex-col gap-2 text-[#4B5563]">
            <Link href="/servicios">{t("nav.services")}</Link>
            <Link href="/metodo">{t("nav.method")}</Link>
            <Link href="/sobre-argos-it">{t("nav.about")}</Link>
            <Link href="/contacto">{t("nav.contact")}</Link>
          </div>
          <button
            type="button"
            className="mt-4 md:hidden rounded-md border border-[#22d3ee]/80 bg-[#ECFEFF] px-4 py-3 text-center text-xs font-black text-[#082f49] shadow-sm transition hover:bg-[#cffafe]"
            onClick={() => openDiagnostic()}
          >
            {t("nav.startDiagnostic")}
          </button>
        </div>

        <div className="text-sm">
          <p className="font-black text-[#0B1E33]">Legal</p>
          <div className="mt-3 flex flex-col gap-2 text-[#4B5563]">
            <Link href="/aviso-legal">{t("legal.aviso.title")}</Link>
            <Link href="/privacidad">{t("legal.privacy.title")}</Link>
            <Link href="/cookies">{t("legal.cookies.title")}</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E5E7EB] px-4 py-4 text-center text-xs text-[#6B7280] md:px-5 lg:px-8">
        {t("footer.rights")}
      </div>
    </footer>
  );
}
