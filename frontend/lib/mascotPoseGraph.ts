/**
 * VI-06 — Approved mascot pose transition graph.
 * Transitions are DIRECT_SAFE, INTERMEDIATE_REQUIRED, or UNSAFE.
 * No random swapping; controller resolves paths through this graph.
 */
import type { ChicoSpriteState, DumboSpriteState } from "@/sprites/spriteManifest";

export type PoseTransitionKind = "DIRECT_SAFE" | "INTERMEDIATE_REQUIRED" | "UNSAFE";

export type ChicoPoseNode = ChicoSpriteState;
export type DumboPoseNode = DumboSpriteState;

/** Chico semantic pose groups */
export const CHICO_POSE_INVENTORY: ChicoPoseNode[] = [
  "idle",
  "stand",
  "sit",
  "walk_01",
  "walk_02",
  "turn",
  "alert",
  "looking",
  "lay",
  "sleep",
  "resting"
];

export const DUMBO_POSE_INVENTORY: DumboPoseNode[] = [
  "idle",
  "sit",
  "walk_01",
  "walk_02",
  "walk_03",
  "turn",
  "look",
  "guide",
  "lay",
  "sleep",
  "resting",
  "waiting"
];

type EdgeMap<T extends string> = Partial<Record<T, Partial<Record<T, T[]>>>>;

/** Approved intermediate poses between from → to (empty = direct crossfade OK). */
const chicoEdges: EdgeMap<ChicoPoseNode> = {
  idle: { stand: [], sit: ["stand"], walk_01: ["stand"], alert: [], lay: [], sleep: ["lay"] },
  stand: { idle: [], sit: [], walk_01: [], walk_02: [], turn: [], alert: [], lay: ["sit"], sleep: ["lay"] },
  sit: { stand: [], idle: ["stand"], walk_01: ["stand"], lay: [], sleep: ["lay"] },
  walk_01: { walk_02: [], idle: ["stand"], stand: [] },
  walk_02: { walk_01: [], idle: ["stand"], stand: [] },
  turn: { idle: ["stand"], stand: [], walk_01: ["stand"] },
  alert: { idle: ["stand"], stand: [], looking: [] },
  looking: { idle: [], stand: [], alert: [] },
  lay: { sleep: [], idle: ["stand"], stand: ["sit"] },
  sleep: { lay: [], idle: ["lay", "stand"] },
  resting: { idle: [], lay: [], sleep: [] }
};

const dumboEdges: EdgeMap<DumboPoseNode> = {
  idle: { sit: [], walk_01: ["sit"], guide: ["sit"], look: [], lay: [], sleep: ["lay"] },
  sit: { idle: [], walk_01: [], guide: [], look: [], lay: [], sleep: ["lay"] },
  walk_01: { walk_02: [], walk_03: [], idle: ["sit"], sit: [] },
  walk_02: { walk_01: [], walk_03: [], idle: ["sit"] },
  walk_03: { walk_02: [], walk_01: [], idle: ["sit"] },
  turn: { idle: ["sit"], sit: [], walk_01: ["sit"] },
  look: { idle: [], sit: [], guide: ["sit"] },
  guide: { idle: ["sit"], sit: [], look: [] },
  waiting: { idle: [], sit: [], look: [] },
  lay: { sleep: [], idle: ["sit"] },
  sleep: { lay: [], idle: ["lay", "sit"] },
  resting: { idle: [], lay: [], sleep: [] }
};

function resolvePath<T extends string>(
  edges: EdgeMap<T>,
  from: T,
  to: T
): T[] | null {
  if (from === to) return [from];
  const direct = edges[from]?.[to];
  if (direct !== undefined) return [from, ...direct, to].filter((v, i, a) => a.indexOf(v) === i);
  // One-hop via shared idle/sit/stand anchors
  for (const mid of Object.keys(edges[from] ?? {}) as T[]) {
    const rest = edges[mid]?.[to];
    if (rest !== undefined) {
      return [from, mid, ...rest, to].filter((v, i, a) => a.indexOf(v) === i);
    }
  }
  return null;
}

export function getChicoPosePath(from: ChicoPoseNode, to: ChicoPoseNode): ChicoPoseNode[] {
  return resolvePath(chicoEdges, from, to) ?? [from, to];
}

export function getDumboPosePath(from: DumboPoseNode, to: DumboPoseNode): DumboPoseNode[] {
  return resolvePath(dumboEdges, from, to) ?? [from, to];
}

/** Walk cycle frames for directional movement. */
export const CHICO_WALK_CYCLE: ChicoPoseNode[] = ["walk_01", "walk_02"];
export const DUMBO_WALK_CYCLE: DumboPoseNode[] = ["walk_01", "walk_02", "walk_03"];

export function classifyTransition<T extends string>(
  edges: EdgeMap<T>,
  from: T,
  to: T
): PoseTransitionKind {
  if (from === to) return "DIRECT_SAFE";
  const path = resolvePath(edges, from, to);
  if (!path) return "UNSAFE";
  if (path.length <= 2) return "DIRECT_SAFE";
  return "INTERMEDIATE_REQUIRED";
}
