import type { Metadata } from "next";
import LegalPageView from "@/components/pages/LegalPageView";

export const metadata: Metadata = {
  title: "Aviso legal | ARGOS-IT",
  description: "Información legal y condiciones de uso del sitio web de ARGOS-IT."
};

export default function AvisoLegal() {
  return <LegalPageView type="aviso" />;
}
