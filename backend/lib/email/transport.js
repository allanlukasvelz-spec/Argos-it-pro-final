const { readSmtpConfig, smtpConfigProblems } = require("./smtpConfig");

function resolveEmailTransport(env = process.env) {
  const requested = String(env.ARGOS_EMAIL_TRANSPORT || "").trim().toLowerCase();
  if (requested === "qa") {
    if (String(env.NODE_ENV) === "production") {
      return { mode: "disabled", reason: "QA_FORBIDDEN_IN_PRODUCTION" };
    }
    return { mode: "qa", reason: "QA_OUTBOX" };
  }
  if (requested === "smtp") {
    return { mode: "smtp", reason: "SMTP_SELECTED" };
  }
  return { mode: "disabled", reason: "EMAIL_TRANSPORT_DISABLED" };
}

function assertEmailTransportReady(env = process.env) {
  const selected = resolveEmailTransport(env);
  if (selected.mode !== "smtp") return selected;
  const problems = smtpConfigProblems(readSmtpConfig(env));
  if (problems.length) {
    const error = new Error(`SMTP_CONFIG_INVALID:${problems.join(",")}`);
    error.code = "SMTP_CONFIG_INVALID";
    error.problems = problems;
    throw error;
  }
  return selected;
}

module.exports = {
  resolveEmailTransport,
  assertEmailTransportReady
};
