import type { Metadata } from "next";
import HomeView from "@/components/pages/HomeView";

export const metadata: Metadata = {
  title: "ARGOS-IT | Consultoría tecnológica premium",
  description:
    "Tecnología que protege, acompaña y simplifica: soporte IT, seguridad, mantenimiento web, presencia web corporativa, automatización con IA y mejora continua."
};

export default function HomePage() {
  return <HomeView />;
}
