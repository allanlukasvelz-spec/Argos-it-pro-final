/**
 * Deterministic JSON artifact for INCIDENT_EVIDENCE_REFRESH → EvidenceService.
 */
const { sanitizeRemediationPayload } = require("./sanitize");
const { sanitizeEvidence } = require("../monitoring/sanitizeEvidence");
const { evaluateAssetHealth } = require("../monitoring/healthEngine");

const EVIDENCE_ARTIFACT_SCHEMA_VERSION = 1;

function buildIdempotencyKey(executionId) {
  return `remediation:INCIDENT_EVIDENCE_REFRESH:exec:${executionId}`;
}

async function loadOpenAlertSummary(pool, organizationId, assetId) {
  if (!assetId) {
    return { openCount: 0, bySeverity: {} };
  }
  const { rows } = await pool.query(
    `SELECT severity, COUNT(*)::int AS count
     FROM alerts
     WHERE organization_id = $1
       AND asset_id = $2
       AND state IN ('OPEN', 'ACKNOWLEDGED')
     GROUP BY severity`,
    [organizationId, assetId]
  );
  const bySeverity = {};
  let openCount = 0;
  for (const row of rows) {
    bySeverity[row.severity] = row.count;
    openCount += row.count;
  }
  return { openCount, bySeverity };
}

async function loadAssetHealthSummary(pool, organizationId, assetId) {
  if (!assetId) return null;
  const asset = (
    await pool.query(
      `SELECT id, hostname FROM assets WHERE id = $1 AND organization_id = $2 AND status = 'active'`,
      [assetId, organizationId]
    )
  ).rows[0];
  if (!asset) return null;

  const monitorsR = await pool.query(
    `SELECT * FROM monitors WHERE organization_id = $1 AND asset_id = $2 AND enabled = true`,
    [organizationId, assetId]
  );
  const observationsByMonitor = {};
  for (const m of monitorsR.rows) {
    const obs = await pool.query(
      `SELECT id, monitor_id, status, observed_at
       FROM observations
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
    [organizationId, assetId]
  );
  const health = evaluateAssetHealth({
    asset: { id: asset.id },
    monitors: monitorsR.rows,
    observationsByMonitor,
    openCriticalAlerts: crit.rows.length > 0
  });
  return sanitizeRemediationPayload({
    assetId: asset.id,
    overall: health.overall,
    reasons: health.reasons
  });
}

async function collectIncidentEvidenceSnapshot(pool, ctx) {
  const { rows } = await pool.query(
    `SELECT id, organization_id, asset_id, title, summary, severity, state,
            correlation_key, opened_at, updated_at, resolved_at
     FROM incidents
     WHERE id = $1 AND organization_id = $2`,
    [ctx.incidentId, ctx.organizationId]
  );
  const incident = rows[0];
  if (!incident) {
    return { incident: null };
  }
  const assetId = ctx.assetId || incident.asset_id || null;
  const alertSummary = await loadOpenAlertSummary(pool, ctx.organizationId, assetId);
  const healthSummary = await loadAssetHealthSummary(pool, ctx.organizationId, assetId);
  return { incident, assetId, alertSummary, healthSummary };
}

function buildIncidentEvidenceArtifact(ctx, snapshot) {
  const incident = snapshot.incident;
  const collectedAt = new Date().toISOString();
  const safeEvidence = sanitizeRemediationPayload(
    sanitizeEvidence({
      evidenceIn: ctx.evidenceIn || {},
      input: ctx.input || {}
    })
  );

  return {
    schemaVersion: EVIDENCE_ARTIFACT_SCHEMA_VERSION,
    source: "INCIDENT_EVIDENCE_REFRESH",
    collectedAt,
    organizationId: ctx.organizationId,
    incidentId: ctx.incidentId,
    remediationExecutionId: ctx.executionId,
    assetId: snapshot.assetId || null,
    signal: incident
      ? {
          severity: incident.severity,
          state: incident.state,
          correlationKey: incident.correlation_key
        }
      : null,
    incident: incident
      ? {
          id: incident.id,
          title: incident.title,
          summary: incident.summary,
          severity: incident.severity,
          state: incident.state,
          correlationKey: incident.correlation_key,
          openedAt: incident.opened_at,
          updatedAt: incident.updated_at,
          resolvedAt: incident.resolved_at
        }
      : null,
    alerts: snapshot.alertSummary || { openCount: 0, bySeverity: {} },
    health: snapshot.healthSummary || null,
    safeEvidence
  };
}

function serializeArtifact(artifact) {
  return `${JSON.stringify(artifact, null, 0)}\n`;
}

module.exports = {
  EVIDENCE_ARTIFACT_SCHEMA_VERSION,
  buildIdempotencyKey,
  collectIncidentEvidenceSnapshot,
  buildIncidentEvidenceArtifact,
  serializeArtifact
};
