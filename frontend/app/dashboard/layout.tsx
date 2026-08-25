"use client";

import type { ReactNode } from "react";
import ClientPortalShell from "@/components/client/ClientPortalShell";
import "@/styles/client-portal.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <ClientPortalShell>{children}</ClientPortalShell>;
}
