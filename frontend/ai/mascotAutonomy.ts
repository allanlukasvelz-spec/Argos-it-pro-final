/** Límites y constantes para movimiento autónomo del dock Chico/Dumbo (solo cliente). */

export type DockMotionLimits = {
  /** Desplazamiento horizontal Chico (px, ≥0): acerca el sprite hacia el centro. */
  chico: { min: number; max: number };
  /** Desplazamiento horizontal Dumbo (px, ≤0): acerca el sprite hacia el centro. */
  dumbo: { min: number; max: number };
};

/** Umbral usuario “sin actividad” → reposo (ms). */
export const USER_ACTIVITY_TIMEOUT_MS = 30_000;

/** Tras eventos guiados (formulario, hover), sprites de contexto tienen prioridad brevemente. */
export const AUTONOMY_OVERRIDE_GUARD_MS = 14_000;

/** Micro movimiento típico (ty u offset pequeño). */
export const AUTONOMY_MICRO_MS_MIN = 5_000;
export const AUTONOMY_MICRO_MS_MAX = 10_000;

/** Desplazamiento mayor (patrulla tx). */
export const AUTONOMY_MAJOR_MS_MIN = 15_000;
export const AUTONOMY_MAJOR_MS_MAX = 25_000;

/** Encuentro Chico+Dumbo acercándose. */
export const AUTONOMY_MEET_MS_MIN = 25_000;
export const AUTONOMY_MEET_MS_MAX = 45_000;

/** Legado para compatibilidad; patrulla “grande” comparte uso con MAJOR. */
export const AUTONOMY_PATROL_GAP_MS_MIN = AUTONOMY_MAJOR_MS_MIN;
export const AUTONOMY_PATROL_GAP_MS_MAX = AUTONOMY_MAJOR_MS_MAX;

export function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Amplitud conservadora; muy reducida en móvil. */
export function getDockMotionLimits(viewportWidth: number): DockMotionLimits {
  const narrow = viewportWidth < 860;
  const amplitude = narrow ? Math.min(22, 36) : 54;
  return {
    chico: { min: 0, max: amplitude },
    dumbo: { min: -amplitude, max: 0 }
  };
}

/** Posiciones de encuentro (fracción del límite hacia el centro). */
export function getMeetTargets(
  limits: DockMotionLimits,
  factor = 0.82
): { chicoTx: number; dumboTx: number } {
  return {
    chicoTx: limits.chico.max * factor,
    dumboTx: limits.dumbo.min * factor
  };
}

/** Sesgo cuando hay chat abierto: acercamiento moderado sin invadir zona del panel centrado */
export type ChatBias = { persona: "chico" | "dumbo"; open: boolean };

export function withChatBias(
  persona: ChatBias["persona"] | undefined,
  open: boolean,
  base: { chicoTx: number; dumboTx: number },
  limits: DockMotionLimits
): { chicoTx: number; dumboTx: number } {
  if (!open || !persona) return base;
  const out = { ...base };
  if (persona === "dumbo") {
    const nudge = limits.dumbo.min * 0.22;
    out.dumboTx = Math.max(limits.dumbo.min, Math.min(base.dumboTx + nudge, -2));
    out.chicoTx = Math.min(base.chicoTx + limits.chico.max * 0.08, limits.chico.max);
  } else {
    const nudge = limits.chico.max * 0.22;
    out.chicoTx = Math.min(limits.chico.max, Math.max(base.chicoTx + nudge, 2));
    out.dumboTx = Math.max(base.dumboTx - limits.chico.max * 0.08, limits.dumbo.min);
  }
  return out;
}
