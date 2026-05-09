import type { Metadata } from "next";
import ServicesView from "@/components/pages/ServicesView";

export const metadata: Metadata = {
  title: "Servicios premium | ARGOS-IT",
  description:
    "Consultoría IT premium, mantenimiento informático, seguridad informática, WordPress, automatización con IA y auditoría digital continua."
};

export default function ServiciosPage() {
  return <ServicesView />;
}
