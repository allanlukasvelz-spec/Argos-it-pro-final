const { bootstrapValidationReady } = require("./phase16.fixtures");

async function passAllRequiredChecks(svc, organizationId, projectId, actorUserId) {
  const validation = await svc.getValidation(organizationId, projectId);
  for (const check of validation.checks.filter((c) => c.required)) {
    if (check.status === "NOT_APPLICABLE" || check.status === "PASS") continue;
    if (check.status === "PENDING" || check.status === "BLOCKED" || check.status === "FAIL") {
      await svc.updateValidationCheck(organizationId, projectId, check.id, actorUserId, {
        status: "IN_PROGRESS"
      });
    }
    const passBody =
      check.category === "BOOKING" || check.category === "ECOMMERCE"
        ? { status: "NOT_APPLICABLE", statusReason: "Fuera de alcance en entorno de prueba" }
        : { status: "PASS" };
    await svc.updateValidationCheck(organizationId, projectId, check.id, actorUserId, passBody);
  }
}

async function bootstrapPublicationPhase(svc, organizationId, projectId, actorUserId) {
  await bootstrapValidationReady(svc, organizationId, projectId, actorUserId);
  await passAllRequiredChecks(svc, organizationId, projectId, actorUserId);
  await svc.startPublication(organizationId, projectId, actorUserId, { acknowledgeWarnings: true });
  return svc.getProject(organizationId, projectId);
}

async function completeRequiredPublicationSteps(svc, organizationId, projectId, actorUserId) {
  const pub = await svc.getPublication(organizationId, projectId);
  for (const step of pub.steps.filter((s) => s.required && s.status !== "NOT_APPLICABLE")) {
    const order =
      step.status === "TODO"
        ? ["READY", "IN_PROGRESS", "REVIEW", "DONE"]
        : step.status === "READY"
          ? ["IN_PROGRESS", "REVIEW", "DONE"]
          : step.status === "IN_PROGRESS"
            ? ["REVIEW", "DONE"]
            : step.status === "REVIEW"
              ? ["DONE"]
              : [];
    for (const status of order) {
      await svc.updatePublicationStep(organizationId, projectId, step.id, actorUserId, { status });
    }
  }
}

async function bootstrapPublicationReady(svc, organizationId, projectId, actorUserId) {
  await bootstrapPublicationPhase(svc, organizationId, projectId, actorUserId);
  await svc.preparePublicationPlan(organizationId, projectId, actorUserId);
  await completeRequiredPublicationSteps(svc, organizationId, projectId, actorUserId);
  return svc.getPublication(organizationId, projectId);
}

module.exports = {
  passAllRequiredChecks,
  bootstrapPublicationPhase,
  completeRequiredPublicationSteps,
  bootstrapPublicationReady
};
