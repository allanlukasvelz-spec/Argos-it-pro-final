const { bootstrapDevelopmentReady } = require("./phase15.fixtures");

async function completeRequiredDevelopmentItems(svc, organizationId, projectId, actorUserId) {
  const dev = await svc.getDevelopment(organizationId, projectId);
  for (const item of dev.items.filter((i) => i.required)) {
    const steps =
      item.status === "TODO"
        ? ["READY", "IN_PROGRESS", "REVIEW", "DONE"]
        : item.status === "READY"
          ? ["IN_PROGRESS", "REVIEW", "DONE"]
          : item.status === "IN_PROGRESS"
            ? ["REVIEW", "DONE"]
            : item.status === "REVIEW"
              ? ["DONE"]
              : [];
    for (const status of steps) {
      await svc.updateDevelopmentItem(organizationId, projectId, item.id, actorUserId, { status });
    }
  }
}

async function bootstrapValidationPhase(svc, organizationId, projectId, actorUserId) {
  await bootstrapDevelopmentReady(svc, organizationId, projectId, actorUserId);
  await completeRequiredDevelopmentItems(svc, organizationId, projectId, actorUserId);
  await svc.startValidation(organizationId, projectId, actorUserId, { acknowledgeWarnings: true });
  return svc.getProject(organizationId, projectId);
}

async function bootstrapValidationReady(svc, organizationId, projectId, actorUserId) {
  await bootstrapValidationPhase(svc, organizationId, projectId, actorUserId);
  await svc.prepareValidationPlan(organizationId, projectId, actorUserId);
  return svc.getValidation(organizationId, projectId);
}

module.exports = {
  completeRequiredDevelopmentItems,
  bootstrapValidationPhase,
  bootstrapValidationReady
};
