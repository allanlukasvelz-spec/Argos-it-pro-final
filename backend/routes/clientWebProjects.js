const express = require("express");
const requireOrgRole = require("../middleware/requireOrgRole");
const { createSqlStore } = require("../lib/webProjects/sqlStore");
const { createWebProjectService } = require("../lib/webProjects/service");
const { WebProjectError } = require("../lib/webProjects/errors");
const { WRITE_ROLES, CONTRIBUTE_ROLES, READ_ROLES } = require("../lib/webProjects/constants");
const { pickClientPatch, hasOwn } = require("../lib/webProjects/httpContract");
const { readMultipartDocument, clientStorageOverrides } = require("../lib/webProjects/multipart");
const { contentDisposition } = require("../lib/webProjects/filename");
const { createNotificationService } = require("../lib/notifications/notificationService");

function sendPrivateDocument(res, document, buffer) {
  res.setHeader("Content-Type", document.mimeType);
  res.setHeader("Content-Length", String(buffer.length));
  res.setHeader("Content-Disposition", contentDisposition(document.originalFilename));
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(200).send(buffer);
}

function sendError(res, err) {
  if (err instanceof WebProjectError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  console.error("[CLIENT WEB PROJECTS]", err.message);
  return res.status(500).json({ error: "Error en proyectos web" });
}

function createClientWebProjectsRouter(pool, options = {}) {
  const notifications =
    options.notifications || (pool ? createNotificationService(pool) : null);
  const service =
    options.service ||
    createWebProjectService(createSqlStore(pool), { notifications });
  const router = express.Router();

  router.get("/web-projects", requireOrgRole(READ_ROLES), async (req, res) => {
    try {
      const items = await service.listProjects(req.tenant.id);
      res.json({ items, formDefinition: service.formDefinition });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects", requireOrgRole(WRITE_ROLES), async (req, res) => {
    try {
      const project = await service.createProject({
        organizationId: req.tenant.id,
        actorUserId: req.user.id,
        title: req.body?.title,
        projectType: req.body?.projectType,
        websiteHostname: req.body?.websiteHostname,
        websiteAssetId: req.body?.websiteAssetId,
        source: "client_solicitud"
      });
      res.status(201).json({ project, policy: "INTAKE_SOLICITUD_ONLY" });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-projects/:id", requireOrgRole(READ_ROLES), async (req, res) => {
    try {
      const project = await service.getProject(req.tenant.id, req.params.id);
      res.json({ project });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.patch("/web-projects/:id", requireOrgRole(WRITE_ROLES), async (req, res) => {
    try {
      const project = await service.updateProject(
        req.tenant.id,
        req.params.id,
        req.user.id,
        pickClientPatch(req.body)
      );
      res.json({ project });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-projects/:id/form", requireOrgRole(READ_ROLES), async (req, res) => {
    try {
      const project = await service.getProject(req.tenant.id, req.params.id);
      res.json({
        form: project.form,
        formDefinition: service.getFormDefinition(project.form.schemaVersion),
        progress: project.progress,
        sectionProgress: project.sectionProgress
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/form", requireOrgRole(CONTRIBUTE_ROLES), async (req, res) => {
    try {
      const project = await service.upsertForm(
        req.tenant.id,
        req.params.id,
        req.user.id,
        req.body?.responses
      );
      res.json({ project });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/submit-review", requireOrgRole(CONTRIBUTE_ROLES), async (req, res) => {
    try {
      const project = await service.submitForReview(req.tenant.id, req.params.id, req.user.id);
      res.json({ project });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-projects/:id/items", requireOrgRole(READ_ROLES), async (req, res) => {
    try {
      const project = await service.getProject(req.tenant.id, req.params.id);
      res.json({ items: project.items });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/items", requireOrgRole(CONTRIBUTE_ROLES), async (req, res) => {
    try {
      const item = await service.addItem(req.tenant.id, req.params.id, req.user.id, {
        itemType: req.body?.itemType,
        title: req.body?.title,
        status: req.body?.status,
        sortOrder: req.body?.sortOrder,
        payload: req.body?.payload
      });
      res.status(201).json({ item });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.patch("/web-projects/:id/items/:itemId", requireOrgRole(CONTRIBUTE_ROLES), async (req, res) => {
    try {
      const itemPatch = {};
      if (hasOwn(req.body, "title")) itemPatch.title = req.body.title;
      if (hasOwn(req.body, "status")) itemPatch.status = req.body.status;
      if (hasOwn(req.body, "sortOrder")) itemPatch.sortOrder = req.body.sortOrder;
      if (hasOwn(req.body, "payload")) itemPatch.payload = req.body.payload;
      const item = await service.updateItem(
        req.tenant.id,
        req.params.id,
        req.user.id,
        req.params.itemId,
        itemPatch
      );
      res.json({ item });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/items/:itemId/archive", requireOrgRole(CONTRIBUTE_ROLES), async (req, res) => {
    try {
      const item = await service.archiveItem(
        req.tenant.id,
        req.params.id,
        req.user.id,
        req.params.itemId
      );
      res.json({ item });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-projects/:id/documents", requireOrgRole(READ_ROLES), async (req, res) => {
    try {
      const project = await service.getProject(req.tenant.id, req.params.id);
      res.json({ documents: project.documents });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/documents", requireOrgRole(CONTRIBUTE_ROLES), async (req, res) => {
    try {
      const part = await readMultipartDocument(req);
      const document = await service.uploadDocument(req.tenant.id, req.params.id, req.user.id, {
        buffer: part.buffer,
        originalFilename: part.filename,
        mimeType: part.declaredMime || part.fields.mimeType,
        requirementKey: part.fields.requirementKey || null,
        replacesDocumentId: part.fields.replacesDocumentId || part.fields.replaces_document_id || null,
        ...clientStorageOverrides(part.fields)
      });
      res.status(201).json({ document });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get(
    "/web-projects/:id/documents/:documentId/content",
    requireOrgRole(READ_ROLES),
    async (req, res) => {
      try {
        const { document, buffer } = await service.getDocumentContent(
          req.tenant.id,
          req.params.id,
          req.params.documentId
        );
        return sendPrivateDocument(res, document, buffer);
      } catch (err) {
        sendError(res, err);
      }
    }
  );

  router.post("/web-projects/:id/comments", requireOrgRole(CONTRIBUTE_ROLES), async (req, res) => {
    try {
      const comment = await service.addComment(req.tenant.id, req.params.id, req.user.id, req.body?.body);
      res.status(201).json({ comment });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-projects/:id/reviews", requireOrgRole(READ_ROLES), async (req, res) => {
    try {
      const project = await service.getProject(req.tenant.id, req.params.id);
      res.json({
        reviews: project.reviews,
        reviewStates: project.reviewStates,
        reviewSummary: project.reviewSummary
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-projects/:id/mockup", requireOrgRole(READ_ROLES), async (req, res) => {
    try {
      const payload = await service.getMockup(req.tenant.id, req.params.id, { clientSafe: true });
      res.json(payload);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/mockup/approve", requireOrgRole(WRITE_ROLES), async (req, res) => {
    try {
      const payload = await service.clientApproveMockup(req.tenant.id, req.params.id, req.user.id);
      res.json(payload);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/mockup/request-changes", requireOrgRole(WRITE_ROLES), async (req, res) => {
    try {
      const payload = await service.clientRequestMockupChanges(
        req.tenant.id,
        req.params.id,
        req.user.id,
        req.body || {}
      );
      res.json(payload);
    } catch (err) {
      sendError(res, err);
    }
  });

  return router;
}

module.exports = createClientWebProjectsRouter;
