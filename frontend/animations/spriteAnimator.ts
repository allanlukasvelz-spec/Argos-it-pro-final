import type { ChicoSpriteState, DumboSpriteState } from "@/sprites/spriteManifest";

type Tickable = ChicoSpriteState | DumboSpriteState;

export function nextWalkFrame<T extends Tickable>(current: T, frameA: T, frameB: T): T {
  return current === frameA ? frameB : frameA;
}

export function shouldLoopWalk(state: Tickable): boolean {
  return state === "walk_01" || state === "walk_02";
}
