import type { Metadata } from "next";
import { notFound } from "next/navigation";
import es from "@/i18n/locales/es.json";
import ServiceDetailView from "@/components/pages/ServiceDetailView";
import { getServiceBySlug, serviceDefinitions, type ServiceSlug } from "@/lib/services";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return serviceDefinitions.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return {
      title: "Servicio no encontrado | ARGOS-IT"
    };
  }

  const serviceCopy = (es.services as Record<string, { title: string; description: string }>)[service.slug];

  return {
    title: `${serviceCopy?.title ?? "Servicio"} | ARGOS-IT`,
    description: serviceCopy?.description ?? es.meta.defaultDescription
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  return <ServiceDetailView slug={service.slug as ServiceSlug} />;
}
