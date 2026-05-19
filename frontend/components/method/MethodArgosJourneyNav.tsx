"use client";

import Link from "next/link";
import { getAllMethodArgosSteps, type MethodArgosSlug } from "@/lib/methodArgosSteps";

type Props = {
  activeSlug?: MethodArgosSlug;
  className?: string;
};

export default function MethodArgosJourneyNav({ activeSlug, className = "" }: Props) {
  const steps = getAllMethodArgosSteps();

  return (
    <nav
      className={`argos-method-journey ${className}`}
      aria-label="Recorrido del método ARGOS"
    >
      <p className="argos-method-journey__label">Recorrido ARGOS</p>
      <ol className="argos-method-journey__track">
        {steps.map((step, index) => {
          const isActive = step.slug === activeSlug;
          return (
            <li key={step.slug} className="argos-method-journey__item">
              <Link
                href={step.path}
                className={`argos-method-journey__step ${isActive ? "argos-method-journey__step--active" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                <span className="argos-method-journey__letter" aria-hidden>
                  {step.letter}
                </span>
                <span className="argos-method-journey__name">{step.name}</span>
              </Link>
              {index < steps.length - 1 ? (
                <span className="argos-method-journey__connector" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
