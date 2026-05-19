"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useDiagnosticSurveyLauncher } from "@/components/diagnostic/DiagnosticSurveyLauncher";
import MethodGalaxyBackdrop from "@/components/method/MethodGalaxyBackdrop";

const showcaseSteps = [
  {
    slug: "analizar",
    letter: "A",
    step: "01",
    title: "Analizar",
    tagline: "Detectamos el estado real antes de decidir.",
    href: "/metodo/analizar",
    icon: "scan"
  },
  {
    slug: "reforzar",
    letter: "R",
    step: "02",
    title: "Reforzar",
    tagline: "Fortalecemos lo vulnerable antes del incidente.",
    href: "/metodo/reforzar",
    icon: "shield"
  },
  {
    slug: "guiar",
    letter: "G",
    step: "03",
    title: "Guiar",
    tagline: "Convertimos lo técnico en decisiones claras.",
    href: "/metodo/guiar",
    icon: "compass"
  },
  {
    slug: "optimizar",
    letter: "O",
    step: "04",
    title: "Optimizar",
    tagline: "Hacemos que lo digital trabaje mejor.",
    href: "/metodo/optimizar",
    icon: "pulse"
  },
  {
    slug: "supervisar",
    letter: "S",
    step: "05",
    title: "Supervisar",
    tagline: "Mantenemos el control después de mejorar.",
    href: "/metodo/supervisar",
    icon: "orbit"
  }
] as const;

function MethodologyReveal({ reduceMotion }: { reduceMotion: boolean | null }) {
  const text = "Contamos con una metodología propia y totalmente garantizada.";

  if (reduceMotion) {
    return (
      <p className="argos-methodology-reveal mx-auto max-w-2xl text-sm font-bold leading-7 text-[#A5E8FC] sm:text-base">
        {text}
      </p>
    );
  }

  return (
    <div className="argos-methodology-reveal mx-auto max-w-2xl" aria-label={text}>
      <motion.div
        className="argos-methodology-reveal__window overflow-hidden rounded-lg border border-[#18D4F7]/20 bg-[#061a30]/40 px-4 py-2.5 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.35 }}
      >
        <motion.p
          className="argos-methodology-reveal__text text-sm font-bold leading-7 text-[#A5E8FC] sm:text-base"
          initial={{ opacity: 0, x: -48 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
          {text}
        </motion.p>
      </motion.div>
    </div>
  );
}

function StepIcon({ type }: { type: (typeof showcaseSteps)[number]["icon"] }) {
  const common = "h-5 w-5 stroke-[#67E8F9]";
  switch (type) {
    case "scan":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" strokeWidth="1.75" aria-hidden>
          <circle cx="11" cy="11" r="6" />
          <path d="M20 20l-3-3M8 11h6M11 8v6" />
        </svg>
      );
    case "shield":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" strokeWidth="1.75" aria-hidden>
          <path d="M12 3l7 3v6c0 4.5-3.2 7.4-7 9-3.8-1.6-7-4.5-7-9V6l7-3z" />
        </svg>
      );
    case "compass":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8l2.5 6.5L12 14l-2.5.5L12 8z" />
        </svg>
      );
    case "pulse":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" strokeWidth="1.75" aria-hidden>
          <path d="M4 12h3l2-5 4 10 2-5h5" />
        </svg>
      );
    case "orbit":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-24 12 12)" />
        </svg>
      );
    default:
      return null;
  }
}

export default function MethodArgosShowcase() {
  const { openDiagnostic } = useDiagnosticSurveyLauncher();
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: reduceMotion ? { duration: 0 } : { staggerChildren: 0.08, delayChildren: 0.06 }
    }
  };

  const item = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    show: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <section
      id="metodo-argos"
      className="argos-method-showcase argos-method-galaxy argos-method-galaxy--section-lite argos-method-galaxy--animated"
      aria-labelledby="metodo-argos-title"
    >
      <MethodGalaxyBackdrop variant="section" />

      <div className="argos-method-showcase__inner mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <motion.header
          className="argos-method-showcase__header mx-auto max-w-3xl text-center"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <MethodologyReveal reduceMotion={reduceMotion} />
          <h2
            id="metodo-argos-title"
            className="argos-method-title-glow argos-method-title-glow--showcase mt-6"
          >
            Método ARGOS
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#D7E8F6]">
            Una forma clara, preventiva y continua de proteger, ordenar y mejorar la tecnología de tu empresa.
          </p>
          <blockquote className="argos-method-brand-voice mx-auto mt-6 max-w-2xl border-l-2 border-[#18D4F7]/45 pl-4 text-left sm:pl-5">
            <p className="text-base font-bold leading-8 text-[#EAF7FF] sm:text-lg">
              La informática que funciona. Sin ruido. Sin preocupaciones.
            </p>
            <p className="mt-2 text-sm font-semibold leading-7 text-[#BFD7E8]">
              No trabajamos para apagar incendios. Trabajamos para que no se produzcan.
            </p>
          </blockquote>
          <p className="argos-method-value-strip mx-auto mt-6 max-w-2xl rounded-xl px-5 py-4 text-sm font-bold leading-7 text-[#EAF7FF]">
            La tecnología de tu empresa no debería fallar para que alguien la revise.
          </p>
        </motion.header>

        <motion.div
          className="argos-method-orbit argos-method-orbit--showcase mt-14"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          <span className="argos-method-orbit__line" aria-hidden />
          <div className="argos-method-orbit__grid">
            {showcaseSteps.map((step) => (
              <motion.div key={step.slug} variants={item} className="argos-method-orbit__cell">
                <Link href={step.href} className="argos-method-step-card group">
                  <span className="argos-method-step-card__stage">
                    <span className="argos-method-step-card__step-num">{step.step}</span>
                    <span className="argos-method-step-card__icon">
                      <StepIcon type={step.icon} />
                    </span>
                  </span>
                  <span className="argos-method-step-card__letter" aria-hidden>
                    {step.letter}
                  </span>
                  <span className="argos-method-step-card__title">{step.title}</span>
                  <span className="argos-method-step-card__tagline">{step.tagline}</span>
                  <span className="argos-method-step-card__cta">
                    Explorar fase
                    <span aria-hidden> →</span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          <Link
            href="/metodo"
            className="argos-method-cta-primary inline-flex rounded-md bg-[#18D4F7] px-7 py-4 text-center text-sm font-black text-[#030812] transition hover:bg-[#39F4FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39F4FF]"
          >
            Explorar Método ARGOS
          </Link>
          <button
            type="button"
            onClick={openDiagnostic}
            className="inline-flex rounded-md border border-white/25 bg-white/[.08] px-7 py-4 text-center text-sm font-bold text-white backdrop-blur transition hover:border-[#18D4F7] hover:bg-white/[.12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39F4FF]"
          >
            Iniciar diagnóstico
          </button>
        </motion.div>
      </div>
    </section>
  );
}
