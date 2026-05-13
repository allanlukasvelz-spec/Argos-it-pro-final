import type { ChicoSpriteState, DumboSpriteState } from "@/sprites/spriteManifest";
import { walkFrames } from "@/sprites/spriteManifest";

const CHICO_ORDER = walkFrames.chico;
const DUMBO_ORDER = walkFrames.dumbo;

export function shouldLoopChicoWalk(state: ChicoSpriteState): boolean {
  if (state === "walking") return true;
  return (CHICO_ORDER as readonly string[]).includes(state);
}

export function shouldLoopDumboWalk(state: DumboSpriteState): boolean {
  if (state === "walking") return true;
  return (DUMBO_ORDER as readonly string[]).includes(state);
}

export function nextChicoWalkFrame(current: ChicoSpriteState): ChicoSpriteState {
  if (current === "walking") return "walk_01";
  const order = [...CHICO_ORDER] as ChicoSpriteState[];
  const idx = order.indexOf(current);
  if (idx < 0) return "walk_01";
  return order[(idx + 1) % order.length];
}

export function nextDumboWalkFrame(current: DumboSpriteState): DumboSpriteState {
  if (current === "walking") return "walk_01";
  const order = [...DUMBO_ORDER] as DumboSpriteState[];
  const idx = order.indexOf(current);
  if (idx < 0) return "walk_01";
  return order[(idx + 1) % order.length];
}
