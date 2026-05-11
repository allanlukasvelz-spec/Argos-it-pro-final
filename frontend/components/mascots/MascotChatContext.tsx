"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { useI18n } from "@/i18n/useI18n";
import { postMascotChat, type MascotChatApiError, type MascotPersona } from "@/lib/mascotChatApi";

export type MascotChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type MascotChatContextValue = {
  open: boolean;
  persona: MascotPersona;
  messages: MascotChatMessage[];
  isLoading: boolean;
  error: string | null;
  panelId: string;
  headingId: string;
  openChat: (persona: MascotPersona) => void;
  closeChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  isOpenFor: (persona: MascotPersona) => boolean;
};

const MascotChatContext = createContext<MascotChatContextValue | null>(null);

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function mapApiError(e: unknown, t: (k: string) => string): string {
  if (!e || typeof e !== "object" || !("kind" in e)) {
    return t("mascots.chat.errorGeneric");
  }
  const ae = e as MascotChatApiError;
  switch (ae.kind) {
    case "unavailable":
      return t("mascots.chat.errorUnavailable");
    case "bad_request":
      return ae.message && ae.message !== "unavailable" ? ae.message : t("mascots.chat.errorBadRequest");
    case "network":
      return t("mascots.chat.errorNetwork");
    case "server":
    default:
      return t("mascots.chat.errorGeneric");
  }
}

export function MascotChatProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const panelId = useId();
  const headingId = `${panelId}-heading`;
  const [open, setOpen] = useState(false);
  const [persona, setPersona] = useState<MascotPersona>("dumbo");
  const [messages, setMessages] = useState<MascotChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeChat = useCallback(() => {
    setOpen(false);
    setError(null);
  }, []);

  const openChat = useCallback(
    (p: MascotPersona) => {
      if (open && persona === p) {
        closeChat();
        return;
      }
      setPersona(p);
      setOpen(true);
      setError(null);
      const welcomeKey = `mascots.messages.idle.${p}` as const;
      setMessages([
        {
          id: newId(),
          role: "assistant",
          content: t(welcomeKey)
        }
      ]);
    },
    [t, open, persona, closeChat]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;
      setError(null);
      const userMsg: MascotChatMessage = { id: newId(), role: "user", content: trimmed };
      setMessages((m) => [...m, userMsg]);
      setIsLoading(true);
      try {
        const reply = await postMascotChat(persona, trimmed);
        setMessages((m) => [...m, { id: newId(), role: "assistant", content: reply }]);
      } catch (e) {
        setError(mapApiError(e, t));
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, persona, t]
  );

  const isOpenFor = useCallback((p: MascotPersona) => open && persona === p, [open, persona]);

  const value = useMemo(
    () => ({
      open,
      persona,
      messages,
      isLoading,
      error,
      panelId,
      headingId,
      openChat,
      closeChat,
      sendMessage,
      isOpenFor
    }),
    [open, persona, messages, isLoading, error, panelId, headingId, openChat, closeChat, sendMessage, isOpenFor]
  );

  return <MascotChatContext.Provider value={value}>{children}</MascotChatContext.Provider>;
}

export function useMascotChat() {
  const ctx = useContext(MascotChatContext);
  if (!ctx) {
    throw new Error("useMascotChat must be used within MascotChatProvider");
  }
  return ctx;
}
