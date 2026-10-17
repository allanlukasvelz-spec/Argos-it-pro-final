const { safeEmailAddress } = require("./headers");

function readSmtpConfig(env = process.env) {
  const port = Number(env.SMTP_PORT);
  const secureRaw = String(env.SMTP_SECURE || "").trim().toLowerCase();
  let secure = port === 465;
  if (secureRaw === "true" || secureRaw === "1") secure = true;
  if (secureRaw === "false" || secureRaw === "0") secure = false;
  const timeoutMs = Number(env.SMTP_TIMEOUT_MS);
  return {
    host: String(env.SMTP_HOST || "").trim(),
    port,
    secure,
    user: String(env.SMTP_USER || "").trim(),
    password: String(env.SMTP_PASSWORD || ""),
    from: safeEmailAddress(env.EMAIL_FROM),
    contactTo: safeEmailAddress(env.CONTACT_EMAIL_TO),
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs >= 1000 && timeoutMs <= 30000 ? timeoutMs : 10000
  };
}

function smtpConfigProblems(config) {
  const problems = [];
  if (!config.host || /[\s\r\n]/.test(config.host)) problems.push("SMTP_HOST");
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) problems.push("SMTP_PORT");
  if (!config.user || /[\r\n]/.test(config.user)) problems.push("SMTP_USER");
  if (!config.password) problems.push("SMTP_PASSWORD");
  if (!config.from) problems.push("EMAIL_FROM");
  if (!config.contactTo) problems.push("CONTACT_EMAIL_TO");
  return problems;
}

module.exports = {
  readSmtpConfig,
  smtpConfigProblems
};
