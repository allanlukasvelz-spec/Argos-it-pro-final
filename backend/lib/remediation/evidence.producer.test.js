/**
 * Phase 6 INCIDENT_EVIDENCE_REFRESH → EvidenceService producer integration tests.
 * Run: node --test backend/lib/remediation/evidence.producer.test.js
 */
const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { getAction } = require("./registry");
const { configureEvidenceStore, setEvidenceStoreForTests, NoopEvidenceStore } = require("../platform/evidenceStore");
const { createEvidenceService } = require("../platform/evidenceService");
const { ObjectStoreError } = require("../platform/localPrivateObjectStore");
const {
  buildIdempotencyKey,
  buildIncidentEvidenceArtifact,
  serializeArtifact,
  EVIDENCE_ARTIFACT_SCHEMA_VERSION
} = require("./incidentEvidenceArtifact");
const { sanitizeRemediationPayload } = require("./sanitize");

const ORG_A = 10;
const ORG_B = 20;
const INC_A = 100;
const INC_B = 200;
const EXEC_ID = 501;
const USER = 1;

function tmpEvidenceRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "argos-evidence-producer-"));
}

function createProducerPool() {
  const state = {
    evidence: [],
    incidentEvents: [],
    activity: [],
    nextEventId: 1
  };
  let txSnapshot = null;
  let commitShouldFail = false;
  let eventInsertShouldFail = false;

  async function runQuery(sql, params = []) {
    const s = String(sql).replace(/\s+/g, " ").trim();
    if (s === "BEGIN") {
      txSnapshot = {
        evidence: state.evidence.map((r) => ({ ...r })),
        incidentEvents: state.incidentEvents.map((r) => ({ ...r }))
      };
      return { rows: [] };
    }
    if (s === "COMMIT") {
      if (commitShouldFail) {
        if (txSnapshot) {
          state.evidence = txSnapshot.evidence.map((r) => ({ ...r }));
          state.incidentEvents = txSnapshot.incidentEvents.map((r) => ({ ...r }));
          txSnapshot = null;
        }
        const err = new Error("commit failed");
        err.code = "COMMIT_FAILED";
        throw err;
      }
      txSnapshot = null;
      return { rows: [] };
    }
    if (s === "ROLLBACK") {
      if (txSnapshot) {
        state.evidence = txSnapshot.evidence;
        state.incidentEvents = txSnapshot.incidentEvents;
        txSnapshot = null;
      }
      return { rows: [] };
    }
    if (s.startsWith("SELECT id FROM incidents WHERE id")) {
      const [incidentId, orgId] = params;
      if (incidentId === INC_A && orgId === ORG_A) return { rows: [{ id: INC_A }] };
      if (incidentId === INC_B && orgId === ORG_B) return { rows: [{ id: INC_B }] };
      return { rows: [] };
    }
    if (s.includes("FROM incidents") && s.includes("organization_id = $2")) {
      const [incidentId, orgId] = params;
      if (incidentId === INC_A && orgId === ORG_A) {
        return {
          rows: [
            {
              id: INC_A,
              organization_id: ORG_A,
              asset_id: 5,
              title: "HTTP outage",
              summary: "5xx detected",
              severity: "CRITICAL",
              state: "OPEN",
              correlation_key: "corr-a",
              opened_at: "2026-01-01T00:00:00.000Z",
              updated_at: "2026-01-02T00:00:00.000Z",
              resolved_at: null
            }
          ]
        };
      }
      return { rows: [] };
    }
    if (s.includes("FROM alerts") && s.includes("GROUP BY severity")) {
      return { rows: [{ severity: "CRITICAL", count: 1 }] };
    }
    if (s.includes("FROM assets WHERE id")) {
      return { rows: [{ id: 5, hostname: "app-a.example.test" }] };
    }
    if (s.includes("FROM monitors WHERE organization_id")) {
      return { rows: [] };
    }
    if (s.includes("FROM observations")) {
      return { rows: [] };
    }
    if (s.includes("SELECT 1 FROM alerts")) {
      return { rows: [{ "?column?": 1 }] };
    }
    if (s.startsWith("INSERT INTO evidence_objects")) {
      const row = {
        id: params[0],
        organization_id: params[1],
        asset_id: params[2],
        incident_id: params[3],
        remediation_execution_id: params[4],
        object_key: params[5],
        sha256: params[6],
        mime_type: params[7],
        byte_length: params[8],
        retention_class: params[9],
        retention_until: params[10],
        scan_status: params[11],
        status: "AVAILABLE",
        created_by: params[12],
        idempotency_key: params[13],
        created_at: new Date().toISOString()
      };
      const dup = state.evidence.find(
        (r) =>
          r.organization_id === row.organization_id &&
          r.idempotency_key === row.idempotency_key &&
          r.status === "AVAILABLE"
      );
      if (dup) {
        const err = new Error("duplicate");
        err.code = "23505";
        throw err;
      }
      state.evidence.push(row);
      return { rows: [row] };
    }
    if (s.includes("FROM evidence_objects") && s.includes("idempotency_key")) {
      const row = state.evidence.find(
        (r) =>
          r.organization_id === params[0] &&
          r.idempotency_key === params[1] &&
          r.status === "AVAILABLE"
      );
      return { rows: row ? [row] : [] };
    }
    if (s.includes("FROM evidence_objects WHERE id =")) {
      const row = state.evidence.find((r) => r.id === params[0]);
      return { rows: row ? [row] : [] };
    }
    if (s.includes("COALESCE(SUM(byte_length)")) {
      return { rows: [{ total: "0" }] };
    }
    if (s.startsWith("INSERT INTO activity_logs")) {
      state.activity.push({
        action_type: params[2],
        details: params[3]
      });
      return { rows: [] };
    }
    if (s.includes("FROM incident_events") && s.includes("remediationExecutionId")) {
      const row = state.incidentEvents.find(
        (e) =>
          e.incident_id === params[0] &&
          e.organization_id === params[1] &&
          String(e.payload?.remediationExecutionId) === String(params[2])
      );
      return { rows: row ? [row] : [] };
    }
    if (s.startsWith("INSERT INTO incident_events")) {
      if (eventInsertShouldFail) {
        const err = new Error("event insert failed");
        err.code = "EVENT_INSERT_FAILED";
        throw err;
      }
      const payload =
        typeof params[2] === "string" ? JSON.parse(params[2]) : params[2];
      const row = {
        id: state.nextEventId++,
        incident_id: params[0],
        organization_id: params[1],
        kind: "EVIDENCE",
        payload,
        actor_user_id: params[3],
        created_at: new Date().toISOString()
      };
      state.incidentEvents.push(row);
      return { rows: [{ id: row.id, created_at: row.created_at }] };
    }
    throw new Error(`Unhandled SQL: ${s}`);
  }

  const pool = {
    state,
    setCommitShouldFail(value) {
      commitShouldFail = value;
    },
    setEventInsertShouldFail(value) {
      eventInsertShouldFail = value;
    },
    query: runQuery,
    connect: async () => ({
      query: runQuery,
      release: () => {}
    })
  };
  return pool;
}

function baseCtx(pool, overrides = {}) {
  return {
    pool,
    organizationId: ORG_A,
    incidentId: INC_A,
    assetId: 5,
    executionId: EXEC_ID,
    actorUserId: USER,
    evidenceIn: { signal: "5xx", authorization: "Bearer secret", token: "abc" },
    input: {},
    ...overrides
  };
}

describe("INCIDENT_EVIDENCE_REFRESH producer", () => {
  let root;
  let pool;

  beforeEach(() => {
    root = tmpEvidenceRoot();
    configureEvidenceStore({ rootDir: root });
    pool = createProducerPool();
  });

  afterEach(() => {
    setEvidenceStoreForTests(new NoopEvidenceStore());
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("artifact redacts secrets and uses schema version", () => {
    const artifact = buildIncidentEvidenceArtifact(baseCtx(pool), {
      incident: {
        id: INC_A,
        organization_id: ORG_A,
        asset_id: 5,
        title: "t",
        summary: "s",
        severity: "CRITICAL",
        state: "OPEN",
        correlation_key: "k",
        opened_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        resolved_at: null
      },
      assetId: 5,
      alertSummary: { openCount: 1, bySeverity: { CRITICAL: 1 } },
      healthSummary: null
    });
    assert.equal(artifact.schemaVersion, EVIDENCE_ARTIFACT_SCHEMA_VERSION);
    assert.equal(artifact.safeEvidence.evidenceIn.authorization, "[REDACTED]");
    assert.equal(artifact.safeEvidence.evidenceIn.token, "[REDACTED]");
    assert.doesNotThrow(() => JSON.parse(serializeArtifact(artifact)));
  });

  it("execute persists evidence object + incident event with linkage", async () => {
    const action = getAction("INCIDENT_EVIDENCE_REFRESH");
    const result = await action.execute(baseCtx(pool));
    assert.ok(result.eventId);
    assert.ok(result.evidenceObjectId);
    assert.ok(result.sha256);
    assert.equal(pool.state.evidence.length, 1);
    assert.equal(pool.state.evidence[0].organization_id, ORG_A);
    assert.equal(pool.state.evidence[0].incident_id, INC_A);
    assert.equal(pool.state.evidence[0].remediation_execution_id, EXEC_ID);
    assert.equal(pool.state.evidence[0].mime_type, "application/json");
    assert.equal(pool.state.incidentEvents.length, 1);
    assert.equal(pool.state.incidentEvents[0].payload.evidenceObjectId, result.evidenceObjectId);

    const evidence = createEvidenceService(pool);
    const { buffer, digest } = await evidence.getContent(result.evidenceObjectId, {
      organizationId: ORG_A
    });
    assert.equal(digest, result.sha256);
    const parsed = JSON.parse(buffer.toString("utf8"));
    assert.equal(parsed.incidentId, INC_A);
    assert.equal(parsed.organizationId, ORG_A);
    assert.equal(parsed.remediationExecutionId, EXEC_ID);
  });

  it("retry is idempotent for evidence object and incident event", async () => {
    const action = getAction("INCIDENT_EVIDENCE_REFRESH");
    const first = await action.execute(baseCtx(pool));
    const second = await action.execute(baseCtx(pool));
    assert.equal(pool.state.evidence.length, 1);
    assert.equal(pool.state.incidentEvents.length, 1);
    assert.equal(first.evidenceObjectId, second.evidenceObjectId);
    assert.equal(first.eventId, second.eventId);
    assert.equal(buildIdempotencyKey(EXEC_ID), pool.state.evidence[0].idempotency_key);
  });

  it("tenant B cannot read tenant A artifact", async () => {
    const action = getAction("INCIDENT_EVIDENCE_REFRESH");
    const result = await action.execute(baseCtx(pool));
    const evidence = createEvidenceService(pool);
    await assert.rejects(
      () => evidence.getContent(result.evidenceObjectId, { organizationId: ORG_B }),
      (err) => err.code === "FORBIDDEN"
    );
  });

  it("object store failure → execute fails without incident event", async () => {
    class FailingStore {
      async put() {
        throw new ObjectStoreError("STORAGE_DOWN", "Injected failure");
      }
      async get() {
        throw new ObjectStoreError("NOT_FOUND", "missing");
      }
      async delete() {
        return false;
      }
    }
    setEvidenceStoreForTests(new FailingStore());
    const action = getAction("INCIDENT_EVIDENCE_REFRESH");
    await assert.rejects(
      () => action.execute(baseCtx(pool)),
      (err) => err.code === "STORAGE_DOWN"
    );
    assert.equal(pool.state.evidence.length, 0);
    assert.equal(pool.state.incidentEvents.length, 0);
  });

  it("event link failure → execute fails; object remains for reconciliation", async () => {
    pool.setEventInsertShouldFail(true);
    const action = getAction("INCIDENT_EVIDENCE_REFRESH");
    await assert.rejects(
      () => action.execute(baseCtx(pool)),
      (err) => err.code === "EVENT_LINK_FAILED"
    );
    assert.equal(pool.state.evidence.length, 1);
    assert.equal(pool.state.incidentEvents.length, 0);
    assert.ok(pool.state.activity.some((a) => a.action_type === "evidence_event_link_failed"));
  });

  it("verify requires evidence_object_id", async () => {
    const action = getAction("INCIDENT_EVIDENCE_REFRESH");
    assert.equal((await action.verify({}, { eventId: 1 })).pass, false);
    assert.equal(
      (await action.verify({}, { eventId: 1, evidenceObjectId: "uuid" })).pass,
      true
    );
  });

  it("dryRun mentions EvidenceService persistence", async () => {
    const action = getAction("INCIDENT_EVIDENCE_REFRESH");
    const plan = await action.dryRun(baseCtx(pool));
    assert.match(plan.plan.expected_effect, /EvidenceService/);
    assert.deepEqual(plan.plan.verification_plan.require, ["event_id", "evidence_object_id"]);
  });
});

describe("EvidenceService orphan compensation", () => {
  let root;

  beforeEach(() => {
    root = tmpEvidenceRoot();
    configureEvidenceStore({ rootDir: root });
  });

  afterEach(() => {
    setEvidenceStoreForTests(new NoopEvidenceStore());
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("deletes object bytes when DB COMMIT fails after put", async () => {
    const state = { evidence: [] };
    let txSnapshot = null;
    async function runQuery(sql, params = []) {
      const s = String(sql).replace(/\s+/g, " ").trim();
      if (s === "BEGIN") {
        txSnapshot = { evidence: state.evidence.map((r) => ({ ...r })) };
        return { rows: [] };
      }
      if (s === "COMMIT") {
        if (txSnapshot) {
          state.evidence = txSnapshot.evidence.map((r) => ({ ...r }));
          txSnapshot = null;
        }
        const err = new Error("commit failed");
        err.code = "COMMIT_FAILED";
        throw err;
      }
      if (s === "ROLLBACK") {
        if (txSnapshot) {
          state.evidence = txSnapshot.evidence.map((r) => ({ ...r }));
          txSnapshot = null;
        }
        return { rows: [] };
      }
      if (s.startsWith("INSERT INTO evidence_objects")) {
        state.evidence.push({
          id: params[0],
          object_key: params[5],
          status: "AVAILABLE"
        });
        return { rows: [state.evidence[state.evidence.length - 1]] };
      }
      if (s.includes("idempotency_key")) return { rows: [] };
      if (s.includes("COALESCE(SUM")) return { rows: [{ total: "0" }] };
      if (s.startsWith("INSERT INTO activity_logs")) return { rows: [] };
      throw new Error(`Unhandled SQL: ${s}`);
    }
    const pool = {
      state,
      query: runQuery,
      connect: async () => ({ query: runQuery, release: () => {} })
    };

    function countStoredFiles(dir) {
      let count = 0;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) count += countStoredFiles(full);
        else if (entry.isFile() && !entry.name.endsWith(".tmp")) count += 1;
      }
      return count;
    }

    const evidence = createEvidenceService(pool);
    await assert.rejects(
      () =>
        evidence.store({
          organizationId: ORG_A,
          incidentId: INC_A,
          mimeType: "application/json",
          buffer: Buffer.from('{"ok":true}\n', "utf8"),
          idempotencyKey: "orphan-test"
        }),
      (err) => err.code === "COMMIT_FAILED"
    );
    assert.equal(state.evidence.length, 0);
    assert.equal(countStoredFiles(root), 0);
  });
});
