/**
 * Redact remediation payloads before audit / API responses.
 * Does not drop keys silently — replaces secrets with [REDACTED].
 */

const SECRET_KEYS = new Set([
  "password",
  "passwd",
  "secret",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "api_key",
  "apikey",
  "private_key",
  "privateKey",
  "jwt",
  "cookie",
  "credentials",
  "set-cookie"
]);

function isSecretKey(key) {
  const k = String(key || "").toLowerCase();
  if (SECRET_KEYS.has(k)) return true;
  return k.includes("password") || k.includes("secret") || k.includes("token") || k.includes("private");
}

function redactValue(key, value, depth = 0) {
  if (depth > 8) return "[truncated]";
  if (isSecretKey(key)) return "[REDACTED]";
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 2000) return `${value.slice(0, 2000)}…[truncated]`;
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v, i) => redactValue(String(i), v, depth + 1));
  }
  if (typeof value === "object") {
    const out = {};
    for (const [kk, vv] of Object.entries(value)) {
      out[kk] = redactValue(kk, vv, depth + 1);
    }
    return out;
  }
  return value;
}

function sanitizeRemediationPayload(payload) {
  if (payload == null || typeof payload !== "object") return {};
  return redactValue("root", Array.isArray(payload) ? { items: payload } : payload);
}

module.exports = {
  sanitizeRemediationPayload,
  redactValue,
  SECRET_KEYS
};
