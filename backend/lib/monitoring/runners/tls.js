const { observeTlsCertificate } = require("../../hostnameSecurity");
const { ERROR_CLASS } = require("../constants");
const { sanitizeEvidence } = require("../sanitizeEvidence");

/**
 * @param {{ hostname: string, timeoutMs?: number }} input
 */
async function runTlsCheck(input) {
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

  const started = Date.now();
  const obs = await observeTlsCertificate(hostname, input.timeoutMs || 8000);
  const latencyMs = Date.now() - started;

  if (!obs.ok) {
    const code = obs.code === "SSRF_BLOCKED" ? ERROR_CLASS.SSRF_BLOCKED : ERROR_CLASS.TLS_UNKNOWN;
    return {
      ok: false,
      errorClass: code,
      statusCode: null,
      latencyMs,
      evidence: sanitizeEvidence({
        observationStatus: obs.observationStatus || "UNKNOWN",
        error: obs.error,
        code: obs.code || null
      })
    };
  }

  const status = obs.observationStatus || "UNKNOWN";
  let errorClass = null;
  let ok = true;
  if (status === "EXPIRED") {
    ok = false;
    errorClass = ERROR_CLASS.TLS_EXPIRED;
  } else if (status === "EXPIRING") {
    ok = true; // still reachable; health engine maps to WARNING
    errorClass = ERROR_CLASS.TLS_EXPIRING;
  } else if (status === "HOSTNAME_MISMATCH") {
    ok = false;
    errorClass = ERROR_CLASS.TLS_HOSTNAME_MISMATCH;
  } else if (status === "CHAIN_ERROR") {
    ok = false;
    errorClass = ERROR_CLASS.TLS_CHAIN_ERROR;
  } else if (status === "UNKNOWN") {
    ok = false;
    errorClass = ERROR_CLASS.TLS_UNKNOWN;
  }

  return {
    ok,
    errorClass,
    statusCode: null,
    latencyMs,
    evidence: sanitizeEvidence({
      observationStatus: status,
      notAfter: obs.notAfter ? new Date(obs.notAfter).toISOString() : null,
      daysRemaining: obs.daysRemaining,
      hostnameMatch: obs.hostnameMatch,
      issuer: obs.issuer,
      fingerprintSha256: obs.fingerprintSha256
    })
  };
}

module.exports = { runTlsCheck };
