function mapCheck(row, evidence = [], defects = [], history = []) {
  if (!row) return null;
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    sourceType: row.source_type,
    sourceId: row.source_id,
    architecturePageId: row.architecture_page_id,
    architectureBlockId: row.architecture_block_id,
    mockupPageId: row.mockup_page_id,
    mockupSectionId: row.mockup_section_id,
    developmentItemId: row.development_item_id,
    templateGroupKey: row.template_group_key,
    status: row.status,
    severityIfFailed: row.severity_if_failed,
    required: Boolean(row.required),
    expectedResult: row.expected_result,
    actualResult: row.actual_result,
    statusReason: row.status_reason,
    testedBy: row.tested_by,
    testedAt: row.tested_at,
    sortOrder: row.sort_order,
    evidence: evidence.map(mapEvidence),
    defects: defects.filter((d) => d.check_id === row.id).map(mapDefect),
    history: history.map(mapHistory)
  };
}

function mapEvidence(row) {
  return {
    id: row.id,
    evidenceType: row.evidence_type,
    label: row.label,
    url: row.url,
    textNote: row.text_note,
    documentId: row.document_id,
    automatedResult: row.automated_result,
    capturedAt: row.captured_at,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at
  };
}

function mapDefect(row) {
  return {
    id: row.id,
    checkId: row.check_id,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    assignedTo: row.assigned_to,
    developmentItemId: row.development_item_id,
    wontFixReason: row.wont_fix_reason,
    resolutionNote: row.resolution_note,
    createdBy: row.created_by,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by
  };
}

function mapHistory(row) {
  return {
    id: row.id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    actualResult: row.actual_result,
    note: row.note,
    defectId: row.defect_id,
    testedBy: row.tested_by,
    testedAt: row.tested_at
  };
}

function mapPlan(row) {
  if (!row) return null;
  return {
    id: row.id,
    validationHandoffId: row.validation_handoff_id,
    architectureId: row.architecture_id,
    architectureVersion: row.architecture_version,
    mockupId: row.mockup_id,
    mockupVersion: row.mockup_version,
    developmentPlanId: row.development_plan_id,
    status: row.status,
    representativeSamples:
      typeof row.representative_samples === "object"
        ? row.representative_samples
        : row.representative_samples
          ? JSON.parse(row.representative_samples)
          : {},
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRun(row) {
  if (!row) return null;
  return {
    id: row.id,
    validationPlanId: row.validation_plan_id,
    runNumber: row.run_number,
    status: row.status,
    startedBy: row.started_by,
    startedAt: row.started_at,
    closedAt: row.closed_at
  };
}

function mapHandoff(row) {
  if (!row) return null;
  const payload =
    row.payload && typeof row.payload === "object" ? row.payload : row.payload ? JSON.parse(row.payload) : {};
  return {
    id: row.id,
    developmentPlanId: row.development_plan_id,
    schemaVersion: row.schema_version,
    readinessState: row.readiness_state,
    overrideUsed: Boolean(row.override_used),
    overrideReason: row.override_reason,
    payload,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

function mapPublicationHandoff(row) {
  if (!row) return null;
  const payload =
    row.payload && typeof row.payload === "object" ? row.payload : row.payload ? JSON.parse(row.payload) : {};
  return {
    id: row.id,
    validationHandoffId: row.validation_handoff_id,
    validationPlanId: row.validation_plan_id,
    validationRunId: row.validation_run_id,
    schemaVersion: row.schema_version,
    readinessState: row.readiness_state,
    overrideUsed: Boolean(row.override_used),
    overrideReason: row.override_reason,
    payload,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

function countByStatus(checks) {
  const counts = {
    pending: 0,
    inProgress: 0,
    pass: 0,
    fail: 0,
    blocked: 0,
    notTestable: 0,
    notApplicable: 0
  };
  for (const c of checks || []) {
    switch (c.status) {
      case "PENDING":
        counts.pending++;
        break;
      case "IN_PROGRESS":
        counts.inProgress++;
        break;
      case "PASS":
        counts.pass++;
        break;
      case "FAIL":
        counts.fail++;
        break;
      case "BLOCKED":
        counts.blocked++;
        break;
      case "NOT_TESTABLE":
        counts.notTestable++;
        break;
      case "NOT_APPLICABLE":
        counts.notApplicable++;
        break;
      default:
        break;
    }
  }
  return counts;
}

function assembleValidationPayload(input) {
  const {
    validationHandoff,
    plan,
    run,
    checks,
    defects,
    evidenceByCheck,
    historyByCheck,
    readiness,
    publicationHandoff
  } = input;
  const mappedChecks = (checks || []).map((c) =>
    mapCheck(c, evidenceByCheck?.get(c.id) || [], defects || [], historyByCheck?.get(c.id) || [])
  );
  const openDefects = (defects || []).filter((d) => !["VERIFIED", "WONT_FIX"].includes(d.status));
  return {
    validationHandoff: mapHandoff(validationHandoff),
    plan: mapPlan(plan),
    run: mapRun(run),
    checks: mappedChecks,
    defects: (defects || []).map(mapDefect),
    counts: {
      checks: countByStatus(checks),
      defectsOpen: openDefects.length,
      defectsCriticalHigh: openDefects.filter((d) => ["CRITICAL", "HIGH"].includes(d.severity)).length
    },
    executionProgress: readiness.executionProgress,
    passRate: readiness.passRate,
    readiness: {
      state: readiness.state,
      errors: readiness.errors,
      warnings: readiness.warnings
    },
    publicationHandoff: mapPublicationHandoff(publicationHandoff),
    publicationReadiness: readiness.state
  };
}

module.exports = {
  assembleValidationPayload,
  mapCheck,
  mapDefect,
  mapEvidence,
  mapPlan,
  mapRun,
  mapHandoff,
  mapPublicationHandoff,
  countByStatus
};
