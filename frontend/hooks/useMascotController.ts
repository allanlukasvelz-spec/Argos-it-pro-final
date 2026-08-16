"use client";

/**
 * FASE 21.6B.7A — behavior safety.
 * Autonomous ambient / patrol / meet / walk loops DISABLED.
 * Long-idle → LAY/SLEEP kept (quiet, V1-compatible).
 */

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { USER_ACTIVITY_TIMEOUT_MS } from "@/ai/mascotAutonomy";
import {
  chatActiveSprites,
  resolveMascotState,
  restingChicoSprite,
  restingDumboSprite,
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

  const lastActivityAtRef = useRef<number>(typeof performance !== "undefined" ? Date.now() : 0);
  const prevSessionModeRef = useRef<"active" | "resting">("active");

  const prefersReducedMotion = useReducedMotion();
  const { open: chatOpen, persona: chatPersona } = useMascotChat();

  const bumpActivity = useCallback(() => {
    lastActivityAtRef.current = Date.now();
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
      setBrain(resolveMascotState(event));
    },
    [bumpActivity]
  );

  /** KEPT: long-idle timer (30s) → session resting. Does not start walk/patrol. */
  useEffect(() => {
    lastActivityAtRef.current = Date.now();
    const id = window.setInterval(() => {
      const fresh = Date.now() - lastActivityAtRef.current < USER_ACTIVITY_TIMEOUT_MS;
      setSessionMode(fresh ? "active" : "resting");
    }, 240);
    return () => window.clearInterval(id);
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

  /** Activity → lastActivityAt (scroll only resets idle clock; no scroll→state). */
  useEffect(() => {
    const onAct = () => bumpActivity();
    bumpActivity();

    window.addEventListener("scroll", onAct, { passive: true });
    window.addEventListener("click", onAct, true);
    window.addEventListener("keydown", onAct, true);
    window.addEventListener("touchstart", onAct, { passive: true, capture: true });
    document.addEventListener("focusin", onAct, true);

    let lastNearTs = 0;
    const onMove = (ev: MouseEvent) => {
      onAct();
      const now = Date.now();
      const yBand = window.innerHeight - 260;
      if (now - lastNearTs < 450) return;
      if (ev.clientY > yBand && ev.clientX < window.innerWidth * 0.35) {
        lastNearTs = now;
        applyEvent("cursorNearChico");
      } else if (ev.clientY > yBand && ev.clientX > window.innerWidth * 0.65) {
        lastNearTs = now;
        applyEvent("cursorNearDumbo");
      }
    };

    document.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", onAct);
      window.removeEventListener("click", onAct, true);
      window.removeEventListener("keydown", onAct, true);
      window.removeEventListener("touchstart", onAct, true);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("focusin", onAct, true);
    };
  }, [bumpActivity, applyEvent]);

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
   * ASSISTANT_OPEN = ALLOWED → LOOK/REST only.
   * No guiding/guarding. No translate performance.
   */
  useEffect(() => {
    if (!chatOpen || !chatPersona) return;
    if (paused) return;
    const sprites = chatActiveSprites(chatPersona);
    setBrain((prev) => ({
      ...prev,
      chico: sprites.chico,
      dumbo: sprites.dumbo
    }));
  }, [chatOpen, chatPersona, paused]);

  /** prefers-reduced-motion: static dock, no translate performance. */
  useEffect(() => {
    if (prefersReducedMotion !== true) return;
    zeroDockMotion();
    setBrain((prev) => ({
      ...prev,
      chico: "idle",
      dumbo: "idle"
    }));
  }, [prefersReducedMotion, zeroDockMotion]);

  useEffect(() => {
    if (!paused) return;
    zeroDockMotion();
  }, [paused, zeroDockMotion]);

  /**
   * KEPT: long idle → LAY/SLEEP (quiet V1).
   * Return from idle → REST.
   * No GSAP patrol/bob.
   */
  useEffect(() => {
    const was = prevSessionModeRef.current;
    if (was === sessionMode) return;
    prevSessionModeRef.current = sessionMode;

    if (sessionMode === "resting") {
      zeroDockMotion();
      if (paused) return;
      const seed = Math.floor(Date.now() / 813) % 1000;
      setBrain((p) => ({
        ...p,
        chico: restingChicoSprite(seed),
        dumbo: restingDumboSprite(seed)
      }));
      return;
    }

    if (was === "resting" && !paused) {
      setBrain((p) => {
        const i = resolveMascotState("idle");
        return { ...p, chico: i.chico, dumbo: i.dumbo };
      });
    }
  }, [sessionMode, paused, zeroDockMotion]);

  return useMemo(
    () => ({
      chico: brain.chico,
      dumbo: brain.dumbo,
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
      sessionMode
    }),
    [
      brain,
      scale,
      webglReady,
      applyEvent,
      chicoTx,
      chicoTy,
      dumboTx,
      dumboTy,
      paused,
      togglePause,
      sessionMode
    ]
  );
}
