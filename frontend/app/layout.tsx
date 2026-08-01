import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import ClientShell from "@/components/layout/ClientShell";
import SiteShell from "@/components/layout/SiteShell";
import { LanguageProvider } from "@/i18n/provider";
import "./globals.css";
import "../assets/css/argos-backgrounds.css";
import "../assets/css/argos-marketing-chrome.css";
import "../assets/css/argos-method-galaxy.css";
import "../styles/mascot-sprites.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://argos-it.com"),
  title: "ARGOS-IT | Consultoría tecnológica premium",
  description: "Tecnología que protege, acompaña y simplifica: soporte IT, seguridad informática, mantenimiento web, presencia web corporativa, automatización con IA y mejora continua.",
  keywords: "consultoría informática, servicios informáticos, mantenimiento informático, soporte IT, seguridad informática, diseño web profesional, automatización con IA",
  authors: [{ name: "ARGOS-IT" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.svg"
  },
  
  // Open Graph
  openGraph: {
    title: "ARGOS-IT | Tecnología que protege, acompaña y simplifica",
    description: "Socio tecnológico externo para soporte IT, ciberseguridad, presencia web corporativa, automatización con IA y mejora continua.",
    url: "https://argos-it.com",
    siteName: "Argos IT",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ARGOS-IT - Consultoría tecnológica premium"
      }
    ],
    type: "website",
    locale: "es_ES"
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "ARGOS-IT | Consultoría tecnológica premium",
    description: "Tecnología que protege, acompaña y simplifica",
    images: ["/og-image.png"]
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
    description: "Consultoría tecnológica premium, soporte IT, seguridad informática, mantenimiento web, presencia digital y automatización con IA para empresas y profesionales",
    areaServed: ["España", "Unión Europea", "Atención telemática", "Atención telefónica", "Atención presencial según proyecto"],
    url: "https://argos-it.com",
    email: "info@argos-it.com",
    serviceType: ["Consultoría IT premium", "Mantenimiento informático para empresas", "Seguridad informática y protección digital", "Web y presencia digital", "Automatización con IA", "Auditoría digital continua"],
    knowsAbout: ["Soporte IT", "Seguridad informática", "Presencia web corporativa", "Automatización con IA", "Auditoría digital continua", "Mantenimiento informático"]
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
          <ClientShell>
            <SiteShell>{children}</SiteShell>
            <Toaster position="top-right" />
          </ClientShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
