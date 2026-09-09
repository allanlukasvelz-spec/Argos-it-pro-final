const { afterEach, describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");

const dbPath = require.resolve("../db");
const routePath = require.resolve("./clientDiagnostics");
const originalDbCache = require.cache[dbPath];

afterEach(() => {
  delete require.cache[routePath];
  if (originalDbCache) {
    require.cache[dbPath] = originalDbCache;
  } else {
    delete require.cache[dbPath];
  }
});

function loadRouterWithPool(pool) {
  delete require.cache[routePath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: pool
  };
  return require("./clientDiagnostics");
}

function buildCompleteDiagnosticPayload() {
  return {
    source: "diagnostico-argos",
    score: 8,
    maxScore: 24,
    riskLevel: "medium",
    riskLabel: "Riesgo medio",
    summary: "Resumen operativo del diagnostico.",
    strengths: ["Backups revisados"],
    risksDetected: ["Accesos pendientes de revisar"],
    priorities: ["Revisar accesos administrativos"],
    answers: Array.from({ length: 12 }, (_, index) => ({
      questionId: `q-${index + 1}`,
      question: `Pregunta ${index + 1}`,
      answerLabel: "Parcialmente / No estoy seguro",
      riskPoints: index % 3
    }))
  };
}

async function postJson(app, path, body) {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return {
      status: response.status,
      body: await response.json()
    };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe("client diagnostics routes", () => {
  it("stores a complete diagnostic using the authenticated user and maxScore", async () => {
    const calls = [];
    const pool = {
      async query(sql, params) {
        calls.push({ sql, params });
        if (String(sql).includes("INSERT INTO client_diagnostics")) {
          return { rows: [{ id: 73, created_at: "2026-09-09T12:00:00.000Z" }] };
        }
        if (String(sql).includes("INSERT INTO activity_logs")) {
          return { rows: [] };
        }
        throw new Error(`Unexpected SQL in test: ${sql}`);
      }
    };

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: 42 };
      next();
    });
    app.use(loadRouterWithPool(pool));

    const result = await postJson(app, "/diagnostics", buildCompleteDiagnosticPayload());

    assert.equal(result.status, 201);
    assert.equal(result.body.diagnostic.userId, "42");
    assert.equal(result.body.diagnostic.maxScore, 24);
    assert.equal(result.body.diagnostic.answers.length, 12);

    const insert = calls.find((call) => String(call.sql).includes("INSERT INTO client_diagnostics"));
    assert.ok(insert, "diagnostic insert should run");
    assert.equal(insert.params[0], 42);
    assert.equal(insert.params[3], 24);
    assert.equal(insert.params[8], JSON.stringify(["Accesos pendientes de revisar"]));
  });
});
