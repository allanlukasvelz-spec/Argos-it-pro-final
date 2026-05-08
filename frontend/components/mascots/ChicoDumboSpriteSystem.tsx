"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { chicoSprites, dumboSprites } from "@/sprites/spriteManifest";
import { useMascotController } from "@/hooks/useMascotController";
import { useMascotSpeech } from "@/speech/useMascotSpeech";
import { useI18n } from "@/i18n/useI18n";

export default function ChicoDumboSpriteSystem() {
  const {
    chico,
    dumbo,
    chicoMessageKey,
    dumboMessageKey,
    scale,
    xOffset,
    webglReady,
    applyEvent
  } = useMascotController();
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const speak = useMascotSpeech();
  const chicoBubble = t(chicoMessageKey);
  const dumboBubble = t(dumboMessageKey);

  return (
    <section
      className={`mascot-root ${webglReady ? "is-webgl-ready" : ""}`}
      style={{ ["--mascot-scale" as string]: scale, ["--mascot-xoffset" as string]: `${xOffset}px` }}
      aria-label="Chico y Dumbo"
    >
      <motion.aside
        className="mascot mascot--chico"
        whileHover={reduceMotion ? undefined : { y: -4 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        onHoverStart={() => applyEvent("hover")}
        onHoverEnd={() => applyEvent("idle")}
      >
        <button
          type="button"
          className="mascot__sprite-button"
          onClick={() => speak(chicoBubble, "chico")}
          aria-label={t("mascots.chicoAria")}
        >
          <Image
            src={chicoSprites[chico]}
            alt={t("mascots.chicoAria")}
            className={`mascot__img mascot__img--chico mascot__state--${chico}`}
            width={232}
            height={232}
            sizes="(max-width: 860px) 140px, 232px"
            quality={70}
            priority={false}
          />
        </button>
        <div className="mascot__bubble mascot__bubble--left">{chicoBubble}</div>
      </motion.aside>

      <motion.aside
        className="mascot mascot--dumbo"
        whileHover={reduceMotion ? undefined : { y: -4 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        onHoverStart={() => applyEvent("hover")}
        onHoverEnd={() => applyEvent("idle")}
      >
        <div className="mascot__bubble mascot__bubble--right">{dumboBubble}</div>
        <button
          type="button"
          className="mascot__sprite-button"
          onClick={() => speak(dumboBubble, "dumbo")}
          aria-label={t("mascots.dumboAria")}
        >
          <Image
            src={dumboSprites[dumbo]}
            alt={t("mascots.dumboAria")}
            className={`mascot__img mascot__img--dumbo mascot__state--${dumbo}`}
            width={208}
            height={208}
            sizes="(max-width: 860px) 124px, 208px"
            quality={70}
            priority={false}
          />
        </button>
      </motion.aside>
    </section>
  );
}
