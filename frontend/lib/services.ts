export const serviceSlugs = [
  "mantenimiento-informatico",
  "soporte-tecnico",
  "ciberseguridad",
  "redes-sistemas",
  "backup-recuperacion",
  "automatizacion-ia",
  "consultoria-digital",
  "desarrollo-web"
] as const;

export type ServiceSlug = (typeof serviceSlugs)[number];

export type ServiceDefinition = {
  slug: ServiceSlug;
};

export const serviceDefinitions: ServiceDefinition[] = serviceSlugs.map((slug) => ({ slug }));

export function getServiceBySlug(slug: string) {
  return serviceDefinitions.find((service) => service.slug === slug);
}
