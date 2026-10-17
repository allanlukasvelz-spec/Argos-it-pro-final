/**
 * Phase 6 — NOC remediation routes require requireNocAccess.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const http = require("http");
const requireNocAccess = require("../middleware/requireNocAccess");
const createNocRemediationRouter = require("../routes/nocRemediation");

function makeApp(role) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (role === null) return next();
    req.user = { id: 1, role, email: "t@test" };
    next();
  });
  const fakePool = {
    async query() {
      return { rows: [] };
    },
    async connect() {
      return {
        async query() {
          return { rows: [] };
        },
        release() {}
      };
    }
  };
  app.use("/api/noc", (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "unauthorized" });
    next();
  }, requireNocAccess, createNocRemediationRouter(fakePool));
  return app;
}

function request(app, method, path, body) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, async () => {
      const { port } = server.address();
      try {
        const res = await fetch(`http://127.0.0.1:${port}${path}`, {
          method,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined
        });
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          json = text;
        }
        resolve({ status: res.status, json });
      } catch (e) {
        reject(e);
      } finally {
        server.close();
      }
    });
  });
}

describe("NOC remediation auth gate", () => {
  it("unauthenticated → 401", async () => {
    const app = makeApp(null);
    const res = await request(app, "GET", "/api/noc/runbooks");
    assert.equal(res.status, 401);
  });

  it("cliente → 403", async () => {
    const app = makeApp("cliente");
    const res = await request(app, "GET", "/api/noc/runbooks");
    assert.equal(res.status, 403);
    assert.equal(res.json.code, "NOC_FORBIDDEN");
  });

  it("org_admin → 403", async () => {
    const app = makeApp("org_admin");
    const res = await request(app, "POST", "/api/noc/remediations/execute", { approved: true });
    assert.equal(res.status, 403);
  });

  it("admin can list actions", async () => {
    const app = makeApp("admin");
    const res = await request(app, "GET", "/api/noc/actions");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.json.actions));
  });

  it("rejects approved=true spoof on execute", async () => {
    const app = makeApp("admin");
    // Will 400 on spoof before needing DB row
    const res = await request(app, "POST", "/api/noc/remediations/1/execute", { approved: true });
    assert.equal(res.status, 400);
    assert.equal(res.json.code, "APPROVAL_SPOOF");
  });
});
