import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MascotMotionLab from "@/components/mascot-motion-lab/MascotMotionLab";

/**
 * FASE 21.6B.4C — Frozen low-motion lab (HUMAN-FROZEN).
 * Not Corporate IA. Not navigation. Not production assistants.
 * Canonical source pixels only from /public/mascots.
 * Spec: docs/design/ARGOS_MASCOT_LOW_MOTION_FREEZE_21_6B.md
 *
 * Available in development, or when ALLOW_MASCOT_MOTION_LAB=1 (local/test only).
 * Not publicly usable in production builds.
 *
 * force-dynamic: env guard must run per-request (SSG would bake production 404).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mascot Motion Lab (LAB ONLY) | ARGOS-IT",
  description:
    "Laboratorio aislado de presencia Chico/Dumbo con PNG canónicos. No producción.",
  robots: { index: false, follow: false },
  alternates: { canonical: undefined }
};

function isMascotMotionLabEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_MASCOT_MOTION_LAB === "1"
  );
}

export default function MascotMotionLabPage() {
  if (!isMascotMotionLabEnabled()) {
    notFound();
  }
  return <MascotMotionLab />;
}
