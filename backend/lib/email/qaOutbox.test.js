const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { isQaTransport, acceptQaMessage, listQaMessages, clearQaMessages } = require("./qaOutbox");

describe("qa email outbox", () => {
  beforeEach(() => clearQaMessages());

  it("stays off in production even if the flag is set", () => {
    assert.equal(isQaTransport({ NODE_ENV: "production", ARGOS_EMAIL_TRANSPORT: "qa" }), false);
  });

  it("stays off without the explicit flag", () => {
    assert.equal(isQaTransport({ NODE_ENV: "test", ARGOS_EMAIL_TRANSPORT: "" }), false);
  });

  it("accepts a message without marking it delivered", () => {
    const record = acceptQaMessage({
      kind: "invitation",
      to: "qa@example.test",
      subject: "asunto",
      text: "cuerpo"
    });
    assert.equal(record.dispatched, true);
    assert.equal(record.delivered, false);
    assert.equal(record.channel, "qa");
    assert.equal(listQaMessages().length, 1);
    assert.equal(listQaMessages()[0].to, "qa@example.test");
  });
});
