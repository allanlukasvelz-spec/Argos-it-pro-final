"use client";

import { Suspense } from "react";
import { useBrowserHistoryNav } from "@/hooks/useBrowserHistoryNav";
import { useI18n } from "@/i18n/useI18n";

/**
 * Controles de historial real: ← Anterior / Siguiente →
 * No siguen el orden del menú ni del sitemap.
 */
function CorporateHistoryNavInner() {
  const { t } = useI18n();
  const { canGoBack, canGoForward, goBack, goForward } = useBrowserHistoryNav();

  if (!canGoBack && !canGoForward) {
    return null;
  }

  return (
    <nav className="argos-history-nav" aria-label={t("history.navLabel")}>
      <button
        type="button"
        className="argos-history-nav__btn"
        onClick={goBack}
        disabled={!canGoBack}
        aria-disabled={!canGoBack}
      >
        ← {t("history.back")}
      </button>
      <button
        type="button"
        className="argos-history-nav__btn"
        onClick={goForward}
        disabled={!canGoForward}
        aria-disabled={!canGoForward}
      >
        {t("history.forward")} →
      </button>
    </nav>
  );
}

export default function CorporateHistoryNav() {
  return (
    <Suspense fallback={null}>
      <CorporateHistoryNavInner />
    </Suspense>
  );
}
