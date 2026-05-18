"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import ClientAssistants from "@/components/ClientAssistants";
import CookieBanner from "@/components/layout/CookieBanner";
import { DiagnosticSurveyLauncherProvider } from "@/components/diagnostic/DiagnosticSurveyLauncher";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

type Props = {
  children: ReactNode;
};

function shouldHideChrome(pathname: string) {
  return (
    pathname.startsWith("/auth") || pathname.startsWith("/dashboard") || pathname === "/explainer"
  );
}

function shouldHideAssistants(pathname: string) {
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/dashboard") ||
    pathname === "/explainer"
  ) {
    return true;
  }
  if (
    pathname === "/privacidad" ||
    pathname === "/cookies" ||
    pathname === "/aviso-legal" ||
    pathname.startsWith("/legal/")
  ) {
    return true;
  }
  return false;
}

export default function SiteShell({ children }: Props) {
  const pathname = usePathname();
  const hideChrome = shouldHideChrome(pathname);

  return (
    <>
      {!hideChrome ? (
        <DiagnosticSurveyLauncherProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </DiagnosticSurveyLauncherProvider>
      ) : (
        children
      )}
      {!shouldHideAssistants(pathname) && <ClientAssistants />}
      {!pathname.startsWith("/dashboard") && pathname !== "/explainer" && <CookieBanner />}
    </>
  );
}
