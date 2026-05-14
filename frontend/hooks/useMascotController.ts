"use client";

import { useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AUTONOMY_MAJOR_MS_MAX,
  AUTONOMY_MAJOR_MS_MIN,
  AUTONOMY_MEET_MS_MAX,
  AUTONOMY_MEET_MS_MIN,
  AUTONOMY_MICRO_MS_MAX,
  AUTONOMY_MICRO_MS_MIN,
  AUTONOMY_OVERRIDE_GUARD_MS,
  getDockMotionLimits,
  getMeetTargets,
  randBetween,
  USER_ACTIVITY_TIMEOUT_MS,
  withChatBias
} from "@/ai/mascotAutonomy";
import {
  chatActiveSprites,
  meetSprites,
  nextAmbientSprites,
  playSprites,
  resolveMascotState,
  restingChicoSprite,
  restingDumboSprite,
  type MascotBrainState,
  type MascotEvent
} from "@/ai/mascotStates";
import {
  nextChicoWalkFrame,
  nextDumboWalkFrame,
  shouldLoopChicoWalk,
  shouldLoopDumboWalk
} from "@/animations/spriteAnimator";
import { useMascotChat } from "@/components/mascots/MascotChatContext";

type Motion = { chicoTx: number; dumboTx: number; chicoTy: number; dumboTy: number };

export function useMascotController() {
  const [brain, setBrain] = useState<MascotBrainState>(() => resolveMascotState("idle"));
  const [scale, setScale] = useState(1);
  const [paused, setPaused] = useState(false);
  const [webglReady, setWebglReady] = useState(false);
  const [sessionMode, setSessionMode] = useState<"active" | "resting">("active");
  const [tabVisible, setTabVisible] = useState(true);
  const [chicoTx, setChicoTx] = useState(0);
  const [chicoTy, setChicoTy] = useState(0);
  const [dumboTx, setDumboTx] = useState(0);
  const [dumboTy, setDumboTy] = useState(0);
  const [visibilityEpoch, setVisibilityEpoch] = useState(0);

  const lastActivityAtRef = useRef<number>(typeof performance !== "undefined" ? Date.now() : 0);
  const prevSessionModeRef = useRef<"active" | "resting">("active");
  const overrideUntilRef = useRef(0);
  const motionRef = useRef<Motion>({ chicoTx: 0, dumboTx: 0, chicoTy: 0, dumboTy: 0 });
  const ambientIxRef = useRef(0);

  const walkTimer = useRef<number | null>(null);
  const microTimeoutRef = useRef<number | null>(null);
  const majorTimeoutRef = useRef<number | null>(null);
  const meetTimeoutRef = useRef<number | null>(null);
  const ambientIntervalRef = useRef<number | null>(null);

  const prefersReducedMotion = useReducedMotion();
  const { open: chatOpen, persona: chatPersona } = useMascotChat();

  const bumpActivity = useCallback(() => {
    lastActivityAtRef.current = Date.now();
  }, []);

  const flushMotion = useCallback(() => {
    const m = motionRef.current;
    setChicoTx(m.chicoTx);
    setChicoTy(m.chicoTy);
    setDumboTx(m.dumboTx);
    setDumboTy(m.dumboTy);
  }, []);

  const killDockTweens = useCallback(() => {
    gsap.killTweensOf(motionRef.current);
  }, []);

  const clearAllSchedulers = useCallback(() => {
    if (microTimeoutRef.current !== null) {
      window.clearTimeout(microTimeoutRef.current);
      microTimeoutRef.current = null;
    }
    if (majorTimeoutRef.current !== null) {
      window.clearTimeout(majorTimeoutRef.current);
      majorTimeoutRef.current = null;
    }
    if (meetTimeoutRef.current !== null) {
      window.clearTimeout(meetTimeoutRef.current);
      meetTimeoutRef.current = null;
    }
    if (ambientIntervalRef.current !== null) {
      window.clearInterval(ambientIntervalRef.current);
      ambientIntervalRef.current = null;
    }
  }, []);

  const motionAllowed =
    !paused &&
    prefersReducedMotion !== true &&
    sessionMode === "active" &&
    tabVisible &&
    (typeof document === "undefined" || document.visibilityState === "visible");

  const togglePause = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  const applyEvent = useCallback(
    (event: MascotEvent) => {
      bumpActivity();
      overrideUntilRef.current = Date.now() + AUTONOMY_OVERRIDE_GUARD_MS;
      setBrain(resolveMascotState(event));
    },
    [bumpActivity]
  );

  /** Sesión usuario: <30 s actividad → active */
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

  /** Actividad del usuario → lastActivityAt */
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

    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);

    const onVisibilityEpoch = () => setVisibilityEpoch((n) => n + 1);
    document.addEventListener("visibilitychange", onVisibilityEpoch);

    return () => {
      window.removeEventListener("scroll", onAct);
      window.removeEventListener("click", onAct, true);
      window.removeEventListener("keydown", onAct, true);
      window.removeEventListener("touchstart", onAct, true);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("focusin", onAct, true);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("visibilitychange", onVisibilityEpoch);
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

  /** Ciclo de pasos al caminar cuando la sesión está activa */
  useEffect(() => {
    const shouldTickWalk =
      !paused &&
      sessionMode === "active" &&
      prefersReducedMotion !== true &&
      tabVisible;

    if (walkTimer.current) window.clearInterval(walkTimer.current);
    walkTimer.current = window.setInterval(() => {
      if (!shouldTickWalk) return;
      setBrain((prev) => ({
        ...prev,
        chico: shouldLoopChicoWalk(prev.chico) ? nextChicoWalkFrame(prev.chico) : prev.chico,
        dumbo: shouldLoopDumboWalk(prev.dumbo) ? nextDumboWalkFrame(prev.dumbo) : prev.dumbo
      }));
    }, 380);

    return () => {
      if (walkTimer.current) window.clearInterval(walkTimer.current);
    };
  }, [paused, sessionMode, prefersReducedMotion, tabVisible]);

  /** prefers-reduced-motion */
  useEffect(() => {
    if (prefersReducedMotion !== true || paused) return;
    killDockTweens();
    clearAllSchedulers();
    gsap.to(motionRef.current, {
      chicoTx: 0,
      dumboTx: 0,
      chicoTy: 0,
      dumboTy: 0,
      duration: 0.45,
      ease: "sine.out",
      onUpdate: flushMotion,
      onComplete: flushMotion
    });
    setBrain((prev) => ({
      ...prev,
      chico: restingChicoSprite(Math.floor(Date.now() / 1000)),
      dumbo: "idle"
    }));
  }, [paused, prefersReducedMotion, clearAllSchedulers, killDockTweens, flushMotion]);

  useEffect(() => {
    if (!paused) return;
    killDockTweens();
    clearAllSchedulers();
  }, [paused, killDockTweens, clearAllSchedulers]);

  /** Transición active ⇄ resting (30 s sin actividad) */
  useEffect(() => {
    const was = prevSessionModeRef.current;
    if (was === sessionMode) return;
    prevSessionModeRef.current = sessionMode;

    if (sessionMode === "resting") {
      if (paused || prefersReducedMotion === true) return;

      killDockTweens();
      clearAllSchedulers();

      gsap.to(motionRef.current, {
        chicoTx: 0,
        dumboTx: 0,
        chicoTy: 0,
        dumboTy: 0,
        duration: 0.95,
        ease: "sine.out",
        onUpdate: flushMotion,
        onComplete: flushMotion
      });

      const seed = Math.floor(Date.now() / 813) % 1000;
      setBrain((p) => ({
        ...p,
        chico: restingChicoSprite(seed),
        dumbo: restingDumboSprite(seed)
      }));
      return;
    }

    /** De resting → active */
    if (was === "resting" && !paused && prefersReducedMotion !== true) {
      if (!(Date.now() < overrideUntilRef.current)) {
        setBrain((p) => {
          const i = resolveMascotState("idle");
          return { ...p, chico: i.chico, dumbo: i.dumbo };
        });
      }
    }
  }, [
    sessionMode,
    paused,
    prefersReducedMotion,
    killDockTweens,
    clearAllSchedulers,
    flushMotion
  ]);

  /** Autonomía: micro ~5–10 s, mayor ~15–25 s, encuentros ~25–45 s */
  useEffect(() => {
    if (!motionAllowed) {
      killDockTweens();
      clearAllSchedulers();
      return () => {};
    }

    const motionAllowedRef = { current: true };
    motionAllowedRef.current = true;

    const applyAmbientSprites = () => {
      setBrain((prev) => {
        if (Date.now() < overrideUntilRef.current) return prev;
        if (chatOpen) {
          const p = chatActiveSprites(chatPersona);
          return { ...prev, chico: p.chico, dumbo: p.dumbo };
        }
        const amb = nextAmbientSprites(ambientIxRef.current);
        ambientIxRef.current += 1;
        return { ...prev, chico: amb.chico, dumbo: amb.dumbo };
      });
    };

    const scheduleMicro = () => {
      if (microTimeoutRef.current !== null) window.clearTimeout(microTimeoutRef.current);
      microTimeoutRef.current = window.setTimeout(() => {
        microTimeoutRef.current = null;
        if (!motionAllowedRef.current) return;

        gsap.to(motionRef.current, {
          chicoTy: randBetween(-1.75, 1.75),
          dumboTy: randBetween(-1.75, 1.75),
          duration: randBetween(1.8, 2.9),
          ease: "sine.inOut",
          yoyo: true,
          repeat: 1,
          onUpdate: flushMotion,
          onComplete: () => {
            gsap.to(motionRef.current, {
              chicoTy: 0,
              dumboTy: 0,
              duration: 0.55,
              ease: "sine.out",
              onUpdate: flushMotion,
              onComplete: flushMotion
            });
          }
        });
        scheduleMicro();
      }, randBetween(AUTONOMY_MICRO_MS_MIN, AUTONOMY_MICRO_MS_MAX));
    };

    const runMajorPatrol = () => {
      if (document.visibilityState !== "visible") return;
      const L = getDockMotionLimits(window.innerWidth);
      let chTx = randBetween(L.chico.min + 2, L.chico.max);
      let dbTx = randBetween(L.dumbo.min, L.dumbo.max - 2);
      ({ chicoTx: chTx, dumboTx: dbTx } = withChatBias(chatPersona, chatOpen, {
        chicoTx: chTx,
        dumboTx: dbTx
      }, L));
      gsap.to(motionRef.current, {
        chicoTx: chTx,
        dumboTx: dbTx,
        duration: randBetween(5, 9),
        ease: "sine.inOut",
        onUpdate: flushMotion,
        onComplete: flushMotion
      });
      if (!(Date.now() < overrideUntilRef.current) && !chatOpen) {
        ambientIxRef.current += 1;
        const amb = nextAmbientSprites(ambientIxRef.current);
        setBrain((prev) => ({ ...prev, chico: amb.chico, dumbo: amb.dumbo }));
      } else if (chatOpen) {
        const cp = chatActiveSprites(chatPersona);
        setBrain((prev) => ({ ...prev, chico: cp.chico, dumbo: cp.dumbo }));
      }
    };

    const scheduleMajor = () => {
      if (majorTimeoutRef.current !== null) window.clearTimeout(majorTimeoutRef.current);
      majorTimeoutRef.current = window.setTimeout(() => {
        majorTimeoutRef.current = null;
        if (!motionAllowedRef.current || document.visibilityState !== "visible") {
          scheduleMajor();
          return;
        }
        if (Date.now() < overrideUntilRef.current) {
          scheduleMajor();
          return;
        }
        runMajorPatrol();
        scheduleMajor();
      }, randBetween(AUTONOMY_MAJOR_MS_MIN, AUTONOMY_MAJOR_MS_MAX));
    };

    const scheduleMeet = () => {
      if (meetTimeoutRef.current !== null) window.clearTimeout(meetTimeoutRef.current);
      meetTimeoutRef.current = window.setTimeout(() => {
        meetTimeoutRef.current = null;
        if (!motionAllowedRef.current || document.visibilityState !== "visible") {
          scheduleMeet();
          return;
        }
        if (Date.now() < overrideUntilRef.current) {
          scheduleMeet();
          return;
        }

        killDockTweens();
        const L = getDockMotionLimits(window.innerWidth);
        let { chicoTx: meetCx, dumboTx: meetDx } = getMeetTargets(L, 0.78);
        const biased = withChatBias(chatPersona, chatOpen, { chicoTx: meetCx, dumboTx: meetDx }, L);
        meetCx = biased.chicoTx;
        meetDx = biased.dumboTx;

        const tl = gsap.timeline({
          onComplete: () => {
            flushMotion();
            scheduleMeet();
          }
        });
        tl.to(motionRef.current, {
          chicoTx: meetCx,
          dumboTx: meetDx,
          duration: 2,
          ease: "power2.inOut",
          onUpdate: flushMotion
        });
        tl.add(() => {
          const m = meetSprites();
          setBrain((prev) => ({ ...prev, chico: m.chico, dumbo: m.dumbo }));
        });
        tl.to({}, { duration: 1.1 });
        tl.add(() => {
          const p = playSprites();
          setBrain((prev) => ({ ...prev, chico: p.chico, dumbo: p.dumbo }));
        });
        tl.to({}, { duration: 2 });
        tl.add(() => {
          setBrain((prev) => {
            const idle = resolveMascotState("idle");
            return {
              ...idle,
              chicoMessageKey: prev.chicoMessageKey,
              dumboMessageKey: prev.dumboMessageKey
            };
          });
        });
        tl.to(motionRef.current, {
          chicoTx: 0,
          dumboTx: 0,
          chicoTy: 0,
          dumboTy: 0,
          duration: 2,
          ease: "sine.inOut",
          onUpdate: flushMotion
        });
      }, randBetween(AUTONOMY_MEET_MS_MIN, AUTONOMY_MEET_MS_MAX));
    };

    ambientIntervalRef.current = window.setInterval(
      applyAmbientSprites,
      randBetween(7000, 10000)
    );

    runMajorPatrol();
    scheduleMicro();
    scheduleMajor();
    scheduleMeet();

    return () => {
      motionAllowedRef.current = false;
      clearAllSchedulers();
      killDockTweens();
    };
  }, [
    motionAllowed,
    chatOpen,
    chatPersona,
    clearAllSchedulers,
    killDockTweens,
    flushMotion,
    visibilityEpoch
  ]);

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
