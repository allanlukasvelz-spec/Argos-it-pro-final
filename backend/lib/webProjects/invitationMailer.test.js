const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { clearQaMessages, listQaMessages } = require("../email/qaOutbox");
const { createInvitationMailer } = require("./invitationMailer");

describe("invitation mailer transport", () => {
  beforeEach(() => clearQaMessages());

  it("keeps production and the default path without a channel", async () => {
    const mailer = createInvitationMailer({ NODE_ENV: "production", ARGOS_EMAIL_TRANSPORT: "qa" });
    const result = await mailer.send({ to: "a@example.test" });
    assert.equal(result.delivered, false);
    assert.equal(result.dispatched, false);
    assert.equal(result.reason, "NO_EMAIL_CHANNEL");
    assert.equal(listQaMessages().length, 0);
  });

  it("dispatches to the QA outbox without claiming delivery", async () => {
    const mailer = createInvitationMailer({ NODE_ENV: "test", ARGOS_EMAIL_TRANSPORT: "qa" });
    const result = await mailer.send({
      to: "qa@example.test",
      displayName: "QA",
      expiresAt: new Date("2026-07-01T00:00:00.000Z")
    });
    assert.equal(result.delivered, false);
    assert.equal(result.dispatched, true);
    assert.equal(result.channel, "qa");
    assert.equal(result.reason, "QA_OUTBOX");
    const stored = listQaMessages();
    assert.equal(stored.length, 1);
    assert.equal(stored[0].kind, "invitation");
    assert.equal(stored[0].delivered, false);
    assert.match(stored[0].text, /2026-07-01/);
  });
});
