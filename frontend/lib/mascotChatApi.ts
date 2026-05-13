import axios, { type AxiosError } from "axios";

/**
 * Peticiones same-origin → Route Handler `app/api/ai/public/mascot-chat`
 * (reenvío al backend). Evita CORS y errores cuando el navegador no puede
 * llamar directamente a otro puerto u origen.
 */
const mascotHttp = axios.create({
  baseURL: "",
  headers: { "Content-Type": "application/json" }
});

export type MascotPersona = "dumbo" | "chico";

export type MascotChatApiError =
  | { kind: "network"; message: string }
  | { kind: "bad_request"; message: string }
  | { kind: "unavailable"; message: string }
  | { kind: "server"; message: string };

export async function postMascotChat(persona: MascotPersona, message: string): Promise<string> {
  try {
    const { data } = await mascotHttp.post<{ reply?: string; error?: string }>(
      "/api/ai/public/mascot-chat",
      { persona, message }
    );
    if (typeof data.reply !== "string" || !data.reply.trim()) {
      throw new Error("empty_reply");
    }
    return data.reply;
  } catch (e) {
    const err = e as AxiosError<{ error?: string; message?: string }>;
    const status = err.response?.status;
    const bodyMsg = err.response?.data?.error || err.response?.data?.message;
    if (status === 400 && bodyMsg) {
      const errOut: MascotChatApiError = { kind: "bad_request", message: String(bodyMsg) };
      throw errOut;
    }
    if (status === 503) {
      const errOut: MascotChatApiError = {
        kind: "unavailable",
        message: typeof bodyMsg === "string" ? bodyMsg : "unavailable"
      };
      throw errOut;
    }
    if (status && status >= 500) {
      const errOut: MascotChatApiError = {
        kind: "server",
        message: typeof bodyMsg === "string" ? bodyMsg : "server"
      };
      throw errOut;
    }
    const errOut: MascotChatApiError = {
      kind: "network",
      message: err.message || "network"
    };
    throw errOut;
  }
}
