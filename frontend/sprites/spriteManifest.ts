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
  idle: "/mascots/chico/chico_esperando2.png",
  walk_01: "/mascots/chico/chico_caminando.png",
  walk_02: "/mascots/chico/chico_corriendo.png",
  jump: "/mascots/chico/chico_corriendofeliz.png",
  turn: "/mascots/chico/chico_olfateando.png",
  sit: "/mascots/chico/chico_esperando2.png",
  lay: "/mascots/chico/chico_reposo.png",
  alert: "/mascots/chico/chico_mirandoatento.png",
  sleep: "/mascots/chico/chico_durmiendo.png"
};

export const dumboSprites: Record<DumboSpriteState, string> = {
  idle: "/mascots/dumbo/dumbo_frente.png",
  walk_01: "/mascots/dumbo/dumbo_caminando.png",
  walk_02: "/mascots/dumbo/dumbo_caminando_2.png",
  jump: "/mascots/dumbo/dumbo_corriendofeliz.png",
  turn: "/mascots/dumbo/dumbo_turn.png",
  sit: "/mascots/dumbo/dumbo_sentado_atento.png",
  lay: "/mascots/dumbo/dumbo_relajado.png",
  guide: "/mascots/dumbo/dumbo_guide.png",
  sleep: "/mascots/dumbo/dumbo_durmiendo.png",
  look: "/mascots/dumbo/dumbo_vistacielo.png"
};

export const walkFrames = {
  chico: ["walk_01", "walk_02"] as const,
  dumbo: ["walk_01", "walk_02"] as const
};
