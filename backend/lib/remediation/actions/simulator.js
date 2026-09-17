/**
 * L2 simulator — mutates ONLY remediation_test_flags.
 * Never touches customer assets/infra.
 */

async function preconditions(ctx) {
  if (!ctx.organizationId) {
    return { ok: false, code: "PRECONDITION_FAILED", message: "organization_id required" };
  }
  const org = await ctx.pool.query(`SELECT id FROM organizations WHERE id = $1`, [
    ctx.organizationId
  ]);
  if (!org.rows[0]) {
    return { ok: false, code: "PRECONDITION_FAILED", message: "organization not found" };
  }
  return { ok: true };
}

async function readFlag(pool, organizationId, flagKey) {
  const r = await pool.query(
    `SELECT flag_key, flag_value, version FROM remediation_test_flags
     WHERE organization_id = $1 AND flag_key = $2`,
    [organizationId, flagKey]
  );
  return r.rows[0] || null;
}

async function dryRunSet(ctx) {
  const pre = await preconditions(ctx);
  if (!pre.ok) return { ...pre, dry_run: true, mutation: false };
  const current = await readFlag(ctx.pool, ctx.organizationId, ctx.input.flagKey);
  return {
    ok: true,
    dry_run: true,
    mutation: false,
    plan: {
      action: "TEST_SET_FLAG",
      target: { organizationId: ctx.organizationId, flagKey: ctx.input.flagKey },
      preconditions: ["org exists", "simulator table only"],
      expected_effect: `Set flag_value to ${JSON.stringify(ctx.input.flagValue)}`,
      risk_level: "L2",
      approval_required: false,
      verification_plan: { require: "flag_value_equals" },
      rollback_plan: {
        available: true,
        restore: current
          ? { flagValue: current.flag_value, version: current.version }
          : { delete: true }
      },
      warnings: ["Simulator only — not customer infrastructure"]
    }
  };
}

async function executeSet(ctx) {
  const pre = await preconditions(ctx);
  if (!pre.ok) {
    const err = new Error(pre.message);
    err.code = pre.code;
    throw err;
  }
  const current = await readFlag(ctx.pool, ctx.organizationId, ctx.input.flagKey);
  const previous = current
    ? { flagValue: current.flag_value, version: current.version, existed: true }
    : { existed: false };
  await ctx.pool.query(
    `INSERT INTO remediation_test_flags (organization_id, flag_key, flag_value, version, updated_at)
     VALUES ($1, $2, $3, 1, NOW())
     ON CONFLICT (organization_id, flag_key)
     DO UPDATE SET flag_value = EXCLUDED.flag_value,
                   version = remediation_test_flags.version + 1,
                   updated_at = NOW()`,
    [ctx.organizationId, ctx.input.flagKey, ctx.input.flagValue]
  );
  const after = await readFlag(ctx.pool, ctx.organizationId, ctx.input.flagKey);
  return { previous, after };
}

async function verifySet(ctx, result) {
  const after = await readFlag(ctx.pool, ctx.organizationId, ctx.input.flagKey);
  if (!after || after.flag_value !== ctx.input.flagValue) {
    return { pass: false, reason: "flag value mismatch" };
  }
  return { pass: true, reason: "flag set verified", result };
}

async function rollbackSet(ctx) {
  const previous = ctx.evidenceOut?.previous || ctx.executeResult?.previous;
  if (!previous || previous.existed !== true) {
    await ctx.pool.query(
      `DELETE FROM remediation_test_flags WHERE organization_id = $1 AND flag_key = $2`,
      [ctx.organizationId, ctx.input.flagKey]
    );
    return { restored: "deleted" };
  }
  await ctx.pool.query(
    `UPDATE remediation_test_flags
     SET flag_value = $3, version = $4, updated_at = NOW()
     WHERE organization_id = $1 AND flag_key = $2`,
    [ctx.organizationId, ctx.input.flagKey, previous.flagValue, previous.version]
  );
  return { restored: previous };
}

async function dryRunIncrement(ctx) {
  const pre = await preconditions(ctx);
  if (!pre.ok) return { ...pre, dry_run: true, mutation: false };
  const current = await readFlag(ctx.pool, ctx.organizationId, ctx.input.flagKey);
  return {
    ok: true,
    dry_run: true,
    mutation: false,
    plan: {
      action: "TEST_INCREMENT_VERSION",
      target: { organizationId: ctx.organizationId, flagKey: ctx.input.flagKey },
      preconditions: ["org exists"],
      expected_effect: `version ${(current?.version || 0) + 1}`,
      risk_level: "L2",
      approval_required: false,
      verification_plan: { require: "version_incremented" },
      rollback_plan: {
        available: true,
        restoreVersion: current?.version || 0
      },
      warnings: ["Simulator only"]
    }
  };
}

async function executeIncrement(ctx) {
  const pre = await preconditions(ctx);
  if (!pre.ok) {
    const err = new Error(pre.message);
    err.code = pre.code;
    throw err;
  }
  const current = await readFlag(ctx.pool, ctx.organizationId, ctx.input.flagKey);
  const prevVersion = current?.version || 0;
  await ctx.pool.query(
    `INSERT INTO remediation_test_flags (organization_id, flag_key, flag_value, version, updated_at)
     VALUES ($1, $2, COALESCE($3, ''), 1, NOW())
     ON CONFLICT (organization_id, flag_key)
     DO UPDATE SET version = remediation_test_flags.version + 1, updated_at = NOW()`,
    [ctx.organizationId, ctx.input.flagKey, current?.flag_value || ""]
  );
  const after = await readFlag(ctx.pool, ctx.organizationId, ctx.input.flagKey);
  return { previousVersion: prevVersion, after };
}

async function verifyIncrement(ctx, result) {
  const after = await readFlag(ctx.pool, ctx.organizationId, ctx.input.flagKey);
  if (!after || after.version !== (result.previousVersion || 0) + 1) {
    return { pass: false, reason: "version not incremented" };
  }
  return { pass: true, reason: "version incremented" };
}

async function rollbackIncrement(ctx) {
  const prev = ctx.evidenceOut?.previousVersion ?? ctx.executeResult?.previousVersion;
  if (prev == null) {
    const err = new Error("no previous version for rollback");
    err.code = "ROLLBACK_UNAVAILABLE";
    throw err;
  }
  await ctx.pool.query(
    `UPDATE remediation_test_flags SET version = $3, updated_at = NOW()
     WHERE organization_id = $1 AND flag_key = $2`,
    [ctx.organizationId, ctx.input.flagKey, prev]
  );
  return { restoredVersion: prev };
}

async function dryRunRestore(ctx) {
  return dryRunIncrement(ctx).then((d) =>
    d.ok
      ? {
          ...d,
          plan: {
            ...d.plan,
            action: "TEST_RESTORE_VERSION",
            expected_effect: "Restore version from input.targetVersion or previous snapshot"
          }
        }
      : d
  );
}

async function executeRestore(ctx) {
  const pre = await preconditions(ctx);
  if (!pre.ok) {
    const err = new Error(pre.message);
    err.code = pre.code;
    throw err;
  }
  const current = await readFlag(ctx.pool, ctx.organizationId, ctx.input.flagKey);
  const target =
    ctx.input.targetVersion != null ? Number(ctx.input.targetVersion) : (current?.version || 1) - 1;
  if (!Number.isInteger(target) || target < 0) {
    const err = new Error("invalid targetVersion");
    err.code = "INVALID_INPUT";
    throw err;
  }
  await ctx.pool.query(
    `INSERT INTO remediation_test_flags (organization_id, flag_key, flag_value, version, updated_at)
     VALUES ($1, $2, '', $3, NOW())
     ON CONFLICT (organization_id, flag_key)
     DO UPDATE SET version = $3, updated_at = NOW()`,
    [ctx.organizationId, ctx.input.flagKey, target]
  );
  return { previousVersion: current?.version || 0, afterVersion: target };
}

async function verifyRestore(ctx, result) {
  const after = await readFlag(ctx.pool, ctx.organizationId, ctx.input.flagKey);
  if (!after || after.version !== result.afterVersion) {
    return { pass: false, reason: "restore version mismatch" };
  }
  return { pass: true, reason: "version restored" };
}

async function rollbackRestore(ctx) {
  const prev = ctx.evidenceOut?.previousVersion ?? ctx.executeResult?.previousVersion;
  await ctx.pool.query(
    `UPDATE remediation_test_flags SET version = $3, updated_at = NOW()
     WHERE organization_id = $1 AND flag_key = $2`,
    [ctx.organizationId, ctx.input.flagKey, prev || 0]
  );
  return { restoredVersion: prev || 0 };
}

module.exports = {
  preconditions,
  dryRunSet,
  executeSet,
  verifySet,
  rollbackSet,
  dryRunIncrement,
  executeIncrement,
  verifyIncrement,
  rollbackIncrement,
  dryRunRestore,
  executeRestore,
  verifyRestore,
  rollbackRestore
};
