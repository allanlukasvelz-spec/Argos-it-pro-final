/**
 * Phase 6 — remediation engine unit + security tests (no real customer infra).
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  canTransition,
  assertTransition,
  LEVEL_RANK
} = require("./constants");
const { getAction, listActions, isRegistered } = require("./registry");
const { sanitizeRemediationPayload } = require("./sanitize");
const { scopeHash, makeExecutionKey } = require("./keys");

describe("Phase 6A — registry + safety", () => {
  it("lists only non-L4 actions", () => {
    const actions = listActions();
    assert.ok(actions.some((a) => a.type === "HTTP_RECHECK"));
    assert.ok(actions.some((a) => a.type === "TEST_SET_FLAG" && a.hasRollback));
    assert.ok(!actions.some((a) => a.type === "ARBITRARY_SHELL"));
  });

  it("rejects unknown action type", () => {
    assert.throws(() => getAction("eval(process)"), (e) => e.code === "UNKNOWN_ACTION");
    assert.throws(() => getAction("DROP_TABLE"), (e) => e.code === "UNKNOWN_ACTION");
  });

  it("rejects L4 actions", () => {
    assert.throws(() => getAction("ARBITRARY_SHELL"), (e) => e.code === "L4_FORBIDDEN");
    assert.throws(() => getAction("DROP_DATABASE"), (e) => e.code === "L4_FORBIDDEN");
  });

  it("rejects command/shell/sql input keys", () => {
    const a = getAction("HTTP_RECHECK");
    assert.throws(() => a.validateInput({ command: "rm -rf /" }), (e) => e.code === "INVALID_INPUT");
    assert.throws(() => a.validateInput({ shell: "bash" }), (e) => e.code === "INVALID_INPUT");
    assert.throws(() => a.validateInput({ sql: "DROP TABLE x" }), (e) => e.code === "INVALID_INPUT");
  });

  it("L2 simulator requires rollback function", () => {
    const a = getAction("TEST_SET_FLAG");
    assert.equal(a.safetyLevel, "L2");
    assert.equal(typeof a.rollback, "function");
    assert.equal(LEVEL_RANK.L2, 2);
  });
});

describe("Phase 6A — state machine", () => {
  it("allows PLANNED → DRY_RUN_COMPLETE", () => {
    assert.equal(canTransition("PLANNED", "DRY_RUN_COMPLETE"), true);
  });

  it("denies SUCCEEDED → RUNNING", () => {
    assert.equal(canTransition("SUCCEEDED", "RUNNING"), false);
    assert.throws(() => assertTransition("SUCCEEDED", "RUNNING"), (e) => e.code === "INVALID_STATE_TRANSITION");
  });

  it("denies SAFE_STOPPED → RUNNING", () => {
    assert.equal(canTransition("SAFE_STOPPED", "RUNNING"), false);
  });
});

describe("Phase 6A — sanitization", () => {
  it("redacts secrets from payloads", () => {
    const out = sanitizeRemediationPayload({
      token: "secret-token",
      password: "p@ss",
      nested: { api_key: "k", ok: true },
      evidence: { authorization: "Bearer x" }
    });
    assert.equal(out.token, "[REDACTED]");
    assert.equal(out.password, "[REDACTED]");
    assert.equal(out.nested.api_key, "[REDACTED]");
    assert.equal(out.nested.ok, true);
  });
});

describe("Phase 6A — approval scope hash", () => {
  it("scope hash is stable and tenant-specific", () => {
    const a = scopeHash({
      organizationId: 1,
      executionId: 10,
      actionType: "TEST_SET_FLAG",
      letter: "A",
      assetId: null
    });
    const b = scopeHash({
      organizationId: 1,
      executionId: 10,
      actionType: "TEST_SET_FLAG",
      letter: "A",
      assetId: null
    });
    const c = scopeHash({
      organizationId: 2,
      executionId: 10,
      actionType: "TEST_SET_FLAG",
      letter: "A",
      assetId: null
    });
    assert.equal(a, b);
    assert.notEqual(a, c);
  });

  it("execution keys differ by nonce", () => {
    const k1 = makeExecutionKey({ organizationId: 1, letter: "A", actionType: "HTTP_RECHECK", nonce: "a" });
    const k2 = makeExecutionKey({ organizationId: 1, letter: "A", actionType: "HTTP_RECHECK", nonce: "b" });
    assert.notEqual(k1, k2);
  });
});

describe("Phase 6A — dry-run contract (no mutation flag)", () => {
  it("HTTP dryRun returns mutation:false without pool probe when preconditions fail safely", async () => {
    const action = getAction("HTTP_RECHECK");
    const fakePool = {
      query: async () => ({ rows: [] })
    };
    const result = await action.dryRun({
      pool: fakePool,
      organizationId: 1,
      assetId: 99,
      input: {}
    });
    assert.equal(result.mutation, false);
    assert.equal(result.ok, false);
  });
});

describe("Phase 6 — registration completeness", () => {
  it("isRegistered true for allowlisted types", () => {
    assert.equal(isRegistered("TLS_RECHECK"), true);
    assert.equal(isRegistered("not-a-thing"), false);
  });
});
