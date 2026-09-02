/**
 * OpenAI chat completions adapter (lazy-loaded SDK).
 */

const { AiProviderError, getConfiguredModel } = require("./provider");

const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 45000);
const DEFAULT_MAX_TOKENS = Number(process.env.AI_MAX_OUTPUT_TOKENS || 700);

function openaiTimedOut(err) {
  const name = String(err?.name || "");
  const code = String(err?.code || "");
  const msg = String(err?.message || "");
  return (
    code === "ETIMEDOUT" ||
    /\btimeout\b/i.test(msg) ||
    name === "APIConnectionTimeoutError" ||
    name === "AbortError"
  );
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new AiProviderError("UNAVAILABLE", "OPENAI_API_KEY no configurada");
  }
  const OpenAI = require("openai");
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: OPENAI_TIMEOUT_MS
  });
}

/**
 * @param {{ messages: Array<{role:string,content:string}>, maxTokens?: number, temperature?: number }} params
 */
async function generateOpenAiResponse(params) {
  const openai = getOpenAIClient();
  const model = getConfiguredModel();
  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: params.messages,
      max_tokens: params.maxTokens || DEFAULT_MAX_TOKENS,
      temperature: typeof params.temperature === "number" ? params.temperature : 0.4
    });
    const text = completion.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      throw new AiProviderError("EMPTY_RESPONSE", "Empty model response");
    }
    return { text: text.trim(), model, provider: "openai" };
  } catch (err) {
    if (err instanceof AiProviderError) throw err;
    if (openaiTimedOut(err)) {
      throw new AiProviderError("TIMEOUT", "Provider timeout");
    }
    const status = Number(err?.status || err?.statusCode || err?.response?.status || 0);
    if (status === 401 || status === 403) {
      throw new AiProviderError("AUTH_FAILURE", "Provider auth failure");
    }
    if (status === 429) {
      throw new AiProviderError("RATE_LIMITED", "Provider rate limited");
    }
    if (status >= 500) {
      throw new AiProviderError("PROVIDER_5XX", "Provider server error");
    }
    throw new AiProviderError("PROVIDER_ERROR", "Provider request failed");
  }
}

module.exports = {
  generateOpenAiResponse,
  openaiTimedOut
};
