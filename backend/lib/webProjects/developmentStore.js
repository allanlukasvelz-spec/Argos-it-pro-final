/** Shared development persistence helpers for sqlStore and memoryStore. */

const DEV_HANDOFF_COLS = `id, organization_id, web_project_id, architecture_id, architecture_version,
  mockup_id, mockup_version, mockup_approved_at, mockup_approved_by, schema_version, payload,
  created_by, created_at`;

const DEV_PLAN_COLS = `id, organization_id, web_project_id, handoff_id, version, status,
  created_by, created_at, updated_at`;

const DEV_ITEM_COLS = `id, organization_id, web_project_id, development_plan_id, item_type, title,
  description, architecture_page_id, architecture_block_id, mockup_page_id, mockup_section_id,
  status, priority, content_readiness, sort_order, required, assigned_to, started_at,
  completed_at, created_by, created_at, updated_at`;

function createMemoryDevelopmentMethods(state, { now, seqKey = "development" }) {
  if (!state.developmentHandoffs) state.developmentHandoffs = [];
  if (!state.developmentPlans) state.developmentPlans = [];
  if (!state.developmentItems) state.developmentItems = [];
  if (!state.developmentChecklist) state.developmentChecklist = [];
  if (!state.developmentDependencies) state.developmentDependencies = [];
  if (!state.developmentBlockers) state.developmentBlockers = [];
  if (!state.validationHandoffs) state.validationHandoffs = [];
  if (!state.seq.developmentHandoff) state.seq.developmentHandoff = 1;
  if (!state.seq.developmentPlan) state.seq.developmentPlan = 1;
  if (!state.seq.developmentItem) state.seq.developmentItem = 1;
  if (!state.seq.developmentChecklist) state.seq.developmentChecklist = 1;
  if (!state.seq.developmentDependency) state.seq.developmentDependency = 1;
  if (!state.seq.developmentBlocker) state.seq.developmentBlocker = 1;
  if (!state.seq.validationHandoff) state.seq.validationHandoff = 1;

  return {
    async getDevelopmentHandoff(organizationId, projectId) {
      return (
        state.developmentHandoffs.find(
          (r) => r.organization_id === organizationId && r.web_project_id === Number(projectId)
        ) || null
      );
    },
    async insertDevelopmentHandoff(row) {
      const created = {
        ...row,
        id: state.seq.developmentHandoff++,
        payload: row.payload || {},
        created_at: now()
      };
      state.developmentHandoffs.push(created);
      return created;
    },
    async getActiveDevelopmentPlan(organizationId, projectId) {
      return (
        state.developmentPlans
          .filter(
            (r) =>
              r.organization_id === organizationId &&
              r.web_project_id === Number(projectId) &&
              r.status === "ACTIVE"
          )
          .sort((a, b) => b.version - a.version)[0] || null
      );
    },
    async insertDevelopmentPlan(row) {
      const created = {
        ...row,
        id: state.seq.developmentPlan++,
        status: row.status || "ACTIVE",
        created_at: now(),
        updated_at: now()
      };
      state.developmentPlans.push(created);
      return created;
    },
    async listDevelopmentItems(organizationId, projectId, planId) {
      return state.developmentItems
        .filter(
          (r) =>
            r.organization_id === organizationId &&
            r.web_project_id === Number(projectId) &&
            r.development_plan_id === Number(planId)
        )
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    async getDevelopmentItem(organizationId, projectId, itemId) {
      return (
        state.developmentItems.find(
          (r) =>
            r.organization_id === organizationId &&
            r.web_project_id === Number(projectId) &&
            r.id === Number(itemId)
        ) || null
      );
    },
    async insertDevelopmentItem(row) {
      const created = {
        ...row,
        id: state.seq.developmentItem++,
        status: row.status || "TODO",
        created_at: now(),
        updated_at: now()
      };
      state.developmentItems.push(created);
      return created;
    },
    async updateDevelopmentItem(organizationId, projectId, itemId, patch) {
      const row = await this.getDevelopmentItem(organizationId, projectId, itemId);
      if (!row) return null;
      Object.assign(row, patch, { updated_at: now() });
      return row;
    },
    async insertDevelopmentChecklistEntry(row) {
      const created = {
        ...row,
        id: state.seq.developmentChecklist++,
        created_at: now(),
        updated_at: now()
      };
      state.developmentChecklist.push(created);
      return created;
    },
    async listDevelopmentChecklist(organizationId, projectId, itemId) {
      return state.developmentChecklist
        .filter(
          (r) =>
            r.organization_id === organizationId &&
            r.web_project_id === Number(projectId) &&
            r.development_item_id === Number(itemId)
        )
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    async listDevelopmentChecklistForPlan(organizationId, projectId, planId) {
      const itemIds = new Set(
        state.developmentItems
          .filter((r) => r.development_plan_id === Number(planId))
          .map((r) => r.id)
      );
      return state.developmentChecklist.filter(
        (r) =>
          r.organization_id === organizationId &&
          r.web_project_id === Number(projectId) &&
          itemIds.has(r.development_item_id)
      );
    },
    async insertDevelopmentDependency(row) {
      const created = { ...row, id: state.seq.developmentDependency++, created_at: now() };
      state.developmentDependencies.push(created);
      return created;
    },
    async listDevelopmentDependencies(organizationId, projectId, planId) {
      return state.developmentDependencies.filter(
        (r) =>
          r.organization_id === organizationId &&
          r.web_project_id === Number(projectId) &&
          r.development_plan_id === Number(planId)
      );
    },
    async insertDevelopmentBlocker(row) {
      const created = { ...row, id: state.seq.developmentBlocker++, created_at: now() };
      state.developmentBlockers.push(created);
      return created;
    },
    async updateDevelopmentBlocker(organizationId, projectId, blockerId, patch) {
      const row = state.developmentBlockers.find(
        (r) =>
          r.organization_id === organizationId &&
          r.web_project_id === Number(projectId) &&
          r.id === Number(blockerId)
      );
      if (!row) return null;
      Object.assign(row, patch);
      return row;
    },
    async listDevelopmentBlockers(organizationId, projectId, planId) {
      const itemIds = new Set(
        state.developmentItems
          .filter((r) => r.development_plan_id === Number(planId))
          .map((r) => r.id)
      );
      return state.developmentBlockers.filter(
        (r) =>
          r.organization_id === organizationId &&
          r.web_project_id === Number(projectId) &&
          itemIds.has(r.development_item_id)
      );
    },
    async getValidationHandoff(organizationId, projectId, planId) {
      return (
        state.validationHandoffs.find(
          (r) =>
            r.organization_id === organizationId &&
            r.web_project_id === Number(projectId) &&
            r.development_plan_id === Number(planId)
        ) || null
      );
    },
    async insertValidationHandoff(row) {
      const created = {
        ...row,
        id: state.seq.validationHandoff++,
        payload: row.payload || {},
        created_at: now()
      };
      state.validationHandoffs.push(created);
      return created;
    }
  };
}

function createSqlDevelopmentMethods(db) {
  return {
    async getDevelopmentHandoff(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${DEV_HANDOFF_COLS} FROM web_project_development_handoffs
         WHERE organization_id = $1 AND web_project_id = $2`,
        [organizationId, projectId]
      );
      return result.rows[0] || null;
    },
    async insertDevelopmentHandoff(row) {
      const result = await db.query(
        `INSERT INTO web_project_development_handoffs (
           organization_id, web_project_id, architecture_id, architecture_version,
           mockup_id, mockup_version, mockup_approved_at, mockup_approved_by,
           schema_version, payload, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING ${DEV_HANDOFF_COLS}`,
        [
          row.organization_id,
          row.web_project_id,
          row.architecture_id,
          row.architecture_version,
          row.mockup_id,
          row.mockup_version,
          row.mockup_approved_at ?? null,
          row.mockup_approved_by ?? null,
          row.schema_version,
          JSON.stringify(row.payload || {}),
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    },
    async getActiveDevelopmentPlan(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${DEV_PLAN_COLS} FROM web_project_development_plans
         WHERE organization_id = $1 AND web_project_id = $2 AND status = 'ACTIVE'
         ORDER BY version DESC LIMIT 1`,
        [organizationId, projectId]
      );
      return result.rows[0] || null;
    },
    async insertDevelopmentPlan(row) {
      const result = await db.query(
        `INSERT INTO web_project_development_plans (
           organization_id, web_project_id, handoff_id, version, status, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING ${DEV_PLAN_COLS}`,
        [
          row.organization_id,
          row.web_project_id,
          row.handoff_id,
          row.version,
          row.status || "ACTIVE",
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    },
    async listDevelopmentItems(organizationId, projectId, planId) {
      const result = await db.query(
        `SELECT ${DEV_ITEM_COLS} FROM web_project_development_items
         WHERE organization_id = $1 AND web_project_id = $2 AND development_plan_id = $3
         ORDER BY sort_order ASC, id ASC`,
        [organizationId, projectId, planId]
      );
      return result.rows;
    },
    async getDevelopmentItem(organizationId, projectId, itemId) {
      const result = await db.query(
        `SELECT ${DEV_ITEM_COLS} FROM web_project_development_items
         WHERE organization_id = $1 AND web_project_id = $2 AND id = $3`,
        [organizationId, projectId, itemId]
      );
      return result.rows[0] || null;
    },
    async insertDevelopmentItem(row) {
      const result = await db.query(
        `INSERT INTO web_project_development_items (
           organization_id, web_project_id, development_plan_id, item_type, title, description,
           architecture_page_id, architecture_block_id, mockup_page_id, mockup_section_id,
           status, priority, content_readiness, sort_order, required, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING ${DEV_ITEM_COLS}`,
        [
          row.organization_id,
          row.web_project_id,
          row.development_plan_id,
          row.item_type,
          row.title,
          row.description ?? null,
          row.architecture_page_id ?? null,
          row.architecture_block_id ?? null,
          row.mockup_page_id ?? null,
          row.mockup_section_id ?? null,
          row.status || "TODO",
          row.priority || "MEDIUM",
          row.content_readiness || "NOT_APPLICABLE",
          row.sort_order ?? 0,
          Boolean(row.required),
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    },
    async updateDevelopmentItem(organizationId, projectId, itemId, patch) {
      const sets = [];
      const values = [];
      let idx = 4;
      for (const [key, val] of Object.entries(patch)) {
        sets.push(`${key} = $${idx++}`);
        values.push(val);
      }
      if (!sets.length) return this.getDevelopmentItem(organizationId, projectId, itemId);
      sets.push("updated_at = NOW()");
      const result = await db.query(
        `UPDATE web_project_development_items SET ${sets.join(", ")}
         WHERE id = $1 AND organization_id = $2 AND web_project_id = $3
         RETURNING ${DEV_ITEM_COLS}`,
        [itemId, organizationId, projectId, ...values]
      );
      return result.rows[0] || null;
    },
    async insertDevelopmentChecklistEntry(row) {
      const result = await db.query(
        `INSERT INTO web_project_development_checklist_entries (
           organization_id, web_project_id, development_item_id, label, required, completed, sort_order
         ) VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, organization_id, web_project_id, development_item_id, label, required, completed, sort_order`,
        [
          row.organization_id,
          row.web_project_id,
          row.development_item_id,
          row.label,
          Boolean(row.required),
          Boolean(row.completed),
          row.sort_order ?? 0
        ]
      );
      return result.rows[0];
    },
    async listDevelopmentChecklist(organizationId, projectId, itemId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, development_item_id, label, required, completed, sort_order
         FROM web_project_development_checklist_entries
         WHERE organization_id = $1 AND web_project_id = $2 AND development_item_id = $3
         ORDER BY sort_order ASC`,
        [organizationId, projectId, itemId]
      );
      return result.rows;
    },
    async listDevelopmentChecklistForPlan(organizationId, projectId, planId) {
      const result = await db.query(
        `SELECT c.id, c.organization_id, c.web_project_id, c.development_item_id, c.label,
                c.required, c.completed, c.sort_order
         FROM web_project_development_checklist_entries c
         JOIN web_project_development_items i ON i.id = c.development_item_id
         WHERE c.organization_id = $1 AND c.web_project_id = $2 AND i.development_plan_id = $3
         ORDER BY c.sort_order ASC`,
        [organizationId, projectId, planId]
      );
      return result.rows;
    },
    async insertDevelopmentDependency(row) {
      const result = await db.query(
        `INSERT INTO web_project_development_dependencies (
           organization_id, web_project_id, development_plan_id, item_id, depends_on_item_id
         ) VALUES ($1,$2,$3,$4,$5)
         RETURNING id, organization_id, web_project_id, development_plan_id, item_id, depends_on_item_id, created_at`,
        [
          row.organization_id,
          row.web_project_id,
          row.development_plan_id,
          row.item_id,
          row.depends_on_item_id
        ]
      );
      return result.rows[0];
    },
    async listDevelopmentDependencies(organizationId, projectId, planId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, development_plan_id, item_id, depends_on_item_id, created_at
         FROM web_project_development_dependencies
         WHERE organization_id = $1 AND web_project_id = $2 AND development_plan_id = $3`,
        [organizationId, projectId, planId]
      );
      return result.rows;
    },
    async insertDevelopmentBlocker(row) {
      const result = await db.query(
        `INSERT INTO web_project_development_blockers (
           organization_id, web_project_id, development_item_id, blocker_type, description, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id, organization_id, web_project_id, development_item_id, blocker_type, description,
                   created_by, created_at, resolved_at, resolved_by, resolution_note`,
        [
          row.organization_id,
          row.web_project_id,
          row.development_item_id,
          row.blocker_type,
          row.description,
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    },
    async updateDevelopmentBlocker(organizationId, projectId, blockerId, patch) {
      const sets = [];
      const values = [];
      let idx = 4;
      for (const [key, val] of Object.entries(patch)) {
        sets.push(`${key} = $${idx++}`);
        values.push(val);
      }
      if (!sets.length) return null;
      const result = await db.query(
        `UPDATE web_project_development_blockers SET ${sets.join(", ")}
         WHERE id = $1 AND organization_id = $2 AND web_project_id = $3
         RETURNING id, organization_id, web_project_id, development_item_id, blocker_type, description,
                   created_by, created_at, resolved_at, resolved_by, resolution_note`,
        [blockerId, organizationId, projectId, ...values]
      );
      return result.rows[0] || null;
    },
    async listDevelopmentBlockers(organizationId, projectId, planId) {
      const result = await db.query(
        `SELECT b.id, b.organization_id, b.web_project_id, b.development_item_id, b.blocker_type,
                b.description, b.created_by, b.created_at, b.resolved_at, b.resolved_by, b.resolution_note
         FROM web_project_development_blockers b
         JOIN web_project_development_items i ON i.id = b.development_item_id
         WHERE b.organization_id = $1 AND b.web_project_id = $2 AND i.development_plan_id = $3`,
        [organizationId, projectId, planId]
      );
      return result.rows;
    },
    async getValidationHandoff(organizationId, projectId, planId) {
      const result = await db.query(
        `SELECT id, organization_id, web_project_id, development_plan_id, schema_version, payload,
                readiness_state, override_used, override_reason, created_by, created_at
         FROM web_project_validation_handoffs
         WHERE organization_id = $1 AND web_project_id = $2 AND development_plan_id = $3`,
        [organizationId, projectId, planId]
      );
      return result.rows[0] || null;
    },
    async insertValidationHandoff(row) {
      const result = await db.query(
        `INSERT INTO web_project_validation_handoffs (
           organization_id, web_project_id, development_plan_id, schema_version, payload,
           readiness_state, override_used, override_reason, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id, organization_id, web_project_id, development_plan_id, schema_version, payload,
                   readiness_state, override_used, override_reason, created_by, created_at`,
        [
          row.organization_id,
          row.web_project_id,
          row.development_plan_id,
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
  createMemoryDevelopmentMethods,
  createSqlDevelopmentMethods,
  DEV_HANDOFF_COLS,
  DEV_PLAN_COLS,
  DEV_ITEM_COLS
};
