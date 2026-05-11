"use client";

/**
 * Grabación (OBS / QuickTime): usar ruta dedicada `/explainer` sin header ni mascotas globales.
 * Query opcionales: explainerRecord=1 | explainerManual=1 | explainerAutoMs=8000 | explainerAutoMult=1.5
 * Sprites: mismos PNG y estados que el dock (`sprites/spriteManifest.ts`).
 * Detalle grabación: docs/EXPLAINER_GUION_GRABACION.md
 */

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/useI18n";
import {
  EXPLAINER_SCENE_COUNT,
  explainerSceneDefinitions,
  type ExplainerSceneDefinition
} from "@/src/data/explainerScenes";
import { parseExplainerRecordParams } from "@/src/lib/explainerRecordParams";
import {
  chicoSprites,
  dumboSprites,
  walkFrames,
  type ChicoSpriteState,
  type DumboSpriteState
} from "@/sprites/spriteManifest";

const WALK_MS = 450;
const GUARDIAN_SWITCH_MS = 650;

/** Misma secuencia de paso que los asistentes (`walkFrames.dumbo`). */
const dumboWalkFrameSrcs = walkFrames.dumbo.map((k) => dumboSprites[k]);

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22d3ee]";

function dumboSrc(key: DumboSpriteState | null): string | null {
  if (!key) return null;
  return dumboSprites[key] ?? null;
}

function chicoSrc(key: ChicoSpriteState | null): string | null {
  if (!key) return null;
  return chicoSprites[key] ?? null;
}

type ExplainerLayout = "default" | "fullscreen";

export default function ArgosExplainerAnimation({ layout = "default" }: { layout?: ExplainerLayout }) {
  const { t, get } = useI18n();
  const searchParams = useSearchParams();
  const recordOptions = useMemo(
    () => parseExplainerRecordParams(searchParams),
    [searchParams.toString()]
  );

  const prefersReducedMotion = useReducedMotion();
  const [scene, setScene] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [walkFrame, setWalkFrame] = useState(0);

  const def = explainerSceneDefinitions[scene] as ExplainerSceneDefinition;

  const autoAdvance =
    !prefersReducedMotion && !hoverPaused && !userPaused && !recordOptions.manualOnly;

  const next = useCallback(() => {
    setScene((s) => (s + 1) % EXPLAINER_SCENE_COUNT);
  }, []);

  const prev = useCallback(() => {
    setScene((s) => (s - 1 + EXPLAINER_SCENE_COUNT) % EXPLAINER_SCENE_COUNT);
  }, []);

  useEffect(() => {
    if (!autoAdvance) return;
    const id = window.setInterval(next, recordOptions.autoMs);
    return () => window.clearInterval(id);
  }, [autoAdvance, next, recordOptions.autoMs]);

  useEffect(() => {
    if (!autoAdvance || !def.useDumboWalking || scene !== 0) return;
    const id = window.setInterval(() => {
      setWalkFrame((f) => (f + 1) % dumboWalkFrameSrcs.length);
    }, WALK_MS);
    return () => window.clearInterval(id);
  }, [autoAdvance, def.useDumboWalking, scene]);

  useEffect(() => {
    setWalkFrame(0);
  }, [scene]);

  const transition = prefersReducedMotion
    ? { duration: 0.15 }
    : { type: "spring" as const, stiffness: 320, damping: 28 };

  const dogMotion = prefersReducedMotion
    ? false
    : {
        x: [0, 6, -4, 0] as number[],
        transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const }
      };

  const liveTitle = t(def.titleKey);

  const sectionPad =
    layout === "fullscreen"
      ? "min-h-[calc(100dvh-1.5rem)] px-5 pb-20 pt-12 max-[380px]:pb-24 lg:px-10 lg:pb-24 lg:pt-16"
      : "px-5 pb-36 pt-16 max-[380px]:pb-40 lg:px-8 lg:pb-40 lg:pt-20";

  return (
    <section
      id="dumbo-chico-explainer"
      className={`relative overflow-hidden ${sectionPad}`}
      aria-label={t("home.explainer.eyebrow")}
      onMouseEnter={() => {
        if (!recordOptions.recordMode) setHoverPaused(true);
      }}
      onMouseLeave={() => {
        if (!recordOptions.recordMode) setHoverPaused(false);
      }}
    >
      <span key={scene} className="sr-only" aria-live="polite" aria-atomic="true">
        {t("home.explainer.liveRegion")}: {liveTitle}
      </span>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#030812] via-[#07111f] to-[#0b2840]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(24, 212, 247, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(24, 212, 247, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "52px 52px",
          maskImage: "linear-gradient(to bottom, black 40%, transparent 95%)"
        }}
      />
      <div
        className="pointer-events-none absolute -left-24 top-1/4 h-64 w-64 rounded-full bg-[#18D4F7]/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-1/4 h-56 w-56 rounded-full bg-[#2563eb]/25 blur-3xl"
        aria-hidden
      />

      <div className="relative z-[1] mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <p className="text-sm font-black uppercase tracking-wide text-[#22d3ee]">
            {t("home.explainer.eyebrow")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              className={`rounded-lg border border-white/20 bg-white/[0.08] px-3 py-2 text-xs font-bold text-white backdrop-blur transition hover:border-[#22d3ee]/45 ${focusRing}`}
              aria-pressed={userPaused}
            >
              {userPaused ? t("home.explainer.play") : t("home.explainer.pause")}
            </button>
          </div>
        </div>

        <div
          className="mb-4 flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label={t("home.explainer.stagesAria")}
        >
          {explainerSceneDefinitions.map((d, i) => (
            <button
              key={d.index}
              id={`explainer-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={scene === i}
              aria-controls="explainer-panel"
              onClick={() => setScene(i)}
              className={`h-2.5 rounded-full transition-all ${focusRing} ${
                scene === i ? "w-8 bg-[#22d3ee]" : "w-2.5 bg-white/25 hover:bg-white/40"
              }`}
              aria-label={t(d.tabLabelKey)}
            />
          ))}
        </div>

        <div
          id="explainer-panel"
          role="tabpanel"
          aria-labelledby={`explainer-tab-${scene}`}
          className="relative min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md md:min-h-[460px]"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={scene}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={transition}
              className="flex min-h-[420px] flex-col gap-6 p-6 pb-24 md:min-h-[460px] md:flex-row md:p-8 md:pb-28"
            >
              <ExplainerSceneBody
                def={def}
                t={t}
                get={get}
                prefersReducedMotion={!!prefersReducedMotion}
                dogMotion={dogMotion}
                walkFrame={walkFrame}
              />
            </motion.div>
          </AnimatePresence>

          <div className="pointer-events-auto absolute bottom-4 left-4 right-4 flex justify-between gap-2 md:left-8 md:right-8">
            <button
              type="button"
              onClick={prev}
              className={`rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs font-bold text-white/90 backdrop-blur transition hover:border-[#22d3ee]/40 hover:text-white ${focusRing}`}
            >
              {t("home.explainer.prev")}
            </button>
            <button
              type="button"
              onClick={next}
              className={`rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs font-bold text-white/90 backdrop-blur transition hover:border-[#22d3ee]/40 hover:text-white ${focusRing}`}
            >
              {t("home.explainer.next")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExplainerSceneBody({
  def,
  t,
  get,
  prefersReducedMotion,
  dogMotion,
  walkFrame
}: {
  def: ExplainerSceneDefinition;
  t: (k: string, fb?: string) => string;
  get: <T,>(k: string, fb?: T) => T;
  prefersReducedMotion: boolean;
  dogMotion: false | { x: number[]; transition: object };
  walkFrame: number;
}) {
  const items = def.itemsKey ? get<string[]>(def.itemsKey, []) : [];
  const badges = def.badgesKey ? get<string[]>(def.badgesKey, []) : [];

  const [guardPhase, setGuardPhase] = useState(0);

  useEffect(() => {
    if (!def.chicoGuardianPhases) {
      setGuardPhase(0);
      return;
    }
    setGuardPhase(0);
    if (prefersReducedMotion) return;
    const id = window.setTimeout(() => setGuardPhase(1), GUARDIAN_SWITCH_MS);
    return () => window.clearTimeout(id);
  }, [def.chicoGuardianPhases, def.index, prefersReducedMotion]);

  const chicoGuardSrc = useMemo(() => {
    if (!def.chicoGuardianPhases) return chicoSrc(def.chicoKey);
    const primary = def.chicoKey ? chicoSrc(def.chicoKey) : null;
    const secondary = def.chicoSecondaryKey ? chicoSrc(def.chicoSecondaryKey) : primary;
    return guardPhase === 0 ? primary : secondary ?? primary;
  }, [def.chicoGuardianPhases, def.chicoKey, def.chicoSecondaryKey, guardPhase]);

  const headingId = `explainer-scene-${def.index}-title`;

  return (
    <>
      <div className="flex flex-1 flex-col justify-center gap-4">
        {def.showLogo ? (
          <div className="relative h-12 w-44 shrink-0 md:h-14 md:w-52">
            <Image
              src="/logo-argos-it-header.png"
              alt="ARGOS-IT"
              fill
              className="object-contain object-left"
              sizes="(max-width: 768px) 176px, 208px"
              priority
            />
          </div>
        ) : null}
        <h2 id={headingId} className="text-2xl font-black leading-tight text-slate-50 md:text-3xl">
          {t(def.titleKey)}
        </h2>
        <p className="max-w-xl text-sm leading-7 text-slate-300 md:text-base">{t(def.subtitleKey)}</p>

        {items.length > 0 ? (
          <ul
            className={`mt-1 grid gap-2 sm:grid-cols-2 ${
              def.itemsKey === "home.explainer.problems"
                ? ""
                : def.itemsKey === "home.explainer.solutions"
                  ? ""
                  : ""
            }`}
          >
            {items.map((label) => (
              <li
                key={label}
                className={
                  def.itemsKey === "home.explainer.problems"
                    ? "rounded-lg border border-red-400/20 bg-red-950/25 px-3 py-2 text-xs font-semibold text-red-100/95 shadow-inner"
                    : def.itemsKey === "home.explainer.solutions"
                      ? "rounded-lg border border-cyan-400/25 bg-cyan-950/20 px-3 py-2 text-xs font-semibold text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.12)] transition hover:border-cyan-400/45"
                      : "rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-xs font-semibold text-slate-200 backdrop-blur-sm transition hover:border-cyan-400/25 hover:bg-white/[0.08]"
                }
              >
                {label}
              </li>
            ))}
          </ul>
        ) : null}

        {badges.length > 0 ? (
          <>
            <div className="mt-2 h-1 w-full max-w-md rounded-full bg-gradient-to-r from-transparent via-[#22d3ee]/50 to-transparent" />
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-200"
                >
                  {b}
                </span>
              ))}
            </div>
          </>
        ) : null}

        {def.index === 5 ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contacto"
              className="inline-flex justify-center rounded-xl bg-[#22d3ee] px-6 py-4 text-center font-black text-[#030812] shadow-[0_0_28px_rgba(34,211,238,0.35)] transition hover:bg-[#67e8f9]"
            >
              {t("home.explainer.ctaForm")}
            </Link>
            <Link
              href="/servicios"
              className="inline-flex justify-center rounded-xl border border-white/25 bg-white/[0.06] px-6 py-4 text-center font-bold text-white backdrop-blur transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              {t("home.explainer.ctaServices")}
            </Link>
          </div>
        ) : null}
      </div>

      <SceneMascotsColumn
        def={def}
        prefersReducedMotion={prefersReducedMotion}
        dogMotion={dogMotion}
        walkFrame={walkFrame}
        chicoGuardSrc={chicoGuardSrc}
        t={t}
      />
    </>
  );
}

function SceneMascotsColumn({
  def,
  prefersReducedMotion,
  dogMotion,
  walkFrame,
  chicoGuardSrc,
  t
}: {
  def: ExplainerSceneDefinition;
  prefersReducedMotion: boolean;
  dogMotion: false | { x: number[]; transition: object };
  walkFrame: number;
  chicoGuardSrc: string | null;
  t: (k: string, fb?: string) => string;
}) {
  const primaryDumbo =
    def.useDumboWalking && def.index === 0
      ? dumboWalkFrameSrcs[walkFrame % dumboWalkFrameSrcs.length] ?? null
      : dumboSrc(def.dumboKey);
  const secondaryDumbo = dumboSrc(def.dumboSecondaryKey);

  if (!primaryDumbo && !secondaryDumbo && !chicoGuardSrc) return null;

  if (def.index === 2 && secondaryDumbo) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-end gap-3 md:flex-row md:items-end md:justify-end">
        <motion.div
          className="relative h-40 w-40 sm:h-48 sm:w-48"
          animate={prefersReducedMotion ? undefined : { scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Image
            src={primaryDumbo!}
            alt={t("home.explainer.altDumboGuide")}
            fill
            className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
            sizes="192px"
          />
        </motion.div>
        <motion.div className="relative h-28 w-28 sm:h-36 sm:w-36" animate={dogMotion}>
          <Image
            src={secondaryDumbo}
            alt={t("home.explainer.altDumboFront")}
            fill
            className="object-contain object-bottom opacity-95"
            sizes="144px"
          />
        </motion.div>
      </div>
    );
  }

  if (def.index === 3 && chicoGuardSrc) {
    return (
      <div className="relative flex flex-1 items-end justify-center md:justify-end">
        <motion.div
          className="relative h-48 w-48 sm:h-56 sm:w-56"
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="pointer-events-none absolute inset-[-12%] rounded-full border border-[#22d3ee]/25 bg-[#22d3ee]/5 blur-sm"
            aria-hidden
          />
          <Image
            src={chicoGuardSrc}
            alt={t("home.explainer.altChico")}
            fill
            className="relative z-[1] object-contain object-bottom drop-shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
            sizes="224px"
          />
        </motion.div>
      </div>
    );
  }

  if (def.index === 4) {
    const s1 = chicoSrc(def.chicoKey);
    const s2 = chicoSrc(def.chicoSecondaryKey);
    return (
      <div className="relative flex flex-1 items-end justify-center gap-2 md:justify-end">
        {s1 ? (
          <motion.div className="relative h-40 w-40" animate={dogMotion}>
            <Image
              src={s1}
              alt={t("home.explainer.altChico")}
              fill
              className="object-contain object-bottom"
              sizes="160px"
            />
          </motion.div>
        ) : null}
        {s2 ? (
          <motion.div className="relative hidden h-36 w-36 sm:block" animate={dogMotion}>
            <Image
              src={s2}
              alt={t("home.explainer.altChico")}
              fill
              className="object-contain object-bottom opacity-90"
              sizes="144px"
            />
          </motion.div>
        ) : null}
      </div>
    );
  }

  if (def.index === 5) {
    const ds = dumboSrc(def.dumboKey);
    const cs = chicoSrc(def.chicoKey);
    return (
      <div className="flex flex-1 flex-col items-end justify-end gap-4 sm:flex-row">
        {ds ? (
          <motion.div className="relative h-40 w-36 sm:h-44 sm:w-40" animate={dogMotion}>
            <Image
              src={ds}
              alt={t("home.explainer.altDumbo")}
              fill
              className="object-contain object-bottom"
              sizes="160px"
            />
          </motion.div>
        ) : null}
        {cs ? (
          <motion.div className="relative h-40 w-40 sm:h-48 sm:w-44">
            <Image
              src={cs}
              alt={t("home.explainer.altChico")}
              fill
              className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
              sizes="176px"
            />
          </motion.div>
        ) : null}
      </div>
    );
  }

  if (primaryDumbo) {
    return (
      <div className="relative flex flex-1 items-end justify-center md:justify-end">
        <motion.div className="relative h-44 w-44 sm:h-52 sm:w-52 md:h-56 md:w-56" animate={dogMotion}>
          <Image
            src={primaryDumbo}
            alt={t("home.explainer.altDumbo")}
            fill
            className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
            sizes="224px"
          />
        </motion.div>
      </div>
    );
  }

  return null;
}
