/**
 * Client evidence retrieval — tenant-scoped; no arbitrary uploads.
 */
const express = require("express");
const { createEvidenceService, EvidenceServiceError } = require("../lib/platform/evidenceService");

function createClientEvidenceRouter(pool) {
  const router = express.Router();
  const evidence = createEvidenceService(pool);

  router.get("/", async (req, res) => {
    try {
      const orgId = req.tenant.id;
      const limit = req.query.limit;
      const offset = req.query.offset;
      const rows = await evidence.listForOrganization(orgId, { limit, offset });
      res.json({
        items: rows.map(evidence.serializeEvidenceRow),
        organizationId: orgId
      });
    } catch (err) {
      console.error("[CLIENT EVIDENCE] list:", err.message);
      res.status(500).json({ error: "Error listando evidencia" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const row = await evidence.getMetadata(req.params.id, {
        organizationId: req.tenant.id
      });
      res.json(evidence.serializeEvidenceRow(row));
    } catch (err) {
      if (err instanceof EvidenceServiceError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      console.error("[CLIENT EVIDENCE] metadata:", err.message);
      res.status(500).json({ error: "Error obteniendo evidencia" });
    }
  });

  router.get("/:id/content", async (req, res) => {
    try {
      const { row, buffer, digest } = await evidence.getContent(req.params.id, {
        organizationId: req.tenant.id,
        userId: req.user?.id,
        audit: { actionType: "evidence_object_downloaded" }
      });
      res.setHeader("Content-Type", row.mime_type);
      res.setHeader("X-Checksum-Sha256", digest);
      res.setHeader("Cache-Control", "private, no-store");
      res.send(buffer);
    } catch (err) {
      if (err instanceof EvidenceServiceError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      console.error("[CLIENT EVIDENCE] content:", err.message);
      res.status(500).json({ error: "Error descargando evidencia" });
    }
  });

  return router;
}

module.exports = createClientEvidenceRouter;
