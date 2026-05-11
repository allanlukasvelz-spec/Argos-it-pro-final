import type { Metadata } from "next";
import { Suspense } from "react";
import ArgosExplainerAnimation from "@/components/ArgosExplainerAnimation";
import ArgosPageShell from "@/components/layout/ArgosPageShell";

export const metadata: Metadata = {
  title: "Vídeo explicativo Dumbo y Chico | ARGOS-IT",
  description:
    "Relato animado Dumbo te guía, Chico te protege. Pensado para grabación de pantalla en 1080p.",
  robots: { index: false, follow: true }
};

export default function ExplainerRecordingPage() {
  return (
    <ArgosPageShell variant="home" className="min-h-screen">
      <Suspense fallback={<div className="min-h-screen bg-[#030812]" aria-hidden />}>
        <ArgosExplainerAnimation layout="fullscreen" />
      </Suspense>
    </ArgosPageShell>
  );
}
