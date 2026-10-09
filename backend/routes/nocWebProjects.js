const express = require("express");
const { createSqlStore } = require("../lib/webProjects/sqlStore");
const { createWebProjectService } = require("../lib/webProjects/service");
const { WebProjectError } = require("../lib/webProjects/errors");
const { pickNocPatch } = require("../lib/webProjects/httpContract");
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
    const payload = { error: err.message, code: err.code };
    if (err.details && typeof err.details === "object") {
      Object.assign(payload, err.details);
    }
    return res.status(err.status).json(payload);
  }
  console.error("[NOC WEB PROJECTS]", err.message);
  return res.status(500).json({ error: "Error NOC en proyectos web" });
}

function requireOrganizationId(req, res) {
  const organizationId = Number(req.query.organization_id || req.body?.organizationId);
  if (!Number.isInteger(organizationId) || organizationId <= 0) {
    res.status(400).json({
      error: "organization_id requerido",
      code: "TENANT_REQUIRED"
    });
    return null;
  }
  return organizationId;
}

function createNocWebProjectsRouter(pool, options = {}) {
  const notifications =
    options.notifications || (pool ? createNotificationService(pool) : null);
  const service =
    options.service ||
    createWebProjectService(createSqlStore(pool), { notifications });
  const router = express.Router();

  router.get("/web-projects", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const items = await service.listProjects(organizationId, {
        includeArchived: req.query.include_archived === "1"
      });
      res.json({ items, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const project = await service.createProject({
        organizationId,
        actorUserId: req.user.id,
        title: req.body?.title,
        projectType: req.body?.projectType,
        websiteHostname: req.body?.websiteHostname,
        websiteAssetId: req.body?.websiteAssetId,
        source: "noc"
      });
      res.status(201).json({ project, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-projects/:id", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const project = await service.getProject(organizationId, req.params.id);
      res.json({
        project,
        organizationId,
        formDefinition: service.getFormDefinition
          ? service.getFormDefinition(project.form.schemaVersion)
          : service.formDefinition
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.patch("/web-projects/:id", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const project = await service.updateProject(
        organizationId,
        req.params.id,
        req.user.id,
        pickNocPatch(req.body)
      );
      res.json({ project, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/transition", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const project = await service.transition(
        organizationId,
        req.params.id,
        req.user.id,
        req.body?.toStatus,
        {
          acknowledgeOpenItems: Boolean(req.body?.acknowledgeOpenItems),
          reason: req.body?.reason
        }
      );
      res.json({ project, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/archive", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const project = await service.archiveProject(organizationId, req.params.id, req.user.id, {
        reason: req.body?.reason ?? req.body?.archiveReason ?? null
      });
      res.json({ project, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/reviews", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const project = await service.addReview(organizationId, req.params.id, req.user.id, {
        verdict: req.body?.verdict,
        summary: req.body?.summary,
        correctionMessage: req.body?.correctionMessage || req.body?.correction_message,
        targetType: req.body?.targetType || req.body?.target_type,
        targetId: req.body?.targetId || req.body?.target_id,
        targetKey: req.body?.targetKey || req.body?.target_key,
        schemaVersion: req.body?.schemaVersion || req.body?.schema_version
      });
      res.status(201).json({ project, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/comments", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const comment = await service.addComment(
        organizationId,
        req.params.id,
        req.user.id,
        req.body?.body
      );
      res.status(201).json({ comment, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-projects/:id/documents", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const project = await service.getProject(organizationId, req.params.id);
      res.json({ documents: project.documents, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/documents", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const part = await readMultipartDocument(req);
      const document = await service.uploadDocument(organizationId, req.params.id, req.user.id, {
        buffer: part.buffer,
        originalFilename: part.filename,
        mimeType: part.declaredMime || part.fields.mimeType,
        requirementKey: part.fields.requirementKey || null,
        replacesDocumentId: part.fields.replacesDocumentId || part.fields.replaces_document_id || null,
        ...clientStorageOverrides(part.fields)
      });
      res.status(201).json({ document, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-projects/:id/documents/:documentId/content", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const { document, buffer } = await service.getDocumentContent(
        organizationId,
        req.params.id,
        req.params.documentId
      );
      return sendPrivateDocument(res, document, buffer);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/credential-status", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const credentialStatus = await service.setCredentialStatus(
        organizationId,
        req.params.id,
        req.user.id,
        req.body?.status
      );
      res.json({ credentialStatus, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-projects/:id/brief", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.getBrief(organizationId, req.params.id);
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/brief/notes", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const note = await service.addBriefNote(organizationId, req.params.id, req.user.id, req.body || {});
      res.status(201).json({ note, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.patch("/web-projects/:id/brief/notes/:noteId", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const note = await service.updateBriefNote(
        organizationId,
        req.params.id,
        req.params.noteId,
        req.user.id,
        req.body || {}
      );
      res.json({ note, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/start-architecture", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const project = await service.startArchitecture(organizationId, req.params.id, req.user.id, {
        acknowledgeOpenItems: Boolean(req.body?.acknowledgeOpenItems),
        reason: req.body?.reason
      });
      res.json({ project, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-projects/:id/architecture", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.getArchitecture(organizationId, req.params.id, {
        architectureId: req.query.architecture_id || req.query.architectureId
      });
      res.json(payload);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/architecture/generate", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.generateArchitecture(organizationId, req.params.id, req.user.id);
      res.status(201).json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/architecture/revisions", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.createArchitectureRevision(organizationId, req.params.id, req.user.id);
      res.status(201).json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/architecture/pages", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const page = await service.createArchitecturePage(
        organizationId,
        req.params.id,
        req.user.id,
        req.body || {}
      );
      res.status(201).json({ page, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.patch("/web-projects/:id/architecture/pages/:pageId", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const page = await service.updateArchitecturePage(
        organizationId,
        req.params.id,
        req.params.pageId,
        req.user.id,
        req.body || {}
      );
      res.json({ page, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/architecture/pages/:pageId/archive", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const page = await service.archiveArchitecturePage(
        organizationId,
        req.params.id,
        req.params.pageId,
        req.user.id
      );
      res.json({ page, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/architecture/pages/:pageId/blocks", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const block = await service.createArchitectureBlock(
        organizationId,
        req.params.id,
        req.params.pageId,
        req.user.id,
        req.body || {}
      );
      res.status(201).json({ block, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.patch("/web-projects/:id/architecture/blocks/:blockId", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const block = await service.updateArchitectureBlock(
        organizationId,
        req.params.id,
        req.params.blockId,
        req.user.id,
        req.body || {}
      );
      res.json({ block, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/architecture/validate", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const validation = await service.validateArchitectureState(organizationId, req.params.id);
      res.json({ validation, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/architecture/approve", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.approveArchitecture(organizationId, req.params.id, req.user.id, {
        acknowledgeWarnings: Boolean(req.body?.acknowledgeWarnings)
      });
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/start-mockup", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const project = await service.startMockup(organizationId, req.params.id, req.user.id, req.body || {});
      res.json({ project, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-projects/:id/mockup", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.getMockup(organizationId, req.params.id, {
        mockupId: req.query.mockup_id || req.query.mockupId
      });
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/mockup/generate", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.generateMockup(organizationId, req.params.id, req.user.id);
      res.status(201).json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/mockup/revisions", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.createMockupRevision(
        organizationId,
        req.params.id,
        req.user.id,
        req.body || {}
      );
      res.status(201).json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.patch("/web-projects/:id/mockup", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const mockupId = req.body?.mockupId || req.body?.mockup_id || req.query.mockup_id;
      if (!mockupId) {
        return res.status(400).json({ error: "mockupId requerido", code: "VALIDATION_ERROR" });
      }
      const payload = await service.updateMockup(
        organizationId,
        req.params.id,
        mockupId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.patch("/web-projects/:id/mockup/pages/:pageId", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.updateMockupPage(
        organizationId,
        req.params.id,
        req.params.pageId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.patch("/web-projects/:id/mockup/sections/:sectionId", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.updateMockupSection(
        organizationId,
        req.params.id,
        req.params.sectionId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/mockup/validate", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const mockupId = req.body?.mockupId || req.body?.mockup_id;
      if (!mockupId) {
        return res.status(400).json({ error: "mockupId requerido", code: "VALIDATION_ERROR" });
      }
      const payload = await service.validateMockupState(organizationId, req.params.id, mockupId);
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/mockup/internal-review", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const mockupId = req.body?.mockupId || req.body?.mockup_id;
      if (!mockupId) {
        return res.status(400).json({ error: "mockupId requerido", code: "VALIDATION_ERROR" });
      }
      const payload = await service.startMockupInternalReview(
        organizationId,
        req.params.id,
        mockupId,
        req.user.id
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/mockup/send-client", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const mockupId = req.body?.mockupId || req.body?.mockup_id;
      if (!mockupId) {
        return res.status(400).json({ error: "mockupId requerido", code: "VALIDATION_ERROR" });
      }
      const payload = await service.sendMockupToClient(
        organizationId,
        req.params.id,
        mockupId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/start-development", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const project = await service.startDevelopment(organizationId, req.params.id, req.user.id);
      res.json({ project, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-projects/:id/development", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.getDevelopment(organizationId, req.params.id);
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/development/prepare", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.prepareDevelopmentPlan(organizationId, req.params.id, req.user.id);
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.patch("/web-projects/:id/development/items/:itemId", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.updateDevelopmentItem(
        organizationId,
        req.params.id,
        req.params.itemId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/development/items/:itemId/block", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.blockDevelopmentItem(
        organizationId,
        req.params.id,
        req.params.itemId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/development/items/:itemId/unblock", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.unblockDevelopmentItem(
        organizationId,
        req.params.id,
        req.params.itemId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/development/items/:itemId/dependencies", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.addDevelopmentDependency(
        organizationId,
        req.params.id,
        req.params.itemId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/start-validation", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.startValidation(
        organizationId,
        req.params.id,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-projects/:id/validation", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.getValidation(organizationId, req.params.id);
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/validation/prepare", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.prepareValidationPlan(organizationId, req.params.id, req.user.id);
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.patch("/web-projects/:id/validation/checks/:checkId", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.updateValidationCheck(
        organizationId,
        req.params.id,
        req.params.checkId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/validation/checks/:checkId/evidence", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.attachValidationEvidence(
        organizationId,
        req.params.id,
        req.params.checkId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/validation/checks/:checkId/defects", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.createValidationDefect(
        organizationId,
        req.params.id,
        req.params.checkId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.patch("/web-projects/:id/validation/defects/:defectId", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.updateValidationDefect(
        organizationId,
        req.params.id,
        req.params.defectId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/validation/defects/:defectId/retest", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.retestValidationDefect(
        organizationId,
        req.params.id,
        req.params.defectId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.patch("/web-projects/:id/validation/samples", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.setRepresentativeSample(
        organizationId,
        req.params.id,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/start-publication", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.startPublication(
        organizationId,
        req.params.id,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get("/web-projects/:id/publication", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.getPublication(organizationId, req.params.id);
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/publication/prepare", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.preparePublicationPlan(
        organizationId,
        req.params.id,
        req.user.id
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.patch("/web-projects/:id/publication/steps/:stepId", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.updatePublicationStep(
        organizationId,
        req.params.id,
        req.params.stepId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/publication/steps/:stepId/block", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.blockPublicationStep(
        organizationId,
        req.params.id,
        req.params.stepId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/publication/steps/:stepId/unblock", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.unblockPublicationStep(
        organizationId,
        req.params.id,
        req.params.stepId,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post("/web-projects/:id/complete", async (req, res) => {
    try {
      const organizationId = requireOrganizationId(req, res);
      if (!organizationId) return;
      const payload = await service.completeProject(
        organizationId,
        req.params.id,
        req.user.id,
        req.body || {}
      );
      res.json({ ...payload, organizationId });
    } catch (err) {
      sendError(res, err);
    }
  });

  return router;
}

module.exports = createNocWebProjectsRouter;
