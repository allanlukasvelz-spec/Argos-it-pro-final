import type { ChicoSpriteState, DumboSpriteState } from "@/sprites/spriteManifest";
import { chicoSprites, dumboSprites } from "@/sprites/spriteManifest";

export type MascotEvent =
  | "idle"
  | "hover"
  | "formStart"
  | "formSuccess"
  | "formError"
  | "cursorNearChico"
  | "cursorNearDumbo";

export type ActiveMascot = "none" | "chico" | "dumbo";

export type MascotBrainState = {
  chico: ChicoSpriteState;
  dumbo: DumboSpriteState;
  chicoMessageKey: string;
  dumboMessageKey: string;
};

/** Production-selectable V1 states only (controller must not pick others). */
export const CHICO_V1_STATES = ["idle", "looking", "stand", "lay", "sleep", "resting"] as const;
export const DUMBO_V1_STATES = ["idle", "looking", "sit", "lay", "sleep", "resting"] as const;

const baseState: MascotBrainState = {
  chico: "idle",
  dumbo: "idle",
  chicoMessageKey: "mascots.messages.idle.chico",
  dumboMessageKey: "mascots.messages.idle.dumbo"
};

/** V1-safe long-idle Chico (LAY / SLEEP). */
export function restingChicoSprite(sessionSeed: number): ChicoSpriteState {
  return sessionSeed % 2 === 0 ? "lay" : "sleep";
}

/** V1-safe long-idle Dumbo (LAY / SLEEP / REST). */
export function restingDumboSprite(sessionSeed: number): DumboSpriteState {
  const m = sessionSeed % 3;
  if (m === 0) return "sleep";
  if (m === 1) return "idle";
  return "resting";
}

/**
 * FASE 21.6B.7B — ONE_ACTIVE chat-open visuals.
 * Chico → STAND; Dumbo → SIT; inactive → REST.
 */
export function chatActiveSprites(
  persona: "chico" | "dumbo"
): Pick<MascotBrainState, "chico" | "dumbo"> {
  if (persona === "dumbo") {
    return { chico: "idle", dumbo: "sit" };
  }
  return { chico: "stand", dumbo: "idle" };
}

/**
 * Form events: neutral LOOK only on the active assistant.
 * ROLE_SEMANTICS_FROZEN = YES (R2 soft)
 * Form visual behavior remains neutral; role affinity does not control motion.
 * No active mascot → both REST (no dual LOOK, no persona auto-select).
 */
export function formEventSprites(
  active: ActiveMascot
): Pick<MascotBrainState, "chico" | "dumbo"> {
  if (active === "chico") return { chico: "looking", dumbo: "idle" };
  if (active === "dumbo") return { chico: "idle", dumbo: "looking" };
  return { chico: "idle", dumbo: "idle" };
}

/**
 * Event map — hover/cursorNear = NONE (no visual).
 * Form messages still resolved; sprite pair applied via formEventSprites in controller.
 */
export function resolveMascotState(event: MascotEvent): MascotBrainState {
  switch (event) {
    case "formStart":
      return {
        ...baseState,
        chicoMessageKey: "mascots.messages.formStart.chico",
        dumboMessageKey: "mascots.messages.formStart.dumbo"
      };
    case "formSuccess":
      return {
        ...baseState,
        chicoMessageKey: "mascots.messages.formSuccess.chico",
        dumboMessageKey: "mascots.messages.formSuccess.dumbo"
      };
    case "formError":
      return {
        ...baseState,
        chicoMessageKey: "mascots.messages.formError.chico",
        dumboMessageKey: "mascots.messages.formError.dumbo"
      };
    case "cursorNearChico":
    case "cursorNearDumbo":
    case "hover":
      return baseState;
    case "idle":
    default:
      return baseState;
  }
}

export function isChicoV1State(state: ChicoSpriteState): boolean {
  return (CHICO_V1_STATES as readonly string[]).includes(state);
}

export function isDumboV1State(state: DumboSpriteState): boolean {
  return (DUMBO_V1_STATES as readonly string[]).includes(state);
}

/** Assert production path only points at V1 assets (not walk/vistacielo/guide…). */
export function productionAssetIsV1(mascot: "chico" | "dumbo", state: string): boolean {
  const src =
    mascot === "chico"
      ? chicoSprites[state as ChicoSpriteState]
      : dumboSprites[state as DumboSpriteState];
  if (!src) return false;
  if (/caminando|corriendo|jugando|guide|olfateando|asustado|turn|vistacielo/i.test(src)) {
    return false;
  }
  return true;
}

export const PROHIBITED_PRODUCTION_SPRITE_SUBSTRINGS = [
  "caminando",
  "corriendo",
  "jugando",
  "guide",
  "olfateando",
  "asustado",
  "turn",
  "vistacielo"
] as const;
