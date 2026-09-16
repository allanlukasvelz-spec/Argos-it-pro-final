const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const { createMemoryStore } = require("./memoryStore");
const { createMemoryObjectStore } = require("./memoryObjectStore");
const { createWebProjectService } = require("./service");
const {
  WEB_PROJECT_NOTIFICATION_EVENTS,
  buildWebProjectNotification,
  usesClientFacingCopy
} = require("./notificationCopy");
const { createNotificationService } = require("../notifications/notificationService");
const createNocWebProjectsRouter = require("../../routes/nocWebProjects");
const createClientWebProjectsRouter = require("../../routes/clientWebProjects");
const createClientNotificationsRouter = require("../../routes/clientNotifications");
const requireNocAccess = require("../../middleware/requireNocAccess");

const ORG_A = 10;
const ORG_B = 20;

function createMemoryNotifications() {
  const emitted = [];
  return {
    emitted,
    async emitWebProject(input) {
      emitted.push(input);
      return { created: 1, skipped: false };
    }
  };
}

function serviceWithNotify() {
  const db = createMemoryStore();
  const objectStore = createMemoryObjectStore();
  const notifications = createMemoryNotifications();
  return {
    db,
    notifications,
    svc: createWebProjectService(db, { objectStore, notifications })
  };
}

async function seedProject(svc, organizationId = ORG_A) {
  const project = await svc.createProject({
    organizationId,
    actorUserId: 1,
    title: "Acme site",
    projectType: "improve"
  });
  await svc.upsertForm(organizationId, project.id, 1, [
    { fieldKey: "site_kind", value: "corporate" },
    { fieldKey: "has_existing_site", value: "no" },
    { fieldKey: "cms", value: "wordpress" },
    { fieldKey: "primary_language", value: "es" },
    { fieldKey: "needs_ecommerce", value: "no" }
  ]);
  return svc.getProject(organizationId, project.id);
}

function httpCall(app, method, path, body) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          path,
          method,
          headers: { "content-type": "application/json" }
        },
        (res) => {
          let raw = "";
          res.on("data", (chunk) => {
            raw += chunk;
          });
          res.on("end", () => {
            server.close();
            let json = null;
            if (raw) {
              try {
                json = JSON.parse(raw);
              } catch {
                json = null;
              }
            }
            resolve({ status: res.statusCode, json });
          });
        }
      );
      req.on("error", (err) => {
        server.close();
        reject(err);
      });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

function createNotifyPool({ members }) {
  const events = [];
  const notifications = [];
  const prefs = new Map();
  return {
    events,
    notifications,
    prefs,
    query: async (sql, params = []) => {
      const s = String(sql).replace(/\s+/g, " ").trim();
      if (s.includes("INSERT INTO notification_events")) {
        if (events.find((row) => row.dedupe_key === params[7])) {
          const err = new Error("dup");
          err.code = "23505";
          throw err;
        }
        events.push({
          id: params[0],
          organization_id: params[1],
          event_type: params[2],
          payload: params[6],
          dedupe_key: params[7]
        });
        return { rows: [] };
      }
      if (s.includes("FROM organization_members")) {
        return {
          rows: (members[params[0]] || []).map((row) => ({
            user_id: row.userId,
            org_role: row.orgRole,
            email: row.email
          }))
        };
      }
      if (s.includes("FROM notification_preferences") && s.includes("SELECT enabled")) {
        const key = `${params[0]}:${params[1]}:${params[2]}`;
        const enabled = prefs.get(key);
        return { rows: enabled === false ? [{ enabled: false }] : [] };
      }
      if (s.includes("INSERT INTO notifications")) {
        if (
          notifications.find((row) => row.event_id === params[3] && row.user_id === params[2])
        ) {
          return { rows: [] };
        }
        if (Number(params[1]) !== Number(params.__org)) {
          /* keep tenant from insert params */
        }
        notifications.push({
          id: params[0],
          organization_id: params[1],
          user_id: params[2],
          event_id: params[3],
          event_type: params[4],
          title: params[6],
          body: params[7],
          link_target: params[8]
        });
        return { rows: [{ id: params[0] }] };
      }
      if (s.includes("FROM notifications WHERE user_id")) {
        const rows = notifications.filter(
          (row) => row.user_id === params[0] && row.organization_id === params[1]
        );
        return { rows };
      }
      if (s.includes("UPDATE notifications")) {
        const row = notifications.find(
          (item) =>
            item.id === params[0] && item.user_id === params[1] && item.organization_id === params[2]
        );
        return { rows: row ? [{ id: row.id }] : [] };
      }
      if (s.includes("INSERT INTO activity_logs")) {
        return { rows: [] };
      }
      if (s.includes("INSERT INTO notification_preferences")) {
        prefs.set(`${params[0]}:${params[1]}:${params[2]}`, params[3]);
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
}

describe("phase 7 web project notifications", () => {
  it("copy never exposes raw review enums", () => {
    const copy = buildWebProjectNotification(WEB_PROJECT_NOTIFICATION_EVENTS.CORRECTION_REQUESTED, {
      organizationId: ORG_A,
      project: { id: 1, title: "Acme site", organizationId: ORG_A },
      reviewId: 9,
      correctionMessage: "Sube un PDF más nítido.",
      target: { targetType: "DOCUMENT", targetId: "doc-1" }
    });
    assert.equal(copy.title, "Necesita corrección");
    assert.match(copy.body, /PDF más nítido/);
    assert.equal(copy.linkTarget, "/dashboard/proyectos/1#wp-doc-doc-1");
    assert.equal(usesClientFacingCopy(copy.title), true);
    assert.equal(usesClientFacingCopy(copy.body), true);
  });

  it("1 correction requested notifies after the review commits", async () => {
    const { notifications, svc } = serviceWithNotify();
    const project = await seedProject(svc);
    await svc.addReview(ORG_A, project.id, 99, {
      verdict: "CORRECTION_REQUESTED",
      targetType: "FORM_FIELD",
      targetKey: "site_kind",
      schemaVersion: "web-project-intake.v1",
      correctionMessage: "Indica si es landing o corporativa."
    });
    assert.equal(notifications.emitted.length, 1);
    assert.equal(notifications.emitted[0].kind, WEB_PROJECT_NOTIFICATION_EVENTS.CORRECTION_REQUESTED);
    assert.equal(notifications.emitted[0].actorUserId, 99);
  });

  it("2 approval and 3 rejection emit distinct events", async () => {
    const { notifications, svc } = serviceWithNotify();
    const project = await seedProject(svc);
    await svc.addReview(ORG_A, project.id, 99, {
      verdict: "APPROVED",
      targetType: "FORM_FIELD",
      targetKey: "site_kind",
      schemaVersion: "web-project-intake.v1"
    });
    await svc.addReview(ORG_A, project.id, 99, {
      verdict: "REJECTED",
      targetType: "FORM_FIELD",
      targetKey: "cms",
      schemaVersion: "web-project-intake.v1",
      summary: "No encaja"
    });
    assert.deepEqual(
      notifications.emitted.map((row) => row.kind),
      [
        WEB_PROJECT_NOTIFICATION_EVENTS.REVIEW_APPROVED,
        WEB_PROJECT_NOTIFICATION_EVENTS.REVIEW_REJECTED
      ]
    );
  });

  it("4 transition notifies with the destination phase", async () => {
    const { notifications, svc } = serviceWithNotify();
    const project = await seedProject(svc);
    await svc.transition(ORG_A, project.id, 99, "REVIEW");
    assert.equal(notifications.emitted.at(-1).kind, WEB_PROJECT_NOTIFICATION_EVENTS.TRANSITIONED);
    assert.equal(notifications.emitted.at(-1).toStatus, "REVIEW");
  });

  it("5 comment notifies other members, not the actor payload leak", async () => {
    const { notifications, svc } = serviceWithNotify();
    const project = await seedProject(svc);
    await svc.addComment(ORG_A, project.id, 99, "Revisamos la home esta semana.");
    assert.equal(notifications.emitted.at(-1).kind, WEB_PROJECT_NOTIFICATION_EVENTS.COMMENT_CREATED);
    assert.equal(notifications.emitted.at(-1).actorUserId, 99);
    assert.equal("body" in notifications.emitted.at(-1), false);
  });

  it("6 notification failure does not roll back the review", async () => {
    const db = createMemoryStore();
    const objectStore = createMemoryObjectStore();
    const notifications = {
      async emitWebProject() {
        throw new Error("notify down");
      }
    };
    const svc = createWebProjectService(db, { objectStore, notifications });
    const project = await seedProject(svc);
    const after = await svc.addReview(ORG_A, project.id, 99, {
      verdict: "CORRECTION_REQUESTED",
      targetType: "FORM_FIELD",
      targetKey: "site_kind",
      schemaVersion: "web-project-intake.v1",
      correctionMessage: "Añade más detalle."
    });
    assert.equal(after.reviews.length, 1);
    assert.equal(after.reviewSummary.openCorrections, 1);
  });

  it("7 client cannot create a review notification via client API", async () => {
    const { svc } = serviceWithNotify();
    const project = await seedProject(svc);
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: 1, role: "cliente" };
      req.tenant = { id: ORG_A, orgRole: "org_owner", slug: "a", name: "A", status: "active" };
      next();
    });
    app.use("/api/client", createClientWebProjectsRouter(null, { service: svc }));
    const res = await httpCall(app, "POST", `/api/client/web-projects/${project.id}/reviews`, {
      verdict: "APPROVED"
    });
    assert.equal(res.status, 404);
  });

  it("8-10 in-app fanout stays tenant-scoped and excludes the actor", async () => {
    const pool = createNotifyPool({
      members: {
        [ORG_A]: [
          { userId: 1, orgRole: "org_owner", email: "a@example.com" },
          { userId: 2, orgRole: "org_member", email: "a2@example.com" }
        ],
        [ORG_B]: [{ userId: 3, orgRole: "org_owner", email: "b@example.com" }]
      }
    });
    const notify = createNotificationService(pool);
    const result = await notify.emitWebProject({
      organizationId: ORG_A,
      kind: WEB_PROJECT_NOTIFICATION_EVENTS.CORRECTION_REQUESTED,
      actorUserId: 1,
      project: { id: 7, title: "Acme site", organizationId: ORG_A },
      reviewId: 44,
      correctionMessage: "Sustituye el logotipo.",
      target: { targetType: "FORM_FIELD", targetKey: "site_kind" }
    });
    assert.equal(result.created, 1);
    assert.equal(pool.notifications.length, 1);
    assert.equal(pool.notifications[0].user_id, 2);
    assert.equal(pool.notifications[0].organization_id, ORG_A);
    assert.match(pool.notifications[0].title, /Necesita corrección/);
    assert.doesNotMatch(pool.notifications[0].body, /CORRECTION_REQUIRED/);
    const listedB = await notify.listForUser(3, ORG_B);
    assert.equal(listedB.length, 0);
    const listedA = await notify.listForUser(2, ORG_A);
    assert.equal(listedA.length, 1);
    const stolen = await notify.markRead(pool.notifications[0].id, 3, ORG_B);
    assert.equal(stolen, false);
  });

  it("11 preference opt-out suppresses the event", async () => {
    const pool = createNotifyPool({
      members: {
        [ORG_A]: [{ userId: 1, orgRole: "org_owner", email: "a@example.com" }]
      }
    });
    pool.prefs.set(
      `${ORG_A}:1:${WEB_PROJECT_NOTIFICATION_EVENTS.CORRECTION_REQUESTED}`,
      false
    );
    const notify = createNotificationService(pool);
    const result = await notify.emitWebProject({
      organizationId: ORG_A,
      kind: WEB_PROJECT_NOTIFICATION_EVENTS.CORRECTION_REQUESTED,
      project: { id: 1, title: "Acme site", organizationId: ORG_A },
      reviewId: 1,
      correctionMessage: "Corrige el campo.",
      target: { targetType: "FORM_FIELD", targetKey: "site_kind" }
    });
    assert.equal(result.created, 0);
  });

  it("12 REPORT_READY still dedupes", async () => {
    const pool = createNotifyPool({
      members: {
        1: [{ userId: 10, orgRole: "org_owner", email: "a@example.com" }]
      }
    });
    const notify = createNotificationService(pool);
    const r1 = await notify.emitReportReady({
      organizationId: 1,
      reportId: "r1",
      reportRunId: "run-1",
      requestedBy: 10
    });
    const r2 = await notify.emitReportReady({
      organizationId: 1,
      reportId: "r1",
      reportRunId: "run-1",
      requestedBy: 10
    });
    assert.equal(r1.skipped, false);
    assert.equal(r2.skipped, true);
  });

  it("13 payload does not store the full correction essay as JSON blob keys of secrets", async () => {
    const copy = buildWebProjectNotification(WEB_PROJECT_NOTIFICATION_EVENTS.CORRECTION_REQUESTED, {
      organizationId: ORG_A,
      project: { id: 1, title: "Acme site", organizationId: ORG_A },
      reviewId: 2,
      correctionMessage: "password=SuperSecret99 and token=abc",
      target: { targetType: "FORM_FIELD", targetKey: "notes" }
    });
    assert.equal("password" in copy.payload, false);
    assert.equal("token" in copy.payload, false);
    assert.equal(copy.payload.targetKey, "notes");
  });

  it("14 NOC review still returns 201 when notifier is attached via router", async () => {
    const { svc, notifications } = serviceWithNotify();
    const project = await seedProject(svc);
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: 99, role: "admin" };
      next();
    });
    app.use("/api/noc", requireNocAccess, createNocWebProjectsRouter(null, { service: svc }));
    const res = await httpCall(
      app,
      "POST",
      `/api/noc/web-projects/${project.id}/reviews?organization_id=${ORG_A}`,
      {
        verdict: "CORRECTION_REQUESTED",
        targetType: "FORM_FIELD",
        targetKey: "site_kind",
        schemaVersion: "web-project-intake.v1",
        correctionMessage: "Aclara el tipo de web."
      }
    );
    assert.equal(res.status, 201);
    assert.equal(notifications.emitted.length, 1);
  });

  it("15 preferences API accepts web project event types", async () => {
    const pool = createNotifyPool({
      members: {
        [ORG_A]: [{ userId: 1, orgRole: "org_owner", email: "a@example.com" }]
      }
    });
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: 1, role: "cliente" };
      req.tenant = { id: ORG_A, orgRole: "org_owner", slug: "a", name: "A", status: "active" };
      next();
    });
    app.use("/api/client/notifications", createClientNotificationsRouter(pool));
    const res = await httpCall(app, "PATCH", "/api/client/notifications/preferences", {
      eventType: WEB_PROJECT_NOTIFICATION_EVENTS.CORRECTION_REQUESTED,
      enabled: false
    });
    assert.equal(res.status, 200);
    const denied = await httpCall(app, "PATCH", "/api/client/notifications/preferences", {
      eventType: "EMAIL_BLAST",
      enabled: true
    });
    assert.equal(denied.status, 400);
  });
});
