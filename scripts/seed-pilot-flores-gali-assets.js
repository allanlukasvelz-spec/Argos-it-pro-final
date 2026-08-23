#!/usr/bin/env node
/**
 * Optional pilot seed for Flores Gali domains/TLS metadata (NO private keys).
 * Only runs if an organization matching the slug/name already exists.
 * Does NOT hardcode pilot logic into the application runtime.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/seed-pilot-flores-gali-assets.js
 */
const { Pool } = require("../backend/node_modules/pg");

const PILOT_HOSTS = [
  { hostname: "floresgali.com", type: "DOMAIN", kind: "apex", isPrimary: true },
  { hostname: "www.floresgali.com", type: "HOSTNAME", kind: "www", isPrimary: false },
  { hostname: "floresgali.es", type: "DOMAIN", kind: "apex", isPrimary: false },
  { hostname: "www.floresgali.es", type: "HOSTNAME", kind: "www", isPrimary: false }
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const org = await pool.query(
      `SELECT id, slug, name FROM organizations
       WHERE status = 'active'
         AND (
           lower(slug) LIKE '%flores%gali%'
           OR lower(name) LIKE '%flores%gali%'
         )
       ORDER BY id ASC
       LIMIT 1`
    );
    if (org.rows.length === 0) {
      console.log("No Flores Gali organization found — skip seed (hardcoded=NO).");
      return;
    }

    const organizationId = org.rows[0].id;
    console.log(`Seeding pilot assets for org ${organizationId} (${org.rows[0].name})`);

    let primaryAssetId = null;
    for (const host of PILOT_HOSTS) {
      const existing = await pool.query(
        `SELECT id FROM assets
         WHERE organization_id = $1 AND lower(hostname) = lower($2) AND type = $3
           AND status <> 'archived'
         LIMIT 1`,
        [organizationId, host.hostname, host.type]
      );
      let assetId;
      if (existing.rows.length) {
        assetId = existing.rows[0].id;
      } else {
        const ins = await pool.query(
          `INSERT INTO assets(
             organization_id, type, name, hostname, environment, status, kind, is_primary, metadata
           ) VALUES ($1,$2,$3,$4,'production','active',$5,$6,$7::jsonb)
           RETURNING id`,
          [
            organizationId,
            host.type,
            host.hostname,
            host.hostname,
            host.kind,
            host.isPrimary,
            JSON.stringify({ pilot: "flores-gali", source: "seed-script" })
          ]
        );
        assetId = ins.rows[0].id;
      }
      if (host.hostname === "floresgali.com") primaryAssetId = assetId;
    }

    if (primaryAssetId) {
      const sans = ["*.floresgali.com", "floresgali.com", "floresgali.es", "www.floresgali.es"];
      const certExists = await pool.query(
        `SELECT id FROM tls_certificates
         WHERE organization_id = $1 AND asset_id = $2
         LIMIT 1`,
        [organizationId, primaryAssetId]
      );
      if (certExists.rows.length === 0) {
        await pool.query(
          `INSERT INTO tls_certificates(
             organization_id, asset_id, provider, sans, is_wildcard,
             auto_renew, renewal_method, observation_status, hostname_match, metadata
           ) VALUES ($1,$2,$3,$4::jsonb,true,true,'acme','UNKNOWN',true,$5::jsonb)`,
          [
            organizationId,
            primaryAssetId,
            "Let's Encrypt",
            JSON.stringify(sans),
            JSON.stringify({
              note: "Pilot placeholder — prefer live discovery for current dates",
              source: "seed-script"
            })
          ]
        );
      }
    }

    console.log("Pilot seed complete. Prefer POST /api/client/domains/discover for live TLS.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
