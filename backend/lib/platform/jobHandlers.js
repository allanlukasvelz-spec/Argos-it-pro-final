/**
 * Typed platform job handlers — no generic eval from payload.
 */
const { buildIncidentSummaryModel } = require("../reports/incidentSummaryBuilder");
const { renderIncidentSummaryHtml } = require("../reports/reportHtmlRenderer");
const { renderPdfFromHtml } = require("../reports/reportPdfRenderer");
const { createReportService } = require("../reports/reportService");
const { createEvidenceService } = require("../platform/evidenceService");
const { createNotificationService } = require("../notifications/notificationService");

async function handleReportGenerate(pool, payload) {
  const { reportRunId, organizationId, incidentId, reportId } = payload || {};
  if (!reportRunId || !organizationId || !incidentId || !reportId) {
    throw new Error("Invalid REPORT_GENERATE payload");
  }

  const reports = createReportService(pool);
  const evidence = createEvidenceService(pool);
  const notify = createNotificationService(pool);

  const runRow = await pool.query(`SELECT * FROM report_runs WHERE id = $1`, [reportRunId]);
  const run = runRow.rows[0];
  if (!run) {
    throw new Error("Report run not found");
  }
  if (Number(run.organization_id) !== Number(organizationId)) {
    throw new Error("Organization mismatch");
  }
  if (run.status === "READY" && run.evidence_object_id) {
    return { skipped: true, reason: "already_ready" };
  }

  if (run.status === "QUEUED") {
    await reports.transitionRun(pool, reportRunId, "QUEUED", "GENERATING", {
      started_at: new Date()
    });
  } else if (run.status !== "GENERATING" && run.status !== "STORING") {
    await pool.query(
      `UPDATE report_runs SET status = 'GENERATING', started_at = COALESCE(started_at, NOW()) WHERE id = $1`,
      [reportRunId]
    );
  }

  const dataCutoffAt = new Date();
  let model;
  try {
    model = await buildIncidentSummaryModel(pool, {
      organizationId,
      incidentId,
      reportId,
      dataCutoffAt
    });
  } catch (err) {
    await pool.query(
      `UPDATE report_runs SET status = 'FAILED', error_code = $2, error_message = $3, completed_at = NOW()
       WHERE id = $1`,
      [reportRunId, err.code || "BUILD_FAILED", String(err.message).slice(0, 500)]
    );
    throw err;
  }

  const html = renderIncidentSummaryHtml(model);
  let pdfBuffer;
  try {
    pdfBuffer = await renderPdfFromHtml(html);
  } catch (err) {
    await pool.query(
      `UPDATE report_runs SET status = 'FAILED', error_code = $2, error_message = $3, completed_at = NOW()
       WHERE id = $1`,
      [reportRunId, err.code || "RENDER_FAILED", String(err.message).slice(0, 500)]
    );
    throw err;
  }

  await pool.query(`UPDATE report_runs SET status = 'STORING' WHERE id = $1`, [reportRunId]);

  let evidenceRow;
  try {
    const stored = await evidence.store({
      organizationId,
      incidentId,
      buffer: pdfBuffer,
      mimeType: "application/pdf",
      retentionClass: "STANDARD",
      idempotencyKey: `report-run:${reportRunId}`,
      createdBy: run.requested_by || null
    });
    evidenceRow = stored.row;
  } catch (err) {
    await pool.query(
      `UPDATE report_runs SET status = 'FAILED', error_code = 'STORAGE_FAILED', error_message = $2, completed_at = NOW()
       WHERE id = $1`,
      [reportRunId, String(err.message).slice(0, 500)]
    );
    throw err;
  }

  await pool.query(
    `UPDATE report_runs
     SET status = 'READY',
         evidence_object_id = $2,
         data_freshness = $3,
         completed_at = NOW(),
         error_code = NULL,
         error_message = NULL
     WHERE id = $1`,
    [reportRunId, evidenceRow.id, model.dataCutoffAt]
  );

  await reports.audit(run.requested_by, organizationId, "report_ready", {
    reportRunId,
    evidenceObjectId: evidenceRow.id
  });

  await notify.emitReportReady({
    organizationId,
    reportId,
    reportRunId,
    requestedBy: run.requested_by
  });

  return { reportRunId, evidenceObjectId: evidenceRow.id, status: "READY" };
}

const HANDLERS = Object.freeze({
  REPORT_GENERATE: handleReportGenerate
});

async function dispatchJob(pool, job) {
  const handler = HANDLERS[job.job_type];
  if (!handler) {
    throw new Error(`No handler for job type ${job.job_type}`);
  }
  return handler(pool, job.payload);
}

module.exports = { dispatchJob, HANDLERS, handleReportGenerate };
