"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useMascotChat } from "@/components/mascots/MascotChatContext";
import { useMascotPauseControl } from "@/components/mascots/MascotPauseControlContext";
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
  const { visible: pauseVisible, selectedMascot, showPauseFor } = useMascotPauseControl();
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

      <aside className="mascot mascot--chico">
        <button
          type="button"
          className="mascot__sprite-button"
          onClick={() => {
            showPauseFor("chico");
            openChat("chico");
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            showPauseFor("chico");
          }}
          onMouseEnter={() => applyEvent("hover")}
          onMouseLeave={() => applyEvent("idle")}
          aria-label={t("mascots.chicoAria")}
          aria-expanded={isOpenFor("chico")}
          aria-controls={panelId}
        >
          <Image
            src={chicoSprites[chico]}
            alt=""
            className={`mascot__img mascot__img--chico mascot__state--${chico}`}
            width={232}
            height={232}
            sizes="(max-width: 860px) 140px, 232px"
            priority
          />
        </button>
        <div className="mascot__bubble mascot__bubble--left" onClick={(e) => e.stopPropagation()}>
          {chicoBubble}
        </div>
      </aside>

      <aside className="mascot mascot--dumbo">
        <div className="mascot__bubble mascot__bubble--right" onClick={(e) => e.stopPropagation()} role="presentation">
          {dumboBubble}
        </div>
        <button
          type="button"
          className="mascot__sprite-button"
          onClick={() => {
            showPauseFor("dumbo");
            openChat("dumbo");
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            showPauseFor("dumbo");
          }}
          onMouseEnter={() => applyEvent("hover")}
          onMouseLeave={() => applyEvent("idle")}
          aria-label={t("mascots.dumboAria")}
          aria-expanded={isOpenFor("dumbo")}
          aria-controls={panelId}
        >
          <Image
            src={dumboSprites[dumbo]}
            alt=""
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
