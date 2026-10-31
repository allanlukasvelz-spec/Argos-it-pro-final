/**
 * Evidence consistency reconciliation — read-only detection + explicit safe repair hooks.
 * Does NOT auto-delete evidence. dryRun=true by default.
 */
const crypto = require("crypto");
const { getEvidenceStore } = require("./evidenceStore");
const { ObjectStoreError } = require("./objectKey");
const { orgPrefix } = require("./objectKey");

const CATEGORIES = Object.freeze({
  OK: "OK",
  METADATA_WITHOUT_OBJECT: "METADATA_WITHOUT_OBJECT",
  OBJECT_WITHOUT_METADATA: "OBJECT_WITHOUT_METADATA",
  OBJECT_WITHOUT_EVENT_LINK: "OBJECT_WITHOUT_EVENT_LINK",
  CHECKSUM_MISMATCH: "CHECKSUM_MISMATCH"
});

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function hasEvidenceEventLink(pool, row) {
  if (!row.remediation_execution_id || !row.incident_id) {
    return true;
  }
  const { rows } = await pool.query(
    `SELECT 1 FROM incident_events
     WHERE incident_id = $1
       AND organization_id = $2
       AND kind = 'EVIDENCE'
       AND payload->>'evidenceObjectId' = $3
     LIMIT 1`,
    [row.incident_id, row.organization_id, row.id]
  );
  return rows.length > 0;
}

/**
 * @param {import('pg').Pool} pool
 * @param {{
 *   organizationId?: number,
 *   dryRun?: boolean,
 *   scanStoreOrphans?: boolean,
 *   maxRows?: number
 * }} options
 */
async function reconcileEvidence(pool, options = {}) {
  const dryRun = options.dryRun !== false;
  const scanStoreOrphans = options.scanStoreOrphans === true;
  const maxRows = Math.min(Math.max(Number(options.maxRows) || 200, 1), 2000);
  const orgFilter = options.organizationId != null ? Number(options.organizationId) : null;

  const params = [];
  let sql = `SELECT * FROM evidence_objects WHERE status = 'AVAILABLE'`;
  if (Number.isInteger(orgFilter) && orgFilter > 0) {
    params.push(orgFilter);
    sql += ` AND organization_id = $${params.length}`;
  }
  params.push(maxRows);
  sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;

  const { rows } = await pool.query(sql, params);
  const store = getEvidenceStore();
  const findings = [];
  const metadataKeys = new Set();

  for (const row of rows) {
    metadataKeys.add(row.object_key);
    let category = CATEGORIES.OK;
    let detail = {};

    let exists = false;
    try {
      exists = await store.exists(row.object_key);
    } catch (err) {
      findings.push({
        category: "STORE_PROBE_FAILED",
        evidenceId: row.id,
        organizationId: row.organization_id,
        objectKey: row.object_key,
        error: err.message,
        dryRun
      });
      continue;
    }

    if (!exists) {
      category = CATEGORIES.METADATA_WITHOUT_OBJECT;
      detail = { reason: "bytes_missing" };
    } else {
      try {
        const buffer = await store.get(row.object_key);
        const digest = sha256(buffer);
        if (digest !== row.sha256) {
          category = CATEGORIES.CHECKSUM_MISMATCH;
          detail = { expected: row.sha256, actual: digest };
        }
      } catch (err) {
        if (err instanceof ObjectStoreError && err.code === "NOT_FOUND") {
          category = CATEGORIES.METADATA_WITHOUT_OBJECT;
        } else {
          findings.push({
            category: "STORE_READ_FAILED",
            evidenceId: row.id,
            organizationId: row.organization_id,
            objectKey: row.object_key,
            error: err.message,
            dryRun
          });
          continue;
        }
      }
    }

    if (category === CATEGORIES.OK && row.remediation_execution_id && row.incident_id) {
      const linked = await hasEvidenceEventLink(pool, row);
      if (!linked) {
        category = CATEGORIES.OBJECT_WITHOUT_EVENT_LINK;
        detail = { remediationExecutionId: row.remediation_execution_id };
      }
    }

    if (category !== CATEGORIES.OK) {
      findings.push({
        category,
        evidenceId: row.id,
        organizationId: row.organization_id,
        incidentId: row.incident_id,
        remediationExecutionId: row.remediation_execution_id,
        objectKey: row.object_key,
        detail,
        dryRun,
        repairAvailable: category === CATEGORIES.OBJECT_WITHOUT_EVENT_LINK && !dryRun
      });
    }
  }

  if (scanStoreOrphans && typeof store.listKeysUnderPrefix === "function") {
    const orgIds = orgFilter
      ? [orgFilter]
      : [...new Set(rows.map((r) => r.organization_id))];
    for (const orgId of orgIds) {
      let keys = [];
      try {
        keys = await store.listKeysUnderPrefix(orgPrefix(orgId), { maxKeys: maxRows });
      } catch (err) {
        findings.push({
          category: "STORE_LIST_FAILED",
          organizationId: orgId,
          error: err.message,
          dryRun
        });
        continue;
      }
      for (const key of keys) {
        if (!metadataKeys.has(key)) {
          findings.push({
            category: CATEGORIES.OBJECT_WITHOUT_METADATA,
            organizationId: orgId,
            objectKey: key,
            detail: { reason: "no_metadata_row" },
            dryRun
          });
        }
      }
    }
  }

  const summary = findings.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {});

  return {
    dryRun,
    scannedRows: rows.length,
    findings,
    summary,
    categories: CATEGORIES
  };
}

module.exports = {
  CATEGORIES,
  reconcileEvidence
};
