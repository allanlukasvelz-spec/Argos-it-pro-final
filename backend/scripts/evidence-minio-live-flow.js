#!/usr/bin/env node
/**
 * LIVE LOCAL ONLY — EvidenceService → S3CompatibleObjectStore → MinIO
 * Flow: PUT → HEAD → GET → SHA-256 VERIFY → DELETE → MISSING CONFIRMED
 *
 * Requires: MinIO POC running, PostgreSQL with evidence_objects schema.
 * Usage:
 *   MINIO_API_PORT=9010 node backend/scripts/evidence-minio-live-flow.js
 *   ARGOS_MINIO_POC=1 npm run verify:backend
 */
const assert = require("node:assert/strict");
const crypto = require("crypto");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", "..", "docker", ".env.minio-poc") });

function loadMinioEndpointFromEnv() {
  const minioPort = process.env.MINIO_API_PORT || "9000";
  process.env.ARGOS_EVIDENCE_S3_ENDPOINT = `http://127.0.0.1:${minioPort}`;
}

const { Pool } = require("pg");
const { configureEvidenceStore, getEvidenceStore, getConfiguredBackend } = require("../lib/platform/evidenceStore");
const { createEvidenceService, EvidenceServiceError } = require("../lib/platform/evidenceService");
const { ObjectStoreError } = require("../lib/platform/objectKey");

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function ensureTestOrg(pool) {
  const slug = `minio-poc-${Date.now()}`;
  const { rows } = await pool.query(
    `INSERT INTO organizations (name, slug, status)
     VALUES ($1, $2, 'active')
     RETURNING id`,
    [`MinIO POC ${Date.now()}`, slug]
  );
  return rows[0].id;
}

async function cleanupTestRun(pool, { orgId, evidenceId, objectKey, store }) {
  if (objectKey && store) {
    try {
      await store.delete(objectKey);
    } catch {
      /* best-effort object cleanup */
    }
  }
  if (evidenceId) {
    await pool.query("DELETE FROM activity_logs WHERE details->>'evidenceId' = $1", [evidenceId]);
    await pool.query("DELETE FROM evidence_objects WHERE id = $1", [evidenceId]);
  }
  if (orgId) {
    await pool.query("DELETE FROM organizations WHERE id = $1", [orgId]);
  }
}

async function runMinioLiveFlow() {
  loadMinioEndpointFromEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL required");
  }

  process.env.ARGOS_EVIDENCE_STORE = "s3";
  configureEvidenceStore({ backend: "s3" });
  assert.equal(getConfiguredBackend(), "s3");

  const pool = new Pool({ connectionString: databaseUrl });
  const orgId = await ensureTestOrg(pool);

  const evidence = createEvidenceService(pool);
  const store = getEvidenceStore();
  const payload = Buffer.from(JSON.stringify({ flow: "minio-live", ts: Date.now() }), "utf8");
  const expectedDigest = sha256(payload);
  let evidenceId = null;
  let objectKey = null;

  try {
    console.log("STEP 1 PUT — EvidenceService.store → MinIO");
    const { row, created } = await evidence.store({
      organizationId: orgId,
      buffer: payload,
      mimeType: "application/json",
      idempotencyKey: `minio-live-${Date.now()}`
    });
    assert.equal(created, true);
    assert.ok(row.object_key.startsWith(`org/${orgId}/`));
    evidenceId = row.id;
    objectKey = row.object_key;
    console.log(`  evidenceId=${row.id} objectKey=${row.object_key} sha256=${row.sha256}`);

    console.log("STEP 2 HEAD — S3CompatibleObjectStore.head");
    const head = await store.head(row.object_key);
    assert.equal(head.exists, true);
    assert.equal(head.byteLength, payload.length);
    console.log(`  exists=true byteLength=${head.byteLength}`);

    console.log("STEP 3 GET — EvidenceService.getContent");
    const { buffer, digest } = await evidence.getContent(row.id, {
      organizationId: orgId,
      requireInspection: false
    });
    assert.equal(buffer.toString("utf8"), payload.toString("utf8"));

    console.log("STEP 4 SHA-256 VERIFY");
    assert.equal(digest, expectedDigest);
    assert.equal(digest, row.sha256);
    console.log(`  digest=${digest} MATCH`);

    console.log("STEP 5 DELETE — S3CompatibleObjectStore.delete");
    const deleted = await store.delete(row.object_key);
    assert.equal(deleted, true);
    objectKey = null;
    console.log("  deleted=true");

    console.log("STEP 6 MISSING CONFIRMED");
    assert.equal(await store.exists(row.object_key), false);
    await assert.rejects(
      () => store.get(row.object_key),
      (err) => err instanceof ObjectStoreError && err.code === "NOT_FOUND"
    );
    await assert.rejects(
      () => evidence.getContent(row.id, { organizationId: orgId, requireInspection: false }),
      (err) => err instanceof EvidenceServiceError && err.code === "STORAGE_MISSING"
    );
    console.log("  exists=false get=NOT_FOUND EvidenceService=STORAGE_MISSING");

    console.log("\n===== MINIO LIVE FLOW PASS =====");
    console.log("EvidenceService → S3CompatibleObjectStore → MinIO REAL local");
    console.log("PUT → HEAD → GET → SHA-256 VERIFY → DELETE → MISSING CONFIRMED");
  } finally {
    await cleanupTestRun(pool, { orgId, evidenceId, objectKey, store });
    await pool.end();
  }
}

if (require.main === module) {
  runMinioLiveFlow().catch((err) => {
    console.error("\n===== MINIO LIVE FLOW FAIL =====");
    console.error(err.message || err);
    process.exit(1);
  });
}

module.exports = { runMinioLiveFlow, loadMinioEndpointFromEnv };
