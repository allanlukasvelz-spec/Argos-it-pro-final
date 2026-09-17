const { createSqlDevelopmentMethods } = require("./developmentStore");
const { createSqlValidationMethods } = require("./validationStore");
const { createSqlPublicationMethods } = require("./publicationStore");

const PROJECT_COLUMNS = `id, organization_id, title, project_type, workflow_status,
  website_asset_id, website_hostname, created_by, created_at, updated_at,
  archived_at, archived_by, archive_reason, completed_at, submitted_for_review_at`;

const ITEM_COLUMNS = `id, web_project_id, organization_id, item_type, title, status,
  sort_order, payload, created_by, created_at, updated_at, archived_at`;

const DOCUMENT_COLUMNS = `id, web_project_id, organization_id, object_key, original_filename,
  requirement_key, declared_extension, mime_type, byte_length, sha256,
  scan_status, status, upload_status, stored_at, failed_at, replaces_document_id,
  created_by, created_at, deleted_at`;

const COMMENT_COLUMNS = `id, web_project_id, organization_id, body, created_by, created_at, archived_at`;

const REVIEW_COLUMNS = `id, web_project_id, organization_id, verdict, summary, target_type,
  target_id, target_key, correction_message, schema_version, created_by, created_at`;

const FORM_COLUMNS = `id, web_project_id, organization_id, schema_version, field_key, value,
  updated_by, created_at, updated_at`;

const CREDENTIAL_COLUMNS = `web_project_id, organization_id, status, updated_by, updated_at`;

const NOTE_COLUMNS = `id, organization_id, web_project_id, note_type, content, status,
  blocking, severity, resolution_note, created_by, created_at, updated_at, resolved_at`;

const HANDOFF_COLUMNS = `id, organization_id, web_project_id, schema_version, payload,
  readiness_state, override_used, override_reason, created_by, created_at`;

const ARCHITECTURE_COLUMNS = `id, organization_id, web_project_id, version, status,
  primary_language, additional_languages, language_selector_required, metadata,
  created_by, created_at, updated_at, approved_by, approved_at, supersedes_architecture_id`;

const ARCH_PAGE_COLUMNS = `id, organization_id, web_project_id, architecture_id, title, slug, route,
  page_type, template_type, parent_page_id, sort_order, navigation_placement, navigation_label,
  purpose, summary, primary_cta, secondary_cta, seo_priority, content_readiness,
  content_binding_type, content_binding_mode, source_page_item_id, migration_disposition,
  entity_count, archived_at, created_at, updated_at`;

const ARCH_BLOCK_COLUMNS = `id, organization_id, web_project_id, architecture_id, architecture_page_id,
  block_type, sort_order, title, purpose, notes, content_source_type, content_source_id,
  required, archived_at, created_at, updated_at`;

const ARCHITECTURE_PATCH_COLUMNS = Object.freeze([
  "status",
  "primary_language",
  "additional_languages",
  "language_selector_required",
  "metadata",
  "approved_by",
  "approved_at"
]);

const ARCH_PAGE_PATCH_COLUMNS = Object.freeze([
  "title",
  "slug",
  "route",
  "page_type",
  "template_type",
  "parent_page_id",
  "sort_order",
  "navigation_placement",
  "navigation_label",
  "purpose",
  "summary",
  "primary_cta",
  "secondary_cta",
  "seo_priority",
  "content_readiness",
  "content_binding_type",
  "content_binding_mode",
  "source_page_item_id",
  "migration_disposition",
  "entity_count",
  "archived_at"
]);

const ARCH_BLOCK_PATCH_COLUMNS = Object.freeze([
  "block_type",
  "sort_order",
  "title",
  "purpose",
  "notes",
  "content_source_type",
  "content_source_id",
  "required",
  "archived_at"
]);

const MOCKUP_COLUMNS = `id, organization_id, web_project_id, version, status, architecture_id,
  architecture_version, visual_direction, design_tokens, header_variant, footer_variant,
  preview_item_id, preview_item_type, metadata, internal_notes, created_by, created_at,
  updated_at, approved_by, approved_at, sent_to_client_at, sent_to_client_by, supersedes_mockup_id`;

const MOCKUP_PAGE_COLUMNS = `id, organization_id, web_project_id, mockup_id, architecture_page_id,
  title, route, page_type, template_type, status, visual_notes, responsive_settings, sort_order,
  archived_at, created_at, updated_at`;

const MOCKUP_SECTION_COLUMNS = `id, organization_id, web_project_id, mockup_id, mockup_page_id,
  architecture_block_id, section_type, variant, alignment, density, visual_props, asset_document_id,
  placeholder_text, sort_order, required, visual_notes, archived_at, created_at, updated_at`;

const MOCKUP_PATCH_COLUMNS = Object.freeze([
  "status",
  "visual_direction",
  "design_tokens",
  "header_variant",
  "footer_variant",
  "preview_item_id",
  "preview_item_type",
  "metadata",
  "internal_notes",
  "approved_by",
  "approved_at",
  "sent_to_client_at",
  "sent_to_client_by"
]);

const MOCKUP_PAGE_PATCH_COLUMNS = Object.freeze([
  "title",
  "route",
  "page_type",
  "template_type",
  "status",
  "visual_notes",
  "responsive_settings",
  "sort_order",
  "archived_at"
]);

const MOCKUP_SECTION_PATCH_COLUMNS = Object.freeze([
  "variant",
  "alignment",
  "density",
  "visual_props",
  "asset_document_id",
  "placeholder_text",
  "sort_order",
  "visual_notes",
  "archived_at"
]);

const PROJECT_PATCH_COLUMNS = Object.freeze([
  "title",
  "website_hostname",
  "website_asset_id",
  "workflow_status",
  "archived_at",
  "archived_by",
  "archive_reason",
  "completed_at",
  "submitted_for_review_at"
]);

const ITEM_PATCH_COLUMNS = Object.freeze(["title", "status", "sort_order", "payload", "archived_at"]);
const NOTE_PATCH_COLUMNS = Object.freeze([
  "content",
  "status",
  "blocking",
  "severity",
  "resolution_note",
  "resolved_at"
]);

function hasOwn(object, key) {
  return Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);
}

function buildPatchSets(allowedColumns, patch, startIndex) {
  const sets = ["updated_at = NOW()"];
  const values = [];
  let index = startIndex;
  for (const column of allowedColumns) {
    if (hasOwn(patch, column)) {
      sets.push(`${column} = $${index++}`);
      values.push(patch[column]);
    }
  }
  return { sets, values, nextIndex: index };
}

function createSqlStore(db) {
  const store = {
    async withTransaction(work) {
      if (!db || typeof db.connect !== "function") {
        return work(store);
      }
      const client = await db.connect();
      try {
        await client.query("BEGIN");
        const result = await work(createSqlStore(client));
        await client.query("COMMIT");
        return result;
      } catch (err) {
        try {
          await client.query("ROLLBACK");
        } catch {
          // ignore rollback failure; original error is authoritative
        }
        throw err;
      } finally {
        client.release();
      }
    },
    async insertProject(row) {
      const result = await db.query(
        `INSERT INTO web_projects (
           organization_id, title, project_type, workflow_status,
           website_asset_id, website_hostname, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING ${PROJECT_COLUMNS}`,
        [
          row.organization_id,
          row.title,
          row.project_type,
          row.workflow_status,
          row.website_asset_id ?? null,
          row.website_hostname ?? null,
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    },
    async listProjects(organizationId, { includeArchived = false } = {}) {
      const result = await db.query(
        includeArchived
          ? `SELECT ${PROJECT_COLUMNS} FROM web_projects WHERE organization_id = $1 ORDER BY id DESC`
          : `SELECT ${PROJECT_COLUMNS} FROM web_projects
             WHERE organization_id = $1 AND archived_at IS NULL
             ORDER BY id DESC`,
        [organizationId]
      );
      return result.rows;
    },
    async getProject(organizationId, id) {
      const result = await db.query(
        `SELECT ${PROJECT_COLUMNS} FROM web_projects WHERE id = $1 AND organization_id = $2`,
        [id, organizationId]
      );
      return result.rows[0] || null;
    },
    async updateProject(organizationId, id, patch) {
      const { sets, values } = buildPatchSets(PROJECT_PATCH_COLUMNS, patch, 3);
      const result = await db.query(
        `UPDATE web_projects SET ${sets.join(", ")}
         WHERE id = $1 AND organization_id = $2
         RETURNING ${PROJECT_COLUMNS}`,
        [id, organizationId, ...values]
      );
      return result.rows[0] || null;
    },
    async archiveProjectFirst(organizationId, id, patch) {
      const result = await db.query(
        `UPDATE web_projects SET
           archived_at = $3,
           archived_by = $4,
           archive_reason = $5,
           updated_at = NOW()
         WHERE id = $1 AND organization_id = $2 AND archived_at IS NULL
         RETURNING ${PROJECT_COLUMNS}`,
        [id, organizationId, patch.archived_at, patch.archived_by ?? null, patch.archive_reason ?? null]
      );
      if (result.rows[0]) return result.rows[0];
      return store.getProject(organizationId, id);
    },
    async insertItem(row) {
      const result = await db.query(
        `INSERT INTO web_project_items (
           web_project_id, organization_id, item_type, title, status, sort_order, payload, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING ${ITEM_COLUMNS}`,
        [
          row.web_project_id,
          row.organization_id,
          row.item_type,
          row.title,
          row.status || "draft",
          row.sort_order || 0,
          JSON.stringify(row.payload || {}),
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    },
    async getItem(organizationId, projectId, itemId) {
      const result = await db.query(
        `SELECT ${ITEM_COLUMNS} FROM web_project_items
         WHERE organization_id = $1 AND web_project_id = $2 AND id = $3`,
        [organizationId, projectId, itemId]
      );
      return result.rows[0] || null;
    },
    async updateItem(organizationId, projectId, itemId, patch) {
      const { sets, values } = buildPatchSets(ITEM_PATCH_COLUMNS, patch, 4);
      const result = await db.query(
        `UPDATE web_project_items SET ${sets.join(", ")}
         WHERE organization_id = $1 AND web_project_id = $2 AND id = $3
         RETURNING ${ITEM_COLUMNS}`,
        [organizationId, projectId, itemId, ...values]
      );
      return result.rows[0] || null;
    },
    async listItems(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${ITEM_COLUMNS} FROM web_project_items
         WHERE organization_id = $1 AND web_project_id = $2
         ORDER BY sort_order ASC, id ASC`,
        [organizationId, projectId]
      );
      return result.rows;
    },
    async upsertFormResponse(row) {
      const result = await db.query(
        `INSERT INTO web_project_form_responses (
           web_project_id, organization_id, schema_version, field_key, value, updated_by
         ) VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (web_project_id, schema_version, field_key)
         DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()
         RETURNING ${FORM_COLUMNS}`,
        [
          row.web_project_id,
          row.organization_id,
          row.schema_version,
          row.field_key,
          JSON.stringify(row.value),
          row.updated_by ?? null
        ]
      );
      return result.rows[0];
    },
    async listFormResponses(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${FORM_COLUMNS} FROM web_project_form_responses
         WHERE organization_id = $1 AND web_project_id = $2`,
        [organizationId, projectId]
      );
      return result.rows;
    },
    async insertDocument(row) {
      const result = await db.query(
        `INSERT INTO web_project_documents (
           id, web_project_id, organization_id, object_key, original_filename,
           requirement_key, declared_extension, mime_type, byte_length, sha256,
           scan_status, status, upload_status, stored_at, failed_at, replaces_document_id, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING ${DOCUMENT_COLUMNS}`,
        [
          row.id,
          row.web_project_id,
          row.organization_id,
          row.object_key,
          row.original_filename,
          row.requirement_key ?? null,
          row.declared_extension ?? null,
          row.mime_type,
          row.byte_length,
          row.sha256 ?? null,
          row.scan_status,
          row.status || "AVAILABLE",
          row.upload_status || "PENDING",
          row.stored_at ?? null,
          row.failed_at ?? null,
          row.replaces_document_id ?? null,
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    },
    async listDocuments(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${DOCUMENT_COLUMNS} FROM web_project_documents
         WHERE organization_id = $1 AND web_project_id = $2 AND status = 'AVAILABLE'`,
        [organizationId, projectId]
      );
      return result.rows;
    },
    async getDocument(organizationId, projectId, documentId) {
      const result = await db.query(
        `SELECT ${DOCUMENT_COLUMNS} FROM web_project_documents
         WHERE organization_id = $1 AND web_project_id = $2 AND id = $3`,
        [organizationId, projectId, documentId]
      );
      return result.rows[0] || null;
    },
    async insertComment(row) {
      const result = await db.query(
        `INSERT INTO web_project_comments (web_project_id, organization_id, body, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING ${COMMENT_COLUMNS}`,
        [row.web_project_id, row.organization_id, row.body, row.created_by ?? null]
      );
      return result.rows[0];
    },
    async listComments(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${COMMENT_COLUMNS} FROM web_project_comments
         WHERE organization_id = $1 AND web_project_id = $2
         ORDER BY id ASC`,
        [organizationId, projectId]
      );
      return result.rows;
    },
    async insertReview(row) {
      const result = await db.query(
        `INSERT INTO web_project_reviews (
           web_project_id, organization_id, verdict, summary, target_type,
           target_id, target_key, correction_message, schema_version, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING ${REVIEW_COLUMNS}`,
        [
          row.web_project_id,
          row.organization_id,
          row.verdict,
          row.summary,
          row.target_type || "PROJECT",
          row.target_id ?? null,
          row.target_key ?? null,
          row.correction_message ?? null,
          row.schema_version ?? null,
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    },
    async listReviews(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${REVIEW_COLUMNS} FROM web_project_reviews
         WHERE organization_id = $1 AND web_project_id = $2
         ORDER BY id ASC`,
        [organizationId, projectId]
      );
      return result.rows;
    },
    async upsertCredentialStatus(row) {
      const result = await db.query(
        `INSERT INTO web_project_credential_status (web_project_id, organization_id, status, updated_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (web_project_id)
         DO UPDATE SET status = EXCLUDED.status, updated_by = EXCLUDED.updated_by, updated_at = NOW()
         RETURNING ${CREDENTIAL_COLUMNS}`,
        [row.web_project_id, row.organization_id, row.status, row.updated_by ?? null]
      );
      return result.rows[0];
    },
    async getCredentialStatus(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${CREDENTIAL_COLUMNS} FROM web_project_credential_status
         WHERE organization_id = $1 AND web_project_id = $2`,
        [organizationId, projectId]
      );
      return result.rows[0] || null;
    },
    async insertBriefNote(row) {
      const result = await db.query(
        `INSERT INTO web_project_brief_notes (
           organization_id, web_project_id, note_type, content, status, blocking,
           severity, resolution_note, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING ${NOTE_COLUMNS}`,
        [
          row.organization_id,
          row.web_project_id,
          row.note_type,
          row.content,
          row.status || "OPEN",
          Boolean(row.blocking),
          row.severity || null,
          row.resolution_note || null,
          row.created_by ?? null
        ]
      );
      return result.rows[0];
    },
    async getBriefNote(organizationId, projectId, noteId) {
      const result = await db.query(
        `SELECT ${NOTE_COLUMNS} FROM web_project_brief_notes
         WHERE organization_id = $1 AND web_project_id = $2 AND id = $3`,
        [organizationId, projectId, noteId]
      );
      return result.rows[0] || null;
    },
    async listBriefNotes(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${NOTE_COLUMNS} FROM web_project_brief_notes
         WHERE organization_id = $1 AND web_project_id = $2
         ORDER BY id ASC`,
        [organizationId, projectId]
      );
      return result.rows;
    },
    async updateBriefNote(organizationId, projectId, noteId, patch) {
      const { sets, values } = buildPatchSets(NOTE_PATCH_COLUMNS, patch, 4);
      const result = await db.query(
        `UPDATE web_project_brief_notes SET ${sets.join(", ")}
         WHERE id = $1 AND organization_id = $2 AND web_project_id = $3
         RETURNING ${NOTE_COLUMNS}`,
        [noteId, organizationId, projectId, ...values]
      );
      return result.rows[0] || null;
    },
    async insertArchitectureHandoff(row) {
      const result = await db.query(
        `INSERT INTO web_project_architecture_handoffs (
           organization_id, web_project_id, schema_version, payload, readiness_state,
           override_used, override_reason, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (organization_id, web_project_id) DO NOTHING
         RETURNING ${HANDOFF_COLUMNS}`,
        [
          row.organization_id,
          row.web_project_id,
          row.schema_version,
          JSON.stringify(row.payload || {}),
          row.readiness_state,
          Boolean(row.override_used),
          row.override_reason || null,
          row.created_by ?? null
        ]
      );
      if (result.rows[0]) return result.rows[0];
      return store.getArchitectureHandoff(row.organization_id, row.web_project_id);
    },
    async getArchitectureHandoff(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${HANDOFF_COLUMNS} FROM web_project_architecture_handoffs
         WHERE organization_id = $1 AND web_project_id = $2`,
        [organizationId, projectId]
      );
      return result.rows[0] || null;
    },
    async listArchitectures(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${ARCHITECTURE_COLUMNS} FROM web_project_architectures
         WHERE organization_id = $1 AND web_project_id = $2
         ORDER BY version ASC`,
        [organizationId, projectId]
      );
      return result.rows;
    },
    async getArchitecture(organizationId, projectId, architectureId) {
      const result = await db.query(
        `SELECT ${ARCHITECTURE_COLUMNS} FROM web_project_architectures
         WHERE organization_id = $1 AND web_project_id = $2 AND id = $3`,
        [organizationId, projectId, architectureId]
      );
      return result.rows[0] || null;
    },
    async getDraftArchitecture(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${ARCHITECTURE_COLUMNS} FROM web_project_architectures
         WHERE organization_id = $1 AND web_project_id = $2 AND status = 'DRAFT'
         LIMIT 1`,
        [organizationId, projectId]
      );
      return result.rows[0] || null;
    },
    async getCurrentApprovedArchitecture(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${ARCHITECTURE_COLUMNS} FROM web_project_architectures
         WHERE organization_id = $1 AND web_project_id = $2 AND status = 'APPROVED'
         ORDER BY version DESC
         LIMIT 1`,
        [organizationId, projectId]
      );
      return result.rows[0] || null;
    },
    async insertArchitecture(row) {
      const result = await db.query(
        `INSERT INTO web_project_architectures (
           organization_id, web_project_id, version, status, primary_language,
           additional_languages, language_selector_required, metadata, created_by,
           supersedes_architecture_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING ${ARCHITECTURE_COLUMNS}`,
        [
          row.organization_id,
          row.web_project_id,
          row.version,
          row.status || "DRAFT",
          row.primary_language || null,
          JSON.stringify(row.additional_languages || []),
          Boolean(row.language_selector_required),
          JSON.stringify(row.metadata || {}),
          row.created_by ?? null,
          row.supersedes_architecture_id ?? null
        ]
      );
      return result.rows[0];
    },
    async updateArchitecture(organizationId, projectId, architectureId, patch) {
      const normalized = { ...patch };
      if (normalized.additional_languages !== undefined) {
        normalized.additional_languages = JSON.stringify(normalized.additional_languages);
      }
      if (normalized.metadata !== undefined) {
        normalized.metadata = JSON.stringify(normalized.metadata);
      }
      const { sets, values } = buildPatchSets(ARCHITECTURE_PATCH_COLUMNS, normalized, 4);
      const result = await db.query(
        `UPDATE web_project_architectures SET ${sets.join(", ")}
         WHERE id = $1 AND organization_id = $2 AND web_project_id = $3
         RETURNING ${ARCHITECTURE_COLUMNS}`,
        [architectureId, organizationId, projectId, ...values]
      );
      return result.rows[0] || null;
    },
    async listArchitecturePages(organizationId, projectId, architectureId) {
      const result = await db.query(
        `SELECT ${ARCH_PAGE_COLUMNS} FROM web_project_architecture_pages
         WHERE organization_id = $1 AND web_project_id = $2 AND architecture_id = $3
           AND archived_at IS NULL
         ORDER BY sort_order ASC, id ASC`,
        [organizationId, projectId, architectureId]
      );
      return result.rows;
    },
    async getArchitecturePage(organizationId, projectId, pageId) {
      const result = await db.query(
        `SELECT ${ARCH_PAGE_COLUMNS} FROM web_project_architecture_pages
         WHERE organization_id = $1 AND web_project_id = $2 AND id = $3`,
        [organizationId, projectId, pageId]
      );
      return result.rows[0] || null;
    },
    async insertArchitecturePage(row) {
      const result = await db.query(
        `INSERT INTO web_project_architecture_pages (
           organization_id, web_project_id, architecture_id, title, slug, route,
           page_type, template_type, parent_page_id, sort_order, navigation_placement,
           navigation_label, purpose, summary, primary_cta, secondary_cta, seo_priority,
           content_readiness, content_binding_type, content_binding_mode, source_page_item_id,
           migration_disposition, entity_count
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
         RETURNING ${ARCH_PAGE_COLUMNS}`,
        [
          row.organization_id,
          row.web_project_id,
          row.architecture_id,
          row.title,
          row.slug,
          row.route,
          row.page_type,
          row.template_type,
          row.parent_page_id ?? null,
          row.sort_order ?? 0,
          row.navigation_placement || "NONE",
          row.navigation_label ?? null,
          row.purpose ?? null,
          row.summary ?? null,
          row.primary_cta ?? null,
          row.secondary_cta ?? null,
          row.seo_priority || "MEDIUM",
          row.content_readiness || "PARTIAL",
          row.content_binding_type ?? null,
          row.content_binding_mode ?? null,
          row.source_page_item_id ?? null,
          row.migration_disposition ?? null,
          row.entity_count ?? null
        ]
      );
      return result.rows[0];
    },
    async updateArchitecturePage(organizationId, projectId, pageId, patch) {
      const { sets, values } = buildPatchSets(ARCH_PAGE_PATCH_COLUMNS, patch, 4);
      const result = await db.query(
        `UPDATE web_project_architecture_pages SET ${sets.join(", ")}
         WHERE id = $1 AND organization_id = $2 AND web_project_id = $3
         RETURNING ${ARCH_PAGE_COLUMNS}`,
        [pageId, organizationId, projectId, ...values]
      );
      return result.rows[0] || null;
    },
    async listArchitectureBlocks(organizationId, projectId, architectureId) {
      const result = await db.query(
        `SELECT ${ARCH_BLOCK_COLUMNS} FROM web_project_architecture_blocks
         WHERE organization_id = $1 AND web_project_id = $2 AND architecture_id = $3
           AND archived_at IS NULL
         ORDER BY sort_order ASC, id ASC`,
        [organizationId, projectId, architectureId]
      );
      return result.rows;
    },
    async getArchitectureBlock(organizationId, projectId, blockId) {
      const result = await db.query(
        `SELECT ${ARCH_BLOCK_COLUMNS} FROM web_project_architecture_blocks
         WHERE organization_id = $1 AND web_project_id = $2 AND id = $3`,
        [organizationId, projectId, blockId]
      );
      return result.rows[0] || null;
    },
    async insertArchitectureBlock(row) {
      const result = await db.query(
        `INSERT INTO web_project_architecture_blocks (
           organization_id, web_project_id, architecture_id, architecture_page_id,
           block_type, sort_order, title, purpose, notes, content_source_type,
           content_source_id, required
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING ${ARCH_BLOCK_COLUMNS}`,
        [
          row.organization_id,
          row.web_project_id,
          row.architecture_id,
          row.architecture_page_id,
          row.block_type,
          row.sort_order ?? 0,
          row.title ?? null,
          row.purpose ?? null,
          row.notes ?? null,
          row.content_source_type ?? null,
          row.content_source_id ?? null,
          Boolean(row.required)
        ]
      );
      return result.rows[0];
    },
    async updateArchitectureBlock(organizationId, projectId, blockId, patch) {
      const { sets, values } = buildPatchSets(ARCH_BLOCK_PATCH_COLUMNS, patch, 4);
      const result = await db.query(
        `UPDATE web_project_architecture_blocks SET ${sets.join(", ")}
         WHERE id = $1 AND organization_id = $2 AND web_project_id = $3
         RETURNING ${ARCH_BLOCK_COLUMNS}`,
        [blockId, organizationId, projectId, ...values]
      );
      return result.rows[0] || null;
    },
    async listMockups(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${MOCKUP_COLUMNS} FROM web_project_mockups
         WHERE organization_id = $1 AND web_project_id = $2
         ORDER BY version ASC, id ASC`,
        [organizationId, projectId]
      );
      return result.rows;
    },
    async getMockup(organizationId, projectId, mockupId) {
      const result = await db.query(
        `SELECT ${MOCKUP_COLUMNS} FROM web_project_mockups
         WHERE organization_id = $1 AND web_project_id = $2 AND id = $3`,
        [organizationId, projectId, mockupId]
      );
      return result.rows[0] || null;
    },
    async getActiveMockup(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${MOCKUP_COLUMNS} FROM web_project_mockups
         WHERE organization_id = $1 AND web_project_id = $2
           AND status IN ('DRAFT', 'INTERNAL_REVIEW')
         ORDER BY version DESC
         LIMIT 1`,
        [organizationId, projectId]
      );
      return result.rows[0] || null;
    },
    async getCurrentApprovedMockup(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${MOCKUP_COLUMNS} FROM web_project_mockups
         WHERE organization_id = $1 AND web_project_id = $2 AND status = 'APPROVED'
         ORDER BY version DESC
         LIMIT 1`,
        [organizationId, projectId]
      );
      return result.rows[0] || null;
    },
    async getClientVisibleMockup(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${MOCKUP_COLUMNS} FROM web_project_mockups
         WHERE organization_id = $1 AND web_project_id = $2
           AND status IN ('CLIENT_REVIEW', 'APPROVED')
         ORDER BY CASE WHEN status = 'CLIENT_REVIEW' THEN 0 ELSE 1 END, version DESC
         LIMIT 1`,
        [organizationId, projectId]
      );
      return result.rows[0] || null;
    },
    async getChangesRequestedMockup(organizationId, projectId) {
      const result = await db.query(
        `SELECT ${MOCKUP_COLUMNS} FROM web_project_mockups
         WHERE organization_id = $1 AND web_project_id = $2 AND status = 'CHANGES_REQUESTED'
         ORDER BY version DESC
         LIMIT 1`,
        [organizationId, projectId]
      );
      return result.rows[0] || null;
    },
    async insertMockup(row) {
      const result = await db.query(
        `INSERT INTO web_project_mockups (
           organization_id, web_project_id, version, status, architecture_id, architecture_version,
           visual_direction, design_tokens, header_variant, footer_variant, preview_item_id,
           preview_item_type, metadata, internal_notes, created_by, supersedes_mockup_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING ${MOCKUP_COLUMNS}`,
        [
          row.organization_id,
          row.web_project_id,
          row.version,
          row.status || "DRAFT",
          row.architecture_id,
          row.architecture_version,
          JSON.stringify(row.visual_direction || {}),
          JSON.stringify(row.design_tokens || {}),
          row.header_variant || "STANDARD",
          row.footer_variant || "STANDARD",
          row.preview_item_id ?? null,
          row.preview_item_type ?? null,
          JSON.stringify(row.metadata || {}),
          row.internal_notes ?? null,
          row.created_by ?? null,
          row.supersedes_mockup_id ?? null
        ]
      );
      return result.rows[0];
    },
    async updateMockup(organizationId, projectId, mockupId, patch) {
      const normalized = { ...patch };
      if (hasOwn(normalized, "visual_direction") && typeof normalized.visual_direction === "object") {
        normalized.visual_direction = JSON.stringify(normalized.visual_direction);
      }
      if (hasOwn(normalized, "design_tokens") && typeof normalized.design_tokens === "object") {
        normalized.design_tokens = JSON.stringify(normalized.design_tokens);
      }
      if (hasOwn(normalized, "metadata") && typeof normalized.metadata === "object") {
        normalized.metadata = JSON.stringify(normalized.metadata);
      }
      const { sets, values } = buildPatchSets(MOCKUP_PATCH_COLUMNS, normalized, 4);
      const result = await db.query(
        `UPDATE web_project_mockups SET ${sets.join(", ")}
         WHERE id = $1 AND organization_id = $2 AND web_project_id = $3
         RETURNING ${MOCKUP_COLUMNS}`,
        [mockupId, organizationId, projectId, ...values]
      );
      return result.rows[0] || null;
    },
    async listMockupPages(organizationId, projectId, mockupId) {
      const result = await db.query(
        `SELECT ${MOCKUP_PAGE_COLUMNS} FROM web_project_mockup_pages
         WHERE organization_id = $1 AND web_project_id = $2 AND mockup_id = $3
           AND archived_at IS NULL
         ORDER BY sort_order ASC, id ASC`,
        [organizationId, projectId, mockupId]
      );
      return result.rows;
    },
    async getMockupPage(organizationId, projectId, pageId) {
      const result = await db.query(
        `SELECT ${MOCKUP_PAGE_COLUMNS} FROM web_project_mockup_pages
         WHERE organization_id = $1 AND web_project_id = $2 AND id = $3`,
        [organizationId, projectId, pageId]
      );
      return result.rows[0] || null;
    },
    async insertMockupPage(row) {
      const result = await db.query(
        `INSERT INTO web_project_mockup_pages (
           organization_id, web_project_id, mockup_id, architecture_page_id, title, route,
           page_type, template_type, status, visual_notes, responsive_settings, sort_order
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING ${MOCKUP_PAGE_COLUMNS}`,
        [
          row.organization_id,
          row.web_project_id,
          row.mockup_id,
          row.architecture_page_id,
          row.title,
          row.route,
          row.page_type,
          row.template_type,
          row.status || "DRAFT",
          row.visual_notes ?? null,
          JSON.stringify(row.responsive_settings || {}),
          row.sort_order ?? 0
        ]
      );
      return result.rows[0];
    },
    async updateMockupPage(organizationId, projectId, pageId, patch) {
      const normalized = { ...patch };
      if (hasOwn(normalized, "responsive_settings") && typeof normalized.responsive_settings === "object") {
        normalized.responsive_settings = JSON.stringify(normalized.responsive_settings);
      }
      const { sets, values } = buildPatchSets(MOCKUP_PAGE_PATCH_COLUMNS, normalized, 4);
      const result = await db.query(
        `UPDATE web_project_mockup_pages SET ${sets.join(", ")}
         WHERE id = $1 AND organization_id = $2 AND web_project_id = $3
         RETURNING ${MOCKUP_PAGE_COLUMNS}`,
        [pageId, organizationId, projectId, ...values]
      );
      return result.rows[0] || null;
    },
    async listMockupSections(organizationId, projectId, mockupId) {
      const result = await db.query(
        `SELECT ${MOCKUP_SECTION_COLUMNS} FROM web_project_mockup_sections
         WHERE organization_id = $1 AND web_project_id = $2 AND mockup_id = $3
           AND archived_at IS NULL
         ORDER BY sort_order ASC, id ASC`,
        [organizationId, projectId, mockupId]
      );
      return result.rows;
    },
    async getMockupSection(organizationId, projectId, sectionId) {
      const result = await db.query(
        `SELECT ${MOCKUP_SECTION_COLUMNS} FROM web_project_mockup_sections
         WHERE organization_id = $1 AND web_project_id = $2 AND id = $3`,
        [organizationId, projectId, sectionId]
      );
      return result.rows[0] || null;
    },
    async insertMockupSection(row) {
      const result = await db.query(
        `INSERT INTO web_project_mockup_sections (
           organization_id, web_project_id, mockup_id, mockup_page_id, architecture_block_id,
           section_type, variant, alignment, density, visual_props, asset_document_id,
           placeholder_text, sort_order, required, visual_notes
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING ${MOCKUP_SECTION_COLUMNS}`,
        [
          row.organization_id,
          row.web_project_id,
          row.mockup_id,
          row.mockup_page_id,
          row.architecture_block_id ?? null,
          row.section_type,
          row.variant || "DEFAULT",
          row.alignment || "CENTER",
          row.density || "NORMAL",
          JSON.stringify(row.visual_props || {}),
          row.asset_document_id ?? null,
          row.placeholder_text ?? null,
          row.sort_order ?? 0,
          Boolean(row.required),
          row.visual_notes ?? null
        ]
      );
      return result.rows[0];
    },
    async updateMockupSection(organizationId, projectId, sectionId, patch) {
      const normalized = { ...patch };
      if (hasOwn(normalized, "visual_props") && typeof normalized.visual_props === "object") {
        normalized.visual_props = JSON.stringify(normalized.visual_props);
      }
      const { sets, values } = buildPatchSets(MOCKUP_SECTION_PATCH_COLUMNS, normalized, 4);
      const result = await db.query(
        `UPDATE web_project_mockup_sections SET ${sets.join(", ")}
         WHERE id = $1 AND organization_id = $2 AND web_project_id = $3
         RETURNING ${MOCKUP_SECTION_COLUMNS}`,
        [sectionId, organizationId, projectId, ...values]
      );
      return result.rows[0] || null;
    },
    async insertActivityLog(row) {
      const result = await db.query(
        `INSERT INTO activity_logs (user_id, organization_id, action_type, details)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, organization_id, action_type, details, created_at`,
        [row.user_id ?? null, row.organization_id, row.action_type, JSON.stringify(row.details || {})]
      );
      return result.rows[0];
    },
    ...createSqlDevelopmentMethods(db),
    ...createSqlValidationMethods(db),
    ...createSqlPublicationMethods(db)
  };

  return store;
}

module.exports = { createSqlStore };
