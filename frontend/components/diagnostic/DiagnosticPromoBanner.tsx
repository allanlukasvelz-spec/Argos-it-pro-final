"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Props = {
  /** Solo al cerrar con X o sesión: colapsar slot del header. */
  onSlotRelease?: () => void;
};

const SESSION_KEY = "argos-diagnostic-promo-dismissed";
const DIAGNOSTIC_HREF = "/contacto?intent=diagnostico";

/** Copias exactas del diseño de referencia (visible). */
const PROMO_TEXT_MAIN = "Descubre en pocos minutos el estado real de tu web";
const PROMO_TEXT_HIGHLIGHT = "Seguridad · Sistemas · Procesos";
const PROMO_TEXT_CTA = "Iniciar diagnóstico ARGOS";

/** Texto completo para nombre accesible de la región. */
const PROMO_A11Y_DESCRIPTION =
  "Descubre en pocos minutos el estado real de tu web, seguridad, sistemas y procesos digitales.";

const PROMO_HIGHLIGHT_PARTS = PROMO_TEXT_HIGHLIGHT.split(" · ");

/** Fases ciclo estándar. “dismissed” es boolean + sessionStorage aparte. */
type PromoPhase = "idle" | "entering" | "parked" | "exiting" | "waitingRestart";

const WALK_FRAMES = [
  "/mascots/dumbo/dumbo_caminando.png",
  "/mascots/dumbo/dumbo_caminando_2.png",
  "/mascots/dumbo/dumbo_caminando_3.png"
] as const;

const SIT_SPRITE = "/mascots/dumbo/dumbo_sentado_atento.png";

const X_ENTER_FROM = "38vw";
const X_PARKED = "4vw";
const X_EXIT = "-44vw";

const DURATION_ENTER_S = 3.5;
const DURATION_EXIT_S = 4.2;
const PARKED_MS = 30_000;
const RESTART_MS = 5000;

const SAFE_GAP_LEFT_PX = 88;

export default function DiagnosticPromoBanner({ onSlotRelease }: Props) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion() === true;

  const phaseRef = useRef<PromoPhase>("idle");

  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [phase, setPhase] = useState<PromoPhase>("idle");
  const [cycleId, setCycleId] = useState(0);
  const [walkFrame, setWalkFrame] = useState(0);

  const entranceDelayMs = useMemo(() => 1200 + Math.random() * 800, []);
  const isHome = pathname === "/";

  const setPhaseTracked = useCallback((p: PromoPhase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

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
    if (!hydrated || dismissed || !isHome || prefersReducedMotion) return;
    if (phase !== "idle") return;
    const id = window.setTimeout(() => {
      setCycleId((c) => c + 1);
      setPhaseTracked("entering");
    }, entranceDelayMs);
    return () => window.clearTimeout(id);
  }, [hydrated, dismissed, entranceDelayMs, isHome, prefersReducedMotion, phase, setPhaseTracked]);

  const walkingActive = !prefersReducedMotion && (phase === "entering" || phase === "exiting");

  useEffect(() => {
    if (!walkingActive) return;
    const id = window.setInterval(() => setWalkFrame((f) => (f + 1) % WALK_FRAMES.length), 160);
    return () => window.clearInterval(id);
  }, [walkingActive]);

  useEffect(() => {
    if (phase !== "entering") return;
    const ms = Math.round(DURATION_ENTER_S * 1000);
    const id = window.setTimeout(() => {
      if (phaseRef.current !== "entering") return;
      setPhaseTracked("parked");
    }, ms);
    return () => window.clearTimeout(id);
  }, [phase, cycleId, setPhaseTracked]);

  useEffect(() => {
    if (phase !== "parked") return;
    const id = window.setTimeout(() => setPhaseTracked("exiting"), PARKED_MS);
    return () => window.clearTimeout(id);
  }, [phase, setPhaseTracked]);

  useEffect(() => {
    if (phase !== "exiting") return;
    const ms = Math.round(DURATION_EXIT_S * 1000);
    const id = window.setTimeout(() => {
      if (phaseRef.current !== "exiting") return;
      setPhaseTracked("waitingRestart");
    }, ms);
    return () => window.clearTimeout(id);
  }, [phase, cycleId, setPhaseTracked]);

  useEffect(() => {
    if (phase !== "waitingRestart") return;
    const id = window.setTimeout(() => {
      setCycleId((c) => c + 1);
      setPhaseTracked("entering");
    }, RESTART_MS);
    return () => window.clearTimeout(id);
  }, [phase, setPhaseTracked]);

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

  if (prefersReducedMotion) {
    return (
      <ReducedMotionCycle
        entranceDelayMs={entranceDelayMs}
        onDismiss={handleDismiss}
      />
    );
  }

  const showPromoChrome = phase !== "idle" && phase !== "waitingRestart";
  const sitting = phase === "parked";

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      role="region"
      aria-label={PROMO_A11Y_DESCRIPTION}
      aria-hidden={!showPromoChrome}
    >
      {showPromoChrome && (
        <motion.div
          key={`diag-${cycleId}`}
          className="absolute bottom-0 left-0 flex items-end gap-0 will-change-transform"
          style={{ paddingLeft: SAFE_GAP_LEFT_PX }}
          initial={
            phase === "entering"
              ? { x: X_ENTER_FROM, opacity: 1 }
              : { x: X_PARKED, opacity: 1 }
          }
          animate={
            phase === "entering"
              ? { x: X_PARKED, opacity: 1 }
              : phase === "parked"
                ? { x: X_PARKED, opacity: 1 }
                : phase === "exiting"
                  ? { x: X_EXIT, opacity: 0 }
                  : { x: X_PARKED, opacity: 1 }
          }
          transition={
            phase === "entering"
              ? { duration: DURATION_ENTER_S, ease: [0.25, 0.46, 0.45, 0.94] }
              : phase === "exiting"
                ? { duration: DURATION_EXIT_S, ease: "easeInOut" }
                : { duration: 0 }
          }
        >
          <PromoInner walkFrame={walkFrame} sitting={sitting} onDismiss={handleDismiss} />
        </motion.div>
      )}
    </div>
  );
}

function PromoInner({
  walkFrame,
  sitting,
  onDismiss
}: {
  walkFrame: number;
  sitting: boolean;
  onDismiss: () => void;
}) {
  const sprite = sitting ? SIT_SPRITE : (WALK_FRAMES[walkFrame] ?? WALK_FRAMES[0]);

  return (
    <div className="pointer-events-none flex items-end">
      <div className="relative max-w-[min(66vw,400px)] shrink-0 md:max-w-[min(72vw,440px)] lg:max-w-[min(520px,40vw)]">
        <div className="pointer-events-auto relative rounded-xl border-2 border-[#18D4F7]/85 bg-gradient-to-r from-[#EDE9FE] via-[#E8F7FF] to-[#CCFBEF] px-3 py-2 pl-3 shadow-[0_10px_32px_-10px_rgba(15,23,42,0.28)] ring-2 ring-black/[0.04]">
          <button
            type="button"
            onClick={onDismiss}
            className="pointer-events-auto absolute -right-1 -top-1 z-[5] flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-[#334155] shadow-md hover:bg-slate-50"
            aria-label="Cerrar aviso del diagnóstico ARGOS"
          >
            <span aria-hidden className="text-base font-semibold leading-none">
              ×
            </span>
          </button>
          <p className="pr-10 text-[11px] font-extrabold leading-snug tracking-tight text-[#081018] md:text-[12px]">
            {PROMO_TEXT_MAIN}
          </p>
          <p className="mt-1 text-[10px] font-black leading-snug md:text-[11px]">
            <span className="text-[#B91C1C]">{PROMO_HIGHLIGHT_PARTS[0]}</span>
            <span className="font-bold text-[#334155]"> · </span>
            <span className="text-[#047857]">{PROMO_HIGHLIGHT_PARTS[1]}</span>
            <span className="font-bold text-[#334155]"> · </span>
            <span className="text-[#1D4ED8]">{PROMO_HIGHLIGHT_PARTS[2]}</span>
          </p>
          <Link
            href={DIAGNOSTIC_HREF}
            className="pointer-events-auto mt-2 inline-flex min-h-[36px] w-full items-center justify-center rounded-lg bg-[#0EA5E9] px-3 py-2 text-[11px] font-black tracking-tight text-[#081018] shadow-[0_8px_20px_-6px_rgba(14,165,233,0.55)] ring-2 ring-[#0891b2]/55 hover:bg-[#38BDF8] md:text-xs"
          >
            {PROMO_TEXT_CTA}
          </Link>
        </div>
        <div
          className="absolute -right-1.5 bottom-2.5 h-3 w-3 rotate-45 border-b-2 border-r-2 border-[#18D4F7]/70 bg-[#CCFBEF]"
          style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
          aria-hidden
        />
      </div>

      <svg
        width={44}
        height={24}
        viewBox="0 0 44 24"
        className="-mx-px mb-[0.68rem] shrink-0 text-[#0891b2]"
        aria-hidden
      >
        <path
          d="M0 12 C 12 14, 24 10, 44 9"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>

      <div className="relative -ml-0.5 shrink-0 -scale-x-100 brightness-[1.04] saturate-[1.12] contrast-[1.02]" aria-hidden>
        <Image
          src={sprite}
          alt=""
          width={96}
          height={96}
          sizes="96px"
          className="h-[3.9rem] w-auto object-contain drop-shadow-[0_6px_18px_rgba(15,23,42,0.28)] md:h-[4.4rem]"
          priority={false}
        />
      </div>
    </div>
  );
}

type RmPhase = "idleRm" | "visibleRm" | "hiddenRm";

function ReducedMotionCycle({
  entranceDelayMs,
  onDismiss
}: {
  entranceDelayMs: number;
  onDismiss: () => void;
}) {
  const [rmPhase, setRmPhase] = useState<RmPhase>("idleRm");

  useEffect(() => {
    if (rmPhase !== "idleRm") return;
    const id = window.setTimeout(() => setRmPhase("visibleRm"), entranceDelayMs);
    return () => window.clearTimeout(id);
  }, [entranceDelayMs, rmPhase]);

  useEffect(() => {
    if (rmPhase !== "visibleRm") return;
    const id = window.setTimeout(() => setRmPhase("hiddenRm"), PARKED_MS);
    return () => window.clearTimeout(id);
  }, [rmPhase]);

  useEffect(() => {
    if (rmPhase !== "hiddenRm") return;
    const id = window.setTimeout(() => setRmPhase("visibleRm"), RESTART_MS);
    return () => window.clearTimeout(id);
  }, [rmPhase]);

  const show = rmPhase === "visibleRm";

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 flex items-center justify-center px-1"
      initial={false}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: show ? 0.4 : 0.9, ease: "easeOut" }}
      aria-hidden={!show}
      role="region"
      aria-label={PROMO_A11Y_DESCRIPTION}
    >
      <div
        className={`flex max-w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border-2 border-[#18D4F7]/85 bg-gradient-to-r from-[#EDE9FE] via-[#E8F7FF] to-[#CCFBEF] px-3 py-2.5 shadow-[0_10px_30px_-8px_rgba(15,23,42,0.22)] ring-2 ring-black/[0.04] ${show ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          <div className="flex items-end gap-2">
            <div className="text-[11px] font-bold leading-snug tracking-tight text-[#081018] md:text-[12px]">
              <p className="max-w-[22rem]">
                {PROMO_TEXT_MAIN}
                <span className="mt-1 block text-[10px] font-extrabold tracking-tight md:text-[11px]">
                  <span className="text-[#B91C1C]">{PROMO_HIGHLIGHT_PARTS[0]}</span>
                  <span className="font-bold text-[#334155]"> · </span>
                  <span className="text-[#047857]">{PROMO_HIGHLIGHT_PARTS[1]}</span>
                  <span className="font-bold text-[#334155]"> · </span>
                  <span className="text-[#1D4ED8]">{PROMO_HIGHLIGHT_PARTS[2]}</span>
                </span>
              </p>
              <Link
                href={DIAGNOSTIC_HREF}
                className="mt-2 inline-flex min-h-[38px] items-center rounded-lg bg-[#0EA5E9] px-3.5 py-2 text-[11px] font-black tracking-tight text-[#081018] shadow-sm ring-2 ring-[#0891b2]/50 hover:bg-[#38BDF8] md:text-xs"
              >
                {PROMO_TEXT_CTA}
              </Link>
            </div>
            <div className="hidden shrink-0 pt-6 sm:block" aria-hidden>
              <Image src={SIT_SPRITE} alt="" width={80} height={80} className="h-12 w-auto -scale-x-100 object-contain opacity-95" />
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg p-1.5 text-[#334155] ring-2 ring-transparent hover:bg-white hover:ring-slate-200"
            aria-label="Cerrar aviso del diagnóstico ARGOS"
          >
            <span aria-hidden className="text-lg leading-none">
              ×
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
