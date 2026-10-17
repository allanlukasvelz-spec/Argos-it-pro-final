const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  authRateLimitKey,
  stagingE2eFwdIp,
  isStagingEnvironment
} = require("./stagingE2eRateLimitKey");

describe("stagingE2eRateLimitKey", () => {
  const prev = process.env.ARGOS_ENVIRONMENT;

  afterEach(() => {
    if (prev === undefined) delete process.env.ARGOS_ENVIRONMENT;
    else process.env.ARGOS_ENVIRONMENT = prev;
  });

  it("ignores E2E header outside staging", () => {
    process.env.ARGOS_ENVIRONMENT = "production";
    const req = {
      ip: "203.0.113.9",
      headers: { "x-argos-staging-e2e-fwd": "203.0.113.42" }
    };
    assert.equal(stagingE2eFwdIp(req), null);
    assert.equal(authRateLimitKey(req), "203.0.113.9");
  });

  it("uses TEST-NET E2E header in staging", () => {
    process.env.ARGOS_ENVIRONMENT = "staging";
    const req = {
      ip: "91.108.121.1",
      headers: { "x-argos-staging-e2e-fwd": "203.0.113.42" }
    };
    assert.equal(isStagingEnvironment(), true);
    assert.equal(stagingE2eFwdIp(req), "203.0.113.42");
    assert.equal(authRateLimitKey(req), "stg-e2e:203.0.113.42");
  });

  it("rejects non-TEST-NET and falls back to req.ip", () => {
    process.env.ARGOS_ENVIRONMENT = "staging";
    const req = {
      ip: "198.51.100.1",
      headers: { "x-argos-staging-e2e-fwd": "8.8.8.8" }
    };
    assert.equal(stagingE2eFwdIp(req), null);
    assert.equal(authRateLimitKey(req), "198.51.100.1");
  });
});
