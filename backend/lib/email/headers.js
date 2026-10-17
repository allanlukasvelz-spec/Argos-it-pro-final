const { validateEmailFormat } = require("../../middleware/security");

function stripHeaderBreaks(value) {
  return String(value || "").replace(/[\u0000\r\n]+/g, " ").trim();
}

function safeEmailAddress(value) {
  const cleaned = stripHeaderBreaks(value).toLowerCase();
  if (!validateEmailFormat(cleaned)) return null;
  return cleaned;
}

function safeSubject(value) {
  const cleaned = stripHeaderBreaks(value).slice(0, 200);
  return cleaned || "ARGOS-IT";
}

function safeText(value) {
  return String(value || "").replace(/\u0000/g, "").slice(0, 20000);
}

module.exports = {
  stripHeaderBreaks,
  safeEmailAddress,
  safeSubject,
  safeText
};
