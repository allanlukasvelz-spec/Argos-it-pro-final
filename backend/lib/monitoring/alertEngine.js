/**
 * Alert upsert by fingerprint — no alert storms.
 */
const { sanitizeEvidence } = require("./sanitizeEvidence");
const { ERROR_CLASS } = require("./constants");

/**
 * Stable fingerprint: org + monitor + error_class (+ optional suffix).
 */
function buildFingerprint(organizationId, monitorId, errorClass, suffix = "") {
  const ec = errorClass || "UNKNOWN_CONDITION";
  return `org:${organizationId}|mon:${monitorId}|ec:${ec}${suffix ? `|${suffix}` : ""}`;
}

/**
 * Map observation to alert severity or null (no alert).
 */
function severityFromObservation(obs, monitorType) {
  const ec = obs.error_class || obs.errorClass;
  if (!ec) return null;

  // Runner/SSRF → do not open CRITICAL on target; optional WARNING omitted
  if (
    ec === ERROR_CLASS.SSRF_BLOCKED ||
    ec === ERROR_CLASS.RUNNER_ERROR ||
    ec === ERROR_CLASS.REDIRECT_BLOCKED
  ) {
    return null;
  }

  if (ec === ERROR_CLASS.TLS_EXPIRED || ec === ERROR_CLASS.HTTP_5XX || ec === ERROR_CLASS.CONN_REFUSED) {
    return "CRITICAL";
  }
  if (ec === ERROR_CLASS.DNS_NXDOMAIN) return "CRITICAL";
  if (
    ec === ERROR_CLASS.TLS_EXPIRING ||
    ec === ERROR_CLASS.TLS_HOSTNAME_MISMATCH ||
    ec === ERROR_CLASS.TLS_CHAIN_ERROR ||
    ec === ERROR_CLASS.HTTP_4XX ||
    ec === ERROR_CLASS.DNS_FAILURE ||
    ec === ERROR_CLASS.TIMEOUT
  ) {
    return "WARNING";
  }
  if (obs.ok === false) return "WARNING";
  return null;
}

function titleFor(errorClass, hostname) {
  const host = hostname || "asset";
  switch (errorClass) {
    case ERROR_CLASS.TLS_EXPIRED:
      return `TLS expirado: ${host}`;
    case ERROR_CLASS.TLS_EXPIRING:
      return `TLS por caducar: ${host}`;
    case ERROR_CLASS.HTTP_5XX:
      return `HTTP 5xx: ${host}`;
    case ERROR_CLASS.DNS_NXDOMAIN:
      return `DNS sin resolucion: ${host}`;
    case ERROR_CLASS.CONN_REFUSED:
      return `Conexion rechazada: ${host}`;
    default:
      return `Alerta de monitorizacion: ${host}`;
  }
}

/**
 * Upsert open alert or resolve when observation is healthy.
 * @param {import("pg").Pool} pool
 */
async function applyObservationToAlerts(pool, ctx) {
  const {
    organizationId,
    monitorId,
    assetId,
    observation,
    hostname,
    monitorType
  } = ctx;

  const ec = observation.error_class || observation.errorClass;
  const severity = severityFromObservation(observation, monitorType);

  if (!severity) {
    // Resolve open alerts for this monitor when observation is clean OK
    if (observation.ok === true && !ec) {
      await pool.query(
        `UPDATE alerts SET state = 'RESOLVED', resolved_at = NOW(), updated_at = NOW()
         WHERE organization_id = $1 AND monitor_id = $2 AND state IN ('OPEN', 'ACKNOWLEDGED')`,
        [organizationId, monitorId]
      );
    }
    return { created: false, updated: false, resolved: Boolean(observation.ok && !ec), alert: null };
  }

  const fingerprint = buildFingerprint(organizationId, monitorId, ec);
  const title = titleFor(ec, hostname);
  const evidence = sanitizeEvidence(observation.evidence || {});

  const existing = await pool.query(
    `SELECT * FROM alerts
     WHERE organization_id = $1 AND fingerprint = $2 AND state IN ('OPEN', 'ACKNOWLEDGED')
     LIMIT 1`,
    [organizationId, fingerprint]
  );

  if (existing.rows.length > 0) {
    const upd = await pool.query(
      `UPDATE alerts SET
         count = count + 1,
         last_seen_at = NOW(),
         updated_at = NOW(),
         severity = $1,
         observation_id = $2,
         evidence = $3::jsonb,
         reason = $4
       WHERE id = $5 AND organization_id = $6
       RETURNING *`,
      [
        severity,
        observation.id || null,
        JSON.stringify(evidence),
        ec,
        existing.rows[0].id,
        organizationId
      ]
    );
    return { created: false, updated: true, resolved: false, alert: upd.rows[0] };
  }

  const ins = await pool.query(
    `INSERT INTO alerts (
       organization_id, asset_id, monitor_id, severity, state, fingerprint,
       title, reason, evidence, observation_id
     ) VALUES ($1,$2,$3,$4,'OPEN',$5,$6,$7,$8::jsonb,$9)
     RETURNING *`,
    [
      organizationId,
      assetId,
      monitorId,
      severity,
      fingerprint,
      title,
      ec,
      JSON.stringify(evidence),
      observation.id || null
    ]
  );
  return { created: true, updated: false, resolved: false, alert: ins.rows[0] };
}

module.exports = {
  buildFingerprint,
  severityFromObservation,
  applyObservationToAlerts,
  titleFor
};
