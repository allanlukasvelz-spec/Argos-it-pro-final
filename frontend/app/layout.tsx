import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import SiteShell from "@/components/layout/SiteShell";
import { LanguageProvider } from "@/i18n/provider";
import "./globals.css";
import "../styles/mascot-sprites.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://argos-it.com"),
  title: "ARGOS-IT | Consultoría informática para empresas",
  description: "Consultoría informática, mantenimiento, soporte técnico, ciberseguridad, automatización y soluciones digitales para empresas.",
  keywords: "consultoría informática, mantenimiento informático, soporte técnico empresas, ciberseguridad, redes, backup, automatización IA, Sabadell, Barcelona",
  authors: [{ name: "ARGOS-IT" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.svg"
  },
  
  // Open Graph
  openGraph: {
    title: "ARGOS-IT | Consultoría informática para empresas",
    description: "Mantenimiento IT, soporte técnico, ciberseguridad, redes, backup, automatización IA y desarrollo web empresarial.",
    url: "https://argos-it.com",
    siteName: "Argos IT",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "ARGOS-IT - Consultoría informática para empresas"
      }
    ],
    type: "website",
    locale: "es_ES"
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "ARGOS-IT | Consultoría informática para empresas",
    description: "Servicios IT B2B para empresas",
    images: ["/og-image.svg"]
  },

  // Verificación y confianza
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large"
    }
  },

  // Alternates
  alternates: {
    canonical: "https://argos-it.com"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "ARGOS-IT",
    description: "Consultoría informática, mantenimiento IT, soporte técnico, ciberseguridad, automatización IA y desarrollo web para empresas",
    areaServed: ["International"],
    url: "https://argos-it.com",
    email: "info@argos-it.com",
    serviceType: ["Consultoría IT", "Seguridad informática", "Mantenimiento IT", "Soporte técnico", "Desarrollo web empresarial"],
    knowsAbout: ["Ciberseguridad", "Redes y sistemas", "Backup y recuperación", "Automatización con IA", "Soporte IT"]
  };

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#07111F" />
        <link rel="icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        
        {/* Preconnect para optimización */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </head>
      <body className="antialiased">
        <LanguageProvider>
          <SiteShell>{children}</SiteShell>
          <Toaster position="top-right" />
        </LanguageProvider>
      </body>
    </html>
  );
}
