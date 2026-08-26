/**
 * Local/test-only helpers. Mounted only when testSurfacePolicy allows:
 * NODE_ENV in {test,development} AND ARGOS_ALLOW_RATE_LIMIT_RESET=1.
 * Never mounts under ARGOS_ENVIRONMENT=staging|production or NODE_ENV=production.
 */
const express = require("express");
const {
  resetAllRateLimitStores,
  isRateLimitResetAllowed
} = require("../lib/rateLimitRegistry");

function createTestOnlyRouter() {
  const router = express.Router();

  router.post("/reset-rate-limits", (_req, res) => {
    if (!isRateLimitResetAllowed()) {
      return res.status(404).json({ error: "Not found" });
    }
    const result = resetAllRateLimitStores();
    return res.json({ ok: true, ...result });
  });

  return router;
}

module.exports = createTestOnlyRouter;
