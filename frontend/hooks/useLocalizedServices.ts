"use client";

import { useMemo } from "react";
import { serviceDefinitions, type ServiceSlug } from "@/lib/services";
import { useI18n } from "@/i18n/useI18n";

export type LocalizedService = {
  slug: ServiceSlug;
  title: string;
  description: string;
  problem: string;
  includes: string[];
  benefits: string[];
  process: string[];
  audience: string[];
};

export function useLocalizedServices() {
  const { get } = useI18n();

  return useMemo<LocalizedService[]>(() => {
    return serviceDefinitions.map((service) => {
      const base = `services.${service.slug}`;
      return {
        slug: service.slug,
        title: get<string>(`${base}.title`, service.slug),
        description: get<string>(`${base}.description`, ""),
        problem: get<string>(`${base}.problem`, ""),
        includes: get<string[]>(`${base}.includes`, []),
        benefits: get<string[]>(`${base}.benefits`, []),
        process: get<string[]>(`${base}.process`, []),
        audience: get<string[]>(`${base}.audience`, [])
      };
    });
  }, [get]);
}

export function useLocalizedServiceBySlug(slug: ServiceSlug) {
  const services = useLocalizedServices();
  return services.find((service) => service.slug === slug);
}
