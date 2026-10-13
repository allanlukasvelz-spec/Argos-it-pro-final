import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/mascot-motion-lab",
          "/mascot-motion-lab/",
          "/proyecto-web/comenzar",
          "/dashboard",
          "/dashboard/",
          "/noc",
          "/noc/",
          "/auth",
          "/auth/",
          "/platform-map",
          "/platform-map/",
          "/explainer",
          "/explainer/"
        ]
      }
    ],
    sitemap: "https://argos-it.com/sitemap.xml"
  };
}
