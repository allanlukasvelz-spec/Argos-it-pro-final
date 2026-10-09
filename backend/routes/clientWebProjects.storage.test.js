const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const crypto = require("node:crypto");
const express = require("express");
const createClientWebProjectsRouter = require("./clientWebProjects");
const { createMemoryStore } = require("../lib/webProjects/memoryStore");
const { createMemoryObjectStore } = require("../lib/webProjects/memoryObjectStore");
const { createWebProjectService } = require("../lib/webProjects/service");

const ORG_A = 10;
const ORG_B = 20;
const PDF = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.from("1 0 obj<<>>endobj\n%%EOF\n")]);

function createApp(service, { user, tenant }) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = user;
    req.tenant = tenant;
    next();
  });
  app.use("/api/client", createClientWebProjectsRouter(null, { service }));
  return app;
}

function ownerApp(service, orgId = ORG_A) {
  return createApp(service, {
    user: { id: 1, role: "cliente" },
    tenant: { id: orgId, orgRole: "org_owner", slug: "a", name: "A", status: "active" }
  });
}

function buildMultipart({ filename, mime, buffer, fields = {} }) {
  const boundary = "----ArgosWpBoundary7MA4YWxkTrZu0gW";
  const pieces = [];
  for (const [name, value] of Object.entries(fields)) {
    pieces.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
      )
    );
  }
  pieces.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`
    )
  );
  pieces.push(buffer);
  pieces.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: Buffer.concat(pieces)
  };
}

function request(app, { method, path, json, multipart, headers = {} }) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const payload = multipart ? multipart.body : json ? Buffer.from(JSON.stringify(json)) : null;
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          path,
          method,
          headers: {
            ...(json ? { "content-type": "application/json" } : {}),
            ...(multipart ? { "content-type": multipart.contentType } : {}),
            ...(payload ? { "content-length": String(payload.length) } : {}),
            ...headers
          }
        },
        (res) => {
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            server.close();
            const buffer = Buffer.concat(chunks);
            const contentType = String(res.headers["content-type"] || "");
            let parsed = null;
            if (contentType.includes("application/json") && buffer.length) {
              parsed = JSON.parse(buffer.toString("utf8"));
            }
            resolve({
              status: res.statusCode,
              headers: res.headers,
              buffer,
              json: parsed
            });
          });
        }
      );
      req.on("error", (err) => {
        server.close();
        reject(err);
      });
      if (payload) req.write(payload);
      req.end();
    });
  });
}

async function seedProject(service) {
  return service.createProject({
    organizationId: ORG_A,
    actorUserId: 1,
    title: "A",
    projectType: "create"
  });
}

describe("client web projects binary storage P0", () => {
  it("1-2 org A upload and download succeed with backend sha256", async () => {
    const objectStore = createMemoryObjectStore();
    const service = createWebProjectService(createMemoryStore(), { objectStore });
    const project = await seedProject(service);
    const app = ownerApp(service);
    const uploaded = await request(app, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({
        filename: "brief.pdf",
        mime: "application/pdf",
        buffer: PDF,
        fields: { requirementKey: "brief" }
      })
    });
    assert.equal(uploaded.status, 201);
    assert.equal(uploaded.json.document.uploadStatus, "STORED");
    assert.equal(uploaded.json.document.scanStatus, "SCAN_NOT_AVAILABLE");
    assert.equal(
      uploaded.json.document.sha256,
      crypto.createHash("sha256").update(PDF).digest("hex")
    );
    assert.match(uploaded.json.document.objectKey, /^org\/10\/wp\//);
    const downloaded = await request(app, {
      method: "GET",
      path: `/api/client/web-projects/${project.id}/documents/${uploaded.json.document.id}/content`
    });
    assert.equal(downloaded.status, 200);
    assert.equal(downloaded.buffer.equals(PDF), true);
    assert.equal(downloaded.headers["content-type"], "application/pdf");
    assert.match(String(downloaded.headers["content-disposition"]), /^attachment;/);
    assert.equal(downloaded.headers["cache-control"], "private, no-store");
    assert.equal(downloaded.headers["x-content-type-options"], "nosniff");
  });

  it("3-5 org B cannot see project, document metadata or content", async () => {
    const service = createWebProjectService(createMemoryStore(), {
      objectStore: createMemoryObjectStore()
    });
    const project = await seedProject(service);
    const owner = ownerApp(service);
    const uploaded = await request(owner, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({ filename: "brief.pdf", mime: "application/pdf", buffer: PDF })
    });
    const appB = ownerApp(service, ORG_B);
    const projectGet = await request(appB, {
      method: "GET",
      path: `/api/client/web-projects/${project.id}`
    });
    assert.equal(projectGet.status, 404);
    const docs = await request(appB, {
      method: "GET",
      path: `/api/client/web-projects/${project.id}/documents`
    });
    assert.equal(docs.status, 404);
    const content = await request(appB, {
      method: "GET",
      path: `/api/client/web-projects/${project.id}/documents/${uploaded.json.document.id}/content`
    });
    assert.equal(content.status, 404);
  });

  it("6 org_viewer cannot upload", async () => {
    const service = createWebProjectService(createMemoryStore(), {
      objectStore: createMemoryObjectStore()
    });
    const project = await seedProject(service);
    const app = createApp(service, {
      user: { id: 3, role: "cliente" },
      tenant: { id: ORG_A, orgRole: "org_viewer", slug: "a", name: "A", status: "active" }
    });
    const res = await request(app, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({ filename: "brief.pdf", mime: "application/pdf", buffer: PDF })
    });
    assert.equal(res.status, 403);
    assert.equal(res.json.code, "FORBIDDEN");
  });

  it("7 org_viewer can download own org", async () => {
    const service = createWebProjectService(createMemoryStore(), {
      objectStore: createMemoryObjectStore()
    });
    const project = await seedProject(service);
    const owner = ownerApp(service);
    const uploaded = await request(owner, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({ filename: "brief.pdf", mime: "application/pdf", buffer: PDF })
    });
    const viewer = createApp(service, {
      user: { id: 3, role: "cliente" },
      tenant: { id: ORG_A, orgRole: "org_viewer", slug: "a", name: "A", status: "active" }
    });
    const res = await request(viewer, {
      method: "GET",
      path: `/api/client/web-projects/${project.id}/documents/${uploaded.json.document.id}/content`
    });
    assert.equal(res.status, 200);
    assert.equal(res.buffer.equals(PDF), true);
  });

  it("8 org_member can upload own org", async () => {
    const service = createWebProjectService(createMemoryStore(), {
      objectStore: createMemoryObjectStore()
    });
    const project = await seedProject(service);
    const app = createApp(service, {
      user: { id: 4, role: "cliente" },
      tenant: { id: ORG_A, orgRole: "org_member", slug: "a", name: "A", status: "active" }
    });
    const res = await request(app, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({ filename: "brief.pdf", mime: "application/pdf", buffer: PDF })
    });
    assert.equal(res.status, 201);
    assert.equal(res.json.document.uploadStatus, "STORED");
  });

  it("9 archived project rejects upload but allows download", async () => {
    const store = createMemoryStore();
    const service = createWebProjectService(store, {
      objectStore: createMemoryObjectStore()
    });
    const project = await seedProject(service);
    const owner = ownerApp(service);
    const uploaded = await request(owner, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({ filename: "brief.pdf", mime: "application/pdf", buffer: PDF })
    });
    const { forceProjectCompleted } = require("../lib/webProjects/phase18.fixtures");
    await forceProjectCompleted(store, ORG_A, project.id);
    await service.archiveProject(ORG_A, project.id, 1);
    const rejected = await request(owner, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({ filename: "otro.pdf", mime: "application/pdf", buffer: PDF })
    });
    assert.equal(rejected.status, 409);
    assert.equal(rejected.json.code, "PROJECT_ARCHIVED");
    const downloaded = await request(owner, {
      method: "GET",
      path: `/api/client/web-projects/${project.id}/documents/${uploaded.json.document.id}/content`
    });
    assert.equal(downloaded.status, 200);
  });

  it("11-12 client-supplied object_key and sha256 are rejected", async () => {
    const service = createWebProjectService(createMemoryStore(), {
      objectStore: createMemoryObjectStore()
    });
    const project = await seedProject(service);
    const app = ownerApp(service);
    const jsonPost = await request(app, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      json: {
        originalFilename: "brief.pdf",
        mimeType: "application/pdf",
        objectKey: "org/10/wp/00000000-0000-4000-8000-000000000001",
        sha256: "a".repeat(64)
      }
    });
    assert.equal(jsonPost.status, 400);
    assert.equal(jsonPost.json.code, "DOCUMENT_INVALID");
    const withKey = await request(app, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({
        filename: "brief.pdf",
        mime: "application/pdf",
        buffer: PDF,
        fields: { object_key: "org/20/wp/00000000-0000-4000-8000-000000000001" }
      })
    });
    assert.equal(withKey.status, 400);
    assert.equal(withKey.json.code, "DOCUMENT_INVALID");
    const withHash = await request(app, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({
        filename: "brief.pdf",
        mime: "application/pdf",
        buffer: PDF,
        fields: { sha256: "b".repeat(64) }
      })
    });
    assert.equal(withHash.status, 400);
    assert.equal(withHash.json.code, "DOCUMENT_INVALID");
  });

  it("14-18 reject oversize, empty, forbidden, MIME mismatch and traversal filename", async () => {
    const service = createWebProjectService(createMemoryStore(), {
      objectStore: createMemoryObjectStore()
    });
    const project = await seedProject(service);
    const app = ownerApp(service);
    const oversize = await request(app, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({
        filename: "huge.pdf",
        mime: "application/pdf",
        buffer: Buffer.alloc(21 * 1024 * 1024, 1)
      })
    });
    assert.equal(oversize.status, 400);
    assert.equal(oversize.json.code, "DOCUMENT_INVALID");
    const empty = await request(app, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({
        filename: "empty.pdf",
        mime: "application/pdf",
        buffer: Buffer.alloc(0)
      })
    });
    assert.equal(empty.status, 400);
    const exe = await request(app, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({
        filename: "malware.exe",
        mime: "application/pdf",
        buffer: PDF
      })
    });
    assert.equal(exe.status, 400);
    const mismatch = await request(app, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({
        filename: "fake.pdf",
        mime: "application/pdf",
        buffer: Buffer.from("not a pdf")
      })
    });
    assert.equal(mismatch.status, 400);
    const traversal = await request(app, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({
        filename: "report..hidden.pdf",
        mime: "application/pdf",
        buffer: PDF
      })
    });
    if (traversal.status === 201) {
      assert.doesNotMatch(String(traversal.json.document.originalFilename), /\.\.|[\/\\]/);
    } else {
      assert.equal(traversal.status, 400);
      assert.equal(traversal.json.code, "DOCUMENT_INVALID");
    }
  });

  it("19 object store down returns 503 STORAGE_UNAVAILABLE", async () => {
    const objectStore = createMemoryObjectStore();
    objectStore.state.failPut = true;
    const service = createWebProjectService(createMemoryStore(), { objectStore });
    const project = await seedProject(service);
    const res = await request(ownerApp(service), {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({ filename: "brief.pdf", mime: "application/pdf", buffer: PDF })
    });
    assert.equal(res.status, 503);
    assert.equal(res.json.code, "STORAGE_UNAVAILABLE");
  });

  it("22 download missing object fails safely without a filesystem path", async () => {
    const objectStore = createMemoryObjectStore();
    const service = createWebProjectService(createMemoryStore(), { objectStore });
    const project = await seedProject(service);
    const app = ownerApp(service);
    const uploaded = await request(app, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({ filename: "brief.pdf", mime: "application/pdf", buffer: PDF })
    });
    objectStore.objects.clear();
    const res = await request(app, {
      method: "GET",
      path: `/api/client/web-projects/${project.id}/documents/${uploaded.json.document.id}/content`
    });
    assert.ok(res.status === 404 || res.status === 503);
    assert.doesNotMatch(JSON.stringify(res.json || {}), /\/tmp|frontend\/public|evidence/);
  });

  it("23 there is no GET-by-object-key authorization path", async () => {
    const service = createWebProjectService(createMemoryStore(), {
      objectStore: createMemoryObjectStore()
    });
    const project = await seedProject(service);
    const app = ownerApp(service);
    const uploaded = await request(app, {
      method: "POST",
      path: `/api/client/web-projects/${project.id}/documents`,
      multipart: buildMultipart({ filename: "brief.pdf", mime: "application/pdf", buffer: PDF })
    });
    const byKey = await request(app, {
      method: "GET",
      path: `/api/client/objects/${encodeURIComponent(uploaded.json.document.objectKey)}`
    });
    assert.equal(byKey.status, 404);
  });
});
