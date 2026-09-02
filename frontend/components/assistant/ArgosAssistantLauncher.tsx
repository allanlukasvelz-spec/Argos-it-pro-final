"use client";

import { useArgosAssistant } from "@/components/assistant/ArgosAssistantContext";
import { useI18n } from "@/i18n/useI18n";

/** Secondary entry — does not replace Hero diagnostic CTA. */
export default function ArgosAssistantLauncher() {
  const { t } = useI18n();
  const { open, openAssistant, closeAssistant } = useArgosAssistant();

  return (
    <button
      type="button"
      className="argos-assistant-launcher"
      aria-expanded={open}
      aria-controls="argos-assistant-root"
      onClick={() => (open ? closeAssistant() : openAssistant())}
    >
      {t("assistant.open")}
    </button>
  );
}
