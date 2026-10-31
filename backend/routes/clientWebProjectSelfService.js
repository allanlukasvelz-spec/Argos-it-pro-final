const express = require("express");
const { createSqlStore } = require("../lib/webProjects/sqlStore");
const { createWebProjectService } = require("../lib/webProjects/service");
const { createSelfServiceService, GENERIC_START_ERROR } = require("../lib/webProjects/selfServiceService");
const { WebProjectError } = require("../lib/webProjects/errors");
const { ERROR_CODES } = require("../lib/webProjects/constants");
const { createNotificationService } = require("../lib/notifications/notificationService");
const { selfServiceLimiter } = require("../middleware/security");

function sendError(res, err) {
  if (err instanceof WebProjectError) {
    const body = { error: err.message, code: err.code };
    if (err.code === ERROR_CODES.ORG_SELECTION_REQUIRED && Array.isArray(err.organizations)) {
      body.organizations = err.organizations;
    }
    return res.status(err.status).json(body);
  }
  console.error("[CLIENT WEB PROJECT SELF-SERVICE]", err.message);
  return res.status(500).json({ error: GENERIC_START_ERROR, code: "SELF_SERVICE_FAILED" });
}

function createClientWebProjectSelfServiceRouter(pool, options = {}) {
  const notifications =
    options.notifications || (pool ? createNotificationService(pool) : null);
  const projectService =
    options.projectService ||
    createWebProjectService(createSqlStore(pool), { notifications });
  const service =
    options.selfService ||
    createSelfServiceService(pool, { projectService, notifications });
  const limiter =
    options.limiter === null ? (req, res, next) => next() : options.limiter || selfServiceLimiter;
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const context = await service.getContext(req.user?.id);
      res.json(context);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/", limiter, async (req, res) => {
    try {
      const result = await service.startSelfService({
        actorUserId: req.user?.id,
        projectType: req.body?.projectType,
        title: req.body?.title,
        organizationName: req.body?.organizationName,
        organizationId: req.body?.organizationId,
        createOrganization: req.body?.createOrganization,
        idempotencyKey: req.body?.idempotencyKey || req.get("Idempotency-Key")
      });
      res.status(result.reused ? 200 : 201).json({
        project: result.project,
        organization: result.organization,
        created: result.created,
        reused: result.reused,
        policy: result.policy
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  return router;
}

module.exports = createClientWebProjectSelfServiceRouter;
