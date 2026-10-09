/**
 * Staging harness surface — ONLY when ARGOS_ENVIRONMENT=staging AND
 * ARGOS_STAGING_HARNESS_TOKEN is set (>=32 chars) and request presents it.
 *
 * Never mounts for production. Never weakens requireNocAccess for real NOC routes.
 * Creates synthetic users; Playwright must still login via /api/auth/login.
 */
const crypto = require("crypto");
const bcrypt = require("bcrypt");

function isStagingHarnessAllowed() {
  const env = String(process.env.ARGOS_ENVIRONMENT || "")
    .trim()
    .toLowerCase();
  if (env !== "staging") return false;
  // Explicitly forbid if someone marks production by mistake
  if (String(process.env.NODE_ENV || "").toLowerCase() === "production" && env !== "staging") {
    return false;
  }
  const token = String(process.env.ARGOS_STAGING_HARNESS_TOKEN || "").trim();
  if (token.length < 32) return false;
  if (token.includes("CHANGE_ME")) return false;
  return true;
}

function harnessTokenMatches(req) {
  const expected = String(process.env.ARGOS_STAGING_HARNESS_TOKEN || "").trim();
  const header = String(req.headers["x-argos-staging-harness"] || "").trim();
  const auth = String(req.headers.authorization || "").trim();
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const provided = header || bearer;
  if (!expected || provided.length < 32) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function createStagingHarnessRouter(pool) {
  const express = require("express");
  const router = express.Router();

  router.use((req, res, next) => {
    if (!isStagingHarnessAllowed() || !harnessTokenMatches(req)) {
      return res.status(404).json({ error: "Not found" });
    }
    next();
  });

  /**
   * POST /provision
   * Creates synthetic org + admin + cliente + asset for staging E2E.
   * Password returned once; must authenticate via real /api/auth/login.
   */
  router.post("/provision", async (req, res) => {
    try {
      const stamp = Date.now();
      const rand = crypto.randomBytes(4).toString("hex");
      const password = `StgHarness1x_${rand}`;
      const hash = await bcrypt.hash(password, 10);
      const adminEmail = `stg-admin-${stamp}-${rand}@example.test`;
      const clientEmail = `stg-client-${stamp}-${rand}@example.test`;

      const org = (
        await pool.query(
          `INSERT INTO organizations (name, slug, status)
           VALUES ($1, $2, 'active') RETURNING id`,
          [`Staging Harness Org ${stamp}`, `stg-harness-${stamp}-${rand}`]
        )
      ).rows[0];

      const admin = (
        await pool.query(
          `INSERT INTO users (email, password, name, role, client_verified)
           VALUES ($1, $2, 'Staging Harness Admin', 'admin', true)
           RETURNING id, email, role`,
          [adminEmail, hash]
        )
      ).rows[0];

      const client = (
        await pool.query(
          `INSERT INTO users (email, password, name, role, client_verified)
           VALUES ($1, $2, 'Staging Harness Client', 'cliente', true)
           RETURNING id, email, role`,
          [clientEmail, hash]
        )
      ).rows[0];

      await pool.query(
        `INSERT INTO organization_members (organization_id, user_id, org_role)
         VALUES ($1, $2, 'org_owner'), ($1, $3, 'org_member')
         ON CONFLICT DO NOTHING`,
        [org.id, admin.id, client.id]
      );

      const asset = (
        await pool.query(
          `INSERT INTO assets (organization_id, type, hostname, status, name)
           VALUES ($1, 'SERVER', $2, 'active', 'STAGING-HARNESS-ASSET')
           RETURNING id`,
          [org.id, `stg-harness-${stamp}.local`]
        )
      ).rows[0];

      // Synthetic incident for NOC visuals
      await pool.query(
        `INSERT INTO incidents (organization_id, asset_id, title, severity, state, correlation_key)
         VALUES ($1, $2, 'Staging harness incident', 'WARNING', 'OPEN', $3)`,
        [org.id, asset.id, `stg-harness-corr-${stamp}`]
      );

      return res.status(201).json({
        ok: true,
        synthetic: true,
        meaning: "Use /api/auth/login with returned credentials. NOC still requires admin role server-side.",
        admin: { email: adminEmail, password, role: admin.role },
        client: { email: clientEmail, password, role: client.role },
        organizationId: org.id,
        assetId: asset.id
      });
    } catch (err) {
      console.error("[STAGING HARNESS] provision:", err.message);
      return res.status(500).json({ error: "Harness provision failed" });
    }
  });

  /**
   * POST /age-agent
   * Ages last_seen_at so NOC derives STALE/OFFLINE without waiting wall-clock.
   * Body: { agentId, ageMs } — synthetic only.
   */
  router.post("/age-agent", async (req, res) => {
    try {
      const agentId = Number(req.body?.agentId);
      const ageMs = Math.max(0, Number(req.body?.ageMs) || 0);
      if (!Number.isInteger(agentId) || agentId < 1) {
        return res.status(400).json({ error: "agentId required" });
      }
      if (ageMs < 60_000) {
        return res.status(400).json({ error: "ageMs must be >= 60000" });
      }
      const q = await pool.query(
        `UPDATE agents
         SET last_seen_at = NOW() - ($2::bigint * interval '1 millisecond'),
             updated_at = NOW()
         WHERE id = $1 AND status <> 'REVOKED'
         RETURNING id, status, last_seen_at`,
        [agentId, ageMs]
      );
      if (!q.rows[0]) {
        return res.status(404).json({ error: "Agent not found or revoked" });
      }
      return res.json({
        ok: true,
        agentId: q.rows[0].id,
        lastSeenAt: q.rows[0].last_seen_at,
        meaning: "Synthetic age for STALE/OFFLINE derivation only."
      });
    } catch (err) {
      console.error("[STAGING HARNESS] age-agent:", err.message);
      return res.status(500).json({ error: "Harness age-agent failed" });
    }
  });

  /**
   * POST /provision-org-admin
   * Synthetic org_member with org_role=org_admin (users.role stays cliente).
   * Proves org_admin NEVER grants NOC via requireNocAccess.
   */
  router.post("/provision-org-admin", async (req, res) => {
    try {
      const stamp = Date.now();
      const rand = crypto.randomBytes(4).toString("hex");
      const password = `StgOrgAdm1x_${rand}`;
      const hash = await bcrypt.hash(password, 10);
      const email = `stg-orgadmin-${stamp}-${rand}@example.test`;

      const org = (
        await pool.query(
          `INSERT INTO organizations (name, slug, status)
           VALUES ($1, $2, 'active') RETURNING id`,
          [`Staging OrgAdmin Org ${stamp}`, `stg-orgadmin-${stamp}-${rand}`]
        )
      ).rows[0];

      const user = (
        await pool.query(
          `INSERT INTO users (email, password, name, role, client_verified)
           VALUES ($1, $2, 'Staging Org Admin', 'cliente', true)
           RETURNING id, email, role`,
          [email, hash]
        )
      ).rows[0];

      await pool.query(
        `INSERT INTO organization_members (organization_id, user_id, org_role)
         VALUES ($1, $2, 'org_admin')
         ON CONFLICT DO NOTHING`,
        [org.id, user.id]
      );

      return res.status(201).json({
        ok: true,
        synthetic: true,
        user: { email, password, role: user.role, orgRole: "org_admin" },
        organizationId: org.id,
        meaning: "Expect /api/noc/* → 403 NOC_FORBIDDEN after real login."
      });
    } catch (err) {
      console.error("[STAGING HARNESS] provision-org-admin:", err.message);
      return res.status(500).json({ error: "Harness org-admin provision failed" });
    }
  });

  router.get("/health", (_req, res) => {
    res.json({
      ok: true,
      stagingHarness: true,
      meaning: "Staging harness reachable. Not customer health."
    });
  });

  return router;
}

module.exports = {
  isStagingHarnessAllowed,
  harnessTokenMatches,
  createStagingHarnessRouter
};
