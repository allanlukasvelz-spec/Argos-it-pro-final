const { sanitizeRemediationPayload } = require("../sanitize");
const { createEvidenceService } = require("../../platform/evidenceService");
const {
  buildIdempotencyKey,
  collectIncidentEvidenceSnapshot,
  buildIncidentEvidenceArtifact,
  serializeArtifact,
  EVIDENCE_ARTIFACT_SCHEMA_VERSION
} = require("../incidentEvidenceArtifact");

async function preconditions(ctx) {
  if (!ctx.organizationId || !ctx.incidentId) {
    return {
      ok: false,
      code: "PRECONDITION_FAILED",
      message: "organization_id and incident_id required"
    };
  }
  if (!ctx.executionId) {
    return {
      ok: false,
      code: "PRECONDITION_FAILED",
      message: "execution_id required"
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
      target: {
        organizationId: ctx.organizationId,
        incidentId: ctx.incidentId,
        executionId: ctx.executionId
      },
      preconditions: ["incident in organization", "execution id present"],
      expected_effect:
        "Persist sanitized JSON evidence artifact via EvidenceService and append EVIDENCE incident_event with evidence_object_id.",
      risk_level: "L1",
      approval_required: false,
      verification_plan: { require: ["event_id", "evidence_object_id"] },
      rollback_plan: { available: false, reason: "append-only event + immutable object" },
      warnings: []
    }
  };
}

async function findExistingEvidenceEvent(ctx) {
  const { rows } = await ctx.pool.query(
    `SELECT id, created_at, payload
     FROM incident_events
     WHERE incident_id = $1
       AND organization_id = $2
       AND kind = 'EVIDENCE'
       AND payload->>'remediationExecutionId' = $3
     ORDER BY id ASC
     LIMIT 1`,
    [ctx.incidentId, ctx.organizationId, String(ctx.executionId)]
  );
  return rows[0] || null;
}

async function auditEventLinkFailure(ctx, evidenceObjectId, cause) {
  try {
    await ctx.pool.query(
      `INSERT INTO activity_logs(user_id, organization_id, action_type, details)
       VALUES ($1, $2, $3, $4)`,
      [
        ctx.actorUserId || null,
        ctx.organizationId,
        "evidence_event_link_failed",
        JSON.stringify(
          sanitizeRemediationPayload({
            evidenceObjectId,
            remediationExecutionId: ctx.executionId,
            incidentId: ctx.incidentId,
            cause: String(cause || "unknown").slice(0, 200)
          })
        )
      ]
    );
  } catch (auditErr) {
    console.error("[INCIDENT_EVIDENCE_REFRESH] audit marker failed:", auditErr.message);
  }
}

async function execute(ctx) {
  const pre = await preconditions(ctx);
  if (!pre.ok) {
    const err = new Error(pre.message);
    err.code = pre.code;
    throw err;
  }

  const snapshot = await collectIncidentEvidenceSnapshot(ctx.pool, ctx);
  const artifact = buildIncidentEvidenceArtifact(ctx, snapshot);
  const buffer = Buffer.from(serializeArtifact(artifact), "utf8");
  const evidence = createEvidenceService(ctx.pool);

  let stored;
  try {
    stored = await evidence.store({
      organizationId: ctx.organizationId,
      incidentId: ctx.incidentId,
      assetId: snapshot.assetId || null,
      remediationExecutionId: ctx.executionId,
      mimeType: "application/json",
      buffer,
      idempotencyKey: buildIdempotencyKey(ctx.executionId),
      createdBy: ctx.actorUserId || null,
      retentionClass: "STANDARD"
    });
  } catch (storeErr) {
    const err = new Error(storeErr.message || "evidence object persistence failed");
    err.code = storeErr.code || "EVIDENCE_STORE_FAILED";
    throw err;
  }

  const evidenceObjectId = stored.row.id;
  const existingEvent = await findExistingEvidenceEvent(ctx);
  if (existingEvent) {
    return {
      eventId: existingEvent.id,
      evidenceObjectId: existingEvent.payload?.evidenceObjectId || evidenceObjectId,
      createdAt: existingEvent.created_at,
      artifactSchemaVersion: EVIDENCE_ARTIFACT_SCHEMA_VERSION,
      sha256: stored.row.sha256,
      idempotent: true,
      evidenceCreated: stored.created
    };
  }

  const payload = sanitizeRemediationPayload({
    source: "INCIDENT_EVIDENCE_REFRESH",
    remediationExecutionId: ctx.executionId,
    evidenceObjectId,
    artifactSchemaVersion: EVIDENCE_ARTIFACT_SCHEMA_VERSION,
    sha256: stored.row.sha256,
    byteLength: Number(stored.row.byte_length),
    collectedAt: artifact.collectedAt,
    signal: artifact.signal
  });

  let ins;
  try {
    ins = await ctx.pool.query(
      `INSERT INTO incident_events (incident_id, organization_id, kind, payload, actor_user_id)
       VALUES ($1, $2, 'EVIDENCE', $3::jsonb, $4)
       RETURNING id, created_at`,
      [ctx.incidentId, ctx.organizationId, JSON.stringify(payload), ctx.actorUserId || null]
    );
  } catch (eventErr) {
    console.error("[INCIDENT_EVIDENCE_REFRESH] event link failed after object persisted", {
      evidenceObjectId,
      executionId: ctx.executionId,
      incidentId: ctx.incidentId,
      message: eventErr.message
    });
    await auditEventLinkFailure(ctx, evidenceObjectId, eventErr.message);
    const err = new Error("incident event append failed after evidence object persisted");
    err.code = "EVENT_LINK_FAILED";
    err.evidenceObjectId = evidenceObjectId;
    throw err;
  }

  return {
    eventId: ins.rows[0].id,
    evidenceObjectId,
    createdAt: ins.rows[0].created_at,
    artifactSchemaVersion: EVIDENCE_ARTIFACT_SCHEMA_VERSION,
    sha256: stored.row.sha256,
    evidenceCreated: stored.created
  };
}

async function verify(_ctx, result) {
  if (!result?.eventId) return { pass: false, reason: "missing event id" };
  if (!result?.evidenceObjectId) return { pass: false, reason: "missing evidence object id" };
  return { pass: true, reason: "evidence object persisted and event appended" };
}

module.exports = { preconditions, dryRun, execute, verify };
