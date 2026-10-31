/**
 * Phase 3 — alert fingerprint / severity unit tests.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  buildFingerprint,
  severityFromObservation
} = require("./alertEngine");
const { ERROR_CLASS } = require("./constants");

describe("alertEngine", () => {
  it("builds stable fingerprints per org+monitor+error", () => {
    assert.equal(
      buildFingerprint(1, 10, ERROR_CLASS.HTTP_5XX),
      buildFingerprint(1, 10, ERROR_CLASS.HTTP_5XX)
    );
    assert.notEqual(
      buildFingerprint(1, 10, ERROR_CLASS.HTTP_5XX),
      buildFingerprint(2, 10, ERROR_CLASS.HTTP_5XX)
    );
  });

  it("does not alert on SSRF/runner errors", () => {
    assert.equal(
      severityFromObservation({ error_class: ERROR_CLASS.SSRF_BLOCKED, ok: false }),
      null
    );
    assert.equal(
      severityFromObservation({ error_class: ERROR_CLASS.RUNNER_ERROR, ok: false }),
      null
    );
  });

  it("maps TLS expired / HTTP 5xx to CRITICAL", () => {
    assert.equal(
      severityFromObservation({ error_class: ERROR_CLASS.TLS_EXPIRED, ok: false }),
      "CRITICAL"
    );
    assert.equal(
      severityFromObservation({ error_class: ERROR_CLASS.HTTP_5XX, ok: false }),
      "CRITICAL"
    );
  });

  it("maps TLS expiring to WARNING", () => {
    assert.equal(
      severityFromObservation({ error_class: ERROR_CLASS.TLS_EXPIRING, ok: true }),
      "WARNING"
    );
  });
});
