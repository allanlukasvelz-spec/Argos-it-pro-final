import type { MetadataRoute } from "next";
import { serviceDefinitions } from "@/lib/services";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://argos-it.com";
  const now = new Date();

  const staticRoutes = [
    "",
    "/servicios",
    "/metodo",
    "/sobre-argos-it",
    "/contacto",
    "/aviso-legal",
    "/privacidad",
    "/cookies"
  ];

  const routeEntries = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8
  }));

  const serviceEntries = serviceDefinitions.map((service) => ({
    url: `${baseUrl}/servicios/${service.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7
  }));

  return [...routeEntries, ...serviceEntries];
}
