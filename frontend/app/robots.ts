import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/mascot-motion-lab", "/mascot-motion-lab/"]
      }
    ],
    sitemap: "https://argos-it.com/sitemap.xml"
  };
}
