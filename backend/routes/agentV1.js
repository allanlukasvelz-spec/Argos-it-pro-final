/**
 * Phase 7 — Agent ingest API (observation only). No exec/shell/SQL.
 */
const express = require("express");
const rateLimit = require("express-rate-limit");
const agentAuth = require("../middleware/agentAuth");
const {
  enrollAgent,
  recordHeartbeat,
  ingestObservations,
  rotateAgentCredential
} = require("../lib/agents/service");

const agentEnrollLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many enrollment attempts", code: "RATE_LIMIT" }
});

const agentIngestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Agent rate limit", code: "RATE_LIMIT" }
});

function rejectExecRoutes(_req, res) {
  return res.status(404).json({
    error: "Remote execution is not available",
    code: "REMOTE_EXEC_FORBIDDEN"
  });
}

/**
 * @param {import("pg").Pool} pool
 */
function createAgentV1Router(pool) {
  const router = express.Router();

  // Explicitly reject any accidental exec surface
  router.post("/exec", rejectExecRoutes);
  router.post("/shell", rejectExecRoutes);
  router.post("/sql", rejectExecRoutes);
  router.post("/remediate", rejectExecRoutes);

  router.post("/enroll", agentEnrollLimiter, async (req, res) => {
    try {
      const token = String(req.body?.token || req.headers["x-argos-enrollment-token"] || "").trim();
      if (!token || token.length < 20) {
        return res.status(400).json({ error: "token required", code: "INVALID_INPUT" });
      }
      const result = await enrollAgent(pool, {
        token,
        name: req.body?.name,
        agentVersion: req.body?.agentVersion || req.body?.agent_version,
        metadata: req.body?.metadata
      });
      return res.status(201).json({
        agentId: result.agentId,
        organizationId: result.organizationId,
        assetId: result.assetId,
        capabilities: result.capabilities,
        credential: result.credential,
        note: "Store credential securely. It will not be shown again."
      });
    } catch (err) {
      const code = err.code || "ENROLL_FAIL";
      const status =
        code === "ENROLL_REPLAY" || code === "ENROLL_EXPIRED" || code === "ENROLL_INVALID"
          ? 401
          : 400;
      return res.status(status).json({ error: err.message || "Enrollment failed", code });
    }
  });

  const auth = agentAuth(pool);

  router.post("/heartbeat", agentIngestLimiter, auth, async (req, res) => {
    try {
      const out = await recordHeartbeat(pool, req.agent, req.body || {});
      return res.json(out);
    } catch (err) {
      const code = err.code || "HEARTBEAT_FAIL";
      const status = code === "REPLAY" ? 409 : 400;
      return res.status(status).json({ error: err.message || "Heartbeat failed", code });
    }
  });

  router.post("/observations", agentIngestLimiter, auth, async (req, res) => {
    try {
      const items = req.body?.observations || req.body?.items || [];
      const out = await ingestObservations(pool, req.agent, items);
      return res.json(out);
    } catch (err) {
      const code = err.code || "OBS_FAIL";
      return res.status(400).json({ error: err.message || "Observations failed", code });
    }
  });

  router.post("/rotate", agentIngestLimiter, auth, async (req, res) => {
    try {
      const out = await rotateAgentCredential(pool, req.agent);
      return res.json({
        credential: out.credential,
        version: out.version,
        note: "Previous credential revoked. Store new credential securely."
      });
    } catch (err) {
      return res.status(400).json({ error: err.message || "Rotate failed", code: err.code || "ROTATE_FAIL" });
    }
  });

  return router;
}

module.exports = createAgentV1Router;
