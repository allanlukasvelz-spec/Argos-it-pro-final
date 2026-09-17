const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const createNocWebProjectsRouter = require("./nocWebProjects");
const requireNocAccess = require("../middleware/requireNocAccess");
const { createMemoryStore } = require("../lib/webProjects/memoryStore");
const { createMemoryObjectStore } = require("../lib/webProjects/memoryObjectStore");
const { createWebProjectService } = require("../lib/webProjects/service");

const ORG_A = 10;
const ORG_B = 20;
const PDF = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.from("1 0 obj<<>>endobj\n%%EOF\n")]);

function createNocApp(service, user = { id: 99, role: "admin" }) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = user;
    next();
  });
  app.use("/api/noc", requireNocAccess, createNocWebProjectsRouter(null, { service }));
  return app;
}

function buildMultipart({ filename, mime, buffer, fields = {} }) {
  const boundary = "----ArgosWpNocBoundary7MA4YWxkTrZu0gW";
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

function request(app, { method, path, json, multipart }) {
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
            ...(payload ? { "content-length": String(payload.length) } : {})
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
            resolve({ status: res.statusCode, headers: res.headers, buffer, json: parsed });
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

describe("NOC web projects binary storage", () => {
  it("10 wrong organization_id + valid IDs returns 404", async () => {
    const service = createWebProjectService(createMemoryStore(), {
      objectStore: createMemoryObjectStore()
    });
    const project = await service.createProject({
      organizationId: ORG_A,
      actorUserId: 99,
      title: "A",
      projectType: "create"
    });
    const app = createNocApp(service);
    const uploaded = await request(app, {
      method: "POST",
      path: `/api/noc/web-projects/${project.id}/documents?organization_id=${ORG_A}`,
      multipart: buildMultipart({ filename: "brief.pdf", mime: "application/pdf", buffer: PDF })
    });
    assert.equal(uploaded.status, 201);
    const meta = await request(app, {
      method: "GET",
      path: `/api/noc/web-projects/${project.id}/documents?organization_id=${ORG_B}`
    });
    assert.equal(meta.status, 404);
    const content = await request(app, {
      method: "GET",
      path: `/api/noc/web-projects/${project.id}/documents/${uploaded.json.document.id}/content?organization_id=${ORG_B}`
    });
    assert.equal(content.status, 404);
    const own = await request(app, {
      method: "GET",
      path: `/api/noc/web-projects/${project.id}/documents/${uploaded.json.document.id}/content?organization_id=${ORG_A}`
    });
    assert.equal(own.status, 200);
    assert.equal(own.headers["cache-control"], "private, no-store");
    assert.equal(own.headers["x-content-type-options"], "nosniff");
    assert.match(String(own.headers["content-disposition"]), /^attachment;/);
  });

  it("NOC upload requires explicit organization_id and does not infer tenant from document id", async () => {
    const service = createWebProjectService(createMemoryStore(), {
      objectStore: createMemoryObjectStore()
    });
    const project = await service.createProject({
      organizationId: ORG_A,
      actorUserId: 99,
      title: "A",
      projectType: "create"
    });
    const app = createNocApp(service);
    const missing = await request(app, {
      method: "POST",
      path: `/api/noc/web-projects/${project.id}/documents`,
      multipart: buildMultipart({ filename: "brief.pdf", mime: "application/pdf", buffer: PDF })
    });
    assert.equal(missing.status, 400);
    assert.equal(missing.json.code, "TENANT_REQUIRED");
  });
});
