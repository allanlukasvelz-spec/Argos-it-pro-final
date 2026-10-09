const express = require("express");
const { createSqlStore } = require("../lib/webProjects/sqlStore");
const { createWebProjectService } = require("../lib/webProjects/service");
const { createInvitationService } = require("../lib/webProjects/invitationService");
const { createInvitationMailer } = require("../lib/webProjects/invitationMailer");
const { WebProjectError } = require("../lib/webProjects/errors");
const { inviteLimiter, validatePassword } = require("../middleware/security");
const { issueInvitationSession, readSessionFromRequest } = require("../lib/webProjects/invitationSession");
const { createNotificationService } = require("../lib/notifications/notificationService");

function sendError(res, err) {
  if (err instanceof WebProjectError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  console.error("[PUBLIC WEB PROJECT INVITES]", err.message);
  return res.status(500).json({ error: "No se ha podido completar la acción." });
}

function createPublicWebProjectInvitationsRouter(pool, options = {}) {
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

  router.use((req, res, next) => {
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cache-Control", "private, no-store");
    next();
  });

  router.get("/resolve", inviteLimiter, async (req, res) => {
    try {
      const invitation = await invitations.resolveInvitation(req.query.token);
      res.json({ invitation });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/accept", inviteLimiter, validatePassword, async (req, res) => {
    try {
      const accepted = await invitations.acceptInvitation({
        token: req.body?.token,
        sessionUser: readSessionFromRequest(req),
        password: req.body?.password,
        name: req.body?.name
      });
      if (accepted.issueSession && accepted.user) {
        await issueInvitationSession(pool, res, accepted.user);
      }
      res.json({
        projectId: accepted.projectId,
        redirectTo: accepted.redirectTo
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  return router;
}

module.exports = createPublicWebProjectInvitationsRouter;
