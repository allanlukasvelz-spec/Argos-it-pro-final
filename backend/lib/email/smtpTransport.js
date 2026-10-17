const { readSmtpConfig, smtpConfigProblems } = require("./smtpConfig");
const { safeEmailAddress, safeSubject, safeText } = require("./headers");
const { createNodeSmtpTransporter } = require("./smtpSession");

const MAX_SMTP_ATTEMPTS = 1;
let testTransporter = null;

function setSmtpTransporterForTests(transporter) {
  if (String(process.env.NODE_ENV) === "production") return;
  testTransporter = transporter || null;
}

function buildSmtpOptions(config) {
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password
    },
    connectionTimeout: config.timeoutMs,
    greetingTimeout: config.timeoutMs,
    socketTimeout: config.timeoutMs,
    tls: {
      rejectUnauthorized: true
    }
  };
}

function classifySmtpError(error) {
  const code = String(error?.code || "");
  const responseCode = Number(error?.responseCode || 0);
  if (code === "ETIMEDOUT" || code === "ESOCKETTIMEDOUT") return "SMTP_TIMEOUT";
  if (code === "EAUTH" || responseCode === 535) return "SMTP_AUTH_FAILED";
  if (code === "ESOCKET" || /CERT|TLS|SELF_SIGNED|UNABLE_TO_VERIFY|ALTNAME/i.test(code)) {
    return "SMTP_TLS_INVALID";
  }
  if (code === "ECONNRESET") return "SMTP_OUTCOME_UNKNOWN";
  if (code === "ECONNREFUSED" || code === "ECONNECTION" || responseCode >= 400) return "SMTP_REJECTED";
  return "SMTP_REJECTED";
}

function smtpFailure(reason) {
  return {
    delivered: false,
    accepted: false,
    dispatched: false,
    channel: "smtp",
    reason,
    messageId: null,
    retryable: false
  };
}

function createSmtpTransport(env = process.env, deps = {}) {
  const config = readSmtpConfig(env);
  const problems = smtpConfigProblems(config);
  return {
    maxAttempts: MAX_SMTP_ATTEMPTS,
    async send(message = {}) {
      if (problems.length) return smtpFailure("SMTP_CONFIG_INVALID");
      const replyTo = message.replyTo ? safeEmailAddress(message.replyTo) : null;
      if (message.replyTo && !replyTo) return smtpFailure("SMTP_REPLY_TO_INVALID");
      const recipient = message.kind === "contact" ? config.contactTo : safeEmailAddress(message.to);
      if (!recipient) return smtpFailure("SMTP_RECIPIENT_INVALID");
      const options = buildSmtpOptions(config);
      if (options.tls.rejectUnauthorized !== true) return smtpFailure("SMTP_TLS_INVALID");
      const transporter = deps.transporter || (String(env.NODE_ENV) !== "production" ? testTransporter : null);
      const active = transporter || createNodeSmtpTransporter(options);
      try {
        const info = await active.sendMail({
          from: config.from,
          to: recipient,
          replyTo: replyTo || undefined,
          subject: safeSubject(message.subject),
          text: safeText(message.text),
          disableFileAccess: true,
          disableUrlAccess: true
        });
        const messageId = typeof info?.messageId === "string" ? info.messageId.slice(0, 200) : null;
        return {
          delivered: false,
          accepted: true,
          dispatched: true,
          channel: "smtp",
          reason: "SMTP_ACCEPTED",
          messageId,
          retryable: false
        };
      } catch (error) {
        return smtpFailure(classifySmtpError(error));
      }
    }
  };
}

module.exports = {
  MAX_SMTP_ATTEMPTS,
  buildSmtpOptions,
  classifySmtpError,
  createSmtpTransport,
  setSmtpTransporterForTests
};
