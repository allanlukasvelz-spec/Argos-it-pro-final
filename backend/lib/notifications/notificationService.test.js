const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createNotificationService } = require("./notificationService");

function createMemoryPool() {
  const events = [];
  const notifications = [];
  const prefs = new Map();
  const pool = {
    query: async (sql, params = []) => {
      const s = String(sql).replace(/\s+/g, " ").trim();
      if (s.includes("INSERT INTO notification_events")) {
        if (events.find((e) => e.dedupe_key === params[7])) {
          const err = new Error("dup");
          err.code = "23505";
          throw err;
        }
        events.push({
          id: params[0],
          organization_id: params[1],
          dedupe_key: params[7]
        });
        return { rows: [] };
      }
      if (s.includes("FROM users") && s.includes("role IN")) {
        return { rows: [{ user_id: 2, role: "admin" }] };
      }
      if (s.includes("FROM organization_members")) {
        return { rows: [{ user_id: 10, org_role: "org_owner" }] };
      }
      if (s.includes("FROM notification_preferences")) {
        const key = `${params[0]}:${params[1]}:${params[2]}`;
        const enabled = prefs.get(key);
        return { rows: enabled === false ? [{ enabled: false }] : [] };
      }
      if (s.includes("INSERT INTO notifications")) {
        const existing = notifications.find(
          (n) => n.event_id === params[3] && n.user_id === params[2]
        );
        if (existing) {
          return { rows: [] };
        }
        notifications.push({
          id: params[0],
          event_id: params[3],
          user_id: params[2]
        });
        return { rows: [{ id: params[0] }] };
      }
      if (s.includes("INSERT INTO activity_logs")) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
  return { pool, events, notifications, prefs };
}

describe("notificationService dedupe", () => {
  it("skips duplicate REPORT_READY events per run", async () => {
    const { pool } = createMemoryPool();
    const svc = createNotificationService(pool);
    const r1 = await svc.emitReportReady({
      organizationId: 1,
      reportId: "r1",
      reportRunId: "run-1",
      requestedBy: 10
    });
    const r2 = await svc.emitReportReady({
      organizationId: 1,
      reportId: "r1",
      reportRunId: "run-1",
      requestedBy: 10
    });
    assert.equal(r1.skipped, false);
    assert.equal(r2.skipped, true);
    assert.equal(r2.reason, "dedupe");
  });

  it("emits a web project correction without breaking report ready", async () => {
    const { pool, notifications } = createMemoryPool();
    const svc = createNotificationService(pool);
    const { WEB_PROJECT_NOTIFICATION_EVENTS } = require("../webProjects/notificationCopy");
    const wp = await svc.emitWebProject({
      organizationId: 1,
      kind: WEB_PROJECT_NOTIFICATION_EVENTS.CORRECTION_REQUESTED,
      actorUserId: 99,
      project: { id: 3, title: "Acme site", organizationId: 1 },
      reviewId: 8,
      correctionMessage: "Sustituye el archivo.",
      target: { targetType: "DOCUMENT", targetId: "d1" }
    });
    assert.equal(wp.skipped, false);
    assert.equal(wp.created, 1);
    assert.equal(notifications.length, 1);
  });

  it("self-service staff notify fans out to admins and dedupes", async () => {
    const { pool, notifications } = createMemoryPool();
    const svc = createNotificationService(pool);
    const { WEB_PROJECT_NOTIFICATION_EVENTS } = require("../webProjects/notificationCopy");
    const first = await svc.emitWebProject({
      organizationId: 4,
      kind: WEB_PROJECT_NOTIFICATION_EVENTS.SELF_SERVICE_STARTED,
      audience: "staff",
      actorUserId: 7,
      project: { id: 9, title: "Web de Example Studio", organizationId: 4 }
    });
    const second = await svc.emitWebProject({
      organizationId: 4,
      kind: WEB_PROJECT_NOTIFICATION_EVENTS.SELF_SERVICE_STARTED,
      audience: "staff",
      actorUserId: 7,
      project: { id: 9, title: "Web de Example Studio", organizationId: 4 }
    });
    assert.equal(first.skipped, false);
    assert.equal(first.created, 1);
    assert.equal(notifications[0].user_id, 2);
    assert.equal(second.skipped, true);
  });
});
