const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  ResettableMemoryStore,
  isRateLimitResetAllowed
} = require("./rateLimitRegistry");

describe("rateLimitRegistry", () => {
  it("ResettableMemoryStore increments and resetAll clears", async () => {
    const store = new ResettableMemoryStore();
    store.init({ windowMs: 60_000 });
    const a = await store.increment("127.0.0.1");
    const b = await store.increment("127.0.0.1");
    assert.equal(a.totalHits, 1);
    assert.equal(b.totalHits, 2);
    store.resetAll();
    const c = await store.increment("127.0.0.1");
    assert.equal(c.totalHits, 1);
  });

  it("isRateLimitResetAllowed requires flag and test|development; staging fails closed", () => {
    const prevEnv = process.env.NODE_ENV;
    const prevFlag = process.env.ARGOS_ALLOW_RATE_LIMIT_RESET;
    const prevArgos = process.env.ARGOS_ENVIRONMENT;
    try {
      delete process.env.ARGOS_ENVIRONMENT;
      process.env.NODE_ENV = "production";
      process.env.ARGOS_ALLOW_RATE_LIMIT_RESET = "1";
      assert.equal(isRateLimitResetAllowed(), false);

      process.env.NODE_ENV = "development";
      process.env.ARGOS_ALLOW_RATE_LIMIT_RESET = "1";
      assert.equal(isRateLimitResetAllowed(), true);

      process.env.NODE_ENV = "test";
      process.env.ARGOS_ALLOW_RATE_LIMIT_RESET = "1";
      assert.equal(isRateLimitResetAllowed(), true);

      process.env.ARGOS_ENVIRONMENT = "staging";
      process.env.NODE_ENV = "test";
      process.env.ARGOS_ALLOW_RATE_LIMIT_RESET = "1";
      assert.equal(isRateLimitResetAllowed(), false);

      delete process.env.ARGOS_ENVIRONMENT;
      process.env.NODE_ENV = "development";
      process.env.ARGOS_ALLOW_RATE_LIMIT_RESET = "0";
      assert.equal(isRateLimitResetAllowed(), false);
    } finally {
      if (prevEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = prevEnv;
      if (prevFlag === undefined) delete process.env.ARGOS_ALLOW_RATE_LIMIT_RESET;
      else process.env.ARGOS_ALLOW_RATE_LIMIT_RESET = prevFlag;
      if (prevArgos === undefined) delete process.env.ARGOS_ENVIRONMENT;
      else process.env.ARGOS_ENVIRONMENT = prevArgos;
    }
  });
});
