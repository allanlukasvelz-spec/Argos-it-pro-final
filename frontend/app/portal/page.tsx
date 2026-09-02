import type { Metadata } from "next";
import PortalView from "@/components/pages/PortalView";

export const metadata: Metadata = {
  title: "Portal ARGOS-IT | Acceso clientes",
  description:
    "Accede al portal de cliente ARGOS-IT para seguimiento de servicios, o contacta con soporte si necesitas asistencia."
};

export default function PortalPage() {
  return <PortalView />;
}
