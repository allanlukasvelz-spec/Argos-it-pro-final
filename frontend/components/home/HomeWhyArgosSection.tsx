"use client";

import { motion, useReducedMotion } from "framer-motion";

const reasons = [
  "Porque no esperamos a que el problema explote.",
  "Porque revisamos seguridad, rendimiento y procesos.",
  "Porque cada cliente tiene seguimiento en su portal.",
  "Porque convertimos incidencias en planes de mejora.",
  "Porque unimos soporte técnico, web, IA y mantenimiento."
] as const;

function ReasonIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 stroke-[#67E8F9]" viewBox="0 0 24 24" fill="none" strokeWidth="2" aria-hidden>
      <path d="M5 12l4 4L19 6" />
    </svg>
  );
}

export default function HomeWhyArgosSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="argos-home-why px-5 py-14 lg:px-8 lg:py-20" aria-labelledby="home-why-argos-title">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#18D4F7]">Confianza preventiva</p>
          <h2 id="home-why-argos-title" className="mt-3 text-3xl font-black text-white sm:text-4xl">
            ¿Por qué elegir ARGOS-IT?
          </h2>
        </motion.div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((text, index) => (
            <motion.li
              key={text}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }
              }
            >
              <article className="argos-home-why-card flex h-full gap-3 p-5">
                <span className="argos-home-why-card__icon mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-[#18D4F7]/25 bg-[#18D4F7]/10">
                  <ReasonIcon />
                </span>
                <p className="text-sm font-semibold leading-7 text-[#D7E8F6]">{text}</p>
              </article>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
