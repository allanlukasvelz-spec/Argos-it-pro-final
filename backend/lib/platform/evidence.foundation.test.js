/**
 * Evidence foundation — storage, policy, service, tenant/security/failure tests.
 * Run: node --test backend/lib/platform/evidence.foundation.test.js
 */
const { describe, it, before, after, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const http = require("node:http");
const express = require("express");
const {
  LocalPrivateObjectStore,
  ObjectStoreError,
  buildObjectKey
} = require("./localPrivateObjectStore");
const {
  assertMimeMatchesContent,
  assertSizeWithinLimit,
  getMaxBytes
} = require("./evidencePolicy");
const {
  configureEvidenceStore,
  setEvidenceStoreForTests,
  NoopEvidenceStore
} = require("./evidenceStore");
const { createEvidenceService, EvidenceServiceError } = require("./evidenceService");
const createClientRouter = require("../../routes/client");
const createNocEvidenceRouter = require("../../routes/nocEvidence");
const { resolveTenantContext, requireTenant } = require("../../middleware/tenantContext");
const requireNocAccess = require("../../middleware/requireNocAccess");

const ORG_A = 10;
const ORG_B = 20;
const USER_A = 1;
const USER_NOC = 99;

function tmpEvidenceRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "argos-evidence-"));
}

function createMemoryPool(initialRows = []) {
  const state = {
    evidence: [...initialRows],
    activity: [],
    security: []
  };
  let txSnapshot = null;

  async function runQuery(sql, params = []) {
    const s = String(sql).replace(/\s+/g, " ").trim();
    if (s === "BEGIN") {
      txSnapshot = {
        evidence: state.evidence.map((row) => ({ ...row }))
      };
      return { rows: [] };
    }
    if (s === "COMMIT") {
      txSnapshot = null;
      return { rows: [] };
    }
    if (s === "ROLLBACK") {
      if (txSnapshot) {
        state.evidence = txSnapshot.evidence;
        txSnapshot = null;
      }
      return { rows: [] };
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
          r.idempotency_key &&
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
      const [orgId, key] = params;
      const row = state.evidence.find(
        (r) =>
          r.organization_id === orgId &&
          r.idempotency_key === key &&
          r.status === "AVAILABLE"
      );
      return { rows: row ? [row] : [] };
    }
    if (s.includes("FROM evidence_objects WHERE id =")) {
      const row = state.evidence.find((r) => r.id === params[0]);
      return { rows: row ? [row] : [] };
    }
    if (s.includes("FROM evidence_objects") && s.includes("organization_id =")) {
      const [orgId, limit, offset] = params;
      const rows = state.evidence
        .filter((r) => r.organization_id === orgId && r.status === "AVAILABLE")
        .slice(Number(offset), Number(offset) + Number(limit));
      return { rows };
    }
    if (s.includes("COALESCE(SUM(byte_length)")) {
      const total = state.evidence
        .filter((r) => r.organization_id === params[0] && r.status === "AVAILABLE")
        .reduce((acc, r) => acc + Number(r.byte_length), 0);
      return { rows: [{ total: String(total) }] };
    }
    if (s.startsWith("UPDATE evidence_objects")) {
      const row = state.evidence.find((r) => r.id === params[0]);
      if (row) row.status = "ORPHANED";
      return { rows: [] };
    }
    if (s.startsWith("INSERT INTO activity_logs")) {
      state.activity.push({
        user_id: params[0],
        organization_id: params[1],
        action_type: params[2],
        details: params[3]
      });
      return { rows: [] };
    }
    if (s.startsWith("INSERT INTO security_logs")) {
      state.security.push({
        user_id: params[0],
        organization_id: params[1],
        action: params[2],
        risk_level: params[3],
        details: params[4]
      });
      return { rows: [] };
    }
    if (s.includes("FROM evidence_objects") && s.includes("ORDER BY created_at")) {
      const [limit, offset] = params;
      const rows = state.evidence
        .filter((r) => r.status === "AVAILABLE")
        .slice(Number(offset), Number(offset) + Number(limit));
      return { rows };
    }
    throw new Error(`Unhandled SQL in memory pool: ${s}`);
  }

  const pool = {
    state,
    query: runQuery,
    connect: async () => ({
      query: runQuery,
      release: () => {}
    })
  };
  return pool;
}

describe("LocalPrivateObjectStore", () => {
  let root;

  before(() => {
    root = tmpEvidenceRoot();
  });

  after(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("stores and reads opaque keys without exposing physical paths", async () => {
    const store = new LocalPrivateObjectStore({ rootDir: root });
    const key = buildObjectKey(ORG_A, "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    await store.put(key, Buffer.from('{"ok":true}', "utf8"));
    const buf = await store.get(key);
    assert.equal(buf.toString("utf8"), '{"ok":true}');
  });

  it("rejects traversal keys", async () => {
    const store = new LocalPrivateObjectStore({ rootDir: root });
    await assert.rejects(
      () => store.put("org/10/ev/../../etc/passwd", Buffer.from("x")),
      (err) => err instanceof ObjectStoreError && err.code === "INVALID_OBJECT_KEY"
    );
  });

  it("rejects symlink escape on read", async () => {
    const store = new LocalPrivateObjectStore({ rootDir: root });
    const key = buildObjectKey(ORG_A, "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    const target = store.resolvePhysicalPath(key);
    await fsp.mkdir(path.dirname(target), { recursive: true });
    const outside = path.join(root, "outside-secret.txt");
    await fsp.writeFile(outside, "secret", "utf8");
    await fsp.symlink(outside, target);
    await assert.rejects(
      () => store.get(key),
      (err) => err instanceof ObjectStoreError && err.code === "SYMLINK_ESCAPE"
    );
  });
});

describe("Evidence policy", () => {
  it("rejects MIME spoof (png declared, plain content)", () => {
    assert.throws(
      () => assertMimeMatchesContent("image/png", Buffer.from("hello", "utf8")),
      (err) => err.code === "MIME_SPOOF"
    );
  });

  it("rejects oversized payload", () => {
    const prev = process.env.ARGOS_EVIDENCE_MAX_BYTES;
    process.env.ARGOS_EVIDENCE_MAX_BYTES = "16";
    try {
      assert.throws(
        () => assertSizeWithinLimit(32),
        (err) => err.code === "PAYLOAD_TOO_LARGE"
      );
      assert.doesNotThrow(() => assertSizeWithinLimit(8));
    } finally {
      if (prev == null) delete process.env.ARGOS_EVIDENCE_MAX_BYTES;
      else process.env.ARGOS_EVIDENCE_MAX_BYTES = prev;
    }
  });
});

describe("EvidenceService consistency", () => {
  let root;
  let pool;

  beforeEach(() => {
    root = tmpEvidenceRoot();
    configureEvidenceStore({ rootDir: root });
    pool = createMemoryPool();
  });

  afterEach(() => {
    setEvidenceStoreForTests(new NoopEvidenceStore());
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("stores metadata and bytes with matching sha256", async () => {
    const svc = createEvidenceService(pool);
    const payload = Buffer.from('{"phase":"6"}', "utf8");
    const { row, created } = await svc.store({
      organizationId: ORG_A,
      mimeType: "application/json",
      buffer: payload,
      createdBy: USER_A
    });
    assert.equal(created, true);
    const { buffer, digest } = await svc.getContent(row.id, {
      organizationId: ORG_A,
      userId: USER_A,
      audit: { actionType: "test_download" }
    });
    assert.equal(buffer.toString("utf8"), payload.toString("utf8"));
    assert.equal(digest, row.sha256);
  });

  it("enforces tenant isolation on metadata", async () => {
    const svc = createEvidenceService(pool);
    const { row } = await svc.store({
      organizationId: ORG_A,
      mimeType: "text/plain",
      buffer: Buffer.from("tenant-a", "utf8")
    });
    await assert.rejects(
      () => svc.getMetadata(row.id, { organizationId: ORG_B }),
      (err) => err instanceof EvidenceServiceError && err.code === "FORBIDDEN"
    );
  });

  it("is idempotent on idempotency_key", async () => {
    const svc = createEvidenceService(pool);
    const first = await svc.store({
      organizationId: ORG_A,
      mimeType: "text/plain",
      buffer: Buffer.from("same", "utf8"),
      idempotencyKey: "idem-1"
    });
    const second = await svc.store({
      organizationId: ORG_A,
      mimeType: "text/plain",
      buffer: Buffer.from("same", "utf8"),
      idempotencyKey: "idem-1"
    });
    assert.equal(first.created, true);
    assert.equal(second.created, false);
    assert.equal(first.row.id, second.row.id);
  });

  it("fails closed when bytes missing in storage", async () => {
    const svc = createEvidenceService(pool);
    const { row } = await svc.store({
      organizationId: ORG_A,
      mimeType: "text/plain",
      buffer: Buffer.from("orphan-meta", "utf8")
    });
    const store = configureEvidenceStore({ rootDir: root });
    await store.delete(row.object_key);
    await assert.rejects(
      () =>
        svc.getContent(row.id, {
          organizationId: ORG_A,
          audit: { actionType: "test_missing" }
        }),
      (err) => err instanceof EvidenceServiceError && err.code === "STORAGE_MISSING"
    );
  });

  it("rolls back metadata when object put fails", async () => {
    class FailingStore {
      async put() {
        throw new ObjectStoreError("STORAGE_DOWN", "Injected failure");
      }
      async get() {
        throw new ObjectStoreError("NOT_FOUND", "missing");
      }
    }
    setEvidenceStoreForTests(new FailingStore());
    const svc = createEvidenceService(pool);
    await assert.rejects(
      () =>
        svc.store({
          organizationId: ORG_A,
          mimeType: "text/plain",
          buffer: Buffer.from("fail", "utf8")
        }),
      (err) => err instanceof EvidenceServiceError && err.code === "STORAGE_DOWN"
    );
    assert.equal(pool.state.evidence.length, 0);
  });

  it("detects checksum mismatch", async () => {
    const svc = createEvidenceService(pool);
    const { row } = await svc.store({
      organizationId: ORG_A,
      mimeType: "text/plain",
      buffer: Buffer.from("original", "utf8")
    });
    const target = new LocalPrivateObjectStore({ rootDir: root }).resolvePhysicalPath(row.object_key);
    await fsp.writeFile(target, Buffer.from("tampered", "utf8"));
    await assert.rejects(
      () => svc.getContent(row.id, { organizationId: ORG_A }),
      (err) => err instanceof EvidenceServiceError && err.code === "CHECKSUM_MISMATCH"
    );
  });
});

describe("Evidence route authorization", () => {
  function createRoutePool(membershipsByUser) {
    const memory = createMemoryPool();
    return {
      state: memory.state,
      query: async (sql, params) => {
        if (String(sql).includes("organization_members")) {
          return { rows: membershipsByUser[params[0]] || [] };
        }
        return memory.query(sql, params);
      },
      connect: (...args) => memory.connect(...args)
    };
  }

  it("client cannot read evidence from another tenant (IDOR)", async () => {
    const root = tmpEvidenceRoot();
    configureEvidenceStore({ rootDir: root });
    const pool = createRoutePool({
      [USER_A]: [
        {
          organization_id: ORG_A,
          slug: "a",
          name: "A",
          status: "active",
          org_role: "org_owner"
        }
      ]
    });
    const svc = createEvidenceService(pool);
    const tenantB = await svc.store({
      organizationId: ORG_B,
      mimeType: "text/plain",
      buffer: Buffer.from("secret-b", "utf8")
    });

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: USER_A, role: "cliente" };
      next();
    });
    app.use(
      "/api/client",
      resolveTenantContext(pool),
      requireTenant(),
      createClientRouter(pool)
    );

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/client/evidence/${tenantB.row.id}`);
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.code, "FORBIDDEN");
    } finally {
      await new Promise((resolve) => server.close(resolve));
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("NOC can store and download cross-tenant evidence with audit", async () => {
    const root = tmpEvidenceRoot();
    configureEvidenceStore({ rootDir: root });
    const pool = createMemoryPool();
    const app = express();
    app.use(express.json({ limit: "512kb" }));
    app.use((req, _res, next) => {
      req.user = { id: USER_NOC, role: "admin" };
      next();
    });
    app.use("/api/noc/evidence", requireNocAccess, createNocEvidenceRouter(pool));

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;
    try {
      const storeRes = await fetch(`http://127.0.0.1:${port}/api/noc/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: ORG_A,
          mimeType: "text/plain",
          contentBase64: Buffer.from("noc-store", "utf8").toString("base64")
        })
      });
      assert.equal(storeRes.status, 201);
      const stored = await storeRes.json();
      const contentRes = await fetch(
        `http://127.0.0.1:${port}/api/noc/evidence/${stored.item.id}/content`
      );
      assert.equal(contentRes.status, 200);
      assert.equal(await contentRes.text(), "noc-store");
      assert.ok(pool.state.security.some((s) => s.action === "noc_evidence_content_read"));
    } finally {
      await new Promise((resolve) => server.close(resolve));
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects oversized NOC store payload", async () => {
    const root = tmpEvidenceRoot();
    configureEvidenceStore({ rootDir: root });
    const pool = createMemoryPool();
    const prevMax = process.env.ARGOS_EVIDENCE_MAX_BYTES;
    process.env.ARGOS_EVIDENCE_MAX_BYTES = "32";
    const app = express();
    app.use(express.json({ limit: "512kb" }));
    app.use((req, _res, next) => {
      req.user = { id: USER_NOC, role: "admin" };
      next();
    });
    app.use("/api/noc/evidence", requireNocAccess, createNocEvidenceRouter(pool));
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;
    try {
      const big = Buffer.alloc(64, "x").toString("base64");
      const res = await fetch(`http://127.0.0.1:${port}/api/noc/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: ORG_A,
          mimeType: "text/plain",
          contentBase64: big
        })
      });
      assert.equal(res.status, 413);
    } finally {
      await new Promise((resolve) => server.close(resolve));
      fs.rmSync(root, { recursive: true, force: true });
      if (prevMax == null) delete process.env.ARGOS_EVIDENCE_MAX_BYTES;
      else process.env.ARGOS_EVIDENCE_MAX_BYTES = prevMax;
    }
  });
});

describe("configureEvidenceStore", () => {
  it("defaults under backend/data/evidence outside public", () => {
    const { getDefaultEvidenceRoot } = require("./evidenceStore");
    const root = getDefaultEvidenceRoot();
    assert.ok(root.includes(`${path.sep}backend${path.sep}data${path.sep}evidence`));
    assert.ok(!root.includes(`${path.sep}frontend${path.sep}public`));
  });
});
