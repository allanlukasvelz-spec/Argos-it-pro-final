"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { DiagnosticSurveyModal } from "./DiagnosticSurveyModal";
import { chicoTips, type ChicoTip } from "./chicoTips";

type Props = {
  /** Banner dentro de la fila única del header (entre logo y menú). */
  embeddedInHeader?: boolean;
};
/** Copias exactas del diseño de referencia (visible). */
const PROMO_TEXT_MAIN = "Descubre en pocos minutos el estado real de tu web";
const PROMO_TEXT_HIGHLIGHT = "Seguridad · Sistemas · Procesos";
const PROMO_TEXT_CTA = "Iniciar diagnóstico ARGOS";

/** Texto completo para nombre accesible de la región Dumbo. */
const PROMO_A11Y_DESCRIPTION =
  "Descubre en pocos minutos el estado real de tu web, seguridad, sistemas y procesos digitales.";

const CHICO_SECURITY_A11Y_ROLE = "Consejos prácticos ARGOS para mejorar tu presencia digital";
const PROMO_HIGHLIGHT_PARTS = PROMO_TEXT_HIGHLIGHT.split(" · ");

type CyclePhase =
  | "idle"
  | "dumboEntering"
  | "dumboParked"
  | "dumboExiting"
  | "chicoEntering"
  | "chicoSpeaking"
  | "chicoExiting"
  | "waitingRestart";

const WALK_FRAMES_DUMBO = [
  "/mascots/dumbo/dumbo_caminando.png",
  "/mascots/dumbo/dumbo_caminando_2.png",
  "/mascots/dumbo/dumbo_caminando_3.png",
] as const;

const DUMBO_SIT_SPRITE = "/mascots/dumbo/dumbo_sentado_atento.png";

/** Entrada desde la derecha (Dumbo). Parkado más centrado respecto al slot y menos pegado al menú. */
const X_DUMBO_ENTER_FROM = "28vw";
const X_DUMBO_PARKED = "0px";
const X_DUMBO_EXIT = "-38vw";

const DUMBO_ENTER_S = 3.5;
const DUMBO_EXIT_S = 4.2;

const CHICO_WALK_FRAMES = [
  "/mascots/chico/chico_caminando.png",
  "/mascots/chico/chico_corriendo.png",
] as const;

const CHICO_ATTENTIVE = "/mascots/chico/chico_mirandoatento.png";
const CHICO_ALERT_WAIT = "/mascots/chico/chico_esperando2.png";

/** Chico en bloque centrado: offsets locales (px) respecto al cluster globo+mascota. */
const CHICO_CLUSTER_ENTER_X = -56;
const CHICO_CLUSTER_PARKED_X = 0;
const CHICO_CLUSTER_EXIT_X = -88;

const CHICO_ENTER_S = 3;
const CHICO_EXIT_S = 3.2;

const RESTART_MS = 5000;
/** Tras cerrar el modal de consejo: tiempo mínimo antes de que Chico salga del banner. */
const CHICO_SPEAK_AFTER_DETAIL_MS = 14000;

/** Margen izquierdo del slot Dumbo en layout de fila separada (legado). */
const SAFE_GAP_LEFT_PX = 72;
const SAFE_GAP_LEFT_HEADER_PX = 4;
/** Caja fija del sprite Dumbo: evita que el globo de texto salte al cambiar frame caminar/sentado. */
const DUMBO_SPRITE_BOX = "h-[4.25rem] w-[4.25rem] md:h-[4.75rem] md:w-[4.75rem] lg:h-[5.25rem] lg:w-[5.25rem]";
const CHICO_SPRITE_BOX = "h-[3.85rem] w-[3.85rem] md:h-[4.35rem] md:w-[4.35rem] lg:h-[4.75rem] lg:w-[4.75rem]";

function formatChicoAdviceForA11y(tip: ChicoTip) {
  return `Consejo de Chico: ${tip.titulo}. ${tip.mensajeCorto}`;
}

export default function DiagnosticPromoBanner({ embeddedInHeader = false }: Props) {
  const prefersReducedMotion = useReducedMotion() === true;
  const dumboGapLeftPx = embeddedInHeader ? SAFE_GAP_LEFT_HEADER_PX : SAFE_GAP_LEFT_PX;
  const dumboEnterFrom = embeddedInHeader ? "72%" : X_DUMBO_ENTER_FROM;
  const dumboExitTo = embeddedInHeader ? "-72%" : X_DUMBO_EXIT;
  const dumboSlotPadEnd = embeddedInHeader ? "pr-1 md:pr-2" : "pr-6 md:pr-10 lg:pr-12";
  const phaseRef = useRef<CyclePhase>("idle");
  const pendingNextRef = useRef<"dumbo" | "chico">("dumbo");
  const tipOrderRef = useRef(0);
  /** Incrementa por cada llegada a dumboParked / chicoSpeaking para timeouts únicos con duración aleatoria. */
  const dumboParkedEpochRef = useRef(0);
  const chicoSpeakEpochRef = useRef(0);
  const chicoSpeakDelayMsRef = useRef<number | null>(null);

  const [hydrated, setHydrated] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [phase, setPhase] = useState<CyclePhase>("idle");
  const [motionKey, setMotionKey] = useState(0);

  /** Texto consejo vigente cuando Chico está en pantalla / accesibilidad del globo. */
  const [activeChicoTip, setActiveChicoTip] = useState<ChicoTip | null>(null);
  const [walkFrameDumbo, setWalkFrameDumbo] = useState(0);
  const [walkFrameChico, setWalkFrameChico] = useState(0);
  const [tipDetailOpen, setTipDetailOpen] = useState(false);

  const entranceDelayMs = useMemo(() => 1200 + Math.random() * 800, []);

  const handleTipDetailOpen = useCallback(() => setTipDetailOpen(true), []);
  const handleTipDetailClose = useCallback(() => {
    chicoSpeakDelayMsRef.current = Math.round(CHICO_SPEAK_AFTER_DETAIL_MS + Math.random() * 4000);
    setTipDetailOpen(false);
  }, []);

  const setPhaseTracked = useCallback((p: CyclePhase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const bumpMotionKey = useCallback(() => {
    setMotionKey((k) => k + 1);
  }, []);

  useEffect(() => {
    setHydrated(true);
  }, []);

  /** idle → siguiente mascota (según pendiente antes de espera). */
  useEffect(() => {
    if (!hydrated || prefersReducedMotion) return;
    if (phase !== "idle") return;
    const id = window.setTimeout(() => {
      const next = pendingNextRef.current;
      bumpMotionKey();
      if (next === "dumbo") {
        setPhaseTracked("dumboEntering");
      } else {
        const ord = tipOrderRef.current;
        tipOrderRef.current += 1;
        const tip = chicoTips[ord % chicoTips.length];
        setActiveChicoTip(tip);
        setPhaseTracked("chicoEntering");
      }
    }, entranceDelayMs);
    return () => window.clearTimeout(id);
  }, [bumpMotionKey, entranceDelayMs, hydrated, prefersReducedMotion, phase, setPhaseTracked]);

  const dumboWalkActive =
    !prefersReducedMotion && (phase === "dumboEntering" || phase === "dumboExiting");
  useEffect(() => {
    if (!dumboWalkActive) return;
    const id = window.setInterval(() => setWalkFrameDumbo((f) => (f + 1) % WALK_FRAMES_DUMBO.length), 160);
    return () => window.clearInterval(id);
  }, [dumboWalkActive]);

  const chicoWalkActive =
    !prefersReducedMotion && phase === "chicoEntering";
  useEffect(() => {
    if (!chicoWalkActive) return;
    const id = window.setInterval(() => setWalkFrameChico((f) => (f + 1) % CHICO_WALK_FRAMES.length), 180);
    return () => window.clearInterval(id);
  }, [chicoWalkActive]);

  /** Dumbo entrada. */
  useEffect(() => {
    if (phase !== "dumboEntering") return;
    const ms = Math.round(DUMBO_ENTER_S * 1000);
    const id = window.setTimeout(() => {
      if (phaseRef.current !== "dumboEntering") return;
      setPhaseTracked("dumboParked");
    }, ms);
    return () => window.clearTimeout(id);
  }, [motionKey, phase, setPhaseTracked]);

  /** Dumbo detenido: 20–30 s. */
  useEffect(() => {
    if (phase !== "dumboParked") return;
    dumboParkedEpochRef.current += 1;
    const epoch = dumboParkedEpochRef.current;
    const parkedMs = Math.round(20000 + Math.random() * 10000);
    const id = window.setTimeout(() => {
      if (phaseRef.current !== "dumboParked" || dumboParkedEpochRef.current !== epoch) return;
      setPhaseTracked("dumboExiting");
    }, parkedMs);
    return () => window.clearTimeout(id);
  }, [phase, setPhaseTracked]);

  /** Dumbo salida. */
  useEffect(() => {
    if (phase !== "dumboExiting") return;
    const ms = Math.round(DUMBO_EXIT_S * 1000);
    const id = window.setTimeout(() => {
      if (phaseRef.current !== "dumboExiting") return;
      pendingNextRef.current = "chico";
      setPhaseTracked("waitingRestart");
    }, ms);
    return () => window.clearTimeout(id);
  }, [motionKey, phase, setPhaseTracked]);

  /** Chico entrada → hablando. */
  useEffect(() => {
    if (phase !== "chicoEntering") return;
    const ms = Math.round(CHICO_ENTER_S * 1000);
    const id = window.setTimeout(() => {
      if (phaseRef.current !== "chicoEntering") return;
      setPhaseTracked("chicoSpeaking");
    }, ms);
    return () => window.clearTimeout(id);
  }, [motionKey, phase, setPhaseTracked]);

  /** Chico globo: 12–18 s (pausado mientras el modal de explicación está abierto). */
  useEffect(() => {
    if (phase !== "chicoSpeaking") {
      chicoSpeakDelayMsRef.current = null;
      return;
    }
    if (tipDetailOpen) return;
    if (chicoSpeakDelayMsRef.current === null) {
      chicoSpeakDelayMsRef.current = Math.round(12000 + Math.random() * 6000);
    }
    chicoSpeakEpochRef.current += 1;
    const epoch = chicoSpeakEpochRef.current;
    const speakMs = chicoSpeakDelayMsRef.current;
    const id = window.setTimeout(() => {
      if (phaseRef.current !== "chicoSpeaking" || chicoSpeakEpochRef.current !== epoch) return;
      setPhaseTracked("chicoExiting");
    }, speakMs);
    return () => window.clearTimeout(id);
  }, [phase, setPhaseTracked, tipDetailOpen]);

  /** Chico salida. */
  useEffect(() => {
    if (phase !== "chicoExiting") return;
    const ms = Math.round(CHICO_EXIT_S * 1000);
    const id = window.setTimeout(() => {
      if (phaseRef.current !== "chicoExiting") return;
      pendingNextRef.current = "dumbo";
      setPhaseTracked("waitingRestart");
    }, ms);
    return () => window.clearTimeout(id);
  }, [motionKey, phase, setPhaseTracked]);

  /** Pausa 5 s entre mascotas; el siguiente ciclo viene de pendingNextRef (ya establecido al terminar salida). */
  useEffect(() => {
    if (phase !== "waitingRestart") return;
    const id = window.setTimeout(() => {
      if (phaseRef.current !== "waitingRestart") return;
      bumpMotionKey();
      const next = pendingNextRef.current;
      if (next === "dumbo") {
        setPhaseTracked("dumboEntering");
      } else {
        const ord = tipOrderRef.current;
        tipOrderRef.current += 1;
        const tip = chicoTips[ord % chicoTips.length];
        setActiveChicoTip(tip);
        setPhaseTracked("chicoEntering");
      }
    }, RESTART_MS);
    return () => window.clearTimeout(id);
  }, [bumpMotionKey, phase, setPhaseTracked]);

  if (!hydrated) return null;

  if (prefersReducedMotion) {
    return (
      <>
        <DiagnosticSurveyModal open={diagnosticOpen} onClose={() => setDiagnosticOpen(false)} />
        <ReducedMotionAlternate
          entranceDelayMs={entranceDelayMs}
          embeddedInHeader={embeddedInHeader}
          onStartDiagnostic={() => setDiagnosticOpen(true)}
        />
      </>
    );
  }

  const showChrome = phase !== "idle" && phase !== "waitingRestart";
  const isDumboLive =
    phase === "dumboEntering" || phase === "dumboParked" || phase === "dumboExiting";
  const isChicoLive =
    phase === "chicoEntering" || phase === "chicoSpeaking" || phase === "chicoExiting";

  const regionAria =
    isChicoLive && activeChicoTip
      ? `${CHICO_SECURITY_A11Y_ROLE}. ${formatChicoAdviceForA11y(activeChicoTip)}`
      : PROMO_A11Y_DESCRIPTION;

  const sittingDumbo = phase === "dumboParked";
  const chicoAttentionSprite =
    (tipOrderRef.current & 1) === 1 ? CHICO_ALERT_WAIT : CHICO_ATTENTIVE;

  const chicoSprite =
    phase === "chicoEntering"
      ? (CHICO_WALK_FRAMES[walkFrameChico] ?? CHICO_WALK_FRAMES[0])
      : chicoAttentionSprite;

  return (
    <>
      <DiagnosticSurveyModal open={diagnosticOpen} onClose={() => setDiagnosticOpen(false)} />
      <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      role="region"
      aria-label={regionAria}
      aria-hidden={!showChrome}
      aria-live={isChicoLive && phase === "chicoSpeaking" ? ("polite" as const) : undefined}
    >
      {showChrome && isDumboLive && (
        <motion.div
          key={`dumbo-slot-${motionKey}`}
          className={`absolute inset-x-0 bottom-0 flex w-full max-w-full items-end gap-0 will-change-transform ${dumboSlotPadEnd}`}
          style={{ paddingLeft: dumboGapLeftPx }}
          initial={
            phase === "dumboEntering"
              ? { x: dumboEnterFrom, opacity: 1 }
              : { x: X_DUMBO_PARKED, opacity: 1 }
          }
          animate={
            phase === "dumboEntering"
              ? { x: X_DUMBO_PARKED, opacity: 1 }
              : phase === "dumboParked"
                ? { x: X_DUMBO_PARKED, opacity: 1 }
                : phase === "dumboExiting"
                  ? { x: dumboExitTo, opacity: 0 }
                  : { x: X_DUMBO_PARKED, opacity: 1 }
          }
          transition={
            phase === "dumboEntering"
              ? { duration: DUMBO_ENTER_S, ease: [0.25, 0.46, 0.45, 0.94] }
              : phase === "dumboExiting"
                ? { duration: DUMBO_EXIT_S, ease: "easeInOut" }
                : { duration: 0 }
          }
        >
          <DumboBannerInner
            walkFrame={walkFrameDumbo}
            sitting={sittingDumbo}
            onStartDiagnostic={() => setDiagnosticOpen(true)}
          />
        </motion.div>
      )}

      {showChrome && isChicoLive && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex justify-center px-2 pb-[0.45rem] md:px-4 md:pb-2">
          <div className="flex w-full max-w-[min(100%,44rem)] items-end justify-center gap-1.5 md:gap-2">
          <motion.div
            key={`chico-mascot-${motionKey}`}
            className="flex shrink-0 items-end"
            initial={
              phase === "chicoEntering"
                ? { x: CHICO_CLUSTER_ENTER_X, opacity: 1 }
                : { x: CHICO_CLUSTER_PARKED_X, opacity: 1 }
            }
            animate={
              phase === "chicoEntering"
                ? { x: CHICO_CLUSTER_PARKED_X, opacity: 1 }
                : phase === "chicoSpeaking"
                  ? { x: CHICO_CLUSTER_PARKED_X, opacity: 1 }
                  : phase === "chicoExiting"
                    ? { x: CHICO_CLUSTER_EXIT_X, opacity: 0 }
                    : { x: CHICO_CLUSTER_PARKED_X, opacity: 1 }
            }
            transition={
              phase === "chicoEntering"
                ? { duration: CHICO_ENTER_S, ease: [0.33, 0.72, 0.45, 0.94] }
                : phase === "chicoExiting"
                  ? { duration: CHICO_EXIT_S, ease: "easeInOut" }
                  : { duration: 0 }
            }
          >
            <div
              className={`relative shrink-0 ${CHICO_SPRITE_BOX} brightness-[1.04] saturate-[1.08] contrast-[1.02] drop-shadow-[0_12px_28px_-6px_rgba(15,23,42,0.5)]`}
              aria-hidden
            >
              <Image
                src={chicoSprite}
                alt=""
                width={120}
                height={120}
                sizes="(max-width: 1024px) 72px, 88px"
                className="h-full w-full object-contain object-bottom"
                priority={false}
              />
            </div>
          </motion.div>

          <motion.div
            key={`chico-bubble-${motionKey}-${activeChicoTip?.id ?? "none"}`}
            className="pointer-events-auto min-w-0 flex-1 max-w-[min(100%,30rem)]"
            initial={{ opacity: 0 }}
            animate={
              phase === "chicoEntering"
                ? { opacity: 0.2 }
                : phase === "chicoSpeaking" || phase === "chicoExiting"
                  ? { opacity: 1 }
                  : { opacity: 0 }
            }
            transition={{ duration: phase === "chicoEntering" ? CHICO_ENTER_S * 0.55 : 0.35, ease: "easeOut" }}
          >
            <ChicoSecurityBubble
              tip={activeChicoTip}
              onDetailOpen={handleTipDetailOpen}
              onDetailClose={handleTipDetailClose}
            />
          </motion.div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

function DumboBannerInner({
  walkFrame,
  sitting,
  onStartDiagnostic,
}: {
  walkFrame: number;
  sitting: boolean;
  onStartDiagnostic: () => void;
}) {
  const ropeGradientId = useId().replace(/:/g, "");
  const sprite = sitting ? DUMBO_SIT_SPRITE : (WALK_FRAMES_DUMBO[walkFrame] ?? WALK_FRAMES_DUMBO[0]);

  return (
    <div className="pointer-events-none flex w-full min-w-0 max-w-full items-end gap-1 md:gap-1.5">
      <div className="relative min-w-0 flex-1 max-w-[min(100%,520px)]">
        <div
          className="pointer-events-auto relative overflow-visible rounded-2xl border-[2.5px] border-[#39F4FF]/90 bg-gradient-to-br from-[#4c1d95] via-[#1e3a8a] to-[#0f766e] px-4 py-3 pb-3 shadow-[0_16px_40px_-10px_rgba(15,23,42,0.45),0_0_36px_-8px_rgba(34,211,238,0.35),inset_0_1px_0_0_rgba(255,255,255,0.22)] ring-2 ring-black/25 md:flex md:flex-row md:items-center md:gap-6 md:px-5 md:py-3.5 md:pb-3.5 lg:gap-8 lg:px-6 lg:py-4"
        >
          <div aria-hidden className="pointer-events-none absolute inset-[2px] rounded-[0.875rem] bg-gradient-to-b from-white/18 via-transparent to-black/22 md:rounded-[1.05rem]" />
          <div className="relative z-[1] min-w-0 flex-1 md:min-w-[12rem]">
            <p className="min-h-[2.5rem] text-base font-bold leading-tight tracking-tight text-white drop-shadow md:min-h-[2.75rem] md:text-lg lg:text-xl">
              {PROMO_TEXT_MAIN}
            </p>
            <p className="mt-1.5 min-h-[2.5rem] text-sm font-black leading-tight text-balance md:min-h-[2.25rem] md:text-[0.9375rem] lg:text-base">
              <span className="text-[#fca5a5]">{PROMO_HIGHLIGHT_PARTS[0]}</span>
              <span className="font-bold tracking-wide text-white/55">{" · "}</span>
              <span className="text-[#6ee7b7]">{PROMO_HIGHLIGHT_PARTS[1]}</span>
              <span className="font-bold tracking-wide text-white/55">{" · "}</span>
              <span className="text-[#7dd3fc]">{PROMO_HIGHLIGHT_PARTS[2]}</span>
            </p>
          </div>

          <div className="relative z-[1] mt-3 shrink-0 md:mt-0 md:flex md:w-auto md:flex-col md:justify-center">
            <button
              type="button"
              onClick={onStartDiagnostic}
              className="pointer-events-auto inline-flex min-h-[44px] w-full items-center justify-center whitespace-nowrap rounded-xl bg-[#22D3EE] px-5 py-2.5 text-center text-sm font-black leading-tight tracking-tight text-[#082f49] shadow-[0_8px_24px_-6px_rgba(6,182,212,0.85),inset_0_1px_0_0_rgba(255,255,255,0.45)] ring-2 ring-[#A5F3FC]/95 ring-offset-2 ring-offset-[#0f172a]/0 hover:bg-[#67E8F9] md:min-h-[46px] md:min-w-[11.5rem] md:px-5 md:text-sm lg:min-w-[12.5rem] lg:px-6 lg:py-2.5 lg:text-base"
            >
              {PROMO_TEXT_CTA}
            </button>
          </div>
        </div>
        <div
          className="pointer-events-none absolute bottom-[18%] -right-1 z-[2] h-7 w-7 rotate-45 border-b-[2.5px] border-r-[2.5px] border-[#39F4FF]/75 bg-[#134e4a] shadow-[3px_3px_14px_-2px_rgba(34,211,238,0.45)] md:-right-1 md:bottom-[22%]"
          style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
          aria-hidden
        />
      </div>

      <svg
        width={56}
        height={40}
        viewBox="0 0 56 40"
        className="-mr-px mb-[0.82rem] shrink-0 md:mb-[0.92rem]"
        aria-hidden
      >
        <defs>
          <linearGradient id={ropeGradientId} x1="0%" y1="50%" x2="100%" y2="40%">
            <stop offset="0%" stopColor="#67E8F9" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.95} />
          </linearGradient>
        </defs>
        <path
          d="M0 21 C 16 26, 32 17, 56 13"
          fill="none"
          stroke={`url(#${ropeGradientId})`}
          strokeWidth={3.25}
          strokeLinecap="round"
        />
        <path
          d="M0 21 C 12 23, 24 17, 48 13"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1.15}
          strokeLinecap="round"
        />
      </svg>

      <div
        className={`relative shrink-0 ${DUMBO_SPRITE_BOX} -scale-x-100 brightness-[1.06] saturate-[1.15] contrast-[1.05] drop-shadow-[0_14px_32px_-6px_rgba(15,23,42,0.55)]`}
        aria-hidden
      >
        <Image
          src={sprite}
          alt=""
          width={128}
          height={128}
          sizes="(max-width: 1024px) 80px, 96px"
          className="h-full w-full object-contain object-bottom"
          priority={false}
        />
      </div>
    </div>
  );
}

function ChicoSecurityBubble({
  tip,
  onDetailOpen,
  onDetailClose
}: {
  tip: ChicoTip | null;
  onDetailOpen?: () => void;
  onDetailClose?: () => void;
}) {
  const gradId = useId().replace(/:/g, "");
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    setDetailModalOpen(false);
  }, [tip?.id]);

  const openDetail = () => {
    setDetailModalOpen(true);
    onDetailOpen?.();
  };

  const closeDetail = () => {
    setDetailModalOpen(false);
    onDetailClose?.();
  };

  if (!tip) return null;

  const advice = formatChicoAdviceForA11y(tip);
  const titleId = `chico-tip-title-${gradId.slice(0, 8)}`;

  return (
    <>
    <aside
      className="pointer-events-none relative z-[6] w-full max-w-full overflow-visible pb-1"
      aria-label={`${CHICO_SECURITY_A11Y_ROLE}. ${advice}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-4 left-[15%] h-11 w-11 rotate-[-28deg] rounded-br-2xl rounded-tl-md border-[2px] border-[#5EEAD4]/90 bg-[#0f172a] md:left-[13%]"
        style={{
          clipPath: "polygon(0 0, 100% 0, 55% 100%, 0 40%)",
          boxShadow: "4px 4px 16px rgba(8,145,178,0.35)"
        }}
      />
      <div
        role="presentation"
        className="pointer-events-auto relative overflow-hidden rounded-2xl border-[2px] border-[#2DD4BF]/95 bg-[#0f172a] p-4 shadow-[0_14px_36px_-10px_rgba(8,51,68,0.55),inset_0_1px_0_0_rgba(148,239,238,0.12)] md:p-5"
      >
        <div aria-hidden className={`pointer-events-none absolute inset-0 rounded-[calc(1rem-1px)] opacity-95 bg-[linear-gradient(145deg,#0c1929_0%,#082f49_52%,#0e7490_120%)]`} />
        <div className={`absolute inset-[1px] rounded-[calc(1rem-2px)] bg-[linear-gradient(180deg,rgba(148,239,238,0.14)_0%,transparent_45%,rgba(15,118,110,0.08)_100%)]`} aria-hidden />
        <p className="relative z-[1] mb-1 text-xs font-black uppercase leading-tight tracking-[0.08em] text-[#67E8F9] md:text-sm">
          Consejo práctico
        </p>
        <h3
          className="relative z-[1] min-h-[2.5rem] text-sm font-black leading-snug text-[#ECFEFF] md:min-h-[2.75rem] md:text-base"
          id={titleId}
        >
          {tip.titulo}
        </h3>
        <p className="relative z-[1] mt-2 min-h-[3rem] text-sm font-medium leading-snug text-[#E0F2FE]/95 md:min-h-[3.25rem] md:text-[0.9375rem]">
          {tip.mensajeCorto}
        </p>
        <button
          type="button"
          onClick={openDetail}
          aria-haspopup="dialog"
          className="relative z-[1] mt-3 inline-flex min-h-[40px] items-center rounded-lg border border-[#5EEAD4]/45 bg-[#082f49]/80 px-3 py-2 text-left text-xs font-black uppercase tracking-wide text-[#A5F3FC] shadow-sm ring-1 ring-[#2DD4BF]/30 transition hover:bg-[#0c4a6e]/90 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 md:text-[13px]"
        >
          Ver explicación y pasos
        </button>
      </div>
    </aside>
      <ChicoTipDetailModal open={detailModalOpen} tip={tip} titleId={titleId} onClose={closeDetail} />
    </>
  );
}

function ChicoTipDetailModal({
  open,
  tip,
  titleId,
  onClose
}: {
  open: boolean;
  tip: ChicoTip;
  titleId: string;
  onClose: () => void;
}) {
  const dialogTitleId = `${titleId}-modal`;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[220] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#020617]/72 backdrop-blur-[3px]"
        aria-label="Cerrar explicación del consejo"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        className="relative z-[1] flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 border-[#2DD4BF]/80 bg-[#0f172a] shadow-[0_24px_64px_-12px_rgba(2,6,23,0.85),0_0_0_1px_rgba(45,212,191,0.15)] sm:max-w-xl md:max-w-2xl"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 0.72, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,#0c1929_0%,#082f49_48%,#0e7490_115%)]"
        />
        <div className="relative z-[1] flex shrink-0 items-start justify-between gap-3 border-b border-[#2DD4BF]/35 px-5 py-4 md:px-6 md:py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#67E8F9] md:text-xs">
              Consejo práctico · Chico
            </p>
            <h2 id={dialogTitleId} className="mt-1 text-lg font-black leading-snug text-[#ECFEFF] md:text-xl">
              {tip.titulo}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-teal-200/35 bg-black/45 text-teal-50 shadow backdrop-blur-sm transition hover:bg-teal-950/70"
            aria-label="Cerrar explicación"
          >
            <span aria-hidden className="text-xl font-light leading-none">
              ×
            </span>
          </button>
        </div>
        <div className="relative z-[1] flex-1 space-y-5 overflow-y-auto px-5 py-4 md:space-y-6 md:px-6 md:py-5">
          <p className="text-sm leading-relaxed text-[#E0F2FE]/95 md:text-[0.9375rem]">{tip.explicacion}</p>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-[#67E8F9]">Pasos prácticos</p>
            <ol className="mt-2.5 list-decimal space-y-2.5 pl-5 text-sm leading-snug text-[#E0F2FE] marker:font-bold marker:text-[#5EEAD4] md:text-[0.9375rem]">
              {tip.pasos.map((paso, index) => (
                <li key={`${tip.id}-modal-paso-${String(index)}`} className="pl-0.5">
                  {paso}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl border border-[#0d9488]/55 bg-[#042f2e]/70 p-4 shadow-inner">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#99F6E4]">Acción recomendada</p>
            <p className="mt-2 text-sm font-semibold leading-snug text-[#ECFEFF] md:text-[0.9375rem]">
              {tip.accionRecomendada}
            </p>
          </div>
        </div>
        <div className="relative z-[1] shrink-0 border-t border-[#2DD4BF]/30 px-5 py-4 md:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#5EEAD4]/50 bg-[#082f49] px-4 py-2.5 text-sm font-black uppercase tracking-wide text-[#A5F3FC] shadow-sm transition hover:bg-[#0c4a6e] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            Volver al consejo
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

/** Alterna Dumbo y Chico con transiciones suaves sin recorridos largos en el viewport. */
function ReducedMotionAlternate({
  entranceDelayMs,
  embeddedInHeader = false,
  onStartDiagnostic,
}: {
  entranceDelayMs: number;
  embeddedInHeader?: boolean;
  onStartDiagnostic: () => void;
}) {
  type RM = "idle" | "visibleDumbo" | "gapA" | "visibleChico" | "gapB";
  const [rmPhase, setRmPhase] = useState<RM>("idle");
  const tipIxRef = useRef(0);
  const [, tipBump] = useState(0);
  const [chicoSlice, setChicoSlice] = useState<ChicoTip | null>(null);
  const [tipDetailOpen, setTipDetailOpen] = useState(false);
  const rmChicoVisibleMsRef = useRef<number | null>(null);
  const handleTipDetailOpen = useCallback(() => setTipDetailOpen(true), []);
  const handleTipDetailClose = useCallback(() => {
    rmChicoVisibleMsRef.current = Math.round(CHICO_SPEAK_AFTER_DETAIL_MS + Math.random() * 4000);
    setTipDetailOpen(false);
  }, []);
  const activeChicoAdvice = useMemo(
    () => (chicoSlice ? formatChicoAdviceForA11y(chicoSlice) : ""),
    [chicoSlice]
  );

  useEffect(() => {
    if (rmPhase !== "idle") return;
    const id = window.setTimeout(() => setRmPhase("visibleDumbo"), entranceDelayMs);
    return () => window.clearTimeout(id);
  }, [entranceDelayMs, rmPhase]);

  useEffect(() => {
    if (rmPhase !== "visibleDumbo") return;
    const ms = Math.round(14000 + Math.random() * 8000);
    const id = window.setTimeout(() => setRmPhase("gapA"), ms);
    return () => window.clearTimeout(id);
  }, [rmPhase]);

  useEffect(() => {
    if (rmPhase !== "gapA") return;
    const id = window.setTimeout(() => {
      const n = tipIxRef.current;
      tipIxRef.current += 1;
      const tip = chicoTips[n % chicoTips.length];
      setChicoSlice(tip);
      tipBump((v) => v + 1);
      setRmPhase("visibleChico");
    }, RESTART_MS);
    return () => window.clearTimeout(id);
  }, [rmPhase]);

  useEffect(() => {
    if (rmPhase !== "visibleChico") {
      rmChicoVisibleMsRef.current = null;
      return;
    }
    if (tipDetailOpen) return;
    if (rmChicoVisibleMsRef.current === null) {
      rmChicoVisibleMsRef.current = Math.round(13000 + Math.random() * 5000);
    }
    const ms = rmChicoVisibleMsRef.current;
    const id = window.setTimeout(() => setRmPhase("gapB"), ms);
    return () => window.clearTimeout(id);
  }, [rmPhase, tipDetailOpen]);

  useEffect(() => {
    if (rmPhase !== "gapB") return;
    const id = window.setTimeout(() => setRmPhase("visibleDumbo"), RESTART_MS);
    return () => window.clearTimeout(id);
  }, [rmPhase]);

  const showDumbo = rmPhase === "visibleDumbo";
  const showChico = rmPhase === "visibleChico";
  const showAny = showDumbo || showChico;

  const regionAria = showChico ? `${CHICO_SECURITY_A11Y_ROLE}. ${activeChicoAdvice}` : PROMO_A11Y_DESCRIPTION;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end overflow-visible px-2 pb-0"
      aria-hidden={!showAny}
    >
      {/* Dumbo: misma tarjeta y botón */}
      <motion.div
        className={`relative flex w-full max-w-full items-end gap-3 ${
          embeddedInHeader ? "pr-1 md:pr-2" : "max-w-[min(100%,52rem)] gap-5 pr-12 md:pr-16 lg:pr-[4.75rem]"
        } ${showDumbo ? "pointer-events-auto" : "pointer-events-none"}`}
        initial={false}
        animate={{ opacity: showDumbo ? 1 : 0, y: showDumbo ? 0 : 14 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
        aria-hidden={!showDumbo}
        role="region"
        aria-label={PROMO_A11Y_DESCRIPTION}
      >
        <div className="flex min-h-[5.5rem] flex-1 items-end justify-start">
          <div className="pointer-events-none w-full max-w-full space-y-0">
            <DumboReducedCard onStartDiagnostic={onStartDiagnostic} />
          </div>
        </div>
        <div className={`shrink-0 ${DUMBO_SPRITE_BOX}`} aria-hidden>
          <Image
            src={DUMBO_SIT_SPRITE}
            alt=""
            width={104}
            height={104}
            className="h-full w-full -scale-x-100 object-contain object-bottom drop-shadow-[0_12px_22px_-6px_rgba(15,23,42,0.5)]"
          />
        </div>
      </motion.div>

      {/* Chico: grupo centrado — mascota junto al globo */}
      <motion.div
        className={`relative mt-0 flex w-full items-end justify-center gap-1.5 py-2 md:gap-2 md:py-2.5 ${showChico ? "pointer-events-auto" : "pointer-events-none"}`}
        initial={false}
        animate={{
          opacity: showChico ? 1 : 0,
          y: showChico ? -6 : 10,
          height: showChico ? "auto" : "0rem",
          marginTop: showChico ? 0 : "-0.5rem"
        }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        aria-hidden={!showChico}
        role="region"
        aria-label={`${CHICO_SECURITY_A11Y_ROLE}. ${activeChicoAdvice}`}
        aria-live={showChico ? "polite" : undefined}
      >
        <div className={`shrink-0 ${CHICO_SPRITE_BOX}`} aria-hidden>
          <Image
            src={CHICO_ATTENTIVE}
            alt=""
            width={104}
            height={104}
            className="h-full w-full object-contain object-bottom drop-shadow-[0_12px_22px_-6px_rgba(15,23,42,0.5)]"
          />
        </div>
        <div className="max-w-[min(100%,30rem)] shrink">
          <ChicoSecurityBubble
            tip={chicoSlice}
            onDetailOpen={handleTipDetailOpen}
            onDetailClose={handleTipDetailClose}
          />
        </div>
      </motion.div>
    </div>
  );
}

function DumboReducedCard({ onStartDiagnostic }: { onStartDiagnostic: () => void }) {
  return (
    <div className="relative flex w-full max-w-[min(100%,700px)] flex-col gap-4 overflow-visible rounded-2xl border-[2.5px] border-[#39F4FF]/90 bg-gradient-to-br from-[#4c1d95] via-[#1e3a8a] to-[#0f766e] p-4 pb-5 shadow-[0_16px_40px_-10px_rgba(15,23,42,0.45),inset_0_1px_0_0_rgba(255,255,255,0.22)] ring-2 ring-black/25 md:flex-row md:items-center md:gap-6 md:p-5 lg:gap-8 lg:p-6">
      <div aria-hidden className="pointer-events-none absolute inset-[2px] rounded-[0.9rem] bg-gradient-to-b from-white/16 via-transparent to-black/23 md:rounded-[1.05rem]" />
      <div className="relative z-[1] min-w-0 flex-1 md:min-w-[14rem] lg:pb-6">
        <p className="text-base font-bold leading-tight tracking-tight text-white drop-shadow-md md:text-lg lg:text-xl">
          {PROMO_TEXT_MAIN}
        </p>
        <p className="mt-1.5 text-sm font-black leading-tight text-balance md:text-[0.9375rem] lg:text-base">
          <span className="text-[#fca5a5]">{PROMO_HIGHLIGHT_PARTS[0]}</span>
          <span className="font-bold text-white/55">{" · "}</span>
          <span className="text-[#6ee7b7]">{PROMO_HIGHLIGHT_PARTS[1]}</span>
          <span className="font-bold text-white/55">{" · "}</span>
          <span className="text-[#7dd3fc]">{PROMO_HIGHLIGHT_PARTS[2]}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onStartDiagnostic}
        className="relative z-[1] mb-24 inline-flex min-h-[44px] w-full shrink-0 items-center justify-center rounded-xl bg-[#22D3EE] px-6 py-2.5 text-center text-sm font-black leading-tight tracking-tight text-[#082f49] shadow-[0_8px_24px_-6px_rgba(6,182,212,0.85)] ring-2 ring-[#A5F3FC]/90 hover:bg-[#67E8F9] md:mb-[5.5rem] md:mr-4 md:inline-flex md:min-h-[46px] md:w-auto md:min-w-[11.5rem] md:self-center md:text-sm lg:min-w-[12.5rem] lg:text-base"
      >
        {PROMO_TEXT_CTA}
      </button>
    </div>
  );
}
