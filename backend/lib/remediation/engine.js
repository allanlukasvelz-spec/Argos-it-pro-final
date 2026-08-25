/**
 * Remediation engine — dry-run, approval, execute, verify, rollback, safe-stop.
 * DEFAULT = NO MUTATION until explicit execute after dry-run (policy).
 */
const { getAction, listActions } = require("./registry");
const { assertTransition, LEVEL_RANK } = require("./constants");
const { sanitizeRemediationPayload } = require("./sanitize");
const { scopeHash, makeExecutionKey } = require("./keys");

async function appendEvent(client, { organizationId, executionId, kind, actorUserId, payload }) {
  await client.query(
    `INSERT INTO remediation_events (organization_id, execution_id, kind, actor_user_id, payload)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [
      organizationId,
      executionId,
      kind,
      actorUserId || null,
      JSON.stringify(sanitizeRemediationPayload(payload || {}))
    ]
  );
}

async function setState(client, execution, nextState, actorUserId) {
  assertTransition(execution.state, nextState);
  const r = await client.query(
    `UPDATE remediation_executions
     SET state = $2, updated_at = NOW(),
         started_at = CASE WHEN $2 = 'RUNNING' AND started_at IS NULL THEN NOW() ELSE started_at END,
         finished_at = CASE WHEN $2 IN ('SUCCEEDED','FAILED','ROLLED_BACK','ROLLBACK_FAILED','SAFE_STOPPED','CANCELLED')
                            THEN NOW() ELSE finished_at END
     WHERE id = $1 AND state = $3
     RETURNING *`,
    [execution.id, nextState, execution.state]
  );
  if (!r.rows[0]) {
    const err = new Error("Concurrent state change — claim failed");
    err.code = "CONCURRENCY_CONFLICT";
    throw err;
  }
  await appendEvent(client, {
    organizationId: execution.organization_id,
    executionId: execution.id,
    kind: "STATE_CHANGE",
    actorUserId,
    payload: { from: execution.state, to: nextState }
  });
  return r.rows[0];
}

function rowToExecution(row) {
  if (!row) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    incidentId: row.incident_id,
    assetId: row.asset_id,
    runbookId: row.runbook_id,
    runbookVersionId: row.runbook_version_id,
    executionKey: row.execution_key,
    letter: row.letter,
    actionType: row.action_type,
    safetyLevel: row.safety_level,
    state: row.state,
    hypothesis: row.hypothesis,
    confidence: row.confidence,
    evidenceIn: row.evidence_in,
    evidenceOut: row.evidence_out,
    failureEvidence: row.failure_evidence,
    expectedResult: row.expected_result,
    verificationPlan: row.verification_plan,
    rollbackPlan: row.rollback_plan,
    input: row.input,
    warnings: row.warnings,
    actorUserId: row.actor_user_id,
    requestedBy: row.requested_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at
  };
}

async function getExecution(pool, id, organizationId = null) {
  const params = [id];
  let sql = `SELECT * FROM remediation_executions WHERE id = $1`;
  if (organizationId != null) {
    params.push(organizationId);
    sql += ` AND organization_id = $2`;
  }
  const r = await pool.query(sql, params);
  return r.rows[0] || null;
}

async function listEvents(pool, executionId, organizationId) {
  const r = await pool.query(
    `SELECT id, kind, actor_user_id, payload, created_at
     FROM remediation_events
     WHERE execution_id = $1 AND organization_id = $2
     ORDER BY created_at ASC, id ASC`,
    [executionId, organizationId]
  );
  return r.rows.map((e) => ({
    id: e.id,
    kind: e.kind,
    actorUserId: e.actor_user_id,
    payload: sanitizeRemediationPayload(e.payload),
    createdAt: e.created_at
  }));
}

/**
 * Create planned execution from runbook step (letter A/B/C).
 */
async function createExecution(pool, args) {
  const action = getAction(args.actionType);
  action.validateInput(args.input || {});

  if (LEVEL_RANK[action.safetyLevel] >= 4) {
    const err = new Error("L4 forbidden");
    err.code = "L4_FORBIDDEN";
    throw err;
  }

  if (action.safetyLevel === "L2" && typeof action.rollback !== "function") {
    const err = new Error("L2 requires rollback handler");
    err.code = "ROLLBACK_REQUIRED";
    throw err;
  }

  const executionKey =
    args.executionKey ||
    makeExecutionKey({
      organizationId: args.organizationId,
      incidentId: args.incidentId,
      letter: args.letter || "A",
      actionType: action.type
    });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ins = await client.query(
      `INSERT INTO remediation_executions (
         organization_id, incident_id, asset_id, runbook_id, runbook_version_id,
         execution_key, letter, action_type, safety_level, state,
         hypothesis, confidence, evidence_in, expected_result, input,
         actor_user_id, requested_by
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,'PLANNED',$10,$11,$12::jsonb,$13,$14::jsonb,$15,$15
       )
       RETURNING *`,
      [
        args.organizationId,
        args.incidentId || null,
        args.assetId || null,
        args.runbookId,
        args.runbookVersionId,
        executionKey,
        args.letter || "A",
        action.type,
        action.safetyLevel,
        args.hypothesis || null,
        args.confidence || "UNKNOWN",
        JSON.stringify(sanitizeRemediationPayload(args.evidenceIn || {})),
        args.expectedResult || null,
        JSON.stringify(args.input || {}),
        args.actorUserId || null
      ]
    );
    const row = ins.rows[0];
    await appendEvent(client, {
      organizationId: row.organization_id,
      executionId: row.id,
      kind: "RUNBOOK_SELECTED",
      actorUserId: args.actorUserId,
      payload: {
        runbookId: args.runbookId,
        runbookVersionId: args.runbookVersionId,
        actionType: action.type,
        letter: row.letter
      }
    });
    await client.query("COMMIT");
    return rowToExecution(row);
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.code === "23505") {
      const err = new Error("Duplicate execution_key");
      err.code = "IDEMPOTENCY_CONFLICT";
      throw err;
    }
    throw e;
  } finally {
    client.release();
  }
}

async function dryRunExecution(pool, executionId, actorUserId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await client.query(
      `SELECT * FROM remediation_executions WHERE id = $1 FOR UPDATE`,
      [executionId]
    );
    let execution = locked.rows[0];
    if (!execution) {
      const err = new Error("Execution not found");
      err.code = "NOT_FOUND";
      throw err;
    }
    if (!["PLANNED", "DRY_RUN_COMPLETE", "AWAITING_APPROVAL"].includes(execution.state)) {
      const err = new Error(`Cannot dry-run from state ${execution.state}`);
      err.code = "INVALID_STATE_TRANSITION";
      throw err;
    }

    const action = getAction(execution.action_type);
    action.validateInput(execution.input || {});

    const ctx = buildCtx(client, execution, actorUserId);
    const pre = await action.preconditions(ctx);
    if (!pre.ok) {
      await appendEvent(client, {
        organizationId: execution.organization_id,
        executionId: execution.id,
        kind: "PRECONDITION_FAILED",
        actorUserId,
        payload: pre
      });
      await client.query("COMMIT");
      return {
        ok: false,
        code: pre.code || "PRECONDITION_FAILED",
        preconditions: pre,
        mutation: false
      };
    }

    const planResult = await action.dryRun(ctx);
    if (planResult.mutation === true) {
      const err = new Error("Dry-run claimed mutation — rejected");
      err.code = "DRY_RUN_MUTATION";
      throw err;
    }

    const plan = planResult.plan || planResult;
    await client.query(
      `UPDATE remediation_executions SET
         verification_plan = $2::jsonb,
         rollback_plan = $3::jsonb,
         warnings = $4::jsonb,
         expected_result = COALESCE($5, expected_result),
         updated_at = NOW()
       WHERE id = $1`,
      [
        execution.id,
        JSON.stringify(plan.verification_plan || {}),
        JSON.stringify(plan.rollback_plan || {}),
        JSON.stringify(plan.warnings || []),
        plan.expected_effect || null
      ]
    );

    if (execution.state === "PLANNED") {
      execution = await setState(client, execution, "DRY_RUN_COMPLETE", actorUserId);
    }

    await appendEvent(client, {
      organizationId: execution.organization_id,
      executionId: execution.id,
      kind: "DRY_RUN",
      actorUserId,
      payload: { plan, mutation: false }
    });

    const final = (
      await client.query(`SELECT * FROM remediation_executions WHERE id = $1`, [executionId])
    ).rows[0];
    await client.query("COMMIT");
    return {
      ok: true,
      mutation: false,
      execution: rowToExecution(final),
      plan: sanitizeRemediationPayload(plan)
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

function buildCtx(clientOrPool, execution, actorUserId, extras = {}) {
  return {
    pool: clientOrPool,
    organizationId: execution.organization_id,
    incidentId: execution.incident_id,
    assetId: execution.asset_id,
    executionId: execution.id,
    input: execution.input || {},
    evidenceIn: execution.evidence_in || {},
    evidenceOut: execution.evidence_out || {},
    actorUserId,
    executeResult: extras.executeResult,
    ...extras
  };
}

function approvalRequired(safetyLevel) {
  return safetyLevel === "L3";
}

async function requestApproval(pool, executionId, actorUserId, reason) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await client.query(
      `SELECT * FROM remediation_executions WHERE id = $1 FOR UPDATE`,
      [executionId]
    );
    let execution = locked.rows[0];
    if (!execution) {
      const err = new Error("Not found");
      err.code = "NOT_FOUND";
      throw err;
    }
    if (!["DRY_RUN_COMPLETE", "PLANNED", "AWAITING_APPROVAL"].includes(execution.state)) {
      const err = new Error(`Cannot request approval from ${execution.state}`);
      err.code = "INVALID_STATE_TRANSITION";
      throw err;
    }
    if (execution.state === "PLANNED") {
      execution = await setState(client, execution, "DRY_RUN_COMPLETE", actorUserId);
    }
    if (execution.state === "DRY_RUN_COMPLETE") {
      execution = await setState(client, execution, "AWAITING_APPROVAL", actorUserId);
    }

    const hash = scopeHash({
      organizationId: execution.organization_id,
      executionId: execution.id,
      actionType: execution.action_type,
      letter: execution.letter,
      assetId: execution.asset_id
    });
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    const ins = await client.query(
      `INSERT INTO remediation_approvals (
         organization_id, execution_id, requested_by, decision, reason, scope_hash, expires_at
       ) VALUES ($1,$2,$3,'PENDING',$4,$5,$6)
       RETURNING *`,
      [
        execution.organization_id,
        execution.id,
        actorUserId,
        reason || null,
        hash,
        expires.toISOString()
      ]
    );
    await appendEvent(client, {
      organizationId: execution.organization_id,
      executionId: execution.id,
      kind: "APPROVAL_REQUESTED",
      actorUserId,
      payload: { approvalId: ins.rows[0].id, expiresAt: expires.toISOString() }
    });
    await client.query("COMMIT");
    return {
      approval: serializeApproval(ins.rows[0]),
      execution: rowToExecution(execution)
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

function serializeApproval(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    executionId: row.execution_id,
    requestedBy: row.requested_by,
    approvedBy: row.approved_by,
    decision: row.decision,
    reason: row.reason,
    scopeHash: row.scope_hash,
    requestedAt: row.requested_at,
    decidedAt: row.decided_at,
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at
  };
}

async function decideApproval(pool, approvalId, actorUserId, decision, reason) {
  if (!["APPROVED", "DENIED"].includes(decision)) {
    const err = new Error("decision must be APPROVED or DENIED");
    err.code = "INVALID_INPUT";
    throw err;
  }
  const allowSelf = process.env.ALLOW_NOC_SELF_APPROVAL === "1";
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const apr = await client.query(
      `SELECT * FROM remediation_approvals WHERE id = $1 FOR UPDATE`,
      [approvalId]
    );
    const approval = apr.rows[0];
    if (!approval) {
      const err = new Error("Approval not found");
      err.code = "NOT_FOUND";
      throw err;
    }
    if (approval.decision !== "PENDING") {
      const err = new Error("Approval not pending");
      err.code = "APPROVAL_INVALID";
      throw err;
    }
    if (new Date(approval.expires_at).getTime() < Date.now()) {
      await client.query(
        `UPDATE remediation_approvals SET decision = 'EXPIRED', decided_at = NOW() WHERE id = $1`,
        [approvalId]
      );
      await appendEvent(client, {
        organizationId: approval.organization_id,
        executionId: approval.execution_id,
        kind: "APPROVAL_EXPIRED",
        actorUserId,
        payload: { approvalId }
      });
      await client.query("COMMIT");
      const err = new Error("Approval expired");
      err.code = "APPROVAL_EXPIRED";
      throw err;
    }
    if (decision === "APPROVED" && !allowSelf && approval.requested_by === actorUserId) {
      const err = new Error("Self-approval denied (set ALLOW_NOC_SELF_APPROVAL=1 to override)");
      err.code = "SELF_APPROVAL_DENIED";
      throw err;
    }

    const exec = await client.query(
      `SELECT * FROM remediation_executions WHERE id = $1 FOR UPDATE`,
      [approval.execution_id]
    );
    let execution = exec.rows[0];
    const expectedHash = scopeHash({
      organizationId: execution.organization_id,
      executionId: execution.id,
      actionType: execution.action_type,
      letter: execution.letter,
      assetId: execution.asset_id
    });
    if (approval.scope_hash !== expectedHash) {
      const err = new Error("Approval scope mismatch");
      err.code = "APPROVAL_SCOPE_MISMATCH";
      throw err;
    }
    if (approval.organization_id !== execution.organization_id) {
      const err = new Error("Approval tenant mismatch");
      err.code = "TENANT_MISMATCH";
      throw err;
    }

    await client.query(
      `UPDATE remediation_approvals
       SET decision = $2, approved_by = $3, reason = COALESCE($4, reason), decided_at = NOW()
       WHERE id = $1`,
      [approvalId, decision, actorUserId, reason || null]
    );

    if (decision === "APPROVED") {
      if (execution.state === "AWAITING_APPROVAL") {
        execution = await setState(client, execution, "APPROVED", actorUserId);
      }
      await appendEvent(client, {
        organizationId: execution.organization_id,
        executionId: execution.id,
        kind: "APPROVAL_GRANTED",
        actorUserId,
        payload: { approvalId }
      });
    } else {
      await appendEvent(client, {
        organizationId: execution.organization_id,
        executionId: execution.id,
        kind: "APPROVAL_DENIED",
        actorUserId,
        payload: { approvalId }
      });
    }

    await client.query("COMMIT");
    return {
      approval: serializeApproval({
        ...approval,
        decision,
        approved_by: actorUserId,
        reason: reason || approval.reason
      }),
      execution: rowToExecution(execution)
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function requireValidApproval(client, execution) {
  if (!approvalRequired(execution.safety_level)) return null;
  const r = await client.query(
    `SELECT * FROM remediation_approvals
     WHERE execution_id = $1 AND organization_id = $2 AND decision = 'APPROVED'
     ORDER BY decided_at DESC LIMIT 1
     FOR UPDATE`,
    [execution.id, execution.organization_id]
  );
  const approval = r.rows[0];
  if (!approval) {
    const err = new Error("L3 requires server-validated approval");
    err.code = "APPROVAL_REQUIRED";
    throw err;
  }
  if (approval.consumed_at) {
    const err = new Error("Approval already consumed");
    err.code = "APPROVAL_REUSED";
    throw err;
  }
  if (new Date(approval.expires_at).getTime() < Date.now()) {
    await client.query(
      `UPDATE remediation_approvals SET decision = 'EXPIRED' WHERE id = $1`,
      [approval.id]
    );
    const err = new Error("Approval expired");
    err.code = "APPROVAL_EXPIRED";
    throw err;
  }
  const expectedHash = scopeHash({
    organizationId: execution.organization_id,
    executionId: execution.id,
    actionType: execution.action_type,
    letter: execution.letter,
    assetId: execution.asset_id
  });
  if (approval.scope_hash !== expectedHash) {
    const err = new Error("Approval scope mismatch");
    err.code = "APPROVAL_SCOPE_MISMATCH";
    throw err;
  }
  return approval;
}

async function executeRemediation(pool, executionId, actorUserId, { skipDryRunRequirement = false } = {}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await client.query(
      `SELECT * FROM remediation_executions WHERE id = $1 FOR UPDATE`,
      [executionId]
    );
    let execution = locked.rows[0];
    if (!execution) {
      const err = new Error("Not found");
      err.code = "NOT_FOUND";
      throw err;
    }

    // Terminal / in-progress guards
    if (["SUCCEEDED", "RUNNING", "VERIFYING", "SAFE_STOPPED", "CANCELLED"].includes(execution.state)) {
      const err = new Error(`Cannot execute from state ${execution.state}`);
      err.code = "INVALID_STATE_TRANSITION";
      throw err;
    }

    const action = getAction(execution.action_type);
    if (LEVEL_RANK[action.safetyLevel] >= 4) {
      const err = new Error("L4 forbidden");
      err.code = "L4_FORBIDDEN";
      throw err;
    }

    if (
      !skipDryRunRequirement &&
      !["DRY_RUN_COMPLETE", "APPROVED", "AWAITING_APPROVAL"].includes(execution.state) &&
      execution.safety_level !== "L0" &&
      execution.safety_level !== "L1"
    ) {
      // Policy: L2+ require prior dry-run
      if (execution.state === "PLANNED") {
        const err = new Error("Dry-run required before execute");
        err.code = "DRY_RUN_REQUIRED";
        throw err;
      }
    }

    if (approvalRequired(execution.safety_level)) {
      const approval = await requireValidApproval(client, execution);
      await client.query(
        `UPDATE remediation_approvals SET decision = 'CONSUMED', consumed_at = NOW() WHERE id = $1`,
        [approval.id]
      );
      if (execution.state === "AWAITING_APPROVAL") {
        execution = await setState(client, execution, "APPROVED", actorUserId);
      }
    } else if (execution.state === "DRY_RUN_COMPLETE" || execution.state === "PLANNED") {
      // L0/L1/L2 without approval: from DRY_RUN_COMPLETE → RUNNING (via implicit approve)
      if (execution.state === "PLANNED" && (execution.safety_level === "L0" || execution.safety_level === "L1")) {
        execution = await setState(client, execution, "DRY_RUN_COMPLETE", actorUserId);
      }
    }

    // Preconditions
    const ctx = buildCtx(client, execution, actorUserId);
    action.validateInput(execution.input || {});
    const pre = await action.preconditions(ctx);
    if (!pre.ok) {
      await appendEvent(client, {
        organizationId: execution.organization_id,
        executionId: execution.id,
        kind: "PRECONDITION_FAILED",
        actorUserId,
        payload: pre
      });
      execution = await setState(client, execution, "SAFE_STOPPED", actorUserId);
      await appendEvent(client, {
        organizationId: execution.organization_id,
        executionId: execution.id,
        kind: "SAFE_STOP",
        actorUserId,
        payload: { reason: "precondition_failed" }
      });
      await client.query("COMMIT");
      return { ok: false, code: "PRECONDITION_FAILED", execution: rowToExecution(execution) };
    }

    if (action.safetyLevel === "L2" && typeof action.rollback !== "function") {
      const err = new Error("L2 rollback missing");
      err.code = "ROLLBACK_REQUIRED";
      throw err;
    }

    // Claim RUNNING
    if (["DRY_RUN_COMPLETE", "APPROVED"].includes(execution.state)) {
      execution = await setState(client, execution, "RUNNING", actorUserId);
    } else if (execution.state === "AWAITING_APPROVAL" && !approvalRequired(execution.safety_level)) {
      execution = await setState(client, execution, "RUNNING", actorUserId);
    } else if (execution.state !== "RUNNING") {
      const err = new Error(`Cannot start run from ${execution.state}`);
      err.code = "INVALID_STATE_TRANSITION";
      throw err;
    }

    await appendEvent(client, {
      organizationId: execution.organization_id,
      executionId: execution.id,
      kind: "EXECUTION_STARTED",
      actorUserId,
      payload: { actionType: execution.action_type }
    });
    await appendEvent(client, {
      organizationId: execution.organization_id,
      executionId: execution.id,
      kind: "STEP_STARTED",
      actorUserId,
      payload: { letter: execution.letter }
    });

    let executeResult;
    try {
      executeResult = await action.execute(buildCtx(client, execution, actorUserId));
    } catch (execErr) {
      const failure = sanitizeRemediationPayload({
        error_class: execErr.code || "EXECUTE_ERROR",
        error_code: execErr.code || "EXECUTE_ERROR",
        message: String(execErr.message || "execute failed").slice(0, 500)
      });
      await client.query(
        `UPDATE remediation_executions SET failure_evidence = $2::jsonb, evidence_out = $2::jsonb WHERE id = $1`,
        [execution.id, JSON.stringify(failure)]
      );
      await appendEvent(client, {
        organizationId: execution.organization_id,
        executionId: execution.id,
        kind: "STEP_FAILED",
        actorUserId,
        payload: failure
      });
      execution = await setState(client, execution, "FAILED", actorUserId);
      await client.query("COMMIT");
      return { ok: false, code: "EXECUTE_FAILED", execution: rowToExecution(execution), failure };
    }

    await client.query(
      `UPDATE remediation_executions SET evidence_out = $2::jsonb WHERE id = $1`,
      [execution.id, JSON.stringify(sanitizeRemediationPayload(executeResult || {}))]
    );
    execution = await setState(client, execution, "VERIFYING", actorUserId);

    const verifyResult = await action.verify(
      buildCtx(client, execution, actorUserId, { executeResult }),
      executeResult
    );

    if (!verifyResult || !verifyResult.pass) {
      const failure = sanitizeRemediationPayload({
        error_class: "VERIFICATION_FAIL",
        message: verifyResult?.reason || "verification failed",
        executeResult
      });
      await client.query(
        `UPDATE remediation_executions SET failure_evidence = $2::jsonb WHERE id = $1`,
        [execution.id, JSON.stringify(failure)]
      );
      await appendEvent(client, {
        organizationId: execution.organization_id,
        executionId: execution.id,
        kind: "VERIFICATION_FAIL",
        actorUserId,
        payload: failure
      });
      execution = await setState(client, execution, "FAILED", actorUserId);
      await client.query("COMMIT");
      return { ok: false, code: "VERIFICATION_FAIL", execution: rowToExecution(execution), failure };
    }

    await appendEvent(client, {
      organizationId: execution.organization_id,
      executionId: execution.id,
      kind: "VERIFICATION_PASS",
      actorUserId,
      payload: verifyResult
    });
    await appendEvent(client, {
      organizationId: execution.organization_id,
      executionId: execution.id,
      kind: "STEP_SUCCEEDED",
      actorUserId,
      payload: { letter: execution.letter }
    });
    execution = await setState(client, execution, "SUCCEEDED", actorUserId);
    await client.query("COMMIT");
    return {
      ok: true,
      verification: "VERIFICATION_PASS",
      execution: rowToExecution(execution),
      result: sanitizeRemediationPayload(executeResult)
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function rollbackRemediation(pool, executionId, actorUserId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await client.query(
      `SELECT * FROM remediation_executions WHERE id = $1 FOR UPDATE`,
      [executionId]
    );
    let execution = locked.rows[0];
    if (!execution) {
      const err = new Error("Not found");
      err.code = "NOT_FOUND";
      throw err;
    }
    if (!["SUCCEEDED", "FAILED"].includes(execution.state)) {
      const err = new Error(`Cannot rollback from ${execution.state}`);
      err.code = "INVALID_STATE_TRANSITION";
      throw err;
    }
    const action = getAction(execution.action_type);
    if (typeof action.rollback !== "function") {
      const err = new Error("Rollback not available for this action");
      err.code = "ROLLBACK_UNAVAILABLE";
      throw err;
    }
    execution = await setState(client, execution, "ROLLING_BACK", actorUserId);
    await appendEvent(client, {
      organizationId: execution.organization_id,
      executionId: execution.id,
      kind: "ROLLBACK_STARTED",
      actorUserId,
      payload: {}
    });

    try {
      const result = await action.rollback(
        buildCtx(client, execution, actorUserId, {
          executeResult: execution.evidence_out
        })
      );
      await appendEvent(client, {
        organizationId: execution.organization_id,
        executionId: execution.id,
        kind: "ROLLBACK_RESULT",
        actorUserId,
        payload: { ok: true, result: sanitizeRemediationPayload(result) }
      });
      execution = await setState(client, execution, "ROLLED_BACK", actorUserId);
      await client.query("COMMIT");
      return { ok: true, execution: rowToExecution(execution) };
    } catch (rbErr) {
      await appendEvent(client, {
        organizationId: execution.organization_id,
        executionId: execution.id,
        kind: "ROLLBACK_RESULT",
        actorUserId,
        payload: {
          ok: false,
          message: String(rbErr.message || "rollback failed").slice(0, 500)
        }
      });
      execution = await setState(client, execution, "ROLLBACK_FAILED", actorUserId);
      execution = await setState(client, execution, "SAFE_STOPPED", actorUserId);
      await appendEvent(client, {
        organizationId: execution.organization_id,
        executionId: execution.id,
        kind: "SAFE_STOP",
        actorUserId,
        payload: { reason: "rollback_failed" }
      });
      await appendEvent(client, {
        organizationId: execution.organization_id,
        executionId: execution.id,
        kind: "HUMAN_ESCALATION",
        actorUserId,
        payload: { reason: "rollback_failed" }
      });
      await client.query("COMMIT");
      return { ok: false, code: "ROLLBACK_FAILED", execution: rowToExecution(execution) };
    }
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function safeStop(pool, executionId, actorUserId, reason) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locked = await client.query(
      `SELECT * FROM remediation_executions WHERE id = $1 FOR UPDATE`,
      [executionId]
    );
    let execution = locked.rows[0];
    if (!execution) {
      const err = new Error("Not found");
      err.code = "NOT_FOUND";
      throw err;
    }
    if (execution.state === "SAFE_STOPPED" || execution.state === "CANCELLED") {
      await client.query("COMMIT");
      return rowToExecution(execution);
    }
    // Force path via allowed transitions or CANCELLED
    if (canForceSafeStop(execution.state)) {
      execution = await setState(client, execution, "SAFE_STOPPED", actorUserId);
    } else if (canTransitionCancel(execution.state)) {
      execution = await setState(client, execution, "CANCELLED", actorUserId);
    } else {
      const err = new Error(`Cannot safe-stop from ${execution.state}`);
      err.code = "INVALID_STATE_TRANSITION";
      throw err;
    }
    await appendEvent(client, {
      organizationId: execution.organization_id,
      executionId: execution.id,
      kind: "SAFE_STOP",
      actorUserId,
      payload: { reason: reason || "operator_stop" }
    });
    await appendEvent(client, {
      organizationId: execution.organization_id,
      executionId: execution.id,
      kind: "HUMAN_ESCALATION",
      actorUserId,
      payload: { reason: reason || "operator_stop" }
    });
    await client.query("COMMIT");
    return rowToExecution(execution);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

function canForceSafeStop(state) {
  const { canTransition } = require("./constants");
  return canTransition(state, "SAFE_STOPPED");
}
function canTransitionCancel(state) {
  const { canTransition } = require("./constants");
  return canTransition(state, "CANCELLED");
}

module.exports = {
  listActions,
  getAction,
  createExecution,
  dryRunExecution,
  requestApproval,
  decideApproval,
  executeRemediation,
  rollbackRemediation,
  safeStop,
  getExecution,
  listEvents,
  rowToExecution,
  serializeApproval,
  approvalRequired,
  appendEvent
};
