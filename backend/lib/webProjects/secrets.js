const { WebProjectError } = require("./errors");

/**
 * Conservative secret rejection. Avoids blocking legitimate Spanish copy
 * such as "contraseña olvidada" or "WordPress".
 * Only obvious private-key blocks and password assignments.
 */
const PRIVATE_KEY = /-----BEGIN [A-Z ]*PRIVATE KEY-----/;
const ASSIGNED_SECRET = /\b(password|passwd|api[_-]?key|secret[_-]?key|private[_-]?key)\s*[:=]\s*\S{8,}/i;

function looksLikeSecret(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value || "");
  if (!text) return false;
  if (PRIVATE_KEY.test(text)) return true;
  if (ASSIGNED_SECRET.test(text)) return true;
  return false;
}

function rejectIfSecret(value, context) {
  if (looksLikeSecret(value)) {
    throw new WebProjectError(
      400,
      "SECRET_REJECTED",
      `No se pueden almacenar secretos en ${context}`
    );
  }
}

module.exports = { looksLikeSecret, rejectIfSecret };
