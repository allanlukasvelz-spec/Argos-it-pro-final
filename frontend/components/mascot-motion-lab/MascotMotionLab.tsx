"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties
} from "react";
import "@/styles/mascot-motion-lab.css";

/**
 * FASE 21.6B.4C — FROZEN LOW-MOTION LAB.
 * Canonical source pixels only. WALK = HUMAN-REJECTED (not exposed).
 * See docs/design/ARGOS_MASCOT_LOW_MOTION_FREEZE_21_6B.md
 */

type Subject = "chico" | "dumbo";
type Backdrop = "surface" | "dark";
type LabMode = "rest" | "notice";

type ChicoState = "idle" | "look" | "stand" | "lay" | "sleep";
type DumboState = "idle" | "look" | "sit" | "lay" | "sleep";
type MascotState = ChicoState | DumboState;

const CHICO_SRC: Record<ChicoState, string> = {
  idle: "/mascots/chico/chico_esperando2.png",
  look: "/mascots/chico/chico_mirandoatento.png",
  stand: "/mascots/chico/chico_esperando.png",
  lay: "/mascots/chico/chico_reposo.png",
  sleep: "/mascots/chico/chico_durmiendo.png"
};

const DUMBO_SRC: Record<DumboState, string> = {
  idle: "/mascots/dumbo/dumbo_frente.png",
  look: "/mascots/dumbo/dumbo_esperando_atento.png",
  sit: "/mascots/dumbo/dumbo_sentado_atento.png",
  lay: "/mascots/dumbo/dumbo_relajado.png",
  sleep: "/mascots/dumbo/dumbo_durmiendo.png"
};

const CHICO_CONTROLS: { state: ChicoState; label: string }[] = [
  { state: "idle", label: "Rest" },
  { state: "look", label: "Look" },
  { state: "stand", label: "Stand" },
  { state: "lay", label: "Lay" },
  { state: "sleep", label: "Sleep" }
];

const DUMBO_CONTROLS: { state: DumboState; label: string }[] = [
  { state: "idle", label: "Rest" },
  { state: "look", label: "Look" },
  { state: "sit", label: "Sit" },
  { state: "lay", label: "Lay" },
  { state: "sleep", label: "Sleep" }
];

/**
 * Visual scale normalization (CSS only). Slot 360×420, object-fit contain.
 * Upright: match idle content height. Lay/sleep: horizontal width family.
 * SOURCE_PIXEL_PRESERVED: uniform scale only (no stretch/skew/crop/filter).
 * WALK presentation removed from active lab (HUMAN-REJECTED 21.6B.4B).
 */
type Present = { scale: number; y: number };

const CHICO_PRESENT: Record<ChicoState, Present> = {
  idle: { scale: 1, y: 0 },
  look: { scale: 1.075, y: 0.3 },
  stand: { scale: 1.407, y: 1.6 },
  lay: { scale: 0.998, y: 6.4 },
  sleep: { scale: 1, y: 6.0 }
};

const DUMBO_PRESENT: Record<DumboState, Present> = {
  idle: { scale: 1, y: 0 },
  look: { scale: 1.003, y: -0.1 },
  sit: { scale: 1.005, y: -1.0 },
  lay: { scale: 0.984, y: 2.8 },
  sleep: { scale: 0.964, y: 3.1 }
};

const PRESENT_BY_SRC: Record<string, Present> = {
  ...Object.fromEntries(
    (Object.keys(CHICO_SRC) as ChicoState[]).map((s) => [CHICO_SRC[s], CHICO_PRESENT[s]])
  ),
  ...Object.fromEntries(
    (Object.keys(DUMBO_SRC) as DumboState[]).map((s) => [DUMBO_SRC[s], DUMBO_PRESENT[s]])
  )
};

const DEFAULT_PRESENT: Present = { scale: 1, y: 0 };

function presentStyle(src: string): CSSProperties {
  const p = PRESENT_BY_SRC[src] ?? DEFAULT_PRESENT;
  return {
    ["--mml-scale" as string]: String(p.scale),
    ["--mml-y" as string]: `${p.y}px`
  };
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function MascotMotionLab() {
  const [subject, setSubject] = useState<Subject>("chico");
  const [backdrop, setBackdrop] = useState<Backdrop>("surface");
  const [mode, setMode] = useState<LabMode>("rest");
  const [state, setState] = useState<MascotState>("idle");
  const [activeSrc, setActiveSrc] = useState(CHICO_SRC.idle);
  const [frameVisible, setFrameVisible] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const timers = useRef<number[]>([]);
  const fadeGeneration = useRef(0);
  const activeSrcRef = useRef(activeSrc);
  activeSrcRef.current = activeSrc;

  /** Sequential fade-out → swap → fade-in (no overlapping dual-dog). */
  const FADE_MS = 220;

  const resetTransition = useCallback(() => {
    setFrameVisible(true);
    setTransitioning(false);
  }, []);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
    fadeGeneration.current += 1;
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  const showSrc = useCallback(
    (next: string, nextMode: LabMode) => {
      setMode(nextMode);
      const current = activeSrcRef.current;
      if (next === current) {
        resetTransition();
        return;
      }

      if (prefersReducedMotion()) {
        resetTransition();
        activeSrcRef.current = next;
        setActiveSrc(next);
        return;
      }

      const generation = fadeGeneration.current + 1;
      fadeGeneration.current = generation;

      setTransitioning(true);
      setFrameVisible(false);
      schedule(() => {
        if (fadeGeneration.current !== generation) return;
        activeSrcRef.current = next;
        setActiveSrc(next);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (fadeGeneration.current !== generation) return;
            setFrameVisible(true);
            schedule(() => {
              if (fadeGeneration.current !== generation) return;
              setTransitioning(false);
            }, FADE_MS);
          });
        });
      }, FADE_MS);
    },
    [resetTransition, schedule]
  );

  const sourceFor = useCallback((who: Subject, s: MascotState): string => {
    if (who === "chico") return CHICO_SRC[s as ChicoState];
    return DUMBO_SRC[s as DumboState];
  }, []);

  const switchSubject = (who: Subject) => {
    clearTimers();
    resetTransition();
    setSubject(who);
    setState("idle");
    setMode("rest");
    const nextSrc = who === "chico" ? CHICO_SRC.idle : DUMBO_SRC.idle;
    activeSrcRef.current = nextSrc;
    setActiveSrc(nextSrc);
  };

  const applyState = (next: MascotState) => {
    clearTimers();
    resetTransition();
    setState(next);

    if (next === "look") {
      showSrc(sourceFor(subject, "look"), "notice");
      const hold = prefersReducedMotion() ? 200 : 1200;
      schedule(() => {
        setState("idle");
        showSrc(sourceFor(subject, "idle"), "rest");
      }, hold + (prefersReducedMotion() ? 50 : FADE_MS * 2 + 80));
      return;
    }

    showSrc(sourceFor(subject, next), "rest");
  };

  const controls = subject === "chico" ? CHICO_CONTROLS : DUMBO_CONTROLS;

  const statusLabel = useMemo(() => {
    const modeLabel = mode === "rest" ? "REST" : "NOTICE";
    return `${subject.toUpperCase()} · ${state.toUpperCase()} · ${modeLabel}`;
  }, [subject, state, mode]);

  return (
    <div
      className="mml-lab"
      data-backdrop={backdrop}
      data-mode={mode}
      data-testid="mascot-motion-lab"
    >
      <div className="mml-banner" role="status">
        <strong>LAB ONLY · NOT PRODUCTION · CANONICAL SOURCE PIXELS ONLY</strong>
        <span>Quiet Authority · V1 frozen · no generative frames · no dog warp</span>
      </div>

      <div className="mml-layout">
        <aside className="mml-panel" aria-label="Controles del laboratorio">
          <h2>Controles LAB</h2>

          <div className="mml-group" role="group" aria-label="Sujeto">
            <p className="mml-label">Sujeto</p>
            <button
              type="button"
              className="mml-btn"
              aria-pressed={subject === "chico"}
              onClick={() => switchSubject("chico")}
            >
              Chico
            </button>
            <button
              type="button"
              className="mml-btn"
              aria-pressed={subject === "dumbo"}
              onClick={() => switchSubject("dumbo")}
            >
              Dumbo
            </button>
          </div>

          <div className="mml-group" role="group" aria-label="Fondo de prueba">
            <p className="mml-label">Backdrop</p>
            <button
              type="button"
              className="mml-btn"
              aria-pressed={backdrop === "surface"}
              onClick={() => setBackdrop("surface")}
            >
              Surface #F7F7F5
            </button>
            <button
              type="button"
              className="mml-btn"
              aria-pressed={backdrop === "dark"}
              onClick={() => setBackdrop("dark")}
            >
              Dark #0B1320
            </button>
          </div>

          <div className="mml-group" role="group" aria-label={`Estados ${subject}`}>
            <p className="mml-label">Estados V1 congelados</p>
            {controls.map((c) => (
              <button
                key={c.state}
                type="button"
                className="mml-btn"
                aria-pressed={state === c.state}
                onClick={() => applyState(c.state)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <p className="mml-note">
            PNG canónicos únicamente. Escala uniforme + translateY (mapa de presentación).
            Transición = fade out → cambio de PNG → fade in. WALK rechazado en gate humano
            (pose + translate = deslizamiento); no reintroducir sin nueva decisión.
          </p>
          <p className="mml-note">
            Spec: docs/design/ARGOS_MASCOT_LOW_MOTION_FREEZE_21_6B.md — producción NO
            autorizada.
          </p>
        </aside>

        <section className="mml-stage-wrap" aria-label="Escenario del laboratorio">
          <div className="mml-status">
            <span className="mml-chip">{statusLabel}</span>
            <span className="mml-chip">SOURCE PIXEL LOCK</span>
            {transitioning ? <span className="mml-chip">STATE FADE SWAP</span> : null}
          </div>

          <div className="mml-perimeter" aria-hidden />
          <div className="mml-signal" aria-hidden />

          <div className="mml-mascot-slot">
            <div className={`mml-frame${frameVisible ? " is-active" : ""}`}>
              <img
                src={activeSrc}
                alt={
                  subject === "chico"
                    ? `Chico, estado canónico ${state}`
                    : `Dumbo, estado canónico ${state}`
                }
                style={presentStyle(activeSrc)}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
