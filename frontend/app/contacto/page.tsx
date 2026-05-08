import type { Metadata } from "next";
import ContactView from "@/components/pages/ContactView";

export const metadata: Metadata = {
  title: "Contacto ARGOS-IT | Solicitar consulta técnica",
  description:
    "Cuéntanos tu necesidad tecnológica y te responderemos con una propuesta técnica clara, priorizada y orientada a negocio."
};

export default function Contacto() {
  return <ContactView />;
}
