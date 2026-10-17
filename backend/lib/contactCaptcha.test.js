const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  createChallenge,
  verifyChallenge,
  __resetStoreForTests
} = require("./contactCaptcha");

describe("contactCaptcha", () => {
  beforeEach(() => {
    __resetStoreForTests();
  });

  it("accepts a correct answer and invalidates the challenge", () => {
    const challenge = createChallenge();
    const [left, right] = challenge.question.split("+").map((part) => Number.parseInt(part.trim(), 10));
    const first = verifyChallenge(challenge.challengeId, left + right);
    assert.equal(first.ok, true);
    const second = verifyChallenge(challenge.challengeId, left + right);
    assert.equal(second.ok, false);
    assert.equal(second.reason, "expired");
  });

  it("rejects a wrong answer", () => {
    const challenge = createChallenge();
    const result = verifyChallenge(challenge.challengeId, 999);
    assert.equal(result.ok, false);
    assert.equal(result.reason, "wrong");
  });

  it("rejects empty answers", () => {
    const challenge = createChallenge();
    const result = verifyChallenge(challenge.challengeId, "");
    assert.equal(result.ok, false);
    assert.equal(result.reason, "invalid");
  });
});
