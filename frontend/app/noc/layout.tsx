"use client";

import type { ReactNode } from "react";
import NocShell from "@/components/noc/NocShell";
import { inter } from "@/lib/fonts";
import "@/styles/noc-portal.css";

export default function NocLayout({ children }: { children: ReactNode }) {
  return (
    <div className={inter.variable}>
      <NocShell>{children}</NocShell>
    </div>
  );
}
