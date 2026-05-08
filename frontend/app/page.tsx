import type { Metadata } from "next";
import HomeView from "@/components/pages/HomeView";

export const metadata: Metadata = {
  title: "ARGOS-IT | La informática que funciona",
  description:
    "Soporte técnico, mantenimiento, seguridad, automatización y consultoría digital con enfoque empresarial."
};

export default function HomePage() {
  return <HomeView />;
}
