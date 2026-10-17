/**
 * TLS status / SAN / serialization unit tests (Phase 2).
 * Run: node --test backend/lib/tlsStatus.test.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  deriveTlsObservationStatus,
  detectWildcard,
  serializeTlsCertificate,
  providerFromIssuer,
  DAY_MS
} = require("./tlsStatus");

describe("deriveTlsObservationStatus", () => {
  const now = new Date("2026-08-24T12:00:00.000Z");

  it("missing data → UNKNOWN", () => {
    assert.equal(deriveTlsObservationStatus({}, now).status, "UNKNOWN");
    assert.equal(deriveTlsObservationStatus({ hasObservation: false }, now).status, "UNKNOWN");
  });

  it(">30 days → VALID", () => {
    const notAfter = new Date(now.getTime() + 45 * DAY_MS);
    const r = deriveTlsObservationStatus({ notAfter, hasObservation: true }, now);
    assert.equal(r.status, "VALID");
    assert.equal(r.riskHint, null);
  });

  it("<=30 days → EXPIRING MEDIUM", () => {
    const notAfter = new Date(now.getTime() + 20 * DAY_MS);
    const r = deriveTlsObservationStatus({ notAfter, hasObservation: true }, now);
    assert.equal(r.status, "EXPIRING");
    assert.equal(r.riskHint, "MEDIUM");
  });

  it("<=14 days → EXPIRING HIGH", () => {
    const notAfter = new Date(now.getTime() + 10 * DAY_MS);
    const r = deriveTlsObservationStatus({ notAfter, hasObservation: true }, now);
    assert.equal(r.status, "EXPIRING");
    assert.equal(r.riskHint, "HIGH");
  });

  it("<=7 days → EXPIRING CRITICAL", () => {
    const notAfter = new Date(now.getTime() + 3 * DAY_MS);
    const r = deriveTlsObservationStatus({ notAfter, hasObservation: true }, now);
    assert.equal(r.status, "EXPIRING");
    assert.equal(r.riskHint, "CRITICAL");
  });

  it("expired → EXPIRED", () => {
    const notAfter = new Date(now.getTime() - 1 * DAY_MS);
    const r = deriveTlsObservationStatus({ notAfter, hasObservation: true }, now);
    assert.equal(r.status, "EXPIRED");
  });

  it("hostname mismatch represented", () => {
    const notAfter = new Date(now.getTime() + 90 * DAY_MS);
    const r = deriveTlsObservationStatus(
      { notAfter, hostnameMatch: false, hasObservation: true },
      now
    );
    assert.equal(r.status, "HOSTNAME_MISMATCH");
  });

  it("chain error represented", () => {
    const r = deriveTlsObservationStatus({ chainError: true, hasObservation: true }, now);
    assert.equal(r.status, "CHAIN_ERROR");
  });
});

describe("detectWildcard / SAN", () => {
  it("detects wildcard SAN", () => {
    assert.equal(detectWildcard(["*.floresgali.com", "floresgali.com"]), true);
    assert.equal(detectWildcard(["floresgali.com", "www.floresgali.es"]), false);
    assert.equal(detectWildcard(null), false);
  });
});

describe("serializeTlsCertificate", () => {
  it("never serializes private key fields", () => {
    const out = serializeTlsCertificate({
      id: 1,
      organization_id: 10,
      asset_id: 5,
      provider: "Let's Encrypt",
      serial: "abc",
      fingerprint_sha256: "deadbeef",
      issuer: "CN=R3",
      subject: "CN=floresgali.com",
      not_before: "2026-01-01",
      not_after: "2026-12-01",
      sans: ["*.floresgali.com", "floresgali.com"],
      is_wildcard: true,
      auto_renew: true,
      renewal_method: "acme",
      last_observed_at: "2026-08-01",
      observation_status: "VALID",
      hostname_match: true,
      metadata: {},
      created_at: "2026-08-01",
      updated_at: "2026-08-01",
      private_key: "SECRET_SHOULD_NOT_LEAK",
      privateKey: "SECRET2",
      pem: "-----BEGIN PRIVATE KEY-----",
      key: "secret-key"
    });
    const json = JSON.stringify(out);
    assert.ok(!json.includes("SECRET"));
    assert.ok(!json.includes("PRIVATE KEY"));
    assert.ok(!("private_key" in out));
    assert.ok(!("privateKey" in out));
    assert.ok(!("pem" in out));
    assert.ok(!("key" in out));
    assert.equal(out.provider, "Let's Encrypt");
    assert.deepEqual(out.sans, ["*.floresgali.com", "floresgali.com"]);
  });
});

describe("providerFromIssuer", () => {
  it("maps Let's Encrypt", () => {
    assert.equal(providerFromIssuer("C=US, O=Let's Encrypt, CN=R3"), "Let's Encrypt");
  });
});
