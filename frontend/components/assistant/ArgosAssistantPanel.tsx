"use client";

import Link from "next/link";
import { useEffect, useId, useRef, type FormEvent } from "react";
import { useDiagnosticSurveyLauncher } from "@/components/diagnostic/DiagnosticSurveyLauncher";
import { useArgosAssistant } from "@/components/assistant/ArgosAssistantContext";
import { useI18n } from "@/i18n/useI18n";

export default function ArgosAssistantPanel() {
  const { t } = useI18n();
  const {
    open,
    uiState,
    messages,
    lastAction,
    errorMessage,
    closeAssistant,
    sendMessage,
    clearError
  } = useArgosAssistant();
  const { openDiagnostic } = useDiagnosticSurveyLauncher();
  const titleId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAssistant();
    };
    window.addEventListener("keydown", onKey);
    const tId = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(tId);
    };
  }, [open, closeAssistant]);

  useEffect(() => {
    if (!open) return;
    listEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, open, uiState]);

  useEffect(() => {
    if (!open) return;
    if (lastAction === "OPEN_DIAGNOSTIC") {
      try {
        window.dispatchEvent(
          new CustomEvent("argos-assistant", { detail: { event: "assistant_diagnostic_launched" } })
        );
      } catch {
        /* ignore */
      }
    }
    if (lastAction === "OPEN_CONTACT") {
      try {
        window.dispatchEvent(
          new CustomEvent("argos-assistant", { detail: { event: "assistant_handoff" } })
        );
      } catch {
        /* ignore */
      }
    }
  }, [lastAction, open]);

  if (!open) return null;

  const busy = uiState === "SENDING" || uiState === "RESPONDING";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const val = inputRef.current?.value ?? "";
    void sendMessage(val);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <button
        type="button"
        className="argos-assistant-backdrop"
        aria-label={t("assistant.close")}
        onClick={closeAssistant}
      />
      <div
        className="argos-assistant-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="argos-assistant-panel__header">
          <div>
            <h2 id={titleId} className="argos-assistant-panel__title">
              {t("assistant.title")}
            </h2>
            <p className="argos-assistant-panel__subtitle">{t("assistant.subtitle")}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="argos-assistant-panel__close"
            onClick={closeAssistant}
          >
            {t("assistant.close")}
          </button>
        </header>

        <p className="argos-assistant-panel__privacy">{t("assistant.privacyNote")}</p>

        <div className="argos-assistant-panel__messages" aria-live="polite">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`argos-assistant-msg argos-assistant-msg--${m.role}`}
            >
              <p>{m.content}</p>
            </div>
          ))}
          {busy ? (
            <p className="argos-assistant-panel__status">{t("assistant.thinking")}</p>
          ) : null}
          <div ref={listEndRef} />
        </div>

        {errorMessage ? (
          <div className="argos-assistant-panel__error" role="alert">
            <p>{errorMessage}</p>
            <button type="button" className="argos-corporate-link-quiet" onClick={clearError}>
              {t("assistant.dismissError")}
            </button>
          </div>
        ) : null}

        {(uiState === "UNAVAILABLE" || uiState === "ERROR" || uiState === "RATE_LIMITED" || lastAction !== "NONE") && (
          <div className="argos-assistant-panel__handoffs">
            <button
              type="button"
              className="argos-corporate-cta"
              onClick={() => {
                closeAssistant();
                openDiagnostic();
              }}
            >
              {t("nav.startDiagnostic")}
            </button>
            <Link
              href="/contacto"
              className="argos-corporate-btn-secondary"
              onClick={closeAssistant}
            >
              {t("assistant.contactCta")}
            </Link>
          </div>
        )}

        <form className="argos-assistant-panel__form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="argos-assistant-input">
            {t("assistant.inputLabel")}
          </label>
          <textarea
            id="argos-assistant-input"
            ref={inputRef}
            className="argos-assistant-panel__input"
            rows={2}
            maxLength={2000}
            placeholder={t("assistant.placeholder")}
            disabled={busy || uiState === "UNAVAILABLE"}
          />
          <button
            type="submit"
            className="argos-corporate-cta argos-assistant-panel__send"
            disabled={busy || uiState === "UNAVAILABLE"}
          >
            {t("assistant.send")}
          </button>
        </form>
      </div>
    </>
  );
}
