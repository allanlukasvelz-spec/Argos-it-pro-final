/**
 * Conservative incident correlation: CRITICAL open alert → incident.
 * Dedupe by organization + correlation_key while not RESOLVED.
 */
const { sanitizeEvidence } = require("./sanitizeEvidence");

function correlationKey(assetId, errorClass) {
  return `asset:${assetId}|ec:${errorClass || "CRITICAL"}`;
}

/**
 * @param {import("pg").Pool} pool
 * @param {{ organizationId: number, alert: object, hostname?: string }} ctx
 */
async function maybeOpenIncidentFromAlert(pool, ctx) {
  const alert = ctx.alert;
  if (!alert || alert.severity !== "CRITICAL" || !["OPEN", "ACKNOWLEDGED"].includes(alert.state)) {
    return { created: false, updated: false, incident: null };
  }

  const assetId = alert.asset_id;
  if (!assetId) {
    return { created: false, updated: false, incident: null };
  }

  const key = correlationKey(assetId, alert.reason || alert.fingerprint);
  const existing = await pool.query(
    `SELECT * FROM incidents
     WHERE organization_id = $1 AND correlation_key = $2
       AND state IN ('OPEN', 'INVESTIGATING', 'MITIGATED')
     LIMIT 1`,
    [ctx.organizationId, key]
  );

  if (existing.rows.length > 0) {
    const incident = existing.rows[0];
    await pool.query(
      `UPDATE incidents SET updated_at = NOW() WHERE id = $1 AND organization_id = $2`,
      [incident.id, ctx.organizationId]
    );
    await pool.query(
      `INSERT INTO incident_events (incident_id, organization_id, kind, payload)
       VALUES ($1, $2, 'ALERT_LINKED', $3::jsonb)`,
      [
        incident.id,
        ctx.organizationId,
        JSON.stringify(
          sanitizeEvidence({
            alertId: alert.id,
            fingerprint: alert.fingerprint,
            count: alert.count
          })
        )
      ]
    );
    return { created: false, updated: true, incident };
  }

  const title = alert.title || `Incidente critico${ctx.hostname ? `: ${ctx.hostname}` : ""}`;
  const ins = await pool.query(
    `INSERT INTO incidents (
       organization_id, asset_id, title, summary, severity, state, correlation_key
     ) VALUES ($1,$2,$3,$4,'CRITICAL','OPEN',$5)
     RETURNING *`,
    [
      ctx.organizationId,
      assetId,
      title.slice(0, 300),
      `Derivado de alerta CRITICAL ${alert.id}. Evidence-linked; no auto-remediation.`,
      key
    ]
  );
  const incident = ins.rows[0];
  await pool.query(
    `INSERT INTO incident_events (incident_id, organization_id, kind, payload)
     VALUES ($1, $2, 'ALERT_LINKED', $3::jsonb)`,
    [
      incident.id,
      ctx.organizationId,
      JSON.stringify(
        sanitizeEvidence({
          alertId: alert.id,
          fingerprint: alert.fingerprint,
          created: true
        })
      )
    ]
  );
  await pool.query(
    `INSERT INTO incident_events (incident_id, organization_id, kind, payload)
     VALUES ($1, $2, 'STATE_CHANGE', $3::jsonb)`,
    [
      incident.id,
      ctx.organizationId,
      JSON.stringify({ from: null, to: "OPEN", reason: "critical_alert" })
    ]
  );
  return { created: true, updated: false, incident };
}

module.exports = {
  correlationKey,
  maybeOpenIncidentFromAlert
};
