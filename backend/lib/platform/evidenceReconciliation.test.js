/**
 * Evidence reconciliation dry-run tests.
 */
const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { configureEvidenceStore, setEvidenceStoreForTests, NoopEvidenceStore } = require("./evidenceStore");
const { reconcileEvidence, CATEGORIES } = require("./evidenceReconciliation");
const { buildObjectKey } = require("./objectKey");

const ORG = 10;
const EVID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

function memoryPool(rows = []) {
  const state = { evidence: [...rows], events: [] };
  return {
    state,
    query: async (sql, params = []) => {
      const s = String(sql).replace(/\s+/g, " ").trim();
      if (s.includes("FROM evidence_objects")) {
        return { rows: state.evidence.filter((r) => r.status === "AVAILABLE") };
      }
      if (s.includes("FROM incident_events")) {
        const match = state.events.find(
          (e) =>
            e.incident_id === params[0] &&
            e.organization_id === params[1] &&
            String(e.payload?.evidenceObjectId) === String(params[2])
        );
        return { rows: match ? [match] : [] };
      }
      return { rows: [] };
    }
  };
}

describe("evidence reconciliation", () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "argos-reconcile-"));
    configureEvidenceStore({ rootDir: root, backend: "local" });
  });

  afterEach(() => {
    setEvidenceStoreForTests(new NoopEvidenceStore());
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("dry-run detects METADATA_WITHOUT_OBJECT", async () => {
    const key = buildObjectKey(ORG, EVID);
    const pool = memoryPool([
      {
        id: EVID,
        organization_id: ORG,
        object_key: key,
        sha256: "a".repeat(64),
        status: "AVAILABLE",
        remediation_execution_id: null,
        incident_id: null
      }
    ]);
    const report = await reconcileEvidence(pool, { dryRun: true });
    assert.ok(report.findings.some((f) => f.category === CATEGORIES.METADATA_WITHOUT_OBJECT));
    assert.equal(report.dryRun, true);
  });

  it("dry-run detects CHECKSUM_MISMATCH", async () => {
    const key = buildObjectKey(ORG, EVID);
    const store = configureEvidenceStore({ rootDir: root, backend: "local" });
    await store.put(key, Buffer.from("actual-bytes", "utf8"));
    const pool = memoryPool([
      {
        id: EVID,
        organization_id: ORG,
        object_key: key,
        sha256: "b".repeat(64),
        status: "AVAILABLE",
        remediation_execution_id: null,
        incident_id: null
      }
    ]);
    const report = await reconcileEvidence(pool, { dryRun: true });
    assert.ok(report.findings.some((f) => f.category === CATEGORIES.CHECKSUM_MISMATCH));
  });

  it("dry-run detects OBJECT_WITHOUT_EVENT_LINK", async () => {
    const key = buildObjectKey(ORG, EVID);
    const store = configureEvidenceStore({ rootDir: root, backend: "local" });
    const payload = Buffer.from('{"ok":true}', "utf8");
    await store.put(key, payload);
    const crypto = require("crypto");
    const digest = crypto.createHash("sha256").update(payload).digest("hex");
    const pool = memoryPool([
      {
        id: EVID,
        organization_id: ORG,
        object_key: key,
        sha256: digest,
        status: "AVAILABLE",
        remediation_execution_id: 501,
        incident_id: 100
      }
    ]);
    const report = await reconcileEvidence(pool, { dryRun: true });
    assert.ok(report.findings.some((f) => f.category === CATEGORIES.OBJECT_WITHOUT_EVENT_LINK));
  });
});
