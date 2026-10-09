/**
 * Phase 6 — NOC remediation / runbook routes (requireNocAccess upstream).
 */
const express = require("express");
const {
  listActions,
  createExecution,
  dryRunExecution,
  requestApproval,
  decideApproval,
  executeRemediation,
  rollbackRemediation,
  safeStop,
  getExecution,
  listEvents,
  rowToExecution
} = require("../lib/remediation/engine");
const { getAction } = require("../lib/remediation/registry");
const { sanitizeRemediationPayload } = require("../lib/remediation/sanitize");

function parseId(v) {
  const n = Number.parseInt(String(v), 10);
  return Number.isInteger(n) ? n : null;
}

function mapError(res, err) {
  const code = err.code || "ERROR";
  const status =
    code === "NOT_FOUND"
      ? 404
      : code === "NOC_FORBIDDEN"
        ? 403
        : code === "UNKNOWN_ACTION" ||
            code === "INVALID_INPUT" ||
            code === "L4_FORBIDDEN" ||
            code === "INVALID_STATE_TRANSITION" ||
            code === "DRY_RUN_REQUIRED" ||
            code === "APPROVAL_REQUIRED" ||
            code === "APPROVAL_INVALID" ||
            code === "APPROVAL_EXPIRED" ||
            code === "APPROVAL_REUSED" ||
            code === "APPROVAL_SCOPE_MISMATCH" ||
            code === "SELF_APPROVAL_DENIED" ||
            code === "TENANT_MISMATCH" ||
            code === "IDEMPOTENCY_CONFLICT" ||
            code === "CONCURRENCY_CONFLICT" ||
            code === "ROLLBACK_REQUIRED" ||
            code === "ROLLBACK_UNAVAILABLE" ||
            code === "PRECONDITION_FAILED"
          ? 400
          : 500;
  return res.status(status).json({
    error: err.message || "Error de remediación",
    code
  });
}

/**
 * @param {import("pg").Pool} pool
 */
function createNocRemediationRouter(pool) {
  const router = express.Router();

  router.get("/actions", (_req, res) => {
    res.json({ actions: listActions() });
  });

  router.get("/runbooks", async (_req, res) => {
    try {
      const r = await pool.query(
        `SELECT rb.*,
                (SELECT MAX(version) FROM runbook_versions v WHERE v.runbook_id = rb.id) AS latest_version
         FROM runbooks rb
         WHERE rb.status = 'ACTIVE'
         ORDER BY rb.slug ASC`
      );
      res.json({
        runbooks: r.rows.map((rb) => ({
          id: rb.id,
          slug: rb.slug,
          name: rb.name,
          description: rb.description,
          status: rb.status,
          appliesTo: rb.applies_to,
          automationMaxLevel: rb.automation_max_level,
          latestVersion: rb.latest_version,
          createdAt: rb.created_at,
          updatedAt: rb.updated_at
        }))
      });
    } catch (error) {
      console.error("[NOC] runbooks:", error.message);
      res.status(500).json({ error: "No se pudieron listar runbooks." });
    }
  });

  router.get("/runbooks/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (id == null) return res.status(400).json({ error: "id inválido", code: "INVALID_INPUT" });
      const rb = await pool.query(`SELECT * FROM runbooks WHERE id = $1`, [id]);
      if (!rb.rows[0]) return res.status(404).json({ error: "Runbook no encontrado" });
      const versions = await pool.query(
        `SELECT id, version, steps, changelog, created_at
         FROM runbook_versions WHERE runbook_id = $1 ORDER BY version DESC`,
        [id]
      );
      const row = rb.rows[0];
      res.json({
        runbook: {
          id: row.id,
          slug: row.slug,
          name: row.name,
          description: row.description,
          status: row.status,
          appliesTo: row.applies_to,
          automationMaxLevel: row.automation_max_level
        },
        versions: versions.rows.map((v) => ({
          id: v.id,
          version: v.version,
          steps: v.steps,
          changelog: v.changelog,
          createdAt: v.created_at
        }))
      });
    } catch (error) {
      console.error("[NOC] runbook detail:", error.message);
      res.status(500).json({ error: "No se pudo cargar el runbook." });
    }
  });

  router.get("/remediations", async (req, res) => {
    try {
      const orgId = parseId(req.query.organization_id);
      const limit = Math.min(Math.max(parseId(req.query.limit) || 50, 1), 100);
      const params = [];
      let where = "WHERE 1=1";
      if (orgId != null) {
        params.push(orgId);
        where += ` AND organization_id = $${params.length}`;
      }
      params.push(limit);
      const r = await pool.query(
        `SELECT * FROM remediation_executions ${where}
         ORDER BY created_at DESC LIMIT $${params.length}`,
        params
      );
      res.json({ remediations: r.rows.map(rowToExecution) });
    } catch (error) {
      console.error("[NOC] remediations list:", error.message);
      res.status(500).json({ error: "No se pudieron listar remediaciones." });
    }
  });

  router.get("/remediations/:id", async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (id == null) return res.status(400).json({ error: "id inválido", code: "INVALID_INPUT" });
      const row = await getExecution(pool, id);
      if (!row) return res.status(404).json({ error: "No encontrado", code: "NOT_FOUND" });
      const events = await listEvents(pool, id, row.organization_id);
      res.json({ remediation: rowToExecution(row), events });
    } catch (error) {
      mapError(res, error);
    }
  });

  router.get("/remediations/:id/events", async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const row = await getExecution(pool, id);
      if (!row) return res.status(404).json({ error: "No encontrado", code: "NOT_FOUND" });
      const events = await listEvents(pool, id, row.organization_id);
      res.json({ events });
    } catch (error) {
      mapError(res, error);
    }
  });

  router.get("/incidents/:id/remediation", async (req, res) => {
    try {
      const incidentId = parseId(req.params.id);
      if (incidentId == null) {
        return res.status(400).json({ error: "id inválido", code: "INVALID_INPUT" });
      }
      const inc = await pool.query(`SELECT * FROM incidents WHERE id = $1`, [incidentId]);
      if (!inc.rows[0]) return res.status(404).json({ error: "Incidente no encontrado" });
      const incident = inc.rows[0];
      const execs = await pool.query(
        `SELECT * FROM remediation_executions
         WHERE incident_id = $1 AND organization_id = $2
         ORDER BY created_at DESC LIMIT 50`,
        [incidentId, incident.organization_id]
      );
      const runbooks = await pool.query(
        `SELECT id, slug, name, automation_max_level, applies_to FROM runbooks WHERE status = 'ACTIVE'`
      );
      res.json({
        incidentId,
        organizationId: incident.organization_id,
        remediations: execs.rows.map(rowToExecution),
        suggestedRunbooks: runbooks.rows.map((rb) => ({
          id: rb.id,
          slug: rb.slug,
          name: rb.name,
          automationMaxLevel: rb.automation_max_level,
          appliesTo: rb.applies_to
        })),
        note: "No auto-close. Resolution requires verification."
      });
    } catch (error) {
      console.error("[NOC] incident remediation:", error.message);
      res.status(500).json({ error: "No se pudo cargar remediación del incidente." });
    }
  });

  /** Plan a remediation execution (no mutation of customer infra). */
  router.post("/remediations/plan", async (req, res) => {
    try {
      const body = req.body || {};
      const organizationId = parseId(body.organizationId ?? body.organization_id);
      const runbookId = parseId(body.runbookId ?? body.runbook_id);
      const letter = String(body.letter || "A").toUpperCase();
      if (organizationId == null || runbookId == null) {
        return res.status(400).json({ error: "organizationId y runbookId requeridos", code: "INVALID_INPUT" });
      }
      if (!["A", "B", "C"].includes(letter)) {
        return res.status(400).json({ error: "letter inválida", code: "INVALID_INPUT" });
      }

      const org = await pool.query(`SELECT id FROM organizations WHERE id = $1`, [organizationId]);
      if (!org.rows[0]) return res.status(400).json({ error: "org no encontrada", code: "PRECONDITION_FAILED" });

      const ver = await pool.query(
        `SELECT v.* FROM runbook_versions v
         WHERE v.runbook_id = $1
         ORDER BY v.version DESC LIMIT 1`,
        [runbookId]
      );
      if (!ver.rows[0]) return res.status(404).json({ error: "runbook version no encontrada" });

      const steps = ver.rows[0].steps || {};
      const step = steps[letter];
      const actionType = body.actionType || body.action_type || step?.action_type;
      if (!actionType) {
        return res.status(400).json({ error: "actionType requerido", code: "INVALID_INPUT" });
      }

      // Reject frontend approval spoof
      if (body.approved === true || body.approval === true) {
        return res.status(400).json({
          error: "approved=true no es válido; use /approve",
          code: "APPROVAL_SPOOF"
        });
      }

      getAction(actionType); // throws if unknown/L4

      const incidentId = parseId(body.incidentId ?? body.incident_id);
      if (incidentId != null) {
        const inc = await pool.query(
          `SELECT id FROM incidents WHERE id = $1 AND organization_id = $2`,
          [incidentId, organizationId]
        );
        if (!inc.rows[0]) {
          return res.status(400).json({ error: "incidente no pertenece a la org", code: "TENANT_MISMATCH" });
        }
      }

      const assetId = parseId(body.assetId ?? body.asset_id);
      if (assetId != null) {
        const a = await pool.query(
          `SELECT id FROM assets WHERE id = $1 AND organization_id = $2`,
          [assetId, organizationId]
        );
        if (!a.rows[0]) {
          return res.status(400).json({ error: "asset no pertenece a la org", code: "TENANT_MISMATCH" });
        }
      }

      const execution = await createExecution(pool, {
        organizationId,
        incidentId,
        assetId,
        runbookId,
        runbookVersionId: ver.rows[0].id,
        letter,
        actionType,
        input: body.input || {},
        evidenceIn: body.evidenceIn || body.evidence_in || {},
        hypothesis: body.hypothesis || step?.hypothesis || steps.hypothesis || null,
        confidence: body.confidence || "UNKNOWN",
        expectedResult: body.expectedResult || step?.expected_result || null,
        actorUserId: req.user?.id,
        executionKey: body.executionKey || undefined
      });

      res.status(201).json({ remediation: execution });
    } catch (error) {
      mapError(res, error);
    }
  });

  router.post("/remediations/dry-run", async (req, res) => {
    try {
      const id = parseId(req.body?.executionId ?? req.body?.id);
      if (id == null) {
        return res.status(400).json({ error: "executionId requerido", code: "INVALID_INPUT" });
      }
      const result = await dryRunExecution(pool, id, req.user?.id);
      res.json(result);
    } catch (error) {
      mapError(res, error);
    }
  });

  router.post("/remediations/:id/request-approval", async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const result = await requestApproval(pool, id, req.user?.id, req.body?.reason);
      res.json(result);
    } catch (error) {
      mapError(res, error);
    }
  });

  router.post("/remediations/:id/approve", async (req, res) => {
    try {
      const executionId = parseId(req.params.id);
      const approvalId = parseId(req.body?.approvalId);
      const decision = String(req.body?.decision || "APPROVED").toUpperCase();
      if (approvalId == null) {
        return res.status(400).json({ error: "approvalId requerido", code: "INVALID_INPUT" });
      }
      // Ensure approval belongs to this execution + org
      const check = await pool.query(`SELECT * FROM remediation_approvals WHERE id = $1`, [
        approvalId
      ]);
      if (!check.rows[0] || check.rows[0].execution_id !== executionId) {
        return res.status(400).json({ error: "approval no coincide con execution", code: "APPROVAL_SCOPE_MISMATCH" });
      }
      const result = await decideApproval(
        pool,
        approvalId,
        req.user?.id,
        decision,
        req.body?.reason
      );
      res.json(result);
    } catch (error) {
      mapError(res, error);
    }
  });

  router.post("/remediations/:id/execute", async (req, res) => {
    try {
      if (req.body?.approved === true) {
        return res.status(400).json({
          error: "No se acepta approved=true en el body",
          code: "APPROVAL_SPOOF"
        });
      }
      const id = parseId(req.params.id);
      const result = await executeRemediation(pool, id, req.user?.id);
      res.json(result);
    } catch (error) {
      mapError(res, error);
    }
  });

  router.post("/remediations/:id/rollback", async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const result = await rollbackRemediation(pool, id, req.user?.id);
      res.json(result);
    } catch (error) {
      mapError(res, error);
    }
  });

  router.post("/remediations/:id/safe-stop", async (req, res) => {
    try {
      const id = parseId(req.params.id);
      const execution = await safeStop(pool, id, req.user?.id, req.body?.reason);
      res.json({ remediation: execution });
    } catch (error) {
      mapError(res, error);
    }
  });

  return router;
}

module.exports = createNocRemediationRouter;
module.exports.sanitizeRemediationPayload = sanitizeRemediationPayload;
