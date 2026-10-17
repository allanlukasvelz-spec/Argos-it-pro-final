const express = require("express");
const { createSqlStore } = require("../lib/webProjects/sqlStore");
const { createWebProjectService } = require("../lib/webProjects/service");
const { createInvitationService } = require("../lib/webProjects/invitationService");
const { createInvitationMailer } = require("../lib/webProjects/invitationMailer");
const { WebProjectError } = require("../lib/webProjects/errors");
const { createNotificationService } = require("../lib/notifications/notificationService");

function sendError(res, err) {
  if (err instanceof WebProjectError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  console.error("[NOC WEB PROJECT INVITES]", err.message);
  return res.status(500).json({ error: "Error NOC en invitaciones" });
}

function createNocWebProjectInvitationsRouter(pool, options = {}) {
  const notifications =
    options.notifications || (pool ? createNotificationService(pool) : null);
  const projectService =
    options.projectService ||
    createWebProjectService(createSqlStore(pool), { notifications });
  const invitations =
    options.invitations ||
    createInvitationService({
      pool,
      projectService,
      mailer: options.mailer || createInvitationMailer()
    });
  const router = express.Router();

  router.get("/web-project-invitations", async (req, res) => {
    try {
      const organizationId = Number(req.query.organization_id || 0) || null;
      const items = await invitations.listInvitations({ organizationId });
      res.json({ items, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-project-invitations", async (req, res) => {
    try {
      const created = await invitations.createInvitation({
        email: req.body?.email,
        displayName: req.body?.displayName,
        projectType: req.body?.projectType,
        projectTitle: req.body?.projectTitle,
        organizationId: req.body?.organizationId || req.query.organization_id,
        orgRole: req.body?.orgRole,
        actorUserId: req.user.id
      });
      res.status(201).json(created);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-project-invitations/:id", async (req, res) => {
    try {
      const invitation = await invitations.getInvitation(Number(req.params.id));
      res.json({ invitation });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-project-invitations/:id/revoke", async (req, res) => {
    try {
      const invitation = await invitations.revokeInvitation(Number(req.params.id), req.user.id);
      res.json({ invitation });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-project-invitations/:id/resend", async (req, res) => {
    try {
      const result = await invitations.resendInvitation(Number(req.params.id), req.user.id);
      res.json(result);
    } catch (err) {
      sendError(res, err);
    }
  });

  return router;
}

module.exports = createNocWebProjectInvitationsRouter;
