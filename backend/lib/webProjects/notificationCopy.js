/**
 * Client-facing in-app copy for Web Project events.
 * Never expose raw enums in title/body.
 */

const WEB_PROJECT_NOTIFICATION_EVENTS = Object.freeze({
  CORRECTION_REQUESTED: "WEB_PROJECT_CORRECTION_REQUESTED",
  REVIEW_APPROVED: "WEB_PROJECT_REVIEW_APPROVED",
  REVIEW_REJECTED: "WEB_PROJECT_REVIEW_REJECTED",
  TRANSITIONED: "WEB_PROJECT_TRANSITIONED",
  COMMENT_CREATED: "WEB_PROJECT_COMMENT_CREATED",
  SELF_SERVICE_STARTED: "WEB_PROJECT_SELF_SERVICE_STARTED",
  MOCKUP_STARTED: "WEB_PROJECT_MOCKUP_STARTED",
  MOCKUP_SENT_TO_CLIENT: "WEB_PROJECT_MOCKUP_SENT_TO_CLIENT",
  MOCKUP_CHANGES_REQUESTED: "WEB_PROJECT_MOCKUP_CHANGES_REQUESTED",
  MOCKUP_APPROVED: "WEB_PROJECT_MOCKUP_APPROVED",
  DEVELOPMENT_STARTED: "WEB_PROJECT_DEVELOPMENT_STARTED",
  VALIDATION_STARTED: "WEB_PROJECT_VALIDATION_STARTED",
  PUBLICATION_STARTED: "WEB_PROJECT_PUBLICATION_STARTED",
  PROJECT_COMPLETED: "WEB_PROJECT_PROJECT_COMPLETED"
});

const WORKFLOW_LABELS = Object.freeze({
  INTAKE: "Recopilación",
  REVIEW: "Revisión ARGOS",
  ARCHITECTURE: "Arquitectura",
  MOCKUP: "Maqueta",
  DEVELOPMENT: "Desarrollo",
  VALIDATION: "Validación",
  PUBLICATION: "Publicación",
  COMPLETED: "Finalizado"
});

const TARGET_LABELS = Object.freeze({
  FORM_FIELD: "una respuesta del formulario",
  ITEM: "un contenido",
  DOCUMENT: "un documento",
  PROJECT: "el expediente"
});

function workflowLabel(status) {
  return WORKFLOW_LABELS[status] || "una nueva fase";
}

function projectTitle(project) {
  return String(project?.title || "tu proyecto web").slice(0, 180);
}

function projectLink(projectId, target) {
  const base = `/dashboard/proyectos/${Number(projectId)}`;
  if (!target) return base;
  if (target.targetType === "FORM_FIELD" && target.targetKey) {
    return `${base}#wp-field-${target.targetKey}`;
  }
  if (target.targetType === "ITEM" && target.targetId) {
    return `${base}#wp-item-${target.targetId}`;
  }
  if (target.targetType === "DOCUMENT" && target.targetId) {
    return `${base}#wp-doc-${target.targetId}`;
  }
  return base;
}

function clipReason(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > 220 ? `${clean.slice(0, 217)}…` : clean;
}

function buildWebProjectNotification(kind, input) {
  const project = input.project || {};
  const projectId = project.id || input.projectId;
  const titleName = projectTitle(project);
  const target = input.target || {};
  const targetLabel = TARGET_LABELS[target.targetType] || "un elemento";

  if (kind === WEB_PROJECT_NOTIFICATION_EVENTS.CORRECTION_REQUESTED) {
    const reason = clipReason(input.correctionMessage);
    return {
      eventType: kind,
      severity: "WARNING",
      title: "Necesita corrección",
      body: reason
        ? `ARGOS necesita que corrijas ${targetLabel} de «${titleName}». ${reason}`
        : `ARGOS necesita que corrijas ${targetLabel} de «${titleName}».`,
      linkTarget: projectLink(projectId, target),
      scopeType: "web_project",
      scopeId: String(projectId),
      payload: {
        projectId: Number(projectId),
        reviewId: input.reviewId || null,
        targetType: target.targetType || null,
        targetKey: target.targetKey || null
      },
      dedupeKey: `WP_CORRECTION:${project.organizationId || input.organizationId}:${projectId}:${input.reviewId}`
    };
  }

  if (kind === WEB_PROJECT_NOTIFICATION_EVENTS.REVIEW_APPROVED) {
    return {
      eventType: kind,
      severity: "INFO",
      title: "Aprobado por ARGOS",
      body: `ARGOS ha aprobado ${targetLabel} de «${titleName}».`,
      linkTarget: projectLink(projectId, target),
      scopeType: "web_project",
      scopeId: String(projectId),
      payload: {
        projectId: Number(projectId),
        reviewId: input.reviewId || null,
        targetType: target.targetType || null
      },
      dedupeKey: `WP_APPROVED:${project.organizationId || input.organizationId}:${projectId}:${input.reviewId}`
    };
  }

  if (kind === WEB_PROJECT_NOTIFICATION_EVENTS.REVIEW_REJECTED) {
    return {
      eventType: kind,
      severity: "WARNING",
      title: "No aceptado",
      body: `ARGOS no ha aceptado ${targetLabel} de «${titleName}».`,
      linkTarget: projectLink(projectId, target),
      scopeType: "web_project",
      scopeId: String(projectId),
      payload: {
        projectId: Number(projectId),
        reviewId: input.reviewId || null,
        targetType: target.targetType || null
      },
      dedupeKey: `WP_REJECTED:${project.organizationId || input.organizationId}:${projectId}:${input.reviewId}`
    };
  }

  if (kind === WEB_PROJECT_NOTIFICATION_EVENTS.TRANSITIONED) {
    const toLabel = workflowLabel(input.toStatus);
    if (input.toStatus === "ARCHITECTURE") {
      return {
        eventType: kind,
        severity: "INFO",
        title: "Arquitectura iniciada",
        body: "ARGOS ha iniciado la fase de arquitectura de tu proyecto web.",
        linkTarget: projectLink(projectId),
        scopeType: "web_project",
        scopeId: String(projectId),
        payload: {
          projectId: Number(projectId),
          from: input.fromStatus || null,
          to: input.toStatus || null
        },
        dedupeKey: `WP_TRANSITION:${project.organizationId || input.organizationId}:${projectId}:${input.fromStatus}:${input.toStatus}:${input.reviewId || Date.now()}`
      };
    }
    return {
      eventType: kind,
      severity: "INFO",
      title: "Cambio de fase",
      body: `«${titleName}» pasa a ${toLabel}.`,
      linkTarget: projectLink(projectId),
      scopeType: "web_project",
      scopeId: String(projectId),
      payload: {
        projectId: Number(projectId),
        from: input.fromStatus || null,
        to: input.toStatus || null
      },
      dedupeKey: `WP_TRANSITION:${project.organizationId || input.organizationId}:${projectId}:${input.fromStatus}:${input.toStatus}:${input.reviewId || Date.now()}`
    };
  }

  if (kind === WEB_PROJECT_NOTIFICATION_EVENTS.MOCKUP_STARTED) {
    return {
      eventType: kind,
      severity: "INFO",
      title: "Maqueta iniciada",
      body: "ARGOS ha iniciado la preparación de la maqueta de tu proyecto web.",
      linkTarget: projectLink(projectId),
      scopeType: "web_project",
      scopeId: String(projectId),
      payload: {
        projectId: Number(projectId),
        architectureId: input.architectureId || null
      },
      dedupeKey: `WP_MOCKUP:${project.organizationId || input.organizationId}:${projectId}:${input.architectureId || "none"}`
    };
  }

  if (kind === WEB_PROJECT_NOTIFICATION_EVENTS.MOCKUP_SENT_TO_CLIENT) {
    return {
      eventType: kind,
      severity: "INFO",
      title: "Maqueta lista para revisión",
      body: "Tu maqueta web está preparada para revisión.",
      linkTarget: `${projectLink(projectId)}#wp-mockup`,
      scopeType: "web_project",
      scopeId: String(projectId),
      payload: {
        projectId: Number(projectId),
        mockupId: input.mockupId || null
      },
      dedupeKey: `WP_MOCKUP_SENT:${project.organizationId || input.organizationId}:${projectId}:${input.mockupId}`
    };
  }

  if (kind === WEB_PROJECT_NOTIFICATION_EVENTS.MOCKUP_CHANGES_REQUESTED) {
    return {
      eventType: kind,
      severity: "WARNING",
      title: "Cambios solicitados en maqueta",
      body: `El cliente ha solicitado cambios en la maqueta de «${titleName}».`,
      linkTarget: Number.isInteger(Number(project.organizationId || input.organizationId))
        ? `/noc/projects/${projectId}?organization_id=${project.organizationId || input.organizationId}#noc-maqueta`
        : `/noc/projects/${projectId}#noc-maqueta`,
      scopeType: "web_project",
      scopeId: String(projectId),
      payload: {
        projectId: Number(projectId),
        mockupId: input.mockupId || null
      },
      dedupeKey: `WP_MOCKUP_CHANGES:${project.organizationId || input.organizationId}:${projectId}:${input.mockupId}`
    };
  }

  if (kind === WEB_PROJECT_NOTIFICATION_EVENTS.MOCKUP_APPROVED) {
    return {
      eventType: kind,
      severity: "INFO",
      title: "Maqueta aprobada",
      body: `El cliente ha aprobado la maqueta de «${titleName}».`,
      linkTarget: Number.isInteger(Number(project.organizationId || input.organizationId))
        ? `/noc/projects/${projectId}?organization_id=${project.organizationId || input.organizationId}#noc-maqueta`
        : `/noc/projects/${projectId}#noc-maqueta`,
      scopeType: "web_project",
      scopeId: String(projectId),
      payload: {
        projectId: Number(projectId),
        mockupId: input.mockupId || null
      },
      dedupeKey: `WP_MOCKUP_APPROVED:${project.organizationId || input.organizationId}:${projectId}:${input.mockupId}`
    };
  }

  if (kind === WEB_PROJECT_NOTIFICATION_EVENTS.DEVELOPMENT_STARTED) {
    return {
      eventType: kind,
      severity: "INFO",
      title: "Desarrollo iniciado",
      body: "ARGOS ha iniciado el desarrollo de tu proyecto web.",
      linkTarget: projectLink(projectId),
      scopeType: "web_project",
      scopeId: String(projectId),
      payload: {
        projectId: Number(projectId),
        mockupId: input.mockupId || null
      },
      dedupeKey: `WP_DEV_STARTED:${project.organizationId || input.organizationId}:${projectId}:${input.mockupId || "none"}`
    };
  }

  if (kind === WEB_PROJECT_NOTIFICATION_EVENTS.VALIDATION_STARTED) {
    return {
      eventType: kind,
      severity: "INFO",
      title: "Validación iniciada",
      body: "ARGOS ha iniciado la validación de tu proyecto web.",
      linkTarget: projectLink(projectId),
      scopeType: "web_project",
      scopeId: String(projectId),
      payload: {
        projectId: Number(projectId)
      },
      dedupeKey: `WP_VALIDATION_STARTED:${project.organizationId || input.organizationId}:${projectId}`
    };
  }

  if (kind === WEB_PROJECT_NOTIFICATION_EVENTS.PUBLICATION_STARTED) {
    return {
      eventType: kind,
      severity: "INFO",
      title: "Preparación para publicación",
      body: "ARGOS ha iniciado la preparación para publicar tu proyecto web.",
      linkTarget: projectLink(projectId),
      scopeType: "web_project",
      scopeId: String(projectId),
      payload: {
        projectId: Number(projectId)
      },
      dedupeKey: `WP_PUBLICATION_STARTED:${project.organizationId || input.organizationId}:${projectId}`
    };
  }

  if (kind === WEB_PROJECT_NOTIFICATION_EVENTS.PROJECT_COMPLETED) {
    return {
      eventType: kind,
      severity: "INFO",
      title: "Proyecto web finalizado",
      body: "ARGOS ha marcado tu proyecto web como finalizado. Gracias por confiar en nosotros.",
      linkTarget: projectLink(projectId),
      scopeType: "web_project",
      scopeId: String(projectId),
      payload: {
        projectId: Number(projectId)
      },
      dedupeKey: `WP_PROJECT_COMPLETED:${project.organizationId || input.organizationId}:${projectId}`
    };
  }

  if (kind === WEB_PROJECT_NOTIFICATION_EVENTS.SELF_SERVICE_STARTED) {
    const orgId = Number(project.organizationId || input.organizationId);
    return {
      eventType: kind,
      severity: "INFO",
      title: "Nuevo proyecto web iniciado",
      body: `Hay un proyecto web nuevo en «${titleName}».`,
      linkTarget: Number.isInteger(orgId) && orgId > 0 ? `/noc/projects?organization_id=${orgId}` : "/noc/projects",
      scopeType: "web_project",
      scopeId: String(projectId),
      payload: {
        projectId: Number(projectId),
        source: "self_service"
      },
      dedupeKey: `WP_SELF_SERVICE:${orgId}:${projectId}`
    };
  }

  if (kind === WEB_PROJECT_NOTIFICATION_EVENTS.COMMENT_CREATED) {
    return {
      eventType: kind,
      severity: "INFO",
      title: "Nuevo comentario",
      body: `Hay un comentario nuevo en «${titleName}».`,
      linkTarget: projectLink(projectId),
      scopeType: "web_project",
      scopeId: String(projectId),
      payload: {
        projectId: Number(projectId),
        commentId: input.commentId || null
      },
      dedupeKey: `WP_COMMENT:${project.organizationId || input.organizationId}:${projectId}:${input.commentId}`
    };
  }

  return null;
}

function usesClientFacingCopy(text) {
  return !/CORRECTION_REQUIRED|CORRECTION_REQUESTED|WEB_PROJECT_|REVIEW_APPROVED|REVIEW_REJECTED/.test(
    String(text || "")
  );
}

module.exports = {
  WEB_PROJECT_NOTIFICATION_EVENTS,
  buildWebProjectNotification,
  projectLink,
  workflowLabel,
  usesClientFacingCopy
};
