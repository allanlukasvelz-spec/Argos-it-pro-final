/**
 * Build canonical Incident Summary model from authoritative PG sources.
 */
const { SCHEMA_VERSION, TEMPLATE_VERSION, REPORT_TYPE_INCIDENT_SUMMARY } = require("./reportConstants");

async function buildIncidentSummaryModel(pool, { organizationId, incidentId, reportId, dataCutoffAt }) {
  const orgResult = await pool.query(
    `SELECT id, name, slug FROM organizations WHERE id = $1`,
    [organizationId]
  );
  const org = orgResult.rows[0];
  if (!org) {
    const err = new Error("Organization not found");
    err.code = "ORG_NOT_FOUND";
    throw err;
  }

  const incResult = await pool.query(
    `SELECT * FROM incidents WHERE id = $1 AND organization_id = $2`,
    [incidentId, organizationId]
  );
  const incident = incResult.rows[0];
  if (!incident) {
    const err = new Error("Incident not found");
    err.code = "INCIDENT_NOT_FOUND";
    throw err;
  }

  const unknowns = [];

  let affectedAsset = null;
  if (incident.asset_id) {
    const assetResult = await pool.query(
      `SELECT id, hostname, type, status FROM assets WHERE id = $1 AND organization_id = $2`,
      [incident.asset_id, organizationId]
    );
    affectedAsset = assetResult.rows[0];
    if (!affectedAsset) {
      unknowns.push("Activo vinculado al incidente no disponible");
    }
  } else {
    unknowns.push("Incidente sin activo asociado");
  }

  const eventsResult = await pool.query(
    `SELECT id, kind, payload, created_at
     FROM incident_events
     WHERE incident_id = $1 AND organization_id = $2
     ORDER BY created_at ASC`,
    [incidentId, organizationId]
  );

  const timeline = eventsResult.rows.map((row) => ({
    at: row.created_at?.toISOString?.() || String(row.created_at),
    kind: row.kind,
    summary: summarizeEvent(row)
  }));

  const evidenceResult = await pool.query(
    `SELECT eo.id, eo.sha256, eo.created_at, eo.mime_type, eo.incident_id
     FROM evidence_objects eo
     WHERE eo.organization_id = $1 AND eo.incident_id::text = $2::text AND eo.status = 'AVAILABLE'
     ORDER BY eo.created_at ASC`,
    [organizationId, String(incidentId)]
  );

  const verifiedEvidence = evidenceResult.rows.map((row) => ({
    evidenceObjectId: row.id,
    sha256: row.sha256,
    createdAt: row.created_at?.toISOString?.() || String(row.created_at),
    source: "evidence_objects"
  }));

  if (verifiedEvidence.length === 0) {
    unknowns.push("Sin objetos de evidencia vinculados al incidente");
  }

  let remediationSummary = null;
  const remResult = await pool.query(
    `SELECT id, state, action_type FROM remediation_executions
     WHERE organization_id = $1 AND incident_id = $2
     ORDER BY created_at DESC LIMIT 1`,
    [organizationId, incidentId]
  );
  if (remResult.rows[0]) {
    const r = remResult.rows[0];
    remediationSummary = `Ejecución ${r.id}: ${r.action_type} — estado ${r.state}`;
  }

  let healthLabel = "UNKNOWN";
  if (affectedAsset?.status) {
    healthLabel = String(affectedAsset.status);
  }

  const freshnessCandidates = [
    incident.updated_at,
    ...eventsResult.rows.map((r) => r.created_at),
    ...evidenceResult.rows.map((r) => r.created_at)
  ].filter(Boolean);
  const dataFreshness = freshnessCandidates.length
    ? new Date(Math.max(...freshnessCandidates.map((d) => new Date(d).getTime())))
    : new Date(dataCutoffAt);

  return {
    reportSchemaVersion: SCHEMA_VERSION,
    reportType: REPORT_TYPE_INCIDENT_SUMMARY,
    reportId,
    organization: { id: org.id, name: org.name, slug: org.slug },
    incident: {
      id: incident.id,
      title: incident.title,
      state: incident.state,
      severity: incident.severity,
      openedAt: incident.opened_at?.toISOString?.() || String(incident.opened_at),
      resolvedAt: incident.resolved_at?.toISOString?.() || null,
      summary: incident.summary || null
    },
    period: {
      start: incident.opened_at?.toISOString?.() || null,
      end: incident.resolved_at?.toISOString?.() || dataCutoffAt
    },
    affectedAsset: affectedAsset
      ? {
          id: affectedAsset.id,
          label: affectedAsset.hostname || `asset-${affectedAsset.id}`,
          type: affectedAsset.type || "UNKNOWN"
        }
      : null,
    severity: incident.severity,
    status: incident.state,
    health: { label: healthLabel },
    timeline,
    verifiedEvidence,
    remediationSummary,
    unknowns,
    generatedAt: new Date().toISOString(),
    dataCutoffAt: new Date(dataCutoffAt).toISOString(),
    templateVersion: TEMPLATE_VERSION
  };
}

function summarizeEvent(row) {
  const kind = row.kind;
  const payload = row.payload || {};
  if (kind === "EVIDENCE" && payload.evidenceObjectId) {
    return `Evidencia registrada (${payload.evidenceObjectId})`;
  }
  if (kind === "STATE_CHANGE" && payload.to) {
    return `Estado → ${payload.to}`;
  }
  if (kind === "ALERT_LINKED" && payload.alertId) {
    return `Alerta vinculada #${payload.alertId}`;
  }
  return kind;
}

module.exports = { buildIncidentSummaryModel };
