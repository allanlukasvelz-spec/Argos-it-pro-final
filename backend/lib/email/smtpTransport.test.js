const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  buildSmtpOptions,
  classifySmtpError,
  createSmtpTransport,
  setSmtpTransporterForTests,
  MAX_SMTP_ATTEMPTS
} = require("./smtpTransport");
const { readSmtpConfig } = require("./smtpConfig");

const smtpEnv = {
  NODE_ENV: "test",
  ARGOS_EMAIL_TRANSPORT: "smtp",
  SMTP_HOST: "smtp.invalid",
  SMTP_PORT: "2525",
  SMTP_SECURE: "false",
  SMTP_USER: "fixture-user",
  SMTP_PASSWORD: "fixture-password",
  EMAIL_FROM: "noreply@example.test",
  CONTACT_EMAIL_TO: "inbox@example.test",
  SMTP_TIMEOUT_MS: "5000"
};

describe("smtp transport", () => {
  beforeEach(() => setSmtpTransporterForTests(null));
  afterEach(() => setSmtpTransporterForTests(null));

  it("keeps certificate verification and a bounded timeout", () => {
    const options = buildSmtpOptions(readSmtpConfig(smtpEnv));
    assert.equal(options.tls.rejectUnauthorized, true);
    assert.equal(options.connectionTimeout, 5000);
    assert.equal(options.secure, false);
    assert.equal(MAX_SMTP_ATTEMPTS, 1);
  });

  it("fails closed when credentials are missing and does not call SMTP", async () => {
    let calls = 0;
    const transport = createSmtpTransport(
      { ...smtpEnv, SMTP_PASSWORD: "" },
      { transporter: { async sendMail() { calls += 1; return {}; } } }
    );
    const result = await transport.send({ kind: "invitation", to: "a@example.test", subject: "s", text: "t" });
    assert.equal(result.reason, "SMTP_CONFIG_INVALID");
    assert.equal(result.delivered, false);
    assert.equal(result.retryable, false);
    assert.equal(calls, 0);
  });

  it("accepts a simulated SMTP response without claiming mailbox delivery", async () => {
    const seen = [];
    const transport = createSmtpTransport(smtpEnv, {
      transporter: {
        async sendMail(message) {
          seen.push(message);
          return { messageId: "<fixture@example.test>" };
        }
      }
    });
    const result = await transport.send({
      kind: "invitation",
      to: "person@example.test",
      subject: "Asunto\r\nBcc: evil@example.test",
      text: "enlace https://example.test/auth/invite?token=wpi_secret"
    });
    assert.equal(result.accepted, true);
    assert.equal(result.delivered, false);
    assert.equal(result.reason, "SMTP_ACCEPTED");
    assert.equal(result.messageId, "<fixture@example.test>");
    assert.equal(seen.length, 1);
    assert.equal(seen[0].from, "noreply@example.test");
    assert.equal(seen[0].to, "person@example.test");
    assert.equal(seen[0].subject, "Asunto Bcc: evil@example.test");
    assert.equal(seen[0].html, undefined);
  });

  it("rejects a reply-to header injection before calling SMTP", async () => {
    let calls = 0;
    const transport = createSmtpTransport(smtpEnv, {
      transporter: { async sendMail() { calls += 1; return {}; } }
    });
    const result = await transport.send({
      kind: "contact",
      replyTo: "ana@example.test\r\nBcc: evil@example.test",
      subject: "consulta",
      text: "hola"
    });
    assert.equal(result.reason, "SMTP_REPLY_TO_INVALID");
    assert.equal(calls, 0);
  });

  it("maps auth, rejection, timeout, reset and tls without retrying", async () => {
    const cases = [
      [{ code: "EAUTH" }, "SMTP_AUTH_FAILED"],
      [{ responseCode: 550 }, "SMTP_REJECTED"],
      [{ code: "ETIMEDOUT" }, "SMTP_TIMEOUT"],
      [{ code: "ECONNRESET" }, "SMTP_OUTCOME_UNKNOWN"],
      [{ code: "ESOCKET" }, "SMTP_TLS_INVALID"]
    ];
    for (const [error, reason] of cases) {
      let calls = 0;
      const transport = createSmtpTransport(smtpEnv, {
        transporter: {
          async sendMail() {
            calls += 1;
            throw error;
          }
        }
      });
      const result = await transport.send({ kind: "invitation", to: "a@example.test", text: "t" });
      assert.equal(result.reason, reason);
      assert.equal(result.delivered, false);
      assert.equal(result.accepted, false);
      assert.equal(result.retryable, false);
      assert.equal(calls, 1);
      assert.equal(JSON.stringify(result).includes("fixture-password"), false);
    }
    assert.equal(classifySmtpError({ code: "ECONNREFUSED" }), "SMTP_REJECTED");
  });
});
