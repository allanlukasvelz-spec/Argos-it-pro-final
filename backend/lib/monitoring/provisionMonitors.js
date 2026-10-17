/**
 * Provision default monitors for DOMAIN / WEBSITE / HOSTNAME assets with hostname.
 * No secrets. No client POST create.
 */
const { DEFAULT_INTERVAL, DEFAULT_TIMEOUT_MS } = require("./constants");

const PROVISION_TYPES = [
  { type: "HTTP", interval: DEFAULT_INTERVAL.HTTP, timeout: DEFAULT_TIMEOUT_MS.HTTP },
  { type: "TLS", interval: DEFAULT_INTERVAL.TLS, timeout: DEFAULT_TIMEOUT_MS.TLS },
  { type: "DNS", interval: DEFAULT_INTERVAL.DNS, timeout: DEFAULT_TIMEOUT_MS.DNS }
];

/**
 * @param {import("pg").Pool} pool
 * @param {{ organizationId: number, assetId: number, hostname: string, createdBy?: number|null, assetType?: string }} args
 */
async function provisionMonitorsForAsset(pool, args) {
  const { organizationId, assetId, hostname, createdBy = null } = args;
  if (!hostname || !organizationId || !assetId) {
    return { provisioned: [] };
  }

  const assetType = String(args.assetType || "").toUpperCase();
  if (assetType && !["DOMAIN", "HOSTNAME", "WEBSITE"].includes(assetType)) {
    return { provisioned: [] };
  }

  const provisioned = [];
  for (const spec of PROVISION_TYPES) {
    const name = `${spec.type} · ${hostname}`.slice(0, 200);
    const config = JSON.stringify(
      spec.type === "HTTP"
        ? { protocol: "https", path: "/", method: "GET" }
        : spec.type === "DNS"
          ? { baseline: null }
          : {}
    );

    const existing = await pool.query(
      `SELECT id FROM monitors
       WHERE organization_id = $1 AND asset_id = $2 AND type = $3
         AND enabled = true AND status <> 'DISABLED'
       LIMIT 1`,
      [organizationId, assetId, spec.type]
    );
    if (existing.rows.length > 0) {
      provisioned.push({ id: existing.rows[0].id, type: spec.type, created: false });
      continue;
    }

    const nextCheck = new Date(Date.now() + Math.floor(Math.random() * 15000));
    try {
      const ins = await pool.query(
        `INSERT INTO monitors (
           organization_id, asset_id, type, name, status, enabled,
           interval_seconds, timeout_ms, config, next_check_at, created_by
         ) VALUES ($1,$2,$3,$4,'ACTIVE',true,$5,$6,$7::jsonb,$8,$9)
         RETURNING id`,
        [
          organizationId,
          assetId,
          spec.type,
          name,
          spec.interval,
          spec.timeout,
          config,
          nextCheck.toISOString(),
          createdBy
        ]
      );
      provisioned.push({ id: ins.rows[0].id, type: spec.type, created: true });
    } catch (err) {
      if (err.code === "23505") {
        const again = await pool.query(
          `SELECT id FROM monitors
           WHERE organization_id = $1 AND asset_id = $2 AND type = $3
           LIMIT 1`,
          [organizationId, assetId, spec.type]
        );
        if (again.rows[0]) {
          provisioned.push({ id: again.rows[0].id, type: spec.type, created: false });
        }
        continue;
      }
      throw err;
    }
  }
  return { provisioned };
}

module.exports = {
  provisionMonitorsForAsset,
  PROVISION_TYPES
};
