/**
 * Phase 7 — unit tests: capabilities, schemas, state, chico, crypto, health merge.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeCapabilityList,
  hasCapability,
  REJECTED_CAPABILITIES,
  CAPABILITIES
} = require("./capabilities");
const { validateMeasurement, classifyAgentMeasurement } = require("./schemas");
const { deriveAgentStatus, agentOnlineImpliesHealthy, AGENT_STATUS } = require("./state");
const { deriveChicoState, CHICO_STATES } = require("./chicoState");
const {
  sha256Hex,
  generateEnrollmentToken,
  parseCredential,
  formatCredential,
  hashMatches
} = require("./crypto");
const { mergeAgentIntoAssetHealth } = require("./healthMerge");

describe("Phase 7 — capabilities allowlist", () => {
  it("accepts MVP capabilities and forces HEARTBEAT", () => {
    const caps = normalizeCapabilityList(["CPU_READ"]);
    assert.ok(caps.includes(CAPABILITIES.HEARTBEAT));
    assert.ok(caps.includes(CAPABILITIES.CPU_READ));
  });

  it("rejects shell/exec/sql", () => {
    for (const bad of REJECTED_CAPABILITIES) {
      assert.throws(() => normalizeCapabilityList([bad]), (e) => e.code === "CAPABILITY_REJECTED");
    }
    assert.throws(() => normalizeCapabilityList(["ARBITRARY_COMMAND"]), (e) => e.code === "CAPABILITY_REJECTED");
  });

  it("hasCapability checks grant list", () => {
    assert.equal(hasCapability(["HEARTBEAT", "DISK_READ"], "DISK_READ"), true);
    assert.equal(hasCapability(["HEARTBEAT"], "DISK_READ"), false);
  });
});

describe("Phase 7 — observation schemas", () => {
  it("validates CPU/DISK and rejects secrets/commands", () => {
    assert.deepEqual(validateMeasurement("CPU", { usagePercent: 12 }), { usagePercent: 12, cores: undefined });
    assert.throws(() => validateMeasurement("CPU", { usagePercent: 12, password: "x" }), (e) => e.code === "FORBIDDEN_FIELD");
    assert.throws(() => validateMeasurement("DISK", { mount: "/;rm", usedPercent: 10 }), (e) => e.code === "SCHEMA_INVALID");
    assert.throws(() => validateMeasurement("SHELL", {}), (e) => e.code === "UNKNOWN_TYPE");
  });

  it("classifies disk critical", () => {
    assert.equal(classifyAgentMeasurement("DISK", { usedPercent: 96 }), "CRITICAL");
    assert.equal(classifyAgentMeasurement("SERVICE_HEALTH", { state: "DOWN" }), "CRITICAL");
  });
});

describe("Phase 7 — agent state ≠ health", () => {
  it("ONLINE from fresh last_seen; never implies healthy", () => {
    const now = new Date();
    assert.equal(
      deriveAgentStatus({ status: "ONLINE", lastSeenAt: now, now }),
      AGENT_STATUS.ONLINE
    );
    assert.equal(agentOnlineImpliesHealthy(), false);
  });

  it("STALE then OFFLINE by age", () => {
    const now = new Date();
    const stale = new Date(now.getTime() - 4 * 60 * 1000);
    const offline = new Date(now.getTime() - 20 * 60 * 1000);
    assert.equal(deriveAgentStatus({ status: "ONLINE", lastSeenAt: stale, now }), AGENT_STATUS.STALE);
    assert.equal(deriveAgentStatus({ status: "ONLINE", lastSeenAt: offline, now }), AGENT_STATUS.OFFLINE);
    assert.equal(deriveAgentStatus({ status: "REVOKED", lastSeenAt: now, now }), AGENT_STATUS.REVOKED);
  });
});

describe("Phase 7 — CHICO state mapping", () => {
  it("CRITICAL when open incident", () => {
    const g = deriveChicoState({
      overall: "WARNING",
      openIncidents: 1,
      monitorsEnabled: 2,
      assetsWithFreshEvidence: 2
    });
    assert.equal(g.state, CHICO_STATES.CRITICAL);
  });

  it("UNKNOWN when no monitors — never NORMAL", () => {
    const g = deriveChicoState({
      overall: "UNKNOWN",
      monitorsEnabled: 0,
      assetsWithFreshEvidence: 0,
      openAlerts: 0,
      openIncidents: 0
    });
    assert.equal(g.state, CHICO_STATES.UNKNOWN);
    assert.notEqual(g.state, CHICO_STATES.NORMAL);
  });

  it("NORMAL only with healthy evidence and no alerts", () => {
    const g = deriveChicoState({
      overall: "HEALTHY",
      monitorsEnabled: 3,
      assetsWithFreshEvidence: 2,
      openAlerts: 0,
      openIncidents: 0,
      openCriticalAlerts: 0
    });
    assert.equal(g.state, CHICO_STATES.NORMAL);
  });

  it("VERIFYING when remediation verifying", () => {
    const g = deriveChicoState({
      overall: "WARNING",
      remediationVerifying: true,
      monitorsEnabled: 1,
      assetsWithFreshEvidence: 1
    });
    assert.equal(g.state, CHICO_STATES.VERIFYING);
  });

  it("agent ONLINE alone does not invent NORMAL from UNKNOWN", () => {
    const g = deriveChicoState({
      overall: "UNKNOWN",
      monitorsEnabled: 1,
      assetsWithFreshEvidence: 0,
      agentStatuses: ["ONLINE"]
    });
    assert.equal(g.state, CHICO_STATES.UNKNOWN);
  });
});

describe("Phase 7 — crypto", () => {
  it("hashes and verifies credentials", () => {
    const token = generateEnrollmentToken();
    assert.ok(token.startsWith("enr_"));
    const h = sha256Hex("secret");
    assert.equal(hashMatches("secret", h), true);
    assert.equal(hashMatches("other", h), false);
    const cred = formatCredential(7, "ags_abcdefghijklmnopqrstuvwxyz012345");
    const parsed = parseCredential(`Bearer ${cred}`);
    assert.equal(parsed.agentId, 7);
  });
});

describe("Phase 7 — health merge invariants", () => {
  it("does not upgrade UNKNOWN to HEALTHY via agent online+ok", () => {
    const merged = mergeAgentIntoAssetHealth(
      { overall: "UNKNOWN", reasons: ["no_active_monitors"] },
      {
        status: "ONLINE",
        lastSeenAt: new Date(),
        observations: [{ type: "CPU", measurement: { usagePercent: 10 }, received_at: new Date() }]
      }
    );
    assert.equal(merged.overall, "UNKNOWN");
    assert.ok(merged.reasons.includes("agent_cannot_invent_healthy"));
  });

  it("can raise CRITICAL from disk metric", () => {
    const merged = mergeAgentIntoAssetHealth(
      { overall: "HEALTHY", reasons: [] },
      {
        status: "ONLINE",
        lastSeenAt: new Date(),
        observations: [{ type: "DISK", measurement: { usedPercent: 97, mount: "/" }, received_at: new Date() }]
      }
    );
    assert.equal(merged.overall, "CRITICAL");
  });
});
