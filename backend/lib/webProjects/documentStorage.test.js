const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const os = require("os");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { createMemoryStore } = require("./memoryStore");
const { createMemoryObjectStore } = require("./memoryObjectStore");
const { createWebProjectService } = require("./service");
const { LocalPrivateObjectStore } = require("../platform/localPrivateObjectStore");
const { sanitizeOriginalFilename, contentDisposition } = require("./filename");
const { MIME_VALIDATION_LEVEL, assertMimeAndExtension } = require("./mimePolicy");
const { AUDIT_ACTIONS } = require("./constants");

const PDF = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.from("1 0 obj<<>>endobj\n%%EOF\n")]);

function serviceWithStore(objectStore) {
  const db = createMemoryStore();
  return { db, objectStore, svc: createWebProjectService(db, { objectStore }) };
}

describe("web project document storage", () => {
  it("declares honest MIME validation level", () => {
    assert.equal(MIME_VALIDATION_LEVEL, "header+extension+magic_where_available");
  });

  it("uploads bytes, stores sha256 from backend, and downloads the same payload", async () => {
    const { db, objectStore, svc } = serviceWithStore(createMemoryObjectStore());
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });
    const doc = await svc.uploadDocument(10, project.id, 1, {
      buffer: PDF,
      originalFilename: "brief.pdf",
      mimeType: "application/pdf",
      requirementKey: "brief"
    });
    assert.equal(doc.uploadStatus, "STORED");
    assert.equal(doc.scanStatus, "SCAN_NOT_AVAILABLE");
    assert.equal(doc.sha256, crypto.createHash("sha256").update(PDF).digest("hex"));
    assert.match(doc.objectKey, /^org\/10\/wp\//);
    assert.equal(objectStore.objects.size, 1);
    const downloaded = await svc.getDocumentContent(10, project.id, doc.id);
    assert.equal(downloaded.buffer.equals(PDF), true);
    assert.ok(db.state.activity.some((row) => row.action_type === AUDIT_ACTIONS.DOCUMENT_UPLOADED));
  });

  it("rejects empty, oversize, forbidden extension, MIME mismatch and traversal filename", async () => {
    const { svc } = serviceWithStore(createMemoryObjectStore());
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });
    await assert.rejects(
      () =>
        svc.uploadDocument(10, project.id, 1, {
          buffer: Buffer.alloc(0),
          originalFilename: "empty.pdf",
          mimeType: "application/pdf"
        }),
      (err) => err.code === "DOCUMENT_INVALID"
    );
    await assert.rejects(
      () =>
        svc.uploadDocument(10, project.id, 1, {
          buffer: Buffer.alloc(21 * 1024 * 1024, 1),
          originalFilename: "huge.pdf",
          mimeType: "application/pdf"
        }),
      (err) => err.code === "DOCUMENT_INVALID"
    );
    await assert.rejects(
      () =>
        svc.uploadDocument(10, project.id, 1, {
          buffer: PDF,
          originalFilename: "malware.exe",
          mimeType: "application/pdf"
        }),
      (err) => err.code === "DOCUMENT_INVALID"
    );
    await assert.rejects(
      () =>
        svc.uploadDocument(10, project.id, 1, {
          buffer: Buffer.from("not a pdf"),
          originalFilename: "fake.pdf",
          mimeType: "application/pdf"
        }),
      (err) => err.code === "DOCUMENT_INVALID"
    );
    assert.throws(() => sanitizeOriginalFilename("../etc/passwd.pdf"), (err) => {
      return err.code === "DOCUMENT_INVALID";
    });
  });

  it("rejects client-supplied object_key and sha256", async () => {
    const { svc } = serviceWithStore(createMemoryObjectStore());
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });
    await assert.rejects(
      () =>
        svc.uploadDocument(10, project.id, 1, {
          buffer: PDF,
          originalFilename: "a.pdf",
          mimeType: "application/pdf",
          objectKey: "org/20/wp/00000000-0000-4000-8000-000000000001"
        }),
      (err) => err.code === "DOCUMENT_INVALID"
    );
    await assert.rejects(
      () =>
        svc.uploadDocument(10, project.id, 1, {
          buffer: PDF,
          originalFilename: "a.pdf",
          mimeType: "application/pdf",
          sha256: "a".repeat(64)
        }),
      (err) => err.code === "DOCUMENT_INVALID"
    );
  });

  it("fails closed when object store is down and does not insert metadata", async () => {
    const objectStore = createMemoryObjectStore();
    objectStore.state.failPut = true;
    const { db, svc } = serviceWithStore(objectStore);
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });
    await assert.rejects(
      () =>
        svc.uploadDocument(10, project.id, 1, {
          buffer: PDF,
          originalFilename: "a.pdf",
          mimeType: "application/pdf"
        }),
      (err) => err.code === "STORAGE_UNAVAILABLE"
    );
    assert.equal(db.state.documents.length, 0);
  });

  it("compensates by deleting the object if DB/audit fails after put", async () => {
    const objectStore = createMemoryObjectStore();
    const db = createMemoryStore();
    const originalInsert = db.insertActivityLog.bind(db);
    let uploads = 0;
    db.insertActivityLog = async (row) => {
      if (row.action_type === AUDIT_ACTIONS.DOCUMENT_UPLOADED) {
        uploads += 1;
        throw new Error("audit boom");
      }
      return originalInsert(row);
    };
    const svc = createWebProjectService(db, { objectStore });
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });
    await assert.rejects(
      () =>
        svc.uploadDocument(10, project.id, 1, {
          buffer: PDF,
          originalFilename: "a.pdf",
          mimeType: "application/pdf"
        }),
      (err) => err.message === "audit boom"
    );
    assert.equal(objectStore.objects.size, 0);
    assert.equal(objectStore.state.deleted.length, 1);
    assert.equal(db.state.documents.length, 0);
    assert.equal(uploads, 1);
  });

  it("download of missing object fails safely", async () => {
    const objectStore = createMemoryObjectStore();
    const { svc } = serviceWithStore(objectStore);
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });
    const doc = await svc.uploadDocument(10, project.id, 1, {
      buffer: PDF,
      originalFilename: "a.pdf",
      mimeType: "application/pdf"
    });
    objectStore.objects.clear();
    await assert.rejects(
      () => svc.getDocumentContent(10, project.id, doc.id),
      (err) => err.code === "NOT_FOUND" || err.code === "STORAGE_UNAVAILABLE"
    );
  });

  it("local private store keeps wp keys off public static paths", async () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "argos-wp-store-"));
    const local = new LocalPrivateObjectStore({ rootDir });
    const { svc } = serviceWithStore(local);
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });
    const doc = await svc.uploadDocument(10, project.id, 1, {
      buffer: PDF,
      originalFilename: "a.pdf",
      mimeType: "application/pdf"
    });
    const physical = local.resolvePhysicalPath(doc.objectKey);
    assert.ok(physical.startsWith(rootDir));
    assert.ok(!physical.includes(`${path.sep}frontend${path.sep}public`));
    assert.ok(!physical.includes(`${path.sep}public${path.sep}`));
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it("Content-Disposition is attachment and safe", () => {
    const header = contentDisposition("informe final.pdf");
    assert.match(header, /^attachment;/);
    assert.doesNotMatch(header, /[\r\n]/);
  });

  it("org B cannot download org A by document id", async () => {
    const { svc } = serviceWithStore(createMemoryObjectStore());
    const project = await svc.createProject({
      organizationId: 10,
      actorUserId: 1,
      title: "A",
      projectType: "create"
    });
    const doc = await svc.uploadDocument(10, project.id, 1, {
      buffer: PDF,
      originalFilename: "a.pdf",
      mimeType: "application/pdf"
    });
    await assert.rejects(() => svc.getDocumentContent(20, project.id, doc.id), (err) => {
      return err.code === "NOT_FOUND";
    });
  });

  it("does not treat ZIP magic as a declared zip upload", () => {
    assert.throws(
      () =>
        assertMimeAndExtension({
          declaredMime: "application/pdf",
          filename: "x.pdf",
          buffer: Buffer.from("PK\u0003\u0004binary")
        }),
      (err) => err.code === "DOCUMENT_INVALID"
    );
  });
});
