/**
 * Phase 5 — NOC role gate tests (no DB required for 401/403).
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const express = require("express");
const requireNocAccess = require("../middleware/requireNocAccess");

function startApp(role) {
  const app = express();
  app.use((req, _res, next) => {
    if (role === null) {
      return next(); // no user → simulate missing auth handled upstream
    }
    req.user = { id: 1, role, email: "t@argos.test" };
    next();
  });
  app.use("/api/noc", (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Token requerido" });
    }
    next();
  });
  app.use("/api/noc", requireNocAccess, (_req, res) => {
    res.json({ ok: true });
  });
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
  });
}

async function get(port, path) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

describe("requireNocAccess", () => {
  it("unauthenticated → 401", async () => {
    const { server, port } = await startApp(null);
    try {
      const r = await get(port, "/api/noc/anything");
      assert.equal(r.status, 401);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("cliente → 403 NOC_FORBIDDEN", async () => {
    const { server, port } = await startApp("cliente");
    try {
      const r = await get(port, "/api/noc/anything");
      assert.equal(r.status, 403);
      assert.equal(r.body.code, "NOC_FORBIDDEN");
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("org_admin is NOT global NOC", async () => {
    const { server, port } = await startApp("org_admin");
    try {
      const r = await get(port, "/api/noc/anything");
      assert.equal(r.status, 403);
      assert.equal(r.body.code, "NOC_FORBIDDEN");
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("admin → allowed", async () => {
    const { server, port } = await startApp("admin");
    try {
      const r = await get(port, "/api/noc/anything");
      assert.equal(r.status, 200);
      assert.equal(r.body.ok, true);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("super_admin → allowed", async () => {
    const { server, port } = await startApp("super_admin");
    try {
      const r = await get(port, "/api/noc/anything");
      assert.equal(r.status, 200);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
