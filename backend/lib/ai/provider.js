/**
 * AI provider abstraction — server-side only.
 */

class AiProviderError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = "AiProviderError";
    this.code = code;
  }
}

/**
 * @returns {"openai"|"none"|string}
 */
function resolveProviderName() {
  const raw = String(process.env.AI_PROVIDER || "").trim().toLowerCase();
  if (raw === "none" || raw === "off" || raw === "disabled") return "none";
  if (raw === "openai" || raw === "") {
    if (process.env.OPENAI_API_KEY) return "openai";
    if (raw === "openai") return "openai";
    return "none";
  }
  return raw;
}

function isProviderConfigured() {
  const name = resolveProviderName();
  if (name === "openai") return Boolean(process.env.OPENAI_API_KEY);
  return false;
}

function getConfiguredModel() {
  return process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
}

/**
 * @returns {Promise<{ ok: boolean, provider: string, model: string, reason?: string }>}
 */
async function healthCheck() {
  const provider = resolveProviderName();
  const model = getConfiguredModel();
  if (provider === "none" || !isProviderConfigured()) {
    return { ok: false, provider, model, reason: "unconfigured" };
  }
  return { ok: true, provider, model };
}

/**
 * @param {{ messages: Array<{role:string,content:string}>, maxTokens?: number, temperature?: number }} params
 */
async function generateResponse(params) {
  const provider = resolveProviderName();
  if (provider === "none" || !isProviderConfigured()) {
    throw new AiProviderError("UNAVAILABLE", "AI provider not configured");
  }
  if (provider === "openai") {
    return require("./openaiProvider").generateOpenAiResponse(params);
  }
  throw new AiProviderError("UNSUPPORTED_PROVIDER", `Unsupported AI_PROVIDER: ${provider}`);
}

module.exports = {
  AiProviderError,
  resolveProviderName,
  isProviderConfigured,
  getConfiguredModel,
  healthCheck,
  generateResponse
};
