/**
 * In-app notifications — MVP channel only.
 */
const { randomUUID } = require("crypto");
const { sanitizeEvidence } = require("../monitoring/sanitizeEvidence");
const { resolveOrgMemberRecipients, resolveStaffRecipients } = require("./recipientResolver");
const { NOTIFICATION_EVENT_REPORT_READY } = require("../reports/reportConstants");
const {
  WEB_PROJECT_NOTIFICATION_EVENTS,
  buildWebProjectNotification
} = require("../webProjects/notificationCopy");

const IN_APP_EVENT_TYPES = Object.freeze([
  NOTIFICATION_EVENT_REPORT_READY,
  ...Object.values(WEB_PROJECT_NOTIFICATION_EVENTS)
]);

function createNotificationService(pool) {
  async function auditNotification(userId, organizationId, actionType, details) {
    await pool.query(
      `INSERT INTO activity_logs(user_id, organization_id, action_type, details)
       VALUES ($1, $2, $3, $4)`,
      [userId, organizationId, actionType, JSON.stringify(sanitizeEvidence(details))]
    );
  }

  async function fanoutInApp({
    organizationId,
    eventType,
    severity,
    scopeType,
    scopeId,
    payload,
    dedupeKey,
    title,
    body,
    linkTarget,
    excludeUserId = null,
    extraAudit = null,
    recipientSource = "org"
  }) {
    let eventId;
    try {
      eventId = randomUUID();
      await pool.query(
        `INSERT INTO notification_events (
           id, organization_id, event_type, severity, scope_type, scope_id, payload, dedupe_key
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          eventId,
          organizationId,
          eventType,
          severity,
          scopeType,
          scopeId,
          JSON.stringify(sanitizeEvidence(payload || {})),
          dedupeKey
        ]
      );
    } catch (err) {
      if (err.code === "23505") {
        return { skipped: true, reason: "dedupe", created: 0 };
      }
      throw err;
    }

    const recipients =
      recipientSource === "staff"
        ? await resolveStaffRecipients(pool)
        : await resolveOrgMemberRecipients(pool, organizationId, { eventType });
    let created = 0;
    for (const recipient of recipients) {
      if (excludeUserId && Number(recipient.userId) === Number(excludeUserId)) continue;
      const notifId = randomUUID();
      try {
        const ins = await pool.query(
          `INSERT INTO notifications (
             id, organization_id, user_id, event_id, event_type, severity,
             title, body, link_target
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (event_id, user_id) DO NOTHING
           RETURNING id`,
          [
            notifId,
            organizationId,
            recipient.userId,
            eventId,
            eventType,
            severity,
            title,
            body,
            linkTarget
          ]
        );
        if (!ins.rows[0]) continue;
        created += 1;
        await auditNotification(recipient.userId, organizationId, "notification_created", {
          eventType,
          notificationId: ins.rows[0].id,
          scopeType,
          scopeId
        });
      } catch (err) {
        if (err.code !== "23505") {
          console.error("[NOTIFY] insert failed:", err.message);
        }
      }
    }

    if (extraAudit) {
      await auditNotification(extraAudit.userId, organizationId, extraAudit.actionType, extraAudit.details);
    }

    return { eventId, created, skipped: false };
  }

  async function emitReportReady({ organizationId, reportId, reportRunId, requestedBy }) {
    return fanoutInApp({
      organizationId,
      eventType: NOTIFICATION_EVENT_REPORT_READY,
      severity: "INFO",
      scopeType: "report_run",
      scopeId: reportRunId,
      payload: { reportId, reportRunId },
      dedupeKey: `REPORT_READY:run:${reportRunId}`,
      title: "Informe listo",
      body: "Tu informe de incidente está disponible en Informes.",
      linkTarget: `/dashboard/informes?report=${reportId}`,
      extraAudit: requestedBy
        ? {
            userId: requestedBy,
            actionType: "report_ready_notified",
            details: { reportRunId }
          }
        : null
    });
  }

  async function emitWebProject({ organizationId, kind, actorUserId = null, audience = "org", ...input }) {
    const copy = buildWebProjectNotification(kind, { ...input, organizationId });
    if (!copy) {
      return { skipped: true, reason: "unknown_kind", created: 0 };
    }
    return fanoutInApp({
      organizationId,
      eventType: copy.eventType,
      severity: copy.severity,
      scopeType: copy.scopeType,
      scopeId: copy.scopeId,
      payload: copy.payload,
      dedupeKey: copy.dedupeKey,
      title: copy.title,
      body: copy.body,
      linkTarget: copy.linkTarget,
      excludeUserId: actorUserId,
      recipientSource: audience === "staff" ? "staff" : "org"
    });
  }

  async function listForUser(userId, organizationId, { unreadOnly = false, limit = 50, offset = 0 } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    let sql = `SELECT * FROM notifications WHERE user_id = $1 AND organization_id = $2`;
    const params = [userId, organizationId];
    if (unreadOnly) {
      sql += ` AND read_at IS NULL`;
    }
    sql += ` ORDER BY created_at DESC LIMIT $3 OFFSET $4`;
    params.push(safeLimit, safeOffset);
    const { rows } = await pool.query(sql, params);
    return rows;
  }

  async function markRead(notificationId, userId, organizationId) {
    const r = await pool.query(
      `UPDATE notifications
       SET read_at = NOW()
       WHERE id = $1 AND user_id = $2 AND organization_id = $3 AND read_at IS NULL
       RETURNING id`,
      [notificationId, userId, organizationId]
    );
    if (r.rows[0]) {
      await auditNotification(userId, organizationId, "notification_read", { notificationId });
    }
    return Boolean(r.rows[0]);
  }

  async function getPreferences(userId, organizationId) {
    const { rows } = await pool.query(
      `SELECT event_type, enabled FROM notification_preferences
       WHERE user_id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    return rows;
  }

  async function setPreference(userId, organizationId, eventType, enabled) {
    await pool.query(
      `INSERT INTO notification_preferences (organization_id, user_id, event_type, enabled, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (organization_id, user_id, event_type)
       DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW()`,
      [organizationId, userId, eventType, Boolean(enabled)]
    );
    await auditNotification(userId, organizationId, "notification_preference_updated", {
      eventType,
      enabled: Boolean(enabled)
    });
  }

  return {
    emitReportReady,
    emitWebProject,
    listForUser,
    markRead,
    getPreferences,
    setPreference
  };
}

module.exports = {
  createNotificationService,
  IN_APP_EVENT_TYPES,
  WEB_PROJECT_NOTIFICATION_EVENTS
};
