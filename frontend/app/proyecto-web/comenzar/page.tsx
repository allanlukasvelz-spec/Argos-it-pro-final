import type { Metadata } from "next";
import WebProjectStartView from "@/components/pages/WebProjectStartView";
import { SELF_SERVICE_START_TITLE } from "@/lib/webProjects/selfServiceUi";

export const metadata: Metadata = {
  title: `${SELF_SERVICE_START_TITLE} | ARGOS-IT`,
  description: "Inicia tu proyecto web con ARGOS: crea una web nueva o mejora la que ya tienes.",
  robots: { index: false, follow: false }
};

export default function ProyectoWebComenzarPage() {
  return <WebProjectStartView />;
}
