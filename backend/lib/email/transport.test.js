const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { resolveEmailTransport, assertEmailTransportReady } = require("./transport");

const smtpEnv = {
  NODE_ENV: "production",
  ARGOS_EMAIL_TRANSPORT: "smtp",
  SMTP_HOST: "smtp.invalid",
  SMTP_PORT: "587",
  SMTP_USER: "fixture-user",
  SMTP_PASSWORD: "fixture-password",
  EMAIL_FROM: "noreply@example.test",
  CONTACT_EMAIL_TO: "inbox@example.test"
};

describe("email transport selection", () => {
  it("keeps QA off unless it is explicit and outside production", () => {
    assert.equal(resolveEmailTransport({ NODE_ENV: "test" }).mode, "disabled");
    assert.equal(resolveEmailTransport({ NODE_ENV: "test", ARGOS_EMAIL_TRANSPORT: "qa" }).mode, "qa");
    assert.equal(
      resolveEmailTransport({ NODE_ENV: "production", ARGOS_EMAIL_TRANSPORT: "qa" }).reason,
      "QA_FORBIDDEN_IN_PRODUCTION"
    );
  });

  it("does not enable SMTP just because credentials exist", () => {
    const selected = resolveEmailTransport({ ...smtpEnv, ARGOS_EMAIL_TRANSPORT: "" });
    assert.equal(selected.mode, "disabled");
    assert.doesNotThrow(() => assertEmailTransportReady({ ...smtpEnv, ARGOS_EMAIL_TRANSPORT: "" }));
  });

  it("refuses SMTP startup when a required value is missing", () => {
    assert.throws(
      () => assertEmailTransportReady({ ...smtpEnv, SMTP_PASSWORD: "" }),
      (error) => error.code === "SMTP_CONFIG_INVALID" && error.problems.includes("SMTP_PASSWORD") && !String(error.message).includes("fixture")
    );
    assert.equal(assertEmailTransportReady(smtpEnv).mode, "smtp");
  });
});
