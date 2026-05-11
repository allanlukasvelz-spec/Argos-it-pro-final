/**
 * Configuración declarativa de escenas del explainer Dumbo/Chico.
 * Textos vía i18n (home.explainer.*); sprites: mismos estados que `ChicoDumboSpriteSystem` (`sprites/spriteManifest.ts`).
 */

import type { ChicoSpriteState, DumboSpriteState } from "@/sprites/spriteManifest";

export type ExplainerItemsKey =
  | "home.explainer.problems"
  | "home.explainer.solutions"
  | "home.explainer.protection"
  | null;

export type ExplainerSceneDefinition = {
  index: number;
  titleKey: string;
  subtitleKey: string;
  tabLabelKey: string;
  itemsKey: ExplainerItemsKey;
  badgesKey: string | null;
  dumboKey: DumboSpriteState | null;
  dumboSecondaryKey: DumboSpriteState | null;
  chicoKey: ChicoSpriteState | null;
  chicoSecondaryKey: ChicoSpriteState | null;
  useDumboWalking: boolean;
  chicoGuardianPhases: boolean;
  showLogo: boolean;
};

export const EXPLAINER_SCENE_COUNT = 6;

export const explainerSceneDefinitions: ExplainerSceneDefinition[] = [
  {
    index: 0,
    titleKey: "home.explainer.s0.title",
    subtitleKey: "home.explainer.s0.subtitle",
    tabLabelKey: "home.explainer.s0.tab",
    itemsKey: null,
    badgesKey: null,
    dumboKey: null,
    dumboSecondaryKey: null,
    chicoKey: null,
    chicoSecondaryKey: null,
    useDumboWalking: true,
    chicoGuardianPhases: false,
    showLogo: true
  },
  {
    index: 1,
    titleKey: "home.explainer.s1.title",
    subtitleKey: "home.explainer.s1.subtitle",
    tabLabelKey: "home.explainer.s1.tab",
    itemsKey: "home.explainer.problems",
    badgesKey: null,
    dumboKey: "look",
    dumboSecondaryKey: null,
    chicoKey: null,
    chicoSecondaryKey: null,
    useDumboWalking: false,
    chicoGuardianPhases: false,
    showLogo: false
  },
  {
    index: 2,
    titleKey: "home.explainer.s2.title",
    subtitleKey: "home.explainer.s2.subtitle",
    tabLabelKey: "home.explainer.s2.tab",
    itemsKey: "home.explainer.solutions",
    badgesKey: null,
    dumboKey: "guide",
    dumboSecondaryKey: "idle",
    chicoKey: null,
    chicoSecondaryKey: null,
    useDumboWalking: false,
    chicoGuardianPhases: false,
    showLogo: false
  },
  {
    index: 3,
    titleKey: "home.explainer.s3.title",
    subtitleKey: "home.explainer.s3.subtitle",
    tabLabelKey: "home.explainer.s3.tab",
    itemsKey: null,
    badgesKey: "home.explainer.s3.badges",
    dumboKey: null,
    dumboSecondaryKey: null,
    chicoKey: "walk_01",
    chicoSecondaryKey: "alert",
    useDumboWalking: false,
    chicoGuardianPhases: true,
    showLogo: false
  },
  {
    index: 4,
    titleKey: "home.explainer.s4.title",
    subtitleKey: "home.explainer.s4.subtitle",
    tabLabelKey: "home.explainer.s4.tab",
    itemsKey: "home.explainer.protection",
    badgesKey: null,
    dumboKey: null,
    dumboSecondaryKey: null,
    chicoKey: "idle",
    chicoSecondaryKey: "turn",
    useDumboWalking: false,
    chicoGuardianPhases: false,
    showLogo: false
  },
  {
    index: 5,
    titleKey: "home.explainer.s5.title",
    subtitleKey: "home.explainer.s5.subtitle",
    tabLabelKey: "home.explainer.s5.tab",
    itemsKey: null,
    badgesKey: null,
    dumboKey: "sit",
    dumboSecondaryKey: null,
    chicoKey: "lay",
    chicoSecondaryKey: null,
    useDumboWalking: false,
    chicoGuardianPhases: false,
    showLogo: false
  }
];
