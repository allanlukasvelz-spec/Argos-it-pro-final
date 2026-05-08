"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { resolveMascotState, type MascotEvent } from "@/ai/mascotStates";
import { nextWalkFrame, shouldLoopWalk } from "@/animations/spriteAnimator";
import type { ChicoSpriteState, DumboSpriteState } from "@/sprites/spriteManifest";

type MascotState = {
  chico: ChicoSpriteState;
  dumbo: DumboSpriteState;
  chicoMessageKey: string;
  dumboMessageKey: string;
};

export function useMascotController() {
  const [state, setState] = useState<MascotState>(() => resolveMascotState("idle"));
  const [scale, setScale] = useState(1);
  const [xOffset, setXOffset] = useState(0);
  const [webglReady, setWebglReady] = useState(false);
  const roam = useRef<gsap.core.Tween | null>(null);
  const walkTimer = useRef<number | null>(null);
  const idleTimer = useRef<number | null>(null);

  const applyEvent = useCallback((event: MascotEvent) => {
    setState(resolveMascotState(event));
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
    // Activate a lightweight webgl context as compositing hint.
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
    if (gl) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      setWebglReady(true);
    }
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    roam.current?.kill();
    roam.current = gsap.to(
      { value: -48 },
      {
        value: 48,
        duration: 9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        onUpdate() {
          setXOffset((this.targets()[0] as { value: number }).value);
        }
      }
    );
    return () => {
      roam.current?.kill();
    };
  }, []);

  const resetInactive = useCallback(() => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => applyEvent("userInactive"), 25000);
  }, [applyEvent]);

  useEffect(() => {
    const onActivity = () => {
      applyEvent("idle");
      resetInactive();
    };
    const onMove = (ev: MouseEvent) => {
      const yBand = window.innerHeight - 260;
      if (ev.clientY > yBand && ev.clientX < window.innerWidth * 0.35) applyEvent("cursorNearChico");
      else if (ev.clientY > yBand && ev.clientX > window.innerWidth * 0.65) applyEvent("cursorNearDumbo");
      else onActivity();
    };
    const onFormStart = () => applyEvent("formStart");
    const onFormSuccess = () => applyEvent("formSuccess");
    const onFormError = () => applyEvent("formError");

    document.addEventListener("mousemove", onMove);
    document.addEventListener("keydown", onActivity);
    document.addEventListener("touchstart", onActivity, { passive: true });
    window.addEventListener("argos:onFormStart", onFormStart);
    window.addEventListener("argos:onFormSuccess", onFormSuccess);
    window.addEventListener("argos:onFormError", onFormError);
    resetInactive();

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("keydown", onActivity);
      document.removeEventListener("touchstart", onActivity);
      window.removeEventListener("argos:onFormStart", onFormStart);
      window.removeEventListener("argos:onFormSuccess", onFormSuccess);
      window.removeEventListener("argos:onFormError", onFormError);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [applyEvent, resetInactive]);

  useEffect(() => {
    if (walkTimer.current) window.clearInterval(walkTimer.current);
    walkTimer.current = window.setInterval(() => {
      setState((prev) => ({
        ...prev,
        chico: shouldLoopWalk(prev.chico)
          ? nextWalkFrame(prev.chico, "walk_01", "walk_02")
          : prev.chico,
        dumbo: shouldLoopWalk(prev.dumbo)
          ? nextWalkFrame(prev.dumbo, "walk_01", "walk_02")
          : prev.dumbo
      }));
    }, 380);
    return () => {
      if (walkTimer.current) window.clearInterval(walkTimer.current);
    };
  }, []);

  return useMemo(() => ({
    ...state,
    scale,
    xOffset,
    webglReady,
    applyEvent
  }), [state, scale, xOffset, webglReady, applyEvent]);
}
