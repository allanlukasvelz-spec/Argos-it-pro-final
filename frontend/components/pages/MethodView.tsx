"use client";

import Link from "next/link";
import ArgosPageShell from "@/components/layout/ArgosPageShell";
import { useI18n } from "@/i18n/useI18n";
import { usePageMeta } from "@/components/seo/usePageMeta";

const methodDetails = [
  {
    id: "analizar",
    letter: "A",
    title: "Analizar",
    meaning: "Revisamos el estado real del entorno digital del cliente: web, sistemas, seguridad, rendimiento, herramientas, procesos y riesgos.",
    work: "Inventariamos activos, revisamos accesos, hosting, WordPress, formularios, rendimiento, procesos internos y puntos de riesgo.",
    clientGets: "Un diagnóstico claro, prioridades ordenadas y una hoja de ruta técnica entendible para tomar decisiones con criterio.",
    avoids: "Evita invertir a ciegas, repetir incidencias, mantener sistemas sin mapa y tomar decisiones sin saber dónde está el riesgo.",
    tools: ["Auditoría web", "Revisión WordPress", "SEO técnico", "Monitorización", "Inventario de accesos", "Chico diagnóstico"]
  },
  {
    id: "reforzar",
    letter: "R",
    title: "Reforzar",
    meaning: "Aplicamos medidas preventivas para fortalecer seguridad, estabilidad, copias de seguridad, accesos, rendimiento y protección de datos.",
    work: "Endurecemos configuraciones, revisamos permisos, copias, actualizaciones, formularios, hosting, dependencias y medidas de protección.",
    clientGets: "Un entorno más controlado, con mejores prácticas, reducción de riesgos y bases técnicas más sólidas para operar.",
    avoids: "Evita accesos débiles, pérdidas de información, caídas prevenibles, webs expuestas y dependencias técnicas mal gestionadas.",
    tools: ["Copias de seguridad", "Protección de accesos", "Hardening WordPress", "Seguridad JWT", "Servidor propio", "Buenas prácticas RGPD"]
  },
  {
    id: "gestionar",
    letter: "G",
    title: "Gestionar",
    meaning: "Organizamos incidencias, mantenimiento, solicitudes, prioridades, usuarios, servicios y comunicación para que el cliente tenga control y claridad.",
    work: "Centralizamos solicitudes, documentamos decisiones, priorizamos tareas, ordenamos estados y dejamos trazabilidad de soporte y mejoras.",
    clientGets: "Claridad operativa, comunicación más directa y una visión organizada de lo que está pendiente, activo o resuelto.",
    avoids: "Evita mensajes dispersos, urgencias sin prioridad, tareas repetidas, pérdida de contexto y decisiones sin seguimiento.",
    tools: ["Portal de clientes", "Formularios inteligentes", "Historial de solicitudes", "Mensajería", "Panel de mejoras", "Dumbo seguimiento"]
  },
  {
    id: "optimizar",
    letter: "O",
    title: "Optimizar",
    meaning: "Mejoramos velocidad, procesos, automatizaciones, experiencia web, conversión, SEO, rendimiento y eficiencia operativa.",
    work: "Analizamos oportunidades de mejora, reducimos fricción, optimizamos rendimiento web y automatizamos flujos repetitivos con control.",
    clientGets: "Una web más rápida, procesos más simples, mejores datos de entrada y una operación digital más eficiente.",
    avoids: "Evita formularios poco útiles, webs lentas, procesos manuales innecesarios y oportunidades de captación desaprovechadas.",
    tools: ["React / Next.js", "Node.js", "PostgreSQL", "OpenAI API", "Automatización con IA", "Optimización SEO"]
  },
  {
    id: "sostener",
    letter: "S",
    title: "Sostener",
    meaning: "Acompañamos al cliente de forma continua, revisando, previniendo, actualizando y proponiendo mejoras antes de que aparezcan problemas.",
    work: "Mantenemos revisiones periódicas, seguimiento preventivo, propuestas de mejora, actualización técnica y acompañamiento estratégico.",
    clientGets: "Continuidad, tranquilidad y una relación tecnológica a largo plazo con decisiones más previsibles y menos improvisación.",
    avoids: "Evita abandono técnico, deuda digital acumulada, incidencias repetidas y mejoras que llegan demasiado tarde.",
    tools: ["Monitorización", "Auditoría continua", "Mantenimiento preventivo", "Copias", "Roadmap", "Servidor propio"]
  }
];

export default function MethodView() {
  const { t } = useI18n();

  usePageMeta(t("meta.methodTitle"), t("meta.methodDescription"));

  return (
    <ArgosPageShell variant="method">
      <section className="px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-bold text-[#39F4FF]">
          ← {t("actions.backHome")}
        </Link>
        <h1 className="mt-4 text-4xl font-black text-white">{t("method.title")}</h1>
        <p className="mt-4 max-w-3xl text-[#BFD7E8]">{t("method.subtitle")}</p>
        <p className="mt-4 max-w-3xl rounded-lg border border-[#18D4F7]/25 bg-white/[.06] p-4 text-sm font-bold leading-7 text-[#EAF7FF]">
          No esperamos a que algo falle. Analizamos, reforzamos y acompañamos para prevenir problemas antes de que afecten a tu negocio.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {methodDetails.map((step) => (
            <Link key={step.id} href={`#${step.id}`} className="argos-hologram-card p-6 transition hover:-translate-y-1 hover:border-[#18D4F7]/45">
              <p className="text-sm font-black text-[#39F4FF]">{step.letter}</p>
              <h2 className="mt-2 text-xl font-black text-white">{step.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#C9DDEC]">{step.meaning}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 grid gap-6">
          {methodDetails.map((detail) => (
            <section key={detail.id} id={detail.id} className="argos-hologram-card scroll-mt-28 p-6 md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase text-[#18D4F7]">{detail.letter} · {detail.title}</p>
                  <h2 className="mt-2 text-3xl font-black text-white">{detail.title}: prevención con método.</h2>
                  <p className="mt-4 max-w-4xl text-sm leading-7 text-[#D7E8F6]">{detail.meaning}</p>
                </div>
                <Link href="/contacto" className="shrink-0 rounded-md bg-[#18D4F7] px-5 py-3 text-center text-sm font-black text-[#030812] transition hover:bg-[#39F4FF]">
                  Solicitar diagnóstico ARGOS
                </Link>
              </div>
              <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-lg border border-white/10 bg-white/[.07] p-5">
                  <h3 className="text-sm font-black text-white">Qué hacemos</h3>
                  <p className="mt-3 text-sm leading-6 text-[#C9DDEC]">{detail.work}</p>
                </article>
                <article className="rounded-lg border border-white/10 bg-white/[.07] p-5">
                  <h3 className="text-sm font-black text-white">Qué obtiene el cliente</h3>
                  <p className="mt-3 text-sm leading-6 text-[#C9DDEC]">{detail.clientGets}</p>
                </article>
                <article className="rounded-lg border border-white/10 bg-white/[.07] p-5">
                  <h3 className="text-sm font-black text-white">Qué problemas evitamos</h3>
                  <p className="mt-3 text-sm leading-6 text-[#C9DDEC]">{detail.avoids}</p>
                </article>
                <article className="rounded-lg border border-white/10 bg-white/[.07] p-5">
                  <h3 className="text-sm font-black text-white">Herramientas</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {detail.tools.map((tool) => (
                      <span key={tool} className="rounded-full border border-[#18D4F7]/25 bg-[#18D4F7]/10 px-3 py-1 text-xs font-bold text-[#DDFBFF]">
                        {tool}
                      </span>
                    ))}
                  </div>
                </article>
              </div>
            </section>
          ))}
        </div>
      </div>
      </section>
    </ArgosPageShell>
  );
}
