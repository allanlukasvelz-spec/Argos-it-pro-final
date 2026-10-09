"use client";

import { getHomeFaqItems } from "@/lib/methodArgosSteps";

/**
 * FAQ Home — accordion corto con preguntas ya aprobadas del Método ARGOS.
 * No inventa copy.
 */
export default function HomeFaq() {
  const items = getHomeFaqItems();
  if (items.length === 0) return null;

  return (
    <section className="argos-corp-section argos-corp-section--dplus-faq" aria-labelledby="home-faq-title">
      <div className="argos-corp-container">
        <p className="argos-corp-section-index">11 / Preguntas frecuentes</p>
        <h2 id="home-faq-title" className="argos-font-display argos-corp-h2">
          Preguntas frecuentes
        </h2>
        <div className="argos-dplus-faq">
          {items.map((item) => (
            <details key={item.question} className="argos-dplus-faq__item">
              <summary className="argos-dplus-faq__summary">
                <span>{item.question}</span>
                <span className="argos-dplus-faq__mark" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="argos-dplus-faq__answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
