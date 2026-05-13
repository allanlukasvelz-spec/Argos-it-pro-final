/** Claves legacy: no eliminar — usadas por `explainerScenes.ts` y `ArgosExplainerAnimation.tsx`. */

export type ChicoSpriteState =
  | "idle"
  | "walk_01"
  | "walk_02"
  | "jump"
  | "turn"
  | "sit"
  | "lay"
  | "alert"
  | "sleep"
  | "walking"
  | "guarding"
  | "looking"
  | "sniffing"
  | "playing"
  | "resting"
  /** Semántico: alerta alta en sesión activa (misma base que idle). */
  | "active"
  /** Encuentro con Dumbo. */
  | "meeting"
  /** Reposo dormido explícito. */
  | "sleeping";

export type DumboSpriteState =
  | "idle"
  | "walk_01"
  | "walk_02"
  | "walk_03"
  | "jump"
  | "turn"
  | "sit"
  | "lay"
  | "guide"
  | "sleep"
  | "look"
  | "walking"
  | "guiding"
  | "looking"
  | "waiting"
  | "playing"
  | "surprised"
  | "resting"
  | "active"
  | "meeting";

export const chicoSprites: Record<ChicoSpriteState, string> = {
  idle: "/mascots/chico/chico_esperando2.png",
  walk_01: "/mascots/chico/chico_caminando.png",
  walk_02: "/mascots/chico/chico_corriendo.png",
  jump: "/mascots/chico/chico_corriendofeliz.png",
  turn: "/mascots/chico/chico_olfateando.png",
  sit: "/mascots/chico/chico_esperando2.png",
  lay: "/mascots/chico/chico_reposo.png",
  alert: "/mascots/chico/chico_mirandoatento.png",
  sleep: "/mascots/chico/chico_durmiendo.png",
  walking: "/mascots/chico/chico_caminando.png",
  guarding: "/mascots/chico/chico_mirandoatento.png",
  looking: "/mascots/chico/chico_mirandoatento.png",
  sniffing: "/mascots/chico/chico_olfateando.png",
  playing: "/mascots/chico/chico_corriendofeliz.png",
  resting: "/mascots/chico/chico_reposo.png",
  active: "/mascots/chico/chico_esperando2.png",
  meeting: "/mascots/chico/chico_mirandoatento.png",
  sleeping: "/mascots/chico/chico_durmiendo.png"
};

export const dumboSprites: Record<DumboSpriteState, string> = {
  idle: "/mascots/dumbo/dumbo_frente.png",
  walk_01: "/mascots/dumbo/dumbo_caminando.png",
  walk_02: "/mascots/dumbo/dumbo_caminando_2.png",
  walk_03: "/mascots/dumbo/dumbo_caminando_3.png",
  jump: "/mascots/dumbo/dumbo_corriendofeliz.png",
  turn: "/mascots/dumbo/dumbo_turn.png",
  sit: "/mascots/dumbo/dumbo_sentado_atento.png",
  lay: "/mascots/dumbo/dumbo_relajado.png",
  guide: "/mascots/dumbo/dumbo_guide.png",
  sleep: "/mascots/dumbo/dumbo_durmiendo.png",
  look: "/mascots/dumbo/dumbo_vistacielo.png",
  walking: "/mascots/dumbo/dumbo_caminando.png",
  guiding: "/mascots/dumbo/dumbo_guide.png",
  looking: "/mascots/dumbo/dumbo_esperando_atento.png",
  waiting: "/mascots/dumbo/dumbo_esperando_atento.png",
  playing: "/mascots/dumbo/dumbo_jugando.png",
  surprised: "/mascots/dumbo/dumbo_asustado.png",
  resting: "/mascots/dumbo/dumbo_relajado.png",
  active: "/mascots/dumbo/dumbo_frente.png",
  meeting: "/mascots/dumbo/dumbo_esperando_atento.png"
};

export const walkFrames = {
  chico: ["walk_01", "walk_02"] as const,
  dumbo: ["walk_01", "walk_02", "walk_03"] as const
};
