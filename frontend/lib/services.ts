export const serviceSlugs = [
  "consultoria-it",
  "mantenimiento-informatico",
  "seguridad-informatica",
  "web-wordpress",
  "automatizacion-ia",
  "auditoria-digital"
] as const;

export type ServiceSlug = (typeof serviceSlugs)[number];

export type ServiceDefinition = {
  slug: ServiceSlug;
};

export const serviceDefinitions: ServiceDefinition[] = serviceSlugs.map((slug) => ({ slug }));

export function getServiceBySlug(slug: string) {
  return serviceDefinitions.find((service) => service.slug === slug);
}
