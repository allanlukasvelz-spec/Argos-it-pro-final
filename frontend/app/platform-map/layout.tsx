import type { Metadata } from "next";
import type { ReactNode } from "react";
import PlatformMapShell from "@/components/platform-map/PlatformMapShell";
import { PlatformMapProvider } from "@/lib/platform-map/PlatformMapProvider";
import "../../styles/platform-map.css";

export const metadata: Metadata = {
  title: "ARGOS Platform Map",
  description: "Maqueta visual aislada de la arquitectura target de ARGOS-IT. No es producción.",
  robots: { index: false, follow: false }
};

export default function PlatformMapLayout({ children }: { children: ReactNode }) {
  return (
    <PlatformMapProvider>
      <PlatformMapShell>{children}</PlatformMapShell>
    </PlatformMapProvider>
  );
}
