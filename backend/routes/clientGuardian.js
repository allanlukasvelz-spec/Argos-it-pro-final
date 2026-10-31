/**
 * Phase 7 — Client read-only CHICO guardian + agent summary (tenant-scoped).
 */
const express = require("express");
const { deriveChicoState } = require("../lib/agents/chicoState");
const { deriveAgentStatus } = require("../lib/agents/state");
const { evaluateAssetHealth, rollupOrganizationHealth } = require("../lib/monitoring/healthEngine");
const { mergeAgentIntoAssetHealth } = require("../lib/agents/healthMerge");

/**
 * @param {import("pg").Pool} pool
 */
function createClientGuardianRouter(pool) {
  const router = express.Router();

  router.get("/guardian", async (req, res) => {
    try {
      const orgId = req.tenant?.id;
      if (!orgId) {
        return res.status(403).json({ error: "Contexto de organización requerido", code: "TENANT_REQUIRED" });
      }

      const monitors = await pool.query(
        `SELECT m.*, a.id AS asset_pk FROM monitors m
         JOIN assets a ON a.id = m.asset_id
         WHERE m.organization_id = $1`,
        [orgId]
      );
      const assets = await pool.query(
        `SELECT id, hostname, status FROM assets WHERE organization_id = $1`,
        [orgId]
      );
      const obs = await pool.query(
        `SELECT * FROM observations WHERE organization_id = $1
         AND observed_at > NOW() - INTERVAL '24 hours'
         ORDER BY observed_at DESC LIMIT 500`,
        [orgId]
      );
      const observationsByMonitor = {};
      for (const o of obs.rows) {
        if (o.monitor_id == null) continue;
        if (!observationsByMonitor[o.monitor_id]) observationsByMonitor[o.monitor_id] = [];
        observationsByMonitor[o.monitor_id].push(o);
      }

      const agentsQ = await pool.query(
        `SELECT id, asset_id, status, last_seen_at, capabilities FROM agents
         WHERE organization_id = $1 AND status <> 'REVOKED'`,
        [orgId]
      );
      const agentObs = await pool.query(
        `SELECT agent_id, type, measurement, received_at, observed_at FROM agent_observations
         WHERE organization_id = $1 AND status = 'ACCEPTED'
           AND received_at > NOW() - INTERVAL '2 hours'
         ORDER BY received_at DESC LIMIT 200`,
        [orgId]
      );
      const obsByAgent = {};
      for (const row of agentObs.rows) {
        if (!obsByAgent[row.agent_id]) obsByAgent[row.agent_id] = [];
        obsByAgent[row.agent_id].push(row);
      }

      const healths = [];
      for (const asset of assets.rows) {
        const assetMonitors = monitors.rows.filter((m) => m.asset_id === asset.id);
        let h = evaluateAssetHealth({
          asset,
          monitors: assetMonitors,
          observationsByMonitor
        });
        const agent = agentsQ.rows.find((a) => a.asset_id === asset.id);
        if (agent) {
          h = mergeAgentIntoAssetHealth(h, {
            status: agent.status,
            lastSeenAt: agent.last_seen_at,
            observations: obsByAgent[agent.id] || []
          });
        }
        healths.push(h);
      }
      const rollup = rollupOrganizationHealth(healths);

      const alerts = await pool.query(
        `SELECT severity, COUNT(*)::int AS n FROM alerts
         WHERE organization_id = $1 AND state = 'OPEN'
         GROUP BY severity`,
        [orgId]
      );
      let openAlerts = 0;
      let openCriticalAlerts = 0;
      for (const r of alerts.rows) {
        openAlerts += r.n;
        if (r.severity === "CRITICAL") openCriticalAlerts += r.n;
      }
      const incidents = await pool.query(
        `SELECT COUNT(*)::int AS n FROM incidents
         WHERE organization_id = $1 AND state IN ('OPEN','ACKNOWLEDGED','INVESTIGATING')`,
        [orgId]
      );
      const verifying = await pool.query(
        `SELECT COUNT(*)::int AS n FROM remediation_executions
         WHERE organization_id = $1 AND state IN ('RUNNING','VERIFYING')`,
        [orgId]
      ).catch(() => ({ rows: [{ n: 0 }] }));

      const recentlyResolved = await pool.query(
        `SELECT COUNT(*)::int AS n FROM incidents
         WHERE organization_id = $1 AND state = 'RESOLVED'
           AND resolved_at > NOW() - INTERVAL '24 hours'`,
        [orgId]
      );

      const agentStatuses = agentsQ.rows.map((a) =>
        deriveAgentStatus({ status: a.status, lastSeenAt: a.last_seen_at })
      );

      const monitorsEnabled = monitors.rows.filter((m) => m.enabled && m.status === "ACTIVE").length;
      const assetsWithFreshEvidence = healths.filter((h) => (h.coverage?.coveredFresh || 0) > 0).length;
      const guardian = deriveChicoState({
        overall: rollup.overall,
        openAlerts,
        openCriticalAlerts,
        openIncidents: incidents.rows[0]?.n || 0,
        monitorsEnabled,
        assetsWithFreshEvidence,
        agentStatuses,
        remediationVerifying: (verifying.rows[0]?.n || 0) > 0,
        recentlyResolvedVerified:
          (recentlyResolved.rows[0]?.n || 0) > 0 &&
          (incidents.rows[0]?.n || 0) === 0 &&
          openCriticalAlerts === 0
      });

      return res.json({
        chico: {
          role: "SECURITY_GUARDIAN",
          ...guardian
        },
        agents: agentsQ.rows.map((a) => ({
          id: a.id,
          assetId: a.asset_id,
          status: deriveAgentStatus({ status: a.status, lastSeenAt: a.last_seen_at }),
          lastSeenAt: a.last_seen_at
        })),
        overall: rollup.overall,
        freshness: new Date().toISOString()
      });
    } catch (err) {
      console.error("[CLIENT guardian]", err.message);
      return res.status(500).json({ error: "No se ha podido cargar el estado del guardián" });
    }
  });

  return router;
}

module.exports = createClientGuardianRouter;
