/**
 * Staging harness mount policy — fail closed outside staging + token.
 */
const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

describe("staging harness policy", () => {
  const keys = ["ARGOS_ENVIRONMENT", "ARGOS_STAGING_HARNESS_TOKEN", "NODE_ENV"];
  const saved = {};

  beforeEach(() => {
    for (const k of keys) saved[k] = process.env[k];
  });

  afterEach(() => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    // Clear require cache so isStagingHarnessAllowed re-reads env
    delete require.cache[require.resolve("../../routes/stagingHarness")];
  });

  it("denied when not staging", () => {
    process.env.ARGOS_ENVIRONMENT = "production";
    process.env.ARGOS_STAGING_HARNESS_TOKEN = "a".repeat(40);
    const { isStagingHarnessAllowed } = require("../../routes/stagingHarness");
    assert.equal(isStagingHarnessAllowed(), false);
  });

  it("denied when token short or CHANGE_ME", () => {
    process.env.ARGOS_ENVIRONMENT = "staging";
    process.env.ARGOS_STAGING_HARNESS_TOKEN = "short";
    let mod = require("../../routes/stagingHarness");
    assert.equal(mod.isStagingHarnessAllowed(), false);
    delete require.cache[require.resolve("../../routes/stagingHarness")];
    process.env.ARGOS_STAGING_HARNESS_TOKEN = "CHANGE_ME_staging_harness_token_min_32_chars";
    mod = require("../../routes/stagingHarness");
    assert.equal(mod.isStagingHarnessAllowed(), false);
  });

  it("allowed only for staging + strong token", () => {
    process.env.ARGOS_ENVIRONMENT = "staging";
    process.env.ARGOS_STAGING_HARNESS_TOKEN = "stg_harness_token_for_unit_test_ok_32";
    const { isStagingHarnessAllowed } = require("../../routes/stagingHarness");
    assert.equal(isStagingHarnessAllowed(), true);
  });
});
