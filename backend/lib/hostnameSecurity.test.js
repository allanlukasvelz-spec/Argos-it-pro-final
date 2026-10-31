/**
 * Hostname validation + SSRF unit tests (Phase 2).
 * Run: node --test backend/lib/hostnameSecurity.test.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  validatePublicHostname,
  isPrivateOrReservedIp,
  parseSan,
  hostnameMatchesPattern,
  matchesHostname
} = require("./hostnameSecurity");

describe("validatePublicHostname", () => {
  it("accepts public FQDN", () => {
    const r = validatePublicHostname("www.floresgali.com");
    assert.equal(r.ok, true);
    assert.equal(r.hostname, "www.floresgali.com");
  });

  it("strips https scheme and path", () => {
    const r = validatePublicHostname("https://floresgali.es/path?x=1");
    assert.equal(r.ok, true);
    assert.equal(r.hostname, "floresgali.es");
  });

  it("blocks localhost / metadata / private suffixes", () => {
    for (const host of [
      "localhost",
      "metadata.google.internal",
      "foo.local",
      "db.internal",
      "127.0.0.1",
      "10.0.0.5",
      "192.168.1.1",
      "file://etc/passwd",
      "gopher://evil"
    ]) {
      const r = validatePublicHostname(host);
      assert.equal(r.ok, false, `expected block for ${host}`);
    }
  });

  it("rejects non-443 ports", () => {
    assert.equal(validatePublicHostname("example.com:8080").ok, false);
  });

  it("allows explicit :443", () => {
    const r = validatePublicHostname("example.com:443");
    assert.equal(r.ok, true);
    assert.equal(r.hostname, "example.com");
  });
});

describe("isPrivateOrReservedIp", () => {
  it("blocks RFC1918 / loopback / link-local / CGNAT", () => {
    assert.equal(isPrivateOrReservedIp("10.1.2.3"), true);
    assert.equal(isPrivateOrReservedIp("127.0.0.1"), true);
    assert.equal(isPrivateOrReservedIp("169.254.169.254"), true);
    assert.equal(isPrivateOrReservedIp("172.16.0.1"), true);
    assert.equal(isPrivateOrReservedIp("192.168.0.1"), true);
    assert.equal(isPrivateOrReservedIp("100.64.0.1"), true);
    assert.equal(isPrivateOrReservedIp("::1"), true);
    assert.equal(isPrivateOrReservedIp("fe80::1"), true);
    assert.equal(isPrivateOrReservedIp("fd12::1"), true);
  });

  it("allows public IPv4", () => {
    assert.equal(isPrivateOrReservedIp("8.8.8.8"), false);
    assert.equal(isPrivateOrReservedIp("1.1.1.1"), false);
  });
});

describe("parseSan / hostname match", () => {
  it("parses SAN string correctly", () => {
    const sans = parseSan("DNS:*.floresgali.com, DNS:floresgali.com, DNS:floresgali.es, DNS:www.floresgali.es");
    assert.deepEqual(sans, [
      "*.floresgali.com",
      "floresgali.com",
      "floresgali.es",
      "www.floresgali.es"
    ]);
  });

  it("malformed SAN → empty", () => {
    assert.deepEqual(parseSan(null), []);
    assert.deepEqual(parseSan(""), []);
    assert.deepEqual(parseSan("URI:http://evil"), []);
  });

  it("wildcard hostname match", () => {
    assert.equal(hostnameMatchesPattern("www.floresgali.com", "*.floresgali.com"), true);
    assert.equal(hostnameMatchesPattern("floresgali.com", "*.floresgali.com"), false);
    assert.equal(matchesHostname("www.floresgali.es", ["www.floresgali.es"], null), true);
    assert.equal(matchesHostname("other.example", ["floresgali.com"], "floresgali.com"), false);
  });
});
