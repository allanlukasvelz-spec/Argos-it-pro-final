/** Shared validation persistence helpers for sqlStore and memoryStore. */

function createMemoryValidationMethods(state, { now }) {
  if (!state.validationPlans) state.validationPlans = [];
  if (!state.validationRuns) state.validationRuns = [];
  if (!state.validationChecks) state.validationChecks = [];
  if (!state.validationEvidence) state.validationEvidence = [];
  if (!state.validationDefects) state.validationDefects = [];
  if (!state.validationCheckResults) state.validationCheckResults = [];
  if (!state.publicationHandoffs) state.publicationHandoffs = [];
  if (!state.seq.validationPlan) state.seq.validationPlan = 1;
  if (!state.seq.validationRun) state.seq.validationRun = 1;
  if (!state.seq.validationCheck) state.seq.validationCheck = 1;
  if (!state.seq.validationEvidence) state.seq.validationEvidence = 1;
  if (!state.seq.validationDefect) state.seq.validationDefect = 1;
  if (!state.seq.validationCheckResult) state.seq.validationCheckResult = 1;
  if (!state.seq.publicationHandoff) state.seq.publicationHandoff = 1;

  return {
    async getActiveValidationPlan(organizationId, projectId) {
      return (
        state.validationPlans
          .filter(
            (r) =>
              r.organization_id === organizationId &&
              r.web_project_id === Number(projectId) &&
              r.status === "ACTIVE"
          )
          .sort((a, b) => b.id - a.id)[0] || null
      );
    },
    async getValidationPlan(organizationId, projectId, planId) {
      return (
        state.validationPlans.find(
          (r) =>
            r.organization_id === organizationId &&
            r.web_project_id === Number(projectId) &&
            r.id === Number(planId)
        ) || null
      );
    },
    async insertValidationPlan(row) {
      const created = {
        ...row,
        id: state.seq.validationPlan++,
        status: row.status || "ACTIVE",
        representative_samples: row.representative_samples || {},
        created_at: now(),
        updated_at: now()
      };
      state.validationPlans.push(created);
      return created;
    },
    async updateValidationPlan(organizationId, projectId, planId, patch) {
      const idx = state.validationPlans.findIndex(
        (r) =>
          r.organization_id === organizationId &&
          r.web_project_id === Number(projectId) &&
          r.id === Number(planId)
      );
      if (idx < 0) return null;
      state.validationPlans[idx] = {
        ...state.validationPlans[idx],
        ...patch,
        updated_at: now()
      };
      return state.validationPlans[idx];
    },
    async getOpenValidationRun(organizationId, projectId, planId) {
      return (
        state.validationRuns
          .filter(
            (r) =>
              r.organization_id === organizationId &&
              r.web_project_id === Number(projectId) &&
              r.validation_plan_id === Number(planId) &&
              r.status === "OPEN"
          )
          .sort((a, b) => b.run_number - a.run_number)[0] || null
      );
    },
    async insertValidationRun(row) {
      const created = {
        ...row,
        id: state.seq.validationRun++,
        status: row.status || "OPEN",
        started_at: now()
      };
      state.validationRuns.push(created);
      return created;
    },
    async listValidationChecks(organizationId, projectId, planId) {
      return state.validationChecks
        .filter(
          (r) =>
            r.organization_id === organizationId &&
            r.web_project_id === Number(projectId) &&
            r.validation_plan_id === Number(planId)
        )
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    async getValidationCheck(organizationId, projectId, checkId) {
      return (
        state.validationChecks.find(
          (r) =>
            r.organization_id === organizationId &&
            r.web_project_id === Number(projectId) &&
            r.id === Number(checkId)
        ) || null
      );
    },
    async insertValidationCheck(row) {
      const created = {
        ...row,
        id: state.seq.validationCheck++,
        status: row.status || "PENDING",
        created_at: now(),
        updated_at: now()
      };
      state.validationChecks.push(created);
      return created;
    },
    async updateValidationCheck(organizationId, projectId, checkId, patch) {
      const idx = state.validationChecks.findIndex(
        (r) =>
          r.organization_id === organizationId &&
          r.web_project_id === Number(projectId) &&
          r.id === Number(checkId)
      );
      if (idx < 0) return null;
      state.validationChecks[idx] = {
        ...state.validationChecks[idx],
        ...patch,
        updated_at: now()
      };
      return state.validationChecks[idx];
    },
    async listValidationEvidence(organizationId, projectId, checkId) {
      return state.validationEvidence
        .filter(
          (r) =>
            r.organization_id === organizationId &&
            r.web_project_id === Number(projectId) &&
            r.validation_check_id === Number(checkId)
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    async insertValidationEvidence(row) {
      const created = {
        ...row,
        id: state.seq.validationEvidence++,
        created_at: now()
      };
      state.validationEvidence.push(created);
      return created;
    },
    async listValidationDefects(organizationId, projectId, planId) {
      return state.validationDefects
        .filter(
          (r) =>
            r.organization_id === organizationId &&
            r.web_project_id === Number(projectId) &&
            r.validation_plan_id === Number(planId)
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    async getValidationDefect(organizationId, projectId, defectId) {
      return (
        state.validationDefects.find(
          (r) =>
            r.organization_id === organizationId &&
            r.web_project_id === Number(projectId) &&
            r.id === Number(defectId)
        ) || null
      );
    },
    async insertValidationDefect(row) {
      const created = {
        ...row,
        id: state.seq.validationDefect++,
        status: row.status || "OPEN",
        created_at: now()
      };
      state.validationDefects.push(created);
      return created;
    },
    async updateValidationDefect(organizationId, projectId, defectId, patch) {
      const idx = state.validationDefects.findIndex(
        (r) =>
          r.organization_id === organizationId &&
          r.web_project_id === Number(projectId) &&
          r.id === Number(defectId)
      );
      if (idx < 0) return null;
      state.validationDefects[idx] = { ...state.validationDefects[idx], ...patch };
      return state.validationDefects[idx];
    },
    async insertValidationCheckResult(row) {
      const created = {
        ...row,
        id: state.seq.validationCheckResult++,
        tested_at: row.tested_at || now()
      };
      state.validationCheckResults.push(created);
      return created;
    },
    async listValidationCheckResults(organizationId, projectId, checkId) {
      return state.validationCheckResults
        .filter(
          (r) =>
            r.organization_id === organizationId &&
            r.web_project_id === Number(projectId) &&
            r.validation_check_id === Number(checkId)
        )
        .sort((a, b) => new Date(b.tested_at) - new Date(a.tested_at));
    },
    async getPublicationHandoff(organizationId, projectId, planId) {
      return (
        state.publicationHandoffs.find(
          (r) =>
            r.organization_id === organizationId &&
            r.web_project_id === Number(projectId) &&
            r.validation_plan_id === Number(planId)
        ) || null
      );
    },
    async insertPublicationHandoff(row) {
      const created = {
        ...row,
        id: state.seq.publicationHandoff++,
        payload: row.payload || {},
        created_at: now()
      };
      state.publicationHandoffs.push(created);
      return created;
    },
    async getValidationHandoffForProject(organizationId, projectId) {
      const handoffs = state.validationHandoffs || [];
      return (
        handoffs
          .filter(
            (r) => r.organization_id === organizationId && r.web_project_id === Number(projectId)
          )
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null
      );
    }
  };
}

function createSqlValidationMethods(db) {
  return {
    async getActiveValidationPlan(organizationId, projectId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, validation_handoff_id, architecture_id,
                architecture_version, mockup_id, mockup_version, development_plan_id, status,
                representative_samples, created_by, created_at, updated_at
         FROM web_project_validation_plans
         WHERE organization_id = $1 AND web_project_id = $2 AND status = 'ACTIVE'
         ORDER BY id DESC LIMIT 1`,
        [organizationId, projectId]
      );
      return result.rows[0] || null;
    },
    async getValidationPlan(organizationId, projectId, planId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, validation_handoff_id, architecture_id,
                architecture_version, mockup_id, mockup_version, development_plan_id, status,
                representative_samples, created_by, created_at, updated_at
         FROM web_project_validation_plans
         WHERE organization_id = $1 AND web_project_id = $2 AND id = $3`,
        [organizationId, projectId, planId]
      );
      return result.rows[0] || null;
    },
    async insertValidationPlan(row) {
      const result = await db.query(
        `INSERT INTO web_project_validation_plans (
           organization_id, web_project_id, validation_handoff_id, architecture_id, architecture_version,
           mockup_id, mockup_version, development_plan_id, status, representative_samples, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id, organization_id, web_project_id, validation_handoff_id, architecture_id,
                   architecture_version, mockup_id, mockup_version, development_plan_id, status,
                   representative_samples, created_by, created_at, updated_at`,
        [
          row.organization_id,
          row.web_project_id,
          row.validation_handoff_id,
          row.architecture_id ?? null,
          row.architecture_version ?? null,
          row.mockup_id ?? null,
          row.mockup_version ?? null,
          row.development_plan_id,
          row.status || "ACTIVE",
          JSON.stringify(row.representative_samples || {}),
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    },
    async updateValidationPlan(organizationId, projectId, planId, patch) {
      const sets = [];
      const values = [];
      let idx = 4;
      for (const [key, val] of Object.entries(patch)) {
        sets.push(`${key} = $${idx++}`);
        values.push(key === "representative_samples" ? JSON.stringify(val) : val);
      }
      if (!sets.length) return null;
      sets.push(`updated_at = NOW()`);
      const result = await db.query(
        `UPDATE web_project_validation_plans SET ${sets.join(", ")}
         WHERE id = $1 AND organization_id = $2 AND web_project_id = $3
         RETURNING id, organization_id, web_project_id, validation_handoff_id, architecture_id,
                   architecture_version, mockup_id, mockup_version, development_plan_id, status,
                   representative_samples, created_by, created_at, updated_at`,
        [planId, organizationId, projectId, ...values]
      );
      return result.rows[0] || null;
    },
    async getOpenValidationRun(organizationId, projectId, planId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, validation_plan_id, run_number, status,
                started_by, started_at, closed_at
         FROM web_project_validation_runs
         WHERE organization_id = $1 AND web_project_id = $2 AND validation_plan_id = $3 AND status = 'OPEN'
         ORDER BY run_number DESC LIMIT 1`,
        [organizationId, projectId, planId]
      );
      return result.rows[0] || null;
    },
    async insertValidationRun(row) {
      const result = await db.query(
        `INSERT INTO web_project_validation_runs (
           organization_id, web_project_id, validation_plan_id, run_number, status, started_by
         ) VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id, organization_id, web_project_id, validation_plan_id, run_number, status,
                   started_by, started_at, closed_at`,
        [
          row.organization_id,
          row.web_project_id,
          row.validation_plan_id,
          row.run_number || 1,
          row.status || "OPEN",
          row.started_by ?? null
        ]
      );
      return result.rows[0];
    },
    async listValidationChecks(organizationId, projectId, planId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, validation_plan_id, validation_run_id, category,
                title, description, source_type, source_id, architecture_page_id, architecture_block_id,
                mockup_page_id, mockup_section_id, development_item_id, template_group_key, status,
                severity_if_failed, required, expected_result, actual_result, status_reason,
                tested_by, tested_at, sort_order, created_at, updated_at
         FROM web_project_validation_checks
         WHERE organization_id = $1 AND web_project_id = $2 AND validation_plan_id = $3
         ORDER BY sort_order ASC`,
        [organizationId, projectId, planId]
      );
      return result.rows;
    },
    async getValidationCheck(organizationId, projectId, checkId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, validation_plan_id, validation_run_id, category,
                title, description, source_type, source_id, architecture_page_id, architecture_block_id,
                mockup_page_id, mockup_section_id, development_item_id, template_group_key, status,
                severity_if_failed, required, expected_result, actual_result, status_reason,
                tested_by, tested_at, sort_order, created_at, updated_at
         FROM web_project_validation_checks
         WHERE organization_id = $1 AND web_project_id = $2 AND id = $3`,
        [organizationId, projectId, checkId]
      );
      return result.rows[0] || null;
    },
    async insertValidationCheck(row) {
      const result = await db.query(
        `INSERT INTO web_project_validation_checks (
           organization_id, web_project_id, validation_plan_id, validation_run_id, category, title,
           description, source_type, source_id, architecture_page_id, architecture_block_id,
           mockup_page_id, mockup_section_id, development_item_id, template_group_key, status,
           severity_if_failed, required, expected_result, sort_order
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
         RETURNING id, organization_id, web_project_id, validation_plan_id, validation_run_id, category,
                   title, description, source_type, source_id, architecture_page_id, architecture_block_id,
                   mockup_page_id, mockup_section_id, development_item_id, template_group_key, status,
                   severity_if_failed, required, expected_result, actual_result, status_reason,
                   tested_by, tested_at, sort_order, created_at, updated_at`,
        [
          row.organization_id,
          row.web_project_id,
          row.validation_plan_id,
          row.validation_run_id,
          row.category,
          row.title,
          row.description ?? null,
          row.source_type ?? null,
          row.source_id ?? null,
          row.architecture_page_id ?? null,
          row.architecture_block_id ?? null,
          row.mockup_page_id ?? null,
          row.mockup_section_id ?? null,
          row.development_item_id ?? null,
          row.template_group_key ?? null,
          row.status || "PENDING",
          row.severity_if_failed ?? null,
          Boolean(row.required),
          row.expected_result ?? null,
          row.sort_order ?? 0
        ]
      );
      return result.rows[0];
    },
    async updateValidationCheck(organizationId, projectId, checkId, patch) {
      const sets = [];
      const values = [];
      let idx = 4;
      for (const [key, val] of Object.entries(patch)) {
        sets.push(`${key} = $${idx++}`);
        values.push(val);
      }
      if (!sets.length) return null;
      sets.push(`updated_at = NOW()`);
      const result = await db.query(
        `UPDATE web_project_validation_checks SET ${sets.join(", ")}
         WHERE id = $1 AND organization_id = $2 AND web_project_id = $3
         RETURNING id, organization_id, web_project_id, validation_plan_id, validation_run_id, category,
                   title, description, source_type, source_id, architecture_page_id, architecture_block_id,
                   mockup_page_id, mockup_section_id, development_item_id, template_group_key, status,
                   severity_if_failed, required, expected_result, actual_result, status_reason,
                   tested_by, tested_at, sort_order, created_at, updated_at`,
        [checkId, organizationId, projectId, ...values]
      );
      return result.rows[0] || null;
    },
    async listValidationEvidence(organizationId, projectId, checkId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, validation_check_id, evidence_type, label, url,
                text_note, document_id, automated_result, captured_at, uploaded_by, created_at
         FROM web_project_validation_evidence
         WHERE organization_id = $1 AND web_project_id = $2 AND validation_check_id = $3
         ORDER BY created_at DESC`,
        [organizationId, projectId, checkId]
      );
      return result.rows;
    },
    async insertValidationEvidence(row) {
      const result = await db.query(
        `INSERT INTO web_project_validation_evidence (
           organization_id, web_project_id, validation_check_id, evidence_type, label, url,
           text_note, document_id, automated_result, captured_at, uploaded_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id, organization_id, web_project_id, validation_check_id, evidence_type, label, url,
                   text_note, document_id, automated_result, captured_at, uploaded_by, created_at`,
        [
          row.organization_id,
          row.web_project_id,
          row.validation_check_id,
          row.evidence_type,
          row.label ?? null,
          row.url ?? null,
          row.text_note ?? null,
          row.document_id ?? null,
          row.automated_result ? JSON.stringify(row.automated_result) : null,
          row.captured_at ?? null,
          row.uploaded_by ?? null
        ]
      );
      return result.rows[0];
    },
    async listValidationDefects(organizationId, projectId, planId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, validation_plan_id, validation_run_id, check_id,
                title, description, severity, status, assigned_to, development_item_id, wont_fix_reason,
                resolution_note, created_by, created_at, resolved_at, resolved_by
         FROM web_project_validation_defects
         WHERE organization_id = $1 AND web_project_id = $2 AND validation_plan_id = $3
         ORDER BY created_at DESC`,
        [organizationId, projectId, planId]
      );
      return result.rows;
    },
    async getValidationDefect(organizationId, projectId, defectId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, validation_plan_id, validation_run_id, check_id,
                title, description, severity, status, assigned_to, development_item_id, wont_fix_reason,
                resolution_note, created_by, created_at, resolved_at, resolved_by
         FROM web_project_validation_defects
         WHERE organization_id = $1 AND web_project_id = $2 AND id = $3`,
        [organizationId, projectId, defectId]
      );
      return result.rows[0] || null;
    },
    async insertValidationDefect(row) {
      const result = await db.query(
        `INSERT INTO web_project_validation_defects (
           organization_id, web_project_id, validation_plan_id, validation_run_id, check_id,
           title, description, severity, status, assigned_to, development_item_id, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING id, organization_id, web_project_id, validation_plan_id, validation_run_id, check_id,
                   title, description, severity, status, assigned_to, development_item_id, wont_fix_reason,
                   resolution_note, created_by, created_at, resolved_at, resolved_by`,
        [
          row.organization_id,
          row.web_project_id,
          row.validation_plan_id,
          row.validation_run_id ?? null,
          row.check_id ?? null,
          row.title,
          row.description ?? null,
          row.severity,
          row.status || "OPEN",
          row.assigned_to ?? null,
          row.development_item_id ?? null,
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    },
    async updateValidationDefect(organizationId, projectId, defectId, patch) {
      const sets = [];
      const values = [];
      let idx = 4;
      for (const [key, val] of Object.entries(patch)) {
        sets.push(`${key} = $${idx++}`);
        values.push(val);
      }
      if (!sets.length) return null;
      const result = await db.query(
        `UPDATE web_project_validation_defects SET ${sets.join(", ")}
         WHERE id = $1 AND organization_id = $2 AND web_project_id = $3
         RETURNING id, organization_id, web_project_id, validation_plan_id, validation_run_id, check_id,
                   title, description, severity, status, assigned_to, development_item_id, wont_fix_reason,
                   resolution_note, created_by, created_at, resolved_at, resolved_by`,
        [defectId, organizationId, projectId, ...values]
      );
      return result.rows[0] || null;
    },
    async insertValidationCheckResult(row) {
      const result = await db.query(
        `INSERT INTO web_project_validation_check_results (
           organization_id, web_project_id, validation_check_id, defect_id, previous_status,
           new_status, actual_result, note, tested_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id, organization_id, web_project_id, validation_check_id, defect_id, previous_status,
                   new_status, actual_result, note, tested_by, tested_at`,
        [
          row.organization_id,
          row.web_project_id,
          row.validation_check_id,
          row.defect_id ?? null,
          row.previous_status,
          row.new_status,
          row.actual_result ?? null,
          row.note ?? null,
          row.tested_by ?? null
        ]
      );
      return result.rows[0];
    },
    async listValidationCheckResults(organizationId, projectId, checkId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, validation_check_id, defect_id, previous_status,
                new_status, actual_result, note, tested_by, tested_at
         FROM web_project_validation_check_results
         WHERE organization_id = $1 AND web_project_id = $2 AND validation_check_id = $3
         ORDER BY tested_at DESC`,
        [organizationId, projectId, checkId]
      );
      return result.rows;
    },
    async getPublicationHandoff(organizationId, projectId, planId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, validation_handoff_id, validation_plan_id,
                validation_run_id, schema_version, payload, readiness_state, override_used,
                override_reason, created_by, created_at
         FROM web_project_publication_handoffs
         WHERE organization_id = $1 AND web_project_id = $2 AND validation_plan_id = $3`,
        [organizationId, projectId, planId]
      );
      return result.rows[0] || null;
    },
    async insertPublicationHandoff(row) {
      const result = await db.query(
        `INSERT INTO web_project_publication_handoffs (
           organization_id, web_project_id, validation_handoff_id, validation_plan_id, validation_run_id,
           schema_version, payload, readiness_state, override_used, override_reason, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id, organization_id, web_project_id, validation_handoff_id, validation_plan_id,
                   validation_run_id, schema_version, payload, readiness_state, override_used,
                   override_reason, created_by, created_at`,
        [
          row.organization_id,
          row.web_project_id,
          row.validation_handoff_id,
          row.validation_plan_id,
          row.validation_run_id ?? null,
          row.schema_version,
          JSON.stringify(row.payload || {}),
          row.readiness_state,
          Boolean(row.override_used),
          row.override_reason ?? null,
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    },
    async getValidationHandoffForProject(organizationId, projectId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, development_plan_id, schema_version, payload,
                readiness_state, override_used, override_reason, created_by, created_at
         FROM web_project_validation_handoffs
         WHERE organization_id = $1 AND web_project_id = $2
         ORDER BY created_at DESC LIMIT 1`,
        [organizationId, projectId]
      );
      return result.rows[0] || null;
    }
  };
}

module.exports = {
  createMemoryValidationMethods,
  createSqlValidationMethods
};
