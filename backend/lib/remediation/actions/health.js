const { evaluateAssetHealth, rollupOrganizationHealth } = require("../../monitoring/healthEngine");
const { sanitizeRemediationPayload } = require("../sanitize");

async function preconditions(ctx) {
  if (!ctx.organizationId) {
    return { ok: false, code: "PRECONDITION_FAILED", message: "organization_id required" };
  }
  if (ctx.assetId) {
    const a = await ctx.pool.query(
      `SELECT id FROM assets WHERE id = $1 AND organization_id = $2 AND status = 'active'`,
      [ctx.assetId, ctx.organizationId]
    );
    if (!a.rows[0]) {
      return { ok: false, code: "PRECONDITION_FAILED", message: "asset not found" };
    }
  }
  return { ok: true };
}

async function dryRun(ctx) {
  const pre = await preconditions(ctx);
  if (!pre.ok) return { ...pre, dry_run: true, mutation: false };
  return {
    ok: true,
    dry_run: true,
    mutation: false,
    plan: {
      action: "HEALTH_REEVALUATE",
      target: { organizationId: ctx.organizationId, assetId: ctx.assetId || null },
      preconditions: ["org exists", "optional asset in org"],
      expected_effect: "Recompute health from existing observations; no probes.",
      risk_level: "L1",
      approval_required: false,
      verification_plan: { require: "overall_present" },
      rollback_plan: { available: false, reason: "read-only recompute" },
      warnings: ["UNKNOWN ≠ HEALTHY"]
    }
  };
}

async function evaluateOne(pool, organizationId, asset) {
  const monitorsR = await pool.query(
    `SELECT * FROM monitors WHERE organization_id = $1 AND asset_id = $2 AND enabled = true`,
    [organizationId, asset.id]
  );
  const observationsByMonitor = {};
  for (const m of monitorsR.rows) {
    const obs = await pool.query(
      `SELECT * FROM observations
       WHERE organization_id = $1 AND monitor_id = $2
       ORDER BY observed_at DESC LIMIT 10`,
      [organizationId, m.id]
    );
    observationsByMonitor[m.id] = obs.rows;
  }
  const crit = await pool.query(
    `SELECT 1 FROM alerts
     WHERE organization_id = $1 AND asset_id = $2
       AND severity = 'CRITICAL' AND state IN ('OPEN','ACKNOWLEDGED') LIMIT 1`,
    [organizationId, asset.id]
  );
  return evaluateAssetHealth({
    asset: { id: asset.id },
    monitors: monitorsR.rows,
    observationsByMonitor,
    openCriticalAlerts: crit.rows.length > 0
  });
}

async function execute(ctx) {
  const pre = await preconditions(ctx);
  if (!pre.ok) {
    const err = new Error(pre.message);
    err.code = pre.code;
    throw err;
  }
  if (ctx.assetId) {
    const asset = (
      await ctx.pool.query(`SELECT id, hostname FROM assets WHERE id = $1 AND organization_id = $2`, [
        ctx.assetId,
        ctx.organizationId
      ])
    ).rows[0];
    const h = await evaluateOne(ctx.pool, ctx.organizationId, asset);
    return sanitizeRemediationPayload({
      scope: "asset",
      assetId: asset.id,
      overall: h.overall,
      reasons: h.reasons
    });
  }
  const assets = await ctx.pool.query(
    `SELECT id, hostname FROM assets WHERE organization_id = $1 AND status = 'active' ORDER BY id ASC LIMIT 100`,
    [ctx.organizationId]
  );
  const healths = [];
  for (const asset of assets.rows) {
    const h = await evaluateOne(ctx.pool, ctx.organizationId, asset);
    healths.push({ assetId: asset.id, ...h });
  }
  const rollup = rollupOrganizationHealth(healths);
  return sanitizeRemediationPayload({
    scope: "organization",
    sampleSize: healths.length,
    overall: rollup.overall,
    reasons: rollup.reasons
  });
}

async function verify(_ctx, result) {
  if (!result || !result.overall) {
    return { pass: false, reason: "missing overall" };
  }
  return { pass: true, reason: "health recompute returned overall" };
}

module.exports = { preconditions, dryRun, execute, verify };
