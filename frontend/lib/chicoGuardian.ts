/**
 * CHICO Security Guardian — Client Portal presentation helpers.
 * States must mirror backend deriveChicoState; never invent HEALTHY from empty.
 */

export const CHICO_STATES = [
  "NORMAL",
  "ATTENTION",
  "CRITICAL",
  "UNKNOWN",
  "VERIFYING",
  "RESOLVED"
] as const;

export type ChicoState = (typeof CHICO_STATES)[number];

export type ChicoGuardianPayload = {
  role?: string;
  state: string;
  label?: string;
  message: string;
  meta?: Record<string, unknown>;
  invariants?: Record<string, boolean>;
};

const SPRITE_BY_STATE: Record<string, string> = {
  NORMAL: "/mascots/chico/chico_esperando2.png",
  ATTENTION: "/mascots/chico/chico_mirandoatento.png",
  CRITICAL: "/mascots/chico/chico_mirandoatento.png",
  UNKNOWN: "/mascots/chico/chico_reposo.png",
  VERIFYING: "/mascots/chico/chico_olfateando.png",
  RESOLVED: "/mascots/chico/chico_esperando.png"
};

const SHAPE_BY_STATE: Record<string, string> = {
  NORMAL: "●",
  ATTENTION: "▲",
  CRITICAL: "◆",
  UNKNOWN: "◌",
  VERIFYING: "…",
  RESOLVED: "✓"
};

export function normalizeChicoState(value: unknown): ChicoState {
  const v = String(value || "").toUpperCase();
  if ((CHICO_STATES as readonly string[]).includes(v)) return v as ChicoState;
  return "UNKNOWN";
}

export function chicoSpriteFor(state: string): string {
  return SPRITE_BY_STATE[normalizeChicoState(state)] || SPRITE_BY_STATE.UNKNOWN;
}

export function chicoShapeFor(state: string): string {
  return SHAPE_BY_STATE[normalizeChicoState(state)] || SHAPE_BY_STATE.UNKNOWN;
}

/** Client-side safety: never upgrade to NORMAL without evidence flags from API. */
export function assertChicoNotFalselyNormal(
  state: string,
  opts: { monitorsEnabled?: number; fresh?: number; openCritical?: number; openIncidents?: number }
): ChicoState {
  const s = normalizeChicoState(state);
  if (s === "NORMAL") {
    if ((opts.openCritical || 0) > 0 || (opts.openIncidents || 0) > 0) return "CRITICAL";
    if ((opts.monitorsEnabled || 0) <= 0 || (opts.fresh || 0) <= 0) return "UNKNOWN";
  }
  if (s === "UNKNOWN") return "UNKNOWN";
  return s;
}
