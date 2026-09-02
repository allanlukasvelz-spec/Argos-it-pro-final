"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  postAssistantChat,
  type AssistantAction,
  type AssistantApiError
} from "@/lib/assistantChatApi";

export type AssistantUiState =
  | "IDLE"
  | "SENDING"
  | "RESPONDING"
  | "ERROR"
  | "RATE_LIMITED"
  | "UNAVAILABLE";

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

type AssistantContextValue = {
  open: boolean;
  uiState: AssistantUiState;
  messages: AssistantMessage[];
  conversationId: string | null;
  lastAction: AssistantAction;
  errorMessage: string | null;
  openAssistant: () => void;
  closeAssistant: () => void;
  sendMessage: (text: string) => Promise<void>;
  clearError: () => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ArgosAssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [uiState, setUiState] = useState<AssistantUiState>("IDLE");
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<AssistantAction>("NONE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openAssistant = useCallback(() => {
    setOpen(true);
    setErrorMessage(null);
    if (messages.length === 0) {
      setMessages([
        {
          id: newId(),
          role: "assistant",
          content:
            "Hola. Soy el asistente de ARGOS-IT. Cuéntame qué te preocupa de tu tecnología (sistemas, seguridad, copias, web…) y te ayudo a aclararlo. No envíes contraseñas ni claves."
        }
      ]);
    }
    setUiState("IDLE");
    try {
      window.dispatchEvent(new CustomEvent("argos-assistant", { detail: { event: "assistant_opened" } }));
    } catch {
      /* ignore */
    }
  }, [messages.length]);

  const closeAssistant = useCallback(() => {
    setOpen(false);
    setErrorMessage(null);
    setUiState("IDLE");
  }, []);

  const clearError = useCallback(() => setErrorMessage(null), []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || uiState === "SENDING" || uiState === "RESPONDING") return;

      setErrorMessage(null);
      setLastAction("NONE");
      setMessages((m) => [...m, { id: newId(), role: "user", content: trimmed }]);
      setUiState("SENDING");

      try {
        window.dispatchEvent(
          new CustomEvent("argos-assistant", { detail: { event: "assistant_message_sent" } })
        );
      } catch {
        /* ignore */
      }

      try {
        setUiState("RESPONDING");
        const data = await postAssistantChat(trimmed, conversationId);
        if (data.conversationId) setConversationId(data.conversationId);
        const action = data.action || "NONE";
        setLastAction(action);

        if (data.reply) {
          setMessages((m) => [...m, { id: newId(), role: "assistant", content: data.reply! }]);
        }

        if (data.state === "UNAVAILABLE" || (!data.reply && data.error === "assistant_unavailable")) {
          setUiState("UNAVAILABLE");
          setErrorMessage(
            data.message || "El asistente no está disponible en este momento."
          );
        } else {
          setUiState("IDLE");
        }

        try {
          window.dispatchEvent(
            new CustomEvent("argos-assistant", {
              detail: { event: "assistant_response_completed", action }
            })
          );
        } catch {
          /* ignore */
        }
      } catch (e) {
        const err = e as AssistantApiError;
        try {
          window.dispatchEvent(
            new CustomEvent("argos-assistant", { detail: { event: "assistant_error", kind: err.kind } })
          );
        } catch {
          /* ignore */
        }
        if (err.kind === "rate_limited") {
          setUiState("RATE_LIMITED");
          setErrorMessage(err.message);
        } else if (err.kind === "unavailable") {
          setUiState("UNAVAILABLE");
          setErrorMessage(err.message);
        } else if (err.kind === "bad_request") {
          setUiState("ERROR");
          setErrorMessage(err.message);
        } else {
          setUiState("ERROR");
          setErrorMessage("El asistente no está disponible en este momento.");
        }
      }
    },
    [conversationId, uiState]
  );

  const value = useMemo(
    () => ({
      open,
      uiState,
      messages,
      conversationId,
      lastAction,
      errorMessage,
      openAssistant,
      closeAssistant,
      sendMessage,
      clearError
    }),
    [
      open,
      uiState,
      messages,
      conversationId,
      lastAction,
      errorMessage,
      openAssistant,
      closeAssistant,
      sendMessage,
      clearError
    ]
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useArgosAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useArgosAssistant must be used within ArgosAssistantProvider");
  return ctx;
}
