import axios, { type AxiosError } from "axios";

const http = axios.create({
  baseURL: "",
  headers: { "Content-Type": "application/json" }
});

export type AssistantAction = "OPEN_DIAGNOSTIC" | "OPEN_CONTACT" | "NONE";

export type AssistantChatState =
  | "READY"
  | "UNAVAILABLE"
  | "ERROR"
  | "RATE_LIMITED";

export type AssistantChatResponse = {
  reply?: string;
  conversationId?: string;
  action?: AssistantAction;
  state?: AssistantChatState;
  error?: string;
  message?: string;
};

export type AssistantApiError =
  | { kind: "bad_request"; message: string }
  | { kind: "unavailable"; message: string }
  | { kind: "rate_limited"; message: string }
  | { kind: "server"; message: string }
  | { kind: "network"; message: string };

const ALLOWED: ReadonlySet<string> = new Set(["OPEN_DIAGNOSTIC", "OPEN_CONTACT", "NONE"]);

function normalizeAction(raw: unknown): AssistantAction {
  if (typeof raw === "string" && ALLOWED.has(raw)) return raw as AssistantAction;
  return "NONE";
}

export async function postAssistantChat(
  message: string,
  conversationId?: string | null
): Promise<AssistantChatResponse> {
  try {
    const { data, status } = await http.post<AssistantChatResponse>("/api/assistant/chat", {
      message,
      conversationId: conversationId || undefined
    });
    if (status === 429) {
      const err: AssistantApiError = {
        kind: "rate_limited",
        message: data.message || "Demasiadas solicitudes. Espera un momento."
      };
      throw err;
    }
    return {
      ...data,
      action: normalizeAction(data.action)
    };
  } catch (e) {
    const err = e as AxiosError<AssistantChatResponse> & AssistantApiError;
    if (err.kind) throw err;
    const status = err.response?.status;
    const body = err.response?.data;
    const bodyMsg = body?.message || body?.error || "";
    if (status === 400) {
      const out: AssistantApiError = { kind: "bad_request", message: String(bodyMsg || "bad_request") };
      throw out;
    }
    if (status === 429) {
      const out: AssistantApiError = {
        kind: "rate_limited",
        message: String(bodyMsg || "Demasiadas solicitudes. Espera un momento.")
      };
      throw out;
    }
    if (status === 503) {
      const out: AssistantApiError = {
        kind: "unavailable",
        message:
          typeof bodyMsg === "string" && bodyMsg
            ? bodyMsg
            : "El asistente no está disponible en este momento."
      };
      throw out;
    }
    if (status && status >= 500) {
      const out: AssistantApiError = {
        kind: "server",
        message: "El asistente no está disponible en este momento."
      };
      throw out;
    }
    const out: AssistantApiError = { kind: "network", message: err.message || "network" };
    throw out;
  }
}
