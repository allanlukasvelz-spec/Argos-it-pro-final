"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import ArgosDetailDialog from "@/components/corporate/ArgosDetailDialog";
import { useI18n } from "@/i18n/useI18n";
import {
  getPrimaryStepForPublicMovement,
  type PublicMethodMovement
} from "@/lib/publicMethodMovements";

type Props = {
  steps: PublicMethodMovement[];
  /** Heading level inside each card summary. */
  titleAs?: "h3" | "h4";
};

/**
 * Cuatro movimientos — click opens Detail Mode with related ARGOS phase detail
 * and a footer control to advance to the next public movement (without leaving the page).
 */
export default function PublicMovementsGrid({ steps, titleAs: TitleTag = "h3" }: Props) {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const detailTitleId = useId();

  const active = activeIndex !== null ? steps[activeIndex] : null;
  const related = active ? getPrimaryStepForPublicMovement(active.order) : undefined;
  const dialogTitle = active ? `${active.order} · ${active.title}` : "";

  const openAt = (index: number) => {
    returnFocusRef.current = triggerRefs.current[index];
    setActiveIndex(index);
  };
  const close = () => setActiveIndex(null);

  const goNextMovement = () => {
    if (activeIndex === null || steps.length === 0) return;
    const next = (activeIndex + 1) % steps.length;
    returnFocusRef.current = triggerRefs.current[next];
    setActiveIndex(next);
  };

  const nextLabel =
    activeIndex !== null && activeIndex < steps.length - 1
      ? t("actions.nextMovement")
      : t("actions.firstMovement");

  return (
    <>
      <ul className="argos-card-grid argos-card-grid--philosophy">
        {steps.map((step, index) => (
          <li key={step.order}>
            <button
              ref={(el) => {
                triggerRefs.current[index] = el;
              }}
              type="button"
              className="argos-card argos-card--method argos-movement-card"
              aria-expanded={activeIndex === index}
              aria-haspopup="dialog"
              onClick={() => openAt(index)}
            >
              <p className="argos-corp-eyebrow">{step.order}</p>
              <TitleTag className="argos-corp-card-title">{step.title}</TitleTag>
              <p className="argos-corp-card-body argos-corp-text-justify">{step.description}</p>
              <span className="argos-movement-card__hint">{t("actions.viewDetail")}</span>
            </button>
          </li>
        ))}
      </ul>

      <ArgosDetailDialog
        open={activeIndex !== null && Boolean(active)}
        onClose={close}
        title={dialogTitle}
        returnFocusRef={returnFocusRef}
      >
        {active ? (
          <div id={detailTitleId} className="argos-detail-section argos-movement-detail">
            <p className="argos-corp-card-body argos-corp-text-justify">{active.description}</p>

            {related ? (
              <>
                <p className="argos-corp-eyebrow mt-6">
                  {t("method.relatedOperationalPhase")} · {related.letter} · {related.name}
                </p>
                <p className="argos-corp-card-body argos-corp-text-justify mt-2">{related.meaning}</p>
                <p className="argos-corp-card-body argos-corp-text-justify mt-4 font-semibold text-[var(--text-primary)]">
                  {related.valuePhrase}
                </p>
                <ul className="argos-corp-detail-list mt-4">
                  {related.argosActions.slice(0, 6).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link href={related.path} className="argos-corporate-link mt-6 inline-block" onClick={close}>
                  {t("actions.viewMethodPhase")} {related.name} →
                </Link>
              </>
            ) : null}

            <div className="argos-movement-detail__footer">
              <button type="button" className="argos-corporate-cta" onClick={goNextMovement}>
                {nextLabel} →
              </button>
              <Link href="/metodo" className="argos-corporate-link-quiet" onClick={close}>
                {t("actions.viewMethod")}
              </Link>
            </div>
          </div>
        ) : null}
      </ArgosDetailDialog>
    </>
  );
}
