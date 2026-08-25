/**
 * EvidenceService — tenant-bound metadata (PG) + bytes (ObjectStore).
 * Producers call store(); retrieval is authenticated via client/NOC routes.
 */
const crypto = require("crypto");
const { randomUUID } = require("crypto");
const { getEvidenceStore, EvidenceStoreNotConfiguredError } = require("./evidenceStore");
const { buildObjectKey, ObjectStoreError } = require("./localPrivateObjectStore");
const {
  EvidencePolicyError,
  QuotaExceededError,
  assertMimeMatchesContent,
  assertOrgQuota,
  assertSizeWithinLimit,
  computeRetentionUntil,
  runInspectionHook
} = require("./evidencePolicy");
const { sanitizeEvidence } = require("../monitoring/sanitizeEvidence");

class EvidenceServiceError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function mapPolicyError(err) {
  if (err instanceof EvidencePolicyError || err instanceof QuotaExceededError) {
    return new EvidenceServiceError(err.code, err.message, err instanceof QuotaExceededError ? 413 : 400);
  }
  if (err instanceof ObjectStoreError) {
    return new EvidenceServiceError(err.code, err.message, 400);
  }
  if (err instanceof EvidenceStoreNotConfiguredError) {
    return new EvidenceServiceError(err.code, err.message, 503);
  }
  return err;
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function serializeEvidenceRow(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    assetId: row.asset_id,
    incidentId: row.incident_id,
    remediationExecutionId: row.remediation_execution_id,
    sha256: row.sha256,
    mimeType: row.mime_type,
    byteLength: Number(row.byte_length),
    retentionClass: row.retention_class,
    retentionUntil: row.retention_until,
    scanStatus: row.scan_status,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

async function auditEvidence(pool, {
  userId,
  organizationId,
  actionType,
  evidenceId,
  details = {}
}) {
  await pool.query(
    `INSERT INTO activity_logs(user_id, organization_id, action_type, details)
     VALUES($1, $2, $3, $4)`,
    [
      userId || null,
      organizationId || null,
      actionType,
      JSON.stringify(sanitizeEvidence({ evidenceId, ...details }))
    ]
  );
}

async function auditNocCrossTenant(pool, { userId, organizationId, action, evidenceId }) {
  await pool.query(
    `INSERT INTO security_logs(user_id, organization_id, action, risk_level, details)
     VALUES($1, $2, $3, $4, $5)`,
    [
      userId || null,
      organizationId || null,
      action,
      "medium",
      JSON.stringify(sanitizeEvidence({ evidenceId, scope: "noc_cross_tenant" }))
    ]
  );
}

function createEvidenceService(pool) {
  async function findByIdempotency(organizationId, idempotencyKey, client) {
    if (!idempotencyKey) {
      return null;
    }
    const db = client || pool;
    const { rows } = await db.query(
      `SELECT *
       FROM evidence_objects
       WHERE organization_id = $1
         AND idempotency_key = $2
         AND status = 'AVAILABLE'
       LIMIT 1`,
      [organizationId, idempotencyKey]
    );
    return rows[0] || null;
  }

  async function store(input) {
    const organizationId = Number(input.organizationId);
    if (!Number.isInteger(organizationId) || organizationId <= 0) {
      throw new EvidenceServiceError("INVALID_ORG", "organizationId is required", 400);
    }
    const buffer = Buffer.isBuffer(input.buffer)
      ? input.buffer
      : Buffer.from(String(input.buffer || ""), input.encoding || "utf8");

    let mimeType;
    try {
      assertSizeWithinLimit(buffer.length);
      mimeType = assertMimeMatchesContent(input.mimeType, buffer);
      await assertOrgQuota(pool, organizationId, buffer.length);
    } catch (err) {
      throw mapPolicyError(err);
    }

    const existing = await findByIdempotency(organizationId, input.idempotencyKey);
    if (existing) {
      return { row: existing, created: false };
    }

    const store = getEvidenceStore();
    const evidenceId = randomUUID();
    const objectKey = buildObjectKey(organizationId, evidenceId);
    const digest = sha256(buffer);
    const retentionClass = String(input.retentionClass || "STANDARD").toUpperCase();
    const retentionUntil = computeRetentionUntil(retentionClass);
    const inspection = await runInspectionHook({ mimeType, byteLength: buffer.length });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const insert = await client.query(
        `INSERT INTO evidence_objects (
           id, organization_id, asset_id, incident_id, remediation_execution_id,
           object_key, sha256, mime_type, byte_length, retention_class, retention_until,
           scan_status, status, created_by, idempotency_key
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'AVAILABLE',$13,$14)
         RETURNING *`,
        [
          evidenceId,
          organizationId,
          input.assetId || null,
          input.incidentId || null,
          input.remediationExecutionId || null,
          objectKey,
          digest,
          mimeType,
          buffer.length,
          retentionClass,
          retentionUntil,
          inspection.scanStatus || "SKIPPED",
          input.createdBy || null,
          input.idempotencyKey || null
        ]
      );

      try {
        await store.put(objectKey, buffer);
      } catch (putErr) {
        await client.query("ROLLBACK");
        throw mapPolicyError(putErr);
      }

      await client.query("COMMIT");
      const row = insert.rows[0];
      await auditEvidence(pool, {
        userId: input.createdBy,
        organizationId,
        actionType: "evidence_object_created",
        evidenceId: row.id,
        details: {
          mimeType: row.mime_type,
          byteLength: Number(row.byte_length),
          retentionClass: row.retention_class
        }
      });
      return { row, created: true };
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore rollback failure */
      }
      if (err instanceof EvidenceServiceError) {
        throw err;
      }
      if (err && err.code === "23505" && input.idempotencyKey) {
        const replay = await findByIdempotency(organizationId, input.idempotencyKey);
        if (replay) {
          return { row: replay, created: false };
        }
      }
      throw err;
    } finally {
      client.release();
    }
  }

  async function getMetadata(evidenceId, { organizationId, allowCrossTenant = false } = {}) {
    const { rows } = await pool.query(
      `SELECT * FROM evidence_objects WHERE id = $1 LIMIT 1`,
      [evidenceId]
    );
    const row = rows[0];
    if (!row || row.status !== "AVAILABLE") {
      throw new EvidenceServiceError("NOT_FOUND", "Evidence not found", 404);
    }
    if (!allowCrossTenant && Number(row.organization_id) !== Number(organizationId)) {
      throw new EvidenceServiceError("FORBIDDEN", "Evidence access denied", 403);
    }
    return row;
  }

  async function getContent(evidenceId, accessContext) {
    const row = await getMetadata(evidenceId, accessContext);
    const store = getEvidenceStore();
    let buffer;
    try {
      buffer = await store.get(row.object_key);
    } catch (err) {
      if (err instanceof ObjectStoreError && err.code === "NOT_FOUND") {
        throw new EvidenceServiceError("STORAGE_MISSING", "Evidence bytes missing", 503);
      }
      throw mapPolicyError(err);
    }

    const digest = sha256(buffer);
    if (digest !== row.sha256) {
      throw new EvidenceServiceError("CHECKSUM_MISMATCH", "Evidence integrity check failed", 503);
    }

    if (accessContext.requireInspection !== false) {
      const inspection = await runInspectionHook(row);
      if (inspection.quarantined || row.scan_status === "QUARANTINED") {
        throw new EvidenceServiceError("QUARANTINED", "Evidence is quarantined", 403);
      }
    }

    if (accessContext.audit) {
      await auditEvidence(pool, {
        userId: accessContext.userId,
        organizationId: row.organization_id,
        actionType: accessContext.audit.actionType,
        evidenceId: row.id,
        details: accessContext.audit.details || {}
      });
    }

    if (accessContext.allowCrossTenant && accessContext.auditNoc) {
      await auditNocCrossTenant(pool, {
        userId: accessContext.userId,
        organizationId: row.organization_id,
        action: accessContext.auditNoc.action,
        evidenceId: row.id
      });
    }

    return { row, buffer, digest };
  }

  async function listForOrganization(organizationId, { limit = 50, offset = 0 } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    const { rows } = await pool.query(
      `SELECT *
       FROM evidence_objects
       WHERE organization_id = $1 AND status = 'AVAILABLE'
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [organizationId, safeLimit, safeOffset]
    );
    return rows;
  }

  async function markOrphaned(evidenceId) {
    await pool.query(
      `UPDATE evidence_objects
       SET status = 'ORPHANED'
       WHERE id = $1 AND status = 'AVAILABLE'`,
      [evidenceId]
    );
  }

  return {
    store,
    getMetadata,
    getContent,
    listForOrganization,
    markOrphaned,
    serializeEvidenceRow,
    sha256
  };
}

module.exports = {
  EvidenceServiceError,
  createEvidenceService,
  serializeEvidenceRow
};
