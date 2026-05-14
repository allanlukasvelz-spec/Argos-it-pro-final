"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Props = {
  /** Libera el slot del header (p. ej. tras el pase o al cerrar) para que no quede hueco. */
  onSlotRelease?: () => void;
};

const SESSION_KEY = "argos-diagnostic-promo-dismissed";
const DIAGNOSTIC_HREF = "/contacto?intent=diagnostico";

const WALK_FRAMES = [
  "/mascots/dumbo/dumbo_caminando.png",
  "/mascots/dumbo/dumbo_caminando_2.png",
  "/mascots/dumbo/dumbo_caminando_3.png"
] as const;

/* Espacio mínimo a reservar desde el borde izquierdo del área central (no invade logo). */
const SAFE_GAP_LEFT_PX = 88;

export default function DiagnosticPromoBanner({ onSlotRelease }: Props) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion() === true;
  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [runIn, setRunIn] = useState(false);
  const [walkFrame, setWalkFrame] = useState(0);
  const [rideDone, setRideDone] = useState(false);
  const entranceDelayMs = useMemo(() => 1200 + Math.random() * 800, []);

  const isHome = pathname === "/";

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || dismissed || !isHome) return;
    const id = window.setTimeout(() => setRunIn(true), entranceDelayMs);
    return () => window.clearTimeout(id);
  }, [hydrated, dismissed, entranceDelayMs, isHome]);

  useEffect(() => {
    if (!runIn || prefersReducedMotion || dismissed || rideDone) return;
    const id = window.setInterval(() => setWalkFrame((f) => (f + 1) % WALK_FRAMES.length), 160);
    return () => window.clearInterval(id);
  }, [runIn, prefersReducedMotion, dismissed, rideDone]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  useEffect(() => {
    if (hydrated && dismissed) {
      onSlotRelease?.();
    }
  }, [hydrated, dismissed, onSlotRelease]);

  if (!hydrated || dismissed || !isHome) return null;

  /* Versión estática accesible (sin recorrido). */
  if (prefersReducedMotion) {
    return (
      <div className="pointer-events-none flex h-full min-h-[3.5rem] items-center justify-center px-1">
        <div className="pointer-events-auto flex max-w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-[#E5E7EB] bg-gradient-to-r from-violet-50/95 to-cyan-50/95 px-2 py-1.5 shadow-sm">
          <p className="max-w-[20rem] text-[10px] font-bold leading-tight text-[#0B1E33] md:text-[11px]">
            Descubre en pocos minutos el estado real de tu web
            <span className="mt-0.5 block text-[9px] font-extrabold md:text-[10px]">
              <span className="text-[#DC2626]">Seguridad</span>
              <span className="text-[#64748B]"> · </span>
              <span className="text-[#059669]">Sistemas</span>
              <span className="text-[#64748B]"> · </span>
              <span className="text-[#2563EB]">Procesos</span>
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={DIAGNOSTIC_HREF}
              className="inline-flex min-h-[36px] items-center rounded-md bg-[#2563EB] px-3 py-1.5 text-[10px] font-black text-white md:text-xs"
            >
              Iniciar diagnóstico ARGOS
            </Link>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded p-1 text-[#64748B] hover:bg-black/5"
              aria-label="Cerrar aviso del diagnóstico ARGOS"
            >
              <span aria-hidden className="text-lg leading-none">
                ×
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* Tras el pase animado, desmontar para no dejar capas ni huecos raros. */
  if (rideDone) return null;

  const releaseAfterRide = () => {
    if (!runIn) return;
    setRideDone(true);
    onSlotRelease?.();
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      role="region"
      aria-label="Promoción: Diagnóstico ARGOS"
    >
      <motion.div
        className="absolute bottom-0 left-0 flex items-end gap-0 will-change-transform"
        style={{ paddingLeft: SAFE_GAP_LEFT_PX }}
        initial={false}
        animate={
          runIn
            ? {
                x: ["36vw", "12vw", "1vw", "-30vw"],
                opacity: [0, 1, 0.98, 0]
              }
            : { x: "36vw", opacity: 0 }
        }
        transition={{
          duration: 6.2,
          times: [0, 0.22, 0.52, 1],
          ease: "easeInOut"
        }}
        onAnimationComplete={releaseAfterRide}
      >
        <div className="pointer-events-none flex items-end">
          <div className="relative max-w-[min(52vw,280px)] shrink-0 md:max-w-[300px]">
            <div className="pointer-events-auto relative rounded-lg border border-violet-200/70 bg-gradient-to-r from-violet-100/95 via-fuchsia-50/90 to-teal-100/95 px-2 py-1.5 pl-2.5 shadow-md">
              <button
                type="button"
                onClick={handleDismiss}
                className="absolute -right-1 -top-1 z-[5] flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#64748B] shadow-sm hover:bg-white pointer-events-auto"
                aria-label="Cerrar aviso del diagnóstico ARGOS"
              >
                <span aria-hidden className="text-sm leading-none">
                  ×
                </span>
              </button>
              <p className="pr-4 text-[10px] font-extrabold leading-snug text-[#0B1E33] md:text-[11px]">
                Descubre en pocos minutos el estado real de tu web
              </p>
              <p className="mt-0.5 text-[9px] font-black leading-tight md:text-[10px]">
                <span className="text-[#DC2626]">Seguridad</span>
                <span className="text-[#64748B]"> · </span>
                <span className="text-[#059669]">Sistemas</span>
                <span className="text-[#64748B]"> · </span>
                <span className="text-[#2563EB]">Procesos</span>
              </p>
              <Link
                href={DIAGNOSTIC_HREF}
                className="mt-1.5 inline-flex min-h-[32px] w-full items-center justify-center rounded-md bg-[#2563EB] px-2 py-1 text-[10px] font-black text-white shadow-sm hover:bg-[#1D4ED8] pointer-events-auto md:text-[11px]"
              >
                Iniciar diagnóstico ARGOS
              </Link>
            </div>
            <div
              className="absolute -right-1.5 bottom-2 h-3 w-3 rotate-45 border-b border-r border-violet-200/70 bg-teal-100/90"
              style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
              aria-hidden
            />
          </div>

          <svg
            width={36}
            height={20}
            viewBox="0 0 36 20"
            className="-mx-0.5 mb-3 shrink-0 text-violet-400/80"
            aria-hidden
          >
            <path
              d="M0 10 C 10 12, 18 8, 36 6"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.35}
              strokeLinecap="round"
            />
          </svg>

          <div className="relative -ml-1 shrink-0" style={{ transform: "scaleX(-1)" }} aria-hidden>
            <Image
              src={WALK_FRAMES[walkFrame] ?? WALK_FRAMES[0]}
              alt=""
              width={88}
              height={88}
              sizes="88px"
              className="h-[3.25rem] w-auto object-contain drop-shadow md:h-[3.75rem]"
              priority={false}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
