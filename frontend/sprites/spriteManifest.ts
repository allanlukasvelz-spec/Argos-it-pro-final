/** Claves legacy: no eliminar — usadas por `explainerScenes.ts` y `ArgosExplainerAnimation.tsx`. */

export type ChicoSpriteState =
  | "idle"
  | "stand"
  | "sit"
  | "walk_01"
  | "walk_02"
  | "jump"
  | "turn"
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
  stand: "/mascots/chico/chico_esperando.png",
  sit: "/mascots/chico/chico_sit.png",
  walk_01: "/mascots/chico/chico_walk_01.jpg",
  walk_02: "/mascots/chico/chico_caminando.png",
  jump: "/mascots/chico/chico_jump.jpg",
  turn: "/mascots/chico/chico_turn.jpg",
  lay: "/mascots/chico/chico_lay.jpg",
  alert: "/mascots/chico/chico_alert.png",
  sleep: "/mascots/chico/chico_sleep.jpg",
  walking: "/mascots/chico/chico_walk_01.jpg",
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
  walk_01: "/mascots/dumbo/dumbo_walk_01.jpg",
  walk_02: "/mascots/dumbo/dumbo_caminando_2.png",
  walk_03: "/mascots/dumbo/dumbo_caminando_3.png",
  jump: "/mascots/dumbo/dumbo_jump.jpg",
  turn: "/mascots/dumbo/dumbo_turn.png",
  sit: "/mascots/dumbo/dumbo_sentado_atento.png",
  lay: "/mascots/dumbo/dumbo_lay.jpg",
  guide: "/mascots/dumbo/dumbo_guide.png",
  sleep: "/mascots/dumbo/dumbo_sleep.jpg",
  look: "/mascots/dumbo/dumbo_look.jpg",
  walking: "/mascots/dumbo/dumbo_walk_01.jpg",
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
