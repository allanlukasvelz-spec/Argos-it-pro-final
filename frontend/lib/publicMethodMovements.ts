import { getMethodArgosStep, type MethodArgosSlug, type MethodArgosStep } from "@/lib/methodArgosSteps";

/**
 * Primary operational A.R.G.O.S. phase for each public philosophy movement.
 * Authority: docs/content/ARGOS_METHOD_MAPPING_4_TO_5.md (NATURAL/primary links).
 */
export const PUBLIC_MOVEMENT_PRIMARY_SLUG: Record<string, MethodArgosSlug> = {
  "01": "analizar",
  "02": "guiar",
  "03": "reforzar",
  "04": "supervisar"
};

export type PublicMethodMovement = {
  order: string;
  title: string;
  description: string;
};

export function getPrimaryStepForPublicMovement(order: string): MethodArgosStep | undefined {
  const slug = PUBLIC_MOVEMENT_PRIMARY_SLUG[order];
  return slug ? getMethodArgosStep(slug) : undefined;
}
