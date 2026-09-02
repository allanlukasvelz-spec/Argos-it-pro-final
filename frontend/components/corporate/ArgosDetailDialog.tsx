"use client";

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Optional id of the element that opened the dialog (focus restore). */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
};

/**
 * Accessible Detail Mode — calm overlay, focus trap, ESC close, scroll lock.
 * Corporate styling; reuses portal pattern from DiagnosticSurveyModal.
 */
export default function ArgosDetailDialog({
  open,
  onClose,
  title,
  children,
  returnFocusRef
}: Props) {
  const titleId = useId().replace(/:/g, "");
  const panelRef = useRef<HTMLDivElement>(null);
  const capturedFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    capturedFocusRef.current =
      returnFocusRef?.current ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarGap = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }
    document.body.dataset.detailModeOpen = "true";

    const timer = window.setTimeout(() => {
      const closeBtn = panelRef.current?.querySelector<HTMLElement>("[data-detail-close]");
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      (closeBtn ?? focusable ?? panelRef.current)?.focus?.();
    }, 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      delete document.body.dataset.detailModeOpen;
      queueMicrotask(() => {
        (returnFocusRef?.current ?? capturedFocusRef.current)?.focus?.();
      });
    };
  }, [open, onClose, returnFocusRef]);

  const onBackdropMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="argos-detail-overlay"
      role="presentation"
      onMouseDown={onBackdropMouseDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="argos-detail-dialog"
      >
        <header className="argos-detail-dialog__header">
          <h2 id={titleId} className="argos-detail-dialog__title">
            {title}
          </h2>
          <button
            type="button"
            className="argos-detail-dialog__close"
            data-detail-close
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>
        <div className="argos-detail-dialog__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
