import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MethodStepPageView from "@/components/pages/MethodStepPageView";
import { getMethodArgosStep, METHOD_ARGOS_STATIC_SLUGS } from "@/lib/methodArgosSteps";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return METHOD_ARGOS_STATIC_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const step = getMethodArgosStep(slug);

  if (!step) {
    return {
      title: "Método | ARGOS-IT"
    };
  }

  return {
    title: step.seoTitle,
    description: step.description,
    alternates: {
      canonical: `https://argos-it.com${step.path}`
    }
  };
}

export default async function MethodStepPage({ params }: Props) {
  const { slug } = await params;
  const step = getMethodArgosStep(slug);
  if (!step) notFound();

  return <MethodStepPageView step={step} />;
}
