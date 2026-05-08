import type { ChicoSpriteState, DumboSpriteState } from "@/sprites/spriteManifest";

export type MascotEvent =
  | "idle"
  | "hover"
  | "formStart"
  | "formSuccess"
  | "formError"
  | "userInactive"
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

export function resolveMascotState(event: MascotEvent): MascotBrainState {
  switch (event) {
    case "formStart":
      return {
        chico: "alert",
        dumbo: "guide",
        chicoMessageKey: "mascots.messages.formStart.chico",
        dumboMessageKey: "mascots.messages.formStart.dumbo"
      };
    case "formSuccess":
      return {
        chico: "jump",
        dumbo: "jump",
        chicoMessageKey: "mascots.messages.formSuccess.chico",
        dumboMessageKey: "mascots.messages.formSuccess.dumbo"
      };
    case "formError":
      return {
        chico: "alert",
        dumbo: "guide",
        chicoMessageKey: "mascots.messages.formError.chico",
        dumboMessageKey: "mascots.messages.formError.dumbo"
      };
    case "userInactive":
      return {
        chico: "sleep",
        dumbo: "sleep",
        chicoMessageKey: "mascots.messages.inactive.chico",
        dumboMessageKey: "mascots.messages.inactive.dumbo"
      };
    case "cursorNearChico":
      return {
        ...baseState,
        chico: "alert",
        chicoMessageKey: "mascots.messages.cursorNearChico.chico"
      };
    case "cursorNearDumbo":
      return {
        ...baseState,
        dumbo: "look",
        dumboMessageKey: "mascots.messages.cursorNearDumbo.dumbo"
      };
    case "hover":
      return {
        ...baseState,
        chico: "walk_01",
        dumbo: "walk_01"
      };
    case "idle":
    default:
      return baseState;
  }
}
