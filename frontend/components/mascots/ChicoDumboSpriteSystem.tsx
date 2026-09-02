"use client";

import Image from "next/image";
import type { CSSProperties, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useMascotChat } from "@/components/mascots/MascotChatContext";
import { useMascotPauseControl } from "@/components/mascots/MascotPauseControlContext";
import { useMascotController } from "@/hooks/useMascotController";
import { useI18n } from "@/i18n/useI18n";
import {
  CHICO_WALK_CYCLE,
  DUMBO_WALK_CYCLE,
  getChicoPosePath,
  getDumboPosePath,
  type ChicoPoseNode,
  type DumboPoseNode
} from "@/lib/mascotPoseGraph";
import { chicoSprites, dumboSprites } from "@/sprites/spriteManifest";

/**
 * Explicit keyboard activation (Enter/Space) = same as pointer open.
 * preventDefault avoids native button synthesizing a second click (toggle-close).
 */
function activateLauncherKey(event: KeyboardEvent, action: () => void) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  action();
}

const POSE_STEP_MS = 160;

function usePoseSequence<T extends string>(
  target: T,
  resolvePath: (from: T, to: T) => T[],
  reduced: boolean
): T {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);

  useEffect(() => {
    if (target === displayRef.current) return;
    if (reduced) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }
    const path = resolvePath(displayRef.current, target);
    if (path.length <= 1) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }
    let i = 1;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const next = path[i];
      if (!next) return;
      displayRef.current = next;
      setDisplay(next);
      i += 1;
      if (i < path.length) {
        window.setTimeout(tick, POSE_STEP_MS);
      }
    };
    window.setTimeout(tick, POSE_STEP_MS);
    return () => {
      cancelled = true;
    };
  }, [target, resolvePath, reduced]);

  return display;
}

export default function ChicoDumboSpriteSystem() {
  const {
    chico,
    dumbo,
    chicoMessageKey,
    dumboMessageKey,
    scale,
    webglReady,
    applyEvent,
    chicoTx,
    chicoTy,
    dumboTx,
    dumboTy,
    paused,
    togglePause,
    sessionMode,
    activeMascot
  } = useMascotController();
  const { t } = useI18n();
  const { openChat, panelId, isOpenFor } = useMascotChat();
  const { visible: pauseVisible, selectedMascot, showPauseFor } = useMascotPauseControl();
  const chicoBubble = t(chicoMessageKey);
  const dumboBubble = t(dumboMessageKey);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const chicoActive = activeMascot === "chico";
  const dumboActive = activeMascot === "dumbo";

  const chicoDisplay = usePoseSequence(
    chico as ChicoPoseNode,
    getChicoPosePath,
    reducedMotion || paused || chicoActive
  );
  const dumboDisplay = usePoseSequence(
    dumbo as DumboPoseNode,
    getDumboPosePath,
    reducedMotion || paused || dumboActive
  );

  const openChico = () => {
    showPauseFor("chico");
    openChat("chico");
  };

  const openDumbo = () => {
    showPauseFor("dumbo");
    openChat("dumbo");
  };

  const rootStyle: CSSProperties = {
    ["--mascot-scale" as string]: scale,
    ["--mascot-chico-tx" as string]: `${chicoTx}px`,
    ["--mascot-chico-ty" as string]: `${chicoTy}px`,
    ["--mascot-dumbo-tx" as string]: `${dumboTx}px`,
    ["--mascot-dumbo-ty" as string]: `${dumboTy}px`
  };

  useEffect(() => {
    const preload = [
      chicoSprites.idle,
      chicoSprites.stand,
      chicoSprites.alert,
      chicoSprites.sit,
      ...CHICO_WALK_CYCLE.map((k) => chicoSprites[k]),
      dumboSprites.idle,
      dumboSprites.sit,
      dumboSprites.guide,
      dumboSprites.look,
      ...DUMBO_WALK_CYCLE.map((k) => dumboSprites[k])
    ];
    for (const src of preload) {
      const img = new window.Image();
      img.src = src;
    }
  }, []);

  /* QA08-P1-01/P1-03 — hide floating dock while corporate footer occupies viewport */
  useEffect(() => {
    const footer = document.querySelector(".argos-corporate-footer");
    if (!footer) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) document.body.dataset.footerInView = "true";
        else delete document.body.dataset.footerInView;
      },
      { root: null, threshold: 0, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(footer);
    return () => {
      io.disconnect();
      delete document.body.dataset.footerInView;
    };
  }, []);

  return (
    <section
      className={`mascot-root ${webglReady ? "is-webgl-ready" : ""} ${
        sessionMode === "resting" ? "is-session-resting" : ""
      }`}
      style={rootStyle}
      aria-label="Chico y Dumbo"
      data-active-mascot={activeMascot}
    >
      {pauseVisible && (
        <button
          type="button"
          className={`mascot__pause mascot__pause--compact ${
            selectedMascot === "dumbo" ? "mascot__pause--near-dumbo" : "mascot__pause--near-chico"
          }`}
          onClick={() => togglePause()}
          aria-pressed={paused}
          aria-label={paused ? t("mascots.activateMascots") : t("mascots.pauseMascots")}
        >
          {paused ? t("mascots.activateMascots") : t("mascots.pauseMascots")}
        </button>
      )}

      <aside
        className={`mascot mascot--chico ${chicoActive ? "mascot--active" : "mascot--inactive"}`}
      >
        <button
          type="button"
          className="mascot__sprite-button"
          onClick={openChico}
          onKeyDown={(event) => activateLauncherKey(event, openChico)}
          onMouseEnter={() => applyEvent("hover")}
          onMouseLeave={() => applyEvent("idle")}
          aria-label={t("mascots.chicoAria")}
          aria-expanded={isOpenFor("chico")}
          aria-controls={panelId}
          data-mascot-active={chicoActive ? "true" : "false"}
        >
          <Image
            src={chicoSprites[chicoDisplay]}
            alt=""
            aria-hidden="true"
            className={`mascot__img mascot__img--chico mascot__state--${chicoDisplay}`}
            width={232}
            height={232}
            sizes="(max-width: 480px) 112px, (max-width: 860px) 140px, 232px"
            priority
          />
        </button>
        <div className="mascot__bubble mascot__bubble--left" aria-hidden="true">
          {chicoBubble}
        </div>
      </aside>

      <aside
        className={`mascot mascot--dumbo ${dumboActive ? "mascot--active" : "mascot--inactive"}`}
      >
        <div className="mascot__bubble mascot__bubble--right" aria-hidden="true">
          {dumboBubble}
        </div>
        <button
          type="button"
          className="mascot__sprite-button"
          onClick={openDumbo}
          onKeyDown={(event) => activateLauncherKey(event, openDumbo)}
          onMouseEnter={() => applyEvent("hover")}
          onMouseLeave={() => applyEvent("idle")}
          aria-label={t("mascots.dumboAria")}
          aria-expanded={isOpenFor("dumbo")}
          aria-controls={panelId}
          data-mascot-active={dumboActive ? "true" : "false"}
        >
          <Image
            src={dumboSprites[dumboDisplay]}
            alt=""
            aria-hidden="true"
            className={`mascot__img mascot__img--dumbo mascot__state--${dumboDisplay}`}
            width={208}
            height={208}
            sizes="(max-width: 480px) 100px, (max-width: 860px) 124px, 208px"
            priority
          />
        </button>
      </aside>
    </section>
  );
}
