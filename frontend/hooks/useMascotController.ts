"use client";

/**
 * FASE 21.6B.7B — ONE_ACTIVE + V1 dock enforcement.
 * Autonomous motion remains DISABLED (7A).
 * FASE 21.7A.1 — idle detection is a one-shot activity timeout (no 240ms poll).
 */

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { USER_ACTIVITY_TIMEOUT_MS } from "@/ai/mascotAutonomy";
import { createMascotIdleTimer } from "@/ai/mascotIdleTimer";
import {
  chatActiveSprites,
  formEventSprites,
  resolveMascotState,
  restingChicoSprite,
  restingDumboSprite,
  type ActiveMascot,
  type MascotBrainState,
  type MascotEvent
} from "@/ai/mascotStates";
import { useMascotChat } from "@/components/mascots/MascotChatContext";

export function useMascotController() {
  const [brain, setBrain] = useState<MascotBrainState>(() => resolveMascotState("idle"));
  const [scale, setScale] = useState(1);
  const [paused, setPaused] = useState(false);
  const [webglReady, setWebglReady] = useState(false);
  const [sessionMode, setSessionMode] = useState<"active" | "resting">("active");
  const [chicoTx, setChicoTx] = useState(0);
  const [chicoTy, setChicoTy] = useState(0);
  const [dumboTx, setDumboTx] = useState(0);
  const [dumboTy, setDumboTy] = useState(0);

  const idleTimerRef = useRef<ReturnType<typeof createMascotIdleTimer> | null>(null);
  const prevSessionModeRef = useRef<"active" | "resting">("active");

  const prefersReducedMotion = useReducedMotion();
  const { open: chatOpen, persona: chatPersona } = useMascotChat();

  /** Single ownership: chat open → persona; else NONE. */
  const activeMascot: ActiveMascot = chatOpen ? chatPersona : "none";

  const bumpActivity = useCallback(() => {
    idleTimerRef.current?.bumpActivity();
  }, []);

  const zeroDockMotion = useCallback(() => {
    setChicoTx(0);
    setChicoTy(0);
    setDumboTx(0);
    setDumboTy(0);
  }, []);

  const togglePause = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  const applyEvent = useCallback(
    (event: MascotEvent) => {
      bumpActivity();
      if (
        event === "hover" ||
        event === "cursorNearChico" ||
        event === "cursorNearDumbo" ||
        event === "idle"
      ) {
        // HOVER / near = NONE visual change (7A/7B)
        if (event === "idle" && !chatOpen) {
          setBrain(resolveMascotState("idle"));
        }
        return;
      }

      if (event === "formStart" || event === "formSuccess" || event === "formError") {
        const msgs = resolveMascotState(event);
        const sprites = formEventSprites(activeMascot);
        setBrain({
          ...msgs,
          chico: sprites.chico,
          dumbo: sprites.dumbo
        });
        return;
      }

      setBrain(resolveMascotState(event));
    },
    [bumpActivity, activeMascot, chatOpen]
  );

  /** One-shot idle timeout. Activity listeners unchanged. */
  useEffect(() => {
    const timer = createMascotIdleTimer({
      timeoutMs: USER_ACTIVITY_TIMEOUT_MS,
      onActive: () => setSessionMode("active"),
      onResting: () => setSessionMode("resting")
    });
    idleTimerRef.current = timer;
    timer.bumpActivity();

    const onAct = () => timer.bumpActivity();
    window.addEventListener("scroll", onAct, { passive: true });
    window.addEventListener("click", onAct, true);
    window.addEventListener("keydown", onAct, true);
    window.addEventListener("touchstart", onAct, { passive: true, capture: true });
    document.addEventListener("focusin", onAct, true);
    document.addEventListener("mousemove", onAct, { passive: true });

    return () => {
      window.removeEventListener("scroll", onAct);
      window.removeEventListener("click", onAct, true);
      window.removeEventListener("keydown", onAct, true);
      window.removeEventListener("touchstart", onAct, true);
      document.removeEventListener("mousemove", onAct);
      document.removeEventListener("focusin", onAct, true);
      timer.dispose();
      if (idleTimerRef.current === timer) idleTimerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const syncScale = () => {
      const width = window.innerWidth;
      if (width < 640) setScale(0.56);
      else if (width < 1080) setScale(0.72);
      else setScale(1);
    };
    syncScale();
    window.addEventListener("resize", syncScale);
    return () => window.removeEventListener("resize", syncScale);
  }, []);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
    if (gl) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      setWebglReady(true);
    }
  }, []);

  useEffect(() => {
    const onFormStart = () => applyEvent("formStart");
    const onFormSuccess = () => applyEvent("formSuccess");
    const onFormError = () => applyEvent("formError");
    window.addEventListener("argos:onFormStart", onFormStart);
    window.addEventListener("argos:onFormSuccess", onFormSuccess);
    window.addEventListener("argos:onFormError", onFormError);
    return () => {
      window.removeEventListener("argos:onFormStart", onFormStart);
      window.removeEventListener("argos:onFormSuccess", onFormSuccess);
      window.removeEventListener("argos:onFormError", onFormError);
    };
  }, [applyEvent]);

  /**
   * Chat open/close owns ACTIVE_MASCOT visuals.
   * Open → STAND (chico) / SIT (dumbo); inactive REST.
   * Close → both REST.
   */
  useEffect(() => {
    if (paused) return;
    zeroDockMotion();
    if (chatOpen && chatPersona) {
      const sprites = chatActiveSprites(chatPersona);
      setBrain((prev) => ({
        ...prev,
        chico: sprites.chico,
        dumbo: sprites.dumbo
      }));
      return;
    }
    setBrain((prev) => ({
      ...prev,
      chico: "idle",
      dumbo: "idle"
    }));
  }, [chatOpen, chatPersona, paused, zeroDockMotion]);

  /** prefers-reduced-motion: no translate; keep V1 still frames. */
  useEffect(() => {
    if (prefersReducedMotion !== true) return;
    zeroDockMotion();
  }, [prefersReducedMotion, zeroDockMotion]);

  useEffect(() => {
    if (!paused) return;
    zeroDockMotion();
  }, [paused, zeroDockMotion]);

  /**
   * Long idle → LAY/SLEEP.
   * If chat open: keep active STAND/SIT; only inactive rests.
   * Chat closed: both quiet.
   */
  useEffect(() => {
    const was = prevSessionModeRef.current;
    if (was === sessionMode) return;
    prevSessionModeRef.current = sessionMode;

    if (sessionMode === "resting") {
      zeroDockMotion();
      if (paused) return;
      const seed = Math.floor(Date.now() / 813) % 1000;
      if (chatOpen && chatPersona) {
        const ready = chatActiveSprites(chatPersona);
        setBrain((p) => ({
          ...p,
          chico:
            chatPersona === "chico" ? ready.chico : restingChicoSprite(seed),
          dumbo:
            chatPersona === "dumbo" ? ready.dumbo : restingDumboSprite(seed)
        }));
        return;
      }
      setBrain((p) => ({
        ...p,
        chico: restingChicoSprite(seed),
        dumbo: restingDumboSprite(seed)
      }));
      return;
    }

    if (was === "resting" && !paused) {
      if (chatOpen && chatPersona) {
        const sprites = chatActiveSprites(chatPersona);
        setBrain((p) => ({ ...p, chico: sprites.chico, dumbo: sprites.dumbo }));
      } else {
        setBrain((p) => {
          const i = resolveMascotState("idle");
          return { ...p, chico: i.chico, dumbo: i.dumbo };
        });
      }
    }
  }, [sessionMode, paused, chatOpen, chatPersona, zeroDockMotion]);

  /** Same-render as ACTIVE_MASCOT — avoid one-frame stale idle after switch. */
  const ready = useMemo(() => {
    if (chatOpen && (chatPersona === "chico" || chatPersona === "dumbo")) {
      return chatActiveSprites(chatPersona);
    }
    return null;
  }, [chatOpen, chatPersona]);

  return useMemo(
    () => ({
      chico: ready ? ready.chico : brain.chico,
      dumbo: ready ? ready.dumbo : brain.dumbo,
      chicoMessageKey: brain.chicoMessageKey,
      dumboMessageKey: brain.dumboMessageKey,
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
    }),
    [
      brain,
      ready,
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
    ]
  );
}
