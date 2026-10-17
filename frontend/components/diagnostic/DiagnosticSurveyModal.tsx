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

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = panelRef.current;
      if (!root) return;
      const list = [...root.querySelectorAll<HTMLElement>("button, a[href], input, textarea, select, [tabindex]")].filter((el) => {
        if (el.hasAttribute("disabled") || el.getAttribute("tabindex") === "-1") return false;
        const style = window.getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden";
      });
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && root.contains(active);
      if (e.shiftKey && (active === first || active === root || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || active === root || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
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
      className="argos-diag-modal"
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
          className="argos-diag-modal__panel"
        >
          <DiagnosticSurvey ariaTitleId={titleId} onRequestClose={onClose} />
        </div>
      </div>
    </div>,
    document.body
  );
}
