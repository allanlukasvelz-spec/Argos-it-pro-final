import { METHOD_ARGOS_SLUGS, type MethodArgosSlug } from "@/lib/methodArgosSteps";

export type MethodStepSummary = {
  slug: MethodArgosSlug;
  letter: string;
  title: string;
  description: string;
};

export function mapMethodStepsFromI18n(
  steps: { id: string; title: string; description: string }[]
): MethodStepSummary[] {
  return METHOD_ARGOS_SLUGS.map((slug, index) => {
    const step = steps[index];
    return {
      slug,
      letter: step?.id ?? slug.charAt(0).toUpperCase(),
      title: step?.title ?? slug,
      description: step?.description ?? ""
    };
  });
}
