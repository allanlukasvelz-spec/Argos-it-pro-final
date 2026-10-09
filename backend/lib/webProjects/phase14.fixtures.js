const { seedServiceBusiness, moveProjectToArchitecture } = require("./phase13.fixtures");

async function moveProjectToMockup(svc, organizationId, projectId, actorUserId) {
  await moveProjectToArchitecture(svc, organizationId, projectId, actorUserId);
  await svc.generateArchitecture(organizationId, projectId, actorUserId);
  await svc.approveArchitecture(organizationId, projectId, actorUserId, { acknowledgeWarnings: true });
  await svc.startMockup(organizationId, projectId, actorUserId);
  return svc.getProject(organizationId, projectId);
}

async function generateApprovedMockup(svc, organizationId, projectId, actorUserId) {
  const project = await svc.getProject(organizationId, projectId);
  if (project.workflowStatus !== "MOCKUP") {
    await moveProjectToMockup(svc, organizationId, projectId, actorUserId);
  }
  const existing = await svc.getMockup(organizationId, projectId);
  if (existing.mockup) return existing;
  return svc.generateMockup(organizationId, projectId, actorUserId);
}

async function bootstrapDevelopmentFromMockup(svc, organizationId, projectId, actorUserId) {
  const project = await svc.getProject(organizationId, projectId);
  if (project.workflowStatus !== "MOCKUP") {
    await moveProjectToMockup(svc, organizationId, projectId, actorUserId);
  } else {
    const arch = await svc.getArchitecture(organizationId, projectId);
    if (!arch.architecture || arch.architecture.status !== "APPROVED") {
      if (!arch.architecture) {
        await svc.generateArchitecture(organizationId, projectId, actorUserId);
      }
      await svc.approveArchitecture(organizationId, projectId, actorUserId, {
        acknowledgeWarnings: true
      });
    }
  }
  let bundle = await svc.getMockup(organizationId, projectId);
  if (!bundle.mockup) {
    bundle = await svc.generateMockup(organizationId, projectId, actorUserId);
  }
  const mockupId = bundle.mockup.id;
  if (bundle.mockup.status !== "APPROVED") {
    if (bundle.mockup.status !== "CLIENT_REVIEW") {
      await svc.sendMockupToClient(organizationId, projectId, mockupId, actorUserId, {
        acknowledgeWarnings: true
      });
    }
    await svc.clientApproveMockup(organizationId, projectId, actorUserId);
  }
  return svc.startDevelopment(organizationId, projectId, actorUserId);
}

module.exports = {
  moveProjectToMockup,
  generateApprovedMockup,
  bootstrapDevelopmentFromMockup
};
