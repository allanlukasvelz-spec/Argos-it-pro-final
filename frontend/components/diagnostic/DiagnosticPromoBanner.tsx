"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { DiagnosticSurveyModal } from "@/components/diagnostic/DiagnosticSurveyModal";

type Props = {
  /** Solo al cerrar con X o sesión: colapsar slot del header. */
  onSlotRelease?: () => void;
};

const SESSION_KEY = "argos-diagnostic-promo-dismissed";
/** Copias exactas del diseño de referencia (visible). */
const PROMO_TEXT_MAIN = "Descubre en pocos minutos el estado real de tu web";
const PROMO_TEXT_HIGHLIGHT = "Seguridad · Sistemas · Procesos";
const PROMO_TEXT_CTA = "Iniciar diagnóstico ARGOS";

/** Texto completo para nombre accesible de la región Dumbo. */
const PROMO_A11Y_DESCRIPTION =
  "Descubre en pocos minutos el estado real de tu web, seguridad, sistemas y procesos digitales.";

const CHICO_SECURITY_A11Y_ROLE = "Consejo de seguridad ARGOS sobre protección empresarial";
const PROMO_HIGHLIGHT_PARTS = PROMO_TEXT_HIGHLIGHT.split(" · ");

/** Consejos rotativos para el ciclo Chico (texto después del prefijo “Consejo de Chico:”). Orden fijo por aparición. */
const chicoSecurityTips = [
  "revisa quién tiene acceso a tu web y elimina usuarios que ya no trabajen contigo.",
  "una copia de seguridad no sirve si nunca has comprobado que se puede restaurar.",
  "si todos usan la misma contraseña, tu empresa no tiene control real de acceso.",
  "los plugins sin actualizar son una de las puertas más comunes para ataques.",
  "un formulario que no envía correos puede hacerte perder clientes sin darte cuenta.",
  "activa doble verificación en cuentas críticas siempre que sea posible.",
  "revisa permisos, usuarios y copias antes de que exista una urgencia.",
] as const;

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
const X_DUMBO_ENTER_FROM = "38vw";
const X_DUMBO_PARKED = "-5vw";
const X_DUMBO_EXIT = "-44vw";

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

const SAFE_GAP_LEFT_PX = 88;

function formatChicoAdviceLine(tip: string) {
  return `Consejo de Chico: ${tip}`;
}

export default function DiagnosticPromoBanner({ onSlotRelease }: Props) {
  const prefersReducedMotion = useReducedMotion() === true;
  const phaseRef = useRef<CyclePhase>("idle");
  const pendingNextRef = useRef<"dumbo" | "chico">("dumbo");
  const tipOrderRef = useRef(0);
  /** Incrementa por cada llegada a dumboParked / chicoSpeaking para timeouts únicos con duración aleatoria. */
  const dumboParkedEpochRef = useRef(0);
  const chicoSpeakEpochRef = useRef(0);

  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [phase, setPhase] = useState<CyclePhase>("idle");
  const [motionKey, setMotionKey] = useState(0);

  /** Texto consejo vigente cuando Chico está en pantalla / accesibilidad del globo. */
  const [activeChicoTip, setActiveChicoTip] = useState("");
  const [walkFrameDumbo, setWalkFrameDumbo] = useState(0);
  const [walkFrameChico, setWalkFrameChico] = useState(0);

  const entranceDelayMs = useMemo(() => 1200 + Math.random() * 800, []);

  const setPhaseTracked = useCallback((p: CyclePhase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const bumpMotionKey = useCallback(() => {
    setMotionKey((k) => k + 1);
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

  /** idle → siguiente mascota (según pendiente antes de espera). */
  useEffect(() => {
    if (!hydrated || dismissed || prefersReducedMotion) return;
    if (phase !== "idle") return;
    const id = window.setTimeout(() => {
      const next = pendingNextRef.current;
      bumpMotionKey();
      if (next === "dumbo") {
        setPhaseTracked("dumboEntering");
      } else {
        const ord = tipOrderRef.current;
        tipOrderRef.current += 1;
        const tip = chicoSecurityTips[ord % chicoSecurityTips.length];
        setActiveChicoTip(tip);
        setPhaseTracked("chicoEntering");
      }
    }, entranceDelayMs);
    return () => window.clearTimeout(id);
  }, [bumpMotionKey, dismissed, entranceDelayMs, hydrated, prefersReducedMotion, phase, setPhaseTracked]);

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

  /** Chico globo: 12–18 s. */
  useEffect(() => {
    if (phase !== "chicoSpeaking") return;
    chicoSpeakEpochRef.current += 1;
    const epoch = chicoSpeakEpochRef.current;
    const speakMs = Math.round(12000 + Math.random() * 6000);
    const id = window.setTimeout(() => {
      if (phaseRef.current !== "chicoSpeaking" || chicoSpeakEpochRef.current !== epoch) return;
      setPhaseTracked("chicoExiting");
    }, speakMs);
    return () => window.clearTimeout(id);
  }, [phase, setPhaseTracked]);

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
        const tip = chicoSecurityTips[ord % chicoSecurityTips.length];
        setActiveChicoTip(tip);
        setPhaseTracked("chicoEntering");
      }
    }, RESTART_MS);
    return () => window.clearTimeout(id);
  }, [bumpMotionKey, phase, setPhaseTracked]);

  const handleDismiss = () => {
    setDiagnosticOpen(false);
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

  if (!hydrated || dismissed) return null;

  if (prefersReducedMotion) {
    return (
      <>
        <DiagnosticSurveyModal open={diagnosticOpen} onClose={() => setDiagnosticOpen(false)} />
        <ReducedMotionAlternate
          entranceDelayMs={entranceDelayMs}
          onDismiss={handleDismiss}
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
      ? `${CHICO_SECURITY_A11Y_ROLE}. ${formatChicoAdviceLine(activeChicoTip)}`
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
          className="absolute inset-x-0 bottom-0 flex items-end gap-0 pr-12 will-change-transform md:pr-16 lg:pr-[4.75rem]"
          style={{ paddingLeft: SAFE_GAP_LEFT_PX }}
          initial={
            phase === "dumboEntering"
              ? { x: X_DUMBO_ENTER_FROM, opacity: 1 }
              : { x: X_DUMBO_PARKED, opacity: 1 }
          }
          animate={
            phase === "dumboEntering"
              ? { x: X_DUMBO_PARKED, opacity: 1 }
              : phase === "dumboParked"
                ? { x: X_DUMBO_PARKED, opacity: 1 }
                : phase === "dumboExiting"
                  ? { x: X_DUMBO_EXIT, opacity: 0 }
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
            onDismiss={handleDismiss}
            onStartDiagnostic={() => setDiagnosticOpen(true)}
          />
        </motion.div>
      )}

      {showChrome && isChicoLive && (
        <div className="pointer-events-none absolute bottom-0 left-1/2 z-[2] flex -translate-x-1/2 items-end gap-1.5 pb-[0.45rem] md:gap-2 md:pb-2">
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
              className="relative shrink-0 brightness-[1.04] saturate-[1.08] contrast-[1.02] drop-shadow-[0_12px_28px_-6px_rgba(15,23,42,0.5)]"
              aria-hidden
            >
              <Image
                src={chicoSprite}
                alt=""
                width={120}
                height={120}
                sizes="(max-width: 1024px) 88px, 104px"
                className="h-[4.35rem] w-auto object-contain md:h-[5rem] lg:h-[5.5rem]"
                priority={false}
              />
            </div>
          </motion.div>

          <motion.div
            key={`chico-bubble-${motionKey}-${activeChicoTip}`}
            className="pointer-events-auto flex w-[min(86vw,26rem)] max-w-full shrink justify-center md:w-[min(78vw,32rem)] lg:w-[min(72vw,34rem)]"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={
              phase === "chicoEntering"
                ? { opacity: 0.15, y: 6, scale: 0.97 }
                : phase === "chicoSpeaking" || phase === "chicoExiting"
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 8, scale: 0.96 }
            }
            transition={{ duration: phase === "chicoEntering" ? CHICO_ENTER_S * 0.55 : 0.35, ease: "easeOut" }}
          >
            <ChicoSecurityBubble tip={activeChicoTip} onDismiss={handleDismiss} />
          </motion.div>
        </div>
      )}
      </div>
    </>
  );
}

function DumboBannerInner({
  walkFrame,
  sitting,
  onDismiss,
  onStartDiagnostic,
}: {
  walkFrame: number;
  sitting: boolean;
  onDismiss: () => void;
  onStartDiagnostic: () => void;
}) {
  const ropeGradientId = useId().replace(/:/g, "");
  const sprite = sitting ? DUMBO_SIT_SPRITE : (WALK_FRAMES_DUMBO[walkFrame] ?? WALK_FRAMES_DUMBO[0]);

  return (
    <div className="pointer-events-none flex items-end gap-1 md:gap-1.5">
      <div className="relative w-full max-w-[min(82vw,540px)] shrink-0 lg:max-w-[min(700px,56vw)]">
        <div
          className="pointer-events-auto relative overflow-visible rounded-2xl border-[2.5px] border-[#39F4FF]/90 bg-gradient-to-br from-[#4c1d95] via-[#1e3a8a] to-[#0f766e] px-4 py-3 pb-3 shadow-[0_16px_40px_-10px_rgba(15,23,42,0.45),0_0_36px_-8px_rgba(34,211,238,0.35),inset_0_1px_0_0_rgba(255,255,255,0.22)] ring-2 ring-black/25 md:flex md:flex-row md:items-center md:gap-6 md:px-5 md:py-3.5 md:pb-3.5 lg:gap-8 lg:px-6 lg:py-4"
        >
          <div aria-hidden className="pointer-events-none absolute inset-[2px] rounded-[0.875rem] bg-gradient-to-b from-white/18 via-transparent to-black/22 md:rounded-[1.05rem]" />
          <button
            type="button"
            onClick={onDismiss}
            className="pointer-events-auto absolute right-3 top-3 z-[5] flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/35 text-[#ECFEFF] shadow-lg backdrop-blur-sm hover:bg-black/55 md:right-4 md:top-4"
            aria-label="Cerrar aviso del diagnóstico ARGOS"
          >
            <span aria-hidden className="text-lg font-light leading-none">
              ×
            </span>
          </button>

          <div className="relative z-[1] min-w-0 flex-1 pt-2.5 pr-9 md:min-w-[14rem] md:pt-0 md:pr-10 lg:pr-12">
            <p className="text-base font-bold leading-tight tracking-tight text-white drop-shadow md:text-lg lg:text-xl">
              {PROMO_TEXT_MAIN}
            </p>
            <p className="mt-1.5 text-sm font-black leading-tight text-balance md:text-[0.9375rem] lg:text-base">
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
        className="relative shrink-0 -scale-x-100 brightness-[1.06] saturate-[1.15] contrast-[1.05] drop-shadow-[0_14px_32px_-6px_rgba(15,23,42,0.55)]"
        aria-hidden
      >
        <Image
          src={sprite}
          alt=""
          width={128}
          height={128}
          sizes="(max-width: 1024px) 92px, 112px"
          className="h-[4.85rem] w-auto object-contain md:h-[5.5rem] lg:h-[6.125rem]"
          priority={false}
        />
      </div>
    </div>
  );
}

function ChicoSecurityBubble({ tip, onDismiss }: { tip: string; onDismiss: () => void }) {
  const gradId = useId().replace(/:/g, "");
  const advice = formatChicoAdviceLine(tip);

  return (
    <aside
      className="pointer-events-none relative z-[6] max-w-[100%]"
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
        className="pointer-events-auto relative overflow-hidden rounded-2xl border-[2px] border-[#2DD4BF]/95 bg-[#0f172a] p-4 pr-14 shadow-[0_14px_36px_-10px_rgba(8,51,68,0.55),inset_0_1px_0_0_rgba(148,239,238,0.12)] md:p-5 md:pr-16"
      >
        <div aria-hidden className={`pointer-events-none absolute inset-0 rounded-[calc(1rem-1px)] opacity-95 bg-[linear-gradient(145deg,#0c1929_0%,#082f49_52%,#0e7490_120%)]`} />
        <div className={`absolute inset-[1px] rounded-[calc(1rem-2px)] bg-[linear-gradient(180deg,rgba(148,239,238,0.14)_0%,transparent_45%,rgba(15,118,110,0.08)_100%)]`} aria-hidden />
        <p className="relative z-[1] mb-1 text-xs font-black uppercase leading-tight tracking-[0.08em] text-[#67E8F9] md:text-sm">
          Consejo de seguridad
        </p>
        <p className="relative z-[1] text-sm font-semibold leading-tight tracking-tight text-[#ECFEFF] md:text-base lg:text-lg" id={`chico-tip-body-${gradId.slice(0, 8)}`}>
          <span className="font-black text-[#A5F3FC]">Consejo de Chico:&nbsp;</span>
          <span>{tip}</span>
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="pointer-events-auto absolute right-2.5 top-2.5 z-[5] flex h-8 w-8 items-center justify-center rounded-full border border-teal-200/35 bg-black/40 text-teal-50 shadow backdrop-blur-sm hover:bg-teal-950/60 md:right-3 md:top-3"
          aria-label="Cerrar mensajes promocionales ARGOS del encabezado"
        >
          <span aria-hidden className="text-lg font-light leading-none">
            ×
          </span>
        </button>
      </div>
    </aside>
  );
}

/** Alterna Dumbo y Chico con transiciones suaves sin recorridos largos en el viewport. */
function ReducedMotionAlternate({
  entranceDelayMs,
  onDismiss,
  onStartDiagnostic,
}: {
  entranceDelayMs: number;
  onDismiss: () => void;
  onStartDiagnostic: () => void;
}) {
  type RM = "idle" | "visibleDumbo" | "gapA" | "visibleChico" | "gapB";
  const [rmPhase, setRmPhase] = useState<RM>("idle");
  const tipIxRef = useRef(0);
  const [, tipBump] = useState(0);
  const [chicoSlice, setChicoSlice] = useState("");
  const activeChicoAdvice = useMemo(
    () => (chicoSlice ? formatChicoAdviceLine(chicoSlice) : ""),
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
      const tip = chicoSecurityTips[n % chicoSecurityTips.length];
      setChicoSlice(tip);
      tipBump((v) => v + 1);
      setRmPhase("visibleChico");
    }, RESTART_MS);
    return () => window.clearTimeout(id);
  }, [rmPhase]);

  useEffect(() => {
    if (rmPhase !== "visibleChico") return;
    const ms = Math.round(13000 + Math.random() * 5000);
    const id = window.setTimeout(() => setRmPhase("gapB"), ms);
    return () => window.clearTimeout(id);
  }, [rmPhase]);

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
        className={`relative flex w-full max-w-[min(100%,52rem)] items-end gap-5 pr-12 md:pr-16 lg:pr-[4.75rem] ${showDumbo ? "pointer-events-auto" : "pointer-events-none"}`}
        initial={false}
        animate={{ opacity: showDumbo ? 1 : 0, y: showDumbo ? 0 : 14 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
        aria-hidden={!showDumbo}
        role="region"
        aria-label={PROMO_A11Y_DESCRIPTION}
      >
        <div className="flex min-h-[5.5rem] flex-1 items-end justify-start">
          <div className="pointer-events-none w-full max-w-full space-y-0">
            <DumboReducedCard onDismiss={onDismiss} onStartDiagnostic={onStartDiagnostic} />
          </div>
        </div>
        <div className="shrink-0" aria-hidden>
          <Image
            src={DUMBO_SIT_SPRITE}
            alt=""
            width={104}
            height={104}
            className="h-[4rem] w-auto -scale-x-100 object-contain drop-shadow-[0_12px_22px_-6px_rgba(15,23,42,0.5)] md:h-[4.5rem]"
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
        <Image
          src={CHICO_ATTENTIVE}
          alt=""
          width={104}
          height={104}
          className="h-[4rem] shrink-0 object-contain drop-shadow-[0_12px_22px_-6px_rgba(15,23,42,0.5)] md:h-[4.5rem]"
          aria-hidden
        />
        <div className="max-w-[min(100%,30rem)] shrink">
          <ChicoSecurityBubble tip={chicoSlice} onDismiss={onDismiss} />
        </div>
      </motion.div>
    </div>
  );
}

function DumboReducedCard({
  onDismiss,
  onStartDiagnostic,
}: {
  onDismiss: () => void;
  onStartDiagnostic: () => void;
}) {
  return (
    <div className="relative flex w-full max-w-[min(100%,700px)] flex-col gap-4 overflow-visible rounded-2xl border-[2.5px] border-[#39F4FF]/90 bg-gradient-to-br from-[#4c1d95] via-[#1e3a8a] to-[#0f766e] p-4 pr-[3rem] pb-5 pt-[2.75rem] shadow-[0_16px_40px_-10px_rgba(15,23,42,0.45),inset_0_1px_0_0_rgba(255,255,255,0.22)] ring-2 ring-black/25 md:flex-row md:items-center md:gap-6 md:p-5 md:pr-20 lg:gap-8 lg:p-6 lg:pr-20">
      <div aria-hidden className="pointer-events-none absolute inset-[2px] rounded-[0.9rem] bg-gradient-to-b from-white/16 via-transparent to-black/23 md:rounded-[1.05rem]" />
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-3 top-3 z-[5] flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/35 text-[#ECFEFF] shadow-lg backdrop-blur-sm hover:bg-black/55 md:right-4 md:top-4"
        aria-label="Cerrar aviso del diagnóstico ARGOS"
      >
        <span aria-hidden className="text-lg font-light leading-none">
          ×
        </span>
      </button>
      <div className="relative z-[1] min-w-0 flex-1 pt-6 md:min-w-[14rem] md:pt-0 lg:pb-6">
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
