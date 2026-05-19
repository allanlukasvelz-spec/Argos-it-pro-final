"use client";

import { motion, useReducedMotion } from "framer-motion";

const SLOGAN =
  "Una consultoría tecnológica preventiva con diagnóstico, portal, IA aplicada y seguimiento continuo.";

export default function HomeBrandSlogan() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.p
      className="argos-home-brand-slogan mt-5 max-w-3xl text-base font-semibold leading-8 text-[#B8E4F8] sm:text-lg"
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              scale: 0.96,
              filter: "drop-shadow(0 0 0 rgba(103, 232, 249, 0))"
            }
      }
      animate={
        reduceMotion
          ? undefined
          : {
              opacity: 1,
              scale: 1,
              filter: "drop-shadow(0 0 10px rgba(103, 232, 249, 0.14))"
            }
      }
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.12 }
      }
    >
      {SLOGAN}
    </motion.p>
  );
}
