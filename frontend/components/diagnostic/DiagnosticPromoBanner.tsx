"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const SESSION_KEY = "argos-diagnostic-promo-dismissed";
const CONTACT_FALLBACK_HREF = "/contacto?intent=diagnostico";

/** Temporal hasta exista la página de diagnóstico: enlazar cuando se añada la ruta. */
const DIAGNOSTIC_HREF = CONTACT_FALLBACK_HREF;

export default function DiagnosticPromoBanner() {
  const prefersReducedMotion = useReducedMotion() === true;
  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [runIn, setRunIn] = useState(false);
  const entranceDelayMs = useMemo(() => 1200 + Math.random() * 800, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      /* private mode / unavailable */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || dismissed) return;
    const id = window.setTimeout(() => setRunIn(true), entranceDelayMs);
    return () => window.clearTimeout(id);
  }, [hydrated, dismissed, entranceDelayMs]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  if (!hydrated || dismissed) return null;

  const slidePixels = prefersReducedMotion ? 0 : Math.min(typeof window !== "undefined" ? window.innerWidth : 560, 560);

  return (
    <div className="pointer-events-none fixed bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] left-3 right-3 z-[40] flex max-w-none justify-end sm:bottom-28 sm:left-auto sm:right-4 sm:w-auto md:bottom-28">
      <motion.div
        role="region"
        aria-label="Promoción: Diagnóstico ARGOS"
        aria-hidden={!runIn}
        className="pointer-events-none flex max-w-full items-end gap-0 pl-10 sm:max-w-[min(100%,28rem)] md:max-w-[min(100%,34rem)]"
        initial={false}
        animate={
          prefersReducedMotion
            ? {
                opacity: runIn ? 1 : 0,
                x: 0
              }
            : {
                opacity: runIn ? 1 : 0.98,
                x: runIn ? 0 : slidePixels
              }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0.35, ease: "easeOut" }
            : { type: "spring", stiffness: 118, damping: 22, mass: 0.85 }
        }
      >
        <div className="pointer-events-auto relative w-full min-w-0 rounded-xl border border-[#18D4F7]/35 bg-[#07111f]/88 px-3 py-3 pr-9 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-4 sm:py-3.5 sm:pr-10">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-2 top-2 rounded-md p-1.5 text-[#94a3b8] transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar aviso del diagnóstico ARGOS"
          >
            <span aria-hidden className="block text-lg font-light leading-none">
              ×
            </span>
          </button>

          <h3 className="text-sm font-black tracking-tight text-[#39F4FF] sm:text-base">Diagnóstico ARGOS</h3>
          <p className="mt-1 text-xs leading-snug text-[#D7E8F6] sm:text-[0.8125rem] sm:leading-relaxed">
            Descubre en pocos minutos el estado real de tu web, seguridad, sistemas y procesos digitales.
          </p>
          <div className="mt-3">
            <Link
              href={DIAGNOSTIC_HREF}
              className="inline-flex w-full min-h-[44px] items-center justify-center rounded-lg bg-[#18D4F7]/90 px-3 py-2.5 text-center text-xs font-black text-[#030812] shadow-md shadow-cyan-500/15 transition hover:bg-[#39F4FF] sm:w-auto sm:px-4 sm:text-sm"
            >
              Iniciar diagnóstico ARGOS
            </Link>
          </div>
        </div>

        <div className="pointer-events-none relative -ml-6 flex shrink-0 items-end sm:-ml-7" aria-hidden>
          <svg
            width={44}
            height={56}
            viewBox="0 0 44 56"
            className="-mb-1 shrink-0 text-[#22d3ee]/55"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 54 C 24 52, 32 42, 40 36 C 40 46, 18 54, 2 54 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.25}
              strokeLinecap="round"
            />
            <path d="M0 53 L 40 46" stroke="currentColor" strokeWidth={1.8} opacity={0.6} />
          </svg>

          <div className="-ml-8 flex flex-col items-center">
            <Image
              src="/mascots/dumbo/dumbo_guide.png"
              alt=""
              width={112}
              height={112}
              sizes="(max-width: 640px) 78px, 108px"
              className="-mb-1 h-auto w-[4.85rem] select-none drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)] sm:w-[6.75rem]"
              priority={false}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
