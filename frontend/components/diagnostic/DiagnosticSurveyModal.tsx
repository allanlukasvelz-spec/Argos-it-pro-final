"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { DiagnosticSurvey } from "./DiagnosticSurvey";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function DiagnosticSurveyModal({ open, onClose }: Props) {
  const titleId = useId().replace(/:/g, "");
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    try {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    } catch {
      returnFocusRef.current = null;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>('button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
      (focusable ?? panelRef.current)?.focus?.();
    }, 0);

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prevOverflow;
      queueMicrotask(() => returnFocusRef.current?.focus?.());
    };
  }, [open, onClose]);

  const onBackdropMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden bg-[#0B1E33]/72 px-4 py-6 backdrop-blur-sm sm:py-12"
      role="presentation"
      onMouseDown={onBackdropMouseDown}
    >
      <div className="mx-auto flex min-h-full items-center justify-center">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="relative w-full max-w-2xl overflow-hidden rounded-[1.25rem] border-2 border-[#22d3ee]/90 bg-[#f8fafc] shadow-[0_36px_100px_-32px_rgba(11,30,51,0.65)] outline-none lg:max-w-3xl"
        >
          <DiagnosticSurvey ariaTitleId={titleId} onRequestClose={onClose} />
        </div>
      </div>
    </div>,
    document.body
  );
}
