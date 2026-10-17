const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { classifyInvitationDelivery } = require("./invitationService");
const { createInvitationMailer } = require("./invitationMailer");
const { clearQaMessages, listQaMessages } = require("../email/qaOutbox");
const { setSmtpTransporterForTests } = require("../email/smtpTransport");

const smtpEnv = {
  NODE_ENV: "test",
  ARGOS_EMAIL_TRANSPORT: "smtp",
  SMTP_HOST: "smtp.invalid",
  SMTP_PORT: "2525",
  SMTP_USER: "fixture-user",
  SMTP_PASSWORD: "fixture-password",
  EMAIL_FROM: "noreply@example.test",
  CONTACT_EMAIL_TO: "inbox@example.test"
};

describe("invitation delivery semantics", () => {
  beforeEach(() => {
    clearQaMessages();
    setSmtpTransporterForTests(null);
  });
  afterEach(() => {
    clearQaMessages();
    setSmtpTransporterForTests(null);
  });

  it("keeps an absent channel as a confirmed failure", () => {
    const outcome = classifyInvitationDelivery({ delivered: false, reason: "NO_EMAIL_CHANNEL" });
    assert.equal(outcome.deliveryStatus, "FAILED");
    assert.equal(outcome.action, "WEB_PROJECT_INVITATION_CREATED");
    assert.equal(outcome.delivered, false);
  });

  it("keeps QA dispatch pending and unsent", () => {
    const outcome = classifyInvitationDelivery({
      delivered: false,
      dispatched: true,
      channel: "qa",
      reason: "QA_OUTBOX"
    });
    assert.equal(outcome.deliveryStatus, "PENDING");
    assert.equal(outcome.accepted, false);
    assert.equal(outcome.action, "WEB_PROJECT_INVITATION_DISPATCHED");
  });

  it("records SMTP acceptance as sent without calling it delivered", () => {
    const outcome = classifyInvitationDelivery({
      delivered: false,
      accepted: true,
      dispatched: true,
      channel: "smtp",
      reason: "SMTP_ACCEPTED"
    });
    assert.equal(outcome.deliveryStatus, "SENT");
    assert.equal(outcome.delivered, false);
  });

  it("does not retry an unknown SMTP result or expose the token", async () => {
    let calls = 0;
    setSmtpTransporterForTests({
      async sendMail() {
        calls += 1;
        const error = new Error("timed out");
        error.code = "ETIMEDOUT";
        throw error;
      }
    });
    const result = await createInvitationMailer(smtpEnv).send({
      to: "person@example.test",
      displayName: "Ana",
      expiresAt: new Date("2026-07-01T00:00:00.000Z"),
      inviteUrl: "https://example.test/auth/invite?token=wpi_secret"
    });
    assert.equal(calls, 1);
    assert.equal(result.reason, "SMTP_TIMEOUT");
    assert.equal(JSON.stringify(result).includes("wpi_secret"), false);
    const outcome = classifyInvitationDelivery(result);
    assert.equal(outcome.deliveryStatus, "PENDING");
    assert.equal(outcome.delivered, false);
    assert.equal(listQaMessages().length, 0);
  });

  it("puts the invite link only in the simulated SMTP body", async () => {
    const seen = [];
    setSmtpTransporterForTests({
      async sendMail(message) {
        seen.push(message);
        return { messageId: "<fixture@example.test>" };
      }
    });
    const result = await createInvitationMailer(smtpEnv).send({
      to: "person@example.test",
      expiresAt: new Date("2026-07-01T00:00:00.000Z"),
      inviteUrl: "https://example.test/auth/invite?token=wpi_secret"
    });
    assert.equal(result.delivered, false);
    assert.equal(result.accepted, true);
    assert.match(seen[0].text, /wpi_secret/);
    assert.equal(seen[0].from, "noreply@example.test");
    assert.equal(JSON.stringify(result).includes("wpi_secret"), false);
  });
});
