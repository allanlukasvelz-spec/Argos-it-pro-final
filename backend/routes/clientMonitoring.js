/**
 * Phase 3 — tenant-scoped monitoring read APIs.
 */
const express = require("express");
const { evaluateAssetHealth, rollupOrganizationHealth } = require("../lib/monitoring/healthEngine");

function clean(value = "", limit = 200) {
  return String(value ?? "").trim().slice(0, limit);
}

function serializeMonitor(row) {
  if (!row) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    assetId: row.asset_id,
    type: row.type,
    name: row.name,
    status: row.status,
    enabled: Boolean(row.enabled),
    intervalSeconds: row.interval_seconds,
    timeoutMs: row.timeout_ms,
    lastCheckAt: row.last_check_at,
    nextCheckAt: row.next_check_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function serializeAlert(row) {
  if (!row) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    assetId: row.asset_id,
    monitorId: row.monitor_id,
    severity: row.severity,
    state: row.state,
    fingerprint: row.fingerprint,
    title: row.title,
    reason: row.reason,
    count: row.count,
    openedAt: row.opened_at,
    lastSeenAt: row.last_seen_at,
    resolvedAt: row.resolved_at,
    updatedAt: row.updated_at
  };
}

function serializeIncident(row) {
  if (!row) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    assetId: row.asset_id,
    title: row.title,
    summary: row.summary,
    severity: row.severity,
    state: row.state,
    correlationKey: row.correlation_key,
    openedAt: row.opened_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at
  };
}

/**
 * @param {import("pg").Pool} pool
 */
function createMonitoringRouter(pool) {
  const router = express.Router();

  function requireOrg(req, res) {
    const orgId = req.tenant?.id;
    if (!orgId) {
      res.status(403).json({ error: "Contexto de organización requerido", code: "TENANT_REQUIRED" });
      return null;
    }
    return orgId;
  }

  async function loadAssetHealth(orgId, assetId) {
    const monitors = await pool.query(
      `SELECT * FROM monitors
       WHERE organization_id = $1 AND asset_id = $2 AND enabled = true`,
      [orgId, assetId]
    );
    const observationsByMonitor = {};
    for (const m of monitors.rows) {
      const obs = await pool.query(
        `SELECT * FROM observations
         WHERE organization_id = $1 AND monitor_id = $2
         ORDER BY observed_at DESC
         LIMIT 10`,
        [orgId, m.id]
      );
      observationsByMonitor[m.id] = obs.rows;
    }
    const critical = await pool.query(
      `SELECT 1 FROM alerts
       WHERE organization_id = $1 AND asset_id = $2
         AND severity = 'CRITICAL' AND state IN ('OPEN', 'ACKNOWLEDGED')
       LIMIT 1`,
      [orgId, assetId]
    );
    return evaluateAssetHealth({
      asset: { id: assetId },
      monitors: monitors.rows,
      observationsByMonitor,
      openCriticalAlerts: critical.rows.length > 0
    });
  }

  router.get("/monitoring", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;

      // Ignore body/query organization_id tampering — tenant from middleware only
      const assets = await pool.query(
        `SELECT id, type, hostname, status FROM assets
         WHERE organization_id = $1 AND status = 'active'
         ORDER BY id ASC LIMIT 200`,
        [orgId]
      );

      const healths = [];
      for (const asset of assets.rows) {
        const h = await loadAssetHealth(orgId, asset.id);
        healths.push({ assetId: asset.id, hostname: asset.hostname, ...h });
      }

      const rollup = rollupOrganizationHealth(healths);
      const monitorsCount = await pool.query(
        `SELECT COUNT(*)::int AS n FROM monitors WHERE organization_id = $1 AND enabled = true`,
        [orgId]
      );
      const alertsOpen = await pool.query(
        `SELECT COUNT(*)::int AS n FROM alerts
         WHERE organization_id = $1 AND state IN ('OPEN', 'ACKNOWLEDGED')`,
        [orgId]
      );
      const incidentsOpen = await pool.query(
        `SELECT COUNT(*)::int AS n FROM incidents
         WHERE organization_id = $1 AND state IN ('OPEN', 'INVESTIGATING', 'MITIGATED')`,
        [orgId]
      );

      const coveredFresh = healths.filter((h) => h.coverage?.coveredFresh > 0).length;

      res.json({
        organizationId: orgId,
        overall: rollup.overall,
        reasons: rollup.reasons,
        coverage: {
          assetsActive: assets.rows.length,
          monitorsEnabled: monitorsCount.rows[0]?.n || 0,
          assetsWithFreshEvidence: coveredFresh
        },
        counts: {
          openAlerts: alertsOpen.rows[0]?.n || 0,
          openIncidents: incidentsOpen.rows[0]?.n || 0
        },
        assets: healths.map((h) => ({
          assetId: h.assetId,
          hostname: h.hostname,
          overall: h.overall,
          reasons: h.reasons,
          coverage: h.coverage
        })),
        disclaimer:
          "HEALTHY requiere evidencia fresca suficiente. UNKNOWN ≠ HEALTHY. Sin incidencias ≠ protegido."
      });
    } catch (error) {
      console.error("[MONITORING] summary:", error.message);
      res.status(500).json({ error: "No se pudo cargar el resumen de monitorizacion." });
    }
  });

  router.get("/health", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;
      const assetId = Number.parseInt(String(req.query.asset_id || req.query.assetId || ""), 10);
      if (!Number.isInteger(assetId)) {
        return res.status(400).json({ error: "asset_id obligatorio." });
      }
      const asset = await pool.query(
        `SELECT id, hostname FROM assets WHERE id = $1 AND organization_id = $2`,
        [assetId, orgId]
      );
      if (asset.rows.length === 0) {
        return res.status(404).json({ error: "Activo no encontrado." });
      }
      const health = await loadAssetHealth(orgId, assetId);
      res.json({
        assetId,
        hostname: asset.rows[0].hostname,
        ...health,
        disclaimer: "UNKNOWN ≠ HEALTHY. Evidencia insuficiente no se pinta como saludable."
      });
    } catch (error) {
      console.error("[MONITORING] health:", error.message);
      res.status(500).json({ error: "No se pudo calcular la salud." });
    }
  });

  router.get("/monitors", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;
      const assetId = req.query.asset_id || req.query.assetId;
      const params = [orgId];
      let sql = `SELECT * FROM monitors WHERE organization_id = $1`;
      if (assetId) {
        const id = Number.parseInt(String(assetId), 10);
        if (!Number.isInteger(id)) {
          return res.status(400).json({ error: "asset_id invalido." });
        }
        params.push(id);
        sql += ` AND asset_id = $2`;
      }
      sql += ` ORDER BY type ASC, id ASC LIMIT 200`;
      const r = await pool.query(sql, params);
      res.json({ monitors: r.rows.map(serializeMonitor) });
    } catch (error) {
      console.error("[MONITORING] monitors list:", error.message);
      res.status(500).json({ error: "No se pudieron listar los monitors." });
    }
  });

  router.get("/monitors/:id", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Identificador invalido." });
      }
      const r = await pool.query(
        `SELECT * FROM monitors WHERE id = $1 AND organization_id = $2`,
        [id, orgId]
      );
      if (r.rows.length === 0) {
        return res.status(404).json({ error: "Monitor no encontrado." });
      }
      res.json({ monitor: serializeMonitor(r.rows[0]) });
    } catch (error) {
      console.error("[MONITORING] monitor get:", error.message);
      res.status(500).json({ error: "No se pudo cargar el monitor." });
    }
  });

  router.get("/alerts", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;
      const state = clean(req.query.state, 40).toUpperCase();
      const params = [orgId];
      let sql = `SELECT * FROM alerts WHERE organization_id = $1`;
      if (["OPEN", "ACKNOWLEDGED", "RESOLVED"].includes(state)) {
        params.push(state);
        sql += ` AND state = $2`;
      }
      sql += ` ORDER BY last_seen_at DESC NULLS LAST, id DESC LIMIT 100`;
      const r = await pool.query(sql, params);
      res.json({ alerts: r.rows.map(serializeAlert) });
    } catch (error) {
      console.error("[MONITORING] alerts list:", error.message);
      res.status(500).json({ error: "No se pudieron listar las alertas." });
    }
  });

  router.get("/alerts/:id", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Identificador invalido." });
      }
      const r = await pool.query(
        `SELECT * FROM alerts WHERE id = $1 AND organization_id = $2`,
        [id, orgId]
      );
      if (r.rows.length === 0) {
        return res.status(404).json({ error: "Alerta no encontrada." });
      }
      res.json({ alert: serializeAlert(r.rows[0]) });
    } catch (error) {
      console.error("[MONITORING] alert get:", error.message);
      res.status(500).json({ error: "No se pudo cargar la alerta." });
    }
  });

  router.get("/incidents", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;
      const state = clean(req.query.state, 40).toUpperCase();
      const params = [orgId];
      let sql = `SELECT * FROM incidents WHERE organization_id = $1`;
      if (["OPEN", "INVESTIGATING", "MITIGATED", "RESOLVED"].includes(state)) {
        params.push(state);
        sql += ` AND state = $2`;
      }
      sql += ` ORDER BY opened_at DESC, id DESC LIMIT 100`;
      const r = await pool.query(sql, params);
      res.json({ incidents: r.rows.map(serializeIncident) });
    } catch (error) {
      console.error("[MONITORING] incidents list:", error.message);
      res.status(500).json({ error: "No se pudieron listar los incidentes." });
    }
  });

  router.get("/incidents/:id", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Identificador invalido." });
      }
      const r = await pool.query(
        `SELECT * FROM incidents WHERE id = $1 AND organization_id = $2`,
        [id, orgId]
      );
      if (r.rows.length === 0) {
        return res.status(404).json({ error: "Incidente no encontrado." });
      }
      const events = await pool.query(
        `SELECT id, kind, payload, actor_user_id, created_at
         FROM incident_events
         WHERE incident_id = $1 AND organization_id = $2
         ORDER BY created_at ASC
         LIMIT 100`,
        [id, orgId]
      );
      res.json({
        incident: serializeIncident(r.rows[0]),
        events: events.rows.map((e) => ({
          id: e.id,
          kind: e.kind,
          payload: e.payload,
          actorUserId: e.actor_user_id,
          createdAt: e.created_at
        }))
      });
    } catch (error) {
      console.error("[MONITORING] incident get:", error.message);
      res.status(500).json({ error: "No se pudo cargar el incidente." });
    }
  });

  return router;
}

module.exports = createMonitoringRouter;
