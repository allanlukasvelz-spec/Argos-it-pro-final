const {
  validatePublicHostname,
  resolvePublicAddresses
} = require("../../hostnameSecurity");
const { ERROR_CLASS } = require("../constants");
const { sanitizeEvidence } = require("../sanitizeEvidence");

/**
 * @param {{ hostname: string, config?: object }} input
 */
async function runDnsCheck(input) {
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

  const v = validatePublicHostname(hostname);
  if (!v.ok) {
    return {
      ok: false,
      errorClass: ERROR_CLASS.SSRF_BLOCKED,
      statusCode: null,
      latencyMs: null,
      evidence: sanitizeEvidence({ reason: v.error })
    };
  }

  const started = Date.now();
  const dns = await resolvePublicAddresses(v.hostname);
  const latencyMs = Date.now() - started;

  if (dns.blocked) {
    return {
      ok: false,
      errorClass: ERROR_CLASS.SSRF_BLOCKED,
      statusCode: null,
      latencyMs,
      evidence: sanitizeEvidence({ error: dns.error, blocked: true })
    };
  }

  const hasRecords = (dns.a && dns.a.length) || (dns.aaaa && dns.aaaa.length) || (dns.cname && dns.cname.length);
  if (!hasRecords) {
    return {
      ok: false,
      errorClass: ERROR_CLASS.DNS_NXDOMAIN,
      statusCode: null,
      latencyMs,
      evidence: sanitizeEvidence({
        a: dns.a || [],
        aaaa: dns.aaaa || [],
        cname: dns.cname || [],
        error: dns.error || "Sin registros A/AAAA/CNAME"
      })
    };
  }

  // Optional baseline drift (DETECTED) — does not invent PREDICTED
  const baseline = input.config?.baseline;
  let drift = null;
  if (baseline && typeof baseline === "object") {
    const baseA = Array.isArray(baseline.a) ? baseline.a.slice().sort().join(",") : "";
    const nowA = (dns.a || []).slice().sort().join(",");
    if (baseA && nowA && baseA !== nowA) {
      drift = { type: "A_RECORD_CHANGE", previous: baseline.a, current: dns.a };
    }
  }

  return {
    ok: true,
    errorClass: drift ? ERROR_CLASS.DNS_FAILURE : null,
    statusCode: null,
    latencyMs,
    evidence: sanitizeEvidence({
      a: (dns.a || []).slice(0, 10),
      aaaa: (dns.aaaa || []).slice(0, 10),
      cname: (dns.cname || []).slice(0, 5),
      mx: dns.mx || [],
      drift
    }),
    // Treat unexpected DNS change as soft-fail for alerting (WARNING), still "ok" for connectivity
    warningOnly: Boolean(drift)
  };
}

module.exports = { runDnsCheck };
