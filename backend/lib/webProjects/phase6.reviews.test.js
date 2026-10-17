const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const crypto = require("crypto");
const { createMemoryStore } = require("./memoryStore");
const { createMemoryObjectStore } = require("./memoryObjectStore");
const { createWebProjectService } = require("./service");
const { AUDIT_ACTIONS, FORM_SCHEMA_VERSION } = require("./constants");
const createNocWebProjectsRouter = require("../../routes/nocWebProjects");
const createClientWebProjectsRouter = require("../../routes/clientWebProjects");
const requireNocAccess = require("../../middleware/requireNocAccess");

const ORG_A = 10;
const ORG_B = 20;
const PDF = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.from("1 0 obj<<>>endobj\n%%EOF\n")]);

function serviceWithStore() {
  const db = createMemoryStore();
  const objectStore = createMemoryObjectStore();
  return { db, objectStore, svc: createWebProjectService(db, { objectStore }) };
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
  const item = await svc.addItem(organizationId, project.id, 1, {
    itemType: "page",
    title: "Home",
    payload: { note: "draft home" }
  });
  const document = await svc.uploadDocument(organizationId, project.id, 1, {
    buffer: PDF,
    originalFilename: "brief.pdf",
    mimeType: "application/pdf"
  });
  return { project: await svc.getProject(organizationId, project.id), item, document };
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

function nocApp(service, user = { id: 99, role: "admin" }) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = user;
    next();
  });
  app.use("/api/noc", requireNocAccess, createNocWebProjectsRouter(null, { service }));
  return app;
}

function clientApp(service, { orgId = ORG_A, orgRole = "org_owner", userId = 1 } = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { id: userId, role: "cliente" };
    req.tenant = { id: orgId, orgRole, slug: "a", name: "A", status: "active" };
    next();
  });
  app.use("/api/client", createClientWebProjectsRouter(null, { service }));
  return app;
}

describe("phase 6 granular reviews", () => {
  it("1-9 form field lifecycle keeps history and returns pending after correction", async () => {
    const { db, svc } = serviceWithStore();
    const { project } = await seedProject(svc);
    const approved = await svc.addReview(ORG_A, project.id, 99, {
      verdict: "APPROVED",
      targetType: "FORM_FIELD",
      targetKey: "site_kind"
    });
    assert.equal(approved.reviews.at(-1).verdict, "APPROVED");
    assert.equal(approved.reviews.at(-1).targetType, "FORM_FIELD");
    const fieldState = approved.reviewStates.find((row) => row.targetKey === "site_kind");
    assert.equal(fieldState.status, "APPROVED");

    await assert.rejects(
      () =>
        svc.addReview(ORG_A, project.id, 99, {
          verdict: "CORRECTION_REQUESTED",
          targetType: "FORM_FIELD",
          targetKey: "cms"
        }),
      (err) => err.code === "CORRECTION_MESSAGE_REQUIRED"
    );

    const asked = await svc.addReview(ORG_A, project.id, 99, {
      verdict: "CORRECTION_REQUESTED",
      targetType: "FORM_FIELD",
      targetKey: "cms",
      correctionMessage: "Indica el CMS real, no una estimación."
    });
    const cmsState = asked.reviewStates.find((row) => row.targetKey === "cms");
    assert.equal(cmsState.status, "CORRECTION_REQUIRED");
    assert.match(cmsState.correctionMessage, /CMS real/);
    assert.equal(asked.reviewSummary.openCorrections >= 1, true);

    const clientView = await svc.getProject(ORG_A, project.id);
    assert.equal(
      clientView.reviewStates.find((row) => row.targetKey === "cms").status,
      "CORRECTION_REQUIRED"
    );

    const collectionBefore = clientView.progress.percentage;
    const afterFix = await svc.upsertForm(ORG_A, project.id, 1, [{ fieldKey: "cms", value: "other" }]);
    const pending = afterFix.reviewStates.find((row) => row.targetKey === "cms");
    assert.equal(pending.status, "PENDING");
    assert.equal(afterFix.reviews.some((row) => row.verdict === "CORRECTION_REQUESTED"), true);
    assert.equal(afterFix.progress.percentage, collectionBefore);
    assert.ok(db.state.activity.some((row) => row.action_type === AUDIT_ACTIONS.CORRECTION_RESUBMITTED));

    const reapproved = await svc.addReview(ORG_A, project.id, 99, {
      verdict: "APPROVED",
      targetType: "FORM_FIELD",
      targetKey: "cms"
    });
    assert.equal(reapproved.reviewStates.find((row) => row.targetKey === "cms").status, "APPROVED");
    assert.equal(reapproved.reviews.filter((row) => row.targetKey === "cms").length, 2);
  });

  it("5 client cannot create review via HTTP", async () => {
    const { svc } = serviceWithStore();
    const { project } = await seedProject(svc);
    const app = clientApp(svc);
    const res = await httpCall(app, "POST", `/api/client/web-projects/${project.id}/reviews`, {
      verdict: "APPROVED",
      targetType: "FORM_FIELD",
      targetKey: "site_kind"
    });
    assert.equal(res.status, 404);
  });

  it("10 item correction lifecycle", async () => {
    const { svc } = serviceWithStore();
    const { project, item } = await seedProject(svc);
    const asked = await svc.addReview(ORG_A, project.id, 99, {
      verdict: "CORRECTION_REQUESTED",
      targetType: "ITEM",
      targetId: item.id,
      correctionMessage: "Falta el objetivo de la página."
    });
    assert.equal(
      asked.reviewStates.find((row) => row.targetType === "ITEM" && String(row.targetId) === String(item.id))
        .status,
      "CORRECTION_REQUIRED"
    );
    const updated = await svc.updateItem(ORG_A, project.id, 1, item.id, {
      title: "Home revisada",
      payload: { note: "objetivo claro" }
    });
    assert.equal(updated.title, "Home revisada");
    const after = await svc.getProject(ORG_A, project.id);
    assert.equal(
      after.reviewStates.find((row) => row.targetType === "ITEM" && String(row.targetId) === String(item.id))
        .status,
      "PENDING"
    );
    assert.equal(after.reviews.some((row) => row.targetType === "ITEM"), true);
  });

  it("11-14 document correction creates a new object and keeps the previous", async () => {
    const { db, objectStore, svc } = serviceWithStore();
    const { project, document } = await seedProject(svc);
    await svc.addReview(ORG_A, project.id, 99, {
      verdict: "CORRECTION_REQUESTED",
      targetType: "DOCUMENT",
      targetId: document.id,
      correctionMessage: "Necesitamos un PDF más legible."
    });
    const replacement = await svc.uploadDocument(ORG_A, project.id, 1, {
      buffer: Buffer.concat([PDF, Buffer.from("v2")]),
      originalFilename: "brief-v2.pdf",
      mimeType: "application/pdf",
      replacesDocumentId: document.id
    });
    assert.notEqual(replacement.id, document.id);
    assert.notEqual(replacement.objectKey, document.objectKey);
    assert.equal(replacement.replacesDocumentId, document.id);
    assert.notEqual(replacement.sha256, document.sha256);
    assert.equal(objectStore.objects.size, 2);
    const latest = await svc.getProject(ORG_A, project.id);
    assert.equal(latest.documents.some((row) => row.id === document.id), true);
    assert.equal(latest.documents.some((row) => row.id === replacement.id), true);
    assert.equal(
      latest.reviewStates.find((row) => row.targetType === "DOCUMENT" && row.targetId === replacement.id)
        .status,
      "PENDING"
    );
    assert.equal(
      latest.reviews.find((row) => row.targetType === "DOCUMENT").targetId,
      document.id
    );
    assert.ok(db.state.activity.some((row) => row.action_type === AUDIT_ACTIONS.DOCUMENT_REPLACED));
  });

  it("15-16 target from another project or org is rejected", async () => {
    const { svc } = serviceWithStore();
    const a = await seedProject(svc, ORG_A);
    const b = await seedProject(svc, ORG_B);
    await assert.rejects(
      () =>
        svc.addReview(ORG_A, a.project.id, 99, {
          verdict: "APPROVED",
          targetType: "DOCUMENT",
          targetId: b.document.id
        }),
      (err) => err.code === "REVIEW_TARGET_INVALID"
    );
    await assert.rejects(
      () => svc.getProject(ORG_B, a.project.id),
      (err) => err.status === 404
    );
    const noc = nocApp(svc);
    const wrong = await httpCall(
      noc,
      "POST",
      `/api/noc/web-projects/${a.project.id}/reviews?organization_id=${ORG_B}`,
      { verdict: "APPROVED", targetType: "FORM_FIELD", targetKey: "site_kind" }
    );
    assert.equal(wrong.status, 404);
  });

  it("17 archived mutation is 409 PROJECT_ARCHIVED", async () => {
    const { db, svc } = serviceWithStore();
    const { project } = await seedProject(svc);
    await db.updateProject(ORG_A, project.id, {
      workflow_status: "COMPLETED",
      completed_at: new Date().toISOString()
    });
    await svc.archiveProject(ORG_A, project.id, 99);
    await assert.rejects(
      () =>
        svc.addReview(ORG_A, project.id, 99, {
          verdict: "APPROVED",
          targetType: "FORM_FIELD",
          targetKey: "site_kind"
        }),
      (err) => err.code === "PROJECT_ARCHIVED" && err.status === 409
    );
  });

  it("18 completed mutation is rejected", async () => {
    const { svc } = serviceWithStore();
    const { project } = await seedProject(svc);
    const { seedArchitectureMinimum } = require("./phase12.fixtures");
    await seedArchitectureMinimum(svc, ORG_A, project.id, 1);
    for (const next of ["REVIEW", "ARCHITECTURE", "MOCKUP", "DEVELOPMENT", "VALIDATION", "PUBLICATION", "COMPLETED"]) {
      if (next === "DEVELOPMENT") {
        await svc.transition(ORG_A, project.id, 99, next, { approvedMockupDevelopment: true });
      } else if (next === "VALIDATION") {
        await svc.transition(ORG_A, project.id, 99, next, { validationReady: true });
      } else if (next === "PUBLICATION") {
        await svc.transition(ORG_A, project.id, 99, next, { publicationReady: true });
      } else if (next === "COMPLETED") {
        await svc.transition(ORG_A, project.id, 99, next, { completionReady: true });
      } else {
        await svc.transition(ORG_A, project.id, 99, next);
      }
    }
    await assert.rejects(
      () =>
        svc.addReview(ORG_A, project.id, 99, {
          verdict: "APPROVED",
          targetType: "FORM_FIELD",
          targetKey: "site_kind"
        }),
      (err) => err.status === 409
    );
  });

  it("19-20 audit is emitted and audit failure rolls back the review", async () => {
    const { db, svc } = serviceWithStore();
    const { project } = await seedProject(svc);
    await svc.addReview(ORG_A, project.id, 99, {
      verdict: "APPROVED",
      targetType: "FORM_FIELD",
      targetKey: "site_kind"
    });
    assert.ok(db.state.activity.some((row) => row.action_type === AUDIT_ACTIONS.REVIEW_APPROVED));

    const orig = db.insertActivityLog.bind(db);
    db.insertActivityLog = async (row) => {
      if (row.action_type === AUDIT_ACTIONS.REVIEW_CREATED) {
        throw new Error("audit fail");
      }
      return orig(row);
    };
    const before = db.state.reviews.length;
    await assert.rejects(
      () =>
        svc.addReview(ORG_A, project.id, 99, {
          verdict: "APPROVED",
          targetType: "FORM_FIELD",
          targetKey: "cms"
        })
    );
    assert.equal(db.state.reviews.length, before);
  });

  it("21-24 collection progress stays separate and review summary counts open corrections", async () => {
    const { svc } = serviceWithStore();
    const { project } = await seedProject(svc);
    const before = await svc.getProject(ORG_A, project.id);
    await svc.addReview(ORG_A, project.id, 99, {
      verdict: "CORRECTION_REQUESTED",
      targetType: "FORM_FIELD",
      targetKey: "notes",
      correctionMessage: "Añade el tono de voz."
    }).catch(() => null);
    await svc.upsertForm(ORG_A, project.id, 1, [{ fieldKey: "notes", value: "tono cercano" }]);
    const asked = await svc.addReview(ORG_A, project.id, 99, {
      verdict: "CORRECTION_REQUESTED",
      targetType: "FORM_FIELD",
      targetKey: "notes",
      correctionMessage: "Añade el tono de voz."
    });
    assert.equal(asked.progress.percentage, before.progress.percentage);
    assert.equal(asked.reviewSummary.correctionRequired >= 1, true);
    assert.equal(asked.reviewSummary.openCorrections >= 1, true);
    assert.ok(asked.reviewSummary.pending >= 0);
  });

  it("blocks REVIEW to ARCHITECTURE when corrections are open", async () => {
    const { svc } = serviceWithStore();
    const { project } = await seedProject(svc);
    const { seedArchitectureMinimum } = require("./phase12.fixtures");
    await seedArchitectureMinimum(svc, ORG_A, project.id, 1);
    await svc.transition(ORG_A, project.id, 99, "REVIEW");
    await svc.addReview(ORG_A, project.id, 99, {
      verdict: "CORRECTION_REQUESTED",
      targetType: "FORM_FIELD",
      targetKey: "cms",
      correctionMessage: "Revisa el CMS."
    });
    await assert.rejects(
      () => svc.transition(ORG_A, project.id, 99, "ARCHITECTURE"),
      (err) => err.code === "ARCHITECTURE_NOT_READY" && err.status === 409
    );
  });

  it("24 cross-tenant review id stays 404 on NOC", async () => {
    const { svc } = serviceWithStore();
    const a = await seedProject(svc, ORG_A);
    const noc = nocApp(svc);
    const res = await httpCall(
      noc,
      "GET",
      `/api/noc/web-projects/${a.project.id}?organization_id=${ORG_B}`
    );
    assert.equal(res.status, 404);
  });
});
