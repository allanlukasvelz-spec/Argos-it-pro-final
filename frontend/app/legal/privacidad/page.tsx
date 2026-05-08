import type { Metadata } from "next";
import LegalPageView from "@/components/pages/LegalPageView";

export const metadata: Metadata = {
  title: "Política de privacidad | ARGOS-IT",
  description: "Cómo se tratan los datos personales en ARGOS-IT."
};

export default function Privacidad() {
  return <LegalPageView type="privacy" />;
}
