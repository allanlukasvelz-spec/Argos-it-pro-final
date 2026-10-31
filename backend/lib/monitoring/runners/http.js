const { safeHttpProbe } = require("../ssrfHttp");
const { ERROR_CLASS } = require("../constants");
const { sanitizeEvidence } = require("../sanitizeEvidence");

/**
 * @param {{ hostname: string, timeoutMs?: number, config?: object }} input
 */
async function runHttpCheck(input) {
  const hostname = input.hostname;
  if (!hostname) {
    return {
      ok: false,
      errorClass: ERROR_CLASS.RUNNER_ERROR,
      statusCode: null,
      latencyMs: null,
      evidence: sanitizeEvidence({ reason: "missing_hostname" })
    };
  }
  const cfg = input.config && typeof input.config === "object" ? input.config : {};
  const protocol = cfg.protocol === "http" ? "http" : "https";
  const result = await safeHttpProbe(hostname, {
    protocol,
    path: cfg.path || "/",
    method: cfg.method || "GET",
    timeoutMs: input.timeoutMs,
    port: cfg.port
  });
  return {
    ok: Boolean(result.ok),
    errorClass: result.errorClass || null,
    statusCode: result.statusCode,
    latencyMs: result.latencyMs,
    evidence: sanitizeEvidence(result.evidence || {})
  };
}

module.exports = { runHttpCheck };
