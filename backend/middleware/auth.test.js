/**
 * Cookie-only REST auth + CSRF Origin guard (FASE 20.6B).
 * Run: node --test backend/middleware/auth.test.js
 */
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "test-jwt-secret-at-least-32-characters-long";
const PREV_SECRET = process.env.JWT_SECRET;

before(() => {
  process.env.JWT_SECRET = JWT_SECRET;
});

after(() => {
  if (PREV_SECRET === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = PREV_SECRET;
  }
});

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe("auth middleware — cookie-only REST", () => {
  const auth = require("./auth");

  it("accepts valid argos_access cookie", () => {
    const token = jwt.sign({ id: 1, email: "a@b.co", role: "cliente" }, JWT_SECRET, {
      expiresIn: "1h",
    });
    const req = { cookies: { argos_access: token }, headers: {} };
    const res = mockRes();
    let nextCalled = false;
    auth(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(req.user.id, 1);
    assert.equal(res.statusCode, 200);
  });

  it("rejects missing cookie with 401 even if Bearer is present", () => {
    const token = jwt.sign({ id: 2, email: "b@b.co", role: "cliente" }, JWT_SECRET, {
      expiresIn: "1h",
    });
    const req = {
      cookies: {},
      headers: { authorization: `Bearer ${token}` },
    };
    const res = mockRes();
    let nextCalled = false;
    auth(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, "Token requerido");
  });

  it("rejects Bearer-only Authorization without cookie", () => {
    const req = {
      cookies: {},
      headers: { authorization: "Bearer not-a-real-token" },
    };
    const res = mockRes();
    auth(req, res, () => {
      assert.fail("next should not run");
    });
    assert.equal(res.statusCode, 401);
  });

  it("rejects invalid cookie token", () => {
    const req = { cookies: { argos_access: "bad.token.value" }, headers: {} };
    const res = mockRes();
    auth(req, res, () => {
      assert.fail("next should not run");
    });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, "Token inválido o expirado");
  });
});

describe("csrfOriginGuard — cookie session mutations", () => {
  const csrfOriginGuard = require("./csrfOrigin");
  const guard = csrfOriginGuard(["http://localhost:3000"]);

  it("allows GET without Origin", () => {
    const req = { method: "GET", cookies: { argos_access: "x" }, headers: {} };
    const res = mockRes();
    let nextCalled = false;
    guard(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  });

  it("allows mutating request without cookies (no CSRF check)", () => {
    const req = { method: "POST", cookies: {}, headers: {} };
    const res = mockRes();
    let nextCalled = false;
    guard(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  });

  it("rejects cookie-authenticated POST without Origin", () => {
    const req = {
      method: "POST",
      cookies: { argos_access: "x" },
      headers: {},
    };
    const res = mockRes();
    guard(req, res, () => {
      assert.fail("next should not run");
    });
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, "Origen no permitido");
  });

  it("rejects cookie-authenticated POST with disallowed Origin", () => {
    const req = {
      method: "POST",
      cookies: { argos_refresh: "y" },
      headers: { origin: "https://evil.example" },
    };
    const res = mockRes();
    guard(req, res, () => {
      assert.fail("next should not run");
    });
    assert.equal(res.statusCode, 403);
  });

  it("allows cookie-authenticated POST with allowed Origin", () => {
    const req = {
      method: "POST",
      cookies: { argos_access: "x" },
      headers: { origin: "http://localhost:3000" },
    };
    const res = mockRes();
    let nextCalled = false;
    guard(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
  });
});
