function serializeHandoff(row) {
  if (!row) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.web_project_id,
    architectureId: row.architecture_id,
    architectureVersion: row.architecture_version,
    mockupId: row.mockup_id,
    mockupVersion: row.mockup_version,
    mockupApprovedAt: row.mockup_approved_at,
    mockupApprovedBy: row.mockup_approved_by,
    schemaVersion: row.schema_version,
    payload: row.payload && typeof row.payload === "object" ? row.payload : {},
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

function serializePlan(row) {
  if (!row) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.web_project_id,
    handoffId: row.handoff_id,
    version: row.version,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function serializeItem(row, { checklist = [], blockers = [], dependencies = [] } = {}) {
  return {
    id: row.id,
    planId: row.development_plan_id,
    itemType: row.item_type,
    title: row.title,
    description: row.description,
    architecturePageId: row.architecture_page_id,
    architectureBlockId: row.architecture_block_id,
    mockupPageId: row.mockup_page_id,
    mockupSectionId: row.mockup_section_id,
    status: row.status,
    priority: row.priority,
    contentReadiness: row.content_readiness,
    sortOrder: row.sort_order,
    required: Boolean(row.required),
    assignedTo: row.assigned_to,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    checklist: checklist.map(serializeChecklistEntry),
    blockers: blockers.map(serializeBlocker),
    dependencyIds: dependencies.map((d) => d.depends_on_item_id ?? d.dependsOnItemId)
  };
}

function serializeChecklistEntry(row) {
  return {
    id: row.id,
    label: row.label,
    required: Boolean(row.required),
    completed: Boolean(row.completed),
    sortOrder: row.sort_order
  };
}

function serializeBlocker(row) {
  return {
    id: row.id,
    itemId: row.development_item_id,
    blockerType: row.blocker_type,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
    resolutionNote: row.resolution_note
  };
}

function assembleDevelopmentPayload(input) {
  const {
    handoff,
    plan,
    items,
    checklistByItem,
    blockersByItem,
    dependencies,
    readiness,
    progress,
    validationHandoff
  } = input;
  const depsByItem = new Map();
  for (const dep of dependencies || []) {
    const itemId = dep.item_id ?? dep.itemId;
    if (!depsByItem.has(itemId)) depsByItem.set(itemId, []);
    depsByItem.get(itemId).push(dep);
  }
  const serializedItems = (items || []).map((row) =>
    serializeItem(row, {
      checklist: checklistByItem?.get(row.id) || [],
      blockers: blockersByItem?.get(row.id) || [],
      dependencies: depsByItem.get(row.id) || []
    })
  );
  return {
    handoff: serializeHandoff(handoff),
    plan: serializePlan(plan),
    items: serializedItems,
    progress: progress || { percent: 0, done: 0, total: 0 },
    readiness,
    validationHandoff: validationHandoff
      ? {
          id: validationHandoff.id,
          readinessState: validationHandoff.readiness_state,
          createdAt: validationHandoff.created_at,
          overrideUsed: validationHandoff.override_used
        }
      : null
  };
}

module.exports = {
  serializeHandoff,
  serializePlan,
  serializeItem,
  serializeBlocker,
  assembleDevelopmentPayload
};
