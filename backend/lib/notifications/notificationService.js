/**
 * In-app notifications — MVP channel only.
 */
const { randomUUID } = require("crypto");
const { sanitizeEvidence } = require("../monitoring/sanitizeEvidence");
const { resolveOrgMemberRecipients } = require("./recipientResolver");
const { NOTIFICATION_EVENT_REPORT_READY } = require("../reports/reportConstants");

function createNotificationService(pool) {
  async function auditNotification(userId, organizationId, actionType, details) {
    await pool.query(
      `INSERT INTO activity_logs(user_id, organization_id, action_type, details)
       VALUES ($1, $2, $3, $4)`,
      [userId, organizationId, actionType, JSON.stringify(sanitizeEvidence(details))]
    );
  }

  async function emitReportReady({ organizationId, reportId, reportRunId, requestedBy }) {
    const dedupeKey = `REPORT_READY:run:${reportRunId}`;
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
          NOTIFICATION_EVENT_REPORT_READY,
          "INFO",
          "report_run",
          reportRunId,
          JSON.stringify(sanitizeEvidence({ reportId, reportRunId })),
          dedupeKey
        ]
      );
    } catch (err) {
      if (err.code === "23505") {
        return { skipped: true, reason: "dedupe" };
      }
      throw err;
    }

    const recipients = await resolveOrgMemberRecipients(pool, organizationId, {
      eventType: NOTIFICATION_EVENT_REPORT_READY
    });

    let created = 0;
    for (const recipient of recipients) {
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
            NOTIFICATION_EVENT_REPORT_READY,
            "INFO",
            "Informe listo",
            "Tu informe de incidente está disponible en Informes.",
            `/dashboard/informes?report=${reportId}`
          ]
        );
        if (!ins.rows[0]) {
          continue;
        }
        created += 1;
        await auditNotification(recipient.userId, organizationId, "notification_created", {
          eventType: NOTIFICATION_EVENT_REPORT_READY,
          notificationId: ins.rows[0].id,
          reportRunId
        });
      } catch (err) {
        if (err.code !== "23505") {
          console.error("[NOTIFY] insert failed:", err.message);
        }
      }
    }

    if (requestedBy) {
      await auditNotification(requestedBy, organizationId, "report_ready_notified", {
        reportRunId,
        recipientCount: created
      });
    }

    return { eventId, created, skipped: false };
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
    listForUser,
    markRead,
    getPreferences,
    setPreference
  };
}

module.exports = { createNotificationService };
