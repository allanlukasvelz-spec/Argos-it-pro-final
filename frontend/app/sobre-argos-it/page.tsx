import type { Metadata } from "next";
import AboutView from "@/components/pages/AboutView";

export const metadata: Metadata = {
  title: "Sobre ARGOS-IT | Consultoría tecnológica premium",
  description:
    "Conoce el enfoque de ARGOS-IT: estabilidad operativa, seguridad y decisiones tecnológicas alineadas con negocio."
};

export default function SobreArgosPage() {
  return <AboutView />;
}
