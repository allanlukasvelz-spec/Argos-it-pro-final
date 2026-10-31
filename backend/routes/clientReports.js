/**
 * Client reports — tenant-scoped only.
 */
const express = require("express");
const { createReportService, ReportServiceError } = require("../lib/reports/reportService");
const { createEvidenceService, EvidenceServiceError } = require("../lib/platform/evidenceService");

function serializeReportRow(row) {
  return {
    id: row.id,
    reportType: row.report_type,
    title: row.title,
    status: row.status || "UNKNOWN",
    latestRunId: row.latest_run_id,
    incidentId: row.incident_id,
    generatedAt: row.generated_at,
    dataFreshness: row.data_freshness,
    templateVersion: row.template_version,
    errorCode: row.error_code,
    createdAt: row.created_at
  };
}

function createClientReportsRouter(pool) {
  const router = express.Router();
  const reports = createReportService(pool);
  const evidence = createEvidenceService(pool);

  router.get("/", async (req, res) => {
    try {
      const orgId = req.tenant.id;
      const rows = await reports.listReportsForOrg(orgId, {
        limit: req.query.limit,
        offset: req.query.offset
      });
      res.json({ reports: rows.map(serializeReportRow), organizationId: orgId });
    } catch (err) {
      console.error("[CLIENT REPORTS] list:", err.message);
      res.status(500).json({ error: "Error listando informes" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const orgId = req.tenant.id;
      const incidentId = Number(req.body?.incidentId);
      if (!Number.isInteger(incidentId) || incidentId <= 0) {
        return res.status(400).json({ error: "incidentId requerido", code: "INVALID_INCIDENT" });
      }
      const result = await reports.requestIncidentSummary({
        organizationId: orgId,
        incidentId,
        requestedBy: req.user?.id,
        idempotencyKey: req.body?.idempotencyKey
      });
      res.status(result.created ? 202 : 200).json({
        reportId: result.report.id,
        runId: result.run.id,
        status: result.run.status,
        created: result.created
      });
    } catch (err) {
      if (err instanceof ReportServiceError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      console.error("[CLIENT REPORTS] request:", err.message);
      res.status(500).json({ error: "Error solicitando informe" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const orgId = req.tenant.id;
      const { rows } = await pool.query(
        `SELECT r.*, rr.id AS latest_run_id, rr.status AS run_status, rr.evidence_object_id,
                rr.data_freshness, rr.template_version, rr.completed_at AS generated_at,
                rr.error_code, rr.incident_id
         FROM reports r
         LEFT JOIN LATERAL (
           SELECT * FROM report_runs WHERE report_id = r.id ORDER BY created_at DESC LIMIT 1
         ) rr ON TRUE
         WHERE r.id = $1 AND r.organization_id = $2`,
        [req.params.id, orgId]
      );
      const row = rows[0];
      if (!row) {
        return res.status(404).json({ error: "Informe no encontrado", code: "NOT_FOUND" });
      }
      res.json({ report: serializeReportRow(row) });
    } catch (err) {
      console.error("[CLIENT REPORTS] detail:", err.message);
      res.status(500).json({ error: "Error obteniendo informe" });
    }
  });

  router.get("/:id/content", async (req, res) => {
    try {
      const orgId = req.tenant.id;
      const owned = await pool.query(
        `SELECT id FROM reports WHERE id = $1 AND organization_id = $2`,
        [req.params.id, orgId]
      );
      if (!owned.rows[0]) {
        return res.status(404).json({ error: "Informe no encontrado", code: "NOT_FOUND" });
      }
      const { rows } = await pool.query(
        `SELECT rr.evidence_object_id, rr.status
         FROM reports r
         INNER JOIN report_runs rr ON rr.report_id = r.id
         WHERE r.id = $1 AND r.organization_id = $2 AND rr.status = 'READY'
         ORDER BY rr.created_at DESC
         LIMIT 1`,
        [req.params.id, orgId]
      );
      const row = rows[0];
      if (!row?.evidence_object_id) {
        return res.status(409).json({ error: "Informe no disponible", code: "REPORT_NOT_READY" });
      }
      const { buffer, digest } = await evidence.getContent(row.evidence_object_id, {
        organizationId: orgId,
        userId: req.user?.id,
        requireInspection: false,
        audit: { actionType: "report_downloaded", details: { reportId: req.params.id } }
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="argos-report-${req.params.id}.pdf"`);
      res.setHeader("X-Checksum-Sha256", digest);
      res.setHeader("Cache-Control", "private, no-store");
      res.send(buffer);
    } catch (err) {
      if (err instanceof EvidenceServiceError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      console.error("[CLIENT REPORTS] content:", err.message);
      res.status(500).json({ error: "Error descargando informe" });
    }
  });

  return router;
}

module.exports = createClientReportsRouter;
