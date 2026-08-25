/**
 * Phase 7 — red team / security property tests (pure).
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { normalizeCapabilityList } = require("./capabilities");
const { validateMeasurement } = require("./schemas");
const { parseCredential } = require("./crypto");
const { deriveChicoState } = require("./chicoState");
const { mergeAgentIntoAssetHealth } = require("./healthMerge");

describe("Phase 7 red team — injection / forbidden surfaces", () => {
  it("rejects command injection keys in measurements", () => {
    assert.throws(() => validateMeasurement("CPU", { usagePercent: 1, command: "rm -rf /" }));
    assert.throws(() => validateMeasurement("CPU", { usagePercent: 1, shell: "bash" }));
    assert.throws(() => validateMeasurement("CPU", { usagePercent: 1, sql: "DROP" }));
    assert.throws(() => validateMeasurement("CPU", { usagePercent: 1, private_key: "x" }));
  });

  it("rejects unknown capabilities used as remote exec", () => {
    assert.throws(() => normalizeCapabilityList(["SHELL"]));
    assert.throws(() => normalizeCapabilityList(["REMOTE_REMEDIATION"]));
  });

  it("rejects malformed credentials", () => {
    assert.equal(parseCredential("Bearer not-a-cred"), null);
    assert.equal(parseCredential("1.short"), null);
  });

  it("CHICO never NORMAL while critical incident open", () => {
    const g = deriveChicoState({
      overall: "HEALTHY",
      monitorsEnabled: 5,
      assetsWithFreshEvidence: 5,
      openIncidents: 1,
      openCriticalAlerts: 0
    });
    assert.equal(g.state, "CRITICAL");
  });

  it("stale observation marked in reasons", () => {
    const old = new Date(Date.now() - 60 * 60 * 1000);
    const merged = mergeAgentIntoAssetHealth(
      { overall: "HEALTHY", reasons: [] },
      {
        status: "ONLINE",
        lastSeenAt: new Date(),
        observations: [{ type: "DISK", measurement: { usedPercent: 99, mount: "/" }, received_at: old }]
      }
    );
    assert.ok(merged.reasons.some((r) => String(r).includes("agent_obs_stale")));
  });

  it("agent ONLINE does not flip UNKNOWN→HEALTHY", () => {
    const merged = mergeAgentIntoAssetHealth(
      { overall: "UNKNOWN", reasons: [] },
      { status: "ONLINE", lastSeenAt: new Date(), observations: [] }
    );
    assert.equal(merged.overall, "UNKNOWN");
  });
});
