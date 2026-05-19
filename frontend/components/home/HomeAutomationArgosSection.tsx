"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const automationItems = [
  "Recepción de incidencias",
  "Clasificación de solicitudes",
  "Seguimiento de mantenimiento",
  "Avisos automáticos",
  "Respuestas iniciales",
  "Informes técnicos"
] as const;

export default function HomeAutomationArgosSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="argos-home-automation px-5 py-14 lg:px-8 lg:py-20" aria-labelledby="home-automation-title">
      <div className="mx-auto max-w-7xl">
        <div className="argos-home-automation__panel argos-hologram-card grid gap-8 p-8 lg:grid-cols-[1fr_1.1fr] lg:p-10">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#67E8F9]">IA aplicada con criterio</p>
            <h2 id="home-automation-title" className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Automatización ARGOS
            </h2>
            <p className="mt-4 text-lg font-semibold leading-8 text-[#EAF7FF]">
              Convertimos tareas repetitivas en flujos controlados.
            </p>
            <p className="mt-3 text-sm leading-7 text-[#BFD7E8]">
              Menos fricción operativa, más seguimiento y respuestas útiles para tu equipo, sin promesas vacías de
              inteligencia artificial.
            </p>
            <Link
              href="/servicios/automatizacion-ia"
              className="mt-6 inline-flex text-sm font-black text-[#39F4FF] transition hover:text-[#18D4F7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39F4FF]"
            >
              Ver automatización con IA →
            </Link>
          </motion.div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {automationItems.map((item, index) => (
              <motion.li
                key={item}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={
                  reduceMotion ? { duration: 0 } : { duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }
                }
              >
                <span className="argos-home-automation__item block rounded-lg border border-white/10 bg-white/[.06] px-4 py-3 text-sm font-bold text-[#EAF7FF]">
                  {item}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
