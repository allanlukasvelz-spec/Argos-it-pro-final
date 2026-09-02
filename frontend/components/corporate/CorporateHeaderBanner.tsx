"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { chicoTips } from "@/components/diagnostic/chicoTips";
import { useI18n } from "@/i18n/useI18n";

type Phase = "dumbo-enter" | "dumbo-hold" | "dumbo-exit" | "chico-enter" | "chico-hold" | "chico-exit";

const DUMBO_WALK = [
  "/mascots/dumbo/dumbo_caminando.png",
  "/mascots/dumbo/dumbo_caminando_2.png",
  "/mascots/dumbo/dumbo_caminando_3.png"
] as const;
const DUMBO_IDLE = "/mascots/dumbo/dumbo_sentado_atento.png";
const CHICO_WALK = ["/mascots/chico/chico_caminando.png", "/mascots/chico/chico_corriendo.png"] as const;
const CHICO_IDLE = "/mascots/chico/chico_mirandoatento.png";

const HOLD_MS = 9000;
const TRANSIT_MS = 1200;
const FRAME_MS = 280;

type Props = {
  className?: string;
};

/**
 * Banner central del header: rotación Dumbo (acompañamiento) / Chico (consejo).
 * Reutiliza copy promocional existente + chicoTips. Motion sutil; reduced-motion = fade.
 */
export default function CorporateHeaderBanner({ className = "" }: Props) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("dumbo-enter");
  const [tipIndex, setTipIndex] = useState(0);
  const [frame, setFrame] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const tip = chicoTips[tipIndex % chicoTips.length] ?? chicoTips[0];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const timers: number[] = [];
    const schedule = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };

    if (phase === "dumbo-enter") {
      schedule(() => setPhase("dumbo-hold"), reducedMotion ? 200 : TRANSIT_MS);
    } else if (phase === "dumbo-hold") {
      schedule(() => setPhase("dumbo-exit"), HOLD_MS);
    } else if (phase === "dumbo-exit") {
      schedule(() => {
        setTipIndex((i) => (i + 1) % chicoTips.length);
        setPhase("chico-enter");
      }, reducedMotion ? 200 : TRANSIT_MS);
    } else if (phase === "chico-enter") {
      schedule(() => setPhase("chico-hold"), reducedMotion ? 200 : TRANSIT_MS);
    } else if (phase === "chico-hold") {
      schedule(() => setPhase("chico-exit"), HOLD_MS);
    } else if (phase === "chico-exit") {
      schedule(() => setPhase("dumbo-enter"), reducedMotion ? 200 : TRANSIT_MS);
    }

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const walking = phase.endsWith("-enter");
    if (!walking) {
      setFrame(0);
      return;
    }
    const id = window.setInterval(() => setFrame((f) => f + 1), FRAME_MS);
    return () => window.clearInterval(id);
  }, [phase, reducedMotion]);

  const isDumbo = phase.startsWith("dumbo");
  const isEnter = phase.endsWith("-enter");
  const isExit = phase.endsWith("-exit");
  const isVisible = !isExit;

  const sprite = useMemo(() => {
    if (isDumbo) {
      if (isEnter && !reducedMotion) return DUMBO_WALK[frame % DUMBO_WALK.length];
      return DUMBO_IDLE;
    }
    if (isEnter && !reducedMotion) return CHICO_WALK[frame % CHICO_WALK.length];
    return CHICO_IDLE;
  }, [isDumbo, isEnter, frame, reducedMotion]);

  const title = isDumbo
    ? t("headerBanner.dumboTitle")
    : `${t("headerBanner.chicoLabel")} · ${tip.titulo}`;
  const body = isDumbo ? t("headerBanner.dumboBody") : tip.mensajeCorto;

  return (
    <div
      className={`argos-header-banner ${className}`.trim()}
      role="region"
      aria-live="polite"
      aria-label={title}
      data-banner-mascot={isDumbo ? "dumbo" : "chico"}
      data-banner-phase={phase}
    >
      <div
        className={[
          "argos-header-banner__inner",
          isVisible ? "is-visible" : "is-hidden",
          isEnter ? "is-enter" : "",
          isExit ? "is-exit" : "",
          reducedMotion ? "is-reduced" : ""
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="argos-header-banner__mascot" aria-hidden="true">
          <Image
            src={sprite}
            alt=""
            width={96}
            height={96}
            className="argos-header-banner__mascot-img"
            priority={false}
          />
        </div>
        <div className="argos-header-banner__copy">
          <p className="argos-header-banner__title">{title}</p>
          <p className="argos-header-banner__body">{body}</p>
        </div>
      </div>
    </div>
  );
}
