const { createMemoryDevelopmentMethods } = require("./developmentStore");
const { createMemoryValidationMethods } = require("./validationStore");
const { createMemoryPublicationMethods } = require("./publicationStore");

let clock = Date.now();

function now() {
  clock += 1;
  return new Date(clock).toISOString();
}

function cloneRows(rows) {
  return rows.map((row) => (Array.isArray(row) ? [...row] : { ...row }));
}

function createMemoryStore() {
  const state = {
    projects: [],
    items: [],
    documents: [],
    comments: [],
    reviews: [],
    formResponses: [],
    credentials: [],
    briefNotes: [],
    handoffs: [],
    architectures: [],
    architecturePages: [],
    architectureBlocks: [],
    mockups: [],
    mockupPages: [],
    mockupSections: [],
    activity: [],
    seq: {
      project: 1,
      item: 1,
      comment: 1,
      review: 1,
      form: 1,
      note: 1,
      handoff: 1,
      architecture: 1,
      architecturePage: 1,
      architectureBlock: 1,
      mockup: 1,
      mockupPage: 1,
      mockupSection: 1
    }
  };

  const store = {
    state,
    async withTransaction(work) {
      const snapshot = {
        projects: cloneRows(state.projects),
        items: cloneRows(state.items),
        documents: cloneRows(state.documents),
        comments: cloneRows(state.comments),
        reviews: cloneRows(state.reviews),
        formResponses: cloneRows(state.formResponses),
        credentials: cloneRows(state.credentials),
        briefNotes: cloneRows(state.briefNotes),
        handoffs: cloneRows(state.handoffs),
        architectures: cloneRows(state.architectures),
        architecturePages: cloneRows(state.architecturePages),
        architectureBlocks: cloneRows(state.architectureBlocks),
        mockups: cloneRows(state.mockups),
        mockupPages: cloneRows(state.mockupPages),
        mockupSections: cloneRows(state.mockupSections),
        activity: cloneRows(state.activity),
        seq: { ...state.seq }
      };
      try {
        return await work(store);
      } catch (err) {
        state.projects.splice(0, state.projects.length, ...snapshot.projects);
        state.items.splice(0, state.items.length, ...snapshot.items);
        state.documents.splice(0, state.documents.length, ...snapshot.documents);
        state.comments.splice(0, state.comments.length, ...snapshot.comments);
        state.reviews.splice(0, state.reviews.length, ...snapshot.reviews);
        state.formResponses.splice(0, state.formResponses.length, ...snapshot.formResponses);
        state.credentials.splice(0, state.credentials.length, ...snapshot.credentials);
        state.briefNotes.splice(0, state.briefNotes.length, ...snapshot.briefNotes);
        state.handoffs.splice(0, state.handoffs.length, ...snapshot.handoffs);
        state.architectures.splice(0, state.architectures.length, ...snapshot.architectures);
        state.architecturePages.splice(0, state.architecturePages.length, ...snapshot.architecturePages);
        state.architectureBlocks.splice(0, state.architectureBlocks.length, ...snapshot.architectureBlocks);
        state.mockups.splice(0, state.mockups.length, ...snapshot.mockups);
        state.mockupPages.splice(0, state.mockupPages.length, ...snapshot.mockupPages);
        state.mockupSections.splice(0, state.mockupSections.length, ...snapshot.mockupSections);
        state.activity.splice(0, state.activity.length, ...snapshot.activity);
        Object.assign(state.seq, snapshot.seq);
        throw err;
      }
    },
    async insertProject(row) {
      const project = {
        ...row,
        id: state.seq.project++,
        created_at: now(),
        updated_at: now(),
        archived_at: null,
        archived_by: null,
        archive_reason: null,
        completed_at: row.completed_at || null,
        submitted_for_review_at: row.submitted_for_review_at || null
      };
      state.projects.push(project);
      return project;
    },
    async listProjects(organizationId, { includeArchived = false } = {}) {
      return state.projects.filter(
        (project) =>
          project.organization_id === organizationId && (includeArchived || !project.archived_at)
      );
    },
    async getProject(organizationId, id) {
      return (
        state.projects.find(
          (project) => project.id === Number(id) && project.organization_id === organizationId
        ) || null
      );
    },
    async updateProject(organizationId, id, patch) {
      const project = await store.getProject(organizationId, id);
      if (!project) return null;
      for (const [key, value] of Object.entries(patch || {})) {
        if (value !== undefined) project[key] = value;
      }
      project.updated_at = now();
      return project;
    },
    async archiveProjectFirst(organizationId, id, patch) {
      const project = await store.getProject(organizationId, id);
      if (!project) return null;
      if (project.archived_at) return project;
      project.archived_at = patch.archived_at;
      project.archived_by = patch.archived_by ?? null;
      project.archive_reason = patch.archive_reason ?? null;
      project.updated_at = now();
      return project;
    },
    async insertItem(row) {
      const item = {
        ...row,
        id: state.seq.item++,
        created_at: now(),
        updated_at: now(),
        archived_at: null
      };
      state.items.push(item);
      return item;
    },
    async getItem(organizationId, projectId, itemId) {
      return (
        state.items.find(
          (item) =>
            item.organization_id === organizationId &&
            item.web_project_id === Number(projectId) &&
            item.id === Number(itemId)
        ) || null
      );
    },
    async updateItem(organizationId, projectId, itemId, patch) {
      const item = await store.getItem(organizationId, projectId, itemId);
      if (!item) return null;
      for (const [key, value] of Object.entries(patch || {})) {
        if (value !== undefined) item[key] = value;
      }
      item.updated_at = now();
      return item;
    },
    async listItems(organizationId, projectId) {
      return state.items.filter(
        (item) => item.organization_id === organizationId && item.web_project_id === Number(projectId)
      );
    },
    async upsertFormResponse(row) {
      const existing = state.formResponses.find(
        (item) =>
          item.web_project_id === row.web_project_id &&
          item.organization_id === row.organization_id &&
          item.schema_version === row.schema_version &&
          item.field_key === row.field_key
      );
      if (existing) {
        existing.value = row.value;
        existing.updated_by = row.updated_by;
        existing.updated_at = now();
        return existing;
      }
      const created = { ...row, id: state.seq.form++, created_at: now(), updated_at: now() };
      state.formResponses.push(created);
      return created;
    },
    async listFormResponses(organizationId, projectId) {
      return state.formResponses.filter(
        (item) => item.organization_id === organizationId && item.web_project_id === Number(projectId)
      );
    },
    async insertDocument(row) {
      const document = {
        ...row,
        upload_status: row.upload_status || "PENDING",
        stored_at: row.stored_at || null,
        failed_at: row.failed_at || null,
        replaces_document_id: row.replaces_document_id ?? null,
        created_at: now(),
        deleted_at: null
      };
      state.documents.push(document);
      return document;
    },
    async listDocuments(organizationId, projectId) {
      return state.documents.filter(
        (item) =>
          item.organization_id === organizationId &&
          item.web_project_id === Number(projectId) &&
          item.status === "AVAILABLE"
      );
    },
    async getDocument(organizationId, projectId, documentId) {
      return (
        state.documents.find(
          (item) =>
            item.organization_id === organizationId &&
            item.web_project_id === Number(projectId) &&
            item.id === documentId
        ) || null
      );
    },
    async insertComment(row) {
      const comment = { ...row, id: state.seq.comment++, created_at: now(), archived_at: null };
      state.comments.push(comment);
      return comment;
    },
    async listComments(organizationId, projectId) {
      return state.comments.filter(
        (item) => item.organization_id === organizationId && item.web_project_id === Number(projectId)
      );
    },
    async insertReview(row) {
      const review = {
        ...row,
        id: state.seq.review++,
        created_at: now(),
        target_type: row.target_type || "PROJECT",
        target_id: row.target_id ?? null,
        target_key: row.target_key ?? null,
        correction_message: row.correction_message ?? null,
        schema_version: row.schema_version ?? null
      };
      state.reviews.push(review);
      return review;
    },
    async listReviews(organizationId, projectId) {
      return state.reviews.filter(
        (item) => item.organization_id === organizationId && item.web_project_id === Number(projectId)
      );
    },
    async upsertCredentialStatus(row) {
      const existing = state.credentials.find((item) => item.web_project_id === row.web_project_id);
      if (existing) {
        existing.status = row.status;
        existing.updated_by = row.updated_by;
        existing.updated_at = now();
        return existing;
      }
      const created = { ...row, updated_at: now() };
      state.credentials.push(created);
      return created;
    },
    async getCredentialStatus(organizationId, projectId) {
      return (
        state.credentials.find(
          (item) =>
            item.organization_id === organizationId && item.web_project_id === Number(projectId)
        ) || null
      );
    },
    async insertBriefNote(row) {
      const note = {
        ...row,
        id: state.seq.note++,
        status: row.status || "OPEN",
        blocking: Boolean(row.blocking),
        severity: row.severity || null,
        resolution_note: row.resolution_note || null,
        created_at: now(),
        updated_at: now(),
        resolved_at: row.resolved_at || null
      };
      state.briefNotes.push(note);
      return note;
    },
    async getBriefNote(organizationId, projectId, noteId) {
      return (
        state.briefNotes.find(
          (item) =>
            item.organization_id === organizationId &&
            item.web_project_id === Number(projectId) &&
            item.id === Number(noteId)
        ) || null
      );
    },
    async listBriefNotes(organizationId, projectId) {
      return state.briefNotes.filter(
        (item) => item.organization_id === organizationId && item.web_project_id === Number(projectId)
      );
    },
    async updateBriefNote(organizationId, projectId, noteId, patch) {
      const note = await store.getBriefNote(organizationId, projectId, noteId);
      if (!note) return null;
      for (const [key, value] of Object.entries(patch || {})) {
        if (value !== undefined) note[key] = value;
      }
      note.updated_at = now();
      return note;
    },
    async insertArchitectureHandoff(row) {
      const existing = await store.getArchitectureHandoff(row.organization_id, row.web_project_id);
      if (existing) return existing;
      const handoff = {
        ...row,
        id: state.seq.handoff++,
        created_at: now(),
        override_used: Boolean(row.override_used),
        override_reason: row.override_reason || null
      };
      state.handoffs.push(handoff);
      return handoff;
    },
    async getArchitectureHandoff(organizationId, projectId) {
      return (
        state.handoffs.find(
          (item) =>
            item.organization_id === organizationId && item.web_project_id === Number(projectId)
        ) || null
      );
    },
    async listArchitectures(organizationId, projectId) {
      return state.architectures
        .filter(
          (row) => row.organization_id === organizationId && row.web_project_id === Number(projectId)
        )
        .sort((a, b) => a.version - b.version);
    },
    async getArchitecture(organizationId, projectId, architectureId) {
      return (
        state.architectures.find(
          (row) =>
            row.organization_id === organizationId &&
            row.web_project_id === Number(projectId) &&
            row.id === Number(architectureId)
        ) || null
      );
    },
    async getDraftArchitecture(organizationId, projectId) {
      return (
        state.architectures.find(
          (row) =>
            row.organization_id === organizationId &&
            row.web_project_id === Number(projectId) &&
            row.status === "DRAFT"
        ) || null
      );
    },
    async getCurrentApprovedArchitecture(organizationId, projectId) {
      const approved = state.architectures.filter(
        (row) =>
          row.organization_id === organizationId &&
          row.web_project_id === Number(projectId) &&
          row.status === "APPROVED"
      );
      return approved.sort((a, b) => b.version - a.version)[0] || null;
    },
    async insertArchitecture(row) {
      const created = {
        ...row,
        id: state.seq.architecture++,
        status: row.status || "DRAFT",
        additional_languages: row.additional_languages || [],
        language_selector_required: Boolean(row.language_selector_required),
        metadata: row.metadata || {},
        created_at: now(),
        updated_at: now(),
        approved_by: null,
        approved_at: null,
        supersedes_architecture_id: row.supersedes_architecture_id || null
      };
      state.architectures.push(created);
      return created;
    },
    async updateArchitecture(organizationId, projectId, architectureId, patch) {
      const row = await store.getArchitecture(organizationId, projectId, architectureId);
      if (!row) return null;
      for (const [key, value] of Object.entries(patch || {})) {
        if (value !== undefined) row[key] = value;
      }
      row.updated_at = now();
      return row;
    },
    async listArchitecturePages(organizationId, projectId, architectureId) {
      return state.architecturePages
        .filter(
          (row) =>
            row.organization_id === organizationId &&
            row.web_project_id === Number(projectId) &&
            row.architecture_id === Number(architectureId) &&
            !row.archived_at
        )
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    async getArchitecturePage(organizationId, projectId, pageId) {
      return (
        state.architecturePages.find(
          (row) =>
            row.organization_id === organizationId &&
            row.web_project_id === Number(projectId) &&
            row.id === Number(pageId)
        ) || null
      );
    },
    async insertArchitecturePage(row) {
      const created = {
        ...row,
        id: state.seq.architecturePage++,
        created_at: now(),
        updated_at: now(),
        archived_at: null
      };
      state.architecturePages.push(created);
      return created;
    },
    async updateArchitecturePage(organizationId, projectId, pageId, patch) {
      const row = await store.getArchitecturePage(organizationId, projectId, pageId);
      if (!row) return null;
      for (const [key, value] of Object.entries(patch || {})) {
        if (value !== undefined) row[key] = value;
      }
      row.updated_at = now();
      return row;
    },
    async listArchitectureBlocks(organizationId, projectId, architectureId) {
      return state.architectureBlocks
        .filter(
          (row) =>
            row.organization_id === organizationId &&
            row.web_project_id === Number(projectId) &&
            row.architecture_id === Number(architectureId) &&
            !row.archived_at
        )
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    async getArchitectureBlock(organizationId, projectId, blockId) {
      return (
        state.architectureBlocks.find(
          (row) =>
            row.organization_id === organizationId &&
            row.web_project_id === Number(projectId) &&
            row.id === Number(blockId)
        ) || null
      );
    },
    async insertArchitectureBlock(row) {
      const created = {
        ...row,
        id: state.seq.architectureBlock++,
        required: Boolean(row.required),
        created_at: now(),
        updated_at: now(),
        archived_at: null
      };
      state.architectureBlocks.push(created);
      return created;
    },
    async updateArchitectureBlock(organizationId, projectId, blockId, patch) {
      const row = await store.getArchitectureBlock(organizationId, projectId, blockId);
      if (!row) return null;
      for (const [key, value] of Object.entries(patch || {})) {
        if (value !== undefined) row[key] = value;
      }
      row.updated_at = now();
      return row;
    },
    async listMockups(organizationId, projectId) {
      return state.mockups
        .filter(
          (row) => row.organization_id === organizationId && row.web_project_id === Number(projectId)
        )
        .sort((a, b) => a.version - b.version);
    },
    async getMockup(organizationId, projectId, mockupId) {
      return (
        state.mockups.find(
          (row) =>
            row.organization_id === organizationId &&
            row.web_project_id === Number(projectId) &&
            row.id === Number(mockupId)
        ) || null
      );
    },
    async getActiveMockup(organizationId, projectId) {
      const rows = state.mockups.filter(
        (row) =>
          row.organization_id === organizationId &&
          row.web_project_id === Number(projectId) &&
          ["DRAFT", "INTERNAL_REVIEW"].includes(row.status)
      );
      return rows.sort((a, b) => b.version - a.version)[0] || null;
    },
    async getCurrentApprovedMockup(organizationId, projectId) {
      const rows = state.mockups.filter(
        (row) =>
          row.organization_id === organizationId &&
          row.web_project_id === Number(projectId) &&
          row.status === "APPROVED"
      );
      return rows.sort((a, b) => b.version - a.version)[0] || null;
    },
    async getClientVisibleMockup(organizationId, projectId) {
      const rows = state.mockups.filter(
        (row) =>
          row.organization_id === organizationId &&
          row.web_project_id === Number(projectId) &&
          ["CLIENT_REVIEW", "APPROVED"].includes(row.status)
      );
      return (
        rows.sort((a, b) => {
          if (a.status === "CLIENT_REVIEW" && b.status !== "CLIENT_REVIEW") return -1;
          if (b.status === "CLIENT_REVIEW" && a.status !== "CLIENT_REVIEW") return 1;
          return b.version - a.version;
        })[0] || null
      );
    },
    async getChangesRequestedMockup(organizationId, projectId) {
      const rows = state.mockups.filter(
        (row) =>
          row.organization_id === organizationId &&
          row.web_project_id === Number(projectId) &&
          row.status === "CHANGES_REQUESTED"
      );
      return rows.sort((a, b) => b.version - a.version)[0] || null;
    },
    async insertMockup(row) {
      const created = {
        ...row,
        web_project_id: Number(row.web_project_id),
        id: state.seq.mockup++,
        status: row.status || "DRAFT",
        visual_direction: row.visual_direction || {},
        design_tokens: row.design_tokens || {},
        header_variant: row.header_variant || "STANDARD",
        footer_variant: row.footer_variant || "STANDARD",
        metadata: row.metadata || {},
        created_at: now(),
        updated_at: now(),
        approved_by: null,
        approved_at: null,
        sent_to_client_at: null,
        sent_to_client_by: null,
        supersedes_mockup_id: row.supersedes_mockup_id || null
      };
      state.mockups.push(created);
      return created;
    },
    async updateMockup(organizationId, projectId, mockupId, patch) {
      const row = await store.getMockup(organizationId, projectId, mockupId);
      if (!row) return null;
      for (const [key, value] of Object.entries(patch || {})) {
        if (value !== undefined) row[key] = value;
      }
      row.updated_at = now();
      return row;
    },
    async listMockupPages(organizationId, projectId, mockupId) {
      return state.mockupPages
        .filter(
          (row) =>
            row.organization_id === organizationId &&
            row.web_project_id === Number(projectId) &&
            row.mockup_id === Number(mockupId) &&
            !row.archived_at
        )
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    async getMockupPage(organizationId, projectId, pageId) {
      return (
        state.mockupPages.find(
          (row) =>
            row.organization_id === organizationId &&
            row.web_project_id === Number(projectId) &&
            row.id === Number(pageId)
        ) || null
      );
    },
    async insertMockupPage(row) {
      const created = {
        ...row,
        id: state.seq.mockupPage++,
        status: row.status || "DRAFT",
        responsive_settings: row.responsive_settings || {},
        created_at: now(),
        updated_at: now(),
        archived_at: null
      };
      state.mockupPages.push(created);
      return created;
    },
    async updateMockupPage(organizationId, projectId, pageId, patch) {
      const row = await store.getMockupPage(organizationId, projectId, pageId);
      if (!row) return null;
      for (const [key, value] of Object.entries(patch || {})) {
        if (value !== undefined) row[key] = value;
      }
      row.updated_at = now();
      return row;
    },
    async listMockupSections(organizationId, projectId, mockupId) {
      return state.mockupSections
        .filter(
          (row) =>
            row.organization_id === organizationId &&
            row.web_project_id === Number(projectId) &&
            row.mockup_id === Number(mockupId) &&
            !row.archived_at
        )
        .sort((a, b) => a.sort_order - b.sort_order);
    },
    async getMockupSection(organizationId, projectId, sectionId) {
      return (
        state.mockupSections.find(
          (row) =>
            row.organization_id === organizationId &&
            row.web_project_id === Number(projectId) &&
            row.id === Number(sectionId)
        ) || null
      );
    },
    async insertMockupSection(row) {
      const created = {
        ...row,
        id: state.seq.mockupSection++,
        variant: row.variant || "DEFAULT",
        alignment: row.alignment || "CENTER",
        density: row.density || "NORMAL",
        visual_props: row.visual_props || {},
        required: Boolean(row.required),
        created_at: now(),
        updated_at: now(),
        archived_at: null
      };
      state.mockupSections.push(created);
      return created;
    },
    async updateMockupSection(organizationId, projectId, sectionId, patch) {
      const row = await store.getMockupSection(organizationId, projectId, sectionId);
      if (!row) return null;
      for (const [key, value] of Object.entries(patch || {})) {
        if (value !== undefined) row[key] = value;
      }
      row.updated_at = now();
      return row;
    },
    async insertActivityLog(row) {
      const log = { ...row, id: state.activity.length + 1, created_at: now() };
      state.activity.push(log);
      return log;
    },
    ...createMemoryDevelopmentMethods(state, { now }),
    ...createMemoryValidationMethods(state, { now }),
    ...createMemoryPublicationMethods(state, { now })
  };

  return store;
}

module.exports = { createMemoryStore };
