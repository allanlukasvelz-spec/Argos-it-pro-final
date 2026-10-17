/**
 * Phase 6B — simulator execution, approval, concurrency (fake transactional pool).
 */
const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  createExecution,
  dryRunExecution,
  executeRemediation,
  rollbackRemediation,
  requestApproval,
  decideApproval,
  getExecution
} = require("./engine");

function createFakePool() {
  const state = {
    orgs: [{ id: 1 }],
    runbooks: [{ id: 100 }],
    versions: [{ id: 200, runbook_id: 100, version: 1, steps: { A: { action_type: "TEST_SET_FLAG" } } }],
    executions: [],
    events: [],
    approvals: [],
    flags: [],
    nextExecId: 1,
    nextEventId: 1,
    nextApprovalId: 1,
    nextFlagId: 1
  };

  function match(sql) {
    return sql.replace(/\s+/g, " ").trim();
  }

  const pool = {
    state,
    async connect() {
      const client = {
        _inTx: false,
        async query(sql, params = []) {
          return pool.query(sql, params, client);
        },
        async release() {}
      };
      return client;
    },
    async query(sql, params = [], _client) {
      const s = match(sql);

      if (s === "BEGIN" || s === "COMMIT" || s === "ROLLBACK") {
        return { rows: [] };
      }

      if (s.startsWith("INSERT INTO remediation_executions")) {
        const row = {
          id: state.nextExecId++,
          organization_id: params[0],
          incident_id: params[1],
          asset_id: params[2],
          runbook_id: params[3],
          runbook_version_id: params[4],
          execution_key: params[5],
          letter: params[6],
          action_type: params[7],
          safety_level: params[8],
          state: "PLANNED",
          hypothesis: params[9],
          confidence: params[10],
          evidence_in: typeof params[11] === "string" ? JSON.parse(params[11]) : params[11],
          evidence_out: {},
          failure_evidence: {},
          expected_result: params[12],
          verification_plan: {},
          rollback_plan: {},
          input: typeof params[13] === "string" ? JSON.parse(params[13]) : params[13],
          warnings: [],
          actor_user_id: params[14],
          requested_by: params[14],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          started_at: null,
          finished_at: null
        };
        if (state.executions.some((e) => e.organization_id === row.organization_id && e.execution_key === row.execution_key)) {
          const err = new Error("duplicate");
          err.code = "23505";
          throw err;
        }
        state.executions.push(row);
        return { rows: [row] };
      }

      if (s.startsWith("INSERT INTO remediation_events")) {
        state.events.push({
          id: state.nextEventId++,
          organization_id: params[0],
          execution_id: params[1],
          kind: params[2],
          actor_user_id: params[3],
          payload: typeof params[4] === "string" ? JSON.parse(params[4]) : params[4],
          created_at: new Date().toISOString()
        });
        return { rows: [] };
      }

      if (s.includes("FROM remediation_executions WHERE id") && s.includes("FOR UPDATE")) {
        const row = state.executions.find((e) => e.id === params[0]);
        return { rows: row ? [{ ...row }] : [] };
      }

      if (s.includes("FROM remediation_executions WHERE id") && !s.includes("FOR UPDATE")) {
        if (params.length === 2) {
          const row = state.executions.find(
            (e) => e.id === params[0] && e.organization_id === params[1]
          );
          return { rows: row ? [{ ...row }] : [] };
        }
        const row = state.executions.find((e) => e.id === params[0]);
        return { rows: row ? [{ ...row }] : [] };
      }

      if (s.startsWith("UPDATE remediation_executions SET state")) {
        const id = params[0];
        const next = params[1];
        const from = params[2];
        const row = state.executions.find((e) => e.id === id);
        if (!row || row.state !== from) return { rows: [] };
        row.state = next;
        row.updated_at = new Date().toISOString();
        if (next === "RUNNING" && !row.started_at) row.started_at = new Date().toISOString();
        if (["SUCCEEDED", "FAILED", "ROLLED_BACK", "ROLLBACK_FAILED", "SAFE_STOPPED", "CANCELLED"].includes(next)) {
          row.finished_at = new Date().toISOString();
        }
        return { rows: [{ ...row }] };
      }

      if (s.startsWith("UPDATE remediation_executions SET") && s.includes("verification_plan")) {
        const row = state.executions.find((e) => e.id === params[0]);
        if (!row) return { rows: [] };
        row.verification_plan = JSON.parse(params[1]);
        row.rollback_plan = JSON.parse(params[2]);
        row.warnings = JSON.parse(params[3]);
        if (params[4]) row.expected_result = params[4];
        return { rows: [row] };
      }

      if (s.startsWith("UPDATE remediation_executions SET evidence_out")) {
        const row = state.executions.find((e) => e.id === params[0]);
        if (row) row.evidence_out = JSON.parse(params[1]);
        return { rows: [] };
      }

      if (s.startsWith("UPDATE remediation_executions SET failure_evidence")) {
        const row = state.executions.find((e) => e.id === params[0]);
        if (row) {
          row.failure_evidence = JSON.parse(params[1]);
          if (s.includes("evidence_out")) row.evidence_out = JSON.parse(params[1]);
        }
        return { rows: [] };
      }

      if (s.includes("FROM organizations WHERE id")) {
        return { rows: state.orgs.filter((o) => o.id === params[0]) };
      }

      if (s.startsWith("INSERT INTO remediation_approvals")) {
        const row = {
          id: state.nextApprovalId++,
          organization_id: params[0],
          execution_id: params[1],
          requested_by: params[2],
          approved_by: null,
          decision: "PENDING",
          reason: params[3],
          scope_hash: params[4],
          requested_at: new Date().toISOString(),
          decided_at: null,
          expires_at: params[5],
          consumed_at: null
        };
        state.approvals.push(row);
        return { rows: [row] };
      }

      if (s.includes("FROM remediation_approvals WHERE id") && s.includes("FOR UPDATE")) {
        const row = state.approvals.find((a) => a.id === params[0]);
        return { rows: row ? [{ ...row }] : [] };
      }

      if (s.includes("FROM remediation_approvals") && s.includes("decision = 'APPROVED'")) {
        const rows = state.approvals.filter(
          (a) =>
            a.execution_id === params[0] &&
            a.organization_id === params[1] &&
            a.decision === "APPROVED"
        );
        return { rows: rows.map((r) => ({ ...r })) };
      }

      if (s.startsWith("UPDATE remediation_approvals")) {
        const row = state.approvals.find((a) => a.id === params[0]);
        if (!row) return { rows: [] };
        if (s.includes("CONSUMED")) {
          row.decision = "CONSUMED";
          row.consumed_at = new Date().toISOString();
        } else if (s.includes("EXPIRED")) {
          row.decision = "EXPIRED";
          row.decided_at = new Date().toISOString();
        } else {
          row.decision = params[1];
          row.approved_by = params[2];
          if (params[3]) row.reason = params[3];
          row.decided_at = new Date().toISOString();
        }
        return { rows: [row] };
      }

      if (s.startsWith("DELETE FROM remediation_test_flags")) {
        state.flags = state.flags.filter(
          (f) => !(f.organization_id === params[0] && f.flag_key === params[1])
        );
        return { rows: [] };
      }

      if (s.includes("SELECT") && s.includes("FROM remediation_test_flags")) {
        const row = state.flags.find(
          (f) => f.organization_id === params[0] && f.flag_key === params[1]
        );
        return { rows: row ? [{ ...row }] : [] };
      }

      if (s.startsWith("INSERT INTO remediation_test_flags")) {
        const existing = state.flags.find(
          (f) => f.organization_id === params[0] && f.flag_key === params[1]
        );
        if (existing) {
          if (s.includes("version + 1") || s.includes("version = remediation_test_flags.version + 1")) {
            existing.version += 1;
            if (params[2] != null && s.includes("flag_value")) existing.flag_value = params[2];
          } else if (s.includes("DO UPDATE SET version = $3") || params[2] != null && !s.includes("flag_value = EXCLUDED")) {
            // restore path with version = $3
            if (typeof params[2] === "number") existing.version = params[2];
            else if (params[2] != null) existing.flag_value = params[2];
            if (params[3] != null && typeof params[3] === "number") existing.version = params[3];
          } else {
            existing.flag_value = params[2];
            existing.version += 1;
          }
          existing.updated_at = new Date().toISOString();
          return { rows: [existing] };
        }
        const row = {
          id: state.nextFlagId++,
          organization_id: params[0],
          flag_key: params[1],
          flag_value: params[2] ?? "",
          version: typeof params[2] === "number" ? params[2] : 1,
          updated_at: new Date().toISOString()
        };
        if (typeof params[2] === "string") row.flag_value = params[2];
        state.flags.push(row);
        return { rows: [row] };
      }

      if (s.startsWith("UPDATE remediation_test_flags")) {
        const row = state.flags.find(
          (f) => f.organization_id === params[0] && f.flag_key === params[1]
        );
        if (!row) return { rows: [] };
        if (s.includes("flag_value")) {
          row.flag_value = params[2];
          row.version = params[3];
        } else {
          row.version = params[2];
        }
        return { rows: [row] };
      }

      // default
      return { rows: [] };
    }
  };

  return pool;
}

describe("Phase 6B — simulator execute/verify/rollback", () => {
  let pool;

  beforeEach(() => {
    pool = createFakePool();
    process.env.ALLOW_NOC_SELF_APPROVAL = "1";
  });

  it("dry-run does not mutate flags", async () => {
    const exec = await createExecution(pool, {
      organizationId: 1,
      runbookId: 100,
      runbookVersionId: 200,
      actionType: "TEST_SET_FLAG",
      input: { flagKey: "demo", flagValue: "on" },
      actorUserId: 7,
      executionKey: "key-dry-1"
    });
    const dry = await dryRunExecution(pool, exec.id, 7);
    assert.equal(dry.ok, true);
    assert.equal(dry.mutation, false);
    assert.equal(pool.state.flags.length, 0);
    assert.equal(dry.execution.state, "DRY_RUN_COMPLETE");
  });

  it("execute + verify + rollback on TEST_SET_FLAG", async () => {
    const exec = await createExecution(pool, {
      organizationId: 1,
      runbookId: 100,
      runbookVersionId: 200,
      actionType: "TEST_SET_FLAG",
      input: { flagKey: "demo", flagValue: "on" },
      actorUserId: 7,
      executionKey: "key-exec-1"
    });
    await dryRunExecution(pool, exec.id, 7);
    const result = await executeRemediation(pool, exec.id, 7);
    assert.equal(result.ok, true);
    assert.equal(result.verification, "VERIFICATION_PASS");
    assert.equal(pool.state.flags[0].flag_value, "on");
    assert.equal(result.execution.state, "SUCCEEDED");

    const rb = await rollbackRemediation(pool, exec.id, 7);
    assert.equal(rb.ok, true);
    assert.equal(rb.execution.state, "ROLLED_BACK");
    assert.equal(pool.state.flags.length, 0);
  });

  it("double execute after success is denied", async () => {
    const exec = await createExecution(pool, {
      organizationId: 1,
      runbookId: 100,
      runbookVersionId: 200,
      actionType: "TEST_SET_FLAG",
      input: { flagKey: "demo", flagValue: "x" },
      actorUserId: 7,
      executionKey: "key-dup-1"
    });
    await dryRunExecution(pool, exec.id, 7);
    await executeRemediation(pool, exec.id, 7);
    await assert.rejects(() => executeRemediation(pool, exec.id, 7), (e) => e.code === "INVALID_STATE_TRANSITION");
  });

  it("duplicate execution_key rejected", async () => {
    await createExecution(pool, {
      organizationId: 1,
      runbookId: 100,
      runbookVersionId: 200,
      actionType: "TEST_SET_FLAG",
      input: { flagKey: "demo", flagValue: "x" },
      actorUserId: 7,
      executionKey: "same-key"
    });
    await assert.rejects(
      () =>
        createExecution(pool, {
          organizationId: 1,
          runbookId: 100,
          runbookVersionId: 200,
          actionType: "TEST_SET_FLAG",
          input: { flagKey: "demo", flagValue: "y" },
          actorUserId: 7,
          executionKey: "same-key"
        }),
      (e) => e.code === "IDEMPOTENCY_CONFLICT"
    );
  });

  it("L2 without dry-run is denied", async () => {
    const exec = await createExecution(pool, {
      organizationId: 1,
      runbookId: 100,
      runbookVersionId: 200,
      actionType: "TEST_SET_FLAG",
      input: { flagKey: "demo", flagValue: "x" },
      actorUserId: 7,
      executionKey: "key-nodry"
    });
    await assert.rejects(() => executeRemediation(pool, exec.id, 7), (e) => e.code === "DRY_RUN_REQUIRED");
  });
});

describe("Phase 6 — approval scope", () => {
  let pool;

  beforeEach(() => {
    pool = createFakePool();
    delete process.env.ALLOW_NOC_SELF_APPROVAL;
  });

  it("self-approval denied by default", async () => {
    // Use L3 by temporarily... we don't have L3 actions in registry that aren't blocked.
    // Request approval path still works for any execution; force safety by creating L2 and requesting approval.
    const exec = await createExecution(pool, {
      organizationId: 1,
      runbookId: 100,
      runbookVersionId: 200,
      actionType: "TEST_SET_FLAG",
      input: { flagKey: "a", flagValue: "1" },
      actorUserId: 7,
      executionKey: "appr-1"
    });
    await dryRunExecution(pool, exec.id, 7);
    const req = await requestApproval(pool, exec.id, 7, "need");
    await assert.rejects(
      () => decideApproval(pool, req.approval.id, 7, "APPROVED"),
      (e) => e.code === "SELF_APPROVAL_DENIED"
    );
  });

  it("other operator can approve", async () => {
    process.env.ALLOW_NOC_SELF_APPROVAL = "0";
    const exec = await createExecution(pool, {
      organizationId: 1,
      runbookId: 100,
      runbookVersionId: 200,
      actionType: "TEST_SET_FLAG",
      input: { flagKey: "a", flagValue: "1" },
      actorUserId: 7,
      executionKey: "appr-2"
    });
    await dryRunExecution(pool, exec.id, 7);
    const req = await requestApproval(pool, exec.id, 7, "need");
    const decided = await decideApproval(pool, req.approval.id, 8, "APPROVED");
    assert.equal(decided.approval.decision, "APPROVED");
  });

  it("L3 execute without approval denied", async () => {
    const exec = await createExecution(pool, {
      organizationId: 1,
      runbookId: 100,
      runbookVersionId: 200,
      actionType: "TEST_L3_SET_FLAG",
      input: { flagKey: "l3", flagValue: "x" },
      actorUserId: 7,
      executionKey: "l3-noappr"
    });
    await dryRunExecution(pool, exec.id, 7);
    await assert.rejects(() => executeRemediation(pool, exec.id, 7), (e) => e.code === "APPROVAL_REQUIRED");
  });

  it("L3 with valid approval then execute", async () => {
    process.env.ALLOW_NOC_SELF_APPROVAL = "1";
    const exec = await createExecution(pool, {
      organizationId: 1,
      runbookId: 100,
      runbookVersionId: 200,
      actionType: "TEST_L3_SET_FLAG",
      input: { flagKey: "l3", flagValue: "ok" },
      actorUserId: 7,
      executionKey: "l3-ok"
    });
    await dryRunExecution(pool, exec.id, 7);
    const req = await requestApproval(pool, exec.id, 7, "ok");
    await decideApproval(pool, req.approval.id, 7, "APPROVED");
    const result = await executeRemediation(pool, exec.id, 7);
    assert.equal(result.ok, true);
    assert.equal(pool.state.flags[0].flag_value, "ok");
  });
});
