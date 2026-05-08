import type { Metadata } from "next";
import ServicesView from "@/components/pages/ServicesView";

export const metadata: Metadata = {
  title: "Servicios IT | ARGOS-IT",
  description:
    "Servicios profesionales de mantenimiento, soporte, ciberseguridad, redes, backup, IA y desarrollo web empresarial."
};

export default function ServiciosPage() {
  return <ServicesView />;
}
