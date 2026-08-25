const { sanitizeRemediationPayload } = require("../sanitize");

async function preconditions(ctx) {
  if (!ctx.organizationId || !ctx.incidentId) {
    return {
      ok: false,
      code: "PRECONDITION_FAILED",
      message: "organization_id and incident_id required"
    };
  }
  const r = await ctx.pool.query(
    `SELECT id FROM incidents WHERE id = $1 AND organization_id = $2`,
    [ctx.incidentId, ctx.organizationId]
  );
  if (!r.rows[0]) {
    return { ok: false, code: "PRECONDITION_FAILED", message: "incident not found in org" };
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
      action: "INCIDENT_EVIDENCE_REFRESH",
      target: { organizationId: ctx.organizationId, incidentId: ctx.incidentId },
      preconditions: ["incident in organization"],
      expected_effect: "Append EVIDENCE incident_event with sanitized snapshot.",
      risk_level: "L1",
      approval_required: false,
      verification_plan: { require: "event_id" },
      rollback_plan: { available: false, reason: "append-only event" },
      warnings: []
    }
  };
}

async function execute(ctx) {
  const pre = await preconditions(ctx);
  if (!pre.ok) {
    const err = new Error(pre.message);
    err.code = pre.code;
    throw err;
  }
  const payload = sanitizeRemediationPayload({
    source: "INCIDENT_EVIDENCE_REFRESH",
    evidenceIn: ctx.evidenceIn || {},
    at: new Date().toISOString()
  });
  const ins = await ctx.pool.query(
    `INSERT INTO incident_events (incident_id, organization_id, kind, payload, actor_user_id)
     VALUES ($1, $2, 'EVIDENCE', $3::jsonb, $4)
     RETURNING id, created_at`,
    [ctx.incidentId, ctx.organizationId, JSON.stringify(payload), ctx.actorUserId || null]
  );
  return { eventId: ins.rows[0].id, createdAt: ins.rows[0].created_at };
}

async function verify(_ctx, result) {
  if (!result?.eventId) return { pass: false, reason: "missing event id" };
  return { pass: true, reason: "evidence event appended" };
}

module.exports = { preconditions, dryRun, execute, verify };
