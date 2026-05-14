"use client";

import Link from "next/link";
import DiagnosticPromoBanner from "@/components/diagnostic/DiagnosticPromoBanner";
import ArgosPageShell from "@/components/layout/ArgosPageShell";
import { usePageMeta } from "@/components/seo/usePageMeta";
import { useLocalizedServices } from "@/hooks/useLocalizedServices";
import { useI18n } from "@/i18n/useI18n";

const argosMethodCards = [
  {
    id: "analizar",
    letter: "A",
    title: "Analizar",
    description: "Revisamos web, sistemas, seguridad, rendimiento, herramientas, procesos y riesgos reales."
  },
  {
    id: "reforzar",
    letter: "R",
    title: "Reforzar",
    description: "Fortalecemos seguridad, estabilidad, copias, accesos, rendimiento y protección de datos."
  },
  {
    id: "gestionar",
    letter: "G",
    title: "Gestionar",
    description: "Ordenamos incidencias, solicitudes, usuarios, mantenimiento, prioridades y comunicación."
  },
  {
    id: "optimizar",
    letter: "O",
    title: "Optimizar",
    description: "Mejoramos velocidad, automatizaciones, experiencia web, SEO, conversión y eficiencia."
  },
  {
    id: "sostener",
    letter: "S",
    title: "Sostener",
    description: "Acompañamos de forma continua para prevenir, actualizar y proponer mejoras a tiempo."
  }
];

const techStackItems = [
  "WordPress y Hostinger",
  "React / Next.js",
  "Node.js",
  "PostgreSQL",
  "Automatización con IA",
  "OpenAI API",
  "Formularios inteligentes",
  "Seguridad JWT",
  "Copias de seguridad",
  "Optimización SEO",
  "Optimización de velocidad",
  "Monitorización",
  "Protección de accesos",
  "Servidor propio",
  "Mantenimiento preventivo"
];

const continuousSupportItems = [
  "Seguimiento continuo",
  "Revisión periódica",
  "Comunicación clara",
  "Soporte preventivo",
  "Propuestas de mejora",
  "Relación a largo plazo",
  "Acompañamiento técnico y estratégico"
];

const testimonials = [
  {
    quote: "ARGOS-IT nos ayudó a ordenar nuestra presencia digital, mejorar la seguridad y tener un soporte mucho más claro y rápido.",
    author: "Cliente profesional, sector servicios"
  },
  {
    quote: "Lo que más valoramos es el acompañamiento. No solo responden cuando hay un problema, también nos proponen mejoras antes de que las necesitemos.",
    author: "Empresa acompañada por ARGOS-IT"
  },
  {
    quote: "Ahora tenemos una web más estable, formularios mejor organizados y una visión clara de las mejoras pendientes.",
    author: "Cliente web y mantenimiento"
  },
  {
    quote: "ARGOS-IT trabaja con nosotros como un socio tecnológico, no como un proveedor puntual.",
    author: "Cliente de soporte IT"
  }
];

export default function HomeView() {
  const { t, get } = useI18n();
  const services = useLocalizedServices();
  const trustItems = get<string[]>("home.trustItems", []);

  usePageMeta(t("meta.homeTitle"), t("meta.homeDescription"));

  return (
    <ArgosPageShell variant="home">
      <nav className="argos-side-nav" aria-label="Accesos rápidos">
        <Link href="/servicios" className="argos-side-nav__item">{t("nav.services")}</Link>
        <Link href="/metodo" className="argos-side-nav__item">{t("nav.method")}</Link>
        <Link href="/contacto" className="argos-side-nav__item">{t("nav.contact")}</Link>
      </nav>

      <section className="px-5 pb-16 pt-16 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
          <div className="max-w-4xl">
            <p className="argos-status-dot mb-5">{t("home.eyebrow")}</p>
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              {t("home.title")}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#D7E8F6]">{t("home.subtitle")}</p>
            <p className="mt-4 max-w-3xl rounded-lg border border-[#18D4F7]/25 bg-white/[.06] p-4 text-sm font-bold leading-7 text-[#EAF7FF]">
              En ARGOS-IT no solo resolvemos problemas: los prevenimos. No esperamos a que tu tecnología falle; la revisamos, reforzamos y sostenemos antes de que afecte a tu negocio.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contacto"
                className="rounded-md bg-[#18D4F7] px-6 py-4 text-center font-black text-[#030812] shadow-lg shadow-cyan-500/20 transition hover:bg-[#39F4FF]"
              >
                Solicitar diagnóstico ARGOS
              </Link>
              <Link
                href="/metodo"
                className="rounded-md border border-white/20 bg-white/5 px-6 py-4 text-center font-bold text-white backdrop-blur transition hover:border-[#18D4F7] hover:bg-white/10"
              >
                Ver método completo
              </Link>
            </div>
          </div>

          <div className="argos-hologram-card argos-tech-frame argos-scan-line p-6">
            <h2 className="text-lg font-black text-white">{t("home.trustTitle")}</h2>
            <div className="mt-4 grid gap-3">
              {trustItems.map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[.08] p-4 text-sm font-semibold text-[#EAF7FF]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8" id="servicios">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="text-sm font-black uppercase text-[#18D4F7]">{t("home.servicesEyebrow")}</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">{t("home.servicesTitle")}</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#BFD7E8]">{t("home.servicesSubtitle")}</p>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-[#EAF7FF]">
              La mejor incidencia es la que nunca llega a ocurrir: mantenimiento preventivo, seguridad y mejora continua para que tu entorno digital funcione de forma estable, segura y predecible.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article key={service.slug} className="argos-hologram-card p-6 transition hover:-translate-y-0.5">
                <h3 className="text-xl font-black text-white">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#C9DDEC]">{service.description}</p>
                <Link href={`/servicios/${service.slug}`} className="mt-5 inline-flex text-sm font-bold text-[#39F4FF]">
                  {t("actions.viewDetail")} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-sm font-black uppercase text-[#18D4F7]">Método ARGOS</p>
            <h2 className="mt-3 text-3xl font-black text-white">Analizar, reforzar, gestionar, optimizar y sostener.</h2>
            <p className="mt-4 text-sm leading-7 text-[#BFD7E8]">
              No esperamos a que algo falle. Analizamos, reforzamos y acompañamos para prevenir problemas antes de que afecten a tu negocio.
            </p>
            <Link href="/metodo" className="mt-6 inline-flex rounded-md border border-[#18D4F7]/40 bg-white/[.06] px-5 py-3 text-sm font-black text-[#39F4FF] transition hover:bg-white/[.1]">
              Ver método completo
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-5">
            {argosMethodCards.map((step) => (
              <Link
                key={step.id}
                href={`/metodo#${step.id}`}
                className="argos-hologram-card flex min-h-44 flex-col justify-between p-5 transition hover:-translate-y-1 hover:border-[#18D4F7]/45"
              >
                <span className="text-4xl font-black text-[#39F4FF]">{step.letter}</span>
                <span>
                  <strong className="block text-sm font-black text-white">{step.title}</strong>
                  <span className="mt-2 block text-xs leading-5 text-[#BFD7E8]">{step.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="tech-stack px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.82fr_1.18fr]">
          <div>
            <p className="text-sm font-black uppercase text-[#18D4F7]">Herramientas y tecnología</p>
            <h2 className="mt-3 text-3xl font-black text-white">Herramientas y tecnología con las que trabajamos</h2>
            <p className="mt-4 text-sm leading-7 text-[#BFD7E8]">
              Combinamos herramientas modernas, automatización e infraestructura propia para ofrecer soluciones estables, seguras y preparadas para crecer.
            </p>
          </div>
          <div className="tech-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {techStackItems.map((item) => (
              <div key={item} className="argos-hologram-card px-4 py-3 text-sm font-bold text-[#EAF7FF]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="security-section px-5 py-16 lg:px-8">
        <div className="argos-hologram-card mx-auto grid max-w-7xl gap-8 p-8 lg:grid-cols-[1fr_.9fr]">
          <div>
            <p className="text-sm font-black uppercase text-[#18D4F7]">Infraestructura propia</p>
            <h2 className="mt-3 text-3xl font-black text-white">Infraestructura propia, privacidad y control</h2>
            <p className="mt-4 text-sm leading-7 text-[#C9DDEC]">
              En ARGOS-IT contamos con infraestructura y servidor propio para reforzar la seguridad, la privacidad y el control de los entornos digitales de nuestros clientes. Esto nos permite trabajar con mayor independencia, proteger mejor la información y aplicar soluciones adaptadas a cada proyecto.
            </p>
          </div>
          <div className="grid gap-3">
            {["Mayor control técnico", "Mejor privacidad", "Entornos más seguros", "Menos dependencia de terceros", "Mantenimiento más directo", "Reducción de riesgos con mejores prácticas"].map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-white/[.07] px-4 py-3 text-sm font-bold text-[#EAF7FF]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="continuous-support px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.92fr_1.08fr]">
          <div>
            <p className="text-sm font-black uppercase text-[#18D4F7]">Acompañamiento continuo</p>
            <h2 className="mt-3 text-3xl font-black text-white">Vamos de la mano en el día a día tecnológico.</h2>
            <p className="mt-4 text-sm leading-7 text-[#BFD7E8]">
              Trabajamos junto a nuestros clientes acompañando sus decisiones tecnológicas, manteniendo sus sistemas, revisando mejoras y anticipándonos a posibles incidencias. Prevenir es más eficiente que reparar.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {continuousSupportItems.map((item) => (
              <div key={item} className="argos-hologram-card px-5 py-4 text-sm font-bold text-[#EAF7FF]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="testimonials px-5 pb-24 pt-16 lg:px-8 lg:pb-32 lg:pr-[max(1.25rem,clamp(1.25rem,6vw,4.5rem))]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-wide text-[#22d3ee]">Clientes que confían en ARGOS-IT</p>
            <h2 className="mt-3 text-3xl font-black text-slate-50">Prueba social editable para incorporar testimonios reales.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Estos textos son placeholders profesionales y deben sustituirse por reseñas reales cuando estén disponibles.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <article key={testimonial.author} className="testimonial-card p-6 md:p-7">
                <p className="text-sm leading-7 text-white">“{testimonial.quote}”</p>
                <strong className="mt-4 block text-sm font-semibold text-white/95">— {testimonial.author}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Essential", "Base técnica ordenada para empresas que necesitan estabilidad."],
              ["Professional", "Acompañamiento recurrente, mejoras web y soporte priorizado."],
              ["Elite", "Gobierno tecnológico, auditoría continua y roadmap ejecutivo."]
            ].map(([title, description]) => (
              <article key={title} className="argos-hologram-card p-6">
                <h3 className="text-2xl font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#C9DDEC]">{description}</p>
                <Link href="/contacto" className="mt-5 inline-flex text-sm font-bold text-[#39F4FF]">
                  Consultar plan →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div className="flex justify-center lg:justify-start">
            <img src="/argos-history-emblem.png" alt="Emblema de Chico y Dumbo en la historia de ARGOS-IT" className="h-auto w-52 opacity-80 sm:w-64" />
          </div>
          <div>
            <p className="text-sm font-black uppercase text-[#18D4F7]">Origen de ARGOS-IT</p>
            <h2 className="mt-3 text-3xl font-black text-white">Tecnología con criterio y acompañamiento humano.</h2>
            <p className="mt-4 text-sm leading-7 text-[#BFD7E8]">
              Chico y Dumbo no son el logo principal: son asistentes de marca. Chico ayuda a diagnosticar y proteger; Dumbo acompaña solicitudes, formularios y seguimiento dentro del portal.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 pt-16 lg:px-8">
        <div className="cta-preventive argos-hologram-card mx-auto max-w-5xl p-8 text-center">
          <h2 className="text-3xl font-black text-white">¿Quieres prevenir problemas antes de que afecten a tu negocio?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#C9DDEC]">
            Trabajamos con empresas de cualquier lugar que quieren seguridad, soporte, WordPress, automatización y mejora continua sin improvisar, ya sea de forma telemática, telefónica o presencial.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/contacto" className="inline-flex rounded-md bg-[#18D4F7] px-6 py-4 font-black text-[#030812] transition hover:bg-[#39F4FF]">
              Hablar con ARGOS-IT
            </Link>
            <Link href="/servicios/mantenimiento-informatico" className="inline-flex rounded-md border border-white/20 bg-white/[.06] px-6 py-4 font-black text-white transition hover:border-[#18D4F7]">
              Solicitar mantenimiento preventivo
            </Link>
            <Link href="/servicios/auditoria-digital" className="inline-flex rounded-md border border-white/20 bg-white/[.06] px-6 py-4 font-black text-white transition hover:border-[#18D4F7]">
              Revisar mi web
            </Link>
          </div>
        </div>
      </section>

      <DiagnosticPromoBanner />
    </ArgosPageShell>
  );
}
