/**
 * Phase 7 — NOC Agents admin API (staff only via requireNocAccess parent).
 */
const express = require("express");
const {
  createEnrollment,
  revokeAgent,
  nocForceRotate,
  serializeAgent,
  refreshStaleAgents
} = require("../lib/agents/service");
const { DEFAULT_MVP } = require("../lib/agents/capabilities");
const { deriveAgentStatus } = require("../lib/agents/state");

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

function parsePagination(query) {
  const limitRaw = Number.parseInt(String(query.limit ?? DEFAULT_LIMIT), 10);
  const offsetRaw = Number.parseInt(String(query.offset ?? 0), 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT) : DEFAULT_LIMIT;
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;
  return { limit, offset };
}

/**
 * @param {import("pg").Pool} pool
 */
function createNocAgentsRouter(pool) {
  const router = express.Router();

  router.get("/agents", async (req, res) => {
    try {
      await refreshStaleAgents(pool);
      const { limit, offset } = parsePagination(req.query);
      const orgId =
        req.query.organization_id != null && req.query.organization_id !== ""
          ? Number.parseInt(String(req.query.organization_id), 10)
          : null;
      const params = [];
      let where = "";
      if (Number.isInteger(orgId)) {
        params.push(orgId);
        where = `WHERE a.organization_id = $${params.length}`;
      }
      params.push(limit, offset);
      const q = await pool.query(
        `SELECT a.*, o.name AS organization_name, o.slug AS organization_slug,
                ast.hostname AS asset_hostname
         FROM agents a
         JOIN organizations o ON o.id = a.organization_id
         LEFT JOIN assets ast ON ast.id = a.asset_id
         ${where}
         ORDER BY a.updated_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      return res.json({
        agents: q.rows.map(serializeAgent),
        limit,
        offset
      });
    } catch (err) {
      console.error("[NOC agents]", err.message);
      return res.status(500).json({ error: "Error listing agents" });
    }
  });

  router.get("/agents/:id", async (req, res) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
      await refreshStaleAgents(pool);
      const q = await pool.query(
        `SELECT a.*, o.name AS organization_name, ast.hostname AS asset_hostname
         FROM agents a
         JOIN organizations o ON o.id = a.organization_id
         LEFT JOIN assets ast ON ast.id = a.asset_id
         WHERE a.id = $1`,
        [id]
      );
      if (!q.rows[0]) return res.status(404).json({ error: "Not found" });
      const hb = await pool.query(
        `SELECT seq, received_at, agent_reported_at, agent_version
         FROM agent_heartbeats WHERE agent_id = $1 ORDER BY received_at DESC LIMIT 20`,
        [id]
      );
      const obs = await pool.query(
        `SELECT id, type, status, observed_at, received_at, measurement, idempotency_key
         FROM agent_observations WHERE agent_id = $1 ORDER BY received_at DESC LIMIT 50`,
        [id]
      );
      const ev = await pool.query(
        `SELECT id, kind, severity, details, created_at
         FROM agent_security_events WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [id]
      );
      const agent = serializeAgent(q.rows[0]);
      return res.json({
        agent,
        heartbeats: hb.rows.map((r) => ({
          seq: r.seq,
          receivedAt: r.received_at,
          agentReportedAt: r.agent_reported_at,
          agentVersion: r.agent_version
        })),
        observations: obs.rows.map((r) => ({
          id: r.id,
          type: r.type,
          status: r.status,
          observedAt: r.observed_at,
          receivedAt: r.received_at,
          measurement: r.measurement,
          idempotencyKey: r.idempotency_key
        })),
        securityEvents: ev.rows.map((r) => ({
          id: r.id,
          kind: r.kind,
          severity: r.severity,
          details: r.details,
          createdAt: r.created_at
        }))
      });
    } catch (err) {
      console.error("[NOC agent detail]", err.message);
      return res.status(500).json({ error: "Error loading agent" });
    }
  });

  router.post("/agents/enrollments", async (req, res) => {
    try {
      const organizationId = Number.parseInt(String(req.body?.organizationId ?? req.body?.organization_id), 10);
      const assetId = Number.parseInt(String(req.body?.assetId ?? req.body?.asset_id), 10);
      if (!Number.isInteger(organizationId) || !Number.isInteger(assetId)) {
        return res.status(400).json({ error: "organizationId and assetId required" });
      }
      const out = await createEnrollment(pool, {
        organizationId,
        assetId,
        capabilities: req.body?.capabilities || DEFAULT_MVP,
        createdBy: req.user?.id,
        agentNameHint: req.body?.name
      });
      return res.status(201).json({
        enrollmentId: out.enrollmentId,
        token: out.token,
        expiresAt: out.expiresAt,
        capabilities: out.capabilities,
        organizationId: out.organizationId,
        assetId: out.assetId,
        note: "Enrollment token shown once. Store securely."
      });
    } catch (err) {
      const status = err.code === "ASSET_NOT_FOUND" || err.code === "CAPABILITY_REJECTED" ? 400 : 500;
      return res.status(status).json({ error: err.message || "Enrollment create failed", code: err.code });
    }
  });

  router.post("/agents/:id/revoke", async (req, res) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
      await revokeAgent(pool, { agentId: id, actorId: req.user?.id });
      return res.json({ ok: true, status: "REVOKED" });
    } catch (err) {
      const status = err.code === "NOT_FOUND" ? 404 : 400;
      return res.status(status).json({ error: err.message, code: err.code });
    }
  });

  router.post("/agents/:id/rotate", async (req, res) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
      const out = await nocForceRotate(pool, { agentId: id, actorId: req.user?.id });
      return res.json({
        credential: out.credential,
        version: out.version,
        note: "New credential shown once. Deliver out-of-band."
      });
    } catch (err) {
      const status = err.code === "NOT_FOUND" ? 404 : 400;
      return res.status(status).json({ error: err.message, code: err.code });
    }
  });

  router.get("/agents/:id/heartbeats", async (req, res) => {
    const id = Number.parseInt(String(req.params.id), 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
    const { limit, offset } = parsePagination(req.query);
    const q = await pool.query(
      `SELECT seq, received_at, agent_reported_at, agent_version FROM agent_heartbeats
       WHERE agent_id = $1 ORDER BY received_at DESC LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );
    return res.json({
      heartbeats: q.rows.map((r) => ({
        seq: r.seq,
        receivedAt: r.received_at,
        agentReportedAt: r.agent_reported_at,
        agentVersion: r.agent_version
      }))
    });
  });

  router.get("/agents/:id/observations", async (req, res) => {
    const id = Number.parseInt(String(req.params.id), 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
    const { limit, offset } = parsePagination(req.query);
    const q = await pool.query(
      `SELECT id, type, status, observed_at, received_at, measurement, idempotency_key
       FROM agent_observations WHERE agent_id = $1
       ORDER BY received_at DESC LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );
    return res.json({
      observations: q.rows.map((r) => ({
        id: r.id,
        type: r.type,
        status: r.status,
        observedAt: r.observed_at,
        receivedAt: r.received_at,
        measurement: r.measurement,
        idempotencyKey: r.idempotency_key
      }))
    });
  });

  router.get("/agents/:id/security-events", async (req, res) => {
    const id = Number.parseInt(String(req.params.id), 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
    const { limit, offset } = parsePagination(req.query);
    const q = await pool.query(
      `SELECT id, kind, severity, details, created_at FROM agent_security_events
       WHERE agent_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );
    return res.json({
      events: q.rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        severity: r.severity,
        details: r.details,
        createdAt: r.created_at
      }))
    });
  });

  // Convenience: never expose secret_hash
  router.get("/agents/:id/status", async (req, res) => {
    const id = Number.parseInt(String(req.params.id), 10);
    const q = await pool.query(`SELECT id, status, last_seen_at FROM agents WHERE id = $1`, [id]);
    if (!q.rows[0]) return res.status(404).json({ error: "Not found" });
    return res.json({
      id: q.rows[0].id,
      status: deriveAgentStatus({
        status: q.rows[0].status,
        lastSeenAt: q.rows[0].last_seen_at
      }),
      lastSeenAt: q.rows[0].last_seen_at
    });
  });

  return router;
}

module.exports = createNocAgentsRouter;
