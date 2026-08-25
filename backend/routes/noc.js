/**
 * Phase 5 — Internal NOC read APIs (cross-tenant, role-gated).
 * Never mount under /api/client. Read-only. Paginated.
 */
const express = require("express");
const { serializeTlsCertificate, deriveTlsObservationStatus } = require("../lib/tlsStatus");
const { sanitizeEvidence } = require("../lib/monitoring/sanitizeEvidence");
const { evaluateAssetHealth, rollupOrganizationHealth } = require("../lib/monitoring/healthEngine");

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

function parseOrgId(query) {
  if (query.organization_id == null || query.organization_id === "") return null;
  const id = Number.parseInt(String(query.organization_id), 10);
  return Number.isInteger(id) ? id : null;
}

function redactDetails(details) {
  let obj = details;
  if (typeof details === "string") {
    try {
      obj = JSON.parse(details);
    } catch {
      return { note: "unparsed" };
    }
  }
  return sanitizeEvidence(obj && typeof obj === "object" ? obj : {});
}

function serializeAlert(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization_name || null,
    organizationSlug: row.organization_slug || null,
    assetId: row.asset_id,
    assetHostname: row.asset_hostname || null,
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
    updatedAt: row.updated_at,
    evidenceSummary: row.evidence ? sanitizeEvidence(row.evidence) : null
  };
}

function serializeIncident(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization_name || null,
    organizationSlug: row.organization_slug || null,
    assetId: row.asset_id,
    assetHostname: row.asset_hostname || null,
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
function createNocRouter(pool) {
  const router = express.Router();

  router.get("/me", (req, res) => {
    res.json({
      allowed: true,
      role: req.user?.role || null,
      userId: req.user?.id || null,
      email: req.user?.email || null
    });
  });

  router.get("/platform-health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({
        status: "OK",
        db: "connected",
        meaning:
          "Process and database connectivity only. Does not imply customer estates are healthy.",
        timestamp: new Date().toISOString()
      });
    } catch {
      res.status(503).json({
        status: "DEGRADED",
        db: "disconnected",
        meaning: "Database unreachable. Platform health is degraded.",
        timestamp: new Date().toISOString()
      });
    }
  });

  router.get("/summary", async (_req, res) => {
    try {
      const [orgs, assets, monitors, alerts, incidents] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS n FROM organizations WHERE status = 'active'`),
        pool.query(`SELECT COUNT(*)::int AS n FROM assets WHERE status = 'active'`),
        pool.query(
          `SELECT COUNT(*)::int AS n FROM monitors WHERE enabled = true AND status IN ('ACTIVE','ERROR')`
        ),
        pool.query(
          `SELECT COUNT(*)::int AS n FROM alerts WHERE state IN ('OPEN','ACKNOWLEDGED')`
        ),
        pool.query(
          `SELECT COUNT(*)::int AS n FROM incidents WHERE state IN ('OPEN','INVESTIGATING','MITIGATED')`
        )
      ]);

      const criticalAlerts = await pool.query(
        `SELECT COUNT(*)::int AS n FROM alerts
         WHERE state IN ('OPEN','ACKNOWLEDGED') AND severity = 'CRITICAL'`
      );
      const warningAlerts = await pool.query(
        `SELECT COUNT(*)::int AS n FROM alerts
         WHERE state IN ('OPEN','ACKNOWLEDGED') AND severity = 'WARNING'`
      );

      // Sample active assets for health distribution (cap to avoid unbounded work)
      const sample = await pool.query(
        `SELECT a.id, a.organization_id, a.hostname
         FROM assets a
         WHERE a.status = 'active'
         ORDER BY a.id ASC
         LIMIT 200`
      );

      const buckets = { HEALTHY: 0, WARNING: 0, CRITICAL: 0, UNKNOWN: 0 };
      for (const asset of sample.rows) {
        const monitorsR = await pool.query(
          `SELECT * FROM monitors
           WHERE organization_id = $1 AND asset_id = $2 AND enabled = true`,
          [asset.organization_id, asset.id]
        );
        const observationsByMonitor = {};
        for (const m of monitorsR.rows) {
          const obs = await pool.query(
            `SELECT * FROM observations
             WHERE organization_id = $1 AND monitor_id = $2
             ORDER BY observed_at DESC LIMIT 10`,
            [asset.organization_id, m.id]
          );
          observationsByMonitor[m.id] = obs.rows;
        }
        const crit = await pool.query(
          `SELECT 1 FROM alerts
           WHERE organization_id = $1 AND asset_id = $2
             AND severity = 'CRITICAL' AND state IN ('OPEN','ACKNOWLEDGED')
           LIMIT 1`,
          [asset.organization_id, asset.id]
        );
        const h = evaluateAssetHealth({
          asset: { id: asset.id },
          monitors: monitorsR.rows,
          observationsByMonitor,
          openCriticalAlerts: crit.rows.length > 0
        });
        buckets[h.overall] = (buckets[h.overall] || 0) + 1;
      }

      const queue = await pool.query(
        `SELECT a.id, a.severity, a.state, a.title, a.reason, a.last_seen_at, a.opened_at,
                a.organization_id, o.name AS organization_name, o.slug AS organization_slug,
                a.asset_id, ast.hostname AS asset_hostname
         FROM alerts a
         JOIN organizations o ON o.id = a.organization_id
         LEFT JOIN assets ast ON ast.id = a.asset_id
         WHERE a.state IN ('OPEN','ACKNOWLEDGED')
         ORDER BY CASE a.severity WHEN 'CRITICAL' THEN 0 ELSE 1 END,
                  a.last_seen_at DESC NULLS LAST
         LIMIT 40`
      );

      res.json({
        organizationsActive: orgs.rows[0]?.n || 0,
        assetsActive: assets.rows[0]?.n || 0,
        monitorsEnabled: monitors.rows[0]?.n || 0,
        openAlerts: alerts.rows[0]?.n || 0,
        openCriticalAlerts: criticalAlerts.rows[0]?.n || 0,
        openWarningAlerts: warningAlerts.rows[0]?.n || 0,
        openIncidents: incidents.rows[0]?.n || 0,
        healthSampleSize: sample.rows.length,
        healthBuckets: buckets,
        disclaimer:
          "UNKNOWN ≠ HEALTHY. Sampled asset health may be partial. Zero incidents ≠ platform healthy.",
        operationalQueue: queue.rows.map((r) => ({
          id: r.id,
          kind: "ALERT",
          organizationId: r.organization_id,
          organizationName: r.organization_name,
          organizationSlug: r.organization_slug,
          assetId: r.asset_id,
          assetHostname: r.asset_hostname,
          signal: r.title,
          severity: r.severity,
          status: r.state,
          reason: r.reason,
          time: r.last_seen_at || r.opened_at
        }))
      });
    } catch (error) {
      console.error("[NOC] summary:", error.message);
      res.status(500).json({ error: "No se pudo cargar el resumen NOC." });
    }
  });

  router.get("/organizations", async (req, res) => {
    try {
      const { limit, offset } = parsePagination(req.query);
      const r = await pool.query(
        `SELECT o.id, o.slug, o.name, o.status, o.created_at, o.updated_at,
                (SELECT COUNT(*)::int FROM organization_members m WHERE m.organization_id = o.id) AS member_count,
                (SELECT COUNT(*)::int FROM assets a WHERE a.organization_id = o.id AND a.status = 'active') AS asset_count,
                (SELECT COUNT(*)::int FROM monitors mon WHERE mon.organization_id = o.id AND mon.enabled = true) AS monitor_count,
                (SELECT COUNT(*)::int FROM alerts al WHERE al.organization_id = o.id AND al.state IN ('OPEN','ACKNOWLEDGED')) AS open_alerts,
                (SELECT COUNT(*)::int FROM incidents i WHERE i.organization_id = o.id AND i.state IN ('OPEN','INVESTIGATING','MITIGATED')) AS open_incidents
         FROM organizations o
         ORDER BY o.id ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      const total = await pool.query(`SELECT COUNT(*)::int AS n FROM organizations`);
      res.json({
        organizations: r.rows.map((o) => ({
          id: o.id,
          slug: o.slug,
          name: o.name,
          status: o.status,
          memberCount: o.member_count,
          assetCount: o.asset_count,
          monitorCount: o.monitor_count,
          openAlerts: o.open_alerts,
          openIncidents: o.open_incidents,
          createdAt: o.created_at,
          updatedAt: o.updated_at
        })),
        pagination: { limit, offset, total: total.rows[0]?.n || 0 }
      });
    } catch (error) {
      console.error("[NOC] organizations:", error.message);
      res.status(500).json({ error: "No se pudieron listar organizaciones." });
    }
  });

  router.get("/organizations/:id", async (req, res) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Identificador invalido." });
      }
      const org = await pool.query(`SELECT * FROM organizations WHERE id = $1`, [id]);
      if (org.rows.length === 0) {
        return res.status(404).json({ error: "Organizacion no encontrada." });
      }
      const o = org.rows[0];
      const assets = await pool.query(
        `SELECT id, type, name, hostname, status, last_observed_at
         FROM assets WHERE organization_id = $1 ORDER BY id ASC LIMIT 100`,
        [id]
      );
      const healths = [];
      for (const asset of assets.rows) {
        const monitorsR = await pool.query(
          `SELECT * FROM monitors WHERE organization_id = $1 AND asset_id = $2 AND enabled = true`,
          [id, asset.id]
        );
        const observationsByMonitor = {};
        for (const m of monitorsR.rows) {
          const obs = await pool.query(
            `SELECT * FROM observations
             WHERE organization_id = $1 AND monitor_id = $2
             ORDER BY observed_at DESC LIMIT 10`,
            [id, m.id]
          );
          observationsByMonitor[m.id] = obs.rows;
        }
        const crit = await pool.query(
          `SELECT 1 FROM alerts
           WHERE organization_id = $1 AND asset_id = $2
             AND severity = 'CRITICAL' AND state IN ('OPEN','ACKNOWLEDGED') LIMIT 1`,
          [id, asset.id]
        );
        const h = evaluateAssetHealth({
          asset: { id: asset.id },
          monitors: monitorsR.rows,
          observationsByMonitor,
          openCriticalAlerts: crit.rows.length > 0
        });
        healths.push({ assetId: asset.id, hostname: asset.hostname, ...h });
      }
      const rollup = rollupOrganizationHealth(healths);
      res.json({
        organization: {
          id: o.id,
          slug: o.slug,
          name: o.name,
          status: o.status,
          createdAt: o.created_at,
          updatedAt: o.updated_at
        },
        overall: rollup.overall,
        reasons: rollup.reasons,
        assets: healths,
        disclaimer: "UNKNOWN ≠ HEALTHY. No impersonation of client session."
      });
    } catch (error) {
      console.error("[NOC] organization detail:", error.message);
      res.status(500).json({ error: "No se pudo cargar la organizacion." });
    }
  });

  router.get("/assets", async (req, res) => {
    try {
      const { limit, offset } = parsePagination(req.query);
      const orgId = parseOrgId(req.query);
      const type = req.query.type ? String(req.query.type).toUpperCase().slice(0, 40) : null;
      const params = [];
      let where = `WHERE a.status = 'active'`;
      if (orgId != null) {
        params.push(orgId);
        where += ` AND a.organization_id = $${params.length}`;
      }
      if (type) {
        params.push(type);
        where += ` AND a.type = $${params.length}`;
      }
      params.push(limit, offset);
      const r = await pool.query(
        `SELECT a.*, o.name AS organization_name, o.slug AS organization_slug
         FROM assets a
         JOIN organizations o ON o.id = a.organization_id
         ${where}
         ORDER BY a.id ASC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      res.json({
        assets: r.rows.map((a) => ({
          id: a.id,
          organizationId: a.organization_id,
          organizationName: a.organization_name,
          organizationSlug: a.organization_slug,
          type: a.type,
          name: a.name,
          hostname: a.hostname,
          status: a.status,
          environment: a.environment,
          lastObservedAt: a.last_observed_at,
          createdAt: a.created_at
        })),
        pagination: { limit, offset }
      });
    } catch (error) {
      console.error("[NOC] assets:", error.message);
      res.status(500).json({ error: "No se pudieron listar activos." });
    }
  });

  router.get("/monitoring", async (req, res) => {
    try {
      const { limit, offset } = parsePagination(req.query);
      const orgId = parseOrgId(req.query);
      const params = [];
      let where = `WHERE 1=1`;
      if (orgId != null) {
        params.push(orgId);
        where += ` AND m.organization_id = $${params.length}`;
      }
      params.push(limit, offset);
      const r = await pool.query(
        `SELECT m.*, o.name AS organization_name, o.slug AS organization_slug,
                a.hostname AS asset_hostname, a.name AS asset_name
         FROM monitors m
         JOIN organizations o ON o.id = m.organization_id
         JOIN assets a ON a.id = m.asset_id
         ${where}
         ORDER BY m.id ASC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      res.json({
        monitors: r.rows.map((m) => ({
          id: m.id,
          organizationId: m.organization_id,
          organizationName: m.organization_name,
          organizationSlug: m.organization_slug,
          assetId: m.asset_id,
          assetHostname: m.asset_hostname,
          assetName: m.asset_name,
          type: m.type,
          name: m.name,
          status: m.status,
          enabled: Boolean(m.enabled),
          intervalSeconds: m.interval_seconds,
          lastCheckAt: m.last_check_at,
          nextCheckAt: m.next_check_at,
          note: "status is monitor lifecycle, not target health"
        })),
        pagination: { limit, offset }
      });
    } catch (error) {
      console.error("[NOC] monitoring:", error.message);
      res.status(500).json({ error: "No se pudieron listar monitors." });
    }
  });

  router.get("/health", async (_req, res) => {
    try {
      const sample = await pool.query(
        `SELECT a.id, a.organization_id, a.hostname, o.name AS organization_name
         FROM assets a
         JOIN organizations o ON o.id = a.organization_id
         WHERE a.status = 'active'
         ORDER BY a.id ASC
         LIMIT 200`
      );
      const buckets = { HEALTHY: 0, WARNING: 0, CRITICAL: 0, UNKNOWN: 0 };
      const byOrg = {};
      for (const asset of sample.rows) {
        const monitorsR = await pool.query(
          `SELECT * FROM monitors
           WHERE organization_id = $1 AND asset_id = $2 AND enabled = true`,
          [asset.organization_id, asset.id]
        );
        const observationsByMonitor = {};
        for (const m of monitorsR.rows) {
          const obs = await pool.query(
            `SELECT * FROM observations
             WHERE organization_id = $1 AND monitor_id = $2
             ORDER BY observed_at DESC LIMIT 10`,
            [asset.organization_id, m.id]
          );
          observationsByMonitor[m.id] = obs.rows;
        }
        const crit = await pool.query(
          `SELECT 1 FROM alerts
           WHERE organization_id = $1 AND asset_id = $2
             AND severity = 'CRITICAL' AND state IN ('OPEN','ACKNOWLEDGED') LIMIT 1`,
          [asset.organization_id, asset.id]
        );
        const h = evaluateAssetHealth({
          asset: { id: asset.id },
          monitors: monitorsR.rows,
          observationsByMonitor,
          openCriticalAlerts: crit.rows.length > 0
        });
        buckets[h.overall] = (buckets[h.overall] || 0) + 1;
        if (!byOrg[asset.organization_id]) {
          byOrg[asset.organization_id] = {
            organizationId: asset.organization_id,
            organizationName: asset.organization_name,
            HEALTHY: 0,
            WARNING: 0,
            CRITICAL: 0,
            UNKNOWN: 0
          };
        }
        byOrg[asset.organization_id][h.overall] += 1;
      }
      res.json({
        sampleSize: sample.rows.length,
        buckets,
        byOrganization: Object.values(byOrg),
        disclaimer:
          "Distribution from sampled active assets. UNKNOWN never counted as HEALTHY. Zero incidents ≠ global healthy."
      });
    } catch (error) {
      console.error("[NOC] health:", error.message);
      res.status(500).json({ error: "No se pudo calcular la salud global." });
    }
  });

  router.get("/alerts", async (req, res) => {
    try {
      const { limit, offset } = parsePagination(req.query);
      const orgId = parseOrgId(req.query);
      const state = req.query.state ? String(req.query.state).toUpperCase().slice(0, 40) : null;
      const severity = req.query.severity
        ? String(req.query.severity).toUpperCase().slice(0, 40)
        : null;
      const params = [];
      let where = `WHERE 1=1`;
      if (orgId != null) {
        params.push(orgId);
        where += ` AND a.organization_id = $${params.length}`;
      }
      if (state && ["OPEN", "ACKNOWLEDGED", "RESOLVED"].includes(state)) {
        params.push(state);
        where += ` AND a.state = $${params.length}`;
      }
      if (severity && ["WARNING", "CRITICAL"].includes(severity)) {
        params.push(severity);
        where += ` AND a.severity = $${params.length}`;
      }
      params.push(limit, offset);
      const r = await pool.query(
        `SELECT a.*, o.name AS organization_name, o.slug AS organization_slug,
                ast.hostname AS asset_hostname
         FROM alerts a
         JOIN organizations o ON o.id = a.organization_id
         LEFT JOIN assets ast ON ast.id = a.asset_id
         ${where}
         ORDER BY a.last_seen_at DESC NULLS LAST, a.id DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      res.json({ alerts: r.rows.map(serializeAlert), pagination: { limit, offset } });
    } catch (error) {
      console.error("[NOC] alerts:", error.message);
      res.status(500).json({ error: "No se pudieron listar alertas." });
    }
  });

  router.get("/alerts/:id", async (req, res) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Identificador invalido." });
      }
      const r = await pool.query(
        `SELECT a.*, o.name AS organization_name, o.slug AS organization_slug,
                ast.hostname AS asset_hostname
         FROM alerts a
         JOIN organizations o ON o.id = a.organization_id
         LEFT JOIN assets ast ON ast.id = a.asset_id
         WHERE a.id = $1`,
        [id]
      );
      if (r.rows.length === 0) {
        return res.status(404).json({ error: "Alerta no encontrada." });
      }
      res.json({ alert: serializeAlert(r.rows[0]) });
    } catch (error) {
      console.error("[NOC] alert get:", error.message);
      res.status(500).json({ error: "No se pudo cargar la alerta." });
    }
  });

  router.get("/incidents", async (req, res) => {
    try {
      const { limit, offset } = parsePagination(req.query);
      const orgId = parseOrgId(req.query);
      const state = req.query.state ? String(req.query.state).toUpperCase().slice(0, 40) : null;
      const params = [];
      let where = `WHERE 1=1`;
      if (orgId != null) {
        params.push(orgId);
        where += ` AND i.organization_id = $${params.length}`;
      }
      if (
        state &&
        ["OPEN", "INVESTIGATING", "MITIGATED", "RESOLVED"].includes(state)
      ) {
        params.push(state);
        where += ` AND i.state = $${params.length}`;
      }
      params.push(limit, offset);
      const r = await pool.query(
        `SELECT i.*, o.name AS organization_name, o.slug AS organization_slug,
                ast.hostname AS asset_hostname
         FROM incidents i
         JOIN organizations o ON o.id = i.organization_id
         LEFT JOIN assets ast ON ast.id = i.asset_id
         ${where}
         ORDER BY i.opened_at DESC NULLS LAST, i.id DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      res.json({
        incidents: r.rows.map(serializeIncident),
        pagination: { limit, offset }
      });
    } catch (error) {
      console.error("[NOC] incidents:", error.message);
      res.status(500).json({ error: "No se pudieron listar incidentes." });
    }
  });

  router.get("/incidents/:id", async (req, res) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Identificador invalido." });
      }
      const r = await pool.query(
        `SELECT i.*, o.name AS organization_name, o.slug AS organization_slug,
                ast.hostname AS asset_hostname
         FROM incidents i
         JOIN organizations o ON o.id = i.organization_id
         LEFT JOIN assets ast ON ast.id = i.asset_id
         WHERE i.id = $1`,
        [id]
      );
      if (r.rows.length === 0) {
        return res.status(404).json({ error: "Incidente no encontrado." });
      }
      const events = await pool.query(
        `SELECT id, kind, payload, actor_user_id, created_at
         FROM incident_events
         WHERE incident_id = $1
         ORDER BY created_at ASC
         LIMIT 100`,
        [id]
      );
      res.json({
        incident: serializeIncident(r.rows[0]),
        events: events.rows.map((e) => ({
          id: e.id,
          kind: e.kind,
          payload: sanitizeEvidence(e.payload || {}),
          actorUserId: e.actor_user_id,
          createdAt: e.created_at
        })),
        remediationAvailable: false,
        note: "Remediation A/B/C runtime is Phase 6 — not executed here."
      });
    } catch (error) {
      console.error("[NOC] incident get:", error.message);
      res.status(500).json({ error: "No se pudo cargar el incidente." });
    }
  });

  router.get("/tls", async (req, res) => {
    try {
      const { limit, offset } = parsePagination(req.query);
      const orgId = parseOrgId(req.query);
      const params = [];
      let where = `WHERE 1=1`;
      if (orgId != null) {
        params.push(orgId);
        where += ` AND t.organization_id = $${params.length}`;
      }
      params.push(limit, offset);
      const r = await pool.query(
        `SELECT t.*, o.name AS organization_name, o.slug AS organization_slug,
                a.hostname AS asset_hostname, a.name AS asset_name, a.type AS asset_type
         FROM tls_certificates t
         JOIN organizations o ON o.id = t.organization_id
         LEFT JOIN assets a ON a.id = t.asset_id
         ${where}
         ORDER BY t.id DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      res.json({
        certificates: r.rows.map((row) => {
          const base = serializeTlsCertificate(row);
          const derived = deriveTlsObservationStatus({
            notAfter: row.not_after,
            hostnameMatch: row.hostname_match,
            hasObservation: Boolean(row.last_observed_at || row.not_after)
          });
          return {
            ...base,
            organizationName: row.organization_name,
            organizationSlug: row.organization_slug,
            assetHostname: row.asset_hostname,
            assetName: row.asset_name,
            assetType: row.asset_type,
            daysRemaining: derived.daysRemaining,
            riskHint: derived.riskHint
          };
        }),
        pagination: { limit, offset }
      });
    } catch (error) {
      console.error("[NOC] tls:", error.message);
      res.status(500).json({ error: "No se pudieron listar certificados." });
    }
  });

  router.get("/audit", async (req, res) => {
    try {
      const { limit, offset } = parsePagination(req.query);
      const orgId = parseOrgId(req.query);
      const params = [];
      let orgFilter = "";
      if (orgId != null) {
        params.push(orgId);
        orgFilter = `AND organization_id = $${params.length}`;
      }
      const limIdx = params.length + 1;
      const offIdx = params.length + 2;
      params.push(Math.ceil(limit / 2), offset);

      const [activity, security] = await Promise.all([
        pool.query(
          `SELECT id, user_id, organization_id, action_type AS action, details, created_at, 'activity' AS source
           FROM activity_logs
           WHERE 1=1 ${orgFilter}
           ORDER BY created_at DESC
           LIMIT $${limIdx} OFFSET $${offIdx}`,
          params
        ),
        pool.query(
          `SELECT id, user_id, organization_id, action, risk_level, details, created_at, 'security' AS source
           FROM security_logs
           WHERE 1=1 ${orgFilter}
           ORDER BY created_at DESC
           LIMIT $${limIdx} OFFSET $${offIdx}`,
          params
        )
      ]);

      const events = [...activity.rows, ...security.rows]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit)
        .map((e) => ({
          id: e.id,
          source: e.source,
          userId: e.user_id,
          organizationId: e.organization_id,
          action: e.action || e.action_type,
          riskLevel: e.risk_level || null,
          details: redactDetails(e.details),
          createdAt: e.created_at
        }));

      res.json({ events, pagination: { limit, offset } });
    } catch (error) {
      console.error("[NOC] audit:", error.message);
      res.status(500).json({ error: "No se pudo cargar el audit log." });
    }
  });

  router.get("/support", async (req, res) => {
    try {
      const { limit, offset } = parsePagination(req.query);
      const orgId = parseOrgId(req.query);
      const params = [];
      let where = `WHERE 1=1`;
      if (orgId != null) {
        params.push(orgId);
        where += ` AND f.organization_id = $${params.length}`;
      }
      params.push(limit, offset);
      const r = await pool.query(
        `SELECT f.id, f.user_id, f.organization_id, f.status, f.created_at,
                o.name AS organization_name,
                f.data
         FROM form_submissions f
         LEFT JOIN organizations o ON o.id = f.organization_id
         ${where}
         ORDER BY f.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      res.json({
        submissions: r.rows.map((f) => {
          const data = typeof f.data === "string" ? JSON.parse(f.data) : f.data || {};
          return {
            id: f.id,
            organizationId: f.organization_id,
            organizationName: f.organization_name,
            userId: f.user_id,
            status: f.status,
            type: data.type || null,
            title: data.title || data.subject || null,
            createdAt: f.created_at
          };
        }),
        pagination: { limit, offset }
      });
    } catch (error) {
      console.error("[NOC] support:", error.message);
      res.status(500).json({ error: "No se pudieron listar solicitudes de soporte." });
    }
  });

  return router;
}

module.exports = createNocRouter;
module.exports.MAX_LIMIT = MAX_LIMIT;
