"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useMascotChat } from "@/components/mascots/MascotChatContext";
import { useMascotController } from "@/hooks/useMascotController";
import { useI18n } from "@/i18n/useI18n";
import { chicoSprites, dumboSprites } from "@/sprites/spriteManifest";

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
    sessionMode
  } = useMascotController();
  const { t } = useI18n();
  const { openChat, panelId, isOpenFor } = useMascotChat();
  const chicoBubble = t(chicoMessageKey);
  const dumboBubble = t(dumboMessageKey);

  const rootStyle: CSSProperties = {
    ["--mascot-scale" as string]: scale,
    ["--mascot-chico-tx" as string]: `${chicoTx}px`,
    ["--mascot-chico-ty" as string]: `${chicoTy}px`,
    ["--mascot-dumbo-tx" as string]: `${dumboTx}px`,
    ["--mascot-dumbo-ty" as string]: `${dumboTy}px`
  };

  return (
    <section
      className={`mascot-root ${webglReady ? "is-webgl-ready" : ""} ${
        sessionMode === "resting" ? "is-session-resting" : ""
      }`}
      style={rootStyle}
      aria-label="Chico y Dumbo"
    >
      <button
        type="button"
        className="mascot__pause"
        onClick={() => togglePause()}
        aria-pressed={paused}
        aria-label={paused ? t("mascots.activateMascots") : t("mascots.pauseMascots")}
      >
        {paused ? t("mascots.activateMascots") : t("mascots.pauseMascots")}
      </button>

      <aside className="mascot mascot--chico">
        <button
          type="button"
          className="mascot__sprite-button"
          onClick={() => openChat("chico")}
          onMouseEnter={() => applyEvent("hover")}
          onMouseLeave={() => applyEvent("idle")}
          aria-label={t("mascots.chicoAria")}
          aria-expanded={isOpenFor("chico")}
          aria-controls={panelId}
        >
          <Image
            src={chicoSprites[chico]}
            alt={t("mascots.chicoAria")}
            className={`mascot__img mascot__img--chico mascot__state--${chico}`}
            width={232}
            height={232}
            sizes="(max-width: 860px) 140px, 232px"
            priority
          />
        </button>
        <div className="mascot__bubble mascot__bubble--left">{chicoBubble}</div>
      </aside>

      <aside className="mascot mascot--dumbo">
        <div className="mascot__bubble mascot__bubble--right">{dumboBubble}</div>
        <button
          type="button"
          className="mascot__sprite-button"
          onClick={() => openChat("dumbo")}
          onMouseEnter={() => applyEvent("hover")}
          onMouseLeave={() => applyEvent("idle")}
          aria-label={t("mascots.dumboAria")}
          aria-expanded={isOpenFor("dumbo")}
          aria-controls={panelId}
        >
          <Image
            src={dumboSprites[dumbo]}
            alt={t("mascots.dumboAria")}
            className={`mascot__img mascot__img--dumbo mascot__state--${dumbo}`}
            width={208}
            height={208}
            sizes="(max-width: 860px) 124px, 208px"
            priority
          />
        </button>
      </aside>
    </section>
  );
}
