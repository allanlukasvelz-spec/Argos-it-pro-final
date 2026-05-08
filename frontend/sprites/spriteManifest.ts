export type ChicoSpriteState =
  | "idle"
  | "walk_01"
  | "walk_02"
  | "jump"
  | "turn"
  | "sit"
  | "lay"
  | "alert"
  | "sleep";

export type DumboSpriteState =
  | "idle"
  | "walk_01"
  | "walk_02"
  | "jump"
  | "turn"
  | "sit"
  | "lay"
  | "guide"
  | "sleep"
  | "look";

export const chicoSprites: Record<ChicoSpriteState, string> = {
  idle: "/mascots/chico/chico_idle.png",
  walk_01: "/mascots/chico/chico_walk_01.png",
  walk_02: "/mascots/chico/chico_walk_02.png",
  jump: "/mascots/chico/chico_jump.png",
  turn: "/mascots/chico/chico_turn.png",
  sit: "/mascots/chico/chico_sit.png",
  lay: "/mascots/chico/chico_lay.png",
  alert: "/mascots/chico/chico_alert.png",
  sleep: "/mascots/chico/chico_sleep.png"
};

export const dumboSprites: Record<DumboSpriteState, string> = {
  idle: "/mascots/dumbo/dumbo_idle.png",
  walk_01: "/mascots/dumbo/dumbo_walk_01.png",
  walk_02: "/mascots/dumbo/dumbo_walk_02.png",
  jump: "/mascots/dumbo/dumbo_jump.png",
  turn: "/mascots/dumbo/dumbo_turn.png",
  sit: "/mascots/dumbo/dumbo_sit.png",
  lay: "/mascots/dumbo/dumbo_lay.png",
  guide: "/mascots/dumbo/dumbo_guide.png",
  sleep: "/mascots/dumbo/dumbo_sleep.png",
  look: "/mascots/dumbo/dumbo_look.png"
};

export const walkFrames = {
  chico: ["walk_01", "walk_02"] as const,
  dumbo: ["walk_01", "walk_02"] as const
};
