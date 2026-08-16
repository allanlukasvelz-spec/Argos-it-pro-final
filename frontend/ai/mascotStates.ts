import type { ChicoSpriteState, DumboSpriteState } from "@/sprites/spriteManifest";

export type MascotEvent =
  | "idle"
  | "hover"
  | "formStart"
  | "formSuccess"
  | "formError"
  | "cursorNearChico"
  | "cursorNearDumbo";

export type MascotBrainState = {
  chico: ChicoSpriteState;
  dumbo: DumboSpriteState;
  chicoMessageKey: string;
  dumboMessageKey: string;
};

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

/** V1-safe long-idle Dumbo (LOOK / REST / LAY alias). */
export function restingDumboSprite(sessionSeed: number): DumboSpriteState {
  const m = sessionSeed % 3;
  if (m === 0) return "looking";
  if (m === 1) return "idle";
  return "resting";
}

/**
 * FASE 21.6B.7A — ambient rotation DISABLED (unreachable from controller).
 * Kept as idle-only stub so accidental callers cannot revive WALK.
 */
export function nextAmbientSprites(
  _step: number
): Pick<MascotBrainState, "chico" | "dumbo"> {
  return { chico: "idle", dumbo: "idle" };
}

/** Chat open: conservative V1 visuals (LOOK / REST). No guiding/guarding. */
export function chatActiveSprites(
  persona: "chico" | "dumbo"
): Pick<MascotBrainState, "chico" | "dumbo"> {
  if (persona === "dumbo") {
    return { chico: "idle", dumbo: "looking" };
  }
  return { chico: "looking", dumbo: "idle" };
}

/** Meet autonomy DISABLED — idle stub. */
export function meetSprites(): Pick<MascotBrainState, "chico" | "dumbo"> {
  return { chico: "idle", dumbo: "idle" };
}

/** Play autonomy DISABLED — idle stub. */
export function playSprites(): Pick<MascotBrainState, "chico" | "dumbo"> {
  return { chico: "idle", dumbo: "idle" };
}

/**
 * FASE 21.6B.7A event map — USER_INTENT_FIRST, no WALK/PLAY/JUMP.
 * ROLE_SEMANTICS_FROZEN = NO → form/chat use neutral LOOK/REST only.
 */
export function resolveMascotState(event: MascotEvent): MascotBrainState {
  switch (event) {
    case "formStart":
      return {
        chico: "looking",
        dumbo: "looking",
        chicoMessageKey: "mascots.messages.formStart.chico",
        dumboMessageKey: "mascots.messages.formStart.dumbo"
      };
    case "formSuccess":
      return {
        chico: "looking",
        dumbo: "looking",
        chicoMessageKey: "mascots.messages.formSuccess.chico",
        dumboMessageKey: "mascots.messages.formSuccess.dumbo"
      };
    case "formError":
      return {
        chico: "looking",
        dumbo: "looking",
        chicoMessageKey: "mascots.messages.formError.chico",
        dumboMessageKey: "mascots.messages.formError.dumbo"
      };
    case "cursorNearChico":
      return {
        ...baseState,
        chico: "looking",
        chicoMessageKey: "mascots.messages.cursorNearChico.chico"
      };
    case "cursorNearDumbo":
      return {
        ...baseState,
        dumbo: "looking",
        dumboMessageKey: "mascots.messages.cursorNearDumbo.dumbo"
      };
    case "hover":
      // HOVER_MASCOT_MOTION = NONE (7A) — must not trigger WALK
      return baseState;
    case "idle":
    default:
      return baseState;
  }
}

/** States that must never be selected by production event/autonomy paths after 7A. */
export const PROHIBITED_PRODUCTION_SPRITE_SUBSTRINGS = [
  "caminando",
  "corriendo",
  "jugando",
  "guide",
  "olfateando",
  "asustado",
  "turn"
] as const;
