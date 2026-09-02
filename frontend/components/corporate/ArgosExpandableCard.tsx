"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import ArgosCard from "@/components/corporate/ArgosCard";
import ArgosDetailDialog from "@/components/corporate/ArgosDetailDialog";

type Variant = "default" | "service" | "method" | "pillar" | "quiet";

type Props = {
  title: string;
  summary: ReactNode;
  detail: ReactNode;
  expandLabel: string;
  variant?: Variant;
  className?: string;
};

/**
 * Summary-first card with Detail Mode for full approved content.
 * Expansion action is a real button — not a pseudo-interactive card shell.
 */
export default function ArgosExpandableCard({
  title,
  summary,
  detail,
  expandLabel,
  variant = "default",
  className = ""
}: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const detailTitleId = useId();

  return (
    <>
      <ArgosCard variant={variant} className={`argos-expandable-card ${className}`.trim()}>
        <div className="argos-expandable-card__content">
          <h3 className="argos-corp-card-title">{title}</h3>
          <div className="argos-expandable-card__summary">{summary}</div>
        </div>
        <button
          ref={triggerRef}
          type="button"
          className="argos-expandable-card__action argos-btn-detail"
          aria-expanded={open}
          aria-controls={detailTitleId}
          onClick={() => setOpen(true)}
        >
          {expandLabel}
        </button>
      </ArgosCard>

      <ArgosDetailDialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        returnFocusRef={triggerRef}
      >
        <div id={detailTitleId}>{detail}</div>
      </ArgosDetailDialog>
    </>
  );
}
