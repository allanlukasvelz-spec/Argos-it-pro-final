const express = require("express");
const { ASSET_TYPES, isAllowedAssetType } = require("../lib/ensureAssets");
const hostnameSecurity = require("../lib/hostnameSecurity");
const tlsStatus = require("../lib/tlsStatus");
const { provisionMonitorsForAsset } = require("../lib/monitoring/provisionMonitors");

function clean(value = "", limit = 500) {
  return String(value ?? "").trim().slice(0, limit);
}

function serializeAsset(row) {
  if (!row) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    parentAssetId: row.parent_asset_id,
    type: row.type,
    name: row.name,
    hostname: row.hostname,
    address: row.address,
    environment: row.environment,
    status: row.status,
    kind: row.kind,
    isPrimary: Boolean(row.is_primary),
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    lastObservedAt: row.last_observed_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * @param {import("pg").Pool} pool
 */
function createAssetsRouter(pool) {
  const router = express.Router();

  function requireOrg(req, res) {
    const orgId = req.tenant?.id;
    if (!orgId) {
      res.status(403).json({ error: "Contexto de organización requerido", code: "TENANT_REQUIRED" });
      return null;
    }
    return orgId;
  }

  // ---- Assets ----
  router.get("/assets", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;

      const typeFilter = clean(req.query.type, 40).toUpperCase();
      const params = [orgId];
      let sql = `SELECT * FROM assets WHERE organization_id = $1 AND status <> 'archived'`;
      if (typeFilter && isAllowedAssetType(typeFilter)) {
        params.push(typeFilter);
        sql += ` AND type = $2`;
      }
      sql += ` ORDER BY type ASC, hostname ASC NULLS LAST, id ASC LIMIT 200`;

      const r = await pool.query(sql, params);
      res.json({ assets: r.rows.map(serializeAsset) });
    } catch (error) {
      console.error("[ASSETS] list:", error.message);
      res.status(500).json({ error: "No se pudieron listar los activos." });
    }
  });

  router.post("/assets", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;
      const userId = req.user.id;
      const body = req.body || {};

      const type = clean(body.type, 40).toUpperCase();
      if (!isAllowedAssetType(type)) {
        return res.status(400).json({ error: "Tipo de activo no valido.", allowed: ASSET_TYPES });
      }

      const name = clean(body.name, 200);
      if (!name) {
        return res.status(400).json({ error: "Nombre obligatorio." });
      }

      let hostname = body.hostname != null ? clean(body.hostname, 253).toLowerCase() : null;
      if (hostname) {
        const v = hostnameSecurity.validatePublicHostname(hostname);
        if (!v.ok) {
          return res.status(400).json({ error: v.error });
        }
        hostname = v.hostname;
      }

      const environment = ["production", "staging", "development", "other"].includes(body.environment)
        ? body.environment
        : "production";
      const kind = body.kind != null ? clean(body.kind, 60) : null;
      const isPrimary = Boolean(body.isPrimary ?? body.is_primary);
      const address = body.address != null ? clean(body.address, 500) : null;
      const metadata =
        body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
          ? body.metadata
          : {};
      const metaJson = JSON.stringify(metadata);
      if (metaJson.length > 8192) {
        return res.status(400).json({ error: "metadata demasiado grande." });
      }

      // Ignore body.organization_id
      const ins = await pool.query(
        `INSERT INTO assets(
           organization_id, type, name, hostname, address, environment,
           status, kind, is_primary, metadata, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,'active',$7,$8,$9::jsonb,$10)
         RETURNING *`,
        [
          orgId,
          type,
          name,
          hostname,
          address,
          environment,
          kind,
          isPrimary,
          metaJson,
          userId
        ]
      );

      const asset = ins.rows[0];
      if (hostname && ["DOMAIN", "HOSTNAME", "WEBSITE"].includes(type)) {
        try {
          await provisionMonitorsForAsset(pool, {
            organizationId: orgId,
            assetId: asset.id,
            hostname,
            createdBy: userId,
            assetType: type
          });
        } catch (provErr) {
          console.error("[ASSETS] provision monitors:", provErr.message);
        }
      }

      res.status(201).json({ asset: serializeAsset(asset) });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "Ya existe un activo activo con ese hostname y tipo." });
      }
      console.error("[ASSETS] create:", error.message);
      res.status(500).json({ error: "No se pudo crear el activo." });
    }
  });

  router.get("/assets/:id", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Identificador invalido." });
      }
      const r = await pool.query(
        `SELECT * FROM assets WHERE id = $1 AND organization_id = $2`,
        [id, orgId]
      );
      if (r.rows.length === 0) {
        return res.status(404).json({ error: "Activo no encontrado." });
      }
      res.json({ asset: serializeAsset(r.rows[0]) });
    } catch (error) {
      console.error("[ASSETS] get:", error.message);
      res.status(500).json({ error: "No se pudo cargar el activo." });
    }
  });

  router.patch("/assets/:id", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Identificador invalido." });
      }

      const existing = await pool.query(
        `SELECT * FROM assets WHERE id = $1 AND organization_id = $2`,
        [id, orgId]
      );
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: "Activo no encontrado." });
      }

      const body = req.body || {};
      const row = existing.rows[0];
      const name = body.name != null ? clean(body.name, 200) : row.name;
      if (!name) {
        return res.status(400).json({ error: "Nombre obligatorio." });
      }

      let hostname = row.hostname;
      if (body.hostname !== undefined) {
        if (body.hostname === null || body.hostname === "") {
          hostname = null;
        } else {
          const v = hostnameSecurity.validatePublicHostname(body.hostname);
          if (!v.ok) return res.status(400).json({ error: v.error });
          hostname = v.hostname;
        }
      }

      const status = ["active", "inactive", "archived", "unknown"].includes(body.status)
        ? body.status
        : row.status;
      const environment = ["production", "staging", "development", "other"].includes(body.environment)
        ? body.environment
        : row.environment;
      const kind = body.kind !== undefined ? clean(body.kind, 60) || null : row.kind;
      const isPrimary =
        body.isPrimary !== undefined || body.is_primary !== undefined
          ? Boolean(body.isPrimary ?? body.is_primary)
          : row.is_primary;
      const address = body.address !== undefined ? clean(body.address, 500) || null : row.address;
      const metadata =
        body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
          ? body.metadata
          : row.metadata;

      const upd = await pool.query(
        `UPDATE assets SET
           name = $1,
           hostname = $2,
           address = $3,
           environment = $4,
           status = $5,
           kind = $6,
           is_primary = $7,
           metadata = $8::jsonb,
           updated_at = NOW()
         WHERE id = $9 AND organization_id = $10
         RETURNING *`,
        [name, hostname, address, environment, status, kind, isPrimary, JSON.stringify(metadata || {}), id, orgId]
      );

      if (upd.rows.length === 0) {
        return res.status(404).json({ error: "Activo no encontrado." });
      }
      res.json({ asset: serializeAsset(upd.rows[0]) });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "Conflicto de hostname/tipo." });
      }
      console.error("[ASSETS] patch:", error.message);
      res.status(500).json({ error: "No se pudo actualizar el activo." });
    }
  });

  router.delete("/assets/:id", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Identificador invalido." });
      }
      // Soft-delete: archive (non-destructive)
      const upd = await pool.query(
        `UPDATE assets SET status = 'archived', updated_at = NOW()
         WHERE id = $1 AND organization_id = $2 AND status <> 'archived'
         RETURNING id`,
        [id, orgId]
      );
      if (upd.rows.length === 0) {
        return res.status(404).json({ error: "Activo no encontrado." });
      }
      res.json({ message: "Activo archivado.", id: upd.rows[0].id });
    } catch (error) {
      console.error("[ASSETS] delete:", error.message);
      res.status(500).json({ error: "No se pudo archivar el activo." });
    }
  });

  // ---- Domains (subset of assets) ----
  router.get("/domains", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;
      const r = await pool.query(
        `SELECT * FROM assets
         WHERE organization_id = $1
           AND type IN ('DOMAIN', 'HOSTNAME', 'WEBSITE')
           AND status <> 'archived'
         ORDER BY is_primary DESC, hostname ASC NULLS LAST, id ASC
         LIMIT 200`,
        [orgId]
      );
      res.json({ domains: r.rows.map(serializeAsset) });
    } catch (error) {
      console.error("[ASSETS] domains list:", error.message);
      res.status(500).json({ error: "No se pudieron listar los dominios." });
    }
  });

  router.post("/domains/discover", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;
      const userId = req.user.id;
      const hostnameRaw = req.body?.hostname || req.body?.domain;
      const discovery = await hostnameSecurity.discoverHostname(hostnameRaw);
      if (!discovery.ok) {
        const status = discovery.code === "SSRF_BLOCKED" ? 400 : 400;
        return res.status(status).json({
          error: discovery.error,
          code: discovery.code || "DISCOVERY_FAILED"
        });
      }

      const hostname = discovery.hostname;
      const kind = hostname.startsWith("www.") ? "www" : "apex";
      const type = kind === "apex" ? "DOMAIN" : "HOSTNAME";
      const meta = JSON.stringify({
        discovery: {
          dns: discovery.dns,
          observedAt: discovery.observedAt
        }
      });

      const existingAsset = await pool.query(
        `SELECT * FROM assets
         WHERE organization_id = $1
           AND lower(hostname) = lower($2)
           AND type = $3
           AND status <> 'archived'
         LIMIT 1`,
        [orgId, hostname, type]
      );

      let asset;
      if (existingAsset.rows.length > 0) {
        const upd = await pool.query(
          `UPDATE assets SET
             metadata = $1::jsonb,
             last_observed_at = NOW(),
             updated_at = NOW(),
             status = 'active',
             kind = $2,
             is_primary = $3
           WHERE id = $4 AND organization_id = $5
           RETURNING *`,
          [meta, kind, kind === "apex", existingAsset.rows[0].id, orgId]
        );
        asset = upd.rows[0];
      } else {
        const ins = await pool.query(
          `INSERT INTO assets(
             organization_id, type, name, hostname, environment, status, kind,
             is_primary, metadata, last_observed_at, created_by
           ) VALUES ($1,$2,$3,$4,'production','active',$5,$6,$7::jsonb,NOW(),$8)
           RETURNING *`,
          [orgId, type, hostname, hostname, kind, kind === "apex", meta, userId]
        );
        asset = ins.rows[0];
      }
      let certificate = null;

      if (discovery.tls?.ok) {
        const tls = discovery.tls;
        const sans = Array.isArray(tls.sans) ? tls.sans : [];
        const certIns = await pool.query(
          `INSERT INTO tls_certificates(
             organization_id, asset_id, provider, serial, fingerprint_sha256,
             issuer, subject, not_before, not_after, sans, is_wildcard,
             auto_renew, renewal_method, last_observed_at, observation_status,
             hostname_match, metadata, created_by
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,NOW(),$14,$15,$16::jsonb,$17
           )
           RETURNING *`,
          [
            orgId,
            asset.id,
            tls.provider || tlsStatus.providerFromIssuer(tls.issuer),
            tls.serial,
            tls.fingerprintSha256,
            tls.issuer,
            tls.subject,
            tls.notBefore,
            tls.notAfter,
            JSON.stringify(sans),
            Boolean(tls.isWildcard ?? tlsStatus.detectWildcard(sans)),
            tls.autoRenew,
            tls.renewalMethod,
            tls.observationStatus || "UNKNOWN",
            tls.hostnameMatch,
            JSON.stringify({
              daysRemaining: tls.daysRemaining,
              riskHint: tls.riskHint,
              chainError: tls.chainError,
              authorizationError: tls.authorizationError,
              observedAt: discovery.observedAt
            }),
            userId
          ]
        );
        certificate = tlsStatus.serializeTlsCertificate(certIns.rows[0]);
      }

      try {
        await provisionMonitorsForAsset(pool, {
          organizationId: orgId,
          assetId: asset.id,
          hostname,
          createdBy: userId,
          assetType: type
        });
      } catch (provErr) {
        console.error("[ASSETS] discover provision monitors:", provErr.message);
      }

      res.status(201).json({
        discovery: {
          hostname,
          dns: discovery.dns,
          tls: discovery.tls?.ok
            ? {
                observationStatus: discovery.tls.observationStatus,
                provider: discovery.tls.provider,
                notAfter: discovery.tls.notAfter,
                sans: discovery.tls.sans,
                isWildcard: discovery.tls.isWildcard,
                hostnameMatch: discovery.tls.hostnameMatch,
                daysRemaining: discovery.tls.daysRemaining,
                riskHint: discovery.tls.riskHint
              }
            : {
                observationStatus: discovery.tls?.observationStatus || "UNKNOWN",
                error: discovery.tls?.error || null
              },
          observedAt: discovery.observedAt
        },
        asset: serializeAsset(asset),
        certificate
      });
    } catch (error) {
      console.error("[ASSETS] discover:", error.message);
      res.status(500).json({ error: "Discovery no disponible." });
    }
  });

  // ---- TLS ----
  router.get("/tls", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;
      const r = await pool.query(
        `SELECT c.*, a.hostname AS asset_hostname, a.name AS asset_name, a.type AS asset_type
         FROM tls_certificates c
         LEFT JOIN assets a ON a.id = c.asset_id AND a.organization_id = c.organization_id
         WHERE c.organization_id = $1
         ORDER BY c.not_after ASC NULLS LAST, c.id DESC
         LIMIT 200`,
        [orgId]
      );

      const certificates = r.rows.map((row) => {
        const serialized = tlsStatus.serializeTlsCertificate(row);
        // Recompute status from stored dates for display honesty
        const derived = tlsStatus.deriveTlsObservationStatus({
          notAfter: row.not_after,
          hostnameMatch: row.hostname_match,
          chainError: row.observation_status === "CHAIN_ERROR",
          hasObservation: Boolean(row.last_observed_at || row.not_after)
        });
        return {
          ...serialized,
          observationStatus: derived.status,
          daysRemaining: derived.daysRemaining,
          riskHint: derived.riskHint,
          assetHostname: row.asset_hostname || null,
          assetName: row.asset_name || null,
          assetType: row.asset_type || null
        };
      });

      res.json({ certificates });
    } catch (error) {
      console.error("[ASSETS] tls list:", error.message);
      res.status(500).json({ error: "No se pudieron listar los certificados." });
    }
  });

  router.get("/tls/:id", async (req, res) => {
    try {
      const orgId = requireOrg(req, res);
      if (!orgId) return;
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Identificador invalido." });
      }
      const r = await pool.query(
        `SELECT c.*, a.hostname AS asset_hostname, a.name AS asset_name
         FROM tls_certificates c
         LEFT JOIN assets a ON a.id = c.asset_id AND a.organization_id = c.organization_id
         WHERE c.id = $1 AND c.organization_id = $2`,
        [id, orgId]
      );
      if (r.rows.length === 0) {
        return res.status(404).json({ error: "Certificado no encontrado." });
      }
      const row = r.rows[0];
      const serialized = tlsStatus.serializeTlsCertificate(row);
      const derived = tlsStatus.deriveTlsObservationStatus({
        notAfter: row.not_after,
        hostnameMatch: row.hostname_match,
        chainError: row.observation_status === "CHAIN_ERROR",
        hasObservation: Boolean(row.last_observed_at || row.not_after)
      });
      res.json({
        certificate: {
          ...serialized,
          observationStatus: derived.status,
          daysRemaining: derived.daysRemaining,
          riskHint: derived.riskHint,
          assetHostname: row.asset_hostname || null,
          assetName: row.asset_name || null
        }
      });
    } catch (error) {
      console.error("[ASSETS] tls get:", error.message);
      res.status(500).json({ error: "No se pudo cargar el certificado." });
    }
  });

  return router;
}

module.exports = createAssetsRouter;
module.exports.createAssetsRouter = createAssetsRouter;
module.exports.serializeAsset = serializeAsset;
