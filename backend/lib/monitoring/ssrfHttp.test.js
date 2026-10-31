/**
 * Phase 3 — SSRF HTTP probe unit tests (no real network for blocked cases).
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { safeHttpProbe, parseRedirect } = require("./ssrfHttp");
const { ERROR_CLASS } = require("./constants");

describe("ssrfHttp", () => {
  it("blocks localhost hostname", async () => {
    const r = await safeHttpProbe("localhost");
    assert.equal(r.ok, false);
    assert.equal(r.errorClass, ERROR_CLASS.SSRF_BLOCKED);
  });

  it("blocks metadata hostname", async () => {
    const r = await safeHttpProbe("metadata.google.internal");
    assert.equal(r.ok, false);
    assert.equal(r.errorClass, ERROR_CLASS.SSRF_BLOCKED);
  });

  it("blocks IP literals", async () => {
    const r = await safeHttpProbe("127.0.0.1");
    assert.equal(r.ok, false);
    assert.equal(r.errorClass, ERROR_CLASS.SSRF_BLOCKED);
  });

  it("blocks non-80/443 ports via options", async () => {
    const r = await safeHttpProbe("example.com", { port: 8080, protocol: "http" });
    assert.equal(r.ok, false);
    assert.equal(r.errorClass, ERROR_CLASS.SSRF_BLOCKED);
  });

  it("parseRedirect blocks private IP locations", () => {
    const r = parseRedirect(
      { protocol: "https", hostname: "example.com", port: 443, path: "/" },
      "https://192.168.1.1/"
    );
    assert.equal(r.ok, false);
    assert.equal(r.errorClass, ERROR_CLASS.SSRF_BLOCKED);
  });

  it("parseRedirect allows public https redirect", () => {
    const r = parseRedirect(
      { protocol: "https", hostname: "example.com", port: 443, path: "/" },
      "https://www.example.com/path"
    );
    assert.equal(r.ok, true);
    assert.equal(r.ctx.hostname, "www.example.com");
  });
});
