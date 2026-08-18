"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import ClientAssistants from "@/components/ClientAssistants";
import CorporateFooter from "@/components/corporate/CorporateFooter";
import CorporateHeader from "@/components/corporate/CorporateHeader";
import { MascotPauseControlProvider } from "@/components/mascots/MascotPauseControlContext";
import CookieBanner from "@/components/layout/CookieBanner";
import { DiagnosticSurveyLauncherProvider } from "@/components/diagnostic/DiagnosticSurveyLauncher";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import {
  getChromeOwner,
  isLegalPublicRoute,
  shouldShowDiagnosticPromo
} from "@/lib/chromeOwnership";

type Props = {
  children: ReactNode;
};

function isLabOrRecordingPath(pathname: string) {
  return (
    pathname === "/explainer" ||
    pathname === "/mascot-motion-lab" ||
    pathname.startsWith("/mascot-motion-lab/")
  );
}

function shouldHideAssistants(pathname: string) {
  return (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/dashboard") ||
    isLabOrRecordingPath(pathname) ||
    isLegalPublicRoute(pathname)
  );
}

function shouldHideCookieBanner(pathname: string) {
  return pathname.startsWith("/dashboard") || isLabOrRecordingPath(pathname);
}

export default function SiteShell({ children }: Props) {
  const pathname = usePathname();
  const chromeOwner = getChromeOwner(pathname);

  return (
    <MascotPauseControlProvider>
      {chromeOwner === "none" ? (
        children
      ) : chromeOwner === "corporate" ? (
        <DiagnosticSurveyLauncherProvider>
          <div className="argos-corporate">
            <CorporateHeader />
            {children}
            <CorporateFooter />
          </div>
        </DiagnosticSurveyLauncherProvider>
      ) : (
        <DiagnosticSurveyLauncherProvider>
          <SiteHeader showDiagnosticPromo={shouldShowDiagnosticPromo(pathname)} />
          {children}
          <SiteFooter />
        </DiagnosticSurveyLauncherProvider>
      )}
      {!shouldHideAssistants(pathname) && <ClientAssistants />}
      {!shouldHideCookieBanner(pathname) && <CookieBanner />}
    </MascotPauseControlProvider>
  );
}
