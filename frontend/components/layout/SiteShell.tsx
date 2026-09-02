"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import ArgosAssistantRoot from "@/components/assistant/ArgosAssistantRoot";
import ClientAssistants from "@/components/ClientAssistants";
import CorporateFooter from "@/components/corporate/CorporateFooter";
import CorporateHeader from "@/components/corporate/CorporateHeader";
import CorporateHistoryNav from "@/components/corporate/CorporateHistoryNav";
import { MascotChatProvider } from "@/components/mascots/MascotChatContext";
import { MascotPauseControlProvider } from "@/components/mascots/MascotPauseControlContext";
import CookieBanner from "@/components/layout/CookieBanner";
import { DiagnosticSurveyLauncherProvider } from "@/components/diagnostic/DiagnosticSurveyLauncher";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import {
  getChromeOwner,
  shouldHideAssistants,
  shouldHideCookieBanner,
  shouldShowDiagnosticPromo
} from "@/lib/chromeOwnership";

type Props = {
  children: ReactNode;
};

export default function SiteShell({ children }: Props) {
  const pathname = usePathname();
  const chromeOwner = getChromeOwner(pathname);

  return (
    <MascotPauseControlProvider>
      <MascotChatProvider>
        {chromeOwner === "none" ? (
          children
        ) : chromeOwner === "corporate" ? (
          <DiagnosticSurveyLauncherProvider>
            <div className="argos-corporate">
              <CorporateHeader />
              <div className="argos-corp-container">
                <CorporateHistoryNav />
              </div>
              {children}
              <CorporateFooter />
            </div>
            <ArgosAssistantRoot />
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
      </MascotChatProvider>
    </MascotPauseControlProvider>
  );
}
