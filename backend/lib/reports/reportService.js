/**
 * Report service — lifecycle, idempotency, tenant binding.
 */
const { randomUUID } = require("crypto");
const {
  REPORT_TYPE_INCIDENT_SUMMARY,
  TEMPLATE_VERSION
} = require("./reportConstants");
const { createPlatformJobService } = require("../platform/platformJobs");
const { sanitizeEvidence } = require("../monitoring/sanitizeEvidence");

class ReportServiceError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const VALID_TRANSITIONS = {
  REQUESTED: ["QUEUED", "FAILED"],
  QUEUED: ["GENERATING", "FAILED"],
  GENERATING: ["STORING", "FAILED"],
  STORING: ["READY", "FAILED"],
  READY: ["EXPIRED"],
  FAILED: [],
  EXPIRED: []
};

function assertTransition(from, to) {
  const allowed = VALID_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    const err = new ReportServiceError(
      "INVALID_TRANSITION",
      `Cannot transition report run from ${from} to ${to}`,
      409
    );
    throw err;
  }
}

async function transitionRun(pool, runId, fromStatus, toStatus, fields = {}) {
  assertTransition(fromStatus, toStatus);
  const assignments = ["status = $3"];
  const params = [runId, fromStatus, toStatus];
  let i = 4;
  for (const [col, val] of Object.entries(fields)) {
    assignments.push(`${col} = $${i}`);
    params.push(val);
    i += 1;
  }
  const r = await pool.query(
    `UPDATE report_runs SET ${assignments.join(", ")}
     WHERE id = $1 AND status = $2
     RETURNING *`,
    params
  );
  if (!r.rows[0]) {
    throw new ReportServiceError("RUN_CONFLICT", "Report run state conflict", 409);
  }
  return r.rows[0];
}

function createReportService(pool) {
  const jobs = createPlatformJobService(pool);

  async function audit(userId, organizationId, actionType, details) {
    await pool.query(
      `INSERT INTO activity_logs(user_id, organization_id, action_type, details)
       VALUES ($1, $2, $3, $4)`,
      [userId || null, organizationId, actionType, JSON.stringify(sanitizeEvidence(details))]
    );
  }

  async function auditNoc(userId, organizationId, action, details) {
    await pool.query(
      `INSERT INTO security_logs(user_id, organization_id, action, risk_level, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId || null,
        organizationId,
        action,
        "medium",
        JSON.stringify(sanitizeEvidence(details))
      ]
    );
  }

  function buildIdempotencyKey(organizationId, incidentId, contextKey = "v1") {
    return `incident-summary:${organizationId}:${incidentId}:${contextKey}`;
  }

  async function requestIncidentSummary({
    organizationId,
    incidentId,
    requestedBy,
    idempotencyKey,
    allowNewVersion = false
  }) {
    const inc = await pool.query(
      `SELECT id FROM incidents WHERE id = $1 AND organization_id = $2`,
      [incidentId, organizationId]
    );
    if (!inc.rows[0]) {
      throw new ReportServiceError("INCIDENT_NOT_FOUND", "Incident not found", 404);
    }

    const key =
      idempotencyKey || buildIdempotencyKey(organizationId, incidentId, allowNewVersion ? randomUUID() : "default");

    const existingRun = await pool.query(
      `SELECT rr.*, r.report_type, r.title
       FROM report_runs rr
       INNER JOIN reports r ON r.id = rr.report_id
       WHERE rr.organization_id = $1 AND rr.idempotency_key = $2`,
      [organizationId, key]
    );
    if (existingRun.rows[0]) {
      return { run: existingRun.rows[0], report: existingRun.rows[0], created: false };
    }

    const reportId = randomUUID();
    const runId = randomUUID();
    const title = `Incident Summary #${incidentId}`;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO reports (id, organization_id, report_type, title, config, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          reportId,
          organizationId,
          REPORT_TYPE_INCIDENT_SUMMARY,
          title,
          JSON.stringify({ incidentId }),
          requestedBy || null
        ]
      );
      const runInsert = await client.query(
        `INSERT INTO report_runs (
           id, report_id, organization_id, incident_id, status, template_version,
           idempotency_key, requested_by, period_start
         ) VALUES ($1, $2, $3, $4, 'REQUESTED', $5, $6, $7,
           (SELECT opened_at FROM incidents WHERE id = $4))
         RETURNING *`,
        [runId, reportId, organizationId, incidentId, TEMPLATE_VERSION, key, requestedBy || null]
      );
      await client.query("COMMIT");

      const run = runInsert.rows[0];
      await jobs.enqueue({
        jobType: "REPORT_GENERATE",
        organizationId,
        payload: { reportRunId: runId, organizationId, incidentId, reportId },
        idempotencyKey: `job:report-run:${runId}`
      });
      await pool.query(
        `UPDATE report_runs SET status = 'QUEUED' WHERE id = $1 AND status = 'REQUESTED'`,
        [runId]
      );
      run.status = "QUEUED";

      await audit(requestedBy, organizationId, "report_requested", {
        reportId,
        reportRunId: runId,
        incidentId
      });

      return {
        run,
        report: { id: reportId, report_type: REPORT_TYPE_INCIDENT_SUMMARY, title },
        created: true
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async function getRunForOrg(runId, organizationId) {
    const { rows } = await pool.query(
      `SELECT rr.*, r.report_type, r.title
       FROM report_runs rr
       INNER JOIN reports r ON r.id = rr.report_id
       WHERE rr.id = $1 AND rr.organization_id = $2`,
      [runId, organizationId]
    );
    return rows[0] || null;
  }

  async function listReportsForOrg(organizationId, { limit = 50, offset = 0 } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    const { rows } = await pool.query(
      `SELECT r.id, r.report_type, r.title, r.created_at,
              rr.id AS latest_run_id, rr.status, rr.completed_at AS generated_at,
              rr.data_freshness, rr.template_version, rr.incident_id, rr.error_code
       FROM reports r
       LEFT JOIN LATERAL (
         SELECT * FROM report_runs rr2
         WHERE rr2.report_id = r.id
         ORDER BY rr2.created_at DESC
         LIMIT 1
       ) rr ON TRUE
       WHERE r.organization_id = $1
       ORDER BY COALESCE(rr.created_at, r.created_at) DESC
       LIMIT $2 OFFSET $3`,
      [organizationId, safeLimit, safeOffset]
    );
    return rows;
  }

  async function retryRun(runId, { userId, noc = false } = {}) {
    const { rows } = await pool.query(`SELECT * FROM report_runs WHERE id = $1`, [runId]);
    const run = rows[0];
    if (!run) {
      throw new ReportServiceError("NOT_FOUND", "Report run not found", 404);
    }
    if (run.status !== "FAILED" && run.status !== "EXPIRED") {
      throw new ReportServiceError("RETRY_NOT_ALLOWED", "Retry only for FAILED/EXPIRED runs", 409);
    }
    await pool.query(
      `UPDATE report_runs
       SET status = 'QUEUED', error_code = NULL, error_message = NULL, started_at = NULL, completed_at = NULL
       WHERE id = $1`,
      [runId]
    );
    await jobs.enqueue({
      jobType: "REPORT_GENERATE",
      organizationId: run.organization_id,
      payload: {
        reportRunId: runId,
        organizationId: run.organization_id,
        incidentId: run.incident_id,
        reportId: run.report_id
      },
      idempotencyKey: `job:report-run-retry:${runId}:${Date.now()}`
    });
    if (noc) {
      await auditNoc(userId, run.organization_id, "noc_report_retry", { reportRunId: runId });
    } else {
      await audit(userId, run.organization_id, "report_retry", { reportRunId: runId });
    }
    return { runId, status: "QUEUED" };
  }

  return {
    requestIncidentSummary,
    getRunForOrg,
    listReportsForOrg,
    retryRun,
    transitionRun,
    audit,
    auditNoc,
    jobs
  };
}

module.exports = { ReportServiceError, createReportService, assertTransition };
