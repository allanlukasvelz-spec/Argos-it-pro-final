"use client";

import Link from "next/link";
import { useEffect, useRef, type FormEvent } from "react";
import { useMascotChat } from "@/components/mascots/MascotChatContext";
import { useI18n } from "@/i18n/useI18n";
import { useMascotSpeech } from "@/speech/useMascotSpeech";

export default function MascotChatPanel() {
  const { t } = useI18n();
  const speak = useMascotSpeech();
  const {
    open,
    persona,
    messages,
    isLoading,
    error,
    panelId,
    headingId,
    closeChat,
    sendMessage
  } = useMascotChat();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKey);
    const tId = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(tId);
    };
  }, [open, closeChat]);

  useEffect(() => {
    if (!open) return;
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open, isLoading]);

  if (!open) return null;

  const title = persona === "chico" ? t("mascots.chat.titleChico") : t("mascots.chat.titleDumbo");

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

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
        className="mascot-chat-backdrop fixed inset-0 z-[75] bg-slate-950/50 backdrop-blur-[2px]"
        aria-label={t("mascots.chat.closeBackdrop")}
        onClick={closeChat}
      />
      <div
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="mascot-chat-panel fixed bottom-[min(28vh,220px)] left-3 right-3 z-[80] mx-auto flex max-h-[min(70vh,520px)] max-w-lg flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#07111f]/98 text-left shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-md sm:left-6 sm:right-6"
      >
        <div className="flex items-start justify-between gap-2 border-b border-white/10 px-4 py-3">
          <div>
            <h2 id={headingId} className="text-base font-black text-white">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">{t("mascots.chat.subtitle")}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            {lastAssistant ? (
              <button
                type="button"
                onClick={() => speak(lastAssistant.content, persona === "chico" ? "chico" : "dumbo")}
                className="rounded-lg border border-white/15 px-2 py-1 text-[11px] font-bold text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
              >
                {t("mascots.chat.readAloud")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={closeChat}
              className="rounded-lg border border-white/15 px-2 py-1 text-[11px] font-bold text-slate-200 transition hover:border-red-400/40 hover:text-white"
            >
              {t("mascots.chat.close")}
            </button>
          </div>
        </div>

        <div
          className="min-h-[160px] flex-1 space-y-3 overflow-y-auto px-4 py-3"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-cyan-500/25 text-cyan-50"
                  : "mr-auto border border-white/10 bg-white/[0.06] text-slate-100"
              }`}
            >
              {m.content}
            </div>
          ))}
          {isLoading ? (
            <p className="text-xs font-semibold text-slate-400">{t("mascots.chat.loading")}</p>
          ) : null}
          <div ref={listEndRef} />
        </div>

        {error ? (
          <div className="border-t border-red-500/20 bg-red-950/30 px-4 py-2 text-xs text-red-100">
            <p>{error}</p>
            <Link href="/contacto" className="mt-1 inline-block font-bold text-cyan-300 underline">
              {t("mascots.chat.contactLink")}
            </Link>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="border-t border-white/10 p-3">
          <label htmlFor="mascot-chat-input" className="sr-only">
            {t("mascots.chat.inputLabel")}
          </label>
          <textarea
            id="mascot-chat-input"
            ref={inputRef}
            name="message"
            rows={2}
            disabled={isLoading}
            placeholder={t("mascots.chat.placeholder")}
            className="mb-2 w-full resize-none rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-black text-[#030812] shadow-[0_0_24px_rgba(34,211,238,0.25)] transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {t("mascots.chat.send")}
          </button>
        </form>
      </div>
    </>
  );
}
