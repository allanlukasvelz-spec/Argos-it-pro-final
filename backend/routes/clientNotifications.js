/**
 * Client in-app notifications — MVP channel only.
 */
const express = require("express");
const { createNotificationService } = require("../lib/notifications/notificationService");
const { NOTIFICATION_EVENT_REPORT_READY } = require("../lib/reports/reportConstants");

function createClientNotificationsRouter(pool) {
  const router = express.Router();
  const notifications = createNotificationService(pool);

  router.get("/", async (req, res) => {
    try {
      const rows = await notifications.listForUser(req.user.id, req.tenant.id, {
        unreadOnly: req.query.unread === "1",
        limit: req.query.limit,
        offset: req.query.offset
      });
      res.json({
        items: rows.map((n) => ({
          id: n.id,
          eventType: n.event_type,
          severity: n.severity,
          title: n.title,
          body: n.body,
          linkTarget: n.link_target,
          readAt: n.read_at,
          createdAt: n.created_at
        }))
      });
    } catch (err) {
      console.error("[CLIENT NOTIFY] list:", err.message);
      res.status(500).json({ error: "Error listando notificaciones" });
    }
  });

  router.patch("/:id/read", async (req, res) => {
    try {
      const ok = await notifications.markRead(req.params.id, req.user.id, req.tenant.id);
      if (!ok) {
        return res.status(404).json({ error: "Notificación no encontrada", code: "NOT_FOUND" });
      }
      res.json({ ok: true });
    } catch (err) {
      console.error("[CLIENT NOTIFY] read:", err.message);
      res.status(500).json({ error: "Error actualizando notificación" });
    }
  });

  router.get("/preferences", async (req, res) => {
    try {
      const prefs = await notifications.getPreferences(req.user.id, req.tenant.id);
      res.json({ preferences: prefs });
    } catch (err) {
      res.status(500).json({ error: "Error obteniendo preferencias" });
    }
  });

  router.patch("/preferences", async (req, res) => {
    try {
      const eventType = String(req.body?.eventType || NOTIFICATION_EVENT_REPORT_READY);
      if (eventType !== NOTIFICATION_EVENT_REPORT_READY) {
        return res.status(400).json({ error: "eventType no soportado en MVP", code: "INVALID_EVENT" });
      }
      await notifications.setPreference(
        req.user.id,
        req.tenant.id,
        eventType,
        req.body?.enabled !== false
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Error guardando preferencia" });
    }
  });

  return router;
}

module.exports = createClientNotificationsRouter;
