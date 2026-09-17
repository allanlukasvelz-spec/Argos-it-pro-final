const { bootstrapDevelopmentFromMockup } = require("./phase14.fixtures");

async function bootstrapDevelopmentReady(svc, organizationId, projectId, actorUserId) {
  const project = await bootstrapDevelopmentFromMockup(svc, organizationId, projectId, actorUserId);
  await svc.prepareDevelopmentPlan(organizationId, projectId, actorUserId);
  return project;
}

module.exports = {
  bootstrapDevelopmentFromMockup,
  bootstrapDevelopmentReady
};
