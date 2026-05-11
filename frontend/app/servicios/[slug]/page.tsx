import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { defaultLocale, localeStorageKey, type Locale } from "@/i18n/config";
import { dictionaries, isLocale } from "@/i18n/dictionaries";
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

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(localeStorageKey)?.value;
  const decoded = rawCookie ? decodeURIComponent(rawCookie) : null;
  const locale: Locale = decoded && isLocale(decoded) ? decoded : defaultLocale;
  const dict = dictionaries[locale];

  const serviceCopy = (dict.services as Record<string, { title: string; description: string }>)[service.slug];
  const defaultDesc = (dict.meta as { defaultDescription?: string }).defaultDescription;

  return {
    title: `${serviceCopy?.title ?? "Servicio"} | ARGOS-IT`,
    description: serviceCopy?.description ?? defaultDesc ?? ""
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  return <ServiceDetailView slug={service.slug as ServiceSlug} />;
}
