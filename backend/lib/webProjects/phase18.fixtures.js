async function forceProjectCompleted(store, organizationId, projectId) {
  return store.updateProject(organizationId, projectId, {
    workflow_status: "COMPLETED",
    completed_at: new Date().toISOString()
  });
}

async function seedMinimalProject(svc, organizationId, actorUserId = 1) {
  const project = await svc.createProject({
    organizationId,
    actorUserId,
    title: "Acme site",
    projectType: "improve"
  });
  await svc.upsertForm(organizationId, project.id, actorUserId, [
    { fieldKey: "site_kind", value: "corporate" },
    { fieldKey: "has_existing_site", value: "no" }
  ]);
  return { project: await svc.getProject(organizationId, project.id) };
}

async function archiveEligibleProject(store, service, organizationId, projectId, actorUserId, options = {}) {
  const project = await service.getProject(organizationId, projectId);
  if (project.workflowStatus !== "COMPLETED") {
    await forceProjectCompleted(store, organizationId, projectId);
  }
  return service.archiveProject(organizationId, projectId, actorUserId, options);
}

module.exports = {
  forceProjectCompleted,
  seedMinimalProject,
  archiveEligibleProject
};
