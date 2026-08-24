/**
 * Execute one monitor check → observation → alerts → incidents.
 * Separates check execution status from target health.
 */
const { runHttpCheck } = require("./runners/http");
const { runTlsCheck } = require("./runners/tls");
const { runDnsCheck } = require("./runners/dns");
const { sanitizeEvidence } = require("./sanitizeEvidence");
const { applyObservationToAlerts } = require("./alertEngine");
const { maybeOpenIncidentFromAlert } = require("./incidentEngine");
const { ERROR_CLASS, CHECK_STATUS } = require("./constants");

/**
 * @param {import("pg").Pool} pool
 * @param {{ monitor: object, hostname: string }} args
 */
async function executeMonitorCheck(pool, args) {
  const monitor = args.monitor;
  const hostname = args.hostname;
  const organizationId = monitor.organization_id;
  const monitorId = monitor.id;
  const assetId = monitor.asset_id;

  const checkIns = await pool.query(
    `INSERT INTO monitor_checks (
       organization_id, monitor_id, asset_id, status, started_at
     ) VALUES ($1,$2,$3,'RUNNING',NOW())
     RETURNING *`,
    [organizationId, monitorId, assetId]
  );
  const check = checkIns.rows[0];
  const started = Date.now();

  let probe;
  try {
    if (monitor.type === "HTTP") {
      probe = await runHttpCheck({
        hostname,
        timeoutMs: monitor.timeout_ms,
        config: monitor.config
      });
    } else if (monitor.type === "TLS") {
      probe = await runTlsCheck({ hostname, timeoutMs: monitor.timeout_ms });
    } else if (monitor.type === "DNS") {
      probe = await runDnsCheck({ hostname, config: monitor.config });
    } else {
      probe = {
        ok: false,
        errorClass: ERROR_CLASS.RUNNER_ERROR,
        statusCode: null,
        latencyMs: null,
        evidence: { reason: "unsupported_type" }
      };
    }
  } catch (err) {
    probe = {
      ok: false,
      errorClass: ERROR_CLASS.RUNNER_ERROR,
      statusCode: null,
      latencyMs: Date.now() - started,
      evidence: sanitizeEvidence({ message: String(err.message || err).slice(0, 200) })
    };
  }

  const durationMs = probe.latencyMs != null ? probe.latencyMs : Date.now() - started;
  let checkStatus = "SUCCEEDED";
  if (probe.errorClass === ERROR_CLASS.TIMEOUT) checkStatus = "TIMED_OUT";
  else if (probe.errorClass === ERROR_CLASS.RUNNER_ERROR) checkStatus = "FAILED";
  else if (probe.errorClass === ERROR_CLASS.SSRF_BLOCKED) checkStatus = "FAILED";
  // Target HTTP 5xx still means the check *ran* successfully
  else if (probe.ok === false && probe.errorClass === ERROR_CLASS.HTTP_5XX) checkStatus = "SUCCEEDED";
  else if (probe.ok === false && probe.errorClass && probe.errorClass !== ERROR_CLASS.TLS_EXPIRING) {
    // observation recorded; execution succeeded for network probes that returned a result
    checkStatus = "SUCCEEDED";
  }

  await pool.query(
    `UPDATE monitor_checks SET
       status = $1,
       finished_at = NOW(),
       error_class = $2,
       duration_ms = $3
     WHERE id = $4 AND organization_id = $5`,
    [checkStatus, probe.errorClass || null, durationMs, check.id, organizationId]
  );

  const obsIns = await pool.query(
    `INSERT INTO observations (
       organization_id, monitor_id, monitor_check_id, asset_id,
       observed_at, ok, status_code, latency_ms, error_class,
       classification, evidence, source
     ) VALUES ($1,$2,$3,$4,NOW(),$5,$6,$7,$8,'DETECTED',$9::jsonb,'PLATFORM')
     RETURNING *`,
    [
      organizationId,
      monitorId,
      check.id,
      assetId,
      Boolean(probe.ok),
      probe.statusCode,
      durationMs,
      probe.errorClass || null,
      JSON.stringify(sanitizeEvidence(probe.evidence || {}))
    ]
  );
  const observation = obsIns.rows[0];

  const intervalMs = (Number(monitor.interval_seconds) || 60) * 1000;
  const jitter = Math.floor(Math.random() * Math.min(5000, intervalMs * 0.1));
  await pool.query(
    `UPDATE monitors SET
       last_check_at = NOW(),
       next_check_at = NOW() + ($1 || ' milliseconds')::interval,
       updated_at = NOW(),
       status = CASE
         WHEN $2 = 'RUNNER_ERROR' THEN 'ERROR'
         WHEN status = 'ERROR' THEN 'ACTIVE'
         ELSE status
       END
     WHERE id = $3 AND organization_id = $4`,
    [String(intervalMs + jitter), probe.errorClass || "", monitorId, organizationId]
  );

  // Persist DNS baseline on first success
  if (monitor.type === "DNS" && probe.ok && probe.evidence?.a) {
    const cfg = monitor.config && typeof monitor.config === "object" ? { ...monitor.config } : {};
    if (!cfg.baseline) {
      cfg.baseline = { a: probe.evidence.a, aaaa: probe.evidence.aaaa || [] };
      await pool.query(
        `UPDATE monitors SET config = $1::jsonb, updated_at = NOW()
         WHERE id = $2 AND organization_id = $3`,
        [JSON.stringify(cfg), monitorId, organizationId]
      );
    }
  }

  const alertResult = await applyObservationToAlerts(pool, {
    organizationId,
    monitorId,
    assetId,
    observation,
    hostname,
    monitorType: monitor.type
  });

  let incidentResult = { created: false, incident: null };
  if (alertResult.alert) {
    incidentResult = await maybeOpenIncidentFromAlert(pool, {
      organizationId,
      alert: alertResult.alert,
      hostname
    });
  }

  return {
    check: { id: check.id, status: checkStatus },
    observation,
    alert: alertResult,
    incident: incidentResult
  };
}

module.exports = {
  executeMonitorCheck,
  CHECK_STATUS
};
