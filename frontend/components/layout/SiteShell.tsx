"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import ClientAssistants from "@/components/ClientAssistants";
import CookieBanner from "@/components/layout/CookieBanner";
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
  return (
    pathname.startsWith("/auth") || pathname.startsWith("/dashboard") || pathname === "/explainer"
  );
}

export default function SiteShell({ children }: Props) {
  const pathname = usePathname();
  const hideChrome = shouldHideChrome(pathname);

  return (
    <>
      {!hideChrome && <SiteHeader />}
      {children}
      {!hideChrome && <SiteFooter />}
      {!shouldHideAssistants(pathname) && <ClientAssistants />}
      {!pathname.startsWith("/dashboard") && pathname !== "/explainer" && <CookieBanner />}
    </>
  );
}
