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

export function restingChicoSprite(sessionSeed: number): ChicoSpriteState {
  return sessionSeed % 2 === 0 ? "lay" : "sleep";
}

export function restingDumboSprite(sessionSeed: number): DumboSpriteState {
  const m = sessionSeed % 3;
  if (m === 0) return "looking";
  if (m === 1) return "idle";
  return "resting";
}

/** Sprites cuando el usuario está activo pero la autonomía rota comportamientos. */
export function nextAmbientSprites(
  step: number
): Pick<MascotBrainState, "chico" | "dumbo"> {
  const phases: Array<Pick<MascotBrainState, "chico" | "dumbo">> = [
    { chico: "active", dumbo: "active" },
    { chico: "idle", dumbo: "idle" },
    { chico: "walking", dumbo: "walking" },
    { chico: "looking", dumbo: "guiding" },
    { chico: "sniffing", dumbo: "looking" },
    { chico: "walking", dumbo: "walking" },
    { chico: "guarding", dumbo: "idle" },
    { chico: "idle", dumbo: "walking" },
    { chico: "walking", dumbo: "looking" }
  ];
  return phases[step % phases.length];
}

/** Chat abierto durante sesión activa: enfasis por persona sin bloquear desplazamiento. */
export function chatActiveSprites(persona: "chico" | "dumbo"): Pick<MascotBrainState, "chico" | "dumbo"> {
  if (persona === "dumbo") {
    return { chico: "idle", dumbo: "guiding" };
  }
  return { chico: "guarding", dumbo: "idle" };
}

export function meetSprites(): Pick<MascotBrainState, "chico" | "dumbo"> {
  return { chico: "meeting", dumbo: "meeting" };
}

export function playSprites(): Pick<MascotBrainState, "chico" | "dumbo"> {
  return { chico: "playing", dumbo: "playing" };
}

export function resolveMascotState(event: MascotEvent): MascotBrainState {
  switch (event) {
    case "formStart":
      return {
        chico: "guarding",
        dumbo: "guiding",
        chicoMessageKey: "mascots.messages.formStart.chico",
        dumboMessageKey: "mascots.messages.formStart.dumbo"
      };
    case "formSuccess":
      return {
        chico: "playing",
        dumbo: "playing",
        chicoMessageKey: "mascots.messages.formSuccess.chico",
        dumboMessageKey: "mascots.messages.formSuccess.dumbo"
      };
    case "formError":
      return {
        chico: "guarding",
        dumbo: "guiding",
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
        dumbo: "waiting",
        dumboMessageKey: "mascots.messages.cursorNearDumbo.dumbo"
      };
    case "hover":
      return {
        ...baseState,
        chico: "walking",
        dumbo: "walking"
      };
    case "idle":
    default:
      return baseState;
  }
}
