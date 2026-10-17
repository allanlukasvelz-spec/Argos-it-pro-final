/** Shared publication persistence helpers for sqlStore and memoryStore. */

const PUB_PLAN_COLS = `id, organization_id, web_project_id, publication_handoff_id, validation_plan_id,
  status, target_hostname, created_by, created_at, updated_at`;

const PUB_STEP_COLS = `id, organization_id, web_project_id, publication_plan_id, step_type, title,
  description, status, priority, required, sort_order, notes, evidence_url, assigned_to,
  started_at, completed_at, created_by, created_at, updated_at`;

function createMemoryPublicationMethods(state, { now }) {
  if (!state.publicationPlans) state.publicationPlans = [];
  if (!state.publicationSteps) state.publicationSteps = [];
  if (!state.publicationBlockers) state.publicationBlockers = [];
  if (!state.completionHandoffs) state.completionHandoffs = [];
  if (!state.seq.publicationPlan) state.seq.publicationPlan = 1;
  if (!state.seq.publicationStep) state.seq.publicationStep = 1;
  if (!state.seq.publicationBlocker) state.seq.publicationBlocker = 1;
  if (!state.seq.completionHandoff) state.seq.completionHandoff = 1;

  return {
    async getPublicationHandoffForProject(organizationId, projectId) {
      const handoffs = state.publicationHandoffs || [];
      return (
        handoffs
          .filter(
            (r) => r.organization_id === organizationId && r.web_project_id === Number(projectId)
          )
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null
      );
    },
    async getActivePublicationPlan(organizationId, projectId) {
      return (
        state.publicationPlans
          .filter(
            (r) =>
              r.organization_id === organizationId &&
              r.web_project_id === Number(projectId) &&
              r.status === "ACTIVE"
          )
          .sort((a, b) => b.id - a.id)[0] || null
      );
    },
    async insertPublicationPlan(row) {
      const created = {
        ...row,
        id: state.seq.publicationPlan++,
        status: row.status || "ACTIVE",
        created_at: now(),
        updated_at: now()
      };
      state.publicationPlans.push(created);
      return created;
    },
    async listPublicationSteps(organizationId, projectId, planId) {
      return state.publicationSteps
        .filter(
          (r) =>
            r.organization_id === organizationId &&
            r.web_project_id === Number(projectId) &&
            r.publication_plan_id === Number(planId)
        )
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    async getPublicationStep(organizationId, projectId, stepId) {
      return (
        state.publicationSteps.find(
          (r) =>
            r.organization_id === organizationId &&
            r.web_project_id === Number(projectId) &&
            r.id === Number(stepId)
        ) || null
      );
    },
    async insertPublicationStep(row) {
      const created = {
        ...row,
        id: state.seq.publicationStep++,
        status: row.status || "TODO",
        created_at: now(),
        updated_at: now()
      };
      state.publicationSteps.push(created);
      return created;
    },
    async updatePublicationStep(organizationId, projectId, stepId, patch) {
      const row = await this.getPublicationStep(organizationId, projectId, stepId);
      if (!row) return null;
      Object.assign(row, patch, { updated_at: now() });
      return row;
    },
    async insertPublicationBlocker(row) {
      const created = { ...row, id: state.seq.publicationBlocker++, created_at: now() };
      state.publicationBlockers.push(created);
      return created;
    },
    async updatePublicationBlocker(organizationId, projectId, blockerId, patch) {
      const row = state.publicationBlockers.find(
        (r) =>
          r.organization_id === organizationId &&
          r.web_project_id === Number(projectId) &&
          r.id === Number(blockerId)
      );
      if (!row) return null;
      Object.assign(row, patch);
      return row;
    },
    async listPublicationBlockers(organizationId, projectId, planId) {
      return state.publicationBlockers.filter(
        (r) =>
          r.organization_id === organizationId &&
          r.web_project_id === Number(projectId) &&
          r.publication_plan_id === Number(planId)
      );
    },
    async getCompletionHandoff(organizationId, projectId, planId) {
      return (
        state.completionHandoffs.find(
          (r) =>
            r.organization_id === organizationId &&
            r.web_project_id === Number(projectId) &&
            r.publication_plan_id === Number(planId)
        ) || null
      );
    },
    async insertCompletionHandoff(row) {
      const created = {
        ...row,
        id: state.seq.completionHandoff++,
        payload: row.payload || {},
        created_at: now()
      };
      state.completionHandoffs.push(created);
      return created;
    }
  };
}

function createSqlPublicationMethods(db) {
  return {
    async getPublicationHandoffForProject(organizationId, projectId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, validation_handoff_id, validation_plan_id,
                validation_run_id, schema_version, payload, readiness_state, override_used,
                override_reason, created_by, created_at
         FROM web_project_publication_handoffs
         WHERE organization_id = $1 AND web_project_id = $2
         ORDER BY created_at DESC LIMIT 1`,
        [organizationId, projectId]
      );
      return result.rows[0] || null;
    },
    async getActivePublicationPlan(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${PUB_PLAN_COLS} FROM web_project_publication_plans
         WHERE organization_id = $1 AND web_project_id = $2 AND status = 'ACTIVE'
         ORDER BY id DESC LIMIT 1`,
        [organizationId, projectId]
      );
      return result.rows[0] || null;
    },
    async insertPublicationPlan(row) {
      const result = await db.query(
        `INSERT INTO web_project_publication_plans (
           organization_id, web_project_id, publication_handoff_id, validation_plan_id,
           status, target_hostname, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING ${PUB_PLAN_COLS}`,
        [
          row.organization_id,
          row.web_project_id,
          row.publication_handoff_id,
          row.validation_plan_id,
          row.status || "ACTIVE",
          row.target_hostname ?? null,
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    },
    async listPublicationSteps(organizationId, projectId, planId) {
      const result = await db.query(
        `SELECT ${PUB_STEP_COLS} FROM web_project_publication_steps
         WHERE organization_id = $1 AND web_project_id = $2 AND publication_plan_id = $3
         ORDER BY sort_order ASC, id ASC`,
        [organizationId, projectId, planId]
      );
      return result.rows;
    },
    async getPublicationStep(organizationId, projectId, stepId) {
      const result = await db.query(
        `SELECT ${PUB_STEP_COLS} FROM web_project_publication_steps
         WHERE organization_id = $1 AND web_project_id = $2 AND id = $3`,
        [organizationId, projectId, stepId]
      );
      return result.rows[0] || null;
    },
    async insertPublicationStep(row) {
      const result = await db.query(
        `INSERT INTO web_project_publication_steps (
           organization_id, web_project_id, publication_plan_id, step_type, title, description,
           status, priority, required, sort_order, notes, evidence_url, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING ${PUB_STEP_COLS}`,
        [
          row.organization_id,
          row.web_project_id,
          row.publication_plan_id,
          row.step_type,
          row.title,
          row.description ?? null,
          row.status || "TODO",
          row.priority || "MEDIUM",
          Boolean(row.required),
          row.sort_order ?? 0,
          row.notes ?? null,
          row.evidence_url ?? null,
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    },
    async updatePublicationStep(organizationId, projectId, stepId, patch) {
      const sets = [];
      const values = [];
      let idx = 4;
      for (const [key, val] of Object.entries(patch)) {
        sets.push(`${key} = $${idx++}`);
        values.push(val);
      }
      if (!sets.length) return this.getPublicationStep(organizationId, projectId, stepId);
      sets.push("updated_at = NOW()");
      const result = await db.query(
        `UPDATE web_project_publication_steps SET ${sets.join(", ")}
         WHERE id = $1 AND organization_id = $2 AND web_project_id = $3
         RETURNING ${PUB_STEP_COLS}`,
        [stepId, organizationId, projectId, ...values]
      );
      return result.rows[0] || null;
    },
    async insertPublicationBlocker(row) {
      const result = await db.query(
        `INSERT INTO web_project_publication_blockers (
           organization_id, web_project_id, publication_plan_id, publication_step_id,
           blocker_type, description, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, organization_id, web_project_id, publication_plan_id, publication_step_id,
                   blocker_type, description, created_by, created_at, resolved_at, resolved_by, resolution_note`,
        [
          row.organization_id,
          row.web_project_id,
          row.publication_plan_id,
          row.publication_step_id,
          row.blocker_type,
          row.description,
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    },
    async updatePublicationBlocker(organizationId, projectId, blockerId, patch) {
      const sets = [];
      const values = [];
      let idx = 4;
      for (const [key, val] of Object.entries(patch)) {
        sets.push(`${key} = $${idx++}`);
        values.push(val);
      }
      if (!sets.length) return null;
      const result = await db.query(
        `UPDATE web_project_publication_blockers SET ${sets.join(", ")}
         WHERE id = $1 AND organization_id = $2 AND web_project_id = $3
         RETURNING id, organization_id, web_project_id, publication_plan_id, publication_step_id,
                   blocker_type, description, created_by, created_at, resolved_at, resolved_by, resolution_note`,
        [blockerId, organizationId, projectId, ...values]
      );
      return result.rows[0] || null;
    },
    async listPublicationBlockers(organizationId, projectId, planId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, publication_plan_id, publication_step_id,
                blocker_type, description, created_by, created_at, resolved_at, resolved_by, resolution_note
         FROM web_project_publication_blockers
         WHERE organization_id = $1 AND web_project_id = $2 AND publication_plan_id = $3`,
        [organizationId, projectId, planId]
      );
      return result.rows;
    },
    async getCompletionHandoff(organizationId, projectId, planId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, publication_handoff_id, publication_plan_id,
                schema_version, payload, readiness_state, override_used, override_reason,
                created_by, created_at
         FROM web_project_completion_handoffs
         WHERE organization_id = $1 AND web_project_id = $2 AND publication_plan_id = $3`,
        [organizationId, projectId, planId]
      );
      return result.rows[0] || null;
    },
    async insertCompletionHandoff(row) {
      const result = await db.query(
        `INSERT INTO web_project_completion_handoffs (
           organization_id, web_project_id, publication_handoff_id, publication_plan_id,
           schema_version, payload, readiness_state, override_used, override_reason, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id, organization_id, web_project_id, publication_handoff_id, publication_plan_id,
                   schema_version, payload, readiness_state, override_used, override_reason,
                   created_by, created_at`,
        [
          row.organization_id,
          row.web_project_id,
          row.publication_handoff_id,
          row.publication_plan_id,
          row.schema_version,
          JSON.stringify(row.payload || {}),
          row.readiness_state,
          Boolean(row.override_used),
          row.override_reason ?? null,
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    }
  };
}

module.exports = {
  createMemoryPublicationMethods,
  createSqlPublicationMethods
};
