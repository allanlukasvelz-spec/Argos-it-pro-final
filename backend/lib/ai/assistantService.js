/**
 * ARGOS public conversational assistant orchestration.
 */

const { normalizeChatMessage } = require("../aiMessage");
const { buildAssistantSystemPrompt } = require("./systemPrompt");
const { generateResponse, isProviderConfigured, AiProviderError, healthCheck } = require("./provider");
const {
  detectInjectionAttempt,
  detectEscalationIntent,
  detectDiagnosticOffer,
  responseContainsBlockedClaim,
  sanitizeAssistantOutput,
  extractAction
} = require("./guards");
const { appendMessage, getMessages, isValidConversationId } = require("./conversationStore");

const UNAVAILABLE_MESSAGE =
  "El asistente no está disponible en este momento. Puedes iniciar el diagnóstico ARGOS o usar el formulario de contacto del sitio.";

const INJECTION_REFUSAL =
  "No puedo cambiar mis reglas ni revelar información interna del sistema. Si tienes una duda técnica sobre tu empresa, cuéntamela con normalidad; si prefieres, puedes contactar con el equipo ARGOS o iniciar el diagnóstico.";

/**
 * @param {{ message: unknown, conversationId?: unknown }} input
 */
async function handleAssistantChat(input) {
  const { ok, error, message } = normalizeChatMessage(input.message);
  if (!ok) {
    return { status: 400, body: { error: "bad_request", message: error } };
  }

  let conversationId =
    typeof input.conversationId === "string" ? input.conversationId.trim() : undefined;
  if (conversationId && !isValidConversationId(conversationId)) {
    return {
      status: 400,
      body: { error: "bad_request", message: "conversationId no valido." }
    };
  }

  // Architectural refusal for injection — do not call the provider
  if (detectInjectionAttempt(message)) {
    const stored = appendMessage(conversationId, "user", message);
    const reply = INJECTION_REFUSAL;
    appendMessage(stored.conversationId, "assistant", reply);
    return {
      status: 200,
      body: {
        reply,
        conversationId: stored.conversationId,
        action: "OPEN_CONTACT",
        state: "READY"
      }
    };
  }

  if (!isProviderConfigured()) {
    return {
      status: 503,
      body: {
        error: "assistant_unavailable",
        message: UNAVAILABLE_MESSAGE,
        action: "NONE",
        state: "UNAVAILABLE"
      }
    };
  }

  const prior = conversationId ? getMessages(conversationId) : [];
  const withUser = appendMessage(conversationId, "user", message);
  conversationId = withUser.conversationId;

  const history = getMessages(conversationId).map((m) => ({
    role: m.role,
    content: m.content
  }));

  const messages = [{ role: "system", content: buildAssistantSystemPrompt() }, ...history];

  try {
    const result = await generateResponse({ messages });
    let { action, cleaned } = extractAction(result.text);
    cleaned = sanitizeAssistantOutput(cleaned);

    if (responseContainsBlockedClaim(cleaned)) {
      cleaned =
        "Prefiero no afirmar capacidades absolutas o no verificadas. Puedo ayudarte a entender riesgos y siguientes pasos con criterio, o orientarte al diagnóstico ARGOS / contacto humano.";
      action = detectEscalationIntent(message) ? "OPEN_CONTACT" : "NONE";
    }

    // Deterministic action hints when model omits action tag
    if (action === "NONE") {
      if (detectEscalationIntent(message)) action = "OPEN_CONTACT";
      else if (detectDiagnosticOffer(message)) action = "OPEN_DIAGNOSTIC";
    }

    appendMessage(conversationId, "assistant", cleaned);

    return {
      status: 200,
      body: {
        reply: cleaned,
        conversationId,
        action,
        state: "READY",
        provider: result.provider,
        model: result.model
      }
    };
  } catch (err) {
    const code = err instanceof AiProviderError ? err.code : "PROVIDER_ERROR";
    if (
      code === "UNAVAILABLE" ||
      code === "TIMEOUT" ||
      code === "PROVIDER_ERROR" ||
      code === "AUTH_FAILURE" ||
      code === "RATE_LIMITED" ||
      code === "PROVIDER_5XX" ||
      code === "EMPTY_RESPONSE"
    ) {
      console.warn("[assistant-chat]", code);
      const status = code === "RATE_LIMITED" ? 429 : 503;
      return {
        status,
        body: {
          error: code === "RATE_LIMITED" ? "rate_limited" : "assistant_unavailable",
          message: UNAVAILABLE_MESSAGE,
          conversationId,
          action: "NONE",
          state: code === "RATE_LIMITED" ? "RATE_LIMITED" : "UNAVAILABLE"
        }
      };
    }
    console.error("[assistant-chat]", err);
    return {
      status: 500,
      body: {
        error: "server_error",
        message: UNAVAILABLE_MESSAGE,
        conversationId,
        action: "NONE",
        state: "ERROR"
      }
    };
  }
}

module.exports = {
  handleAssistantChat,
  UNAVAILABLE_MESSAGE,
  healthCheck
};
