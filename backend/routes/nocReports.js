/**
 * NOC reports and job visibility — cross-tenant with audit.
 */
const express = require("express");
const { createReportService, ReportServiceError } = require("../lib/reports/reportService");

function createNocReportsRouter(pool) {
  const router = express.Router();
  const reports = createReportService(pool);

  router.get("/reports", async (req, res) => {
    try {
      const orgFilter = req.query.organization_id ? Number(req.query.organization_id) : null;
      let sql = `SELECT r.id, r.organization_id, r.report_type, r.title, r.created_at,
                        rr.id AS latest_run_id, rr.status, rr.completed_at AS generated_at,
                        rr.data_freshness, rr.evidence_object_id, rr.error_code, rr.error_message,
                        rr.incident_id, rr.template_version
                 FROM reports r
                 LEFT JOIN LATERAL (
                   SELECT * FROM report_runs WHERE report_id = r.id ORDER BY created_at DESC LIMIT 1
                 ) rr ON TRUE`;
      const params = [];
      if (orgFilter) {
        sql += ` WHERE r.organization_id = $1`;
        params.push(orgFilter);
      }
      sql += ` ORDER BY COALESCE(rr.created_at, r.created_at) DESC LIMIT 100`;
      const { rows } = await pool.query(sql, params);
      res.json({ reports: rows });
    } catch (err) {
      console.error("[NOC REPORTS] list:", err.message);
      res.status(500).json({ error: "Error listando informes NOC" });
    }
  });

  router.get("/reports/:id", async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT r.*, o.name AS organization_name
         FROM reports r
         INNER JOIN organizations o ON o.id = r.organization_id
         WHERE r.id = $1`,
        [req.params.id]
      );
      if (!rows[0]) {
        return res.status(404).json({ error: "Informe no encontrado" });
      }
      const runs = await pool.query(
        `SELECT * FROM report_runs WHERE report_id = $1 ORDER BY created_at DESC`,
        [req.params.id]
      );
      res.json({ report: rows[0], runs: runs.rows });
    } catch (err) {
      res.status(500).json({ error: "Error obteniendo informe" });
    }
  });

  router.post("/reports/runs/:runId/retry", async (req, res) => {
    try {
      const result = await reports.retryRun(req.params.runId, {
        userId: req.user?.id,
        noc: true
      });
      res.json(result);
    } catch (err) {
      if (err instanceof ReportServiceError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      res.status(500).json({ error: "Error reintentando informe" });
    }
  });

  router.get("/jobs", async (req, res) => {
    try {
      const status = req.query.status ? String(req.query.status) : null;
      let sql = `SELECT id, job_type, organization_id, status, attempts, max_attempts,
                        run_after, last_error, created_at, completed_at
                 FROM platform_jobs`;
      const params = [];
      if (status) {
        sql += ` WHERE status = $1`;
        params.push(status);
      }
      sql += ` ORDER BY id DESC LIMIT 100`;
      const { rows } = await pool.query(sql, params);
      res.json({ jobs: rows });
    } catch (err) {
      res.status(500).json({ error: "Error listando jobs" });
    }
  });

  return router;
}

module.exports = createNocReportsRouter;
