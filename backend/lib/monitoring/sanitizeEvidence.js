/**
 * Cap evidence JSON size; strip secrets-ish keys.
 */
const { EVIDENCE_MAX_BYTES } = require("./constants");

const BLOCKED_EVIDENCE_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "password",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "privateKey",
  "private_key"
]);

function sanitizeEvidence(input) {
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const out = {};
  for (const [k, v] of Object.entries(src)) {
    if (BLOCKED_EVIDENCE_KEYS.has(String(k).toLowerCase())) continue;
    out[k] = v;
  }
  let json = JSON.stringify(out);
  if (json.length > EVIDENCE_MAX_BYTES) {
    json = JSON.stringify({
      truncated: true,
      note: "evidence capped",
      keys: Object.keys(out).slice(0, 20)
    });
  }
  return JSON.parse(json);
}

module.exports = {
  sanitizeEvidence
};
