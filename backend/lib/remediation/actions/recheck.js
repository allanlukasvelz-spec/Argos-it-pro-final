/**
 * L0 recheck actions — reuse Phase 3 monitor runners.
 * Dry-run never calls executeMonitorCheck.
 */
const { executeMonitorCheck } = require("../../monitoring/executeCheck");
const { sanitizeRemediationPayload } = require("../sanitize");

async function loadOrgAsset(pool, organizationId, assetId) {
  const r = await pool.query(
    `SELECT id, organization_id, hostname, name, type, status
     FROM assets WHERE id = $1 AND organization_id = $2`,
    [assetId, organizationId]
  );
  return r.rows[0] || null;
}

async function findMonitor(pool, organizationId, assetId, type) {
  const r = await pool.query(
    `SELECT * FROM monitors
     WHERE organization_id = $1 AND asset_id = $2 AND type = $3
       AND enabled = true AND status IN ('ACTIVE','ERROR')
     ORDER BY id ASC LIMIT 1`,
    [organizationId, assetId, type]
  );
  return r.rows[0] || null;
}

async function loadMonitor(pool, organizationId, monitorId) {
  const r = await pool.query(
    `SELECT * FROM monitors WHERE id = $1 AND organization_id = $2`,
    [monitorId, organizationId]
  );
  return r.rows[0] || null;
}

function failPre(message, code = "PRECONDITION_FAILED") {
  return { ok: false, code, message };
}

async function preconditionsTyped(ctx, type) {
  const { pool, organizationId, assetId, input } = ctx;
  if (!organizationId) return failPre("organization_id required");
  if (!assetId && !input.monitorId) return failPre("asset_id or monitorId required");

  let monitor;
  if (input.monitorId) {
    monitor = await loadMonitor(pool, organizationId, Number(input.monitorId));
    if (!monitor) return failPre("monitor not found in organization");
    if (type && monitor.type !== type) return failPre(`monitor type must be ${type}`);
  } else {
    const asset = await loadOrgAsset(pool, organizationId, assetId);
    if (!asset) return failPre("asset not found in organization");
    if (asset.status !== "active") return failPre("asset not active");
    monitor = await findMonitor(pool, organizationId, asset.id, type);
    if (!monitor) return failPre(`no enabled ${type} monitor for asset`);
  }
  return { ok: true, monitor };
}

async function preconditionsHttp(ctx) {
  return preconditionsTyped(ctx, "HTTP");
}
async function preconditionsTls(ctx) {
  return preconditionsTyped(ctx, "TLS");
}
async function preconditionsDns(ctx) {
  return preconditionsTyped(ctx, "DNS");
}
async function preconditionsMonitor(ctx) {
  const { pool, organizationId, input } = ctx;
  const monitor = await loadMonitor(pool, organizationId, Number(input.monitorId));
  if (!monitor) return failPre("monitor not found in organization");
  if (!monitor.enabled) return failPre("monitor disabled");
  return { ok: true, monitor };
}

function dryPlan(actionType, monitor, assetHostname) {
  return {
    action: actionType,
    target: {
      monitorId: monitor.id,
      assetId: monitor.asset_id,
      organizationId: monitor.organization_id,
      hostname: assetHostname || null,
      monitorType: monitor.type
    },
    preconditions: ["org match", "monitor enabled", "typed runner only"],
    expected_effect:
      "Append control-plane observation via existing monitor runner. No customer infra mutation.",
    risk_level: "L0",
    approval_required: false,
    verification_plan: {
      require: "check_row_finished",
      note: "Verification confirms monitor_check completed; target health may remain UNKNOWN."
    },
    rollback_plan: { available: false, reason: "L0 read/observe — nothing to roll back" },
    warnings: [
      "Runner failure ≠ customer CRITICAL.",
      "Dry run performs no probe."
    ]
  };
}

async function dryRunTyped(ctx, actionType, type) {
  const pre = await preconditionsTyped(ctx, type);
  if (!pre.ok) {
    return { ...pre, dry_run: true, mutation: false };
  }
  const asset = await loadOrgAsset(ctx.pool, ctx.organizationId, pre.monitor.asset_id);
  return {
    ok: true,
    dry_run: true,
    mutation: false,
    plan: dryPlan(actionType, pre.monitor, asset?.hostname)
  };
}

async function dryRunHttp(ctx) {
  return dryRunTyped(ctx, "HTTP_RECHECK", "HTTP");
}
async function dryRunTls(ctx) {
  return dryRunTyped(ctx, "TLS_RECHECK", "TLS");
}
async function dryRunDns(ctx) {
  return dryRunTyped(ctx, "DNS_RECHECK", "DNS");
}
async function dryRunMonitor(ctx) {
  const pre = await preconditionsMonitor(ctx);
  if (!pre.ok) return { ...pre, dry_run: true, mutation: false };
  const asset = await loadOrgAsset(ctx.pool, ctx.organizationId, pre.monitor.asset_id);
  return {
    ok: true,
    dry_run: true,
    mutation: false,
    plan: dryPlan("MONITOR_RECHECK", pre.monitor, asset?.hostname)
  };
}

async function runMonitor(ctx, monitor) {
  const asset = await loadOrgAsset(ctx.pool, ctx.organizationId, monitor.asset_id);
  if (!asset) {
    const err = new Error("asset missing");
    err.code = "PRECONDITION_FAILED";
    throw err;
  }
  const result = await executeMonitorCheck(ctx.pool, {
    monitor,
    hostname: asset.hostname
  });
  return sanitizeRemediationPayload({
    monitorCheckId: result.check?.id,
    checkStatus: result.check?.status,
    observationId: result.observation?.id,
    observationOk: result.observation?.ok,
    errorClass: result.observation?.error_class || result.check?.error_class,
    note: "Control-plane observation only"
  });
}

async function executeHttp(ctx) {
  const pre = await preconditionsHttp(ctx);
  if (!pre.ok) {
    const err = new Error(pre.message);
    err.code = pre.code;
    throw err;
  }
  return runMonitor(ctx, pre.monitor);
}
async function executeTls(ctx) {
  const pre = await preconditionsTls(ctx);
  if (!pre.ok) {
    const err = new Error(pre.message);
    err.code = pre.code;
    throw err;
  }
  return runMonitor(ctx, pre.monitor);
}
async function executeDns(ctx) {
  const pre = await preconditionsDns(ctx);
  if (!pre.ok) {
    const err = new Error(pre.message);
    err.code = pre.code;
    throw err;
  }
  return runMonitor(ctx, pre.monitor);
}
async function executeMonitor(ctx) {
  const pre = await preconditionsMonitor(ctx);
  if (!pre.ok) {
    const err = new Error(pre.message);
    err.code = pre.code;
    throw err;
  }
  return runMonitor(ctx, pre.monitor);
}

async function verifyRecheck(_ctx, result) {
  if (!result || !result.monitorCheckId) {
    return { pass: false, reason: "missing monitor_check id" };
  }
  return {
    pass: true,
    reason: "monitor_check recorded; target health not asserted as HEALTHY"
  };
}

module.exports = {
  preconditionsHttp,
  preconditionsTls,
  preconditionsDns,
  preconditionsMonitor,
  dryRunHttp,
  dryRunTls,
  dryRunDns,
  dryRunMonitor,
  executeHttp,
  executeTls,
  executeDns,
  executeMonitor,
  verifyRecheck
};
