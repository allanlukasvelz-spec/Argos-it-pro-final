/**
 * NOC evidence APIs — cross-tenant read with audit; store for operational producers only.
 */
const express = require("express");
const { createEvidenceService, EvidenceServiceError } = require("../lib/platform/evidenceService");
const { getMaxBytes } = require("../lib/platform/evidencePolicy");

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

function parsePagination(query) {
  const limitRaw = Number.parseInt(String(query.limit ?? DEFAULT_LIMIT), 10);
  const offsetRaw = Number.parseInt(String(query.offset ?? 0), 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;
  return { limit, offset };
}

function parseOrgId(value) {
  if (value == null || value === "") return null;
  const id = Number.parseInt(String(value), 10);
  return Number.isInteger(id) ? id : null;
}

function createNocEvidenceRouter(pool) {
  const router = express.Router();
  const evidence = createEvidenceService(pool);

  router.get("/", async (req, res) => {
    try {
      const orgFilter = parseOrgId(req.query.organization_id);
      const { limit, offset } = parsePagination(req.query);
      if (orgFilter) {
        const rows = await evidence.listForOrganization(orgFilter, { limit, offset });
        return res.json({
          items: rows.map(evidence.serializeEvidenceRow),
          organizationId: orgFilter,
          limit,
          offset
        });
      }
      const { rows } = await pool.query(
        `SELECT *
         FROM evidence_objects
         WHERE status = 'AVAILABLE'
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      res.json({
        items: rows.map(evidence.serializeEvidenceRow),
        limit,
        offset
      });
    } catch (err) {
      console.error("[NOC EVIDENCE] list:", err.message);
      res.status(500).json({ error: "Error listando evidencia" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const organizationId = parseOrgId(req.body?.organizationId ?? req.body?.organization_id);
      if (!organizationId) {
        return res.status(400).json({ error: "organizationId es obligatorio" });
      }
      const mimeType = req.body?.mimeType || req.body?.mime_type;
      const contentBase64 = req.body?.contentBase64 || req.body?.content_base64;
      if (!mimeType || !contentBase64) {
        return res.status(400).json({ error: "mimeType y contentBase64 son obligatorios" });
      }
      const maxBytes = getMaxBytes();
      const estimated = Math.ceil(String(contentBase64).length * 0.75);
      if (estimated > maxBytes) {
        return res.status(413).json({ error: "Payload demasiado grande", code: "PAYLOAD_TOO_LARGE" });
      }
      let buffer;
      try {
        buffer = Buffer.from(String(contentBase64), "base64");
      } catch {
        return res.status(400).json({ error: "contentBase64 inválido" });
      }
      const result = await evidence.store({
        organizationId,
        mimeType,
        buffer,
        assetId: parseOrgId(req.body?.assetId ?? req.body?.asset_id),
        incidentId: parseOrgId(req.body?.incidentId ?? req.body?.incident_id),
        remediationExecutionId: parseOrgId(
          req.body?.remediationExecutionId ?? req.body?.remediation_execution_id
        ),
        retentionClass: req.body?.retentionClass || req.body?.retention_class,
        idempotencyKey: req.body?.idempotencyKey || req.body?.idempotency_key,
        createdBy: req.user?.id
      });
      res.status(result.created ? 201 : 200).json({
        item: evidence.serializeEvidenceRow(result.row),
        created: result.created
      });
    } catch (err) {
      if (err instanceof EvidenceServiceError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      console.error("[NOC EVIDENCE] store:", err.message);
      res.status(500).json({ error: "Error almacenando evidencia" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const row = await evidence.getMetadata(req.params.id, {
        allowCrossTenant: true
      });
      await pool.query(
        `INSERT INTO security_logs(user_id, organization_id, action, risk_level, details)
         VALUES($1, $2, $3, $4, $5)`,
        [
          req.user?.id || null,
          row.organization_id,
          "noc_evidence_metadata_read",
          "medium",
          JSON.stringify({ evidenceId: row.id })
        ]
      );
      res.json(evidence.serializeEvidenceRow(row));
    } catch (err) {
      if (err instanceof EvidenceServiceError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      console.error("[NOC EVIDENCE] metadata:", err.message);
      res.status(500).json({ error: "Error obteniendo evidencia" });
    }
  });

  router.get("/:id/content", async (req, res) => {
    try {
      const { row, buffer, digest } = await evidence.getContent(req.params.id, {
        allowCrossTenant: true,
        userId: req.user?.id,
        audit: { actionType: "evidence_object_downloaded_noc" },
        auditNoc: { action: "noc_evidence_content_read" }
      });
      res.setHeader("Content-Type", row.mime_type);
      res.setHeader("X-Checksum-Sha256", digest);
      res.setHeader("Cache-Control", "private, no-store");
      res.send(buffer);
    } catch (err) {
      if (err instanceof EvidenceServiceError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      console.error("[NOC EVIDENCE] content:", err.message);
      res.status(500).json({ error: "Error descargando evidencia" });
    }
  });

  return router;
}

module.exports = createNocEvidenceRouter;
